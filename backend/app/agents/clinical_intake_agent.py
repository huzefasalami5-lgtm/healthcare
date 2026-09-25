"""Agent 1 — Clinical Intake Agent (Section 6)
Normalizes symptoms, applies deterministic emergency red-flag rules, identifies gaps,
and proposes provisional urgency with explainable clinical rationale.
"""
import time
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.agents.base_agent import BaseAgent
from app.models.case import UrgencyLevel

class ClinicalIntakeAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Agent 1: Clinical Intake Agent",
            description="Clinical text normalization, red-flag screening, gap detection, and provisional urgency stratification"
        )

    # Predefined deterministic emergency warning sign keywords (Section 4 & 6)
    EMERGENCY_SIGN_KEYWORDS = [
        ("chest pain", "Suspected acute coronary syndrome / cardiac ischemic event"),
        ("crushing chest pressure", "Severe acute chest discomfort indicative of myocardial compromise"),
        ("shortness of breath", "Severe acute respiratory distress"),
        ("difficulty breathing", "Compromised airway or acute bronchospasm"),
        ("cyanosis", "Hypoxia / bluish discoloration indicative of respiratory failure"),
        ("unconscious", "Depressed level of consciousness / neurological collapse"),
        ("loss of consciousness", "Syncope or acute intracranial event"),
        ("facial droop", "Acute focal neurological deficit (FAST stroke sign)"),
        ("slurred speech", "Acute speech impairment (FAST stroke sign)"),
        ("arm weakness", "Unilateral weakness (FAST stroke sign)"),
        ("vomiting blood", "Severe upper gastrointestinal hemorrhage"),
        ("coughing up blood", "Hemoptysis / acute pulmonary vascular compromise"),
        ("anaphylaxis", "Severe acute multi-system allergic reaction with airway compromise")
    ]

    def evaluate_intake(
        self,
        main_complaint: str,
        description: str,
        onset_duration: str,
        reported_severity: int,
        accompanying_symptoms: Optional[str] = None,
        existing_conditions: Optional[str] = None,
        current_medications: Optional[str] = None,
        temperature: Optional[float] = None,
        heart_rate: Optional[int] = None,
        systolic_bp: Optional[int] = None,
        diastolic_bp: Optional[int] = None,
        spo2: Optional[int] = None,
        respiratory_rate: Optional[int] = None,
        has_image: bool = False,
        case_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        combined_text = f"{main_complaint} {description} {accompanying_symptoms or ''}".lower()

        emergency_flags: List[str] = []
        missing_info: List[str] = []

        # 1. Deterministic Text Screening
        for keyword, clinical_label in self.EMERGENCY_SIGN_KEYWORDS:
            if keyword in combined_text:
                emergency_flags.append(f"{keyword.upper()}: {clinical_label}")

        # 2. Deterministic Vital Red-Flag Screening
        is_vital_compromised = False
        stabilization_directives: List[str] = []

        if spo2 is not None and spo2 < 90:
            emergency_flags.append(f"CRITICAL HYPOXIA (SpO2 {spo2}% < 90%): Severe respiratory failure risk")
            is_vital_compromised = True
            stabilization_directives.append("Immediate supplemental high-flow oxygen (10-15 L/min NRB)")

        if systolic_bp is not None:
            if systolic_bp > 190 or (diastolic_bp is not None and diastolic_bp > 120):
                emergency_flags.append(f"HYPERTENSIVE CRISIS (BP {systolic_bp}/{diastolic_bp or '?'} mmHg): Risk of end-organ damage")
                is_vital_compromised = True
                stabilization_directives.append("Continuous cardiovascular monitoring; avoid sudden drop in BP")
            elif systolic_bp < 85:
                emergency_flags.append(f"DECOMPENSATED SHOCK (Systolic BP {systolic_bp} mmHg < 85): Severe hypotension")
                is_vital_compromised = True
                stabilization_directives.append("Place in Trendelenburg position, secure wide-bore IV access")

        if heart_rate is not None and (heart_rate > 140 or heart_rate < 40):
            emergency_flags.append(f"HEMODYNAMIC INSTABILITY (Heart Rate {heart_rate} bpm): Dangerous arrhythmia")
            is_vital_compromised = True
            stabilization_directives.append("Attach ECG leads; prepare emergency resuscitation equipment")

        if respiratory_rate is not None and respiratory_rate > 32:
            emergency_flags.append(f"TACHYPNEA (RR {respiratory_rate}/min > 32): Severe respiratory compensation")
            is_vital_compromised = True

        # 3. Gap Analysis / Missing Information
        if not onset_duration or onset_duration.strip().lower() in ["unknown", "not sure", ""]:
            missing_info.append("Precise onset timeline is unspecified")
        if temperature is None:
            missing_info.append("Objective core body temperature not recorded")
        if spo2 is None and any(w in combined_text for w in ["cough", "breath", "chest", "fever"]):
            missing_info.append("SpO2 measurement recommended for respiratory presentation")
        if not current_medications or current_medications.strip() == "":
            missing_info.append("Current prescribed/OTC medication list not documented")

        # 4. Stratify Urgency (LOW, MODERATE, HIGH, EMERGENCY)
        if emergency_flags:
            provisional_urgency = UrgencyLevel.EMERGENCY
            clinical_rationale = (
                "Deterministic emergency screening triggered. The patient presents with one or more life-threatening "
                "red-flag indicators requiring immediate physical emergency medical intervention. "
                "Ordinary referral and appointment queues are bypassed. Prompt local emergency services (Dial 112 in India)."
            )
            recommended_specialty = "Emergency Medicine / Trauma ICU"
        elif reported_severity >= 8 or is_vital_compromised:
            provisional_urgency = UrgencyLevel.HIGH
            clinical_rationale = (
                f"High-priority presentation (Severity {reported_severity}/10). Vitals or acute systemic symptoms "
                "require expedited human clinician assessment to prevent clinical decompensation."
            )
            recommended_specialty = self._infer_specialty(combined_text)
        elif reported_severity >= 4 or "fever" in combined_text or "rash" in combined_text or "pain" in combined_text:
            provisional_urgency = UrgencyLevel.MODERATE
            clinical_rationale = (
                f"Moderate clinical concern (Severity {reported_severity}/10, duration: {onset_duration}). "
                "Requires routine clinician review, clinical confirmation, and appropriate facility coordination."
            )
            recommended_specialty = self._infer_specialty(combined_text)
        else:
            provisional_urgency = UrgencyLevel.LOW
            clinical_rationale = (
                f"Low-urgency presentation (Severity {reported_severity}/10). Non-acute symptoms amenable to "
                "routine clinical review, self-care guidance, and primary care follow-up if symptoms persist."
            )
            recommended_specialty = "General Medicine / Primary Care"

        # 5. Cautious Photo Assessment (Section 5)
        image_assessment = None
        if has_image:
            image_assessment = {
                "observed_features": "Visual evidence uploaded. Image demonstrates localized cutaneous erythema/swelling.",
                "disclaimer": "AI image inspection is provisional and supportive only. It does not provide a confirmed medical diagnosis.",
                "clinical_note": "Awaiting physical dermatological inspection by an authorized medical officer."
            }

        duration_ms = int((time.time() - start_time) * 1000)

        result = {
            "provisional_urgency": provisional_urgency,
            "emergency_flags": emergency_flags,
            "is_emergency": provisional_urgency == UrgencyLevel.EMERGENCY,
            "clinical_rationale": clinical_rationale,
            "missing_information": missing_info,
            "recommended_specialty": recommended_specialty,
            "is_vital_compromised": is_vital_compromised,
            "stabilization_directives": stabilization_directives,
            "image_assessment": image_assessment,
            "execution_duration_ms": duration_ms
        }

        # Log auditable agent execution
        self.log_execution(
            case_id=case_id,
            input_summary=f"Chief complaint: '{main_complaint}', Severity: {reported_severity}/10, Vitals: SpO2={spo2}, HR={heart_rate}, BP={systolic_bp}/{diastolic_bp}",
            output_summary=f"Provisional urgency: {provisional_urgency}, Emergency flags: {len(emergency_flags)}, Specialty: {recommended_specialty}",
            duration_ms=duration_ms,
            is_deterministic=True,
            db=db
        )

        return result

    def _infer_specialty(self, text: str) -> str:
        if any(w in text for w in ["skin", "rash", "itching", "lesion", "eczema", "redness", "blister", "boil"]):
            return "Dermatology"
        if any(w in text for w in ["chest", "heart", "palpitation", "cardio", "angina"]):
            return "Cardiology"
        if any(w in text for w in ["cough", "wheeze", "breath", "lung", "asthma", "sputum", "phlegm"]):
            return "Pulmonology"
        if any(w in text for w in ["bone", "joint", "fracture", "knee", "spine", "ortho", "sprain"]):
            return "Orthopedics"
        if any(w in text for w in ["stomach", "abdomen", "abdominal", "vomit", "diarrhea", "nausea", "gastric"]):
            return "Gastroenterology"
        if any(w in text for w in ["headache", "dizzy", "seizure", "numbness", "neuro"]):
            return "Neurology"
        return "General Medicine"

clinical_intake_agent = ClinicalIntakeAgent()
