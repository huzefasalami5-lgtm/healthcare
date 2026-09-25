"""Patient Medical History models (Conditions, Allergies, Surgeries, Medications, Family History)"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class PatientCondition(Base):
    __tablename__ = "patient_conditions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    condition_name = Column(String(200), nullable=False)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, RESOLVED, CHRONIC, CONTROLLED
    diagnosed_date = Column(String(50), nullable=True)
    severity = Column(String(50), default="MODERATE")  # MILD, MODERATE, SEVERE
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = relationship("PatientProfile", back_populates="conditions")

class PatientAllergy(Base):
    __tablename__ = "patient_allergies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    allergen = Column(String(200), nullable=False)  # e.g., Penicillin, Peanuts, Sulfa
    reaction = Column(String(255), nullable=True)   # e.g., Hives, Anaphylaxis, Shortness of breath
    severity = Column(String(50), default="MODERATE")  # MILD, MODERATE, SEVERE, LIFE_THREATENING
    date_noted = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = relationship("PatientProfile", back_populates="allergies")

class PatientSurgery(Base):
    __tablename__ = "patient_surgeries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    procedure_name = Column(String(200), nullable=False)
    surgery_date = Column(String(50), nullable=True)
    hospital_name = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = relationship("PatientProfile", back_populates="surgeries")

class PatientMedication(Base):
    __tablename__ = "patient_medications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    medication_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=True)     # e.g., "500 mg"
    frequency = Column(String(100), nullable=True)  # e.g., "Once daily after meals"
    start_date = Column(String(50), nullable=True)
    is_current = Column(Boolean, default=True)
    prescribed_by = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = relationship("PatientProfile", back_populates="medications")

class FamilyMedicalHistory(Base):
    __tablename__ = "family_medical_histories"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_to_patient = Column(String(100), nullable=False)  # Father, Mother, Sibling, Grandparent
    condition = Column(String(200), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = relationship("PatientProfile", back_populates="family_history")
