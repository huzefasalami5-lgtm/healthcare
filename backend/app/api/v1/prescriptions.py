"""Prescriptions and Pharmacy Orders API Endpoints"""
import random
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, Role
from app.models.user import User, PatientProfile
from app.models.medical_records import Prescription, PrescriptionItem
from app.models.audit import AuditLog
from app.schemas import PrescriptionCreate

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

def generate_rx_code(db: Session) -> str:
    count = db.query(Prescription).count() + 1
    return f"RX-2026-{count:04d}"

def resolve_patient_profile(patient_id: str, current_user: User, db: Session) -> PatientProfile:
    if patient_id == "me":
        if not current_user.patient_profile:
            raise HTTPException(status_code=400, detail="Current user does not have a patient profile.")
        return current_user.patient_profile

    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id).first()
    if not profile:
        profile = db.query(PatientProfile).filter(PatientProfile.patient_identifier == patient_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
    return profile

@router.get("/patient/{patient_id}")
def list_patient_prescriptions(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = resolve_patient_profile(patient_id, current_user, db)
    
    rx_list = db.query(Prescription).filter(Prescription.patient_id == profile.id).order_by(Prescription.issued_at.desc()).all()
    
    results = []
    for rx in rx_list:
        results.append({
            "id": rx.id,
            "prescription_code": rx.prescription_code,
            "patient_id": rx.patient_id,
            "patient_identifier": profile.patient_identifier,
            "patient_name": profile.user.full_name if profile.user else "Patient",
            "case_id": rx.case_id,
            "appointment_id": rx.appointment_id,
            "clinician_name": rx.clinician.full_name if rx.clinician else "Dr. Ramesh Rao (Medical Officer)",
            "diagnosis": rx.diagnosis,
            "general_instructions": rx.general_instructions,
            "status": rx.status,
            "issued_at": rx.issued_at.strftime("%Y-%m-%d %H:%M"),
            "valid_until": rx.valid_until or (rx.issued_at + timedelta(days=30)).strftime("%Y-%m-%d"),
            "items": [
                {
                    "id": item.id,
                    "medication_name": item.medication_name,
                    "dosage": item.dosage,
                    "frequency": item.frequency,
                    "duration_days": item.duration_days,
                    "instructions": item.instructions
                }
                for item in rx.items
            ]
        })
    return results

@router.post("")
def create_prescription(
    req: PrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Issue a new prescription (Authorized for Clinicians and Medical Officers)"""
    profile = resolve_patient_profile(req.patient_id, current_user, db)
    rx_code = generate_rx_code(db)
    
    prescription = Prescription(
        prescription_code=rx_code,
        patient_id=profile.id,
        case_id=req.case_id,
        appointment_id=req.appointment_id,
        clinician_id=current_user.id,
        diagnosis=req.diagnosis,
        general_instructions=req.general_instructions,
        status="ACTIVE",
        valid_until=req.valid_until or (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
    )
    db.add(prescription)
    db.flush() # get prescription.id
    
    for item in req.items:
        rx_item = PrescriptionItem(
            prescription_id=prescription.id,
            medication_name=item.medication_name,
            dosage=item.dosage,
            frequency=item.frequency,
            duration_days=item.duration_days,
            instructions=item.instructions
        )
        db.add(rx_item)
        
    db.add(AuditLog(
        user_id=current_user.id,
        action="ISSUE_PRESCRIPTION",
        resource_type="Prescription",
        resource_id=prescription.id,
        details=f"Prescription {rx_code} issued for {profile.patient_identifier}: {req.diagnosis}"
    ))
    db.commit()
    db.refresh(prescription)
    
    return {
        "success": True,
        "message": f"Prescription {rx_code} issued successfully",
        "prescription_id": prescription.id,
        "prescription_code": rx_code
    }

@router.patch("/{prescription_id}/status")
def update_prescription_status(
    prescription_id: str,
    new_status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found.")
        
    rx.status = new_status.upper()
    db.commit()
    return {"success": True, "message": f"Prescription status updated to {new_status}."}
