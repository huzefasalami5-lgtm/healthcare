"""CuraReach 360 — Patient Database & Clinical Records Master API Router
Full database persistence for:
1. Patients (CRUD, search, filtering)
2. Medical Records (Encounter notes, diagnoses, treatments)
3. Appointments (Scheduling, status updates, doctor assignments)
4. Prescriptions (Medications, dosage, frequency, duration)
5. Lab Results / Reports (Diagnostic tests, results, normal ranges)
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token, get_password_hash, Role
from app.models.patient import Patient
from app.models.user import User, PatientProfile
from app.models.medical_records import MedicalRecord
from app.models.referral import Appointment, AppointmentStatus
from app.models.medical_records import Prescription
from app.models.lab_results import LabResult
from app.models.audit import AuditLog

router = APIRouter(tags=["Patient Database & Clinical Records"])

# ==============================================================================
# Auth Helpers
# ==============================================================================

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Retrieve authenticated user if bearer token is present, else None."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()
    except Exception:
        return None

def resolve_patient_entity(patient_id: str, db: Session, current_user: Optional[User] = None) -> Patient:
    """Resolve Patient model by ID, user_id, patient_identifier, or 'me'."""
    if patient_id == "me":
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to resolve 'me'."
            )
        patient = db.query(Patient).filter(
            or_(Patient.user_id == current_user.id, Patient.id == current_user.id)
        ).first()
        if not patient and current_user.patient_profile:
            patient = db.query(Patient).filter(Patient.id == current_user.patient_profile.id).first()
        if not patient:
            # Auto-create patient record for logged-in user if missing
            new_id = current_user.patient_profile.id if current_user.patient_profile else f"PAT-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
            patient = Patient(
                id=new_id,
                user_id=current_user.id,
                full_name=current_user.full_name,
                email=current_user.email,
                phone=current_user.phone
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        return patient

    # Direct query by id
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient:
        return patient

    # Query by user_id
    patient = db.query(Patient).filter(Patient.user_id == patient_id).first()
    if patient:
        return patient

    # Fallback to PatientProfile lookup
    profile = db.query(PatientProfile).filter(
        or_(PatientProfile.id == patient_id, PatientProfile.patient_identifier == patient_id)
    ).first()
    if profile:
        patient = db.query(Patient).filter(
            or_(Patient.id == profile.id, Patient.user_id == profile.user_id)
        ).first()
        if patient:
            return patient
        # Create Patient record mirroring the profile
        patient = Patient(
            id=profile.id,
            user_id=profile.user_id,
            full_name=profile.user.full_name if profile.user else "Patient",
            email=profile.user.email if profile.user else None,
            phone=profile.phone or (profile.user.phone if profile.user else None),
            gender=profile.gender,
            blood_group=profile.blood_group,
            allergies=profile.allergies,
            medical_conditions=profile.medical_conditions,
            current_medications=profile.current_medications
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Patient with ID '{patient_id}' not found.")

def generate_patient_id() -> str:
    """Generate a clean, professional, unique patient identifier."""
    year = datetime.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"PAT-{year}-{suffix}"

# ==============================================================================
# Pydantic Schemas
# ==============================================================================

class PatientCreate(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    full_name: str = Field(..., example="Ramesh Patel")
    date_of_birth: Optional[str] = Field(None, example="1974-06-15")
    age: Optional[int] = Field(None, example=52)
    gender: Optional[str] = Field(None, example="Male")
    phone: Optional[str] = Field(None, example="+91-98450-12345")
    email: Optional[str] = Field(None, example="patient@curareach.org")
    password: Optional[str] = Field(None, description="Optional account password for login")
    address: Optional[str] = Field(None, example="12 Gandhi Bazaar, Shivamogga, Karnataka 577201")
    emergency_contact_name: Optional[str] = Field(None, example="Suresh Patel (Brother)")
    emergency_contact_phone: Optional[str] = Field(None, example="+91-98450-99887")
    blood_group: Optional[str] = Field(None, example="B+")
    allergies: Optional[str] = Field(None, example="Penicillin, Sulfa drugs")
    medical_conditions: Optional[str] = Field(None, example="Type 2 Diabetes Mellitus, Essential Hypertension")
    current_medications: Optional[str] = Field(None, example="Metformin 500mg, Telmisartan 40mg")
    medical_history: Optional[str] = Field(None, example="Diagnosed with Type 2 Diabetes in 2018. Hypertension diagnosed 2021.")
    previous_surgeries: Optional[str] = Field(None, example="Appendectomy (2012)")
    family_medical_history: Optional[str] = Field(None, example="Father had CAD and Diabetes; Mother had Hypertension.")

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    medical_history: Optional[str] = None
    previous_surgeries: Optional[str] = None
    family_medical_history: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    full_name: str
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    medical_history: Optional[str] = None
    previous_surgeries: Optional[str] = None
    family_medical_history: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class MedicalRecordCreateRequest(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    visit_date: Optional[str] = None
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    doctor_notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    title: Optional[str] = "Clinical Consultation Note"
    record_type: Optional[str] = "VISIT_NOTE"

class MedicalRecordResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    visit_date: Optional[str] = None
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    doctor_notes: Optional[str] = None
    follow_up_date: Optional[str] = None
    title: Optional[str] = None
    record_type: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class AppointmentCreateRequest(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_date: str
    appointment_time: Optional[str] = "10:00 AM"
    reason: Optional[str] = "General Medical Review"
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None
    department_name: Optional[str] = "General Medicine"
    doctor_name: Optional[str] = "Specialist On Duty"

class AppointmentUpdateRequest(BaseModel):
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    doctor_name: Optional[str] = None
    department_name: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    reason: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    department_name: Optional[str] = None
    doctor_name: Optional[str] = None
    patient_name: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class PrescriptionCreateRequest(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    medicine_name: str
    dosage: Optional[str] = "As prescribed"
    frequency: Optional[str] = "Daily"
    duration: Optional[str] = "7 days"
    instructions: Optional[str] = "Take with water after meals"
    prescription_date: Optional[str] = None

class PrescriptionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    prescription_date: Optional[str] = None
    created_at: Optional[str] = None

class LabResultCreateRequest(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    test_name: str
    test_date: Optional[str] = None
    result: str
    normal_range: Optional[str] = None
    doctor_notes: Optional[str] = None

class LabResultResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    test_name: str
    test_date: Optional[str] = None
    result: str
    normal_range: Optional[str] = None
    doctor_notes: Optional[str] = None
    created_at: Optional[str] = None

# ==============================================================================
# Helper to serialize Patient
# ==============================================================================

def serialize_patient(p: Patient) -> dict:
    return {
        "id": p.id,
        "user_id": p.user_id,
        "full_name": p.full_name,
        "date_of_birth": p.date_of_birth,
        "age": p.age,
        "gender": p.gender,
        "phone": p.phone,
        "email": p.email,
        "address": p.address,
        "emergency_contact_name": p.emergency_contact_name,
        "emergency_contact_phone": p.emergency_contact_phone,
        "blood_group": p.blood_group,
        "allergies": p.allergies,
        "medical_conditions": p.medical_conditions,
        "current_medications": p.current_medications,
        "medical_history": p.medical_history,
        "previous_surgeries": p.previous_surgeries,
        "family_medical_history": p.family_medical_history,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None
    }

# ==============================================================================
# 1. PATIENT ENDPOINTS
# ==============================================================================

@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    req: PatientCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Registers a new patient and stores all required details in the persistent database.
    Optionally provisions a User login record if email/password is supplied.
    """
    # Generate unique patient ID
    patient_id = req.id if req.id else generate_patient_id()
    while db.query(Patient).filter(Patient.id == patient_id).first():
        patient_id = generate_patient_id()

    user_id = req.user_id
    # Check if a user with this email already exists or should be created
    if req.email:
        existing_user = db.query(User).filter(User.email == req.email.lower().strip()).first()
        if existing_user:
            user_id = existing_user.id
        elif req.password:
            # Create user account with hashed password
            new_user = User(
                id=str(uuid.uuid4()),
                email=req.email.lower().strip(),
                hashed_password=get_password_hash(req.password),
                full_name=req.full_name,
                role=Role.PATIENT,
                phone=req.phone,
                is_active=True
            )
            db.add(new_user)
            db.flush()
            user_id = new_user.id

    # Create Patient persistent record
    patient = Patient(
        id=patient_id,
        user_id=user_id,
        full_name=req.full_name.strip(),
        date_of_birth=req.date_of_birth,
        age=req.age,
        gender=req.gender,
        phone=req.phone,
        email=req.email.lower().strip() if req.email else None,
        address=req.address,
        emergency_contact_name=req.emergency_contact_name,
        emergency_contact_phone=req.emergency_contact_phone,
        blood_group=req.blood_group,
        allergies=req.allergies,
        medical_conditions=req.medical_conditions,
        current_medications=req.current_medications,
        medical_history=req.medical_history,
        previous_surgeries=req.previous_surgeries,
        family_medical_history=req.family_medical_history
    )
    db.add(patient)

    # Maintain dual sync with legacy PatientProfile for backward compatibility
    if user_id:
        existing_profile = db.query(PatientProfile).filter(PatientProfile.user_id == user_id).first()
        if not existing_profile:
            legacy_profile = PatientProfile(
                id=patient_id,
                user_id=user_id,
                patient_identifier=patient_id,
                date_of_birth=req.date_of_birth,
                gender=req.gender,
                blood_group=req.blood_group,
                phone=req.phone,
                emergency_contact_name=req.emergency_contact_name,
                emergency_contact_phone=req.emergency_contact_phone,
                allergies=req.allergies,
                medical_conditions=req.medical_conditions,
                current_medications=req.current_medications,
                medical_history_notes=req.medical_history
            )
            db.add(legacy_profile)

    # Log audit
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="PATIENT_CREATED_DATABASE",
        resource_type="PATIENT",
        resource_id=patient.id,
        details=f"Patient {patient.full_name} ({patient.id}) registered in database."
    )
    db.add(audit)

    db.commit()
    db.refresh(patient)
    return serialize_patient(patient)

