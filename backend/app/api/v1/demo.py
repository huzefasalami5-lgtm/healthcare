"""Hackathon Scenario Orchestration and Clean Seed Reset (Section 17 & 18)"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db, Base, engine
from app.services.seed_service import seed_database
from app.models.case import ClinicalCase

router = APIRouter(prefix="/demo", tags=["Hackathon Demo Controls"])

@router.post("/reset-database")
def reset_demo_database(db: Session = Depends(get_db)):
    """Reset database and re-seed all fictional records for a clean demonstration"""
    Base.metadata.drop_all(bind=engine)
    seed_database(db)
    return {"message": "CuraReach 360 database successfully reset and re-seeded with demo records."}

@router.get("/scenarios")
def get_demo_scenarios(db: Session = Depends(get_db)):
    """Overview of pre-seeded cases mapped to Master Prompt Scenarios A through F"""
    cases = db.query(ClinicalCase).order_by(ClinicalCase.case_number.asc()).all()
    
    return [
        {
            "code": "SCENARIO_A",
            "title": "Scenario A — General Healthcare Referral",
            "patient": "Ramesh Patel (CR-2026-001)",
            "role_focus": "Clinician -> Hospital Staff -> Patient",
            "description": "Intake completed -> Clinician reviewed -> Referral authorized to Civil Hospital -> Hospital accepted -> Confirmed appointment -> Care Rescue tasks.",
            "case_number": "CR-2026-001",
            "initial_state": "APPOINTMENT_CONFIRMED"
        },
        {
            "code": "SCENARIO_B",
            "title": "Scenario B — Referral Rejection & Recovery",
            "patient": "Sunita Devi (CR-2026-002)",
            "role_focus": "Hospital Staff -> Doctor / Coordinator",
            "description": "Bhadravathi CHC declined referral (no surgical team). System activated recovery pipeline. Doctor can approve alternative: Shivamogga District Hospital.",
            "case_number": "CR-2026-002",
            "initial_state": "ALTERNATIVE_REVIEW_REQUIRED"
        },
        {
            "code": "SCENARIO_C",
            "title": "Scenario C — Rural Assisted Access",
            "patient": "Manjula Gowda (CR-2026-003)",
            "role_focus": "Community Worker (Anita Devi) -> Doctor",
            "description": "Community worker conducted home visit, obtained consent, recorded symptoms. Now ready in Doctor Review queue.",
            "case_number": "CR-2026-003",
            "initial_state": "AWAITING_CLINICIAN_REVIEW"
        },
        {
            "code": "SCENARIO_D",
            "title": "Scenario D — Optional Skin-Photo Intake",
            "patient": "Ravi Naik (CR-2026-004)",
            "role_focus": "Patient -> Doctor",
            "description": "Patient uploaded rash photo with consent. AI provided supportive, cautious description without autonomous diagnostic claims. Clinician reviewed.",
            "case_number": "CR-2026-004",
            "initial_state": "CLINICIAN_REVIEWED"
        },
        {
            "code": "SCENARIO_E",
            "title": "Scenario E — Emergency Branch & 112 Notice",
            "patient": "Suresh Kumar (CR-2026-005)",
            "role_focus": "Patient View",
            "description": "Crushing chest pain and low SpO2 triggered deterministic red flags. State immediately set to EMERGENCY_GUIDANCE_SHOWN. Bypassed routine appointment queues.",
            "case_number": "CR-2026-005",
            "initial_state": "EMERGENCY_GUIDANCE_SHOWN"
        },
        {
            "code": "SCENARIO_F",
            "title": "Scenario F — Hospital Onboarding & Admin Verification",
            "patient": "Facility: Sahyadri Rural Health Initiative",
            "role_focus": "CuraReach Admin",
            "description": "Hospital application submitted in DRAFT/SUBMITTED status. Admin reviews documentation and verifies facility, enabling it to receive new patient referrals.",
            "initial_state": "SUBMITTED"
        }
    ]
