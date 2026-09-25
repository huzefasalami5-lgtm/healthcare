"""Hospital, Department, Service, and Appointment Slot models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Hospital(Base):
    __tablename__ = "hospitals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    facility_type = Column(String(100), nullable=False)  # Primary Health Centre, Community Health Centre, District Hospital, Tertiary Hospital
    address = Column(String(255), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Karnataka")
    pincode = Column(String(20), default="577201")
    contact_phone = Column(String(50), nullable=False)
    contact_email = Column(String(100), nullable=False)
    
    # Verification lifecycle (Section 9)
    # Statuses: DRAFT, SUBMITTED, UNDER_REVIEW, VERIFIED, REJECTED, SUSPENDED
    verification_status = Column(String(50), default="VERIFIED", index=True)
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Manually maintained operational capacity (No live-stream fake claims)
    total_beds = Column(Integer, default=50)
    available_beds = Column(Integer, default=12)
    has_icu = Column(Boolean, default=True)
    has_oxygen_manifold = Column(Boolean, default=True)
    last_capacity_update = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    operating_hours = Column(String(100), default="24/7 Emergency & Inpatient, OPD: 09:00 - 17:00")
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    departments = relationship("HospitalDepartment", back_populates="hospital", cascade="all, delete-orphan")
    services = relationship("HospitalService", back_populates="hospital", cascade="all, delete-orphan")
    slots = relationship("AppointmentSlot", back_populates="hospital", cascade="all, delete-orphan")

class HospitalDepartment(Base):
    __tablename__ = "hospital_departments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # General Medicine, Dermatology, Cardiology, Orthopedics, Pulmonology, Emergency
    head_doctor = Column(String(150), nullable=True)
    is_active = Column(Boolean, default=True)
    
    hospital = relationship("Hospital", back_populates="departments")

class HospitalService(Base):
    __tablename__ = "hospital_services"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    category = Column(String(100), default="Clinical")  # Clinical, Diagnostic, Pharmacy, Inpatient
    is_available = Column(Boolean, default=True)
    notes = Column(String(255), nullable=True)
    
    hospital = relationship("Hospital", back_populates="services")

class AppointmentSlot(Base):
    __tablename__ = "appointment_slots"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(String(36), ForeignKey("hospital_departments.id", ondelete="SET NULL"), nullable=True)
    slot_time = Column(String(50), nullable=False)  # e.g., "Tomorrow, 10:30 AM"
    is_booked = Column(Boolean, default=False)
    doctor_name = Column(String(150), default="Duty Specialist")
    
    hospital = relationship("Hospital", back_populates="slots")
