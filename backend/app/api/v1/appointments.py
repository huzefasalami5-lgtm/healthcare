"""Appointment Confirmation, Attendance Logging, and Care Encounter Reporting (Section 8 Step 10 & 11)"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles, Role
from app.models.user import User
from app.models.case import ClinicalCase, CaseStatus
from app.models.referral import Referral, Appointment, AppointmentStatus
from app.state_machine.case_state_machine import case_state_machine
from app.agents.care_rescue_agent import care_rescue_agent
from app.schemas import ConfirmAppointmentRequest, CareEncounterReportRequest

router = APIRouter(prefix="/appointments", tags=["Appointments & Care Encounters"])

@router.post("/{referral_id}/confirm")
def confirm_appointment(
    referral_id: str,
    req: ConfirmAppointmentRequest,
    current_user: User = Depends(require_roles(Role.HOSPITAL_STAFF, Role.CLINICIAN, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found.")

    case = referral.case

    # Upsert Appointment
    appt = referral.appointment
    if not appt:
        appt = Appointment(
            referral_id=referral.id,
            case_id=case.id,
            hospital_id=referral.hospital_id,
            scheduled_at=req.scheduled_at,
            department_name=req.department_name or referral.target_department,
            doctor_name=req.doctor_name or "Specialist In-Charge",
            status=AppointmentStatus.CONFIRMED,
            arrival_status="PENDING"
        )
        db.add(appt)
    else:
        appt.scheduled_at = req.scheduled_at
        appt.department_name = req.department_name or referral.target_department
        appt.doctor_name = req.doctor_name or appt.doctor_name
        appt.status = AppointmentStatus.CONFIRMED

    db.commit()
    db.refresh(appt)

    # Transition state: REFERRAL_ACCEPTED -> APPOINTMENT_CONFIRMED
    case_state_machine.transition(
        case=case,
        to_state=CaseStatus.APPOINTMENT_CONFIRMED,
        actor_role=current_user.role,
        actor_user_id=current_user.id,
        transition_event="APPOINTMENT_CONFIRMED_BY_HOSPITAL",
        evidence_notes=f"Confirmed for {req.scheduled_at} with {appt.doctor_name} ({appt.department_name})",
        db=db
    )

    # Trigger Care Rescue Agent: reminders & worker navigation
    care_rescue_agent.on_appointment_confirmed(appt, db)

    return {
        "message": "Appointment confirmed and care rescue alerts generated.",
        "appointment_id": appt.id,
        "case_state": case.current_state,
        "scheduled_at": appt.scheduled_at
    }

@router.post("/{appointment_id}/status")
def update_encounter_status(
    appointment_id: str,
    req: CareEncounterReportRequest,
    current_user: User = Depends(require_roles(Role.HOSPITAL_STAFF, Role.CLINICIAN, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    """Step 11: Record patient arrival or missed appointment with clinical consultation notes"""
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    case = appt.case

    if req.arrival_status == "ARRIVED":
        appt.arrival_status = "ARRIVED"
        appt.status = AppointmentStatus.COMPLETED
        appt.consultation_notes = req.consultation_notes
        appt.discharge_instructions = req.discharge_instructions
        appt.attendance_logged_at = datetime.now(timezone.utc)
        db.commit()

        # Trigger Care Rescue post-encounter follow-up
        care_rescue_agent.on_care_encounter_reported(
            case=case,
            consultation_notes=req.consultation_notes,
            discharge_instructions=req.discharge_instructions,
            reported_by_staff_id=current_user.id,
            db=db
        )
        return {"message": "Patient encounter documented and follow-up monitoring tasks created.", "case_state": case.current_state}

    elif req.arrival_status == "NOT_ARRIVED":
        # Handle missed appointment
        care_rescue_agent.handle_missed_appointment(
            appointment=appt,
            reported_by_user_id=current_user.id,
            reported_role=current_user.role,
            db=db
        )
        return {"message": "Missed appointment recorded. Rescue protocol dispatched to community worker.", "case_state": case.current_state}

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid arrival status: {req.arrival_status}")
