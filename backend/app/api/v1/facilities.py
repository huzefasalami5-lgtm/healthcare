"""Facility catalog and Care Intelligence Matching (Section 6 & 8)"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.case import ClinicalCase
from app.models.hospital import Hospital
from app.models.referral import Referral
from app.agents.care_intelligence_agent import care_intelligence_agent

router = APIRouter(prefix="/facilities", tags=["Facility Intelligence"])

@router.get("/")
def list_facilities(
    district: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Hospital).filter(
        Hospital.is_active == True,
        Hospital.verification_status == "VERIFIED"
    )
    if district:
        query = query.filter(Hospital.district.ilike(f"%{district}%"))
    
    hospitals = query.all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "facility_type": h.facility_type,
            "address": h.address,
            "district": h.district,
            "contact_phone": h.contact_phone,
            "contact_email": h.contact_email,
            "total_beds": h.total_beds,
            "available_beds": h.available_beds,
            "has_icu": h.has_icu,
            "has_oxygen_manifold": h.has_oxygen_manifold,
            "last_capacity_update": h.last_capacity_update.isoformat() if h.last_capacity_update else None,
            "operating_hours": h.operating_hours,
            "departments": [d.name for d in h.departments if d.is_active]
        } for h in hospitals
    ]

@router.get("/match/{case_id}")
def match_facilities_for_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger Agent 2 (Care Intelligence Agent) to identify clinically suitable facilities"""
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    specialty = case.triage.recommended_specialty if case.triage else "General Medicine"
    urgency = case.confirmed_urgency or case.provisional_urgency
    district = case.patient.patient_profile.district if case.patient and case.patient.patient_profile else "Shivamogga"
    has_transport = case.patient.patient_profile.transport_access_barrier if case.patient and case.patient.patient_profile else False
    has_financial = case.patient.patient_profile.financial_barrier if case.patient and case.patient.patient_profile else False

    # Exclude hospitals that already declined this case
    declined_referrals = db.query(Referral).filter(
        Referral.case_id == case.id,
        Referral.status == "DECLINED"
    ).all()
    excluded_ids = [r.hospital_id for r in declined_referrals]

    matches = care_intelligence_agent.match_facilities(
        specialty=specialty,
        urgency=urgency,
        patient_district=district,
        has_transport_barrier=has_transport,
        has_financial_barrier=has_financial,
        exclude_hospital_ids=excluded_ids,
        case_id=case.id,
        db=db
    )

    return {
        "case_id": case.id,
        "specialty": specialty,
        "urgency": urgency,
        "patient_district": district,
        "has_transport_barrier": has_transport,
        "excluded_declined_count": len(excluded_ids),
        "matches": matches
    }
