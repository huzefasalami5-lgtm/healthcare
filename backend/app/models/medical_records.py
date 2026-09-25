"""Medical Records and Prescription models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class MedicalRecordType:
    VISIT_NOTE = "VISIT_NOTE"
    PRESCRIPTION = "PRESCRIPTION"
    LAB_REPORT = "LAB_REPORT"
    DIAGNOSTIC_IMAGING = "DIAGNOSTIC_IMAGING"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY"
    OTHER = "OTHER"

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)
    recorded_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    record_type = Column(String(50), default=MedicalRecordType.VISIT_NOTE, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    facility_name = Column(String(200), nullable=True)
    
    # Document storage metadata (stored in backend/uploads/private/)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    mime_type = Column(String(100), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    
    document_date = Column(String(50), nullable=True)
    is_sensitive = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = relationship("PatientProfile", back_populates="medical_records")
    recorder = relationship("User", foreign_keys=[recorded_by_user_id])
    case = relationship("ClinicalCase")
    appointment = relationship("Appointment")

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    prescription_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. RX-2026-0042
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)
    clinician_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    diagnosis = Column(String(255), nullable=False)
    general_instructions = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, DISPENSED, COMPLETED, CANCELLED
    
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    valid_until = Column(String(50), nullable=True)
    
    patient = relationship("PatientProfile", back_populates="prescriptions")
    clinician = relationship("User", foreign_keys=[clinician_id])
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")

class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    prescription_id = Column(String(36), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    medication_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)         # e.g., "500 mg"
    frequency = Column(String(100), nullable=False)      # e.g., "Twice daily after food"
    duration_days = Column(Integer, default=5)          # e.g., 5 days
    instructions = Column(String(255), nullable=True)    # e.g., "Drink plenty of water"
    
    prescription = relationship("Prescription", back_populates="items")
