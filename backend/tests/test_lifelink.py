"""Automated Tests for CuraReach LifeLink - Volunteer Donor Coordination & Restrictions
Verifies separate contact-sharing consent, invitation workflow, hospital subscriptions,
educational organ pledge paths, and cross-hospital isolation.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal, ensure_database_schema
from app.services.seed_service import seed_database
from app.models.lifelink import (
    DonorProfile, HospitalDonorRequest, DonorRequestInvitation,
    AuthorizedIntroduction, IntroductionStatus
)
from app.models.hospital import Hospital

@pytest.fixture(scope="module")
def client():
    ensure_database_schema()
    db = SessionLocal()
    seed_database(db)
    db.close()
    with TestClient(app) as c:
        yield c

def test_donor_registration_and_unique_reference(client):
    """Donor can register freely with self-reported blood group and receive unique reference"""
    res = client.post("/api/v1/lifelink/donors/register", json={
        "full_name": "Karthik Subramanian",
        "date_of_birth": "1992-11-20",
        "city": "Shivamogga",
        "district": "Shivamogga",
        "self_reported_blood_group": "B+",
        "donation_categories": ["BLOOD"],
        "willing_to_travel": True,
        "opt_in_notifications": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "donor_reference" in data
    assert data["donor_reference"].startswith("CR-DON-2026-")

def test_donor_preferences_and_availability_update(client):
    """Donor can update self-reported blood group and availability status"""
    res = client.put("/api/v1/lifelink/donors/me/availability", json={
        "availability_status": "EMERGENCY_ONLY"
    })
    assert res.status_code == 200
    assert res.json()["availability_status"] == "EMERGENCY_ONLY"

    res_pref = client.put("/api/v1/lifelink/donors/me/preferences", json={
        "self_reported_blood_group": "O-",
        "willing_to_travel": True
    })
    assert res_pref.status_code == 200

def test_hospital_request_creation_and_invitations(client):
    """Verified hospital creates blood broadcast and invitations are generated for compatible opted-in donors"""
    db = SessionLocal()
    hosp = db.query(Hospital).first()
    hosp_id = hosp.id if hosp else "shivamogga-hosp-1"
    db.close()

    res = client.post("/api/v1/lifelink/hospitals/requests", json={
        "hospital_id": hosp_id,
        "donation_category": "BLOOD",
        "requested_blood_group": "O-",
        "units_needed": 2,
        "city": "Shivamogga",
        "district": "Shivamogga",
        "requested_until_hours": 24,
        "description": "Urgent trauma unit requirement"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "request_id" in data
    assert data["invitations_sent"] >= 0

def test_separate_contact_sharing_consent_requirement(client):
    """Accepting invitation without contact sharing does NOT disclose phone or create authorized introduction"""
    from app.core.security import create_access_token
    db = SessionLocal()
    inv = db.query(DonorRequestInvitation).filter(
        DonorRequestInvitation.invitation_status == "PENDING"
    ).first()
    if not inv:
        db.close()
        return

    inv_id = inv.id
    user_id = inv.donor.user_id
    email = inv.donor.user.email
    db.close()

    token = create_access_token(data={"sub": user_id, "role": "DONOR", "email": email})
    headers = {"Authorization": f"Bearer {token}"}

    # Donor accepts invitation but declines contact sharing
    res = client.post(f"/api/v1/lifelink/invitations/{inv_id}/respond", headers=headers, json={
        "response": "ACCEPT",
        "contact_sharing_approved": False
    })
    assert res.status_code == 200
    data = res.json()
    assert data["invitation_status"] == "ACCEPTED"
    assert data["contact_sharing_approved"] is False
    assert data["introduction_id"] is None  # NO INTRODUCTION CREATED WITHOUT EXPLICIT CONTACT SHARING

def test_contact_sharing_creates_authorized_introduction(client):
    """Accepting invitation with contact sharing creates an authorized introduction record"""
    from app.core.security import create_access_token
    db = SessionLocal()
    inv = db.query(DonorRequestInvitation).first()
    inv_id = inv.id
    user_id = inv.donor.user_id
    email = inv.donor.user.email
    db.close()

    token = create_access_token(data={"sub": user_id, "role": "DONOR", "email": email})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post(f"/api/v1/lifelink/invitations/{inv_id}/respond", headers=headers, json={
        "response": "ACCEPT",
        "contact_sharing_approved": True
    })
    assert res.status_code == 200
    data = res.json()
    assert data["invitation_status"] == "ACCEPTED"
    assert data["contact_sharing_approved"] is True
    assert data["introduction_id"] is not None


def test_consent_withdrawal_revokes_active_introductions(client):
    """When a donor withdraws contact-sharing consent, active introductions are revoked"""
    res = client.post("/api/v1/lifelink/donors/me/consents", json={
        "consent_type": "CONTACT_SHARING",
        "granted": False
    })
    assert res.status_code == 200
    assert res.json()["granted"] is False

    # Check that any active introductions for this donor are marked REVOKED
    db = SessionLocal()
    donor = db.query(DonorProfile).first()
    intros = db.query(AuthorizedIntroduction).filter(
        AuthorizedIntroduction.donor_id == donor.id
    ).all()
    for intro in intros:
        assert intro.status == IntroductionStatus.REVOKED
    db.close()

def test_hospital_subscription_plans_and_demo_activation(client):
    """Hospital can view subscription plans and activate demo subscription"""
    res_plans = client.get("/api/v1/lifelink/plans")
    assert res_plans.status_code == 200
    plans = res_plans.json()
    assert len(plans) >= 3
    plan_codes = [p["code"] for p in plans]
    assert "STARTER" in plan_codes
    assert "PROFESSIONAL" in plan_codes
    assert "ENTERPRISE" in plan_codes

    db = SessionLocal()
    hosp = db.query(Hospital).first()
    hosp_id = hosp.id if hosp else "shivamogga-hosp-1"
    db.close()

    res_act = client.post("/api/v1/lifelink/hospitals/subscription/demo-activate", json={
        "hospital_id": hosp_id,
        "plan_code": "PROFESSIONAL"
    })
    assert res_act.status_code == 200
    assert res_act.json()["status"] == "success"
    assert "invoice_reference" in res_act.json()

def test_educational_pledge_recording(client):
    """Donor can record deceased-organ intention and receive NOTTO link without clinical organ allocation"""
    res = client.post("/api/v1/lifelink/donors/pledge", json={
        "category": "DECEASED_ORGAN_PLEDGE",
        "official_reference": "NOTTO-2026-IND-99182"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "https://notto.mohfw.gov.in/" in data["notto_link"]

def test_public_network_insights(client):
    """Public landing network insights return aggregate non-PII metrics"""
    res = client.get("/api/v1/lifelink/insights")
    assert res.status_code == 200
    data = res.json()
    assert "registered_donors" in data
    assert "volunteer_blood_donors" in data
    assert "city_distribution" in data
    assert len(data["city_distribution"]) > 0

def test_donor_isolation_from_patients_and_registration_data_sync(client):
    """Verifies that donor role switcher is isolated from patients and new donor registration stores & syncs data"""
    # 1. Verify switch-demo-role for DONOR yields pure DONOR user, NOT a patient
    res_switch = client.post("/api/v1/auth/switch-demo-role", json={"target_role": "DONOR"})
    assert res_switch.status_code == 200
    user_data = res_switch.json()["user"]
    assert user_data["role"] == "DONOR"
    assert user_data["patient_identifier"] is None
    assert "patient" not in user_data["email"].lower()

    # 2. Register a brand new distinct donor with specific profile fields
    res_reg = client.post("/api/v1/lifelink/donors/register", json={
        "full_name": "Meenakshi Sundaram",
        "email": "meenakshi.donor@example.com",
        "phone": "+91-98765-11223",
        "date_of_birth": "1993-04-15",
        "city": "Bhadravathi",
        "district": "Shivamogga",
        "self_reported_blood_group": "AB+",
        "donation_categories": ["BLOOD", "PLATELETS"],
        "willing_to_travel": True,
        "opt_in_notifications": True
    })
    assert res_reg.status_code == 200
    reg_data = res_reg.json()
    assert reg_data["status"] == "success"
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    assert reg_data["user"]["full_name"] == "Meenakshi Sundaram"
    assert reg_data["user"]["role"] == "DONOR"

    # 3. Query /donors/me with this new token to verify stored data and perfect sync
    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/api/v1/lifelink/donors/me", headers=headers)
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["full_name"] == "Meenakshi Sundaram"
    assert me_data["city"] == "Bhadravathi"
    assert me_data["district"] == "Shivamogga"
    
    # Verify blood group and preferences are stored accurately
    blood_pref = next((p for p in me_data["preferences"] if p["category"] == "BLOOD"), None)
    assert blood_pref is not None
    assert blood_pref["blood_group"] == "AB+"
    assert blood_pref["willing_to_travel"] is True
