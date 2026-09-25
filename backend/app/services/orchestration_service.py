import time
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.models.patient import PatientProfile
from app.models.agent_schemas import CoordinatedCarePathway, CareTimelineTask
from app.agents.triage_agent import triage_agent
from app.agents.access_agent import access_agent
from app.agents.facility_agent import facility_agent
from app.agents.resource_agent import resource_agent
from app.agents.coordinator_agent import coordinator_agent
from app.agents.referral_agent import referral_agent
from app.agents.continuity_agent import continuity_agent

logger = logging.getLogger("curareach.orchestrator")

class OrchestrationService:
    def __init__(self):
        # In-memory store for pathways and timeline tasks for live interactivity
        self.pathways: Dict[str, CoordinatedCarePathway] = {}
        self.referrals: Dict[str, Dict[str, Any]] = {}

    async def execute_workflow(self, patient: PatientProfile) -> CoordinatedCarePathway:
        logger.info(f"Initiating 7-agent care workflow for patient {patient.id} ({patient.name})")

        # 1. Triage Agent
        triage_res = await triage_agent.run(patient)

        # 2. Access Intelligence Agent
        access_res = await access_agent.run(patient)

        # 3. Facility Agent
        facility_res = await facility_agent.run(patient, triage_res, access_res)

        # 4. Resource Agent
        resource_res = await resource_agent.run(patient, triage_res, facility_res)

        # 5. Coordinator Agent
        coordinator_res = await coordinator_agent.run(patient, triage_res, access_res, facility_res, resource_res)

        # 6. Referral Agent
        referral_res = await referral_agent.run(patient, triage_res, facility_res)

        # 7. Care Continuity Agent
        continuity_res = await continuity_agent.run(patient, triage_res, facility_res, referral_res)

        # Build execution summary
        summary = (
            f"Evaluated {patient.name} ({patient.age}y): Triage priority assessed as {triage_res.priority}. "
            f"Access intelligence established {access_res.access_risk} access barrier. "
            f"Facility matching identified {facility_res.selected_facility_name} ({facility_res.selected_facility_tier}). "
            f"{'Inter-facility referral initiated via 108 ambulance' if referral_res.referral_required else 'Care localized to primary facility'}. "
            f"Care continuity activated with {len(continuity_res.timeline_tasks)} longitudinal tasks."
        )

        pathway = CoordinatedCarePathway(
            patient_id=patient.id,
            patient_name=patient.name,
            triage_priority=triage_res.priority,
            access_risk=access_res.access_risk,
            recommended_facility=facility_res.selected_facility_name,
            referral_required=referral_res.referral_required,
            resource_status=resource_res.medicines_status,
            follow_up_target=continuity_res.next_review_target,
            human_verification_required=True,
            disclaimer="AI-generated decision support. Not a medical diagnosis. Human verification is required.",
            agents={
                "triage": triage_res.model_dump(),
                "access_intel": access_res.model_dump(),
                "facility_matcher": facility_res.model_dump(),
                "resource_verifier": resource_res.model_dump(),
                "coordinator": coordinator_res.model_dump(),
                "referral_coordinator": referral_res.model_dump(),
                "care_continuity": continuity_res.model_dump()
            },
            timeline=continuity_res.timeline_tasks,
            referral_slip=referral_res.referral_slip,
            execution_summary=summary,
            created_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        )

        self.pathways[patient.id] = pathway
        if referral_res.referral_slip:
            self.referrals[referral_res.referral_slip["referral_id"]] = referral_res.referral_slip

        return pathway

    def get_pathway(self, patient_id: str) -> Optional[CoordinatedCarePathway]:
        return self.pathways.get(patient_id)

    def update_timeline_task(self, patient_id: str, task_id: str, new_status: str) -> bool:
        pathway = self.pathways.get(patient_id)
        if not pathway:
            return False
        for task in pathway.timeline:
            if task.task_id == task_id:
                task.status = new_status
                return True
        return False

    def approve_referral(self, referral_id: str, doctor_name: str) -> Optional[Dict[str, Any]]:
        ref = self.referrals.get(referral_id)
        if ref:
            ref["status"] = "VERIFIED_BY_DOCTOR"
            ref["verified_by_doctor"] = doctor_name
            ref["verified_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
            return ref
        return None

orchestration_service = OrchestrationService()
