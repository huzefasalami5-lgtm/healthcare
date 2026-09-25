import time
import uuid
from typing import Dict, Any, List, Optional
from app.agents.base_agent import BaseAgent
from app.models.patient import PatientProfile
from app.models.referral import ReferralSlip
from app.models.agent_schemas import (
    TriageAgentOutput, FacilityAgentOutput, ReferralAgentOutput
)
from app.services.facility_service import facility_service
from app.services.llm_service import llm_service

class ReferralAgent(BaseAgent):
    def __init__(self):
        super().__init__("referral_coordinator", "Referral Agent")

    async def run(
        self,
        patient: PatientProfile,
        triage_out: TriageAgentOutput,
        facility_out: FacilityAgentOutput
    ) -> ReferralAgentOutput:
        start_time = time.time()

        is_referral = facility_out.is_referral_needed
        current_fac = facility_service.get_facility_by_id(patient.current_facility_id)
        dest_fac = facility_service.get_facility_by_id(facility_out.selected_facility_id)

        origin_name = current_fac.name if current_fac else "Origin Health Centre"
        dest_name = dest_fac.name if dest_fac else facility_out.selected_facility_name

        transport_mode = (
            "108 Advanced Life Support (ALS) Ambulance (Ventilator & Oxygen equipped)"
            if triage_out.priority in ["EMERGENCY", "HIGH"] else
            "108 Basic Life Support (BLS) Ambulance / Local Health Transit"
        )

        missing_caps = []
        if current_fac:
            if current_fac.resources.oxygen_status != "available":
                missing_caps.append("Continuous Medical Oxygen Supply")
            if not current_fac.resources.doctors_on_duty or "General" in current_fac.resources.doctors_on_duty[0]:
                missing_caps.append("Specialist Physician / Pulmonologist")
            if "Digital Chest X-Ray" not in current_fac.resources.diagnostics_available:
                missing_caps.append("Chest Radiography / ECG")
        if not missing_caps:
            missing_caps = ["Higher-Tier Intensive Monitoring & Specialist Care"]

        referral_reason = (
            f"Transfer required from {origin_name} to {dest_name}: Patient requires urgent "
            f"specialist management ({triage_out.priority} urgency) and continuous high-flow oxygenation "
            f"which cannot be sustained at the current {current_fac.tier if current_fac else 'primary'} level."
            if is_referral else
            f"Referral not indicated: Patient can be safely managed with available resources at {origin_name}."
        )

        referral_slip_dict: Optional[Dict[str, Any]] = None
        if is_referral:
            ref_id = f"REF-{uuid.uuid4().hex[:8].upper()}"
            slip = ReferralSlip(
                referral_id=ref_id,
                patient_id=patient.id,
                patient_name=patient.name,
                referring_facility_id=current_fac.id if current_fac else "origin",
                referring_facility_name=origin_name,
                destination_facility_id=dest_fac.id if dest_fac else facility_out.selected_facility_id,
                destination_facility_name=dest_name,
                urgency_tier=triage_out.priority,
                clinical_reason=referral_reason,
                missing_capabilities_origin=missing_caps,
                required_services=["Emergency Department Intake", "High-Flow Oxygen / Non-Invasive Ventilation", "Diagnostic X-Ray & ABG"],
                transport_type_recommended=transport_mode,
                provisional_pre_referral_care=[
                    "Maintain patient in semi-upright (45 deg) position",
                    "Keep IV line open with 0.9% Normal Saline at micro-drip rate",
                    "Continuous vitals monitoring during transit"
                ],
                status="PENDING_CLINICAL_VERIFICATION",
                created_at=self.current_timestamp(),
                qr_auth_token=f"QR-AUTH-{uuid.uuid4().hex[:12].upper()}"
            )
            referral_slip_dict = slip.model_dump()

        handover_notes = [
            f"Patient: {patient.name}, {patient.age}y {patient.gender}",
            f"Presenting Symptoms: {', '.join(patient.symptoms)}",
            f"Baseline Vitals: SpO2 {patient.vitals.spo2}%, RR {patient.vitals.respiratory_rate}, HR {patient.vitals.heart_rate}, BP {patient.vitals.systolic_bp}/{patient.vitals.diastolic_bp}",
            f"Transport: {transport_mode}",
            f"Estimated Transit: {facility_out.distance_km} km (~{facility_out.travel_time_mins} minutes)"
        ]

        fallback_output = {
            "referral_required": is_referral,
            "referring_facility": origin_name,
            "destination_facility": dest_name,
            "urgency": triage_out.priority,
            "transport_mode": transport_mode,
            "referral_reason": referral_reason,
            "clinical_handover_notes": handover_notes,
            "referral_slip": referral_slip_dict,
            "key_factors": [
                f"Referral Required: {'Yes' if is_referral else 'No'}",
                f"Route: {origin_name} -> {dest_name}",
                f"Transit Distance: {facility_out.distance_km} km",
                f"Transport: {transport_mode.split('(')[0].strip()}"
            ],
            "reasoning": referral_reason
        }

        prompt = (
            f"Evaluate Referral: From {origin_name} to {dest_name}. Urgency: {triage_out.priority}. "
            f"Missing capabilities: {missing_caps}. Construct structured referral justification and transit advice."
        )
        llm_result = await llm_service.generate_structured_response("Referral Agent", prompt, fallback_output)

        meta = self.build_metadata(start_time)
        return ReferralAgentOutput(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            status="completed",
            execution_time_ms=meta["execution_time_ms"],
            timestamp=meta["timestamp"],
            reasoning=llm_result.get("reasoning", referral_reason),
            key_factors=fallback_output["key_factors"],
            requires_human_review=True,
            referral_required=is_referral,
            referring_facility=origin_name,
            destination_facility=dest_name,
            urgency=triage_out.priority,
            transport_mode=transport_mode,
            referral_slip=referral_slip_dict,
            referral_reason=llm_result.get("referral_reason", referral_reason),
            clinical_handover_notes=llm_result.get("clinical_handover_notes", handover_notes),
            data={
                "referral_id": referral_slip_dict["referral_id"] if referral_slip_dict else None,
                "origin": origin_name,
                "destination": dest_name,
                "required": is_referral
            }
        )

referral_agent = ReferralAgent()
