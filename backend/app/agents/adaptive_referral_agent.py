"""Agent 3 — Adaptive Referral Agent (Section 6 & 8)
Creates authorized referral payloads, delivers them to hospital queues, handles acceptance/decline,
and coordinates alternative pathway recovery with clinician re-authorization gates.
"""
import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.agents.base_agent import BaseAgent
from app.models.case import ClinicalCase, CaseStatus
from app.models.referral import Referral, ReferralStatus, ReferralResponse, Appointment
from app.models.care_rescue import Notification
from app.state_machine.case_state_machine import case_state_machine

class AdaptiveReferralAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Agent 3: Adaptive Referral Agent",
            description="Referral payload formulation, destination queue delivery, rejection recovery, and re-authorization gating"
        )

    def dispatch_referral(
        self,
        case: ClinicalCase,
        hospital_id: str,
        authorized_by_clinician_id: str,
        referral_reason: str,
        target_department: str,
        urgency: str,
        is_alternative: bool,
        db: Session
    ) -> Referral:
        start_time = time.time()

        # Enforce consent check (Section 2 & 8)
        if not case.consent or not case.consent.referral_consent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Patient referral consent has not been granted or has been withdrawn."
            )

        # Enforce maximum retry loop guard (prevent infinite automated loops)
        existing_referrals_count = db.query(Referral).filter(Referral.case_id == case.id).count()
        if existing_referrals_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum referral retry limit (3 attempts) reached for this case. Mandatory manual coordinator escalation required."
            )

        # Create Referral record
        referral = Referral(
            case_id=case.id,
            hospital_id=hospital_id,
            authorized_by_clinician_id=authorized_by_clinician_id,
            status=ReferralStatus.SENT,
            referral_reason=referral_reason,
            target_department=target_department,
            urgency=urgency,
            is_alternative=is_alternative,
            sent_at=datetime.now(timezone.utc)
        )
        db.add(referral)
        db.commit()
        db.refresh(referral)

        # Transition Case State: REFERRAL_APPROVED -> REFERRAL_SENT
        case.target_hospital_id = hospital_id
        if case.current_state != CaseStatus.REFERRAL_APPROVED:
            case_state_machine.transition(
                case=case,
                to_state=CaseStatus.REFERRAL_APPROVED,
                actor_role="CLINICIAN",
                actor_user_id=authorized_by_clinician_id,
                transition_event="CLINICIAN_AUTHORIZED_REFERRAL",
                evidence_notes=f"Referral authorized to hospital ID {hospital_id} ({target_department})",
                db=db
            )

        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.REFERRAL_SENT,
            actor_role="SYSTEM",
            actor_user_id=authorized_by_clinician_id,
            transition_event="REFERRAL_DISPATCHED_TO_HOSPITAL",
            evidence_notes=f"Dispatched referral ID {referral.id} to hospital dashboard queue",
            db=db
        )

        # Notify Patient
        notif = Notification(
            user_id=case.patient_id,
            case_id=case.id,
            title="Referral Sent to Hospital",
            message=f"Your referral for {target_department} has been transmitted to {referral.hospital.name if referral.hospital else 'the hospital'}. Awaiting confirmation.",
            notification_type="INFO"
        )
        db.add(notif)
        db.commit()

        duration_ms = int((time.time() - start_time) * 1000)
        self.log_execution(
            case_id=case.id,
            input_summary=f"Case: {case.case_number}, Hospital: {hospital_id}, Dept: {target_department}, Alternative: {is_alternative}",
            output_summary=f"Referral ID {referral.id} created and dispatched to hospital queue.",
            duration_ms=duration_ms,
            is_deterministic=True,
            db=db
        )

        return referral

    def handle_rejection(
        self,
        referral: Referral,
        reason_code: str,
        notes: str,
        staff_user_id: str,
        db: Session
    ) -> ClinicalCase:
        start_time = time.time()
        case = referral.case

        referral.status = ReferralStatus.DECLINED
        referral.decline_reason = f"[{reason_code}] {notes}"

        # Transition: REFERRAL_SENT -> REFERRAL_DECLINED
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.REFERRAL_DECLINED,
            actor_role="HOSPITAL_STAFF",
            actor_user_id=staff_user_id,
            transition_event="HOSPITAL_DECLINED_REFERRAL",
            evidence_notes=f"Referral declined by hospital: [{reason_code}] {notes}",
            db=db
        )

        # Transition: REFERRAL_DECLINED -> ALTERNATIVE_REVIEW_REQUIRED
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.ALTERNATIVE_REVIEW_REQUIRED,
            actor_role="SYSTEM",
            actor_user_id=staff_user_id,
            transition_event="ACTIVATED_ADAPTIVE_RECOVERY_PIPELINE",
            evidence_notes="Care Intelligence triggered to generate alternative facility candidates for clinician review",
            db=db
        )

        # Notify Clinician & Patient
        if case.assigned_clinician_id:
            db.add(Notification(
                user_id=case.assigned_clinician_id,
                case_id=case.id,
                title="Action Required: Referral Declined",
                message=f"Hospital declined referral for case {case.case_number}. Alternative facility review is required.",
                notification_type="ALERT"
            ))

        db.add(Notification(
            user_id=case.patient_id,
            case_id=case.id,
            title="Referral Route Update",
            message="The initial facility had no immediate vacancy. Our medical coordinator is selecting an alternative facility for you.",
            notification_type="INFO"
        ))
        db.commit()

        duration_ms = int((time.time() - start_time) * 1000)
        self.log_execution(
            case_id=case.id,
            input_summary=f"Referral {referral.id} declined with code: {reason_code}",
            output_summary="Transitioned to ALTERNATIVE_REVIEW_REQUIRED. Gated on renewed clinician authorization.",
            duration_ms=duration_ms,
            is_deterministic=True,
            db=db
        )

        return case

adaptive_referral_agent = AdaptiveReferralAgent()
