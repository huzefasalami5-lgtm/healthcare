"""Pydantic validation schemas for CuraReach 360 API"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str = "PATIENT"
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = "Shivamogga"
    transport_access_barrier: bool = False
    financial_barrier: bool = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class RoleSwitchRequest(BaseModel):
    target_role: str  # PATIENT, COMMUNITY_WORKER, CLINICIAN, HOSPITAL_STAFF, CURAREACH_ADMIN
    target_email: Optional[str] = None

# --- INTAKE & CASE SCHEMAS ---
class CreateCaseRequest(BaseModel):
    primary_complaint: str
    patient_id: Optional[str] = None  # Populated automatically or supplied by community worker
    assigned_worker_id: Optional[str] = None
    health_data_consent: bool = True
    referral_consent: bool = True
    photo_consent: bool = False
    worker_assistance_consent: bool = False

class SymptomSubmitRequest(BaseModel):
    main_complaint: str
    description: str
    onset_duration: str
    reported_severity: int = Field(ge=1, le=10, default=5)
    accompanying_symptoms: Optional[str] = None
    existing_conditions: Optional[str] = None
    current_medications: Optional[str] = None
    access_barriers: Optional[str] = None
    temperature: Optional[float] = None
    heart_rate: Optional[int] = None
    systolic_bp: Optional[int] = None
    diastolic_bp: Optional[int] = None
    spo2: Optional[int] = None
    respiratory_rate: Optional[int] = None

class ClinicianReviewRequest(BaseModel):
    action: str  # CONFIRM_URGENCY, OVERRIDE_URGENCY, REQUEST_MORE_INFO, APPROVE_REFERRAL, CLOSE_ROUTINE
    confirmed_urgency: str  # LOW, MODERATE, HIGH, EMERGENCY
    clinical_notes: str
    override_reason: Optional[str] = None

# --- REFERRAL SCHEMAS ---
class AuthorizeReferralRequest(BaseModel):
    hospital_id: str
    target_department: str
    referral_reason: str
    urgency: str = "MODERATE"
    is_alternative: bool = False

class RespondReferralRequest(BaseModel):
    response_type: str  # ACCEPT, DECLINE, REQUEST_INFO
    reason_code: Optional[str] = None  # NO_BEDS, NO_SPECIALIST_ON_DUTY, CAPACITY_EXCEEDED
    response_notes: Optional[str] = None
    proposed_appointment_time: Optional[str] = None

class ConfirmAppointmentRequest(BaseModel):
    scheduled_at: str
    doctor_name: Optional[str] = "Duty Specialist"
    department_name: Optional[str] = "General Medicine"

class CareEncounterReportRequest(BaseModel):
    arrival_status: str = "ARRIVED"  # ARRIVED, NOT_ARRIVED
    consultation_notes: str
    discharge_instructions: Optional[str] = None

# --- FOLLOW-UP & RESCUE SCHEMAS ---
class CompleteTaskRequest(BaseModel):
    worker_notes: str
    barrier_reported: Optional[str] = None

class EscalateTaskRequest(BaseModel):
    escalation_reason: str

class CloseCaseRequest(BaseModel):
    closure_reason: str

# --- HOSPITAL CAPACITY SCHEMAS ---
class HospitalCapacityUpdateRequest(BaseModel):
    total_beds: int
    available_beds: int
    has_icu: bool
    has_oxygen_manifold: bool
    operating_hours: Optional[str] = None

class HospitalVerificationRequest(BaseModel):
    verification_status: str  # VERIFIED, REJECTED, UNDER_REVIEW
    verification_notes: Optional[str] = None
