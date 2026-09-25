import time
from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app.models.patient import PatientProfile
from app.models.agent_schemas import TriageAgentOutput, FacilityAgentOutput, ResourceAgentOutput
from app.services.facility_service import facility_service
from app.services.llm_service import llm_service

class ResourceAgent(BaseAgent):
    def __init__(self):
        super().__init__("resource_verifier", "Resource Agent")

    async def run(
        self,
        patient: PatientProfile,
        triage_out: TriageAgentOutput,
        facility_out: FacilityAgentOutput
    ) -> ResourceAgentOutput:
        start_time = time.time()

        dest_fac = facility_service.get_facility_by_id(facility_out.selected_facility_id)
        current_fac = facility_service.get_facility_by_id(patient.current_facility_id)

        target = dest_fac or current_fac
        res = target.resources if target else None

        available_items: List[str] = []
        missing_items: List[str] = []

        if res:
            available_items.extend([f"Med: {m}" for m in res.medicines_available[:4]])
            available_items.extend([f"Diag: {d}" for d in res.diagnostics_available[:3]])
            available_items.extend([f"Staff: {doc}" for doc in res.doctors_on_duty[:2]])
            available_items.extend([f"Eqpt: {eq}" for eq in res.equipment_functional[:2]])

            missing_items.extend([f"Stockout Med: {m}" for m in res.medicines_stockout[:3]])
            missing_items.extend([f"Unavailable Diag: {d}" for d in res.diagnostics_unavailable[:3]])
            missing_items.extend([f"Faulty Eqpt: {eq}" for eq in res.equipment_down[:2]])

        # Current facility stockout checks (critical for explaining referral)
        origin_gaps = []
        if current_fac:
            if current_fac.resources.oxygen_status in ["none", "low_reserve", "critical"]:
                origin_gaps.append(f"Origin Oxygen: {current_fac.resources.oxygen_status.replace('_', ' ').title()}")
            if current_fac.resources.medicines_stockout:
                origin_gaps.append(f"Origin Drug Stockouts: {', '.join(current_fac.resources.medicines_stockout[:2])}")
            if current_fac.resources.equipment_down:
                origin_gaps.append(f"Origin Equipment Defect: {', '.join(current_fac.resources.equipment_down)}")

        # Status classifications
        med_status = "Available" if (res and not res.medicines_stockout) else ("Partial" if res and res.medicines_available else "Stockout")
        diag_status = "Available" if (res and len(res.diagnostics_available) >= 3) else ("Partial" if res and res.diagnostics_available else "Unavailable")
        doc_status = "Available" if (res and res.doctors_on_duty) else "Unavailable"
        eq_status = "Operational" if (res and not res.equipment_down and res.oxygen_status == "available") else "Degraded"

        critical_ok = (med_status != "Stockout") and (doc_status != "Unavailable") and (target.tier_level >= 3 if triage_out.priority in ["EMERGENCY", "HIGH"] else True)

        reasoning = (
            f"Resource assessment at target ({target.name}): Essential emergency drugs and diagnostics verified. "
            f"Active oxygen status: {res.oxygen_status.upper() if res else 'UNKNOWN'}. "
            f"{'Identified critical resource gaps at current PHC (' + ', '.join(origin_gaps) + ') which dictate immediate referral.' if origin_gaps else 'Local primary inventory verified adequate.'}"
        )

        contingency = (
            "Ensure transfer vehicle carries emergency B-type oxygen cylinder and nebulization kit during transit."
            if "Oxygen" in str(origin_gaps) or triage_out.priority in ["EMERGENCY", "HIGH"] else
            "Dispense standard oral formulation from local PHC medicine store."
        )

        fallback_output = {
            "critical_resources_available": critical_ok,
            "medicines_status": med_status,
            "diagnostics_status": diag_status,
            "specialist_status": doc_status,
            "equipment_status": eq_status,
            "available_items": available_items,
            "missing_items": missing_items,
            "stockout_contingency": contingency,
            "key_factors": [
                f"Target Medicines: {med_status}",
                f"Target Diagnostics: {diag_status}",
                f"Target Doctors: {doc_status}",
                f"Oxygen Supply: {res.oxygen_status if res else 'N/A'}"
            ],
            "reasoning": reasoning
        }

        prompt = (
            f"Facility: {target.name}. Triage Priority: {triage_out.priority}. "
            f"Available items: {available_items[:5]}. Missing: {missing_items[:3]}. "
            "Assess resource sufficiency, identify missing critical items, and state transit contingency."
        )
        llm_result = await llm_service.generate_structured_response("Resource Agent", prompt, fallback_output)

        meta = self.build_metadata(start_time)
        return ResourceAgentOutput(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            status="completed",
            execution_time_ms=meta["execution_time_ms"],
            timestamp=meta["timestamp"],
            reasoning=llm_result.get("reasoning", reasoning),
            key_factors=fallback_output["key_factors"],
            requires_human_review=True,
            critical_resources_available=critical_ok,
            medicines_status=med_status,
            diagnostics_status=diag_status,
            specialist_status=doc_status,
            equipment_status=eq_status,
            available_items=available_items,
            missing_items=missing_items,
            stockout_contingency=contingency,
            data={
                "target_facility": target.name if target else "Unknown",
                "med_status": med_status,
                "diag_status": diag_status,
                "doc_status": doc_status,
                "eq_status": eq_status
            }
        )

resource_agent = ResourceAgent()
