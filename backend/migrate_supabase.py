"""One-shot Supabase migration and seed script"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("CURAREACH 360 — SUPABASE MIGRATION & SEED")
print("=" * 60)

print("\n[1/3] Importing models and creating engine...")
from app.core.database import ensure_database_schema, SessionLocal, Base, engine
import app.models  # noqa - register all models

print("[2/3] Creating all tables in Supabase PostgreSQL...")
Base.metadata.create_all(bind=engine)
print("      Tables created!")

print("[3/3] Running ensure_database_schema (column migrations)...")
ensure_database_schema()
print("      Schema ensured!")

print("\n[4/4] Seeding demo data...")
from app.services.seed_service import seed_database
db = SessionLocal()
try:
    seed_database(db)
    print("      Seed complete!")
finally:
    db.close()

# Count records
from app.models import Patient
from app.models.user import User
from app.models.medical_records import MedicalRecord, Prescription
from app.models.referral import Appointment
from app.models.lab_results import LabResult

db = SessionLocal()
try:
    users = db.query(User).count()
    patients = db.query(Patient).count()
    records = db.query(MedicalRecord).count()
    appts = db.query(Appointment).count()
    rxs = db.query(Prescription).count()
    labs = db.query(LabResult).count()
    print(f"\n{'='*60}")
    print("SUPABASE DATABASE SUMMARY")
    print(f"{'='*60}")
    print(f"  Users:           {users}")
    print(f"  Patients:        {patients}")
    print(f"  Medical Records: {records}")
    print(f"  Appointments:    {appts}")
    print(f"  Prescriptions:   {rxs}")
    print(f"  Lab Results:     {labs}")
    print(f"{'='*60}")
    print("SUPABASE FULLY CONNECTED!")
finally:
    db.close()
