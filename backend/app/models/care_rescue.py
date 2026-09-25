"""Follow-up tasks, Care Rescue, and In-App Notifications"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class TaskStatus:
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ESCALATED = "ESCALATED"

class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_worker_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    task_type = Column(String(100), nullable=False)  # BARRIER_ASSISTANCE, APPOINTMENT_REMINDER, POST_VISIT_CHECK, MEDICATION_VERIFICATION, STALLED_RESCUE
    description = Column(Text, nullable=False)
    due_date = Column(String(50), nullable=True)
    status = Column(String(50), default=TaskStatus.PENDING, index=True)
    
    barrier_reported = Column(Text, nullable=True)  # Transport, financial, family, hospital contact
    worker_notes = Column(Text, nullable=True)
    escalation_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    
    case = relationship("ClinicalCase", back_populates="tasks")
    worker = relationship("User", foreign_keys=[assigned_worker_id])
    patient = relationship("User", foreign_keys=[assigned_patient_id])

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO")  # INFO, ALERT, URGENT, RESCUE
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
