"""Intake submission and AI Orchestration triggers (Section 4, 6 & 8)"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, Role
from app.models.user import User
from app.models.case import ClinicalCase, CaseStatus, SymptomSubmission
from app.state_machine.case_state_machine import case_state_machine
from app.services.orchestrator import ai_orchestrator
from app.schemas import SymptomSubmitRequest

router = APIRouter(prefix="/intake", tags=["Clinical Intake"])

@router.post("/{case_id}/submit")
def submit_intake(
    case_id: str,
    req: SymptomSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    # Authorization Check
    if current_user.role == Role.PATIENT and case.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    if current_user.role == Role.COMMUNITY_WORKER and case.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Worker not assigned.")

    # Upsert SymptomSubmission
    symptoms = case.symptoms
    if not symptoms:
        symptoms = SymptomSubmission(
            case_id=case.id,
            main_complaint=req.main_complaint,
            description=req.description,
            onset_duration=req.onset_duration,
            reported_severity=req.reported_severity,
            accompanying_symptoms=req.accompanying_symptoms,
            existing_conditions=req.existing_conditions,
            current_medications=req.current_medications,
            access_barriers=req.access_barriers,
            temperature=req.temperature,
            heart_rate=req.heart_rate,
            systolic_bp=req.systolic_bp,
            diastolic_bp=req.diastolic_bp,
            spo2=req.spo2,
            respiratory_rate=req.respiratory_rate
        )
        db.add(symptoms)
    else:
        symptoms.main_complaint = req.main_complaint
        symptoms.description = req.description
        symptoms.onset_duration = req.onset_duration
        symptoms.reported_severity = req.reported_severity
        symptoms.accompanying_symptoms = req.accompanying_symptoms
        symptoms.existing_conditions = req.existing_conditions
        symptoms.current_medications = req.current_medications
        symptoms.access_barriers = req.access_barriers
        symptoms.temperature = req.temperature
        symptoms.heart_rate = req.heart_rate
        symptoms.systolic_bp = req.systolic_bp
        symptoms.diastolic_bp = req.diastolic_bp
        symptoms.spo2 = req.spo2
        symptoms.respiratory_rate = req.respiratory_rate

    db.commit()

    # Step 1: Transition DRAFT -> INTAKE_SUBMITTED
    if case.current_state == CaseStatus.DRAFT:
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.INTAKE_SUBMITTED,
            actor_role=current_user.role,
            actor_user_id=current_user.id,
            transition_event="SYMPTOMS_SUBMITTED",
            evidence_notes=f"Symptoms submitted by {current_user.full_name} ({current_user.role})",
            db=db
        )

    # Step 2: Trigger AI Orchestrator (Agent 1)
    intake_result = ai_orchestrator.process_intake(
        case=case,
        user_role=current_user.role,
        user_id=current_user.id,
        db=db
    )

    return {
        "case_id": case.id,
        "case_number": case.case_number,
        "current_state": case.current_state,
        "provisional_urgency": case.provisional_urgency,
        "is_emergency": intake_result["is_emergency"],
        "emergency_warning": (
            "EMERGENCY WARNING: Severe red-flag signs detected. Please seek immediate local emergency medical care. "
            "In India, dial 112 immediately. Ordinary referral queues have been bypassed."
        ) if intake_result["is_emergency"] else None,
        "national_emergency_number": "112",
        "intake_assessment": intake_result
    }

@router.post("/{case_id}/assist-draft")
def save_draft_intake(
    case_id: str,
    req: SymptomSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Draft save capability for rural community workers or interrupted sessions (Section 16)"""
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    symptoms = case.symptoms
    if not symptoms:
        symptoms = SymptomSubmission(
            case_id=case.id,
            main_complaint=req.main_complaint,
            description=req.description,
            onset_duration=req.onset_duration,
            reported_severity=req.reported_severity,
            accompanying_symptoms=req.accompanying_symptoms,
            existing_conditions=req.existing_conditions,
            current_medications=req.current_medications,
            access_barriers=req.access_barriers,
            temperature=req.temperature,
            heart_rate=req.heart_rate,
            systolic_bp=req.systolic_bp,
            diastolic_bp=req.diastolic_bp,
            spo2=req.spo2,
            respiratory_rate=req.respiratory_rate
        )
        db.add(symptoms)
    else:
        symptoms.main_complaint = req.main_complaint
        symptoms.description = req.description
        symptoms.onset_duration = req.onset_duration
        symptoms.reported_severity = req.reported_severity
        symptoms.accompanying_symptoms = req.accompanying_symptoms
        symptoms.existing_conditions = req.existing_conditions
        symptoms.current_medications = req.current_medications
        symptoms.access_barriers = req.access_barriers
        symptoms.temperature = req.temperature
        symptoms.heart_rate = req.heart_rate
        symptoms.systolic_bp = req.systolic_bp
        symptoms.diastolic_bp = req.diastolic_bp
        symptoms.spo2 = req.spo2
        symptoms.respiratory_rate = req.respiratory_rate

    db.commit()
    return {"message": "Draft intake successfully saved. Case remains in DRAFT state.", "case_id": case.id}
