"""Agent 2 — Care Intelligence Agent (Section 6)
Analyzes clinician-reviewed requirements, patient location, transport/financial barriers,
and verified hospital profiles to recommend clinically suitable facilities with explainable 'WHY' rationales.
"""
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.agents.base_agent import BaseAgent
from app.models.hospital import Hospital

class CareIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Agent 2: Care Intelligence Agent",
            description="Specialty matching, physical accessibility scoring, explainable facility ranking, and alternative discovery"
        )

    def match_facilities(
        self,
        specialty: str,
        urgency: str,
        patient_district: str = "Shivamogga",
        has_transport_barrier: bool = False,
        has_financial_barrier: bool = False,
        exclude_hospital_ids: Optional[List[str]] = None,
        case_id: Optional[str] = None,
        db: Optional[Session] = None
    ) -> List[Dict[str, Any]]:
        start_time = time.time()
        exclude_hospital_ids = exclude_hospital_ids or []

        if db is None:
            return []

        # Query verified active hospitals only (Section 9)
        query = db.query(Hospital).filter(
            Hospital.is_active == True,
            Hospital.verification_status == "VERIFIED"
        )
        if exclude_hospital_ids:
            query = query.filter(~Hospital.id.in_(exclude_hospital_ids))

        hospitals = query.all()
        scored_options: List[Dict[str, Any]] = []

        for hosp in hospitals:
            # Check specialty match
            dept_names = [d.name.lower() for d in hosp.departments if d.is_active]
            specialty_lower = specialty.lower()
            
            has_exact_specialty = any(specialty_lower in d for d in dept_names)
            has_general = any("general medicine" in d or "emergency" in d for d in dept_names)
            
            if not has_exact_specialty and not has_general:
                continue  # Skip facilities unable to handle this specialty

            # Calculate match score
            score = 70.0
            reasons = []

            if has_exact_specialty:
                score += 20.0
                reasons.append(f"Dedicated {specialty} department with on-duty clinical team")
            elif has_general:
                score += 5.0
                reasons.append(f"General Medicine department equipped for stabilization and triage")

            # District proximity
            is_same_district = hosp.district.lower() == patient_district.lower()
            if is_same_district:
                score += 10.0
                distance_est = "Approx 8 - 14 km (Within District)"
                reasons.append(f"Located in patient's home district ({hosp.district})")
            else:
                distance_est = "Approx 35 - 55 km (Neighboring District)"
                reasons.append(f"Higher-tier regional referral center outside district ({hosp.district})")

            # Bed availability check (manually maintained)
            if hosp.available_beds > 5:
                score += 5.0
                reasons.append(f"Reported available inpatient capacity ({hosp.available_beds} beds reported)")
            elif hosp.available_beds <= 0:
                score -= 15.0
                reasons.append("Warning: Facility reports zero available inpatient beds")

            # Barrier considerations
            if has_transport_barrier:
                if is_same_district:
                    score += 5.0
                    reasons.append("Prioritized due to patient-reported transit/road access constraints")
                else:
                    score -= 10.0
                    reasons.append("Transit obstacle: Patient flagged transport difficulty for inter-district travel")

            # Data freshness warning
            freshness_text = "Manually logged operational profile. Confirm bed reservation with admissions upon dispatch."
            if hosp.last_capacity_update:
                freshness_text = f"Capacity last updated: {hosp.last_capacity_update.strftime('%d-%b-%Y %H:%M')}. Not an automated IoT feed."

            final_score = min(100.0, max(30.0, score))

            scored_options.append({
                "hospital_id": hosp.id,
                "hospital_name": hosp.name,
                "facility_type": hosp.facility_type,
                "district": hosp.district,
                "address": hosp.address,
                "contact_phone": hosp.contact_phone,
                "contact_email": hosp.contact_email,
                "available_beds": hosp.available_beds,
                "has_icu": hosp.has_icu,
                "has_oxygen_manifold": hosp.has_oxygen_manifold,
                "capability_score": round(final_score, 1),
                "distance_estimate": distance_est,
                "match_reasons": reasons,
                "freshness_warning": freshness_text,
                "is_alternative": len(exclude_hospital_ids) > 0
            })

        # Sort highest capability score first
        scored_options.sort(key=lambda x: x["capability_score"], reverse=True)

        duration_ms = int((time.time() - start_time) * 1000)

        # Log auditable agent execution
        self.log_execution(
            case_id=case_id,
            input_summary=f"Specialty: '{specialty}', Urgency: {urgency}, District: {patient_district}, TransportBarrier: {has_transport_barrier}, Excluded: {len(exclude_hospital_ids)}",
            output_summary=f"Matched {len(scored_options)} facilities. Top match: {scored_options[0]['hospital_name'] if scored_options else 'None'}",
            duration_ms=duration_ms,
            is_deterministic=True,
            db=db
        )

        return scored_options

care_intelligence_agent = CareIntelligenceAgent()
