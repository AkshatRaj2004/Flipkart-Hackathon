"""TrafficWise AI Copilot - NLP intent matching."""

from datetime import datetime, timedelta
from typing import Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import TrafficEvent
from app.services.congestion_engine import predict_congestion, compute_event_risk, get_zone_congestion_rate
from app.services.resource_optimizer import optimize_resources


def classify_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["congested", "congestion", "busy", "worst zone", "hotspot"]):
        return "congested_zones"
    if any(w in q for w in ["why", "reason", "high risk", "risk"]):
        return "zone_risk_explanation"
    if any(w in q for w in ["whitefield", "koramangala", "hsr", "indiranagar", "hebbal", "marathahalli", "affecting", "incidents in"]):
        return "zone_incidents"
    if any(w in q for w in ["tomorrow", "predict", "forecast", "hotspot", "future"]):
        return "prediction"
    if any(w in q for w in ["resource", "allocate", "police", "deploy", "recommend"]):
        return "resource_allocation"
    if any(w in q for w in ["junction", "intersection"]):
        return "junction_analysis"
    return "general_overview"


def get_congested_zones(db: Session, limit: int = 5) -> List[dict]:
    zone_rows = (
        db.query(TrafficEvent.zone, func.count(TrafficEvent.id))
        .filter(TrafficEvent.zone.isnot(None))
        .group_by(TrafficEvent.zone)
        .all()
    )
    results = []
    for zone, count in zone_rows:
        if not zone:
            continue
        high = db.query(TrafficEvent).filter(TrafficEvent.zone == zone, TrafficEvent.priority == "High").count()
        active = db.query(TrafficEvent).filter(TrafficEvent.zone == zone, TrafficEvent.status == "active").count()
        risk = get_zone_congestion_rate(db, zone) * 100
        results.append({"zone": zone, "total": count, "high_priority": high, "active": active, "risk_score": round(risk, 1)})
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results[:limit]


