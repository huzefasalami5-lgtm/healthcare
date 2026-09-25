"""Patient Medical History API Endpoints (Conditions, Allergies, Surgeries, Medications, Family History)"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, Role
from app.models.user import User, PatientProfile
from app.models.medical_history import (
    PatientCondition,
    PatientAllergy,
    PatientSurgery,
    PatientMedication,
    FamilyMedicalHistory,
)
from app.schemas import (
    ConditionCreate,
    AllergyCreate,
    SurgeryCreate,
    MedicationCreate,
    FamilyHistoryCreate,
)

router = APIRouter(prefix="/medical-history", tags=["Medical History"])

def resolve_patient_profile(patient_id_or_me: str, current_user: User, db: Session) -> PatientProfile:
    """Helper to resolve PatientProfile from patient_id (or user_id or 'me')"""
    if patient_id_or_me == "me":
        if not current_user.patient_profile:
            raise HTTPException(status_code=400, detail="Current logged in user does not have a patient profile.")
        return current_user.patient_profile

    # Try matching patient_profile.id
    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id_or_me).first()
    if not profile:
        # Try matching user_id
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id_or_me).first()
    if not profile:
        # Try matching patient_identifier (e.g. CR-PAT-2026-0101)
        profile = db.query(PatientProfile).filter(PatientProfile.patient_identifier == patient_id_or_me).first()
    if not profile:
        raise HTTPException(status_code=404, detail=f"Patient profile for '{patient_id_or_me}' not found.")
    return profile

@router.get("/patient/{patient_id}")
def get_patient_medical_history(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full structured medical history for a patient"""
    profile = resolve_patient_profile(patient_id, current_user, db)
    
    conditions = db.query(PatientCondition).filter(PatientCondition.patient_id == profile.id).all()
    allergies = db.query(PatientAllergy).filter(PatientAllergy.patient_id == profile.id).all()
    surgeries = db.query(PatientSurgery).filter(PatientSurgery.patient_id == profile.id).all()
    medications = db.query(PatientMedication).filter(PatientMedication.patient_id == profile.id).all()
    family_hist = db.query(FamilyMedicalHistory).filter(FamilyMedicalHistory.patient_id == profile.id).all()
    
    return {
        "patient_id": profile.id,
        "patient_identifier": profile.patient_identifier,
        "patient_name": profile.user.full_name if profile.user else "Patient",
        "blood_group": profile.blood_group,
        "conditions": [
            {
                "id": c.id,
                "condition_name": c.condition_name,
                "status": c.status,
                "diagnosed_date": c.diagnosed_date,
                "severity": c.severity,
                "notes": c.notes
            }
            for c in conditions
        ],
        "allergies": [
            {
                "id": a.id,
                "allergen": a.allergen,
                "reaction": a.reaction,
                "severity": a.severity,
                "date_noted": a.date_noted,
                "notes": a.notes
            }
            for a in allergies
        ],
        "surgeries": [
            {
                "id": s.id,
                "procedure_name": s.procedure_name,
                "surgery_date": s.surgery_date,
                "hospital_name": s.hospital_name,
                "notes": s.notes
            }
            for s in surgeries
        ],
        "medications": [
            {
                "id": m.id,
                "medication_name": m.medication_name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "start_date": m.start_date,
                "is_current": m.is_current,
                "prescribed_by": m.prescribed_by,
                "notes": m.notes
            }
            for m in medications
        ],
        "family_history": [
            {
                "id": f.id,
                "relationship_to_patient": f.relationship_to_patient,
                "condition": f.condition,
                "notes": f.notes
            }
            for f in family_hist
        ]
    }

@router.post("/patient/{patient_id}/conditions")
def add_condition(
    patient_id: str,
    req: ConditionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = resolve_patient_profile(patient_id, current_user, db)
    condition = PatientCondition(
        patient_id=profile.id,
        condition_name=req.condition_name,
        status=req.status,
        diagnosed_date=req.diagnosed_date,
        severity=req.severity,
        notes=req.notes
    )
    db.add(condition)
    db.commit()
    db.refresh(condition)
    return {"success": True, "message": f"Condition '{req.condition_name}' added.", "condition_id": condition.id}

@router.delete("/conditions/{condition_id}")
def delete_condition(
    condition_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    condition = db.query(PatientCondition).filter(PatientCondition.id == condition_id).first()
    if not condition:
        raise HTTPException(status_code=404, detail="Condition not found.")
    db.delete(condition)
    db.commit()
    return {"success": True, "message": "Condition deleted successfully."}

@router.post("/patient/{patient_id}/allergies")
def add_allergy(
    patient_id: str,
    req: AllergyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = resolve_patient_profile(patient_id, current_user, db)
    allergy = PatientAllergy(
        patient_id=profile.id,
        allergen=req.allergen,
        reaction=req.reaction,
        severity=req.severity,
        date_noted=req.date_noted,
        notes=req.notes
    )
    db.add(allergy)
    db.commit()
    db.refresh(allergy)
    return {"success": True, "message": f"Allergy to '{req.allergen}' added.", "allergy_id": allergy.id}

@router.delete("/allergies/{allergy_id}")
def delete_allergy(
    allergy_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allergy = db.query(PatientAllergy).filter(PatientAllergy.id == allergy_id).first()
    if not allergy:
        raise HTTPException(status_code=404, detail="Allergy not found.")
    db.delete(allergy)
    db.commit()
    return {"success": True, "message": "Allergy deleted successfully."}

@router.post("/patient/{patient_id}/surgeries")
def add_surgery(
    patient_id: str,
    req: SurgeryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = resolve_patient_profile(patient_id, current_user, db)
    surgery = PatientSurgery(
        patient_id=profile.id,
        procedure_name=req.procedure_name,
        surgery_date=req.surgery_date,
        hospital_name=req.hospital_name,
        notes=req.notes
    )
    db.add(surgery)
    db.commit()
    db.refresh(surgery)
    return {"success": True, "message": f"Surgery '{req.procedure_name}' added.", "surgery_id": surgery.id}

@router.post("/patient/{patient_id}/medications")
def add_medication(
    patient_id: str,
    req: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = resolve_patient_profile(patient_id, current_user, db)
    med = PatientMedication(
        patient_id=profile.id,
        medication_name=req.medication_name,
        dosage=req.dosage,
        frequency=req.frequency,
        start_date=req.start_date,
        is_current=req.is_current,
        prescribed_by=req.prescribed_by,
        notes=req.notes
    )
    db.add(med)
    db.commit()
    db.refresh(med)
    return {"success": True, "message": f"Medication '{req.medication_name}' added.", "medication_id": med.id}

@router.post("/patient/{patient_id}/family-history")
def add_family_history(
    patient_id: str,
    req: FamilyHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = resolve_patient_profile(patient_id, current_user, db)
    fam = FamilyMedicalHistory(
        patient_id=profile.id,
        relationship_to_patient=req.relationship_to_patient,
        condition=req.condition,
        notes=req.notes
    )
    db.add(fam)
    db.commit()
    db.refresh(fam)
    return {"success": True, "message": "Family medical history entry added.", "family_history_id": fam.id}
