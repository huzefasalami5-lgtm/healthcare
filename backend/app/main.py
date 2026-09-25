"""CuraReach 360 — FastAPI Application Master Entry Point
Tagline: Predict the Gap. Adapt the Pathway. Complete the Care.
Team ID: AX26-202
Team Members: Huzefa Salami (Team Lead), MD Muneeb, Mohammed Uzair, G Sumith Reddy
Hackathon: Agent X 2026
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_service import seed_database
from app.api.v1 import api_v1_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized and seeded
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Multi-Agent AI Healthcare Coordination & Referral Network for Urban and Rural Communities",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Master Router under /api and /api/v1
app.include_router(api_v1_router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": settings.APP_NAME,
        "tagline": settings.TAGLINE,
        "team_id": settings.TEAM_ID,
        "team_members": settings.TEAM_MEMBERS,
        "status": "online",
        "version": settings.VERSION,
        "api_docs": "/docs",
        "four_core_agents": [
            "Agent 1: Clinical Intake Agent (Text normalization, red-flags, provisional triage)",
            "Agent 2: Care Intelligence Agent (Specialty matching, physical accessibility, explainability)",
            "Agent 3: Adaptive Referral Agent (Referral payload, hospital queues, recovery pipeline)",
            "Agent 4: Care Rescue Agent (Follow-up synthesis, missed visit recovery, longitudinal care)"
        ],
        "state_machine_states": 18
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "database": "sqlite_connected",
        "ai_orchestrator": "active",
        "demo_mode": settings.DEMO_MODE,
        "llm_provider": "gemini" if settings.GEMINI_API_KEY else "deterministic_fallback"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
