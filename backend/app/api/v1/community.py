from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles, Role, get_password_hash
from app.models.user import User, PatientProfile
from app.models.case import ClinicalCase
from app.models.care_rescue import FollowUpTask

router = APIRouter(prefix="/community", tags=["Community Worker Operations"])

class AssistedPatientRegisterRequest(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: str
    district: str = "Shivamogga"
    transport_access_barrier: bool = False
    financial_barrier: bool = False
    primary_language: str = "English"

class BarrierReportRequest(BaseModel):
    case_id: str
    barrier_category: str  # Transport, Financial, Hospital Contact, Mobility, Family
    barrier_description: str

@router.get("/my-patients")
def get_assigned_patients(
    current_user: User = Depends(require_roles(Role.COMMUNITY_WORKER, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    """Returns only patients with cases assigned to this specific worker (Section 10 & 19 isolation test)"""
    # Find distinct patients from cases assigned to this worker
    cases = db.query(ClinicalCase).filter(ClinicalCase.assigned_worker_id == current_user.id).all()
    patient_ids = list(set([c.patient_id for c in cases]))

    patients = db.query(User).filter(User.id.in_(patient_ids)).all()
    
    result = []
    for p in patients:
        prof = p.patient_profile
        patient_cases = [c for c in cases if c.patient_id == p.id]
        result.append({
            "patient_id": p.id,
            "full_name": p.full_name,
            "phone": p.phone,
            "address": prof.address if prof else None,
            "district": prof.district if prof else "Shivamogga",
            "transport_barrier": prof.transport_access_barrier if prof else False,
            "financial_barrier": prof.financial_barrier if prof else False,
            "active_cases_count": len([c for c in patient_cases if c.current_state != "CLOSED"]),
            "latest_case_number": patient_cases[0].case_number if patient_cases else None,
            "latest_case_state": patient_cases[0].current_state if patient_cases else None
        })
    return result

@router.post("/register-patient")
def assisted_patient_registration(
    req: AssistedPatientRegisterRequest,
    current_user: User = Depends(require_roles(Role.COMMUNITY_WORKER, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    """Consent-based assisted registration by trained CuraReach community worker (Section 8 Step 1)"""
    clean_email = req.email or f"patient.{req.phone.replace('+', '').replace('-', '')[-6:]}@curareach-assisted.org"
    
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        return {
            "message": "Patient already registered. Ready for assisted intake.",
            "patient_id": existing.id,
            "full_name": existing.full_name
        }

    patient_user = User(
        email=clean_email,
        hashed_password=get_password_hash("patient123"),
        full_name=req.full_name,
        phone=req.phone,
        role=Role.PATIENT
    )
    db.add(patient_user)
    db.commit()
    db.refresh(patient_user)

    profile = PatientProfile(
        user_id=patient_user.id,
        date_of_birth=req.date_of_birth,
        gender=req.gender,
        address=req.address,
        district=req.district,
        primary_language=req.primary_language,
        transport_access_barrier=req.transport_access_barrier,
        financial_barrier=req.financial_barrier
    )
    db.add(profile)
    db.commit()

    return {
        "message": "Patient successfully registered under assisted care pathway.",
        "patient_id": patient_user.id,
        "full_name": patient_user.full_name,
        "email": patient_user.email
    }

@router.post("/report-barrier")
def report_access_barrier(
    req: BarrierReportRequest,
    current_user: User = Depends(require_roles(Role.COMMUNITY_WORKER, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    """Log patient-reported barriers such as road transit or inability to reach hospital (Section 3B)"""
    case = db.query(ClinicalCase).filter(ClinicalCase.id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    if current_user.role == Role.COMMUNITY_WORKER and case.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Worker not assigned to this case.")

    # Create FollowUpTask for barrier mitigation
    task = FollowUpTask(
        case_id=case.id,
        assigned_worker_id=current_user.id,
        assigned_patient_id=case.patient_id,
        task_type="BARRIER_ASSISTANCE",
        description=f"[{req.barrier_category.upper()} BARRIER] {req.barrier_description}",
        barrier_reported=f"{req.barrier_category}: {req.barrier_description}",
        status="IN_PROGRESS"
    )
    db.add(task)
    db.commit()

    return {"message": "Barrier reported and mitigation task generated.", "task_id": task.id}