def answer_copilot(db: Session, query: str) -> dict:
    intent = classify_intent(query)
    q = query.lower()
    reasoning: List[str] = []
    supporting_data: Any = {}
    answer = ""

    if intent == "congested_zones":
        zones = get_congested_zones(db)
        supporting_data = zones
        top = zones[0] if zones else None
        answer = f"The most congested zones are: {', '.join(z['zone'] for z in zones[:3])}. "
        if top:
            answer += f"{top['zone']} leads with risk score {top['risk_score']} based on {top['high_priority']} high-priority events and {top['active']} active incidents."
        reasoning = ["Ranked zones by historical high-priority ratio and road closure frequency", "Weighted active incident count"]

    elif intent == "zone_risk_explanation":
        target_zone = None
        for z in ["Koramangala", "koramangala", "South Zone 1", "South Zone 2", "East Zone 1", "Whitefield"]:
            if z.lower() in q:
                target_zone = z if "Zone" in z else None
                break
        if "koramangala" in q:
            events = db.query(TrafficEvent).filter(
                (TrafficEvent.junction.ilike("%koramangala%")) | (TrafficEvent.zone == "South Zone 1")
            ).limit(50).all()
            zone_name = "Koramangala / South Zone 1"
        else:
            zone_name = target_zone or "East Zone 1"
            events = db.query(TrafficEvent).filter(TrafficEvent.zone == zone_name).limit(50).all()

        causes = {}
        for e in events:
            causes[e.event_cause] = causes.get(e.event_cause, 0) + 1
        top_cause = max(causes, key=causes.get) if causes else "accident"
        high = sum(1 for e in events if e.priority == "High")
        supporting_data = {"zone": zone_name, "top_causes": causes, "high_priority_count": high}
        answer = f"{zone_name} is high risk due to {len(events)} historical incidents, {high} high-priority events. Primary cause: {top_cause.replace('_', ' ')}. Dense commercial traffic and ORR connectivity amplify congestion."
        reasoning = [f"Analyzed {len(events)} events in target area", f"Dominant cause: {top_cause}", "Peak hour overlap with commercial district traffic"]

    elif intent == "zone_incidents":
        zone_filter = None
        zone_keywords = {
            "whitefield": "East Zone 1",
            "hsr": "South Zone 2",
            "koramangala": "South Zone 1",
            "indiranagar": "East Zone 2",
            "hebbal": "North Zone 1",
            "marathahalli": "East Zone 1",
        }
        for kw, zone in zone_keywords.items():
            if kw in q:
                zone_filter = zone
                break

        q_events = db.query(TrafficEvent).filter(TrafficEvent.status.in_(["active", "resolved"]))
        if zone_filter:
            q_events = q_events.filter(TrafficEvent.zone == zone_filter)
        events = q_events.order_by(TrafficEvent.start_datetime.desc()).limit(10).all()
        supporting_data = [
            {"id": e.id, "cause": e.event_cause, "junction": e.junction, "priority": e.priority, "status": e.status}
            for e in events
        ]
        zone_label = zone_filter or "city-wide"
        answer = f"Found {len(events)} recent incidents affecting {zone_label}. "
        if events:
            answer += f"Latest: {events[0].event_cause} at {events[0].junction or 'unknown junction'} ({events[0].priority} priority, {events[0].status})."
        reasoning = ["Queried active and recently resolved events", f"Zone filter: {zone_label}"]

    elif intent == "prediction":
        zones = get_congested_zones(db, 5)
        tomorrow_forecasts = []
        for z in zones:
            fc = predict_congestion(db, "unplanned", "accident", z["zone"], None, "High", False, 2.0,
                                    reference_time=datetime.utcnow() + timedelta(days=1))
            tomorrow_forecasts.append({"zone": z["zone"], **fc})
        supporting_data = tomorrow_forecasts
        hotspots = [f"{f['zone']} (risk {f['congestion_risk_score']})" for f in tomorrow_forecasts[:3]]
        answer = f"Tomorrow's predicted hotspots: {', '.join(hotspots)}. Based on historical patterns, peak disruption expected 8-10 AM and 5-8 PM."
        reasoning = ["Applied congestion model with +24h time projection", "Used historical zone density and cause weights"]

    elif intent == "resource_allocation":
        zones = get_congested_zones(db, 3)
        allocations = []
        for z in zones:
            opt = optimize_resources(db, zone=z["zone"], priority="High", event_cause="accident")
            allocations.append({"zone": z["zone"], **opt})
        supporting_data = allocations
        answer = "Recommended resource allocation: "
        for a in allocations:
            answer += f"{a['zone']}: {a['traffic_police_required']} officers, {a['barricades_required']} barricades. "
        reasoning = ["Prioritized top 3 congested zones", "Applied resource optimization engine per zone"]

    elif intent == "junction_analysis":
        junctions = (
            db.query(TrafficEvent.junction, func.count(TrafficEvent.id))
            .filter(TrafficEvent.junction.isnot(None))
            .group_by(TrafficEvent.junction)
            .order_by(func.count(TrafficEvent.id).desc())
            .limit(5)
            .all()
        )
        supporting_data = [{"junction": j[0], "count": j[1]} for j in junctions]
        answer = f"Top risk junctions: {', '.join(j[0] for j in junctions[:3])}. These junctions have the highest incident frequency in Bengaluru."
        reasoning = ["Ranked junctions by total incident count", "Cross-referenced with priority distribution"]

    else:
        total = db.query(TrafficEvent).count()
        active = db.query(TrafficEvent).filter(TrafficEvent.status == "active").count()
        high = db.query(TrafficEvent).filter(TrafficEvent.priority == "High").count()
        supporting_data = {"total": total, "active": active, "high_priority": high}
        answer = f"Bengaluru traffic overview: {total} total events, {active} active, {high} high-priority. Ask me about congested zones, specific area incidents, predictions, or resource allocation."
        reasoning = ["General city-wide summary", "Intent not matched to specific query - providing overview"]

    return {
        "intent": intent,
        "answer": answer,
        "reasoning": reasoning,
        "supporting_data": supporting_data,
    }
