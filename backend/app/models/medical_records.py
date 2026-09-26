"""Medical Records and Prescription models"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def generate_rx_code():
    return f"RX-2026-{uuid.uuid4().hex[:6].upper()}"

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
    patient_id = Column(String(36), nullable=False, index=True)
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)
    recorded_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Standard Patient Medical Record Fields
    visit_date = Column(String(50), nullable=True)
    symptoms = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    follow_up_date = Column(String(50), nullable=True)
    
    # Extended Document & Triage Metadata
    record_type = Column(String(50), default=MedicalRecordType.VISIT_NOTE, index=True)
    title = Column(String(200), default="Clinical Consultation Note", nullable=False)
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
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    patient_rel = relationship("Patient", back_populates="medical_records", foreign_keys=[patient_id], primaryjoin="MedicalRecord.patient_id==Patient.id", overlaps="patient,medical_records")
    patient = relationship("PatientProfile", back_populates="medical_records", foreign_keys=[patient_id], primaryjoin="MedicalRecord.patient_id==PatientProfile.id", overlaps="patient_rel,medical_records")
    doctor = relationship("User", foreign_keys=[doctor_id])
    recorder = relationship("User", foreign_keys=[recorded_by_user_id])
    case = relationship("ClinicalCase")
    appointment = relationship("Appointment")

class Prescription(Base):
    __tablename__ = "prescriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    prescription_code = Column(String(50), default=generate_rx_code, index=True, nullable=False)
    patient_id = Column(String(36), nullable=False, index=True)
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    clinician_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Standard Prescription Fields
    medicine_name = Column(String(255), nullable=True)
    dosage = Column(String(100), nullable=True)
    frequency = Column(String(100), nullable=True)
    duration = Column(String(100), nullable=True)
    instructions = Column(Text, nullable=True)
    prescription_date = Column(String(50), nullable=True)
    
    # Clinical Diagnosis & Guidance
    diagnosis = Column(String(255), default="General medical consultation", nullable=False)
    general_instructions = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, DISPENSED, COMPLETED, CANCELLED
    
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    valid_until = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    patient_rel = relationship("Patient", back_populates="prescriptions", foreign_keys=[patient_id], primaryjoin="Prescription.patient_id==Patient.id", overlaps="patient,prescriptions")
    patient = relationship("PatientProfile", back_populates="prescriptions", foreign_keys=[patient_id], primaryjoin="Prescription.patient_id==PatientProfile.id", overlaps="patient_rel,prescriptions")
    doctor = relationship("User", foreign_keys=[doctor_id])
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
