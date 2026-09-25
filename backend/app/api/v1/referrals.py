"""Referral Authorization, Hospital Responses, and Adaptive Recovery Endpoints (Section 6, 8 & 9)"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles, Role
from app.models.user import User
from app.models.case import ClinicalCase, CaseStatus
from app.models.referral import Referral, ReferralStatus, ReferralResponse
from app.agents.adaptive_referral_agent import adaptive_referral_agent
from app.schemas import AuthorizeReferralRequest, RespondReferralRequest

router = APIRouter(prefix="/referrals", tags=["Referrals & Hospital Coordination"])

@router.post("/{case_id}/authorize")
def authorize_referral(
    case_id: str,
    req: AuthorizeReferralRequest,
    current_user: User = Depends(require_roles(Role.CLINICIAN, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    referral = adaptive_referral_agent.dispatch_referral(
        case=case,
        hospital_id=req.hospital_id,
        authorized_by_clinician_id=current_user.id,
        referral_reason=req.referral_reason,
        target_department=req.target_department,
        urgency=req.urgency,
        is_alternative=req.is_alternative,
        db=db
    )

    return {
        "message": "Referral successfully authorized and dispatched to hospital queue.",
        "referral_id": referral.id,
        "case_id": case.id,
        "current_state": case.current_state,
        "hospital_id": referral.hospital_id,
        "target_department": referral.target_department
    }

@router.post("/{referral_id}/respond")
def respond_to_referral(
    referral_id: str,
    req: RespondReferralRequest,
    current_user: User = Depends(require_roles(Role.HOSPITAL_STAFF, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found.")

    # Hospital isolation check (Hospital staff can only manage their own hospital referrals)
    if current_user.role == Role.HOSPITAL_STAFF and current_user.organization_id != referral.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You can only respond to referrals sent to your hospital."
        )

    # Record response
    resp = ReferralResponse(
        referral_id=referral.id,
        responding_staff_id=current_user.id,
        response_type=req.response_type,
        reason_code=req.reason_code,
        response_notes=req.response_notes,
        proposed_appointment_time=req.proposed_appointment_time
    )
    db.add(resp)
    db.commit()

    case = referral.case

    if req.response_type == "ACCEPT":
        referral.status = ReferralStatus.ACCEPTED
        db.commit()
        from app.state_machine.case_state_machine import case_state_machine
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.REFERRAL_ACCEPTED,
            actor_role=current_user.role,
            actor_user_id=current_user.id,
            transition_event="HOSPITAL_ACCEPTED_REFERRAL",
            evidence_notes=f"Referral accepted by {current_user.full_name}. Slot proposed: {req.proposed_appointment_time}",
            db=db
        )
        return {"message": "Referral accepted successfully. Case ready for appointment confirmation.", "case_state": case.current_state}

    elif req.response_type == "DECLINE":
        # Adaptive recovery triggered
        adaptive_referral_agent.handle_rejection(
            referral=referral,
            reason_code=req.reason_code or "UNSPECIFIED",
            notes=req.response_notes or "",
            staff_user_id=current_user.id,
            db=db
        )
        return {"message": "Referral decline recorded. Adaptive recovery pipeline activated for alternative matching.", "case_state": case.current_state}

    elif req.response_type == "REQUEST_INFO":
        from app.state_machine.case_state_machine import case_state_machine
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.HOSPITAL_INFORMATION_REQUESTED,
            actor_role=current_user.role,
            actor_user_id=current_user.id,
            transition_event="HOSPITAL_REQUESTED_CLARIFICATION",
            evidence_notes=req.response_notes or "Hospital requested additional clinical history",
            db=db
        )
        return {"message": "Clarification requested. Case notified to clinician.", "case_state": case.current_state}

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid response_type: {req.response_type}")

@router.post("/{case_id}/approve-alternative")
def approve_alternative_referral(
    case_id: str,
    req: AuthorizeReferralRequest,
    current_user: User = Depends(require_roles(Role.CLINICIAN, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    """Step 9: Clinician approves alternative hospital after initial referral rejection"""
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    # Dispatch alternative referral (is_alternative=True)
    referral = adaptive_referral_agent.dispatch_referral(
        case=case,
        hospital_id=req.hospital_id,
        authorized_by_clinician_id=current_user.id,
        referral_reason=f"[ALTERNATIVE ROUTE] {req.referral_reason}",
        target_department=req.target_department,
        urgency=req.urgency,
        is_alternative=True,
        db=db
    )

    return {
        "message": "Alternative referral approved by clinician and transmitted to new destination facility.",
        "referral_id": referral.id,
        "case_id": case.id,
        "current_state": case.current_state
    }
