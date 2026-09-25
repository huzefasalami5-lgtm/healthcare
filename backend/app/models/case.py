"""Clinical Case, Consent, Symptom, and Image models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class CaseStatus:
    DRAFT = "DRAFT"
    INTAKE_SUBMITTED = "INTAKE_SUBMITTED"
    EMERGENCY_GUIDANCE_SHOWN = "EMERGENCY_GUIDANCE_SHOWN"
    AWAITING_CLINICIAN_REVIEW = "AWAITING_CLINICIAN_REVIEW"
    ADDITIONAL_INFORMATION_REQUIRED = "ADDITIONAL_INFORMATION_REQUIRED"
    CLINICIAN_REVIEWED = "CLINICIAN_REVIEWED"
    REFERRAL_APPROVED = "REFERRAL_APPROVED"
    REFERRAL_SENT = "REFERRAL_SENT"
    HOSPITAL_INFORMATION_REQUESTED = "HOSPITAL_INFORMATION_REQUESTED"
    REFERRAL_DECLINED = "REFERRAL_DECLINED"
    ALTERNATIVE_REVIEW_REQUIRED = "ALTERNATIVE_REVIEW_REQUIRED"
    REFERRAL_ACCEPTED = "REFERRAL_ACCEPTED"
    APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED"
    APPOINTMENT_MISSED = "APPOINTMENT_MISSED"
    CARE_ENCOUNTER_REPORTED = "CARE_ENCOUNTER_REPORTED"
    FOLLOW_UP_PENDING = "FOLLOW_UP_PENDING"
    FOLLOW_UP_COMPLETED = "FOLLOW_UP_COMPLETED"
    CLOSED = "CLOSED"

class UrgencyLevel:
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"

class ClinicalCase(Base):
    __tablename__ = "clinical_cases"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_worker_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_clinician_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True)
    
    current_state = Column(String(60), default=CaseStatus.DRAFT, index=True, nullable=False)
    provisional_urgency = Column(String(20), default=UrgencyLevel.LOW)  # Agent 1 recommendation
    confirmed_urgency = Column(String(20), nullable=True)  # Clinician confirmed/overridden
    
    primary_complaint = Column(String(255), nullable=False)
    chief_complaint_summary = Column(Text, nullable=True)
    is_assisted_by_worker = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)
    closure_reason = Column(String(255), nullable=True)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    worker = relationship("User", foreign_keys=[assigned_worker_id])
    clinician = relationship("User", foreign_keys=[assigned_clinician_id])
    hospital = relationship("Hospital", foreign_keys=[target_hospital_id])
    
    consent = relationship("ConsentRecord", back_populates="case", uselist=False, cascade="all, delete-orphan")
    symptoms = relationship("SymptomSubmission", back_populates="case", uselist=False, cascade="all, delete-orphan")
    images = relationship("UploadedImage", back_populates="case", cascade="all, delete-orphan")
    triage = relationship("TriageAssessment", back_populates="case", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("ClinicianReview", back_populates="case", cascade="all, delete-orphan")
    referrals = relationship("Referral", back_populates="case", cascade="all, delete-orphan")
    tasks = relationship("FollowUpTask", back_populates="case", cascade="all, delete-orphan")
    status_events = relationship("CaseStatusEvent", back_populates="case", cascade="all, delete-orphan", order_by="CaseStatusEvent.timestamp.asc()")

class ConsentRecord(Base):
    __tablename__ = "consent_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    purpose = Column(String(255), default="Care navigation, triage review, and authorized hospital referral coordination")
    consent_version = Column(String(20), default="v1.2-2026")
    
    # Granular checkboxes
    health_data_consent = Column(Boolean, default=True)
    referral_consent = Column(Boolean, default=True)
    photo_consent = Column(Boolean, default=False)
    worker_assistance_consent = Column(Boolean, default=False)
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_withdrawn = Column(Boolean, default=False)
    withdrawn_at = Column(DateTime, nullable=True)

    case = relationship("ClinicalCase", back_populates="consent")

class SymptomSubmission(Base):
    __tablename__ = "symptom_submissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    main_complaint = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    onset_duration = Column(String(100), nullable=False)
    reported_severity = Column(Integer, default=5)  # 1-10
    
    accompanying_symptoms = Column(Text, nullable=True)  # Comma-separated or JSON
    existing_conditions = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    access_barriers = Column(Text, nullable=True)  # Transport, financial, network
    
    # Optional bedside vitals (synthetic or measured)
    temperature = Column(Float, nullable=True)  # Celsius
    heart_rate = Column(Integer, nullable=True)  # bpm
    systolic_bp = Column(Integer, nullable=True)  # mmHg
    diastolic_bp = Column(Integer, nullable=True)  # mmHg
    spo2 = Column(Integer, nullable=True)  # %
    respiratory_rate = Column(Integer, nullable=True)  # breaths/min
    
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    case = relationship("ClinicalCase", back_populates="symptoms")

class UploadedImage(Base):
    __tablename__ = "uploaded_images"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=False)
    stored_filename = Column(String(255), unique=True, nullable=False)  # Randomized UUID filename
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)  # image/jpeg, image/png, image/webp
    file_size_bytes = Column(Integer, nullable=False)
    
    has_consent = Column(Boolean, default=True)
    uploaded_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Cautious AI analysis (NO autonomous diagnostic claims, non-promotional)
    ai_cautious_description = Column(Text, nullable=True)
    is_unusable = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    case = relationship("ClinicalCase", back_populates="images")
