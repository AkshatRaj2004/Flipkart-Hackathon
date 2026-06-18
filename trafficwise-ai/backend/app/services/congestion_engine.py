"""Congestion Prediction Engine - weighted risk scoring model."""

from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import TrafficEvent

CAUSE_WEIGHTS = {
    "accident": 0.92,
    "construction": 0.78,
    "protest": 0.85,
    "procession": 0.80,
    "public_event": 0.75,
    "vehicle_breakdown": 0.55,
    "tree_fall": 0.65,
    "congestion": 0.70,
    "debris": 0.60,
    "Debris": 0.60,
    "pot_holes": 0.50,
    "road_conditions": 0.55,
    "Fog / Low Visibility": 0.72,
    "others": 0.40,
    "test_demo": 0.20,
}

PRIORITY_MULTIPLIER = {"High": 1.4, "Low": 1.0}

RISK_CATEGORIES = [
    (80, "Critical"),
    (60, "High"),
    (40, "Moderate"),
    (20, "Low"),
    (0, "Minimal"),
]


def get_time_factor(hour: int) -> float:
    if 8 <= hour <= 10 or 17 <= hour <= 20:
        return 1.35
    if 11 <= hour <= 16:
        return 1.15
    if 22 <= hour or hour <= 5:
        return 0.75
    return 1.0


def get_zone_congestion_rate(db: Session, zone: str) -> float:
    if not zone:
        return 0.5
    total = db.query(func.count(TrafficEvent.id)).filter(TrafficEvent.zone == zone).scalar() or 1
    high = (
        db.query(func.count(TrafficEvent.id))
        .filter(TrafficEvent.zone == zone, TrafficEvent.priority == "High")
        .scalar()
        or 0
    )
    closures = (
        db.query(func.count(TrafficEvent.id))
        .filter(TrafficEvent.zone == zone, TrafficEvent.requires_road_closure == True)
        .scalar()
        or 0
    )
    return min(1.0, (high / total) * 0.6 + (closures / total) * 0.4 + 0.2)


def predict_congestion(
    db: Session,
    event_type: str,
    event_cause: str,
    zone: str,
    junction: Optional[str],
    priority: str,
    requires_road_closure: bool,
    duration_hours: float,
    reference_time: Optional[datetime] = None,
) -> dict:
    ref = reference_time or datetime.utcnow()
    cause_key = event_cause.lower().strip()
    cause_weight = CAUSE_WEIGHTS.get(event_cause, CAUSE_WEIGHTS.get(cause_key, 0.45))
    priority_mult = PRIORITY_MULTIPLIER.get(priority, 1.0)
    zone_rate = get_zone_congestion_rate(db, zone)

    base_score = cause_weight * 55 * priority_mult
    base_score += zone_rate * 20
    base_score += get_time_factor(ref.hour) * 8

    if requires_road_closure:
        base_score += 18
    if event_type == "planned":
        base_score *= 0.85
    else:
        base_score *= 1.1

    duration_factor = min(1.5, 0.8 + duration_hours * 0.1)
    base_score *= duration_factor

    if junction:
        jcount = (
            db.query(func.count(TrafficEvent.id))
            .filter(TrafficEvent.junction == junction)
            .scalar()
            or 0
        )
        if jcount > 20:
            base_score += 8

    score = min(100, max(5, round(base_score, 1)))
    category = next(cat for threshold, cat in RISK_CATEGORIES if score >= threshold)

    delay = round(score * 0.45 + duration_hours * 8 + (15 if requires_road_closure else 0), 1)
    impact_radius = round(0.3 + score / 100 * 2.5 + (0.5 if requires_road_closure else 0), 2)

    severity_map = {"Critical": "Severe", "High": "Major", "Moderate": "Moderate", "Low": "Minor", "Minimal": "Negligible"}
    confidence = min(95, 65 + zone_rate * 20 + (10 if junction else 0))

    reasoning = [
        f"Event cause '{event_cause}' has historical weight {cause_weight:.2f}",
        f"Zone '{zone}' congestion rate: {zone_rate:.0%}",
        f"Priority '{priority}' multiplier: {priority_mult}x",
        f"Time-of-day factor at hour {ref.hour}: {get_time_factor(ref.hour):.2f}x",
    ]
    if requires_road_closure:
        reasoning.append("Road closure requirement adds +18 risk points")
    reasoning.append(f"Duration of {duration_hours}h amplifies impact by {duration_factor:.2f}x")

    return {
        "congestion_risk_score": score,
        "risk_category": category,
        "estimated_delay_minutes": delay,
        "traffic_severity": severity_map[category],
        "impact_radius_km": impact_radius,
        "confidence_score": round(confidence, 1),
        "reasoning": reasoning,
    }


def compute_event_risk(event: TrafficEvent) -> float:
    cause_weight = CAUSE_WEIGHTS.get(event.event_cause, CAUSE_WEIGHTS.get((event.event_cause or "").lower(), 0.45))
    mult = PRIORITY_MULTIPLIER.get(event.priority, 1.0)
    score = cause_weight * 50 * mult
    if event.requires_road_closure:
        score += 15
    if event.status == "active":
        score += 10
    return min(100, round(score, 1))
