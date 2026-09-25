"""CuraReach LifeLink REST API Router
Endpoints for Donor Registration, Transparent Invitations, Separate Consent,
Hospital Voluntary Requests, Introductions, and LifeLink Subscriptions.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token, Role
from app.models.user import User
from app.models.hospital import Hospital
from app.models.lifelink import (
    DonorProfile, DonationPreference, DonorAvailability, DonorConsent,
    HospitalDonorRequest, DonorRequestInvitation, DonorResponse,
    AuthorizedIntroduction, DonorReferral, LifeLinkSubscriptionPlan,
    HospitalLifeLinkSubscription, LifeLinkSubscriptionInvoice,
    DonationCategory, DonorRequestStatus, InvitationStatus, IntroductionStatus
)
from app.services.lifelink_service import LifeLinkService, log_donor_audit

router = APIRouter(prefix="/lifelink", tags=["LifeLink - Donor Connect"])

# --- Helper Dependency for Current User ---
def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        # Fallback to demo donor user for smooth interactive demo
        user = db.query(User).filter(User.role == Role.DONOR).first()
        if not user:
            user = db.query(User).filter(User.role == Role.PATIENT).first() or db.query(User).first()
        return user
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


# --- Pydantic Schemas ---
class DonorRegisterRequest(BaseModel):
    full_name: str
    date_of_birth: str = "1995-05-14"
    city: str = "Shivamogga"
    district: str = "Shivamogga"
    state: str = "Karnataka"
    preferred_language: str = "English"
    preferred_contact_method: str = "Phone"
    self_reported_blood_group: Optional[str] = "O+"
    donation_categories: List[str] = ["BLOOD"]
    willing_to_travel: bool = True
    opt_in_notifications: bool = True

class DonorPreferenceUpdateRequest(BaseModel):
    self_reported_blood_group: Optional[str] = None
    donation_categories: Optional[List[str]] = None
    living_organ_interest: Optional[str] = None
    tissue_interest: Optional[str] = None
    willing_to_travel: Optional[bool] = None

class DonorAvailabilityUpdateRequest(BaseModel):
    availability_status: str = "AVAILABLE"  # AVAILABLE, BUSY, UNAVAILABLE, EMERGENCY_ONLY

class DonorConsentRequest(BaseModel):
    consent_type: str  # PRIVACY_NOTICE, REQUEST_NOTIFICATIONS, CONTACT_SHARING, OPTIONAL_ANALYTICS
    granted: bool

class InvitationResponseRequest(BaseModel):
    response: str  # ACCEPT, DECLINE
    contact_sharing_approved: bool = False

class HospitalRequestCreate(BaseModel):
    hospital_id: str
    donation_category: str = "BLOOD"
    requested_blood_group: Optional[str] = "O-"
    units_needed: int = 2
    city: str = "Shivamogga"
    district: str = "Shivamogga"
    requested_until_hours: int = 48
    description: Optional[str] = "Emergency blood requirement for acute trauma patient."

class EducationalReferralRequest(BaseModel):
    category: str  # DECEASED_ORGAN_PLEDGE, LIVING_ORGAN_INTEREST, TISSUE_INTEREST
    official_reference: Optional[str] = None

class SubscriptionActivateRequest(BaseModel):
    hospital_id: str
    plan_code: str = "STARTER"

# ====================================================================
# DONOR ENDPOINTS
# ====================================================================

@router.post("/donors/register")
def register_donor(
    req: DonorRegisterRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enroll as a voluntary donor (Free registration)"""
    donor = LifeLinkService.register_donor(
        db,
        user_id=user.id,
        full_name=req.full_name,
        date_of_birth=req.date_of_birth,
        city=req.city,
        district=req.district,
        state=req.state,
        preferred_language=req.preferred_language,
        preferred_contact_method=req.preferred_contact_method,
        blood_group=req.self_reported_blood_group,
        donation_categories=req.donation_categories,
        willing_to_travel=req.willing_to_travel,
        opt_in_notifications=req.opt_in_notifications
    )
    return {
        "status": "success",
        "message": "Voluntary donor registration successful",
        "donor_reference": donor.donor_reference,
        "donor_id": donor.id
    }

