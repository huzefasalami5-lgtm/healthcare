"""Tests for CuraReach LifeLink: Family-Assisted Deceased Donation Enquiries
Verifies strict separation from living donor registration, patient records,
and enforces statutory safeguards under THOTA 1994/2011 and NOTTO guidelines.
"""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash, Role
from app.models.user import User
from app.models.hospital import Hospital
from app.models.lifelink import (
    DonorProfile, DeceasedDonationEnquiry, DeceasedEnquiryStatus
)

TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # 1. Verified Hospital
    hosp_verified = Hospital(
        id="hosp-verified-1",
        name="Shivamogga District Civil Hospital",
        facility_type="District Civil Hospital",
        address="Court Road, Shivamogga",
        district="Shivamogga",
        state="Karnataka",
        contact_phone="+91 8182 222100",
        contact_email="civilhosp.smg@karnataka.gov.in",
        total_beds=250,
        available_beds=40,
        verification_status="VERIFIED"
    )
    # 2. Unverified Hospital
    hosp_unverified = Hospital(
        id="hosp-unverified-1",
        name="Unverified Private Clinic",
        facility_type="Private Nursing Home",
        address="Main Bazaar, Shivamogga",
        district="Shivamogga",
        state="Karnataka",
        contact_phone="+91 8182 299999",
        contact_email="contact@unverifiedclinic.org",
        total_beds=30,
        available_beds=5,
        verification_status="PENDING_VERIFICATION"
    )
    # 3. Test Users
    u_family = User(
        id="user-family-1",
        email="family.enquirer@example.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="Kavita Deshmukh",
        role=Role.DONOR,
        phone="+91-98765-43210"
    )
    u_other_family = User(
        id="user-family-2",
        email="other.family@example.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="Rajesh Sharma",
        role=Role.DONOR,
        phone="+91-98765-43211"
    )
    u_coord = User(
        id="user-coord-verified",
        email="coordinator.hosp1@curareach.org",
        hashed_password=get_password_hash("Password123!"),
        full_name="Dr. Sunita Kulkarni",
        role=Role.HOSPITAL_STAFF,
        organization_id=hosp_verified.id
    )
    u_unverified_staff = User(
        id="user-staff-unverified",
        email="staff.unverified@example.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="Nurse Ravi",
        role=Role.HOSPITAL_STAFF,
        organization_id=hosp_unverified.id
    )
    
    db.add_all([hosp_verified, hosp_unverified, u_family, u_other_family, u_coord, u_unverified_staff])
    db.commit()
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield
    
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

def get_test_client():
    return TestClient(app)

def test_deceased_enquiry_submission_success(setup_test_db):
    client = get_test_client()
    token = create_access_token({"sub": "user-family-1", "role": Role.DONOR})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "family_member_name": "Kavita Deshmukh",
        "family_member_contact": "+91-98765-43210",
        "relationship_to_deceased": "Daughter",
        "preferred_language": "Marathi",
        "deceased_name": "Late Smt. Shanta Deshmukh",
        "deceased_age": 72,
        "date_of_death": datetime.now(timezone.utc).isoformat(),
        "hospital_name": "Shivamogga District Civil Hospital",
        "current_location": "Shivamogga",
        "already_speaking_with_coordinator": True,
        "official_pledge_reference": "NOTTO-2025-PLEDGE-9912",
        "privacy_notice_accepted": True,
        "coordinator_contact_permission": True
    }

    res = client.post("/api/v1/lifelink/enquiries/deceased", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    enquiry = data["enquiry"]
    assert enquiry["enquiry_reference"].startswith("CR-DEC-2026-")
    assert enquiry["family_member_name"] == "Kavita Deshmukh"
    assert enquiry["enquiry_status"] in [
        DeceasedEnquiryStatus.SUBMITTED,
        DeceasedEnquiryStatus.AWAITING_AUTHORIZED_COORDINATOR
    ]
    # Verify official guidance is attached
    assert "notto_portal_url" in enquiry["official_guidance"]
    assert enquiry["official_guidance"]["notto_helpline"] == "1800-11-4770"
    assert "time_sensitivity_notice" in enquiry["official_guidance"]

def test_deceased_enquiry_mandatory_consent_rejections(setup_test_db):
    client = get_test_client()
    token = create_access_token({"sub": "user-family-1", "role": Role.DONOR})
    headers = {"Authorization": f"Bearer {token}"}

    base_payload = {
        "family_member_name": "Kavita Deshmukh",
        "family_member_contact": "+91-98765-43210",
        "relationship_to_deceased": "Daughter",
        "privacy_notice_accepted": True,
        "coordinator_contact_permission": True
    }

    # 1. Missing privacy notice acceptance
    p1 = dict(base_payload, privacy_notice_accepted=False)
    res1 = client.post("/api/v1/lifelink/enquiries/deceased", json=p1, headers=headers)
    assert res1.status_code == 400
    assert "privacy notice" in res1.json()["detail"].lower()

    # 2. Missing coordinator contact permission
    p2 = dict(base_payload, coordinator_contact_permission=False)
    res2 = client.post("/api/v1/lifelink/enquiries/deceased", json=p2, headers=headers)
    assert res2.status_code == 400
    assert "coordinator" in res2.json()["detail"].lower()

    # 3. Missing relationship
    p3 = dict(base_payload, relationship_to_deceased="")
    res3 = client.post("/api/v1/lifelink/enquiries/deceased", json=p3, headers=headers)
    assert res3.status_code == 400

def test_deceased_enquiry_never_creates_living_donor_profile(setup_test_db):
    """Safety Test: A family enquiry must NEVER create a living DonorProfile."""
    db = TestingSessionLocal()
    initial_donors_count = db.query(DonorProfile).count()
    db.close()

    client = get_test_client()
    token = create_access_token({"sub": "user-family-1", "role": Role.DONOR})
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "family_member_name": "Test Family Relative",
        "family_member_contact": "+91-99999-88888",
        "relationship_to_deceased": "Brother",
        "deceased_name": "Late Relative Name",
        "privacy_notice_accepted": True,
        "coordinator_contact_permission": True
    }
    res = client.post("/api/v1/lifelink/enquiries/deceased", json=payload, headers=headers)
    assert res.status_code == 200

    db = TestingSessionLocal()
    final_donors_count = db.query(DonorProfile).count()
    db.close()

    # Living donor count MUST be strictly unchanged
    assert final_donors_count == initial_donors_count

