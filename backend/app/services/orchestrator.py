"""Central AI Orchestrator coordinating all 4 agents and case journeys (Section 7)"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.agents.clinical_intake_agent import clinical_intake_agent
from app.agents.care_intelligence_agent import care_intelligence_agent
from app.agents.adaptive_referral_agent import adaptive_referral_agent
from app.agents.care_rescue_agent import care_rescue_agent

from app.models.case import ClinicalCase, CaseStatus, UrgencyLevel
from app.models.clinical import TriageAssessment
from app.state_machine.case_state_machine import case_state_machine

class AIOrchestrator:
    """Coordinates Clinical Intake, Care Intelligence, Adaptive Referral, and Care Rescue agents"""
    
    def process_intake(
        self,
        case: ClinicalCase,
        user_role: str,
        user_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """Trigger Agent 1 (Clinical Intake Agent) and route based on red-flag detection"""
        symptoms = case.symptoms
        if not symptoms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Case has no recorded symptom submission."
            )

        has_image = len(case.images) > 0

        # Execute Agent 1
        intake_result = clinical_intake_agent.evaluate_intake(
            main_complaint=symptoms.main_complaint,
            description=symptoms.description,
            onset_duration=symptoms.onset_duration,
            reported_severity=symptoms.reported_severity,
            accompanying_symptoms=symptoms.accompanying_symptoms,
            existing_conditions=symptoms.existing_conditions,
            current_medications=symptoms.current_medications,
            temperature=symptoms.temperature,
            heart_rate=symptoms.heart_rate,
            systolic_bp=symptoms.systolic_bp,
            diastolic_bp=symptoms.diastolic_bp,
            spo2=symptoms.spo2,
            respiratory_rate=symptoms.respiratory_rate,
            has_image=has_image,
            case_id=case.id,
            db=db
        )

        # Update case provisional urgency
        case.provisional_urgency = intake_result["provisional_urgency"]
        case.chief_complaint_summary = (
            f"Intake analysis ({intake_result['recommended_specialty']}): "
            f"{intake_result['clinical_rationale']}"
        )

        # Upsert Triage Assessment record
        if not case.triage:
            triage_rec = TriageAssessment(
                case_id=case.id,
                agent_name="Agent 1: Clinical Intake Agent",
                provisional_urgency=intake_result["provisional_urgency"],
                emergency_flags_detected="; ".join(intake_result["emergency_flags"]) if intake_result["emergency_flags"] else None,
                clinical_rationale=intake_result["clinical_rationale"],
                missing_information_flags="; ".join(intake_result["missing_information"]) if intake_result["missing_information"] else None,
                recommended_specialty=intake_result["recommended_specialty"],
                is_vital_compromised=intake_result["is_vital_compromised"],
                stabilization_directives="; ".join(intake_result["stabilization_directives"]) if intake_result["stabilization_directives"] else None
            )
            db.add(triage_rec)
        else:
            case.triage.provisional_urgency = intake_result["provisional_urgency"]
            case.triage.emergency_flags_detected = "; ".join(intake_result["emergency_flags"]) if intake_result["emergency_flags"] else None
            case.triage.clinical_rationale = intake_result["clinical_rationale"]
            case.triage.missing_information_flags = "; ".join(intake_result["missing_information"]) if intake_result["missing_information"] else None
            case.triage.recommended_specialty = intake_result["recommended_specialty"]
            case.triage.is_vital_compromised = intake_result["is_vital_compromised"]
            case.triage.stabilization_directives = "; ".join(intake_result["stabilization_directives"]) if intake_result["stabilization_directives"] else None

        db.commit()

        # Step 4 State Routing:
        # If emergency warning signs present -> EMERGENCY_GUIDANCE_SHOWN immediately
        # Otherwise -> AWAITING_CLINICIAN_REVIEW
        if intake_result["is_emergency"]:
            case_state_machine.transition(
                case=case,
                to_state=CaseStatus.EMERGENCY_GUIDANCE_SHOWN,
                actor_role="SYSTEM",
                actor_user_id=user_id,
                transition_event="DETERMINISTIC_EMERGENCY_RULE_TRIGGERED",
                evidence_notes=f"Emergency red-flags detected: {intake_result['emergency_flags']}. Displaying 112 emergency directive. Ordinary referral queue bypassed.",
                db=db
            )
        else:
            case_state_machine.transition(
                case=case,
                to_state=CaseStatus.AWAITING_CLINICIAN_REVIEW,
                actor_role="SYSTEM",
                actor_user_id=user_id,
                transition_event="CASE_ENQUEUED_FOR_CLINICIAN_REVIEW",
                evidence_notes=f"Structured intake completed. Stratified as {intake_result['provisional_urgency']}. Enqueued for human clinical sign-off.",
                db=db
            )

        return intake_result

ai_orchestrator = AIOrchestrator()
