"""Triage assessment and Clinician Review models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ReviewAction:
    CONFIRM_URGENCY = "CONFIRM_URGENCY"
    OVERRIDE_URGENCY = "OVERRIDE_URGENCY"
    REQUEST_MORE_INFO = "REQUEST_MORE_INFO"
    APPROVE_REFERRAL = "APPROVE_REFERRAL"
    APPROVE_ALTERNATIVE = "APPROVE_ALTERNATIVE"
    CLOSE_ROUTINE = "CLOSE_ROUTINE"

class TriageAssessment(Base):
    __tablename__ = "triage_assessments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), unique=True, nullable=False)
    agent_name = Column(String(100), default="Agent 1: Clinical Intake Agent")
    
    provisional_urgency = Column(String(20), nullable=False)  # LOW, MODERATE, HIGH, EMERGENCY
    emergency_flags_detected = Column(Text, nullable=True)  # JSON or semicolon string of red flags
    clinical_rationale = Column(Text, nullable=False)
    missing_information_flags = Column(Text, nullable=True)
    recommended_specialty = Column(String(100), default="General Medicine")
    
    # Bedside stability flags
    is_vital_compromised = Column(Boolean, default=False)
    stabilization_directives = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    case = relationship("ClinicalCase", back_populates="triage")

class ClinicianReview(Base):
    __tablename__ = "clinician_reviews"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=False)
    clinician_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    
    action = Column(String(50), nullable=False)  # ReviewAction
    previous_urgency = Column(String(20), nullable=False)
    confirmed_urgency = Column(String(20), nullable=False)
    is_overridden = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    case = relationship("ClinicalCase", back_populates="reviews")
    clinician = relationship("User", foreign_keys=[clinician_id])