@router.get("/patients", response_model=List[PatientResponse])
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, ID, phone, email, or condition"),
    blood_group: Optional[str] = Query(None, description="Filter by blood group"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all patients with optional search/filter (by name, ID, phone, email, etc.).
    """
    query = db.query(Patient)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.full_name.ilike(search_pattern),
                Patient.id.ilike(search_pattern),
                Patient.phone.ilike(search_pattern),
                Patient.email.ilike(search_pattern),
                Patient.medical_conditions.ilike(search_pattern)
            )
        )

    if blood_group:
        query = query.filter(Patient.blood_group == blood_group.strip())

    if gender:
        query = query.filter(Patient.gender.ilike(gender.strip()))

    patients = query.order_by(desc(Patient.created_at)).offset(offset).limit(limit).all()
    return [serialize_patient(p) for p in patients]

@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient_details(
    patient_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves a patient's full profile from the database.
    """
    patient = resolve_patient_entity(patient_id, db, current_user)
    return serialize_patient(patient)

@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient_details(
    patient_id: str,
    req: PatientUpdate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates patient information in the database.
    """
    patient = resolve_patient_entity(patient_id, db, current_user)

    update_fields = [
        "full_name", "date_of_birth", "age", "gender", "phone", "email",
        "address", "emergency_contact_name", "emergency_contact_phone",
        "blood_group", "allergies", "medical_conditions", "current_medications",
        "medical_history", "previous_surgeries", "family_medical_history"
    ]

    for field in update_fields:
        val = getattr(req, field)
        if val is not None:
            setattr(patient, field, val)

    patient.updated_at = datetime.now(timezone.utc)

    # Sync linked User or PatientProfile if present
    if patient.user_id:
        user = db.query(User).filter(User.id == patient.user_id).first()
        if user:
            if req.full_name is not None:
                user.full_name = req.full_name
            if req.phone is not None:
                user.phone = req.phone
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient.user_id).first()
        if profile:
            if req.gender is not None:
                profile.gender = req.gender
            if req.blood_group is not None:
                profile.blood_group = req.blood_group
            if req.allergies is not None:
                profile.allergies = req.allergies
            if req.medical_conditions is not None:
                profile.medical_conditions = req.medical_conditions
            if req.current_medications is not None:
                profile.current_medications = req.current_medications

    # Audit log
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        action="PATIENT_UPDATED_DATABASE",
        resource_type="PATIENT",
        resource_id=patient.id,
        details=f"Patient {patient.full_name} ({patient.id}) details updated in database."
    )
    db.add(audit)

    db.commit()
    db.refresh(patient)
    return serialize_patient(patient)

# ==============================================================================
# 2. MEDICAL RECORDS ENDPOINTS
# ==============================================================================

@router.post("/medical-records", response_model=MedicalRecordResponse, status_code=status.HTTP_201_CREATED)
def create_medical_record(
    req: MedicalRecordCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a persistent medical record (visit encounter, diagnosis, treatment, doctor notes)
    for a patient in the database.
    """
    patient = resolve_patient_entity(req.patient_id, db, current_user)

    doctor_id = req.doctor_id
    if not doctor_id and current_user and current_user.role in [Role.CLINICIAN, Role.HOSPITAL_STAFF]:
        doctor_id = current_user.id

    now_str = datetime.now().strftime("%Y-%m-%d")
    visit_date = req.visit_date or now_str

    record_id = f"MR-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    record = MedicalRecord(
        id=record_id,
        patient_id=patient.id,
        doctor_id=doctor_id,
        visit_date=visit_date,
        symptoms=req.symptoms,
        diagnosis=req.diagnosis,
        treatment=req.treatment,
        doctor_notes=req.doctor_notes,
        follow_up_date=req.follow_up_date,
        title=req.title or "Clinical Consultation Note",
        record_type=req.record_type or "VISIT_NOTE"
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    doctor_name = None
    if doctor_id:
        doc = db.query(User).filter(User.id == doctor_id).first()
        if doc:
            doctor_name = doc.full_name

    return {
        "id": record.id,
        "patient_id": record.patient_id,
        "doctor_id": record.doctor_id,
        "doctor_name": doctor_name,
        "visit_date": record.visit_date,
        "symptoms": record.symptoms,
        "diagnosis": record.diagnosis,
        "treatment": record.treatment,
        "doctor_notes": record.doctor_notes,
        "follow_up_date": record.follow_up_date,
        "title": record.title,
        "record_type": record.record_type,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "updated_at": record.updated_at.isoformat() if record.updated_at else None
    }

@router.get("/patients/{patient_id}/medical-records", response_model=List[MedicalRecordResponse])
def get_patient_medical_records(
    patient_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all medical records for a given patient from the database.
    """
    patient = resolve_patient_entity(patient_id, db, current_user)

    records = db.query(MedicalRecord).filter(
        MedicalRecord.patient_id == patient.id
    ).order_by(desc(MedicalRecord.created_at)).all()

    # Also resolve if any linked under patient.user_id
    if not records and patient.user_id:
        records = db.query(MedicalRecord).filter(
            MedicalRecord.patient_id == patient.user_id
        ).order_by(desc(MedicalRecord.created_at)).all()

    result = []
    for r in records:
        doc_name = None
        if r.doctor_id:
            doc = db.query(User).filter(User.id == r.doctor_id).first()
            if doc:
                doc_name = doc.full_name
        result.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "doctor_id": r.doctor_id,
            "doctor_name": doc_name,
            "visit_date": r.visit_date or (r.created_at.strftime("%Y-%m-%d") if r.created_at else None),
            "symptoms": r.symptoms,
            "diagnosis": r.diagnosis,
            "treatment": r.treatment,
            "doctor_notes": r.doctor_notes,
            "follow_up_date": r.follow_up_date,
            "title": r.title or "Clinical Consultation Note",
            "record_type": r.record_type or "VISIT_NOTE",
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None
        })
    return result

# ==============================================================================
# 3. APPOINTMENTS ENDPOINTS
# ==============================================================================

@router.post("/appointments", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    req: AppointmentCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Schedules a new appointment for a patient in the database.
    """
    patient = resolve_patient_entity(req.patient_id, db, current_user)

    doctor_id = req.doctor_id
    doctor_name = req.doctor_name
    if not doctor_id and current_user and current_user.role in [Role.CLINICIAN, Role.HOSPITAL_STAFF]:
        doctor_id = current_user.id
        doctor_name = current_user.full_name

    appt_id = f"APT-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    appt = Appointment(
        id=appt_id,
        patient_id=patient.id,
        doctor_id=doctor_id,
        appointment_date=req.appointment_date,
        appointment_time=req.appointment_time or "10:00 AM",
        reason=req.reason,
        status=req.status or "scheduled",
        notes=req.notes,
        department_name=req.department_name or "General Medicine",
        doctor_name=doctor_name or "Specialist In-Charge",
        scheduled_at=f"{req.appointment_date} {req.appointment_time or '10:00 AM'}"
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "doctor_id": appt.doctor_id,
        "appointment_date": appt.appointment_date,
        "appointment_time": appt.appointment_time,
        "reason": appt.reason,
        "status": appt.status,
        "notes": appt.notes,
        "department_name": appt.department_name,
        "doctor_name": appt.doctor_name,
        "patient_name": patient.full_name,
        "created_at": appt.created_at.isoformat() if appt.created_at else None,
        "updated_at": appt.updated_at.isoformat() if appt.updated_at else None
    }

@router.get("/appointments", response_model=List[AppointmentResponse])
def list_appointments(
    status_filter: Optional[str] = Query(None, alias="status"),
    date_filter: Optional[str] = Query(None, alias="date"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all scheduled appointments across the network.
    """
    query = db.query(Appointment)
    if status_filter:
        query = query.filter(Appointment.status.ilike(status_filter.strip()))
    if date_filter:
        query = query.filter(Appointment.appointment_date == date_filter.strip())

    appts = query.order_by(desc(Appointment.created_at)).all()

    result = []
    for a in appts:
        pat_name = "Patient"
        if a.patient_rel:
            pat_name = a.patient_rel.full_name
        elif a.patient_id:
            p = db.query(Patient).filter(Patient.id == a.patient_id).first()
            if p:
                pat_name = p.full_name

        result.append({
            "id": a.id,
            "patient_id": a.patient_id or "Unknown",
            "doctor_id": a.doctor_id,
            "appointment_date": a.appointment_date or (a.scheduled_at[:10] if a.scheduled_at else None),
            "appointment_time": a.appointment_time or (a.scheduled_at[11:] if a.scheduled_at and len(a.scheduled_at) > 10 else None),
            "reason": a.reason or (f"Referral Consultation: {a.department_name}" if a.department_name else "Medical Encounter"),
            "status": a.status,
            "notes": a.notes,
            "department_name": a.department_name,
            "doctor_name": a.doctor_name,
            "patient_name": pat_name,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None
        })
    return result

@router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: str,
    req: AppointmentUpdateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates appointment details (reschedule, complete, cancel, add clinical notes).
    """
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    if req.appointment_date is not None:
        appt.appointment_date = req.appointment_date
    if req.appointment_time is not None:
        appt.appointment_time = req.appointment_time
    if req.appointment_date or req.appointment_time:
        appt.scheduled_at = f"{appt.appointment_date or ''} {appt.appointment_time or ''}".strip()
    if req.reason is not None:
        appt.reason = req.reason
    if req.status is not None:
        appt.status = req.status
    if req.notes is not None:
        appt.notes = req.notes
    if req.doctor_name is not None:
        appt.doctor_name = req.doctor_name
    if req.department_name is not None:
        appt.department_name = req.department_name

    appt.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(appt)

    pat_name = "Patient"
    if appt.patient:
        pat_name = appt.patient.full_name
    elif appt.patient_id:
        p = db.query(Patient).filter(Patient.id == appt.patient_id).first()
        if p:
            pat_name = p.full_name

    return {
        "id": appt.id,
        "patient_id": appt.patient_id or "Unknown",
        "doctor_id": appt.doctor_id,
        "appointment_date": appt.appointment_date or (appt.scheduled_at[:10] if appt.scheduled_at else None),
        "appointment_time": appt.appointment_time or (appt.scheduled_at[11:] if appt.scheduled_at and len(appt.scheduled_at) > 10 else None),
        "reason": appt.reason,
        "status": appt.status,
        "notes": appt.notes,
        "department_name": appt.department_name,
        "doctor_name": appt.doctor_name,
        "patient_name": pat_name,
        "created_at": appt.created_at.isoformat() if appt.created_at else None,
        "updated_at": appt.updated_at.isoformat() if appt.updated_at else None
    }

@router.get("/patients/{patient_id}/appointments", response_model=List[AppointmentResponse])
def get_patient_appointments(
    patient_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all appointments for a given patient from the database.
    """
    patient = resolve_patient_entity(patient_id, db, current_user)

    appts = db.query(Appointment).filter(
        Appointment.patient_id == patient.id
    ).order_by(desc(Appointment.created_at)).all()

    if not appts and patient.user_id:
        appts = db.query(Appointment).filter(
            Appointment.patient_id == patient.user_id
        ).order_by(desc(Appointment.created_at)).all()

    result = []
    for a in appts:
        result.append({
            "id": a.id,
            "patient_id": a.patient_id or patient.id,
            "doctor_id": a.doctor_id,
            "appointment_date": a.appointment_date or (a.scheduled_at[:10] if a.scheduled_at else None),
            "appointment_time": a.appointment_time or (a.scheduled_at[11:] if a.scheduled_at and len(a.scheduled_at) > 10 else None),
            "reason": a.reason or (f"Referral Consultation: {a.department_name}" if a.department_name else "Medical Encounter"),
            "status": a.status,
            "notes": a.notes,
            "department_name": a.department_name,
            "doctor_name": a.doctor_name,
            "patient_name": patient.full_name,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None
        })
    return result

# ==============================================================================
# 4. PRESCRIPTIONS ENDPOINTS
# ==============================================================================

@router.post("/prescriptions", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    req: PrescriptionCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Prescribes medication and permanently stores it in the database.
    """
    patient = resolve_patient_entity(req.patient_id, db, current_user)

    doctor_id = req.doctor_id
    if not doctor_id and current_user and current_user.role in [Role.CLINICIAN, Role.HOSPITAL_STAFF]:
        doctor_id = current_user.id

    now_str = datetime.now().strftime("%Y-%m-%d")
    prescription_date = req.prescription_date or now_str

    rx_id = f"RX-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    rx = Prescription(
        id=rx_id,
        prescription_code=rx_id,
        patient_id=patient.id,
        doctor_id=doctor_id,
        clinician_id=doctor_id,
        medicine_name=req.medicine_name.strip(),
        dosage=req.dosage or "As directed",
        frequency=req.frequency or "Once daily",
        duration=req.duration or "7 days",
        instructions=req.instructions or "Take with water",
        prescription_date=prescription_date
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)

    doctor_name = None
    if doctor_id:
        doc = db.query(User).filter(User.id == doctor_id).first()
        if doc:
            doctor_name = doc.full_name

    return {
        "id": rx.id,
        "patient_id": rx.patient_id,
        "doctor_id": rx.doctor_id,
        "doctor_name": doctor_name,
        "medicine_name": rx.medicine_name,
        "dosage": rx.dosage,
        "frequency": rx.frequency,
        "duration": rx.duration,
        "instructions": rx.instructions,
        "prescription_date": rx.prescription_date,
        "created_at": rx.created_at.isoformat() if rx.created_at else None
    }

@router.get("/patients/{patient_id}/prescriptions", response_model=List[PrescriptionResponse])
def get_patient_prescriptions(
    patient_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all prescriptions for a patient from the database.
    """
    patient = resolve_patient_entity(patient_id, db, current_user)

    rxs = db.query(Prescription).filter(
        Prescription.patient_id == patient.id
    ).order_by(desc(Prescription.created_at)).all()

    if not rxs and patient.user_id:
        rxs = db.query(Prescription).filter(
            Prescription.patient_id == patient.user_id
        ).order_by(desc(Prescription.created_at)).all()

    result = []
    for rx in rxs:
        doc_name = None
        doc_id = rx.doctor_id or rx.clinician_id
        if doc_id:
            doc = db.query(User).filter(User.id == doc_id).first()
            if doc:
                doc_name = doc.full_name

        med_name = rx.medicine_name
        dosage = rx.dosage
        instructions = rx.instructions
        frequency = rx.frequency
        duration = rx.duration

        # Fallback to items JSON if available
        if (not med_name or med_name == "") and rx.items and isinstance(rx.items, list) and len(rx.items) > 0:
            first_item = rx.items[0]
            if isinstance(first_item, dict):
                med_name = first_item.get("medication_name") or first_item.get("name") or "Prescribed Medication"
                dosage = first_item.get("dosage", dosage)
                instructions = first_item.get("instructions", instructions)

        result.append({
            "id": rx.id,
            "patient_id": rx.patient_id,
            "doctor_id": doc_id,
            "doctor_name": doc_name,
            "medicine_name": med_name or "Prescribed Medication",
            "dosage": dosage or "As prescribed",
            "frequency": frequency or "Once daily",
            "duration": duration or "Course",
            "instructions": instructions or "Take as directed",
            "prescription_date": rx.prescription_date or (rx.created_at.strftime("%Y-%m-%d") if rx.created_at else None),
            "created_at": rx.created_at.isoformat() if rx.created_at else None
        })
    return result

# ==============================================================================
# 5. LAB RESULTS / REPORTS ENDPOINTS
# ==============================================================================

@router.post("/lab-results", response_model=LabResultResponse, status_code=status.HTTP_201_CREATED)
def create_lab_result(
    req: LabResultCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves a diagnostic laboratory result to the database.
    """
    patient = resolve_patient_entity(req.patient_id, db, current_user)

    doctor_id = req.doctor_id
    if not doctor_id and current_user and current_user.role in [Role.CLINICIAN, Role.HOSPITAL_STAFF]:
        doctor_id = current_user.id

    now_str = datetime.now().strftime("%Y-%m-%d")
    test_date = req.test_date or now_str

    lab_id = f"LAB-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    lab = LabResult(
        id=lab_id,
        patient_id=patient.id,
        doctor_id=doctor_id,
        test_name=req.test_name.strip(),
        test_date=test_date,
        result=req.result.strip(),
        normal_range=req.normal_range,
        doctor_notes=req.doctor_notes
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)

    doctor_name = None
    if doctor_id:
        doc = db.query(User).filter(User.id == doctor_id).first()
        if doc:
            doctor_name = doc.full_name

    return {
        "id": lab.id,
        "patient_id": lab.patient_id,
        "doctor_id": lab.doctor_id,
        "doctor_name": doctor_name,
        "test_name": lab.test_name,
        "test_date": lab.test_date,
        "result": lab.result,
        "normal_range": lab.normal_range,
        "doctor_notes": lab.doctor_notes,
        "created_at": lab.created_at.isoformat() if lab.created_at else None
    }

@router.get("/patients/{patient_id}/lab-results", response_model=List[LabResultResponse])
def get_patient_lab_results(
    patient_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all diagnostic lab results for a given patient from the database.
    """
    patient = resolve_patient_entity(patient_id, db, current_user)

    labs = db.query(LabResult).filter(
        LabResult.patient_id == patient.id
    ).order_by(desc(LabResult.created_at)).all()

    if not labs and patient.user_id:
        labs = db.query(LabResult).filter(
            LabResult.patient_id == patient.user_id
        ).order_by(desc(LabResult.created_at)).all()

    result = []
    for l in labs:
        doc_name = None
        if l.doctor_id:
            doc = db.query(User).filter(User.id == l.doctor_id).first()
            if doc:
                doc_name = doc.full_name

        result.append({
            "id": l.id,
            "patient_id": l.patient_id,
            "doctor_id": l.doctor_id,
            "doctor_name": doc_name,
            "test_name": l.test_name,
            "test_date": l.test_date,
            "result": l.result,
            "normal_range": l.normal_range,
            "doctor_notes": l.doctor_notes,
            "created_at": l.created_at.isoformat() if l.created_at else None
        })
    return result
