"""Clinical Cases Lifecycle, State Transitions, and Timeline Endpoints (Section 8 & 13)"""
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles, Role
from app.models.user import User
from app.models.case import ClinicalCase, CaseStatus, UrgencyLevel, ConsentRecord
from app.models.audit import CaseStatusEvent
from app.state_machine.case_state_machine import case_state_machine
from app.schemas import CreateCaseRequest, CloseCaseRequest

router = APIRouter(prefix="/cases", tags=["Clinical Cases"])

def format_case_summary(c: ClinicalCase) -> Dict[str, Any]:
    return {
        "id": c.id,
        "case_number": c.case_number,
        "patient_id": c.patient_id,
        "patient_name": c.patient.full_name if c.patient else "Unknown Patient",
        "patient_phone": c.patient.phone if c.patient else "",
        "patient_district": c.patient.patient_profile.district if c.patient and c.patient.patient_profile else "Shivamogga",
        "current_state": c.current_state,
        "provisional_urgency": c.provisional_urgency,
        "confirmed_urgency": c.confirmed_urgency,
        "primary_complaint": c.primary_complaint,
        "is_assisted_by_worker": c.is_assisted_by_worker,
        "worker_name": c.worker.full_name if c.worker else None,
        "clinician_name": c.clinician.full_name if c.clinician else None,
        "target_hospital_name": c.hospital.name if c.hospital else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        "closed_at": c.closed_at.isoformat() if c.closed_at else None
    }

