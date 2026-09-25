"""Clinician Review, Urgency Overrides, and Approval Gates (Section 3C, 4 & 8)"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles, Role
from app.models.user import User
from app.models.case import ClinicalCase, CaseStatus
from app.models.clinical import ClinicianReview, ReviewAction
from app.state_machine.case_state_machine import case_state_machine
from app.schemas import ClinicianReviewRequest

router = APIRouter(prefix="/triage", tags=["Clinical Review & Triage"])

@router.get("/{case_id}/assessment")
def get_triage_assessment(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    if not case.triage:
        return {"message": "Triage assessment pending intake submission.", "triage": None}

    return {
        "case_id": case.id,
        "case_number": case.case_number,
        "current_state": case.current_state,
        "provisional_urgency": case.triage.provisional_urgency,
        "confirmed_urgency": case.confirmed_urgency,
        "emergency_flags": case.triage.emergency_flags_detected.split("; ") if case.triage.emergency_flags_detected else [],
        "clinical_rationale": case.triage.clinical_rationale,
        "missing_information": case.triage.missing_information_flags.split("; ") if case.triage.missing_information_flags else [],
        "recommended_specialty": case.triage.recommended_specialty,
        "is_vital_compromised": case.triage.is_vital_compromised,
        "stabilization_directives": case.triage.stabilization_directives.split("; ") if case.triage.stabilization_directives else []
    }

@router.post("/{case_id}/clinician-review")
def submit_clinician_review(
    case_id: str,
    req: ClinicianReviewRequest,
    current_user: User = Depends(require_roles(Role.CLINICIAN, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    previous_urgency = case.confirmed_urgency or case.provisional_urgency
    is_overridden = req.action == ReviewAction.OVERRIDE_URGENCY or req.confirmed_urgency != case.provisional_urgency

    # Persist review record (stored distinctly from AI recommendation)
    review = ClinicianReview(
        case_id=case.id,
        clinician_id=current_user.id,
        action=req.action,
        previous_urgency=previous_urgency,
        confirmed_urgency=req.confirmed_urgency,
        is_overridden=is_overridden,
        override_reason=req.override_reason,
        clinical_notes=req.clinical_notes
    )
    db.add(review)

    # Update case confirmed urgency
    case.confirmed_urgency = req.confirmed_urgency
    case.assigned_clinician_id = current_user.id
    db.commit()

    # Route state machine based on clinician action
    if req.action == ReviewAction.REQUEST_MORE_INFO:
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.ADDITIONAL_INFORMATION_REQUIRED,
            actor_role=current_user.role,
            actor_user_id=current_user.id,
            transition_event="CLINICIAN_REQUESTED_ADDITIONAL_INFO",
            evidence_notes=req.clinical_notes,
            db=db
        )
    elif req.action == ReviewAction.CLOSE_ROUTINE:
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.CLOSED,
            actor_role=current_user.role,
            actor_user_id=current_user.id,
            transition_event="CLINICIAN_CLOSED_ROUTINE_CASE",
            evidence_notes=f"Low-urgency care advice provided: {req.clinical_notes}",
            db=db
        )
    elif req.action == ReviewAction.APPROVE_REFERRAL:
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.CLINICIAN_REVIEWED,
            actor_role=current_user.role,
            actor_user_id=current_user.id,
            transition_event="CLINICIAN_CONFIRMED_TRIAGE",
            evidence_notes=f"Clinician confirmed urgency as {req.confirmed_urgency}. Ready for facility matching.",
            db=db
        )
    else:
        # CONFIRM_URGENCY or OVERRIDE_URGENCY
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.CLINICIAN_REVIEWED,
            actor_role=current_user.role,
            actor_user_id=current_user.id,
            transition_event="CLINICIAN_REVIEWED_AND_CONFIRMED",
            evidence_notes=f"Urgency confirmed: {req.confirmed_urgency}. Overridden: {is_overridden}. Notes: {req.clinical_notes}",
            db=db
        )

    return {
        "message": "Clinician review recorded successfully.",
        "case_id": case.id,
        "current_state": case.current_state,
        "confirmed_urgency": case.confirmed_urgency,
        "is_overridden": is_overridden
    }
