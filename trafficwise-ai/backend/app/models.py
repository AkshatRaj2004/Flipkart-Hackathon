from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, Integer
from geoalchemy2 import Geometry
from app.database import Base


class TrafficEvent(Base):
    __tablename__ = "traffic_events"

    id = Column(String, primary_key=True, index=True)
    event_type = Column(String, index=True)
    event_cause = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    start_datetime = Column(DateTime(timezone=True), index=True)
    end_datetime = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, index=True)
    priority = Column(String, index=True)
    corridor = Column(String, index=True)
    police_station = Column(String, index=True)
    zone = Column(String, index=True)
    junction = Column(String, index=True)
    requires_road_closure = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    location = Column(Geometry("POINT", srid=4326), nullable=True)
