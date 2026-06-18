from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from app.database import get_db
from app.models import TrafficEvent
from app.schemas import (
    KPISummary, DistributionItem, ZoneIncident, CorridorImpact,
    JunctionRisk, StationWorkload, TrendItem, TimelineItem,
)
from app.services.congestion_engine import compute_event_risk, get_zone_congestion_rate

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/kpi-summary", response_model=KPISummary)
def kpi_summary(db: Session = Depends(get_db)):
    total = db.query(TrafficEvent).count()
    active = db.query(TrafficEvent).filter(TrafficEvent.status == "active").count()
    planned = db.query(TrafficEvent).filter(TrafficEvent.event_type == "planned").count()
    unplanned = db.query(TrafficEvent).filter(TrafficEvent.event_type == "unplanned").count()
    high = db.query(TrafficEvent).filter(TrafficEvent.priority == "High").count()
    closures = db.query(TrafficEvent).filter(TrafficEvent.requires_road_closure == True).count()

    active_events = db.query(TrafficEvent).filter(TrafficEvent.status == "active").limit(200).all()
    if active_events:
        avg_risk = sum(compute_event_risk(e) for e in active_events) / len(active_events)
    else:
        sample = db.query(TrafficEvent).limit(500).all()
        avg_risk = sum(compute_event_risk(e) for e in sample) / max(len(sample), 1)

    city_impact = min(100, (active / max(total, 1)) * 200 + avg_risk * 0.4 + (closures / max(total, 1)) * 100)
    severity = min(100, avg_risk * 0.7 + (high / max(total, 1)) * 80)

    return KPISummary(
        total_events=total,
        active_events=active,
        planned_events=planned,
        unplanned_events=unplanned,
        high_priority_events=high,
        road_closures=closures,
        avg_congestion_risk=round(avg_risk, 1),
        city_impact_score=round(city_impact, 1),
        traffic_severity_index=round(severity, 1),
    )


@router.get("/event-type-distribution")
def event_type_distribution(db: Session = Depends(get_db)):
    rows = db.query(TrafficEvent.event_type, func.count(TrafficEvent.id)).group_by(TrafficEvent.event_type).all()
    total = sum(r[1] for r in rows) or 1
    return [DistributionItem(name=r[0], value=r[1], percentage=round(r[1] / total * 100, 1)) for r in rows]


@router.get("/cause-analysis")
def cause_analysis(db: Session = Depends(get_db)):
    rows = (
        db.query(TrafficEvent.event_cause, func.count(TrafficEvent.id))
        .group_by(TrafficEvent.event_cause)
        .order_by(func.count(TrafficEvent.id).desc())
        .all()
    )
    total = sum(r[1] for r in rows) or 1
    return [DistributionItem(name=r[0] or "unknown", value=r[1], percentage=round(r[1] / total * 100, 1)) for r in rows]


@router.get("/priority-distribution")
def priority_distribution(db: Session = Depends(get_db)):
    rows = db.query(TrafficEvent.priority, func.count(TrafficEvent.id)).group_by(TrafficEvent.priority).all()
    total = sum(r[1] for r in rows) or 1
    return [DistributionItem(name=r[0], value=r[1], percentage=round(r[1] / total * 100, 1)) for r in rows]


@router.get("/status-distribution")
def status_distribution(db: Session = Depends(get_db)):
    rows = db.query(TrafficEvent.status, func.count(TrafficEvent.id)).group_by(TrafficEvent.status).all()
    total = sum(r[1] for r in rows) or 1
    return [DistributionItem(name=r[0], value=r[1], percentage=round(r[1] / total * 100, 1)) for r in rows]


@router.get("/zone-incidents")
def zone_incidents(db: Session = Depends(get_db)):
    zones = db.query(TrafficEvent.zone).filter(TrafficEvent.zone.isnot(None)).distinct().all()
    results = []
    for (zone,) in zones:
        count = db.query(TrafficEvent).filter(TrafficEvent.zone == zone).count()
        high = db.query(TrafficEvent).filter(TrafficEvent.zone == zone, TrafficEvent.priority == "High").count()
        closures = db.query(TrafficEvent).filter(TrafficEvent.zone == zone, TrafficEvent.requires_road_closure == True).count()
        results.append(ZoneIncident(
            zone=zone, count=count, high_priority=high, road_closures=closures,
            avg_risk=round(get_zone_congestion_rate(db, zone) * 100, 1),
        ))
    results.sort(key=lambda x: x.count, reverse=True)
    return results


