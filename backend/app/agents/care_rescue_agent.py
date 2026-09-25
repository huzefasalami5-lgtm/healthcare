"""Agent 4 — Care Rescue Agent (Section 6 & 8)
Generates follow-up tasks, monitors care milestones, detects stalled referrals and missed appointments,
and coordinates community worker navigation to prevent patients from falling through the cracks.
"""
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.agents.base_agent import BaseAgent
from app.models.case import ClinicalCase, CaseStatus
from app.models.care_rescue import FollowUpTask, TaskStatus, Notification
from app.models.referral import Appointment, AppointmentStatus
from app.state_machine.case_state_machine import case_state_machine

class CareRescueAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Agent 4: Care Rescue Agent",
            description="Follow-up task synthesis, missed appointment intervention, barrier tracking, and longitudinal care completion monitoring"
        )

    def on_appointment_confirmed(self, appointment: Appointment, db: Session) -> None:
        """Create appointment reminder and navigation tasks when appointment is confirmed"""
        case = appointment.case
        
        # 1. In-app reminder task for patient
        db.add(Notification(
            user_id=case.patient_id,
            case_id=case.id,
            title="Appointment Confirmed",
            message=f"Appointment scheduled at {appointment.hospital.name} on {appointment.scheduled_at} ({appointment.department_name}).",
            notification_type="ALERT"
        ))

        # 2. If patient has an assigned community worker or transport barrier, assign worker navigation task
        if case.assigned_worker_id or (case.patient.patient_profile and case.patient.patient_profile.transport_access_barrier):
            task = FollowUpTask(
                case_id=case.id,
                assigned_worker_id=case.assigned_worker_id,
                assigned_patient_id=case.patient_id,
                task_type="APPOINTMENT_REMINDER",
                description=f"Assist patient with route navigation and hospital desk check-in for appointment on {appointment.scheduled_at} at {appointment.hospital.name}.",
                due_date=appointment.scheduled_at,
                status=TaskStatus.PENDING
            )
            db.add(task)
            
            if case.assigned_worker_id:
                db.add(Notification(
                    user_id=case.assigned_worker_id,
                    case_id=case.id,
                    title="New Navigation Task",
                    message=f"Patient {case.patient.full_name} has confirmed appointment on {appointment.scheduled_at}. Assist with travel/entry.",
                    notification_type="INFO"
                ))
        db.commit()

    def handle_missed_appointment(self, appointment: Appointment, reported_by_user_id: str, reported_role: str, db: Session) -> None:
        """Rescue workflow when patient is marked as missed/no-show"""
        case = appointment.case
        appointment.status = AppointmentStatus.MISSED
        appointment.arrival_status = "NOT_ARRIVED"

        # Transition state: APPOINTMENT_CONFIRMED -> APPOINTMENT_MISSED -> FOLLOW_UP_PENDING
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.APPOINTMENT_MISSED,
            actor_role=reported_role,
            actor_user_id=reported_by_user_id,
            transition_event="PATIENT_MISSED_APPOINTMENT",
            evidence_notes="Patient did not attend scheduled consultation slot",
            db=db
        )

        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.FOLLOW_UP_PENDING,
            actor_role="SYSTEM",
            actor_user_id=reported_by_user_id,
            transition_event="CARE_RESCUE_ACTIVATED",
            evidence_notes="Generated urgent domiciliary follow-up task to investigate barrier and re-book",
            db=db
        )

        # Create urgent rescue task for community worker
        rescue_task = FollowUpTask(
            case_id=case.id,
            assigned_worker_id=case.assigned_worker_id,
            assigned_patient_id=case.patient_id,
            task_type="STALLED_RESCUE",
            description="URGENT: Patient missed hospital appointment. Conduct outreach to identify transport, financial, or clinical barriers.",
            status=TaskStatus.PENDING
        )
        db.add(rescue_task)

        # Notify Patient
        db.add(Notification(
            user_id=case.patient_id,
            case_id=case.id,
            title="Missed Appointment Support",
            message="We noticed you couldn't make your hospital visit. A CuraReach coordinator is available to help reschedule and assist with transport.",
            notification_type="ALERT"
        ))
        db.commit()

    def on_care_encounter_reported(
        self,
        case: ClinicalCase,
        consultation_notes: str,
        discharge_instructions: Optional[str],
        reported_by_staff_id: str,
        db: Session
    ) -> None:
        """Create post-encounter monitoring and medication review tasks"""
        # Transition: CARE_ENCOUNTER_REPORTED -> FOLLOW_UP_PENDING
        if case.current_state != CaseStatus.CARE_ENCOUNTER_REPORTED:
            case_state_machine.transition(
                case=case,
                to_state=CaseStatus.CARE_ENCOUNTER_REPORTED,
                actor_role="HOSPITAL_STAFF",
                actor_user_id=reported_by_staff_id,
                transition_event="HOSPITAL_LOGGED_CONSULTATION",
                evidence_notes=f"Clinical consultation recorded: {consultation_notes}",
                db=db
            )

        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.FOLLOW_UP_PENDING,
            actor_role="SYSTEM",
            actor_user_id=reported_by_staff_id,
            transition_event="POST_ENCOUNTER_MONITORING_INITIATED",
            evidence_notes="Follow-up checklist instantiated for medication compliance and recovery tracking",
            db=db
        )

        # Create follow-up tasks
        task1 = FollowUpTask(
            case_id=case.id,
            assigned_worker_id=case.assigned_worker_id,
            assigned_patient_id=case.patient_id,
            task_type="POST_VISIT_CHECK",
            description=f"48-Hour Recovery Verification: Check symptom resolution post-hospital consultation. Instructions: {discharge_instructions or 'Take prescribed medication'}",
            status=TaskStatus.PENDING
        )
        task2 = FollowUpTask(
            case_id=case.id,
            assigned_worker_id=case.assigned_worker_id,
            assigned_patient_id=case.patient_id,
            task_type="MEDICATION_VERIFICATION",
            description="Verify patient obtained prescribed medications and understands dosing instructions.",
            status=TaskStatus.PENDING
        )
        db.add_all([task1, task2])

        db.add(Notification(
            user_id=case.patient_id,
            case_id=case.id,
            title="Hospital Visit Documented",
            message=f"Your visit was recorded. Follow-up instructions: {discharge_instructions or 'Continue prescribed care'}",
            notification_type="INFO"
        ))
        db.commit()

care_rescue_agent = CareRescueAgent()
