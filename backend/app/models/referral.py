"""Referral, Referral Response, Appointment, and Facility Recommendation models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ReferralStatus:
    DRAFT = "DRAFT"
    SENT = "SENT"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    INFO_REQUESTED = "INFO_REQUESTED"
    CANCELLED = "CANCELLED"

class AppointmentStatus:
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    MISSED = "MISSED"
    CANCELLED = "CANCELLED"

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    authorized_by_clinician_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(50), default=ReferralStatus.SENT, index=True, nullable=False)
    referral_reason = Column(Text, nullable=False)
    target_department = Column(String(100), default="General Medicine")
    urgency = Column(String(20), default="MODERATE")
    
    is_alternative = Column(Boolean, default=False)
    decline_reason = Column(Text, nullable=True)
    
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    case = relationship("ClinicalCase", back_populates="referrals")
    hospital = relationship("Hospital")
    authorizer = relationship("User", foreign_keys=[authorized_by_clinician_id])
    responses = relationship("ReferralResponse", back_populates="referral", cascade="all, delete-orphan")
    appointment = relationship("Appointment", back_populates="referral", uselist=False, cascade="all, delete-orphan")

class ReferralResponse(Base):
    __tablename__ = "referral_responses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    referral_id = Column(String(36), ForeignKey("referrals.id", ondelete="CASCADE"), nullable=False)
    responding_staff_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    response_type = Column(String(50), nullable=False)  # ACCEPT, DECLINE, REQUEST_INFO
    reason_code = Column(String(100), nullable=True)   # NO_BEDS, NO_SPECIALIST_ON_DUTY, CAPACITY_EXCEEDED, MISSING_CLINICAL_DATA
    response_notes = Column(Text, nullable=True)
    proposed_appointment_time = Column(String(100), nullable=True)
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    referral = relationship("Referral", back_populates="responses")
    staff = relationship("User", foreign_keys=[responding_staff_id])

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    referral_id = Column(String(36), ForeignKey("referrals.id", ondelete="CASCADE"), unique=True, nullable=False)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    
    scheduled_at = Column(String(100), nullable=False)  # e.g., "2026-09-28 10:30 AM"
    department_name = Column(String(100), default="General Medicine")
    doctor_name = Column(String(150), default="Specialist In-Charge")
    status = Column(String(50), default=AppointmentStatus.CONFIRMED, index=True)
    
    # Section 11: Patient Arrival & Consultation Updates
    arrival_status = Column(String(50), default="PENDING")  # PENDING, ARRIVED, NOT_ARRIVED
    consultation_notes = Column(Text, nullable=True)
    discharge_instructions = Column(Text, nullable=True)
    attendance_logged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    referral = relationship("Referral", back_populates="appointment")
    case = relationship("ClinicalCase")
    hospital = relationship("Hospital")

class FacilityRecommendation(Base):
    __tablename__ = "facility_recommendations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=False)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    
    capability_score = Column(Float, default=90.0)  # 0-100%
    match_reasons = Column(Text, nullable=False)     # Explainability "WHY"
    transport_feasibility = Column(String(100), default="Direct road connectivity (< 25 km)")
    data_freshness_warning = Column(String(255), nullable=True)
    is_alternative = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    hospital = relationship("Hospital")
