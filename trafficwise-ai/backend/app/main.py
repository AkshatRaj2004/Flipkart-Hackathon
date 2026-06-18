from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.seed import seed_database
from app.routers import events, analytics, ai, alerts, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    yield


app = FastAPI(
    title="TrafficWise AI",
    description="Smart City Traffic Operations Platform for Bengaluru Traffic Police",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router)
app.include_router(analytics.router)
app.include_router(ai.router)
app.include_router(alerts.router)
app.include_router(reports.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "TrafficWise AI"}
