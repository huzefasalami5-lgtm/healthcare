import time
from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app.models.patient import PatientProfile
from app.models.agent_schemas import (
    TriageAgentOutput, AccessAgentOutput, FacilityAgentOutput, 
    ResourceAgentOutput, CoordinatorAgentOutput
)
from app.services.llm_service import llm_service

class CoordinatorAgent(BaseAgent):
    def __init__(self):
        super().__init__("orchestrator", "Coordinator Agent")

    async def run(
        self,
        patient: PatientProfile,
        triage_out: TriageAgentOutput,
        access_out: AccessAgentOutput,
        facility_out: FacilityAgentOutput,
        resource_out: ResourceAgentOutput
    ) -> CoordinatorAgentOutput:
        start_time = time.time()

        priority = triage_out.priority
        is_referral = facility_out.is_referral_needed
        dest_name = facility_out.selected_facility_name
        dest_tier = facility_out.selected_facility_tier

        # Synthesize pathway title and action priority
        if priority in ["EMERGENCY", "HIGH"]:
            pathway_title = f"High-Acuity Inter-Facility Stabilization & Referral Pathway"
            action_priority = "IMMEDIATE_ESCALATION"
            interventions = [
                "Continuous pulse oximetry monitoring and vital sign logging every 15 mins",
                "Supplemental high-flow oxygen delivery targeting SpO2 >= 94%",
                "Dispatch 108 Advanced Life Support (ALS) Ambulance with telemetry link",
                f"Transmit pre-arrival tele-intimation to {dest_name} Emergency Department",
                "Administer pre-referral stabilization meds as per state standard treatment protocol"
            ]
            contingency = (
                f"If road transit is blocked or delayed past {access_out.ambulance_delay_estimate_mins} mins, "
                "initiate immediate emergency tele-triage with District Pulmonologist on-call via satellite phone/2G audio."
            )
        elif priority == "MODERATE":
            pathway_title = f"Local PHC/CHC Monitored Care & Outpatient Stabilization"
            action_priority = "MONITORED_CARE"
            interventions = [
                "Oral symptom-directed therapy and oral rehydration therapy",
                "Bedside blood glucose and baseline diagnostic screening",
                "Observation for 4 hours at facility to establish vital stability",
                "Counsel family caregiver on warning signs and danger indicators"
            ]
            contingency = "Re-triage immediately if respiratory rate exceeds 24 or SpO2 drops below 94%."
        else:
            pathway_title = f"Community Primary Outpatient & Organisation Community Worker Support Pathway"
            action_priority = "ROUTINE_OUTPATIENT"
            interventions = [
                "Symptomatic medication dispensation (analgesic/antipyretic/ORS)",
                "Hydration guidelines and dietary counseling",
                "Assign organisation-appointed community health worker for 48-hour home check"
            ]
            contingency = "Return to local PHC if fever persists beyond 72 hours."

        # Structured Why Pathway Was Selected explanation
        why_selected = (
            f"1. TRIAGE FACTOR ({priority}): Patient presents with {', '.join(triage_out.vital_flags or ['stable vitals'])}. "
            f"2. ACCESS FACTOR ({access_out.access_risk} Risk): Road terrain ({access_out.road_feasibility}) and network ({access_out.connectivity_status}) "
            f"require proactive pre-referral stabilization. "
            f"3. FACILITY & RESOURCE ALIGNMENT: {dest_name} matches all required capabilities ({dest_tier}) with confirmed doctor and diagnostic presence. "
            f"{'Referral required because current facility lacks advanced oxygen and respiratory diagnostics.' if is_referral else 'Current facility possesses adequate resources for local management.'}"
        )

        fallback_output = {
            "coordinated_pathway_title": pathway_title,
            "action_priority": action_priority,
            "why_pathway_selected": why_selected,
            "primary_facility": dest_name,
            "interventions_ordered": interventions,
            "contingency_plan": contingency,
            "key_factors": [
                f"Triage: {priority}",
                f"Access Risk: {access_out.access_risk}",
                f"Selected Node: {dest_name}",
                f"Transfer Status: {'Inter-Facility Referral' if is_referral else 'Local Care'}"
            ],
            "reasoning": why_selected
        }

        prompt = (
            f"Synthesize final clinical pathway for {patient.name} ({patient.age}y). "
            f"Triage: {priority}, Access: {access_out.access_risk}, Destination: {dest_name}. "
            "Formulate coordinated pathway title, priority, detailed 'WHY' rationale, and top clinical interventions."
        )
        llm_result = await llm_service.generate_structured_response("Coordinator Agent", prompt, fallback_output)

        meta = self.build_metadata(start_time)
        return CoordinatorAgentOutput(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            status="completed",
            execution_time_ms=meta["execution_time_ms"],
            timestamp=meta["timestamp"],
            reasoning=llm_result.get("reasoning", why_selected),
            key_factors=fallback_output["key_factors"],
            requires_human_review=True,
            coordinated_pathway_title=llm_result.get("coordinated_pathway_title", pathway_title),
            action_priority=llm_result.get("action_priority", action_priority),
            why_pathway_selected=llm_result.get("why_pathway_selected", why_selected),
            primary_facility=dest_name,
            interventions_ordered=llm_result.get("interventions_ordered", interventions),
            contingency_plan=contingency,
            data={
                "pathway_title": pathway_title,
                "action_priority": action_priority,
                "dest_name": dest_name,
                "is_referral": is_referral
            }
        )

coordinator_agent = CoordinatorAgent()
