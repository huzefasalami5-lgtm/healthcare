"""Hospital Dashboard Operations, Referral Queues, and Capacity Endpoints (Section 3D & 9)"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles, Role
from app.models.user import User
from app.models.hospital import Hospital, HospitalDepartment
from app.models.referral import Referral, Appointment
from app.schemas import HospitalCapacityUpdateRequest

router = APIRouter(prefix="/hospitals", tags=["Hospital Operations"])

@router.get("/profile")
def get_my_hospital_profile(
    current_user: User = Depends(require_roles(Role.HOSPITAL_STAFF, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    hospital_id = current_user.organization_id
    if not hospital_id and current_user.role == Role.CURAREACH_ADMIN:
        # Default to first hospital for admin
        h = db.query(Hospital).first()
        hospital_id = h.id if h else None

    if not hospital_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hospital assigned to this account.")

    hosp = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")

    return {
        "id": hosp.id,
        "name": hosp.name,
        "facility_type": hosp.facility_type,
        "address": hosp.address,
        "district": hosp.district,
        "contact_phone": hosp.contact_phone,
        "contact_email": hosp.contact_email,
        "verification_status": hosp.verification_status,
        "total_beds": hosp.total_beds,
        "available_beds": hosp.available_beds,
        "has_icu": hosp.has_icu,
        "has_oxygen_manifold": hosp.has_oxygen_manifold,
        "last_capacity_update": hosp.last_capacity_update.isoformat() if hosp.last_capacity_update else None,
        "operating_hours": hosp.operating_hours,
        "departments": [{"id": d.id, "name": d.name, "head_doctor": d.head_doctor} for d in hosp.departments if d.is_active]
    }

@router.put("/capacity")
def update_hospital_capacity(
    req: HospitalCapacityUpdateRequest,
    current_user: User = Depends(require_roles(Role.HOSPITAL_STAFF, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    hospital_id = current_user.organization_id
    if not hospital_id and current_user.role == Role.CURAREACH_ADMIN:
        h = db.query(Hospital).first()
        hospital_id = h.id if h else None

    hosp = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")

    hosp.total_beds = req.total_beds
    hosp.available_beds = req.available_beds
    hosp.has_icu = req.has_icu
    hosp.has_oxygen_manifold = req.has_oxygen_manifold
    if req.operating_hours:
        hosp.operating_hours = req.operating_hours
    hosp.last_capacity_update = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Hospital operational capacity updated successfully.", "last_updated": hosp.last_capacity_update.isoformat()}

@router.get("/referrals")
def get_incoming_referrals(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles(Role.HOSPITAL_STAFF, Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    """Incoming referral queue with strict organization isolation (Section 19 test requirement)"""
    hospital_id = current_user.organization_id
    if not hospital_id and current_user.role == Role.CURAREACH_ADMIN:
        # Admin can view all
        query = db.query(Referral)
    else:
        query = db.query(Referral).filter(Referral.hospital_id == hospital_id)

    if status_filter:
        query = query.filter(Referral.status == status_filter)

    referrals = query.order_by(Referral.sent_at.desc()).all()
    return [
        {
            "id": r.id,
            "case_id": r.case_id,
            "case_number": r.case.case_number if r.case else "",
            "patient_name": r.case.patient.full_name if r.case and r.case.patient else "Patient",
            "patient_phone": r.case.patient.phone if r.case and r.case.patient else "",
            "patient_district": r.case.patient.patient_profile.district if r.case and r.case.patient and r.case.patient.patient_profile else "Shivamogga",
            "primary_complaint": r.case.primary_complaint if r.case else "",
            "referral_reason": r.referral_reason,
            "target_department": r.target_department,
            "urgency": r.urgency,
            "status": r.status,
            "is_alternative": r.is_alternative,
            "sent_at": r.sent_at.isoformat() if r.sent_at else None,
            "appointment": {
                "id": r.appointment.id,
                "scheduled_at": r.appointment.scheduled_at,
                "doctor_name": r.appointment.doctor_name,
                "department": r.appointment.department_name,
                "status": r.appointment.status,
                "arrival_status": r.appointment.arrival_status
            } if r.appointment else None
        } for r in referrals
    ]
