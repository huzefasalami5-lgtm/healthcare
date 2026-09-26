"""Sync organ donor preferences and requests to database"""
import uuid
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal
from app.models.lifelink import (
    DonorProfile, DonationPreference, DonationCategory,
    HospitalDonorRequest, DonorRequestStatus, DonorRequestInvitation,
    InvitationStatus, DonorResponse, AuthorizedIntroduction, IntroductionStatus,
    DonorConsent
)
from app.models.user import User
from app.core.security import Role
from app.models.hospital import Hospital

print("Starting organ donor sync...")
db = SessionLocal()

try:
    now = datetime.now(timezone.utc)
    
    # 1. Update/Add organ donation preferences for the 8 donors
    donor_organ_map = {
        "donor1@curareach.org": [DonationCategory.BLOOD, DonationCategory.KIDNEY],
        "donor2@curareach.org": [DonationCategory.BLOOD, DonationCategory.LIVER],
        "donor3@curareach.org": [DonationCategory.HEART, DonationCategory.LUNGS, DonationCategory.CORNEA],
        "donor4@curareach.org": [DonationCategory.KIDNEY, DonationCategory.CORNEA],
        "donor5@curareach.org": [DonationCategory.BLOOD, DonationCategory.LIVER, DonationCategory.PANCREAS],
        "donor6@curareach.org": [DonationCategory.HEART, DonationCategory.CORNEA],
        "donor7@curareach.org": [DonationCategory.KIDNEY, DonationCategory.BONE_MARROW],
        "donor8@curareach.org": [DonationCategory.KIDNEY, DonationCategory.LIVER, DonationCategory.HEART, DonationCategory.CORNEA],
    }

    donors = db.query(DonorProfile).join(User).all()
    for d in donors:
        u = db.query(User).filter(User.id == d.user_id).first()
        if not u or u.email not in donor_organ_map:
            continue
        
        target_cats = donor_organ_map[u.email]
        existing_prefs = db.query(DonationPreference).filter(DonationPreference.donor_id == d.id).all()
        existing_cats = {p.donation_category for p in existing_prefs}
        
        # Get blood group from existing pref if available
        bg = existing_prefs[0].self_reported_blood_group if existing_prefs else "O+"

        for cat in target_cats:
            if cat not in existing_cats:
                pref = DonationPreference(
                    id=str(uuid.uuid4()),
                    donor_id=d.id,
                    donation_category=cat,
                    self_reported_blood_group=bg,
                    living_organ_interest=f"Voluntary {cat.capitalize()} Donation" if cat in [DonationCategory.KIDNEY, DonationCategory.LIVER] else None,
                    tissue_interest=f"Pledged {cat.capitalize()} Tissue" if cat in [DonationCategory.CORNEA, DonationCategory.BONE_MARROW] else None,
                    preferred_city=d.city,
                    preferred_district=d.district,
                    willing_to_travel=True,
                    active=True
                )
                db.add(pref)
                print(f"Added {cat} preference for {u.full_name} ({u.email})")

    db.commit()

    # 2. Add sample emergency requests if missing
    hosp = db.query(Hospital).first()
    admin_u = db.query(User).filter(User.role == Role.HOSPITAL_STAFF).first() or db.query(User).first()

    if hosp and admin_u:
        requests_data = [
            (
                "req-donor-1001",
                "CR-REQ-2026-1001",
                DonationCategory.BLOOD,
                "O-",
                2,
                "Critical acute requirement: 2 units of O- Negative blood for postpartum hemorrhage emergency.",
                DonorRequestStatus.INTRODUCTION_AUTHORIZED
            ),
            (
                "req-donor-1002",
                "CR-REQ-2026-1002",
                DonationCategory.KIDNEY,
                "O-",
                1,
                "Urgent voluntary Kidney donor coordination for end-stage renal disease (ESRD) patient awaiting transplant compatibility.",
                DonorRequestStatus.ACTIVE
            ),
            (
                "req-donor-1003",
                "CR-REQ-2026-1003",
                DonationCategory.LIVER,
                "B+",
                1,
                "Urgent Living Donor Liver Lobe evaluation inquiry for acute fulminant hepatic failure.",
                DonorRequestStatus.ACTIVE
            ),
            (
                "req-donor-1004",
                "CR-REQ-2026-1004",
                DonationCategory.HEART,
                "A+",
                1,
                "NOTTO State Organ Tissue Transplant Network priority Heart match enquiry for cardiogenic shock recipient.",
                DonorRequestStatus.ACTIVE
            )
        ]

        for req_id, ref, cat, bg, units, desc, req_status in requests_data:
            existing_req = db.query(HospitalDonorRequest).filter(HospitalDonorRequest.internal_case_reference == ref).first()
            if not existing_req:
                r = HospitalDonorRequest(
                    id=req_id,
                    hospital_id=hosp.id,
                    created_by=admin_u.id,
                    internal_case_reference=ref,
                    donation_category=cat,
                    requested_blood_group=bg,
                    units_needed=units,
                    city="Shivamogga",
                    district="Shivamogga",
                    requested_from=now - timedelta(hours=4),
                    requested_until=now + timedelta(hours=48),
                    request_status=req_status,
                    request_description=desc,
                    expires_at=now + timedelta(hours=48)
                )
                db.add(r)
                print(f"Created emergency request: {ref} ({cat})")

        db.commit()

        # 3. Add sample introduction & invitation for req-donor-1001 if missing
        donor1 = db.query(DonorProfile).join(User).filter(User.email == "donor1@curareach.org").first()
        req1 = db.query(HospitalDonorRequest).filter(HospitalDonorRequest.id == "req-donor-1001").first()
        if donor1 and req1:
            inv = db.query(DonorRequestInvitation).filter(
                DonorRequestInvitation.request_id == req1.id,
                DonorRequestInvitation.donor_id == donor1.id
            ).first()
            if not inv:
                inv = DonorRequestInvitation(
                    id="inv-req-1001-donor-1",
                    request_id=req1.id,
                    donor_id=donor1.id,
                    invitation_status=InvitationStatus.ACCEPTED,
                    sent_at=now - timedelta(hours=5),
                    responded_at=now - timedelta(hours=4),
                    expires_at=req1.expires_at
                )
                db.add(inv)
                db.flush()

                resp = DonorResponse(
                    id="resp-1001-1",
                    invitation_id=inv.id,
                    donor_id=donor1.id,
                    response="ACCEPT",
                    responded_at=now - timedelta(hours=4),
                    contact_sharing_approved=True
                )
                db.add(resp)

                c_contact = db.query(DonorConsent).filter(
                    DonorConsent.donor_id == donor1.id,
                    DonorConsent.consent_type == "CONTACT_SHARING"
                ).first()
                if not c_contact:
                    c_contact = DonorConsent(
                        id="consent-contact-donor-1",
                        donor_id=donor1.id,
                        consent_type="CONTACT_SHARING",
                        consent_version="1.0",
                        granted=True
                    )
                    db.add(c_contact)
                    db.flush()

                intro = AuthorizedIntroduction(
                    id="intro-req-1001-donor-1",
                    request_id=req1.id,
                    donor_id=donor1.id,
                    hospital_id=hosp.id,
                    consent_id=c_contact.id,
                    authorized_by=donor1.user_id,
                    permitted_contact_fields={
                        "donor_name": "Rahul Verma",
                        "phone": "+91-98450-77101",
                        "city": "Shivamogga",
                        "district": "Shivamogga",
                        "preferred_language": "English"
                    },
                    status=IntroductionStatus.AUTHORIZED,
                    authorized_at=now - timedelta(hours=4),
                    expires_at=req1.expires_at
                )
                db.add(intro)
                db.commit()
                print("Seeded sample accepted invitation & introduction for donor 1.")

    print("\nSync completed successfully!")
    print(f"Total Donors: {db.query(DonorProfile).count()}")
    print(f"Total Preferences: {db.query(DonationPreference).count()}")
    print(f"Total Requests: {db.query(HospitalDonorRequest).count()}")
    for r in db.query(HospitalDonorRequest).all():
        print(f" - [{r.donation_category}] {r.internal_case_reference}: {r.request_description[:60]}...")
finally:
    db.close()
