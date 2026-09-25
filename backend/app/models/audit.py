"""Immutable Audit Event and Agent Execution Journal (Section 12 & 13)"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class CaseStatusEvent(Base):
    """Immutable record created on EVERY case state transition"""
    __tablename__ = "case_status_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_role = Column(String(50), nullable=False)
    
    from_state = Column(String(60), nullable=False)
    to_state = Column(String(60), nullable=False)
    transition_event = Column(String(100), nullable=False)
    evidence_notes = Column(Text, nullable=True)
    
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    case = relationship("ClinicalCase", back_populates="status_events")
    actor = relationship("User")

class AgentExecution(Base):
    """Auditable log of AI agent invocations and schema outputs"""
    __tablename__ = "agent_executions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="CASCADE"), nullable=True, index=True)
    agent_name = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="SUCCESS")  # SUCCESS, FAILED, BYPASSED
    
    input_summary = Column(Text, nullable=False)
    output_summary = Column(Text, nullable=False)
    execution_duration_ms = Column(Integer, default=45)
    is_deterministic = Column(Boolean, default=True)  # True = Seeded/Deterministic, False = LLM Provider
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    """General security, consent, and resource access audit log"""
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # VIEW_IMAGE, WITHDRAW_CONSENT, OVERRIDE_URGENCY, VERIFY_HOSPITAL
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
