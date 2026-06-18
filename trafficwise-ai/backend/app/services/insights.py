"""Smart Insights Engine."""

from datetime import datetime
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models import TrafficEvent
from app.services.congestion_engine import get_zone_congestion_rate, compute_event_risk
from app.schemas import InsightItem


def generate_insights(db: Session) -> List[InsightItem]:
    insights: List[InsightItem] = []

    zones = (
        db.query(TrafficEvent.zone, func.count(TrafficEvent.id))
        .filter(TrafficEvent.zone.isnot(None))
        .group_by(TrafficEvent.zone)
        .order_by(func.count(TrafficEvent.id).desc())
        .limit(3)
        .all()
    )
    for z, count in zones:
        rate = get_zone_congestion_rate(db, z)
        insights.append(InsightItem(
            category="Congestion",
            title=f"High Activity: {z}",
            description=f"{z} recorded {count} incidents with {rate:.0%} congestion risk index.",
            metric=str(count),
            trend="rising" if rate > 0.6 else "stable",
        ))

    junctions = (
        db.query(TrafficEvent.junction, func.count(TrafficEvent.id))
        .filter(TrafficEvent.junction.isnot(None))
        .group_by(TrafficEvent.junction)
        .order_by(func.count(TrafficEvent.id).desc())
        .limit(3)
        .all()
    )
    for j, count in junctions:
        insights.append(InsightItem(
            category="Junction Risk",
            title=f"Hotspot: {j}",
            description=f"Junction has {count} historical incidents - recommend enhanced monitoring.",
            metric=str(count),
            trend="high",
        ))

    causes = (
        db.query(TrafficEvent.event_cause, func.count(TrafficEvent.id))
        .group_by(TrafficEvent.event_cause)
        .order_by(func.count(TrafficEvent.id).desc())
        .limit(3)
        .all()
    )
    for c, count in causes:
        insights.append(InsightItem(
            category="Event Causes",
            title=c.replace("_", " ").title(),
            description=f"Most frequent cause with {count} occurrences across Bengaluru.",
            metric=str(count),
        ))

    hourly = (
        db.query(extract("hour", TrafficEvent.start_datetime).label("hour"), func.count(TrafficEvent.id))
        .filter(TrafficEvent.start_datetime.isnot(None))
        .group_by("hour")
        .order_by(func.count(TrafficEvent.id).desc())
        .limit(2)
        .all()
    )
    for h, count in hourly:
        insights.append(InsightItem(
            category="Peak Periods",
            title=f"Peak Hour: {int(h):02d}:00",
            description=f"{count} incidents historically occur around this hour.",
            metric=str(count),
            trend="peak",
        ))

    closures = db.query(TrafficEvent).filter(TrafficEvent.requires_road_closure == True).count()
    total = db.query(TrafficEvent).count()
    insights.append(InsightItem(
        category="Road Closures",
        title="Closure Impact Analysis",
        description=f"{closures} events ({closures/total*100:.1f}%) required road closures, significantly amplifying city-wide delay.",
        metric=str(closures),
        trend="impactful",
    ))

    emerging = (
        db.query(TrafficEvent.zone, func.count(TrafficEvent.id))
        .filter(TrafficEvent.status == "active", TrafficEvent.zone.isnot(None))
        .group_by(TrafficEvent.zone)
        .order_by(func.count(TrafficEvent.id).desc())
        .limit(2)
        .all()
    )
    for z, count in emerging:
        if count > 0:
            insights.append(InsightItem(
                category="Emerging Risk",
                title=f"Active Surge: {z}",
                description=f"{count} currently active events - monitor for escalation.",
                metric=str(count),
                trend="emerging",
            ))

    stations = (
        db.query(TrafficEvent.police_station, func.count(TrafficEvent.id))
        .filter(TrafficEvent.police_station.isnot(None))
        .group_by(TrafficEvent.police_station)
        .order_by(func.count(TrafficEvent.id).desc())
        .limit(2)
        .all()
    )
    for s, count in stations:
        active = db.query(TrafficEvent).filter(
            TrafficEvent.police_station == s, TrafficEvent.status == "active"
        ).count()
        insights.append(InsightItem(
            category="Resource Utilization",
            title=f"Station: {s}",
            description=f"Handled {count} events total, {active} currently active.",
            metric=f"{active}/{count}",
            trend="utilized" if active > 2 else "normal",
        ))

    return insights
