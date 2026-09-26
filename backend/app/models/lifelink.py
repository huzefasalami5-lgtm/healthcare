"""CuraReach LifeLink - Donor Coordination & Voluntary Network ORM Models
Conforms to Option A specification for Supabase PostgreSQL & local SQLite dual-mode.
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Date, ForeignKey, 
    Text, Integer, Numeric, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class DonorStatus:
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    WITHDRAWN = "WITHDRAWN"
    SUSPENDED = "SUSPENDED"

class HospitalVerificationStatus:
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"

class DonationCategory:
    BLOOD = "BLOOD"
    KIDNEY = "KIDNEY"
    LIVER = "LIVER"
    HEART = "HEART"
    LUNGS = "LUNGS"
    PANCREAS = "PANCREAS"
    CORNEA = "CORNEA"
    BONE_MARROW = "BONE_MARROW"
    LIVING_ORGAN_INTEREST = "LIVING_ORGAN_INTEREST"
    DECEASED_ORGAN_PLEDGE = "DECEASED_ORGAN_PLEDGE"
    TISSUE_INTEREST = "TISSUE_INTEREST"

class DonorRequestStatus:
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    ACTIVE = "ACTIVE"
    INVITATIONS_SENT = "INVITATIONS_SENT"
    DONOR_INTERESTED = "DONOR_INTERESTED"
    INTRODUCTION_AUTHORIZED = "INTRODUCTION_AUTHORIZED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class InvitationStatus:
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class IntroductionStatus:
    AUTHORIZED = "AUTHORIZED"
    CONTACTED = "CONTACTED"
    CLOSED = "CLOSED"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"

class DonorReferralStatus:
    INTEREST_RECORDED = "INTEREST_RECORDED"
    REFERRED_TO_AUTHORIZED_ORGANIZATION = "REFERRED_TO_AUTHORIZED_ORGANIZATION"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    CLOSED = "CLOSED"
    WITHDRAWN = "WITHDRAWN"

class DeceasedEnquiryStatus:
    SUBMITTED = "SUBMITTED"
    AWAITING_AUTHORIZED_COORDINATOR = "AWAITING_AUTHORIZED_COORDINATOR"
    REFERRED_TO_AUTHORIZED_HOSPITAL = "REFERRED_TO_AUTHORIZED_HOSPITAL"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    CLOSED = "CLOSED"
    WITHDRAWN = "WITHDRAWN"

class LifeLinkSubscriptionStatus:
    TRIAL = "TRIAL"
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class DonorProfile(Base):
    __tablename__ = "donor_profiles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    donor_reference = Column(String(50), unique=True, nullable=False, index=True)
    date_of_birth = Column(String(20), nullable=False)
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Karnataka", nullable=False)
    preferred_language = Column(String(50), default="English")
    preferred_contact_method = Column(String(50), default="Phone")
    account_status = Column(String(50), default=DonorStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = relationship("User")
    preferences = relationship("DonationPreference", back_populates="donor", cascade="all, delete-orphan")
    availability = relationship("DonorAvailability", back_populates="donor", uselist=False, cascade="all, delete-orphan")
    consents = relationship("DonorConsent", back_populates="donor", cascade="all, delete-orphan")
    invitations = relationship("DonorRequestInvitation", back_populates="donor")
    introductions = relationship("AuthorizedIntroduction", back_populates="donor")

class DonationPreference(Base):
    __tablename__ = "donation_preferences"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False, index=True)
    donation_category = Column(String(50), nullable=False)  # BLOOD, LIVING_ORGAN_INTEREST, etc.
    self_reported_blood_group = Column(String(10), nullable=True)
    living_organ_interest = Column(String(100), nullable=True)
    tissue_interest = Column(String(100), nullable=True)
    preferred_city = Column(String(100), nullable=True)
    preferred_district = Column(String(100), nullable=True)
    willing_to_travel = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    donor = relationship("DonorProfile", back_populates="preferences")

class DonorAvailability(Base):
    __tablename__ = "donor_availability"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), unique=True, nullable=False)
    availability_status = Column(String(50), default="AVAILABLE", nullable=False)  # AVAILABLE, BUSY, UNAVAILABLE, EMERGENCY_ONLY
    available_from = Column(DateTime, nullable=True)
    available_until = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    donor = relationship("DonorProfile", back_populates="availability")

class DonorConsent(Base):
    __tablename__ = "donor_consents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False, index=True)
    consent_type = Column(String(50), nullable=False)  # PRIVACY_NOTICE, REQUEST_NOTIFICATIONS, CONTACT_SHARING, OPTIONAL_ANALYTICS
    consent_version = Column(String(20), default="1.0")
    consent_text_hash = Column(String(64), nullable=True)
    granted = Column(Boolean, default=False, nullable=False)
    granted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    withdrawn_at = Column(DateTime, nullable=True)
    recorded_source = Column(String(50), default="WEB_PORTAL")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    donor = relationship("DonorProfile", back_populates="consents")

class DonorConsentEvent(Base):
    __tablename__ = "donor_consent_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    consent_id = Column(String(36), ForeignKey("donor_consents.id"), nullable=False, index=True)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # GRANTED, WITHDRAWN, UPDATED
    consent_version = Column(String(20), default="1.0")
    actor_id = Column(String(36), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class HospitalDonorRequest(Base):
    __tablename__ = "hospital_donor_requests"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id"), nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    internal_case_reference = Column(String(50), unique=True, nullable=False, index=True)
    donation_category = Column(String(50), default=DonationCategory.BLOOD, nullable=False)
    requested_blood_group = Column(String(10), nullable=True)
    units_needed = Column(Integer, default=1)
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    requested_from = Column(DateTime, nullable=False)
    requested_until = Column(DateTime, nullable=False)
    request_status = Column(String(50), default=DonorRequestStatus.DRAFT, nullable=False, index=True)
    request_description = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    hospital = relationship("Hospital")
    creator = relationship("User")
    invitations = relationship("DonorRequestInvitation", back_populates="request", cascade="all, delete-orphan")
    introductions = relationship("AuthorizedIntroduction", back_populates="request")

class DonorRequestInvitation(Base):
    __tablename__ = "donor_request_invitations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), ForeignKey("hospital_donor_requests.id"), nullable=False, index=True)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False, index=True)
    invitation_status = Column(String(50), default=InvitationStatus.PENDING, nullable=False)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    
    request = relationship("HospitalDonorRequest", back_populates="invitations")
    donor = relationship("DonorProfile", back_populates="invitations")
    response = relationship("DonorResponse", back_populates="invitation", uselist=False)

class DonorResponse(Base):
    __tablename__ = "donor_responses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invitation_id = Column(String(36), ForeignKey("donor_request_invitations.id"), unique=True, nullable=False)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False, index=True)
    response = Column(String(50), nullable=False)  # ACCEPT, DECLINE, REQUEST_MORE_INFO
    responded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    contact_sharing_approved = Column(Boolean, default=False)
    
    invitation = relationship("DonorRequestInvitation", back_populates="response")

class AuthorizedIntroduction(Base):
    __tablename__ = "authorized_introductions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), ForeignKey("hospital_donor_requests.id"), nullable=False, index=True)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False, index=True)
    hospital_id = Column(String(36), ForeignKey("hospitals.id"), nullable=False, index=True)
    consent_id = Column(String(36), ForeignKey("donor_consents.id"), nullable=False)
    authorized_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    permitted_contact_fields = Column(JSON, default=dict)  # {"name": True, "phone": True, "city": True}
    status = Column(String(50), default=IntroductionStatus.AUTHORIZED, nullable=False)
    authorized_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    
    request = relationship("HospitalDonorRequest", back_populates="introductions")
    donor = relationship("DonorProfile", back_populates="introductions")
    hospital = relationship("Hospital")

class IntroductionAccessEvent(Base):
    __tablename__ = "introduction_access_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    introduction_id = Column(String(36), ForeignKey("authorized_introductions.id"), nullable=False, index=True)
    accessed_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    access_action = Column(String(50), nullable=False)  # VIEWED_CONTACT, PHONE_REVEALED, etc.
    disclosed_fields = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DonorCoordinationEvent(Base):
    __tablename__ = "donor_coordination_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    request_id = Column(String(36), ForeignKey("hospital_donor_requests.id"), nullable=False, index=True)
    introduction_id = Column(String(36), nullable=True)
    actor_id = Column(String(36), nullable=True)
    event_type = Column(String(50), nullable=False)  # DONOR_CONTACTED, SCREENING_SCHEDULED, REQUEST_FULFILLED, CLOSED
    safe_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DonorReferral(Base):
    __tablename__ = "donor_referrals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    donor_id = Column(String(36), ForeignKey("donor_profiles.id"), nullable=False, index=True)
    authorized_organization_id = Column(String(36), nullable=True)
    donation_category = Column(String(50), nullable=False)  # LIVING_ORGAN_INTEREST, DECEASED_ORGAN_PLEDGE, TISSUE_INTEREST
    referral_status = Column(String(50), default=DonorReferralStatus.INTEREST_RECORDED, nullable=False)
    official_reference = Column(String(100), nullable=True)  # e.g. NOTTO Pledge Reference
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class DonorAuditEvent(Base):
    __tablename__ = "donor_audit_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), nullable=True)
    donor_id = Column(String(36), nullable=True, index=True)
    hospital_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(36), nullable=True)
    safe_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LifeLinkSubscriptionPlan(Base):
    __tablename__ = "lifelink_subscription_plans"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False)  # STARTER, PROFESSIONAL, ENTERPRISE
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    demo_price_inr = Column(Numeric(12, 2), default=0.00)
    billing_interval = Column(String(20), default="MONTHLY")
    feature_flags = Column(JSON, default=dict)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class HospitalLifeLinkSubscription(Base):
    __tablename__ = "hospital_lifelink_subscriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id"), nullable=False, index=True)
    plan_id = Column(String(36), ForeignKey("lifelink_subscription_plans.id"), nullable=False)
    subscription_status = Column(String(50), default=LifeLinkSubscriptionStatus.ACTIVE, nullable=False)
    starts_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ends_at = Column(DateTime, nullable=True)
    demo_mode = Column(Boolean, default=True)
    activated_by = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    hospital = relationship("Hospital")
    plan = relationship("LifeLinkSubscriptionPlan")

class LifeLinkSubscriptionInvoice(Base):
    __tablename__ = "lifelink_subscription_invoices"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    subscription_id = Column(String(36), ForeignKey("hospital_lifelink_subscriptions.id"), nullable=False, index=True)
    invoice_reference = Column(String(50), unique=True, nullable=False)
    amount_inr = Column(Numeric(12, 2), nullable=False)
    invoice_status = Column(String(50), default="PAID")
    simulated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class BackgroundJob(Base):
    __tablename__ = "background_jobs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    job_type = Column(String(50), nullable=False)
    payload = Column(JSON, default=dict)
    job_status = Column(String(50), default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    attempts = Column(Integer, default=0)
    next_attempt_at = Column(DateTime, nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class DeceasedDonationEnquiry(Base):
    __tablename__ = "deceased_donation_enquiries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    enquiry_reference = Column(String(50), unique=True, nullable=False, index=True)
    submitted_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    family_member_name = Column(Text, nullable=False)
    family_member_contact = Column(Text, nullable=False)
    relationship_to_deceased = Column(Text, nullable=False)
    preferred_language = Column(Text, default="English")
    deceased_name = Column(Text, nullable=True)
    deceased_age = Column(Integer, nullable=True)
    date_of_death = Column(DateTime(timezone=True), nullable=True)
    hospital_name = Column(Text, nullable=True)
    current_location = Column(Text, nullable=False)
    already_speaking_with_coordinator = Column(Boolean, default=False)
    official_pledge_reference = Column(Text, nullable=True)
    privacy_notice_accepted = Column(Boolean, default=False, nullable=False)
    coordinator_contact_permission = Column(Boolean, default=False, nullable=False)
    enquiry_status = Column(String(50), default=DeceasedEnquiryStatus.SUBMITTED, nullable=False, index=True)
    assigned_organization_id = Column(String(36), ForeignKey("hospitals.id"), nullable=True, index=True)
    assigned_coordinator_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    coordinator_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    submitted_by_user = relationship("User", foreign_keys=[submitted_by_user_id])
    assigned_organization = relationship("Hospital", foreign_keys=[assigned_organization_id])
    assigned_coordinator = relationship("User", foreign_keys=[assigned_coordinator_id])
