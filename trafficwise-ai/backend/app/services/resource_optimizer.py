"""Resource Optimization Engine."""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import TrafficEvent
from app.services.congestion_engine import predict_congestion, CAUSE_WEIGHTS

DIVERSION_MAP = {
    "ORR East 1": ["Inner Ring Road via HSR", "Sarjapur Road bypass", "Bellandur Service Road"],
    "ORR East 2": ["Marathahalli Bridge alternate", "Kadubeesanahalli flyover route"],
    "ORR North 1": ["Hebbal flyover", "Yelahanka Service Road"],
    "ORR North 2": ["Thanisandra Main Road", "Hennur Road diversion"],
    "Hosur Road": ["Bannerghatta Road", "Electronic City Elevated Corridor"],
    "Mysore Road": ["Magadi Road", "Vijayanagar Service Road"],
    "Bellary Road 1": ["Hebbal-KIA alternate via Yelahanka", "NH-44 service lane"],
    "Bellary Road 2": ["Jakkur Road", "Yelahanka New Town bypass"],
    "Bannerghatta Road": ["Hosur Road", "Kanakapura Road"],
    "Magadi Road": ["Mysore Road", "Tumkur Road"],
    "Tumkur Road": ["Magadi Road", "Peenya Industrial bypass"],
    "Hennur Main Road": ["Hennur-Bagalur Road", "ORR North connector"],
    "CBD 1": ["Residency Road", "Kasturba Road"],
    "CBD 2": ["Richmond Road", "St Marks Road"],
    "Airport New South Road": ["KIA Expressway", "Bellary Road service route"],
    "IRR(Thanisandra road)": ["Thanisandra Main Road", "Hennur Road"],
    "Non-corridor": ["Nearest arterial road", "Parallel service road"],
}

SIGNAL_JUNCTIONS = {
    "Silk Board": "Extend green phase on Hosur Road by 25s during peak",
    "Hebbal": "Coordinate flyover signals - reduce cycle time by 15s",
    "Marathahalli": "Enable adaptive signal on ORR East approach",
    "Majestic": "Implement bus-priority green wave on Kempegowda approach",
    "Koramangala": "Stagger signal timing on 80ft Road junctions",
}


def optimize_resources(
    db: Session,
    zone: Optional[str] = None,
    event_cause: Optional[str] = None,
    priority: Optional[str] = None,
    requires_road_closure: bool = False,
    junction: Optional[str] = None,
    corridor: Optional[str] = None,
    event_id: Optional[str] = None,
) -> dict:
    event = None
    if event_id:
        event = db.query(TrafficEvent).filter(TrafficEvent.id == event_id).first()
        if event:
            zone = event.zone or zone
            event_cause = event.event_cause or event_cause
            priority = event.priority or priority
            requires_road_closure = event.requires_road_closure
            junction = event.junction or junction
            corridor = event.corridor or corridor

    zone = zone or "Central Zone 1"
    event_cause = event_cause or "accident"
    priority = priority or "High"
    corridor = corridor or "Non-corridor"

    cause_weight = CAUSE_WEIGHTS.get(event_cause, 0.5)
    zone_density = (
        db.query(func.count(TrafficEvent.id))
        .filter(TrafficEvent.zone == zone, TrafficEvent.status == "active")
        .scalar()
        or 0
    )

    police = 2
    if priority == "High":
        police += 3
    if requires_road_closure:
        police += 4
    if cause_weight > 0.7:
        police += 2
    police += min(4, zone_density // 2)

    barricades = 0
    if requires_road_closure:
        barricades = 12 if priority == "High" else 8
    elif event_cause in ("construction", "public_event", "procession"):
        barricades = 6

    diversions = DIVERSION_MAP.get(corridor, DIVERSION_MAP["Non-corridor"])
    emergency_corridors = [
        f"Maintain clear lane on {corridor} for ambulances - coordinate with {zone} control room",
        "Pre-position rapid response vehicle at nearest junction",
    ]

    signal_recs = []
    if junction:
        for key, rec in SIGNAL_JUNCTIONS.items():
            if key.lower() in (junction or "").lower():
                signal_recs.append(rec)
                break
    if not signal_recs:
        signal_recs.append(f"Review signal timing at {junction or zone} - consider 20% green extension on affected approach")

    advisories = []
    if requires_road_closure:
        advisories.append(f"ROAD CLOSURE: {corridor} affected near {junction or zone}. Use alternate routes.")
    if priority == "High":
        advisories.append(f"HIGH PRIORITY incident in {zone}. Expect delays of 20-45 minutes.")
    advisories.append(f"Traffic advisory for {zone}: {event_cause.replace('_', ' ').title()} reported. Plan alternate routes.")
    if event_cause in ("accident", "vehicle_breakdown"):
        advisories.append("Emergency vehicles on scene - yield right of way on approach roads.")

    reasoning = [
        f"Police allocation based on priority={priority}, active zone events={zone_density}",
        f"Cause severity weight: {cause_weight:.2f}",
        f"Road closure: {'Yes' if requires_road_closure else 'No'} → barricades={barricades}",
        f"Corridor '{corridor}' mapped to {len(diversions)} diversion routes",
    ]

    return {
        "traffic_police_required": police,
        "barricades_required": barricades,
        "diversion_routes": diversions,
        "emergency_corridors": emergency_corridors,
        "signal_timing_recommendations": signal_recs,
        "public_advisory_messages": advisories,
        "reasoning": reasoning,
    }
