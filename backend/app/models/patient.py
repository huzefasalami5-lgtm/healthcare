"""Patient Database Model and Pydantic Schemas"""
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, unique=True, index=True)
    
    full_name = Column(String(255), nullable=False)
    date_of_birth = Column(String(50), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    address = Column(Text, nullable=True)
    
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    blood_group = Column(String(10), default="O+")
    
    allergies = Column(Text, nullable=True)
    medical_conditions = Column(Text, nullable=True)
    current_medications = Column(Text, nullable=True)
    medical_history = Column(Text, nullable=True)
    previous_surgeries = Column(Text, nullable=True)
    family_medical_history = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user = relationship("User", back_populates="patient_record")
    medical_records = relationship("MedicalRecord", back_populates="patient_rel", cascade="all, delete-orphan", primaryjoin="Patient.id==MedicalRecord.patient_id", foreign_keys="[MedicalRecord.patient_id]", overlaps="patient,medical_records")
    appointments = relationship("Appointment", back_populates="patient_rel", cascade="all, delete-orphan", primaryjoin="Patient.id==Appointment.patient_id", foreign_keys="[Appointment.patient_id]", overlaps="appointment")
    prescriptions = relationship("Prescription", back_populates="patient_rel", cascade="all, delete-orphan", primaryjoin="Patient.id==Prescription.patient_id", foreign_keys="[Prescription.patient_id]", overlaps="patient,prescriptions")
    lab_results = relationship("LabResult", back_populates="patient_rel", cascade="all, delete-orphan", primaryjoin="Patient.id==LabResult.patient_id", foreign_keys="[LabResult.patient_id]")


# ====================================================================
# Backward Compatibility Pydantic Schemas for AI Agents & Intake
# ====================================================================

class Vitals(BaseModel):
    heart_rate: int = Field(..., description="Beats per minute (BPM)")
    systolic_bp: int = Field(..., description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: int = Field(..., description="Diastolic Blood Pressure (mmHg)")
    spo2: int = Field(..., description="Oxygen Saturation percentage (%)")
    temperature: float = Field(..., description="Body temperature in Fahrenheit")
    respiratory_rate: int = Field(..., description="Breaths per minute")

class PatientProfile(BaseModel):
    id: str = Field(..., description="Unique synthetic patient identifier")
    name: str = Field(..., description="Patient name")
    age: int = Field(..., description="Patient age in years")
    gender: str = Field(..., description="Male, Female, or Other")
    location: str = Field(..., description="Village / District description")
    sub_district: str = Field("Bhadravathi", description="Taluka or Sub-district")
    district: str = Field("Shivamogga", description="District")
    state: str = Field("Karnataka", description="State")
    connectivity: str = Field("limited", description="connectivity level: good, limited, 2g_only, offline")
    road_condition: str = Field("rough_terrain", description="paved, gravel, rough_terrain, flooded")
    current_facility_id: str = Field("phc-kudligere", description="Current facility where patient reported")
    symptoms: List[str] = Field(default_factory=list, description="Reported symptoms")
    vitals: Vitals
    comorbidities: List[str] = Field(default_factory=list, description="Existing conditions e.g. Hypertension, COPD")
    onset_duration: str = Field("2 days", description="Duration of symptoms")
    notes: Optional[str] = Field(None, description="Clinical or community health worker field notes")
    phone: Optional[str] = Field(None, description="Patient or caregiver contact phone number")
    caregiver_name: Optional[str] = Field(None, description="Caregiver name")
    emergency_contact: Optional[str] = Field(None, description="Emergency phone number")
    abha_id: Optional[str] = Field(None, description="Ayushman Bharat Health Account (ABHA) number")
    registered_at: Optional[str] = Field(None, description="Registration timestamp")
    assigned_asha: Optional[str] = Field(None, description="Organisation-appointed community health worker name")
