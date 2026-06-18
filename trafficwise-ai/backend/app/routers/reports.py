import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from fpdf import FPDF
import pandas as pd
from app.database import get_db
from app.models import TrafficEvent
from app.schemas import ReportRequest
from app.routers.analytics import kpi_summary

router = APIRouter(prefix="/reports", tags=["reports"])


def _naive_dt(dt):
    if dt is None:
        return None
    return dt.replace(tzinfo=None) if hasattr(dt, "tzinfo") and dt.tzinfo else dt


def events_to_df(db: Session, zone: Optional[str] = None):
    q = db.query(TrafficEvent)
    if zone:
        q = q.filter(TrafficEvent.zone == zone)
    events = q.all()
    return pd.DataFrame([
        {
            "id": e.id,
            "event_type": e.event_type,
            "event_cause": e.event_cause,
            "latitude": e.latitude,
            "longitude": e.longitude,
            "start_datetime": _naive_dt(e.start_datetime),
            "end_datetime": _naive_dt(e.end_datetime),
            "status": e.status,
            "priority": e.priority,
            "corridor": e.corridor,
            "police_station": e.police_station,
            "zone": e.zone,
            "junction": e.junction,
            "requires_road_closure": e.requires_road_closure,
        }
        for e in events
    ])


@router.post("/generate-pdf")
def generate_pdf(req: ReportRequest, db: Session = Depends(get_db)):
    kpi = kpi_summary(db)
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "TrafficWise AI - Traffic Situation Report", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, f"Report Type: {req.report_type}", ln=True)
    pdf.cell(0, 8, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", ln=True)
    if req.zone:
        pdf.cell(0, 8, f"Zone: {req.zone}", ln=True)
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Executive Summary", ln=True)
    pdf.set_font("Helvetica", "", 10)
    summary_lines = [
        f"Total Events: {kpi.total_events}",
        f"Active Events: {kpi.active_events}",
        f"High Priority: {kpi.high_priority_events}",
        f"Road Closures: {kpi.road_closures}",
        f"Avg Congestion Risk: {kpi.avg_congestion_risk}",
        f"City Impact Score: {kpi.city_impact_score}",
        f"Traffic Severity Index: {kpi.traffic_severity_index}",
    ]
    for line in summary_lines:
        pdf.cell(0, 6, line, ln=True)

    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Bengaluru Traffic Police - Operational Briefing", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 6, (
        "This report provides a comprehensive overview of traffic events across Bengaluru. "
        "Recommend proactive deployment in high-risk zones and monitor active road closures. "
        "AI-generated insights suggest focusing resources on peak hours 08:00-10:00 and 17:00-20:00."
    ))

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=trafficwise_{req.report_type}.pdf"},
    )


@router.get("/export-csv")
def export_csv(db: Session = Depends(get_db), zone: Optional[str] = Query(None)):
    df = events_to_df(db, zone)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        io.BytesIO(buf.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trafficwise_events.csv"},
    )


@router.get("/export-excel")
def export_excel(db: Session = Depends(get_db), zone: Optional[str] = Query(None)):
    df = events_to_df(db, zone)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Events", index=False)
        kpi = kpi_summary(db)
        summary_df = pd.DataFrame([kpi.model_dump()])
        summary_df.to_excel(writer, sheet_name="KPI Summary", index=False)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=trafficwise_report.xlsx"},
    )