def test_family_can_view_and_withdraw_own_enquiry(setup_test_db):
    client = get_test_client()
    token1 = create_access_token({"sub": "user-family-1", "role": Role.DONOR})
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Fetch enquiries submitted by user-family-1
    res = client.get("/api/v1/lifelink/enquiries/deceased/my", headers=headers1)
    assert res.status_code == 200
    enquiries = res.json()
    assert len(enquiries) >= 1
    enquiry_id = enquiries[0]["id"]

    # Withdraw enquiry
    w_res = client.post(f"/api/v1/lifelink/enquiries/deceased/{enquiry_id}/withdraw", headers=headers1)
    assert w_res.status_code == 200
    assert w_res.json()["enquiry"]["enquiry_status"] == DeceasedEnquiryStatus.WITHDRAWN

    # Another family cannot withdraw this enquiry
    token2 = create_access_token({"sub": "user-family-2", "role": Role.DONOR})
    headers2 = {"Authorization": f"Bearer {token2}"}
    unauth_w_res = client.post(f"/api/v1/lifelink/enquiries/deceased/{enquiry_id}/withdraw", headers=headers2)
    assert unauth_w_res.status_code == 403

def test_verified_hospital_coordinator_workflow(setup_test_db):
    client = get_test_client()
    # 1. Submit fresh enquiry
    token_family = create_access_token({"sub": "user-family-1", "role": Role.DONOR})
    res_sub = client.post("/api/v1/lifelink/enquiries/deceased", json={
        "family_member_name": "Prakash Rao",
        "family_member_contact": "+91-98440-11223",
        "relationship_to_deceased": "Spouse",
        "hospital_name": "Shivamogga District Civil Hospital",
        "current_location": "Shivamogga",
        "privacy_notice_accepted": True,
        "coordinator_contact_permission": True
    }, headers={"Authorization": f"Bearer {token_family}"})
    assert res_sub.status_code == 200
    enquiry_id = res_sub.json()["enquiry"]["id"]

    # 2. Verified coordinator lists enquiries
    token_coord = create_access_token({"sub": "user-coord-verified", "role": Role.HOSPITAL_STAFF})
    headers_coord = {"Authorization": f"Bearer {token_coord}"}

    res_list = client.get("/api/v1/lifelink/hospitals/deceased-enquiries", headers=headers_coord)
    assert res_list.status_code == 200
    hosp_enquiries = res_list.json()
    assert any(e["id"] == enquiry_id for e in hosp_enquiries)

    # 3. Verified coordinator acknowledges receipt
    res_ack = client.patch(
        f"/api/v1/lifelink/hospitals/deceased-enquiries/{enquiry_id}/status",
        json={
            "new_status": "ACKNOWLEDGED",
            "coordinator_notes": "Spoke with Prakash Rao. Family requested counselor guidance.",
            "hospital_id": "hosp-verified-1"
        },
        headers=headers_coord
    )
    assert res_ack.status_code == 200
    assert res_ack.json()["enquiry"]["enquiry_status"] == "ACKNOWLEDGED"

    # 4. Verified coordinator records referral to authorized transplant facility
    res_ref = client.patch(
        f"/api/v1/lifelink/hospitals/deceased-enquiries/{enquiry_id}/status",
        json={
            "new_status": "REFERRED_TO_AUTHORIZED_HOSPITAL",
            "coordinator_notes": "Referred to State Organ and Tissue Transplant Organisation (SOTTO) nodal center.",
            "hospital_id": "hosp-verified-1"
        },
        headers=headers_coord
    )
    assert res_ref.status_code == 200
    assert res_ref.json()["enquiry"]["enquiry_status"] == "REFERRED_TO_AUTHORIZED_HOSPITAL"

def test_unverified_hospital_cannot_access_deceased_enquiries(setup_test_db):
    """Security Test: Unverified hospital facilities are strictly forbidden from accessing deceased enquiries."""
    client = get_test_client()
    token_unverified = create_access_token({"sub": "user-staff-unverified", "role": Role.HOSPITAL_STAFF})
    headers = {"Authorization": f"Bearer {token_unverified}"}

    res = client.get(
        "/api/v1/lifelink/hospitals/deceased-enquiries?hospital_id=hosp-unverified-1",
        headers=headers
    )
    assert res.status_code == 403
    assert "verified" in res.json()["detail"].lower()
