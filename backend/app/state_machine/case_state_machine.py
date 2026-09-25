"""Explicit 18-State Machine for Clinical Case Journeys (Section 13)"""
from typing import Dict, List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.case import ClinicalCase, CaseStatus
from app.models.audit import CaseStatusEvent
from app.core.security import Role

class CaseStateMachine:
    # Allowed transitions map: Current State -> List of valid target states
    VALID_TRANSITIONS: Dict[str, List[str]] = {
        CaseStatus.DRAFT: [
            CaseStatus.INTAKE_SUBMITTED
        ],
        CaseStatus.INTAKE_SUBMITTED: [
            CaseStatus.EMERGENCY_GUIDANCE_SHOWN,
            CaseStatus.AWAITING_CLINICIAN_REVIEW
        ],
        CaseStatus.EMERGENCY_GUIDANCE_SHOWN: [
            CaseStatus.CLOSED
        ],
        CaseStatus.AWAITING_CLINICIAN_REVIEW: [
            CaseStatus.ADDITIONAL_INFORMATION_REQUIRED,
            CaseStatus.CLINICIAN_REVIEWED,
            CaseStatus.REFERRAL_APPROVED,
            CaseStatus.CLOSED
        ],
        CaseStatus.ADDITIONAL_INFORMATION_REQUIRED: [
            CaseStatus.AWAITING_CLINICIAN_REVIEW
        ],
        CaseStatus.CLINICIAN_REVIEWED: [
            CaseStatus.REFERRAL_APPROVED,
            CaseStatus.CLOSED
        ],
        CaseStatus.REFERRAL_APPROVED: [
            CaseStatus.REFERRAL_SENT
        ],
        CaseStatus.REFERRAL_SENT: [
            CaseStatus.HOSPITAL_INFORMATION_REQUESTED,
            CaseStatus.REFERRAL_DECLINED,
            CaseStatus.REFERRAL_ACCEPTED
        ],
        CaseStatus.HOSPITAL_INFORMATION_REQUESTED: [
            CaseStatus.REFERRAL_SENT
        ],
        CaseStatus.REFERRAL_DECLINED: [
            CaseStatus.ALTERNATIVE_REVIEW_REQUIRED
        ],
        CaseStatus.ALTERNATIVE_REVIEW_REQUIRED: [
            CaseStatus.REFERRAL_APPROVED,
            CaseStatus.CLOSED
        ],
        CaseStatus.REFERRAL_ACCEPTED: [
            CaseStatus.APPOINTMENT_CONFIRMED,
            CaseStatus.CARE_ENCOUNTER_REPORTED
        ],
        CaseStatus.APPOINTMENT_CONFIRMED: [
            CaseStatus.CARE_ENCOUNTER_REPORTED,
            CaseStatus.APPOINTMENT_MISSED
        ],
        CaseStatus.APPOINTMENT_MISSED: [
            CaseStatus.FOLLOW_UP_PENDING,
            CaseStatus.APPOINTMENT_CONFIRMED
        ],
        CaseStatus.CARE_ENCOUNTER_REPORTED: [
            CaseStatus.FOLLOW_UP_PENDING,
            CaseStatus.FOLLOW_UP_COMPLETED,
            CaseStatus.CLOSED
        ],
        CaseStatus.FOLLOW_UP_PENDING: [
            CaseStatus.FOLLOW_UP_COMPLETED,
            CaseStatus.CLOSED
        ],
        CaseStatus.FOLLOW_UP_COMPLETED: [
            CaseStatus.CLOSED
        ],
        CaseStatus.CLOSED: [
            CaseStatus.AWAITING_CLINICIAN_REVIEW  # Allowed reopening by authorized clinician
        ]
    }

    # Role permissions for each transition
    TRANSITION_ROLE_PERMISSIONS: Dict[str, List[str]] = {
        CaseStatus.INTAKE_SUBMITTED: [Role.PATIENT, Role.COMMUNITY_WORKER, Role.CLINICIAN, Role.CURAREACH_ADMIN],
        CaseStatus.EMERGENCY_GUIDANCE_SHOWN: ["SYSTEM", Role.PATIENT, Role.COMMUNITY_WORKER, Role.CLINICIAN],
        CaseStatus.AWAITING_CLINICIAN_REVIEW: ["SYSTEM", Role.PATIENT, Role.COMMUNITY_WORKER, Role.CLINICIAN],
        CaseStatus.ADDITIONAL_INFORMATION_REQUIRED: [Role.CLINICIAN, Role.CURAREACH_ADMIN],
        CaseStatus.CLINICIAN_REVIEWED: [Role.CLINICIAN, Role.CURAREACH_ADMIN],
        CaseStatus.REFERRAL_APPROVED: [Role.CLINICIAN, Role.CURAREACH_ADMIN],
        CaseStatus.REFERRAL_SENT: ["SYSTEM", Role.CLINICIAN, Role.CURAREACH_ADMIN],
        CaseStatus.HOSPITAL_INFORMATION_REQUESTED: [Role.HOSPITAL_STAFF, Role.CURAREACH_ADMIN],
        CaseStatus.REFERRAL_DECLINED: [Role.HOSPITAL_STAFF, Role.CURAREACH_ADMIN],
        CaseStatus.ALTERNATIVE_REVIEW_REQUIRED: ["SYSTEM", Role.HOSPITAL_STAFF, Role.CLINICIAN, Role.CURAREACH_ADMIN],
        CaseStatus.REFERRAL_ACCEPTED: [Role.HOSPITAL_STAFF, Role.CURAREACH_ADMIN],
        CaseStatus.APPOINTMENT_CONFIRMED: [Role.HOSPITAL_STAFF, Role.CLINICIAN, Role.CURAREACH_ADMIN],
        CaseStatus.APPOINTMENT_MISSED: [Role.HOSPITAL_STAFF, Role.PATIENT, Role.COMMUNITY_WORKER, Role.CLINICIAN],
        CaseStatus.CARE_ENCOUNTER_REPORTED: [Role.HOSPITAL_STAFF, Role.CLINICIAN, Role.CURAREACH_ADMIN],
        CaseStatus.FOLLOW_UP_PENDING: ["SYSTEM", Role.HOSPITAL_STAFF, Role.CLINICIAN, Role.COMMUNITY_WORKER],
        CaseStatus.FOLLOW_UP_COMPLETED: [Role.COMMUNITY_WORKER, Role.CLINICIAN, Role.PATIENT, Role.CURAREACH_ADMIN],
        CaseStatus.CLOSED: [Role.CLINICIAN, Role.CURAREACH_ADMIN]
    }

    @classmethod
    def transition(
        cls,
        case: ClinicalCase,
        to_state: str,
        actor_role: str,
        actor_user_id: Optional[str],
        transition_event: str,
        evidence_notes: Optional[str],
        db: Session
    ) -> ClinicalCase:
        from_state = case.current_state

        # Validate transition existence
        allowed_targets = cls.VALID_TRANSITIONS.get(from_state, [])
        if to_state not in allowed_targets:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Illegal state transition from '{from_state}' to '{to_state}'. Valid targets: {allowed_targets}"
            )

        # Validate actor role permission
        allowed_roles = cls.TRANSITION_ROLE_PERMISSIONS.get(to_state, [])
        if actor_role != "SYSTEM" and actor_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{actor_role}' is not authorized to transition case to '{to_state}'. Allowed roles: {allowed_roles}"
            )

        # Update case state
        case.current_state = to_state
        case.updated_at = datetime.now(timezone.utc)
        if to_state == CaseStatus.CLOSED:
            case.closed_at = datetime.now(timezone.utc)
            if evidence_notes:
                case.closure_reason = evidence_notes

        # Create immutable status audit event
        audit_event = CaseStatusEvent(
            case_id=case.id,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            from_state=from_state,
            to_state=to_state,
            transition_event=transition_event,
            evidence_notes=evidence_notes,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(audit_event)
        db.commit()
        db.refresh(case)
        return case

case_state_machine = CaseStateMachine()
