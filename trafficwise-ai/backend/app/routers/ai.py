from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    ForecastRequest, ForecastResponse, SimulateRequest, SimulateResponse,
    OptimizeRequest, OptimizeResponse, CopilotRequest, CopilotResponse, InsightItem,
)
from app.services.congestion_engine import predict_congestion
from app.services.what_if import simulate_scenario
from app.services.resource_optimizer import optimize_resources
from app.services.copilot import answer_copilot
from app.services.insights import generate_insights

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest, db: Session = Depends(get_db)):
    result = predict_congestion(
        db, req.event_type, req.event_cause, req.zone, req.junction,
        req.priority, req.requires_road_closure, req.duration_hours,
    )
    return ForecastResponse(**result)


@router.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest, db: Session = Depends(get_db)):
    result = simulate_scenario(
        db, req.scenario_type, req.event_cause, req.zone, req.junction,
        req.priority, req.requires_road_closure, req.duration_hours, req.corridor,
    )
    return SimulateResponse(**result)


@router.post("/optimize-resources", response_model=OptimizeResponse)
def optimize(req: OptimizeRequest, db: Session = Depends(get_db)):
    result = optimize_resources(
        db, zone=req.zone, event_cause=req.event_cause, priority=req.priority,
        requires_road_closure=req.requires_road_closure, junction=req.junction,
        event_id=req.event_id,
    )
    return OptimizeResponse(**result)


@router.post("/copilot", response_model=CopilotResponse)
def copilot(req: CopilotRequest, db: Session = Depends(get_db)):
    result = answer_copilot(db, req.query)
    return CopilotResponse(**result)


@router.get("/insights", response_model=list[InsightItem])
def insights(db: Session = Depends(get_db)):
    return generate_insights(db)
