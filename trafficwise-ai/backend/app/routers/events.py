from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import TrafficEvent
from app.schemas import TrafficEventOut, EventListResponse

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventListResponse)
def list_events(
    db: Session = Depends(get_db),
    zone: Optional[str] = None,
    junction: Optional[str] = None,
    event_type: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    requires_road_closure: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    q = db.query(TrafficEvent)
    if zone:
        q = q.filter(TrafficEvent.zone == zone)
    if junction:
        q = q.filter(TrafficEvent.junction == junction)
    if event_type:
        q = q.filter(TrafficEvent.event_type == event_type)
    if priority:
        q = q.filter(TrafficEvent.priority == priority)
    if status:
        q = q.filter(TrafficEvent.status == status)
    if requires_road_closure is not None:
        q = q.filter(TrafficEvent.requires_road_closure == requires_road_closure)
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            or_(
                TrafficEvent.id.ilike(pattern),
                TrafficEvent.junction.ilike(pattern),
                TrafficEvent.zone.ilike(pattern),
                TrafficEvent.corridor.ilike(pattern),
                TrafficEvent.event_cause.ilike(pattern),
                TrafficEvent.police_station.ilike(pattern),
            )
        )
    total = q.count()
    items = q.order_by(TrafficEvent.start_datetime.desc()).offset(skip).limit(limit).all()
    return EventListResponse(total=total, items=items)


@router.get("/filters/options")
def filter_options(db: Session = Depends(get_db)):
    def distinct(field):
        return [r[0] for r in db.query(field).filter(field.isnot(None)).distinct().order_by(field).all() if r[0]]

    return {
        "zones": distinct(TrafficEvent.zone),
        "junctions": distinct(TrafficEvent.junction),
        "event_types": distinct(TrafficEvent.event_type),
        "priorities": distinct(TrafficEvent.priority),
        "statuses": distinct(TrafficEvent.status),
        "corridors": distinct(TrafficEvent.corridor),
        "police_stations": distinct(TrafficEvent.police_station),
        "event_causes": distinct(TrafficEvent.event_cause),
    }


@router.get("/{event_id}", response_model=TrafficEventOut)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(TrafficEvent).filter(TrafficEvent.id == event_id).first()
    if not event:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Event not found")
    return event
