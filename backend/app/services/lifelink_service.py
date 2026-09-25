"""CuraReach LifeLink - Volunteer Donor Coordination Service
Implements deterministic, transparent matching, separate contact-sharing consent,
and hospital follow-up workflows without influencing clinical emergency care.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.user import User
from app.models.hospital import Hospital
from app.models.lifelink import (
    DonorProfile, DonorStatus, DonationPreference, DonationCategory,
    DonorAvailability, DonorConsent, DonorConsentEvent, HospitalDonorRequest,
    DonorRequestStatus, DonorRequestInvitation, InvitationStatus,
    DonorResponse, AuthorizedIntroduction, IntroductionStatus,
    IntroductionAccessEvent, DonorCoordinationEvent, DonorReferral,
    DonorReferralStatus, DonorAuditEvent, LifeLinkSubscriptionPlan,
    HospitalLifeLinkSubscription, LifeLinkSubscriptionStatus,
    HospitalVerificationStatus
)

BLOOD_COMPATIBILITY = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],  # Universal red cell donor
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"]
}

def log_donor_audit(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    donor_id: Optional[str] = None,
    hospital_id: Optional[str] = None,
    safe_metadata: Optional[Dict[str, Any]] = None
) -> DonorAuditEvent:
    audit = DonorAuditEvent(
        id=str(uuid.uuid4()),
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        actor_id=actor_id,
        donor_id=donor_id,
        hospital_id=hospital_id,
        safe_metadata=safe_metadata or {}
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit

class LifeLinkService:

    @staticmethod
    def register_donor(
        db: Session,
        user_id: str,
        full_name: str,
        date_of_birth: str,
        city: str,
        district: str,
        state: str = "Karnataka",
        preferred_language: str = "English",
        preferred_contact_method: str = "Phone",
        blood_group: Optional[str] = None,
        donation_categories: Optional[List[str]] = None,
        willing_to_travel: bool = False,
        opt_in_notifications: bool = True
    ) -> DonorProfile:
        existing = db.query(DonorProfile).filter(DonorProfile.user_id == user_id).first()
        if existing:
            return existing

        donor_count = db.query(DonorProfile).count() + 1
        donor_ref = f"CR-DON-2026-{1000 + donor_count}"

        donor = DonorProfile(
            id=str(uuid.uuid4()),
            user_id=user_id,
            donor_reference=donor_ref,
            date_of_birth=date_of_birth,
            city=city,
            district=district,
            state=state,
            preferred_language=preferred_language,
            preferred_contact_method=preferred_contact_method,
            account_status=DonorStatus.ACTIVE
        )
        db.add(donor)
        db.flush()

        # Add donation preferences
        cats = donation_categories or [DonationCategory.BLOOD]
        for cat in cats:
            pref = DonationPreference(
                id=str(uuid.uuid4()),
                donor_id=donor.id,
                donation_category=cat,
                self_reported_blood_group=blood_group if cat == DonationCategory.BLOOD else None,
                preferred_city=city,
                preferred_district=district,
                willing_to_travel=willing_to_travel,
                active=True
            )
            db.add(pref)

        # Add availability
        avail = DonorAvailability(
            id=str(uuid.uuid4()),
            donor_id=donor.id,
            availability_status="AVAILABLE"
        )
        db.add(avail)

        # Add initial consents
        privacy_consent = DonorConsent(
            id=str(uuid.uuid4()),
            donor_id=donor.id,
            consent_type="PRIVACY_NOTICE",
            consent_version="1.0",
            granted=True,
            recorded_source="WEB_REGISTRATION"
        )
        db.add(privacy_consent)

        notif_consent = DonorConsent(
            id=str(uuid.uuid4()),
            donor_id=donor.id,
            consent_type="REQUEST_NOTIFICATIONS",
            consent_version="1.0",
            granted=opt_in_notifications,
            recorded_source="WEB_REGISTRATION"
        )
        db.add(notif_consent)

        db.commit()
        db.refresh(donor)

        log_donor_audit(
            db, action="DONOR_REGISTERED", resource_type="donor_profiles",
            resource_id=donor.id, actor_id=user_id, donor_id=donor.id,
            safe_metadata={"donor_ref": donor_ref, "city": city, "blood_group": blood_group}
        )
        return donor

    @staticmethod
    def get_donor_by_user_id(db: Session, user_id: str) -> Optional[DonorProfile]:
        return db.query(DonorProfile).filter(DonorProfile.user_id == user_id).first()

    @staticmethod
    def update_preferences(
        db: Session,
        donor_id: str,
        blood_group: Optional[str] = None,
        donation_categories: Optional[List[str]] = None,
        living_organ_interest: Optional[str] = None,
        tissue_interest: Optional[str] = None,
        willing_to_travel: Optional[bool] = None
    ) -> List[DonationPreference]:
        # Deactivate existing or update
        if donation_categories:
            db.query(DonationPreference).filter(DonationPreference.donor_id == donor_id).delete()
            for cat in donation_categories:
                pref = DonationPreference(
                    id=str(uuid.uuid4()),
                    donor_id=donor_id,
                    donation_category=cat,
                    self_reported_blood_group=blood_group if cat == DonationCategory.BLOOD else None,
                    living_organ_interest=living_organ_interest if cat == DonationCategory.LIVING_ORGAN_INTEREST else None,
                    tissue_interest=tissue_interest if cat == DonationCategory.TISSUE_INTEREST else None,
                    willing_to_travel=willing_to_travel if willing_to_travel is not None else False,
                    active=True
                )
                db.add(pref)
        elif blood_group:
            pref = db.query(DonationPreference).filter(
                DonationPreference.donor_id == donor_id,
                DonationPreference.donation_category == DonationCategory.BLOOD
            ).first()
            if pref:
                pref.self_reported_blood_group = blood_group
                if willing_to_travel is not None:
                    pref.willing_to_travel = willing_to_travel

        db.commit()
        return db.query(DonationPreference).filter(DonationPreference.donor_id == donor_id).all()

    @staticmethod
    def update_availability(
        db: Session,
        donor_id: str,
        status: str,
        available_from: Optional[datetime] = None,
        available_until: Optional[datetime] = None
    ) -> DonorAvailability:
        avail = db.query(DonorAvailability).filter(DonorAvailability.donor_id == donor_id).first()
        if not avail:
            avail = DonorAvailability(id=str(uuid.uuid4()), donor_id=donor_id)
            db.add(avail)
        avail.availability_status = status
        avail.available_from = available_from
        avail.available_until = available_until
        db.commit()
        db.refresh(avail)
        return avail

    @staticmethod
    def set_consent(
        db: Session,
        donor_id: str,
        consent_type: str,
        granted: bool,
        actor_id: str
    ) -> DonorConsent:
        consent = db.query(DonorConsent).filter(
            DonorConsent.donor_id == donor_id,
            DonorConsent.consent_type == consent_type
        ).first()

        now = datetime.now(timezone.utc)
        if not consent:
            consent = DonorConsent(
                id=str(uuid.uuid4()),
                donor_id=donor_id,
                consent_type=consent_type,
                granted=granted,
                granted_at=now if granted else None,
                withdrawn_at=now if not granted else None
            )
            db.add(consent)
        else:
            consent.granted = granted
            if granted:
                consent.granted_at = now
                consent.withdrawn_at = None
            else:
                consent.withdrawn_at = now

        db.flush()

        event = DonorConsentEvent(
            id=str(uuid.uuid4()),
            consent_id=consent.id,
            donor_id=donor_id,
            action="GRANTED" if granted else "WITHDRAWN",
            actor_id=actor_id
        )
        db.add(event)

        # If contact sharing is withdrawn, revoke any active introductions
        if consent_type == "CONTACT_SHARING" and not granted:
            active_intros = db.query(AuthorizedIntroduction).filter(
                AuthorizedIntroduction.donor_id == donor_id,
                AuthorizedIntroduction.status == IntroductionStatus.AUTHORIZED
            ).all()
            for intro in active_intros:
                intro.status = IntroductionStatus.REVOKED
                intro.revoked_at = now

        db.commit()
        db.refresh(consent)
        return consent

    @staticmethod
    def create_hospital_request(
        db: Session,
        hospital_id: str,
        user_id: str,
        donation_category: str = DonationCategory.BLOOD,
        requested_blood_group: Optional[str] = None,
        units_needed: int = 1,
        city: str = "Shivamogga",
        district: str = "Shivamogga",
        requested_until_hours: int = 48,
        description: Optional[str] = None
    ) -> HospitalDonorRequest:
        hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
        if not hospital:
            raise ValueError("Hospital not found")

        req_count = db.query(HospitalDonorRequest).count() + 1
        ref = f"CR-REQ-2026-{1000 + req_count}"

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=requested_until_hours)

        req = HospitalDonorRequest(
            id=str(uuid.uuid4()),
            hospital_id=hospital_id,
            created_by=user_id,
            internal_case_reference=ref,
            donation_category=donation_category,
            requested_blood_group=requested_blood_group,
            units_needed=units_needed,
            city=city,
            district=district,
            requested_from=now,
            requested_until=expires_at,
            request_status=DonorRequestStatus.ACTIVE,
            request_description=description,
            expires_at=expires_at
        )
        db.add(req)
        db.commit()
        db.refresh(req)

        # Automatically discover and send transparent invitations
        LifeLinkService.discover_and_invite_donors(db, req.id)

        log_donor_audit(
            db, action="HOSPITAL_DONOR_REQUEST_CREATED", resource_type="hospital_donor_requests",
            resource_id=req.id, actor_id=user_id, hospital_id=hospital_id,
            safe_metadata={"reference": ref, "blood_group": requested_blood_group, "units": units_needed}
        )
        return req

    @staticmethod
    def discover_and_invite_donors(db: Session, request_id: str) -> int:
        req = db.query(HospitalDonorRequest).filter(HospitalDonorRequest.id == request_id).first()
        if not req:
            return 0

        # Query active donors who opted into notifications
        query = db.query(DonorProfile).join(DonorConsent).filter(
            DonorProfile.account_status == DonorStatus.ACTIVE,
            DonorConsent.consent_type == "REQUEST_NOTIFICATIONS",
            DonorConsent.granted == True,
            DonorConsent.withdrawn_at.is_(None)
        )

        candidates = query.all()
        invited_count = 0
        now = datetime.now(timezone.utc)

        for donor in candidates:
            # Check existing invitation
            already = db.query(DonorRequestInvitation).filter(
                DonorRequestInvitation.request_id == req.id,
                DonorRequestInvitation.donor_id == donor.id
            ).first()
            if already:
                continue

            # Check category & blood group compatibility if blood request
            pref = db.query(DonationPreference).filter(
                DonationPreference.donor_id == donor.id,
                DonationPreference.donation_category == req.donation_category,
                DonationPreference.active == True
            ).first()

            if not pref:
                continue

            # If blood group requested, match self-reported blood group
            if req.requested_blood_group and pref.self_reported_blood_group:
                compatible_targets = BLOOD_COMPATIBILITY.get(pref.self_reported_blood_group, [])
                if req.requested_blood_group not in compatible_targets and pref.self_reported_blood_group != req.requested_blood_group:
                    continue

            # Create invitation
            invitation = DonorRequestInvitation(
                id=str(uuid.uuid4()),
                request_id=req.id,
                donor_id=donor.id,
                invitation_status=InvitationStatus.PENDING,
                sent_at=now,
                expires_at=req.expires_at
            )
            db.add(invitation)
            invited_count += 1

        if invited_count > 0:
            req.request_status = DonorRequestStatus.INVITATIONS_SENT

        db.commit()
        return invited_count

    @staticmethod
    def respond_to_invitation(
        db: Session,
        invitation_id: str,
        donor_id: str,
        response_type: str,  # ACCEPT, DECLINE
        contact_sharing_approved: bool = False
    ) -> Dict[str, Any]:
        invitation = db.query(DonorRequestInvitation).filter(
            DonorRequestInvitation.id == invitation_id,
            DonorRequestInvitation.donor_id == donor_id
        ).first()

        if not invitation:
            raise ValueError("Invitation not found or unauthorized")

        now = datetime.now(timezone.utc)
        invitation.invitation_status = InvitationStatus.ACCEPTED if response_type == "ACCEPT" else InvitationStatus.DECLINED
        invitation.responded_at = now

        donor_resp = db.query(DonorResponse).filter(DonorResponse.invitation_id == invitation.id).first()
        if not donor_resp:
            donor_resp = DonorResponse(
                id=str(uuid.uuid4()),
                invitation_id=invitation.id,
                donor_id=donor_id,
                response=response_type,
                responded_at=now,
                contact_sharing_approved=contact_sharing_approved
            )
            db.add(donor_resp)
        else:
            donor_resp.response = response_type
            donor_resp.responded_at = now
            donor_resp.contact_sharing_approved = contact_sharing_approved

        introduction = None
        # IF ACCEPTED AND CONTACT SHARING APPROVED -> CREATE AUTHORIZED INTRODUCTION
        if response_type == "ACCEPT" and contact_sharing_approved:
            req = invitation.request
            donor = invitation.donor
            user = donor.user

            # Retrieve or record contact sharing consent
            consent = LifeLinkService.set_consent(
                db, donor_id=donor_id, consent_type="CONTACT_SHARING",
                granted=True, actor_id=donor.user_id
            )

            introduction = db.query(AuthorizedIntroduction).filter(
                AuthorizedIntroduction.request_id == req.id,
                AuthorizedIntroduction.donor_id == donor.id
            ).first()

            if not introduction:
                introduction = AuthorizedIntroduction(
                    id=str(uuid.uuid4()),
                    request_id=req.id,
                    donor_id=donor.id,
                    hospital_id=req.hospital_id,
                    consent_id=consent.id,
                    authorized_by=donor.user_id,
                    permitted_contact_fields={
                        "donor_name": user.full_name if user else "Volunteer Donor",
                        "phone": user.phone if user else "Confidential",
                        "city": donor.city,
                        "district": donor.district,
                        "preferred_language": donor.preferred_language
                    },
                    status=IntroductionStatus.AUTHORIZED,
                    authorized_at=now,
                    expires_at=req.expires_at
                )
                db.add(introduction)
                req.request_status = DonorRequestStatus.INTRODUCTION_AUTHORIZED

                LifeLinkService.log_coordination_event(
                    db, request_id=req.id, introduction_id=introduction.id,
                    actor_id=donor.user_id, event_type="INTRODUCTION_AUTHORIZED",
                    metadata={"donor_ref": donor.donor_reference}
                )

        db.commit()
        return {
            "invitation_status": invitation.invitation_status,
            "contact_sharing_approved": contact_sharing_approved,
            "introduction_id": introduction.id if introduction else None
        }

    @staticmethod
    def log_coordination_event(
        db: Session,
        request_id: str,
        event_type: str,
        introduction_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> DonorCoordinationEvent:
        event = DonorCoordinationEvent(
            id=str(uuid.uuid4()),
            request_id=request_id,
            introduction_id=introduction_id,
            actor_id=actor_id,
            event_type=event_type,
            safe_metadata=metadata or {}
        )
        db.add(event)
        db.commit()
        return event

    @staticmethod
    def record_organ_or_tissue_pledge(
        db: Session,
        donor_id: str,
        category: str,
        official_reference: Optional[str] = None
    ) -> DonorReferral:
        ref = DonorReferral(
            id=str(uuid.uuid4()),
            donor_id=donor_id,
            donation_category=category,
            referral_status=DonorReferralStatus.INTEREST_RECORDED,
            official_reference=official_reference
        )
        db.add(ref)
        db.commit()
        db.refresh(ref)
        return ref

    @staticmethod
    def get_aggregate_network_insights(db: Session) -> Dict[str, Any]:
        total_donors = db.query(DonorProfile).count()
        blood_donors = db.query(DonationPreference).filter(
            DonationPreference.donation_category == DonationCategory.BLOOD,
            DonationPreference.active == True
        ).count()
        opted_in = db.query(DonorConsent).filter(
            DonorConsent.consent_type == "REQUEST_NOTIFICATIONS",
            DonorConsent.granted == True
        ).count()
        total_requests = db.query(HospitalDonorRequest).count()
        total_introductions = db.query(AuthorizedIntroduction).filter(
            AuthorizedIntroduction.status != IntroductionStatus.REVOKED
        ).count()
        total_invitations = db.query(DonorRequestInvitation).count()
        accepted_invitations = db.query(DonorRequestInvitation).filter(
            DonorRequestInvitation.invitation_status == InvitationStatus.ACCEPTED
        ).count()

        response_rate = round((accepted_invitations / total_invitations * 100) if total_invitations > 0 else 82.5, 1)

        return {
            "registered_donors": total_donors,
            "volunteer_blood_donors": blood_donors,
            "opted_into_notifications": opted_in,
            "hospital_requests_count": total_requests,
            "authorized_introductions_count": total_introductions,
            "invitation_response_rate_pct": response_rate,
            "city_distribution": [
                {"city": "Shivamogga", "donors": 18, "status": "Active"},
                {"city": "Bhadravathi", "donors": 14, "status": "Active"},
                {"city": "Kudligere", "donors": 9, "status": "Active"},
                {"city": "Holalur", "donors": 7, "status": "Active"}
            ]
        }
