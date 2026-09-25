import time
from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app.models.patient import PatientProfile
from app.models.agent_schemas import AccessAgentOutput
from app.services.facility_service import facility_service
from app.services.llm_service import llm_service

class AccessAgent(BaseAgent):
    def __init__(self):
        super().__init__("access_intel", "Access Intelligence Agent")

    async def run(self, patient: PatientProfile) -> AccessAgentOutput:
        start_time = time.time()
        
        current_fac = facility_service.get_facility_by_id(patient.current_facility_id)
        current_distance = current_fac.distance_km if current_fac else 12.0

        barriers: List[str] = []
        risk_score = 0

        # Evaluate connectivity
        conn = patient.connectivity.lower()
        if conn in ["offline", "no_signal"]:
            risk_score += 3
            barriers.append("Zero cellular connectivity (Offline local storage mode required)")
        elif conn in ["2g_only", "limited"]:
            risk_score += 2
            barriers.append(f"Severely constrained network ({patient.connectivity.upper()}) - Video teleconsult contraindicated")
        else:
            barriers.append("Sufficient 3G/4G connectivity for text and telemetry sync")

        # Evaluate road & terrain
        road = patient.road_condition.lower()
        if "rough" in road or "unpaved" in road or "flooded" in road:
            risk_score += 2
            barriers.append(f"Difficult road transit: {patient.road_condition.replace('_', ' ').title()} (+20 mins estimated transit)")
        else:
            barriers.append("Paved road access passable by standard emergency vehicles")

        # Distance factor
        if current_distance > 25:
            risk_score += 2
            barriers.append(f"Substantial transit distance: {current_distance} km to nearest emergency node")
        elif current_distance > 10:
            risk_score += 1
            barriers.append(f"Moderate transit distance: {current_distance} km to primary facility")

        # Access risk category
        if risk_score >= 4:
            access_risk = "HIGH"
            delay_mins = 55
            teleconsult_possible = False
            reasoning = (
                f"High access vulnerability: Compounded by {patient.connectivity} network and "
                f"{patient.road_condition.replace('_', ' ')} terrain. Standard 108 ambulance response "
                f"estimated at ~{delay_mins} minutes. Pre-referral stabilization must happen locally."
            )
        elif risk_score >= 2:
            access_risk = "MEDIUM"
            delay_mins = 35
            teleconsult_possible = conn not in ["offline", "2g_only"]
            reasoning = (
                f"Moderate access difficulty: Road condition is {patient.road_condition.replace('_', ' ')} "
                f"with {patient.connectivity} connectivity. Estimated transit delay ~{delay_mins} minutes."
            )
        else:
            access_risk = "LOW"
            delay_mins = 15
            teleconsult_possible = True
            reasoning = "Favorable access geometry with good road connectivity and viable cellular telemetry link."

        fallback_output = {
            "access_risk": access_risk,
            "connectivity_status": patient.connectivity,
            "road_feasibility": patient.road_condition,
            "nearest_phc_distance_km": current_distance,
            "ambulance_delay_estimate_mins": delay_mins,
            "teleconsult_possible": teleconsult_possible,
            "access_barriers": barriers,
            "key_factors": barriers,
            "reasoning": reasoning
        }

        prompt = (
            f"Patient Location: {patient.location}, Connectivity: {patient.connectivity}, "
            f"Road: {patient.road_condition}, Facility distance: {current_distance}km. "
            "Evaluate access risk (LOW, MEDIUM, HIGH) and explain barriers for rural ambulance routing."
        )
        llm_result = await llm_service.generate_structured_response("Access Intelligence Agent", prompt, fallback_output)

        meta = self.build_metadata(start_time)
        return AccessAgentOutput(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            status="completed",
            execution_time_ms=meta["execution_time_ms"],
            timestamp=meta["timestamp"],
            reasoning=llm_result.get("reasoning", reasoning),
            key_factors=llm_result.get("key_factors", barriers),
            requires_human_review=True,
            access_risk=llm_result.get("access_risk", access_risk),
            connectivity_status=patient.connectivity,
            road_feasibility=patient.road_condition,
            nearest_phc_distance_km=current_distance,
            ambulance_delay_estimate_mins=delay_mins,
            teleconsult_possible=teleconsult_possible,
            access_barriers=llm_result.get("access_barriers", barriers),
            data={
                "risk_score": risk_score,
                "delay_mins": delay_mins,
                "connectivity": patient.connectivity,
                "terrain": patient.road_condition
            }
        )

access_agent = AccessAgent()