@router.get("/")
def list_cases(
    urgency: Optional[str] = None,
    state: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ClinicalCase)

    # Server-side RBAC & ownership check (Section 14)
    if current_user.role == Role.PATIENT:
        query = query.filter(ClinicalCase.patient_id == current_user.id)
    elif current_user.role == Role.COMMUNITY_WORKER:
        # Worker sees assigned cases
        query = query.filter(ClinicalCase.assigned_worker_id == current_user.id)
    elif current_user.role == Role.HOSPITAL_STAFF:
        if current_user.organization_id:
            query = query.filter(ClinicalCase.target_hospital_id == current_user.organization_id)
    # Clinicians and Admins have general clinical queue visibility

    if urgency:
        query = query.filter(ClinicalCase.provisional_urgency == urgency)
    if state:
        query = query.filter(ClinicalCase.current_state == state)

    cases = query.order_by(ClinicalCase.created_at.desc()).all()
    return [format_case_summary(c) for c in cases]

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_case(
    req: CreateCaseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient_id = current_user.id
    assigned_worker_id = None
    is_assisted = False

    # Assisted case creation by Community Worker
    if current_user.role == Role.COMMUNITY_WORKER:
        if not req.patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Community worker must specify the patient_id for assisted registration."
            )
        patient_id = req.patient_id
        assigned_worker_id = current_user.id
        is_assisted = True
    elif current_user.role == Role.PATIENT and req.assigned_worker_id:
        assigned_worker_id = req.assigned_worker_id

    # Generate unique case number
    count = db.query(ClinicalCase).count() + 1
    case_number = f"CR-2026-{count:04d}"
    while db.query(ClinicalCase).filter(ClinicalCase.case_number == case_number).first():
        count += 1
        case_number = f"CR-2026-{count:04d}"

    case = ClinicalCase(
        case_number=case_number,
        patient_id=patient_id,
        assigned_worker_id=assigned_worker_id,
        current_state=CaseStatus.DRAFT,
        provisional_urgency=UrgencyLevel.LOW,
        primary_complaint=req.primary_complaint,
        is_assisted_by_worker=is_assisted,
        created_at=datetime.now(timezone.utc)
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    # Record consent (Section 2 & 8)
    consent = ConsentRecord(
        case_id=case.id,
        patient_id=patient_id,
        health_data_consent=req.health_data_consent,
        referral_consent=req.referral_consent,
        photo_consent=req.photo_consent,
        worker_assistance_consent=req.worker_assistance_consent
    )
    db.add(consent)

    # Initial state audit event
    event = CaseStatusEvent(
        case_id=case.id,
        actor_user_id=current_user.id,
        actor_role=current_user.role,
        from_state="NONE",
        to_state=CaseStatus.DRAFT,
        transition_event="CASE_CREATED",
        evidence_notes="Patient initiated healthcare case record with consented terms.",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()

    return format_case_summary(case)

@router.get("/{case_id}")
def get_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    # Authorization Check
    if current_user.role == Role.PATIENT and case.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You can only view your own cases.")
    if current_user.role == Role.COMMUNITY_WORKER and case.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You are not assigned to this patient case.")
    if current_user.role == Role.HOSPITAL_STAFF and case.target_hospital_id != current_user.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Hospital staff can only view referrals to their facility.")

    # Format full detail
    return {
        **format_case_summary(case),
        "chief_complaint_summary": case.chief_complaint_summary,
        "closure_reason": case.closure_reason,
        "consent": {
            "health_data": case.consent.health_data_consent if case.consent else False,
            "referral": case.consent.referral_consent if case.consent else False,
            "photo": case.consent.photo_consent if case.consent else False,
            "worker_assistance": case.consent.worker_assistance_consent if case.consent else False
        } if case.consent else None,
        "symptoms": {
            "main_complaint": case.symptoms.main_complaint,
            "description": case.symptoms.description,
            "onset_duration": case.symptoms.onset_duration,
            "reported_severity": case.symptoms.reported_severity,
            "accompanying_symptoms": case.symptoms.accompanying_symptoms,
            "existing_conditions": case.symptoms.existing_conditions,
            "current_medications": case.symptoms.current_medications,
            "access_barriers": case.symptoms.access_barriers,
            "vitals": {
                "temperature": case.symptoms.temperature,
                "heart_rate": case.symptoms.heart_rate,
                "blood_pressure": f"{case.symptoms.systolic_bp}/{case.symptoms.diastolic_bp}" if case.symptoms.systolic_bp else None,
                "spo2": case.symptoms.spo2,
                "respiratory_rate": case.symptoms.respiratory_rate
            }
        } if case.symptoms else None,
        "images": [
            {
                "id": img.id,
                "filename": img.original_filename,
                "mime_type": img.mime_type,
                "size_bytes": img.file_size_bytes,
                "ai_cautious_description": img.ai_cautious_description,
                "created_at": img.created_at.isoformat()
            } for img in case.images
        ],
        "triage": {
            "provisional_urgency": case.triage.provisional_urgency,
            "emergency_flags": case.triage.emergency_flags_detected.split("; ") if case.triage.emergency_flags_detected else [],
            "clinical_rationale": case.triage.clinical_rationale,
            "missing_information": case.triage.missing_information_flags.split("; ") if case.triage.missing_information_flags else [],
            "recommended_specialty": case.triage.recommended_specialty,
            "is_vital_compromised": case.triage.is_vital_compromised,
            "stabilization_directives": case.triage.stabilization_directives.split("; ") if case.triage.stabilization_directives else []
        } if case.triage else None,
        "reviews": [
            {
                "id": r.id,
                "clinician_name": r.clinician.full_name if r.clinician else "Doctor",
                "action": r.action,
                "confirmed_urgency": r.confirmed_urgency,
                "clinical_notes": r.clinical_notes,
                "created_at": r.created_at.isoformat()
            } for r in case.reviews
        ],
        "referrals": [
            {
                "id": ref.id,
                "hospital_id": ref.hospital_id,
                "hospital_name": ref.hospital.name if ref.hospital else "Hospital",
                "status": ref.status,
                "target_department": ref.target_department,
                "referral_reason": ref.referral_reason,
                "urgency": ref.urgency,
                "is_alternative": ref.is_alternative,
                "decline_reason": ref.decline_reason,
                "sent_at": ref.sent_at.isoformat() if ref.sent_at else None,
                "appointment": {
                    "scheduled_at": ref.appointment.scheduled_at,
                    "doctor_name": ref.appointment.doctor_name,
                    "department": ref.appointment.department_name,
                    "status": ref.appointment.status,
                    "arrival_status": ref.appointment.arrival_status,
                    "consultation_notes": ref.appointment.consultation_notes,
                    "discharge_instructions": ref.appointment.discharge_instructions
                } if ref.appointment else None
            } for ref in case.referrals
        ],
        "tasks": [
            {
                "id": t.id,
                "task_type": t.task_type,
                "description": t.description,
                "due_date": t.due_date,
                "status": t.status,
                "barrier_reported": t.barrier_reported,
                "worker_notes": t.worker_notes,
                "created_at": t.created_at.isoformat()
            } for t in case.tasks
        ]
    }

@router.get("/{case_id}/timeline")
def get_case_timeline(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    events = db.query(CaseStatusEvent).filter(
        CaseStatusEvent.case_id == case_id
    ).order_by(CaseStatusEvent.timestamp.asc()).all()

    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "actor_name": e.actor.full_name if e.actor else e.actor_role,
            "actor_role": e.actor_role,
            "from_state": e.from_state,
            "to_state": e.to_state,
            "transition_event": e.transition_event,
            "evidence_notes": e.evidence_notes
        } for e in events
    ]

@router.post("/{case_id}/close")
def close_case(
    case_id: str,
    req: CloseCaseRequest,
    current_user: User = Depends(require_roles(Role.CLINICIAN, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    # State machine transition to CLOSED
    case_state_machine.transition(
        case=case,
        to_state=CaseStatus.CLOSED,
        actor_role=current_user.role,
        actor_user_id=current_user.id,
        transition_event="AUTHORIZED_CASE_CLOSURE",
        evidence_notes=req.closure_reason,
        db=db
    )
    return {"message": "Case closed successfully with clinical documentation.", "case": format_case_summary(case)}