@router.get("/donors/me")
def get_donor_me(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get active donor profile and preferences"""
    donor = LifeLinkService.get_donor_by_user_id(db, user.id)
    if not donor:
        # Auto-create or seed if demo user
        donor = LifeLinkService.register_donor(
            db, user_id=user.id, full_name=user.full_name or "Demo Volunteer Donor",
            date_of_birth="1995-08-20", city="Shivamogga", district="Shivamogga",
            blood_group="O+", donation_categories=["BLOOD"]
        )

    prefs = db.query(DonationPreference).filter(DonationPreference.donor_id == donor.id).all()
    avail = db.query(DonorAvailability).filter(DonorAvailability.donor_id == donor.id).first()
    consents = db.query(DonorConsent).filter(DonorConsent.donor_id == donor.id).all()

    return {
        "id": donor.id,
        "donor_reference": donor.donor_reference,
        "full_name": user.full_name,
        "city": donor.city,
        "district": donor.district,
        "state": donor.state,
        "account_status": donor.account_status,
        "preferred_language": donor.preferred_language,
        "preferred_contact_method": donor.preferred_contact_method,
        "availability": avail.availability_status if avail else "AVAILABLE",
        "preferences": [
            {
                "category": p.donation_category,
                "blood_group": p.self_reported_blood_group,
                "living_organ_interest": p.living_organ_interest,
                "willing_to_travel": p.willing_to_travel
            } for p in prefs
        ],
        "consents": [
            {
                "type": c.consent_type,
                "granted": c.granted,
                "withdrawn_at": c.withdrawn_at
            } for c in consents
        ]
    }

@router.put("/donors/me/preferences")
def update_donor_preferences(
    req: DonorPreferenceUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update donation categories and self-reported blood group"""
    donor = LifeLinkService.get_donor_by_user_id(db, user.id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    LifeLinkService.update_preferences(
        db, donor_id=donor.id,
        blood_group=req.self_reported_blood_group,
        donation_categories=req.donation_categories,
        living_organ_interest=req.living_organ_interest,
        tissue_interest=req.tissue_interest,
        willing_to_travel=req.willing_to_travel
    )
    return {"status": "success", "message": "Donation preferences updated successfully"}

@router.put("/donors/me/availability")
def update_donor_availability(
    req: DonorAvailabilityUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update donor availability status"""
    donor = LifeLinkService.get_donor_by_user_id(db, user.id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    avail = LifeLinkService.update_availability(db, donor_id=donor.id, status=req.availability_status)
    return {"status": "success", "availability_status": avail.availability_status}

@router.post("/donors/me/consents")
def set_donor_consent(
    req: DonorConsentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grant or revoke specific consent (e.g. REQUEST_NOTIFICATIONS or CONTACT_SHARING)"""
    donor = LifeLinkService.get_donor_by_user_id(db, user.id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    consent = LifeLinkService.set_consent(
        db, donor_id=donor.id, consent_type=req.consent_type,
        granted=req.granted, actor_id=user.id
    )
    return {
        "status": "success",
        "consent_type": consent.consent_type,
        "granted": consent.granted,
        "withdrawn_at": consent.withdrawn_at
    }

@router.get("/donors/me/invitations")
def get_donor_invitations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List hospital requests for which the volunteer has been invited"""
    donor = LifeLinkService.get_donor_by_user_id(db, user.id)
    if not donor:
        return []

    invitations = db.query(DonorRequestInvitation).filter(
        DonorRequestInvitation.donor_id == donor.id
    ).order_by(DonorRequestInvitation.sent_at.desc()).all()

    result = []
    for inv in invitations:
        req = inv.request
        hosp = req.hospital if req else None
        result.append({
            "id": inv.id,
            "request_id": inv.request_id,
            "invitation_status": inv.invitation_status,
            "hospital_name": hosp.name if hosp else "District Hospital",
            "city": req.city if req else "Shivamogga",
            "donation_category": req.donation_category if req else "BLOOD",
            "requested_blood_group": req.requested_blood_group if req else None,
            "units_needed": req.units_needed if req else 1,
            "description": req.request_description if req else None,
            "sent_at": inv.sent_at,
            "expires_at": inv.expires_at,
            "responded_at": inv.responded_at
        })
    return result

@router.post("/invitations/{id}/respond")
def respond_to_invitation(
    id: str,
    req: InvitationResponseRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept or decline invitation with separate contact-sharing authorization"""
    donor = LifeLinkService.get_donor_by_user_id(db, user.id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    res = LifeLinkService.respond_to_invitation(
        db,
        invitation_id=id,
        donor_id=donor.id,
        response_type=req.response,
        contact_sharing_approved=req.contact_sharing_approved
    )
    return {
        "status": "success",
        "invitation_status": res["invitation_status"],
        "contact_sharing_approved": res["contact_sharing_approved"],
        "introduction_id": res["introduction_id"]
    }

@router.get("/donors/me/activity")
def get_donor_activity(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Summary of voluntary contributions, authorized introductions, and pledges"""
    donor = LifeLinkService.get_donor_by_user_id(db, user.id)
    if not donor:
        return {"invitations_count": 0, "accepted_count": 0, "introductions_count": 0, "pledges": []}

    invitations = db.query(DonorRequestInvitation).filter(DonorRequestInvitation.donor_id == donor.id).all()
    accepted = [i for i in invitations if i.invitation_status == "ACCEPTED"]
    introductions = db.query(AuthorizedIntroduction).filter(
        AuthorizedIntroduction.donor_id == donor.id,
        AuthorizedIntroduction.status != IntroductionStatus.REVOKED
    ).all()
    pledges = db.query(DonorReferral).filter(DonorReferral.donor_id == donor.id).all()

    return {
        "donor_reference": donor.donor_reference,
        "total_invitations": len(invitations),
        "accepted_invitations": len(accepted),
        "authorized_introductions": len(introductions),
        "pledges": [
            {
                "category": p.donation_category,
                "status": p.referral_status,
                "official_reference": p.official_reference,
                "created_at": p.created_at
            } for p in pledges
        ]
    }

@router.post("/donors/pledge")
def record_pledge(
    req: EducationalReferralRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record voluntary deceased-organ pledge or living organ education referral (NOTTO link)"""
    donor = LifeLinkService.get_donor_by_user_id(db, user.id)
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    pledge = LifeLinkService.record_organ_or_tissue_pledge(
        db, donor_id=donor.id, category=req.category,
        official_reference=req.official_reference
    )
    return {
        "status": "success",
        "message": "Pledge/Interest recorded. CuraReach provides educational referral only.",
        "notto_link": "https://notto.mohfw.gov.in/",
        "pledge_id": pledge.id
    }

# ====================================================================
# HOSPITAL VOLUNTARY REQUESTS & INTRODUCTIONS
# ====================================================================

@router.post("/hospitals/requests")
def create_hospital_donor_request(
    req: HospitalRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hospital staff creates a blood donor need broadcast"""
    new_req = LifeLinkService.create_hospital_request(
        db,
        hospital_id=req.hospital_id,
        user_id=user.id,
        donation_category=req.donation_category,
        requested_blood_group=req.requested_blood_group,
        units_needed=req.units_needed,
        city=req.city,
        district=req.district,
        requested_until_hours=req.requested_until_hours,
        description=req.description
    )
    return {
        "status": "success",
        "request_id": new_req.id,
        "reference": new_req.internal_case_reference,
        "request_status": new_req.request_status,
        "invitations_sent": len(new_req.invitations)
    }

@router.get("/hospitals/requests")
def list_hospital_requests(
    hospital_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List hospital donor requests with response counts"""
    query = db.query(HospitalDonorRequest)
    if hospital_id:
        query = query.filter(HospitalDonorRequest.hospital_id == hospital_id)
    requests = query.order_by(HospitalDonorRequest.created_at.desc()).all()

    result = []
    for r in requests:
        invs = r.invitations
        accepted = len([i for i in invs if i.invitation_status == "ACCEPTED"])
        intros = len(r.introductions)
        result.append({
            "id": r.id,
            "reference": r.internal_case_reference,
            "hospital_name": r.hospital.name if r.hospital else "Hospital",
            "donation_category": r.donation_category,
            "blood_group": r.requested_blood_group,
            "units_needed": r.units_needed,
            "city": r.city,
            "request_status": r.request_status,
            "invitations_count": len(invs),
            "accepted_count": accepted,
            "introductions_count": intros,
            "expires_at": r.expires_at,
            "created_at": r.created_at
        })
    return result

@router.get("/hospitals/introductions")
def list_authorized_introductions(
    hospital_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """View introductions where volunteer donor authorized contact sharing"""
    query = db.query(AuthorizedIntroduction).filter(
        AuthorizedIntroduction.status != IntroductionStatus.REVOKED
    )
    if hospital_id:
        query = query.filter(AuthorizedIntroduction.hospital_id == hospital_id)
    intros = query.order_by(AuthorizedIntroduction.authorized_at.desc()).all()

    result = []
    for intro in intros:
        req = intro.request
        result.append({
            "id": intro.id,
            "request_id": intro.request_id,
            "request_reference": req.internal_case_reference if req else "N/A",
            "blood_group": req.requested_blood_group if req else None,
            "status": intro.status,
            "permitted_contact": intro.permitted_contact_fields,
            "authorized_at": intro.authorized_at,
            "expires_at": intro.expires_at
        })
    return result

@router.post("/hospitals/requests/{id}/close")
def close_donor_request(
    id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Close an active donor request once fulfilled or expired"""
    req = db.query(HospitalDonorRequest).filter(HospitalDonorRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.request_status = DonorRequestStatus.CLOSED
    db.commit()
    return {"status": "success", "message": "Hospital donor request closed."}

# ====================================================================
# SUBSCRIPTIONS & ADMIN CONTROLS
# ====================================================================

@router.get("/plans")
def list_subscription_plans(db: Session = Depends(get_db)):
    """List LifeLink hospital software subscription plans (Simulated demo)"""
    plans = db.query(LifeLinkSubscriptionPlan).filter(LifeLinkSubscriptionPlan.active == True).all()
    if not plans:
        # Seed default plans if not yet seeded
        starter = LifeLinkSubscriptionPlan(
            id=str(uuid.uuid4()), code="STARTER", name="LifeLink Starter",
            description="Hospital verification & basic voluntary blood donor broadcast coordination",
            demo_price_inr=4999.00, billing_interval="MONTHLY",
            feature_flags={"max_requests_per_month": 10, "staff_accounts": 2, "multi_branch": False}
        )
        pro = LifeLinkSubscriptionPlan(
            id=str(uuid.uuid4()), code="PROFESSIONAL", name="LifeLink Professional",
            description="Advanced voluntary coordination, automated reminder queue & priority broadcast",
            demo_price_inr=14999.00, billing_interval="MONTHLY",
            feature_flags={"max_requests_per_month": 50, "staff_accounts": 10, "multi_branch": False}
        )
        ent = LifeLinkSubscriptionPlan(
            id=str(uuid.uuid4()), code="ENTERPRISE", name="LifeLink Network Enterprise",
            description="Multi-facility hospital network coordination, aggregate reporting & dedicated support",
            demo_price_inr=39999.00, billing_interval="MONTHLY",
            feature_flags={"max_requests_per_month": -1, "staff_accounts": -1, "multi_branch": True}
        )
        db.add_all([starter, pro, ent])
        db.commit()
        plans = [starter, pro, ent]

    return [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "description": p.description,
            "demo_price_inr": float(p.demo_price_inr),
            "billing_interval": p.billing_interval,
            "feature_flags": p.feature_flags
        } for p in plans
    ]

@router.post("/hospitals/subscription/demo-activate")
def activate_demo_subscription(
    req: SubscriptionActivateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulate hospital LifeLink subscription activation"""
    plan = db.query(LifeLinkSubscriptionPlan).filter(LifeLinkSubscriptionPlan.code == req.plan_code).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan code not found")

    existing = db.query(HospitalLifeLinkSubscription).filter(
        HospitalLifeLinkSubscription.hospital_id == req.hospital_id
    ).first()

    now = datetime.now(timezone.utc)
    if not existing:
        sub = HospitalLifeLinkSubscription(
            id=str(uuid.uuid4()),
            hospital_id=req.hospital_id,
            plan_id=plan.id,
            subscription_status="ACTIVE",
            starts_at=now,
            ends_at=now + timedelta(days=365),
            demo_mode=True,
            activated_by=user.id
        )
        db.add(sub)
    else:
        existing.plan_id = plan.id
        existing.subscription_status = "ACTIVE"
        sub = existing

    # Create simulated invoice
    inv = LifeLinkSubscriptionInvoice(
        id=str(uuid.uuid4()),
        subscription_id=sub.id,
        invoice_reference=f"INV-LL-2026-{uuid.uuid4().hex[:6].upper()}",
        amount_inr=plan.demo_price_inr,
        invoice_status="PAID",
        simulated=True
    )
    db.add(inv)
    db.commit()

    return {
        "status": "success",
        "message": f"Simulated {plan.name} subscription active for hospital.",
        "plan_code": plan.code,
        "invoice_reference": inv.invoice_reference
    }

@router.get("/insights")
def get_public_insights(db: Session = Depends(get_db)):
    """Aggregate public network statistics for landing section"""
    return LifeLinkService.get_aggregate_network_insights(db)
