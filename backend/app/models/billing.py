"""Hospital Subscriptions and Demo Billing Models (Section 11)"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    plan_name = Column(String(100), unique=True, nullable=False)  # Starter Clinic, Health Network, Enterprise Regional
    tier = Column(String(50), nullable=False)                      # BASIC, PRO, ENTERPRISE
    monthly_fee_inr = Column(Float, nullable=False)               # Clearly labeled demo pricing
    max_monthly_referrals = Column(Integer, default=100)
    analytics_enabled = Column(Boolean, default=True)
    features_json = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class OrganizationSubscription(Base):
    __tablename__ = "organization_subscriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    plan_id = Column(String(36), ForeignKey("subscription_plans.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, TRIAL, EXPIRED, CANCELLED
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_date = Column(DateTime, nullable=True)
    
    hospital = relationship("Hospital")
    plan = relationship("SubscriptionPlan")

class DemoInvoice(Base):
    __tablename__ = "demo_invoices"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(String(36), ForeignKey("organization_subscriptions.id", ondelete="SET NULL"), nullable=True)
    
    invoice_number = Column(String(100), unique=True, nullable=False)
    amount_inr = Column(Float, nullable=False)
    status = Column(String(50), default="PAID")  # PAID, PENDING, OVERDUE
    issued_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    payment_method = Column(String(50), default="CSR Sponsor / Bank Transfer (Demo)")
    
    hospital = relationship("Hospital")
