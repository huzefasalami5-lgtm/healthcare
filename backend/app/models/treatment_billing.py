"""Patient Treatment Billing and Transaction models
Note: Strictly separates hospital clinical treatment charges from CuraReach B2B software subscriptions.
All payment transactions are marked is_simulated=True per clinical hackathon requirements.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class TransactionType:
    CONSULTATION = "CONSULTATION"
    LAB_TEST = "LAB_TEST"
    PHARMACY = "PHARMACY"
    PROCEDURE = "PROCEDURE"
    HOSPITAL_ADMISSION = "HOSPITAL_ADMISSION"
    PACKAGE = "PACKAGE"

class PaymentStatus:
    UNPAID = "UNPAID"
    PAID = "PAID"
    REFUNDED = "REFUNDED"
    WAIVED_CSR = "WAIVED_CSR"
    GOVT_SCHEME_PMJAY = "GOVT_SCHEME_PMJAY"

class PaymentMethod:
    UPI = "UPI"
    CASH = "CASH"
    CARD = "CARD"
    PM_JAY = "PM_JAY"
    CSR_GRANT = "CSR_GRANT"
    SIMULATED_GATEWAY = "SIMULATED_GATEWAY"

class PatientTreatmentTransaction(Base):
    __tablename__ = "patient_treatment_transactions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. INV-MED-2026-0042
    patient_id = Column(String(36), ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(String(36), ForeignKey("clinical_cases.id", ondelete="SET NULL"), nullable=True, index=True)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True, index=True)
    
    transaction_type = Column(String(50), default=TransactionType.CONSULTATION, index=True)
    item_description = Column(Text, nullable=False)
    
    amount_inr = Column(Float, nullable=False, default=0.0)
    discount_inr = Column(Float, default=0.0)
    net_amount_inr = Column(Float, nullable=False, default=0.0)
    
    payment_status = Column(String(50), default=PaymentStatus.UNPAID, index=True)
    payment_method = Column(String(50), default=PaymentMethod.SIMULATED_GATEWAY)
    transaction_reference = Column(String(100), nullable=True) # e.g. TXN-SIM-20260925-001
    
    is_simulated = Column(Boolean, default=True) # Explicitly labeled as simulated
    notes = Column(Text, nullable=True)
    payment_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = relationship("PatientProfile", back_populates="transactions")
    case = relationship("ClinicalCase")
    hospital = relationship("Hospital")
    appointment = relationship("Appointment")