@router.get("/corridor-impact")
def corridor_impact(db: Session = Depends(get_db)):
    rows = (
        db.query(TrafficEvent.corridor, func.count(TrafficEvent.id))
        .filter(TrafficEvent.corridor.isnot(None))
        .group_by(TrafficEvent.corridor)
        .order_by(func.count(TrafficEvent.id).desc())
        .all()
    )
    results = []
    for corridor, count in rows:
        high = db.query(TrafficEvent).filter(TrafficEvent.corridor == corridor, TrafficEvent.priority == "High").count()
        impact = min(100, count * 0.5 + high * 2)
        results.append(CorridorImpact(
            corridor=corridor, count=count, avg_duration_hours=2.5, impact_score=round(impact, 1),
        ))
    return results


@router.get("/junction-risk")
def junction_risk(db: Session = Depends(get_db)):
    rows = (
        db.query(TrafficEvent.junction, TrafficEvent.zone, func.count(TrafficEvent.id))
        .filter(TrafficEvent.junction.isnot(None))
        .group_by(TrafficEvent.junction, TrafficEvent.zone)
        .order_by(func.count(TrafficEvent.id).desc())
        .limit(20)
        .all()
    )
    results = []
    for junction, zone, count in rows:
        high = db.query(TrafficEvent).filter(TrafficEvent.junction == junction, TrafficEvent.priority == "High").count()
        risk = min(100, count * 1.2 + high * 3)
        results.append(JunctionRisk(
            junction=junction, zone=zone, count=count, risk_score=round(risk, 1), high_priority_count=high,
        ))
    return results


@router.get("/station-workload")
def station_workload(db: Session = Depends(get_db)):
    rows = (
        db.query(TrafficEvent.police_station, func.count(TrafficEvent.id))
        .filter(TrafficEvent.police_station.isnot(None))
        .group_by(TrafficEvent.police_station)
        .order_by(func.count(TrafficEvent.id).desc())
        .all()
    )
    results = []
    for station, count in rows:
        active = db.query(TrafficEvent).filter(TrafficEvent.police_station == station, TrafficEvent.status == "active").count()
        high = db.query(TrafficEvent).filter(TrafficEvent.police_station == station, TrafficEvent.priority == "High").count()
        workload = min(100, count * 0.3 + active * 10 + high * 2)
        results.append(StationWorkload(
            police_station=station, total_events=count, active_events=active,
            high_priority=high, workload_score=round(workload, 1),
        ))
    return results


@router.get("/hourly-trends")
def hourly_trends(db: Session = Depends(get_db)):
    rows = (
        db.query(extract("hour", TrafficEvent.start_datetime).label("hour"), func.count(TrafficEvent.id))
        .filter(TrafficEvent.start_datetime.isnot(None))
        .group_by("hour")
        .order_by("hour")
        .all()
    )
    return [TrendItem(period=f"{int(h):02d}:00", count=c) for h, c in rows if h is not None]


@router.get("/incident-trends")
def incident_trends(db: Session = Depends(get_db)):
    rows = (
        db.query(
            func.date_trunc("month", TrafficEvent.start_datetime).label("month"),
            func.count(TrafficEvent.id),
        )
        .filter(TrafficEvent.start_datetime.isnot(None))
        .group_by("month")
        .order_by("month")
        .limit(24)
        .all()
    )
    return [TrendItem(period=str(m)[:7] if m else "unknown", count=c) for m, c in rows]


@router.get("/timeline")
def timeline(db: Session = Depends(get_db), limit: int = 50):
    events = db.query(TrafficEvent).order_by(TrafficEvent.start_datetime.desc()).limit(limit).all()
    return [
        TimelineItem(
            id=e.id, event_type=e.event_type, event_cause=e.event_cause,
            zone=e.zone, junction=e.junction, priority=e.priority,
            status=e.status, start_datetime=e.start_datetime,
            requires_road_closure=e.requires_road_closure,
        )
        for e in events
    ]


@router.get("/live-feed")
def live_feed(db: Session = Depends(get_db), limit: int = 20):
    events = (
        db.query(TrafficEvent)
        .filter(TrafficEvent.status.in_(["active", "resolved"]))
        .order_by(TrafficEvent.start_datetime.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "event_cause": e.event_cause,
            "zone": e.zone,
            "junction": e.junction,
            "priority": e.priority,
            "status": e.status,
            "start_datetime": e.start_datetime,
            "requires_road_closure": e.requires_road_closure,
            "risk_score": compute_event_risk(e),
        }
        for e in events
    ]


@router.get("/map-events")
def map_events(db: Session = Depends(get_db), limit: int = 2000):
    events = db.query(TrafficEvent).filter(
        TrafficEvent.latitude != 0, TrafficEvent.longitude != 0
    ).limit(limit).all()
    return [
        {
            "id": e.id,
            "lat": e.latitude,
            "lng": e.longitude,
            "event_type": e.event_type,
            "event_cause": e.event_cause,
            "priority": e.priority,
            "status": e.status,
            "zone": e.zone,
            "junction": e.junction,
            "requires_road_closure": e.requires_road_closure,
            "corridor": e.corridor,
        }
        for e in events
    ]
