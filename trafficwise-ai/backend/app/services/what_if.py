"""What-If Traffic Simulator."""

from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import TrafficEvent
from app.services.congestion_engine import predict_congestion
from app.services.resource_optimizer import optimize_resources, DIVERSION_MAP

SCENARIO_CAUSE_MAP = {
    "New Event": "others",
    "Rally": "procession",
    "Festival": "public_event",
    "Accident": "accident",
    "Construction": "construction",
    "VIP Movement": "public_event",
}


def simulate_scenario(
    db: Session,
    scenario_type: str,
    event_cause: str,
    zone: str,
    junction: str = None,
    priority: str = "High",
    requires_road_closure: bool = False,
    duration_hours: float = 3.0,
    corridor: str = None,
) -> dict:
    cause = SCENARIO_CAUSE_MAP.get(scenario_type, event_cause)
    corridor = corridor or "Non-corridor"

    forecast = predict_congestion(
        db, "planned" if scenario_type in ("Festival", "Rally", "VIP Movement") else "unplanned",
        cause, zone, junction, priority, requires_road_closure, duration_hours,
    )

    active_in_zone = (
        db.query(TrafficEvent)
        .filter(TrafficEvent.zone == zone, TrafficEvent.status == "active")
        .count()
    )
    compounded = min(100, forecast["congestion_risk_score"] + active_in_zone * 5)

    spread = []
    for i, radius in enumerate([0.5, 1.0, 1.5, 2.0]):
        risk_at_radius = max(10, compounded - i * 12)
        spread.append({
            "radius_km": radius,
            "congestion_level": round(risk_at_radius, 1),
            "affected_junctions_estimate": max(1, int(risk_at_radius / 15)),
        })

    resources = optimize_resources(
        db, zone=zone, event_cause=cause, priority=priority,
        requires_road_closure=requires_road_closure, junction=junction, corridor=corridor,
    )

    diversions = DIVERSION_MAP.get(corridor, DIVERSION_MAP["Non-corridor"])
    impact_zones = [zone]
    adjacent = db.query(TrafficEvent.zone, func.count(TrafficEvent.id)).filter(
        TrafficEvent.corridor == corridor, TrafficEvent.zone.isnot(None)
    ).group_by(TrafficEvent.zone).order_by(func.count(TrafficEvent.id).desc()).limit(3).all()
    for z, _ in adjacent:
        if z and z != zone:
            impact_zones.append(z)

    reasoning = [
        f"Simulated '{scenario_type}' scenario in {zone}",
        f"Base forecast risk: {forecast['congestion_risk_score']}",
        f"{active_in_zone} active events in zone compound risk to {compounded}",
        f"Impact propagates across {len(impact_zones)} zones via corridor {corridor}",
    ]

    return {
        "scenario_type": scenario_type,
        "predicted_congestion_spread": spread,
        "delay_forecast_minutes": forecast["estimated_delay_minutes"] * (1 + active_in_zone * 0.1),
        "resource_requirements": {
            "traffic_police": resources["traffic_police_required"],
            "barricades": resources["barricades_required"],
            "diversion_routes": len(resources["diversion_routes"]),
        },
        "recommended_diversions": diversions,
        "expected_impact_zones": impact_zones,
        "compounded_risk_score": round(compounded, 1),
        "reasoning": reasoning,
    }
