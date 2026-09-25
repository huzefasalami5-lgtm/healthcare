"""User, Patient, Community Worker and Role models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, index=True)  # PATIENT, COMMUNITY_WORKER, CLINICIAN, HOSPITAL_STAFF, CURAREACH_ADMIN
    organization_id = Column(String(36), nullable=True, index=True)  # Hospital or NGO ID if applicable
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Profiles
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    worker_profile = relationship("CommunityWorkerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), default="Karnataka")
    emergency_contact_phone = Column(String(50), nullable=True)
    primary_language = Column(String(50), default="English")
    transport_access_barrier = Column(Boolean, default=False)
    financial_barrier = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="patient_profile")

class CommunityWorkerProfile(Base):
    __tablename__ = "community_worker_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    assigned_service_area = Column(String(100), nullable=False)
    assigned_supervisor = Column(String(100), default="Dr. Ananya Sen (District Care Lead)")
    training_status = Column(String(50), default="Certified (Level 2 Navigation)")
    active_case_count = Column(Integer, default=0)
    
    user = relationship("User", back_populates="worker_profile")
