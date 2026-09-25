"""Authentication, Registration, and Quick Role Switcher Endpoints"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user, Role
from app.models.user import User, PatientProfile, CommunityWorkerProfile
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, RoleSwitchRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

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
            "organization_id": user.organization_id
        }
    }

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
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
        profile = PatientProfile(
            user_id=user.id,
            date_of_birth=req.date_of_birth,
            gender=req.gender,
            address=req.address,
            district=req.district,
            transport_access_barrier=req.transport_access_barrier,
            financial_barrier=req.financial_barrier
        )
        db.add(profile)
        db.commit()

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
            "organization_id": user.organization_id
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {}
    if current_user.patient_profile:
        p = current_user.patient_profile
        profile_data = {
            "dob": p.date_of_birth,
            "gender": p.gender,
            "address": p.address,
            "district": p.district,
            "transport_barrier": p.transport_access_barrier,
            "financial_barrier": p.financial_barrier
        }
    elif current_user.worker_profile:
        w = current_user.worker_profile
        profile_data = {
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
            Role.CURAREACH_ADMIN: "admin@curareach.org"
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
            "organization_id": user.organization_id
        }
    }
