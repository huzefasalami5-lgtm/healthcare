import time
from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app.models.patient import PatientProfile
from app.models.agent_schemas import TriageAgentOutput
from app.services.llm_service import llm_service

class TriageAgent(BaseAgent):
    def __init__(self):
        super().__init__("triage", "Triage Agent")

    async def run(self, patient: PatientProfile) -> TriageAgentOutput:
        start_time = time.time()
        vitals = patient.vitals
        symptoms_lower = [s.lower() for s in patient.symptoms]

        # Clinical rule evaluation
        vital_flags: List[str] = []
        symptom_flags: List[str] = []

        if vitals.spo2 < 90:
            vital_flags.append(f"Severe Hypoxemia: SpO2 {vitals.spo2}% (Normal > 95%)")
        elif vitals.spo2 < 94:
            vital_flags.append(f"Borderline Hypoxemia: SpO2 {vitals.spo2}%")

        if vitals.respiratory_rate >= 28:
            vital_flags.append(f"Severe Tachypnea: {vitals.respiratory_rate} breaths/min")
        elif vitals.respiratory_rate >= 24:
            vital_flags.append(f"Moderate Tachypnea: {vitals.respiratory_rate} breaths/min")

        if vitals.heart_rate > 120:
            vital_flags.append(f"Marked Tachycardia: {vitals.heart_rate} BPM")
        elif vitals.heart_rate > 100:
            vital_flags.append(f"Mild Tachycardia: {vitals.heart_rate} BPM")

        if vitals.systolic_bp >= 160 or vitals.diastolic_bp >= 105:
            vital_flags.append(f"Stage 2 / Hypertensive Crisis: {vitals.systolic_bp}/{vitals.diastolic_bp} mmHg")
        elif vitals.systolic_bp <= 90:
            vital_flags.append(f"Hypotension / Shock Index Warning: {vitals.systolic_bp}/{vitals.diastolic_bp} mmHg")

        if vitals.temperature >= 102.0:
            vital_flags.append(f"High Grade Fever: {vitals.temperature}°F")

        for sym in symptoms_lower:
            if any(term in sym for term in ["breathing difficulty", "shortness of breath", "chest pain", "seizure", "unconscious", "headache", "edema"]):
                symptom_flags.append(sym)

        # Stratify Urgency Tier
        priority = "LOW"
        escalation_needed = False
        reasoning = ""

        if vitals.spo2 < 88 or (vitals.spo2 < 90 and vitals.respiratory_rate >= 28) or vitals.systolic_bp < 85:
            priority = "EMERGENCY"
            escalation_needed = True
            reasoning = (
                f"Immediate clinical escalation: SpO2 of {vitals.spo2}% combined with "
                f"respiratory rate of {vitals.respiratory_rate}/min indicates impending respiratory compromise."
            )
        elif vitals.spo2 < 92 or vitals.systolic_bp >= 160 or any("breathing" in s for s in symptom_flags):
            priority = "HIGH"
            escalation_needed = True
            reasoning = (
                f"Urgent medical attention required: Key clinical signs include {', '.join(vital_flags[:2])}. "
                f"Patient requires urgent evaluation and supplemental oxygen or specialist management."
            )
        elif vital_flags or len(symptom_flags) > 1 or vitals.temperature >= 101.0:
            priority = "MODERATE"
            escalation_needed = False
            reasoning = f"Subacute clinical presentation: {', '.join(vital_flags or symptom_flags)}. Manageable at PHC/CHC level with close vitals monitoring."
        else:
            priority = "LOW"
            escalation_needed = False
            reasoning = "Mild presentation with hemodynamically stable vitals. Suitable for primary care outpatient management."

        key_factors = vital_flags + [f"Reported: {s}" for s in patient.symptoms]
        if patient.comorbidities:
            key_factors.append(f"Comorbidities: {', '.join(patient.comorbidities)}")

        fallback_output = {
            "priority": priority,
            "escalation_needed": escalation_needed,
            "vital_flags": vital_flags,
            "symptom_flags": symptom_flags,
            "clinical_advisory": (
                "EMERGENCY/HIGH Escalation: Provide immediate airway patency, position upright, "
                "administer supplemental oxygen if available, and prepare stabilization transfer."
                if escalation_needed else
                "Routine monitoring: Rehydrate, observe for red flag symptoms, follow-up in 24 hours."
            ),
            "key_factors": key_factors,
            "reasoning": reasoning
        }

        # Optional LLM polish
        prompt = (
            f"Patient Age: {patient.age}, Symptoms: {patient.symptoms}, "
            f"Vitals: SpO2={vitals.spo2}%, RR={vitals.respiratory_rate}, HR={vitals.heart_rate}, "
            f"BP={vitals.systolic_bp}/{vitals.diastolic_bp}, Temp={vitals.temperature}. "
            "Assign priority (LOW, MODERATE, HIGH, EMERGENCY), list vital flags and key factors."
        )
        llm_result = await llm_service.generate_structured_response("Triage Agent", prompt, fallback_output)

        meta = self.build_metadata(start_time)
        return TriageAgentOutput(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            status="escalated" if escalation_needed else "completed",
            execution_time_ms=meta["execution_time_ms"],
            timestamp=meta["timestamp"],
            reasoning=llm_result.get("reasoning", reasoning),
            key_factors=llm_result.get("key_factors", key_factors),
            requires_human_review=True,
            priority=llm_result.get("priority", priority),
            escalation_needed=llm_result.get("escalation_needed", escalation_needed),
            vital_flags=llm_result.get("vital_flags", vital_flags),
            symptom_flags=llm_result.get("symptom_flags", symptom_flags),
            clinical_advisory=llm_result.get("clinical_advisory", fallback_output["clinical_advisory"]),
            data={"spo2": vitals.spo2, "rr": vitals.respiratory_rate, "bp": f"{vitals.systolic_bp}/{vitals.diastolic_bp}"}
        )

triage_agent = TriageAgent()
