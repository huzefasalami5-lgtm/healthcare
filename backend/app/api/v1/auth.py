"""Authentication, Registration, and Quick Role Switcher Endpoints"""
from typing import Dict, Any, Optional, List
import random
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user, Role
from app.models.user import User, PatientProfile, CommunityWorkerProfile
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, RoleSwitchRequest, PatientProfileUpdateRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

def generate_patient_id(db: Session) -> str:
    """Generate a formatted Patient ID: CR-PAT-2026-XXXX"""
    count = db.query(PatientProfile).count() + 1
    rand_suffix = random.randint(100, 999)
    return f"CR-PAT-2026-{count:04d}"

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated."
        )

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "organization_id": user.organization_id,
            "patient_identifier": user.patient_profile.patient_identifier if user.patient_profile else None
        }
    }

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Self-service patient registration or assisted registration"""
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        phone=req.phone,
        role=req.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if req.role == Role.PATIENT:
        pat_id = generate_patient_id(db)
        profile = PatientProfile(
            user_id=user.id,
            patient_identifier=pat_id,
            date_of_birth=req.date_of_birth,
            gender=req.gender,
            blood_group=req.blood_group or "O+",
            address=req.address,
            district=req.district or "Shivamogga",
            state=req.state or "Karnataka",
            pincode=req.pincode or "577201",
            emergency_contact_name=req.emergency_contact_name,
            emergency_contact_phone=req.emergency_contact_phone,
            emergency_contact_relation=req.emergency_contact_relation or "Family Member",
            primary_language=req.primary_language or "English",
            transport_access_barrier=req.transport_access_barrier,
            financial_barrier=req.financial_barrier,
            abha_id=req.abha_id or f"91-2026-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "organization_id": user.organization_id,
            "patient_identifier": user.patient_profile.patient_identifier if user.patient_profile else None
        }
    }

@router.post("/assisted-patient-registration")
def assisted_patient_registration(
    req: RegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Community Worker or Clinician assisted patient registration"""
    if current_user.role not in [Role.COMMUNITY_WORKER, Role.CLINICIAN, Role.CURAREACH_ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only health workers or clinicians can register assisted patients.")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    user = User(
        email=req.email,
        hashed_password=get_password_hash(req.password or "Welcome@123"),
        full_name=req.full_name,
        phone=req.phone,
        role=Role.PATIENT
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    pat_id = generate_patient_id(db)
    profile = PatientProfile(
        user_id=user.id,
        patient_identifier=pat_id,
        date_of_birth=req.date_of_birth,
        gender=req.gender,
        blood_group=req.blood_group or "O+",
        address=req.address,
        district=req.district or "Shivamogga",
        state=req.state or "Karnataka",
        pincode=req.pincode or "577201",
        emergency_contact_name=req.emergency_contact_name,
        emergency_contact_phone=req.emergency_contact_phone,
        emergency_contact_relation=req.emergency_contact_relation or "Family Member",
        primary_language=req.primary_language or "Kannada",
        transport_access_barrier=req.transport_access_barrier,
        financial_barrier=req.financial_barrier,
        abha_id=req.abha_id or f"91-2026-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return {
        "success": True,
        "message": f"Patient {user.full_name} registered successfully with ID {pat_id}",
        "patient": {
            "id": profile.id,
            "user_id": user.id,
            "patient_identifier": profile.patient_identifier,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "abha_id": profile.abha_id,
            "district": profile.district
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {}
    if current_user.patient_profile:
        p = current_user.patient_profile
        profile_data = {
            "profile_id": p.id,
            "patient_identifier": p.patient_identifier,
            "dob": p.date_of_birth,
            "gender": p.gender,
            "blood_group": p.blood_group,
            "address": p.address,
            "district": p.district,
            "state": p.state,
            "pincode": p.pincode,
            "emergency_contact_name": p.emergency_contact_name,
            "emergency_contact_phone": p.emergency_contact_phone,
            "emergency_contact_relation": p.emergency_contact_relation,
            "primary_language": p.primary_language,
            "transport_barrier": p.transport_access_barrier,
            "financial_barrier": p.financial_barrier,
            "abha_id": p.abha_id
        }
    elif current_user.worker_profile:
        w = current_user.worker_profile
        profile_data = {
            "profile_id": w.id,
            "service_area": w.assigned_service_area,
            "supervisor": w.assigned_supervisor,
            "training_status": w.training_status,
            "active_cases": w.active_case_count
        }

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "phone": current_user.phone,
        "organization_id": current_user.organization_id,
        "profile": profile_data
    }

@router.put("/patient-profile")
def update_patient_profile(
    req: PatientProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile and consent details for current patient"""
    profile = current_user.patient_profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found.")

    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.phone is not None:
        current_user.phone = req.phone
    if req.date_of_birth is not None:
        profile.date_of_birth = req.date_of_birth
    if req.gender is not None:
        profile.gender = req.gender
    if req.blood_group is not None:
        profile.blood_group = req.blood_group
    if req.address is not None:
        profile.address = req.address
    if req.district is not None:
        profile.district = req.district
    if req.state is not None:
        profile.state = req.state
    if req.pincode is not None:
        profile.pincode = req.pincode
    if req.emergency_contact_name is not None:
        profile.emergency_contact_name = req.emergency_contact_name
    if req.emergency_contact_phone is not None:
        profile.emergency_contact_phone = req.emergency_contact_phone
    if req.emergency_contact_relation is not None:
        profile.emergency_contact_relation = req.emergency_contact_relation
    if req.primary_language is not None:
        profile.primary_language = req.primary_language
    if req.transport_access_barrier is not None:
        profile.transport_access_barrier = req.transport_access_barrier
    if req.financial_barrier is not None:
        profile.financial_barrier = req.financial_barrier
    if req.abha_id is not None:
        profile.abha_id = req.abha_id

    db.commit()
    db.refresh(profile)
    db.refresh(current_user)

    return {
        "success": True,
        "message": "Patient profile updated successfully",
        "profile": {
            "patient_identifier": profile.patient_identifier,
            "full_name": current_user.full_name,
            "blood_group": profile.blood_group,
            "district": profile.district,
            "abha_id": profile.abha_id
        }
    }

@router.get("/patients")
def list_patients(
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List or search registered patients (accessible to workers, clinicians, staff, admin)"""
    query = db.query(PatientProfile).join(User, PatientProfile.user_id == User.id)
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.phone.ilike(f"%{search}%")) |
            (PatientProfile.patient_identifier.ilike(f"%{search}%")) |
            (PatientProfile.abha_id.ilike(f"%{search}%"))
        )
    
    profiles = query.all()
    results = []
    for p in profiles:
        results.append({
            "id": p.id,
            "user_id": p.user_id,
            "patient_identifier": p.patient_identifier or f"CR-PAT-2026-{p.id[:4]}",
            "full_name": p.user.full_name if p.user else "Unknown",
            "email": p.user.email if p.user else "",
            "phone": p.user.phone if p.user else "",
            "gender": p.gender,
            "dob": p.date_of_birth,
            "blood_group": p.blood_group,
            "district": p.district,
            "abha_id": p.abha_id,
            "transport_barrier": p.transport_access_barrier,
            "financial_barrier": p.financial_barrier
        })
    return results

@router.post("/switch-demo-role", response_model=TokenResponse)
def switch_demo_role(req: RoleSwitchRequest, db: Session = Depends(get_db)):
    """Convenient 1-click role switcher for Hackathon judging and evaluation"""
    target_email = req.target_email
    if not target_email:
        # Default demo accounts
        role_map = {
            Role.PATIENT: "patient@curareach.org",
            Role.COMMUNITY_WORKER: "worker@curareach.org",
            Role.CLINICIAN: "doctor@curareach.org",
            Role.HOSPITAL_STAFF: "hospital@curareach.org",
            Role.CURAREACH_ADMIN: "admin@curareach.org",
            Role.DONOR: "donor1@curareach.org"
        }
        target_email = role_map.get(req.target_role, "patient@curareach.org")

    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Demo user for {target_email} not found. Please ensure database is seeded."
        )

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone": user.phone,
            "organization_id": user.organization_id,
            "patient_identifier": user.patient_profile.patient_identifier if user.patient_profile else None
        }
    }
