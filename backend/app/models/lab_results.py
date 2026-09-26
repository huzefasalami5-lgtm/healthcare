"""Lab Results Model for Patient Diagnostics"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class LabResult(Base):
    __tablename__ = "lab_results"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    test_name = Column(String(255), nullable=False)
    test_date = Column(String(50), nullable=False)
    result = Column(Text, nullable=False)
    normal_range = Column(String(100), nullable=True)
    doctor_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient_rel = relationship("Patient", back_populates="lab_results")
    doctor = relationship("User", foreign_keys=[doctor_id])
