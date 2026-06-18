from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class TrafficEventBase(BaseModel):
    event_type: str
    event_cause: str
    latitude: float
    longitude: float
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    status: str
    priority: str
    corridor: Optional[str] = None
    police_station: Optional[str] = None
    zone: Optional[str] = None
    junction: Optional[str] = None
    requires_road_closure: bool = False
    description: Optional[str] = None
    address: Optional[str] = None


class TrafficEventOut(TrafficEventBase):
    id: str

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    total: int
    items: List[TrafficEventOut]


class KPISummary(BaseModel):
    total_events: int
    active_events: int
    planned_events: int
    unplanned_events: int
    high_priority_events: int
    road_closures: int
    avg_congestion_risk: float
    city_impact_score: float
    traffic_severity_index: float


class DistributionItem(BaseModel):
    name: str
    value: int
    percentage: Optional[float] = None


class TrendItem(BaseModel):
    period: str
    count: int
    avg_risk: Optional[float] = None


class ZoneIncident(BaseModel):
    zone: str
    count: int
    high_priority: int
    road_closures: int
    avg_risk: float


class CorridorImpact(BaseModel):
    corridor: str
    count: int
    avg_duration_hours: float
    impact_score: float


class JunctionRisk(BaseModel):
    junction: str
    zone: Optional[str]
    count: int
    risk_score: float
    high_priority_count: int


class StationWorkload(BaseModel):
    police_station: str
    total_events: int
    active_events: int
    high_priority: int
    workload_score: float


class TimelineItem(BaseModel):
    id: str
    event_type: str
    event_cause: str
    zone: Optional[str]
    junction: Optional[str]
    priority: str
    status: str
    start_datetime: datetime
    requires_road_closure: bool


class ForecastRequest(BaseModel):
    event_type: str
    event_cause: str
    zone: str
    junction: Optional[str] = None
    priority: str
    requires_road_closure: bool = False
    duration_hours: float = Field(default=2.0, ge=0.5, le=24)


class ForecastResponse(BaseModel):
    congestion_risk_score: float
    risk_category: str
    estimated_delay_minutes: float
    traffic_severity: str
    impact_radius_km: float
    confidence_score: float
    reasoning: List[str]


class SimulateRequest(BaseModel):
    scenario_type: str
    event_cause: str
    zone: str
    junction: Optional[str] = None
    priority: str = "High"
    requires_road_closure: bool = False
    duration_hours: float = 3.0
    corridor: Optional[str] = None


class SimulateResponse(BaseModel):
    scenario_type: str
    predicted_congestion_spread: List[dict]
    delay_forecast_minutes: float
    resource_requirements: dict
    recommended_diversions: List[str]
    expected_impact_zones: List[str]
    compounded_risk_score: float
    reasoning: List[str]


class OptimizeRequest(BaseModel):
    event_id: Optional[str] = None
    zone: Optional[str] = None
    event_cause: Optional[str] = None
    priority: Optional[str] = None
    requires_road_closure: bool = False
    junction: Optional[str] = None


class OptimizeResponse(BaseModel):
    traffic_police_required: int
    barricades_required: int
    diversion_routes: List[str]
    emergency_corridors: List[str]
    signal_timing_recommendations: List[str]
    public_advisory_messages: List[str]
    reasoning: List[str]


class CopilotRequest(BaseModel):
    query: str


class CopilotResponse(BaseModel):
    intent: str
    answer: str
    reasoning: List[str]
    supporting_data: Any


class AlertItem(BaseModel):
    id: str
    severity: str
    title: str
    message: str
    zone: Optional[str]
    recommended_action: str
    created_at: datetime


class InsightItem(BaseModel):
    category: str
    title: str
    description: str
    metric: Optional[str] = None
    trend: Optional[str] = None


class ReportRequest(BaseModel):
    report_type: str
    zone: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
