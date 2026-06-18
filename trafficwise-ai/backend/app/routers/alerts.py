from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import TrafficEvent
from app.schemas import AlertItem
from app.services.congestion_engine import compute_event_risk, get_zone_congestion_rate

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/active-alerts", response_model=list[AlertItem])
def active_alerts(db: Session = Depends(get_db)):
    alerts = []
    counter = 0

    critical_events = (
        db.query(TrafficEvent)
        .filter(TrafficEvent.status == "active", TrafficEvent.priority == "High")
        .order_by(TrafficEvent.start_datetime.desc())
        .limit(10)
        .all()
    )
    for e in critical_events:
        counter += 1
        alerts.append(AlertItem(
            id=f"ALT-{counter:04d}",
            severity="critical",
            title=f"Critical Congestion: {e.event_cause}",
            message=f"High priority {e.event_cause} at {e.junction or e.zone}. Risk score: {compute_event_risk(e)}",
            zone=e.zone,
            recommended_action="Deploy additional traffic police and activate diversion routes immediately.",
            created_at=e.start_datetime or datetime.utcnow(),
        ))

    closures = (
        db.query(TrafficEvent)
        .filter(TrafficEvent.requires_road_closure == True, TrafficEvent.status == "active")
        .limit(5)
        .all()
    )
    for e in closures:
        counter += 1
        alerts.append(AlertItem(
            id=f"ALT-{counter:04d}",
            severity="high",
            title="Road Closure Warning",
            message=f"Road closure required at {e.junction or e.corridor or e.zone}",
            zone=e.zone,
            recommended_action="Issue public advisory and set up barricades at entry points.",
            created_at=e.start_datetime or datetime.utcnow(),
        ))

    zones = db.query(TrafficEvent.zone).filter(
        TrafficEvent.status == "active", TrafficEvent.zone.isnot(None)
    ).distinct().all()
    for (zone,) in zones:
        active_count = db.query(TrafficEvent).filter(
            TrafficEvent.zone == zone, TrafficEvent.status == "active"
        ).count()
        if active_count >= 3:
            counter += 1
            alerts.append(AlertItem(
                id=f"ALT-{counter:04d}",
                severity="medium",
                title=f"Resource Shortage Risk: {zone}",
                message=f"{active_count} simultaneous active events in {zone}",
                zone=zone,
                recommended_action="Reallocate personnel from adjacent zones. Consider mutual aid protocol.",
                created_at=datetime.utcnow(),
            ))

    escalating = (
        db.query(TrafficEvent)
        .filter(TrafficEvent.status == "active", TrafficEvent.event_cause.in_(["accident", "protest", "construction"]))
        .order_by(TrafficEvent.start_datetime.desc())
        .limit(5)
        .all()
    )
    for e in escalating:
        if e.end_datetime is None:
            counter += 1
            alerts.append(AlertItem(
                id=f"ALT-{counter:04d}",
                severity="high",
                title="Escalating Incident",
                message=f"Unresolved {e.event_cause} at {e.junction or e.zone} - duration exceeding normal resolution time",
                zone=e.zone,
                recommended_action="Escalate to zone commander. Consider emergency corridor activation.",
                created_at=e.start_datetime or datetime.utcnow(),
            ))

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    alerts.sort(key=lambda a: severity_order.get(a.severity, 4))
    return alerts[:25]
