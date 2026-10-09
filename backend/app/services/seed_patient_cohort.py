"""Seed Comprehensive Clinical Cohort of Patients into Database"""
from app.core.database import SessionLocal
from app.models.patient import Patient
from app.services.database_service import SEED_PATIENTS

def populate_patients():
    db = SessionLocal()
    try:
        inserted = 0
        for sp in SEED_PATIENTS:
            existing = db.query(Patient).filter(Patient.id == sp["id"]).first()
            if not existing:
                p = Patient(
                    id=sp["id"],
                    full_name=sp["name"],
                    age=sp.get("age"),
                    gender=sp.get("gender"),
                    phone=sp.get("phone"),
                    email=f"patient.{sp['id'].lower()}@curareach.org",
                    address=f"{sp.get('location', '')}, {sp.get('sub_district', '')}, {sp.get('district', '')}, {sp.get('state', '')}",
                    emergency_contact_name=sp.get("caregiver_name"),
                    emergency_contact_phone=sp.get("emergency_contact"),
                    blood_group="B+" if sp.get("gender") == "Female" else "O+",
                    allergies="NKDA (No Known Drug Allergies)",
                    medical_conditions=", ".join(sp.get("comorbidities", []) + sp.get("symptoms", [])),
                    current_medications=f"Assigned to {sp.get('assigned_asha', 'Community Worker')}",
                    medical_history=sp.get("notes", ""),
                    family_medical_history=f"ABHA ID: {sp.get('abha_id', '')} - Priority: {sp.get('triage_priority', '')} - Status: {sp.get('status', '')}"
                )
                db.add(p)
                inserted += 1
        db.commit()
        total = db.query(Patient).count()
        print(f"Successfully populated {inserted} patients. Total in database: {total}")
        return total
    finally:
        db.close()

if __name__ == "__main__":
    populate_patients()
