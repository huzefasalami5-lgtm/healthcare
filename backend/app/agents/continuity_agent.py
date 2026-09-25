import time
import uuid
from typing import Dict, Any, List
from app.agents.base_agent import BaseAgent
from app.models.patient import PatientProfile
from app.models.agent_schemas import (
    TriageAgentOutput, FacilityAgentOutput, ReferralAgentOutput,
    CareTimelineTask, ContinuityAgentOutput
)
from app.services.llm_service import llm_service

class ContinuityAgent(BaseAgent):
    def __init__(self):
        super().__init__("care_continuity", "Care Continuity Agent")

    async def run(
        self,
        patient: PatientProfile,
        triage_out: TriageAgentOutput,
        facility_out: FacilityAgentOutput,
        referral_out: ReferralAgentOutput
    ) -> ContinuityAgentOutput:
        start_time = time.time()

        priority = triage_out.priority
        is_referral = referral_out.referral_required
        dest_name = facility_out.selected_facility_name

        timeline: List[CareTimelineTask] = []

        # 1. Assessment Task (Completed)
        timeline.append(CareTimelineTask(
            task_id=f"TASK-{uuid.uuid4().hex[:6].upper()}",
            phase="Assessment",
            title="Initial Community & Primary Vitals Assessment",
            description=f"Recorded SpO2 ({patient.vitals.spo2}%), HR ({patient.vitals.heart_rate}), RR ({patient.vitals.respiratory_rate}), and symptoms at {patient.location}.",
            owner="Primary Care Nurse / CHO",
            due_in="Completed",
            status="completed",
            verification_required=False
        ))

        # 2. Triage & Decision Support (Completed)
        timeline.append(CareTimelineTask(
            task_id=f"TASK-{uuid.uuid4().hex[:6].upper()}",
            phase="Triage",
            title=f"Multi-Agent Risk Stratification: {priority}",
            description=f"Triage agent flagged vital concerns. Clinical decision support verified by system.",
            owner="CuraReach AI Decision Support",
            due_in="Completed",
            status="completed",
            verification_required=True
        ))

        # 3. Transfer or Stabilization Phase
        if is_referral:
            timeline.append(CareTimelineTask(
                task_id=f"TASK-{uuid.uuid4().hex[:6].upper()}",
                phase="Referral & Transfer",
                title=f"108 ALS Ambulance Dispatch to {dest_name}",
                description=f"Pre-hospital stabilization with high-flow oxygen. Transmit referral slip {referral_out.data.get('referral_id', 'REF-001')}.",
                owner="Ambulance Emergency Medical Tech (EMT)",
                due_in="Within 30 mins",
                status="in_progress",
                verification_required=True
            ))
            timeline.append(CareTimelineTask(
                task_id=f"TASK-{uuid.uuid4().hex[:6].upper()}",
                phase="Consultation",
                title=f"Emergency Ward Intake & Specialist Review at {dest_name}",
                description=f"Direct triage to Pulmonology / ICU bed. Perform emergency Chest X-Ray and ABG.",
                owner="District Hospital Specialist Team",
                due_in="Within 2 hours",
                status="pending",
                verification_required=True
            ))
        else:
            timeline.append(CareTimelineTask(
                task_id=f"TASK-{uuid.uuid4().hex[:6].upper()}",
                phase="Consultation",
                title=f"Primary Medical Officer Consultation at {dest_name}",
                description=f"Prescription of oral antibiotics/antipyretics and rehydration therapy.",
                owner="PHC Medical Officer",
                due_in="Today",
                status="in_progress",
                verification_required=True
            ))

        # 4. Post-Discharge / Community Follow-up Phase
        timeline.append(CareTimelineTask(
            task_id=f"TASK-{uuid.uuid4().hex[:6].upper()}",
            phase="Follow-Up",
            title="Organisation Community Worker 48-Hour Domiciliary Check",
            description=f"Visit patient household in {patient.location}. Verify medication adherence, check SpO2 & temperature, and inspect for red flags.",
            owner="Community Worker (Appointed by Organisation)",
            due_in="48 hours post-admission",
            status="pending",
            verification_required=True
        ))

        timeline.append(CareTimelineTask(
            task_id=f"TASK-{uuid.uuid4().hex[:6].upper()}",
            phase="Follow-Up",
            title="7-Day Primary Care Tele-Review & Case Closure",
            description=f"Confirm resolution of symptoms ({', '.join(patient.symptoms[:2])}) and update Ayushman Bharat Health Account (ABHA) record.",
            owner="Medical Officer / Telemedicine Cell",
            due_in="Day 7",
            status="pending",
            verification_required=True
        ))

        asha_checklist = [
            f"Locate patient in {patient.location} (Household verification)",
            "Measure resting SpO2 using field pulse oximeter (Goal: > 95%)",
            "Verify all prescribed medicines are being taken on schedule",
            "Inquire about recurrence of fever or breathing distress",
            "Report immediately if breathing rate exceeds 24 breaths/min"
        ]

        sms_message = (
            f"Namaskara, CuraReach Health Alert for {patient.name}: Your coordinated care pathway to "
            f"{dest_name} is active. 108 Emergency services alerted. Organisation community health worker will visit in 48h. "
            "Helpline: 104 / 108."
        )

        reasoning = (
            f"Established unbroken care continuum spanning acute stabilization at {dest_name} "
            f"down to community-level organisation worker visits in {patient.location}. Follow-up timeline prevents "
            f"lost-to-followup and ensures early detection of post-acute complications."
        )

        fallback_output = {
            "timeline_tasks": [t.model_dump() for t in timeline],
            "asha_action_checklist": asha_checklist,
            "patient_telephony_sms": sms_message,
            "next_review_target": "48 Hours post-triage",
            "follow_up_frequency": "Every 48 hours until symptom resolution",
            "key_factors": [
                f"Timeline Milestones: {len(timeline)}",
                "Community Worker 48h Home Visit Scheduled",
                "Automated Telephony Notification Generated",
                f"Continuity Status: Active"
            ],
            "reasoning": reasoning
        }

        prompt = (
            f"Patient: {patient.name}, Pathway: {dest_name}, Priority: {priority}. "
            "Synthesize organisation community worker checklist, patient SMS, and follow-up frequency."
        )
        llm_result = await llm_service.generate_structured_response("Care Continuity Agent", prompt, fallback_output)

        meta = self.build_metadata(start_time)
        return ContinuityAgentOutput(
            agent_id=self.agent_id,
            agent_name=self.agent_name,
            status="completed",
            execution_time_ms=meta["execution_time_ms"],
            timestamp=meta["timestamp"],
            reasoning=llm_result.get("reasoning", reasoning),
            key_factors=fallback_output["key_factors"],
            requires_human_review=True,
            timeline_tasks=timeline,
            asha_action_checklist=llm_result.get("asha_action_checklist", asha_checklist),
            patient_telephony_sms=llm_result.get("patient_telephony_sms", sms_message),
            next_review_target="48 Hours post-triage",
            follow_up_frequency="Every 48 hours until symptom resolution",
            data={
                "total_tasks": len(timeline),
                "asha_checklist_items": len(asha_checklist)
            }
        )

continuity_agent = ContinuityAgent()
