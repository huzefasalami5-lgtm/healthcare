import time
from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app.models.patient import PatientProfile
from app.models.agent_schemas import TriageAgentOutput, AccessAgentOutput, FacilityAgentOutput
from app.services.facility_service import facility_service
from app.services.llm_service import llm_service

class FacilityAgent(BaseAgent):
    def __init__(self):
        super().__init__("facility_matcher", "Facility Agent")

    async def run(
        self, 
        patient: PatientProfile, 
        triage_out: TriageAgentOutput,
        access_out: AccessAgentOutput
    ) -> FacilityAgentOutput:
        start_time = time.time()
        
        all_facs = facility_service.get_all_facilities()
        current_fac = facility_service.get_facility_by_id(patient.current_facility_id)
        current_fac_name = current_fac.name if current_fac else "Unknown Local PHC"

        priority = triage_out.priority
        needs_oxygen = any("hypoxemia" in f.lower() or "spo2" in f.lower() for f in triage_out.vital_flags) or "breathing" in str(patient.symptoms).lower()
        needs_obstetric = "pregnant" in str(patient.comorbidities).lower() or "obstetric" in str(patient.symptoms).lower() or patient.gender.lower() == "female" and "edema" in str(patient.symptoms).lower()

        candidate_list: List[Dict[str, Any]] = []
        selected_fac = None
        is_referral_needed = False

        for f in all_facs:
            # Score match based on capabilities, distance, and triage priority
            score = 50
            if priority in ["EMERGENCY", "HIGH"]:
                if f.tier_level >= 3:
                    score += 35
                if f.resources.icu_beds_available > 0 or f.resources.oxygen_status == "available":
                    score += 15
                if needs_oxygen and "Oxygen Concentrator" in str(f.resources.equipment_functional):
                    score += 10
            else:
                # Lower urgency prefers closer primary facility
                if f.tier_level <= 2:
                    score += 30
                if f.distance_km < 10:
                    score += 20

            # Distance penalty
            distance_penalty = min(int(f.distance_km * 0.8), 30)
            score = max(10, min(99, score - distance_penalty))

            candidate_list.append({
                "id": f.id,
                "name": f.name,
                "tier": f.tier,
                "tier_level": f.tier_level,
                "distance_km": f.distance_km,
                "travel_time_mins": f.travel_time_mins,
                "doctor_availability": ", ".join(f.resources.doctors_on_duty) if f.resources.doctors_on_duty else "None on duty",
                "diagnostics_ready": len(f.resources.diagnostics_available),
                "oxygen_status": f.resources.oxygen_status,
                "icu_beds": f.resources.icu_beds_available,
                "connectivity": f.connectivity_level,
                "match_score": score,
                "is_current": (f.id == patient.current_facility_id)
            })

        # Sort candidate facilities by match score descending
        candidate_list = sorted(candidate_list, key=lambda x: x["match_score"], reverse=True)

        if priority in ["EMERGENCY", "HIGH"]:
            # Check if current facility can handle it
            if current_fac and current_fac.tier_level >= 3 and current_fac.resources.oxygen_status == "available":
                selected_fac = current_fac
                is_referral_needed = False
            else:
                # Choose the top tier 3 or tier 4 facility
                capable = [c for c in candidate_list if c["tier_level"] >= 3]
                best_match = capable[0] if capable else candidate_list[0]
                selected_fac = facility_service.get_facility_by_id(best_match["id"])
                is_referral_needed = True
        else:
            # Can be managed locally
            selected_fac = current_fac or facility_service.get_facility_by_id(candidate_list[0]["id"])
            is_referral_needed = False

        sel_name = selected_fac.name if selected_fac else candidate_list[0]["name"]
        sel_tier = selected_fac.tier if selected_fac else candidate_list[0]["tier"]
        sel_dist = selected_fac.distance_km if selected_fac else candidate_list[0]["distance_km"]
        sel_time = selected_fac.travel_time_mins if selected_fac else candidate_list[0]["travel_time_mins"]
        score = candidate_list[0]["match_score"]

        why_facility = (
            f"Selected {sel_name} ({sel_tier}) due to high capability readiness: "
            f"Equipped with active oxygen manifolds, specialist doctors, and emergency stabilization beds. "
            f"Current facility ({current_fac_name}) lacks required critical care resources for {priority} triage."
            if is_referral_needed else
            f"Selected {sel_name} ({sel_tier}): Proximity ({sel_dist}km) and adequate primary outpatient capacity "
            f"for stable patient management without unnecessary transfer burden."
        )

        fallback_output = {
            "selected_facility_id": selected_fac.id if selected_fac else "dh-shivamogga",
            "selected_facility_name": sel_name,
            "selected_facility_tier": sel_tier,
            "candidate_facilities": candidate_list,
            "capability_match_score": score,
            "is_referral_needed": is_referral_needed,
            "distance_km": sel_dist,
            "travel_time_mins": sel_time,
            "key_factors": [
                f"Facility Tier: {sel_tier}",
                f"Travel Distance: {sel_dist} km (~{sel_time} mins)",
                f"Referral Required: {'Yes' if is_referral_needed else 'No'}",
                f"Origin: {current_fac_name}"
            ],
            "reasoning": why_facility
        }

        prompt = (
            f"Patient Triage: {priority}, Current Facility: {current_fac_name}. "
            f"Available candidate facilities: {[c['name'] + ' (' + c['tier'] + ')' for c in candidate_list]}. "
            f"Recommend best facility and explain why referral is {'required' if is_referral_needed else 'not required'}."
        )
        llm_result = await llm_service.generate_structured_response("Facility Agent", prompt, fallback_output)

        meta = self.build_metadata(start_time)
        return FacilityAgentOutput(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            status="completed",
            execution_time_ms=meta["execution_time_ms"],
            timestamp=meta["timestamp"],
            reasoning=llm_result.get("reasoning", why_facility),
            key_factors=fallback_output["key_factors"],
            requires_human_review=True,
            selected_facility_id=fallback_output["selected_facility_id"],
            selected_facility_name=fallback_output["selected_facility_name"],
            selected_facility_tier=fallback_output["selected_facility_tier"],
            candidate_facilities=candidate_list,
            capability_match_score=score,
            is_referral_needed=is_referral_needed,
            distance_km=sel_dist,
            travel_time_mins=sel_time,
            data={
                "selected_facility": sel_name,
                "tier": sel_tier,
                "is_referral": is_referral_needed,
                "distance": sel_dist
            }
        )

facility_agent = FacilityAgent()
