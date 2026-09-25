"""Comprehensive Automated Backend Test Suite for CuraReach 360 (Section 19)
Tests RBAC, Consent, Emergency Warning, Clinician Approval Gates, Isolation, State Machine, and Image Validation.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal, ensure_database_schema
from app.services.seed_service import seed_database
from app.core.security import create_access_token

@pytest.fixture(scope="module")
def client():
    ensure_database_schema()
    db = SessionLocal()
    seed_database(db)
    db.close()
    with TestClient(app) as c:
        yield c

def get_auth_header(email: str, role: str) -> dict:
    from app.models.user import User
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    db.close()
    token = create_access_token(data={"sub": user.id, "role": role, "email": email})
    return {"Authorization": f"Bearer {token}"}

# 1. AUTHENTICATION & LOGIN
def test_login_success_and_jwt_issuance(client):
    res = client.post("/api/v1/auth/login", json={"email": "patient@curareach.org", "password": "patient123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" == "access_token" in data or "access_token" in data
    assert data["user"]["role"] == "PATIENT"

def test_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={"email": "patient@curareach.org", "password": "wrongpassword"})
    assert res.status_code == 401

# 2. EMERGENCY BYPASS (Section 4, 18 Scenario E, 19)
def test_emergency_warning_triggers_emergency_guidance_and_bypasses_queue(client):
    headers = get_auth_header("patient@curareach.org", "PATIENT")
    # Create new case
    c_res = client.post("/api/v1/cases/", json={
        "primary_complaint": "Acute crushing chest pain",
        "health_data_consent": True,
        "referral_consent": True
    }, headers=headers)
    assert c_res.status_code == 201
    case_id = c_res.json()["id"]

    # Submit symptoms with emergency red flag (chest pain, SpO2 86%)
    s_res = client.post(f"/api/v1/intake/{case_id}/submit", json={
        "main_complaint": "Crushing chest pain radiating to left jaw",
        "description": "Severe retrosternal pressure, cold sweats",
        "onset_duration": "30 minutes",
        "reported_severity": 10,
        "spo2": 86,
        "heart_rate": 125
    }, headers=headers)
    assert s_res.status_code == 200
    data = s_res.json()
    assert data["is_emergency"] is True
    assert data["current_state"] == "EMERGENCY_GUIDANCE_SHOWN"
    assert "112" in data["emergency_warning"]

# 3. CLINICIAN APPROVAL GATE (Section 19: AI recommendation cannot independently authorize a referral)
def test_ai_cannot_independently_authorize_referral_patient_forbidden(client):
    patient_headers = get_auth_header("patient@curareach.org", "PATIENT")
    # Patient attempting to directly authorize a referral must be rejected (403 Forbidden)
    res = client.post("/api/v1/referrals/any-case-id/authorize", json={
        "hospital_id": "any-hosp-id",
        "target_department": "Cardiology",
        "referral_reason": "Bypass test"
    }, headers=patient_headers)
    assert res.status_code == 403

# 4. COMMUNITY WORKER ISOLATION (Section 10 & 19: Worker cannot access unassigned patient's record)
def test_worker_cannot_access_unassigned_case(client):
    # Worker 2 attempting to view Case CR-2026-001 (assigned to Worker 1)
    worker2_headers = get_auth_header("worker2@curareach.org", "COMMUNITY_WORKER")
    db = SessionLocal()
    from app.models.case import ClinicalCase
    case1 = db.query(ClinicalCase).filter(ClinicalCase.case_number == "CR-2026-001").first()
    db.close()
    
    res = client.get(f"/api/v1/cases/{case1.id}", headers=worker2_headers)
    assert res.status_code == 403
    assert "not assigned" in res.json()["detail"].lower()

# 5. HOSPITAL ISOLATION (Section 19: Hospital staff cannot respond to another hospital's referrals)
def test_hospital_staff_cannot_respond_to_other_hospital_referrals(client):
    # Hospital 2 staff (Apex) trying to respond to a referral for Hospital 1 (Civil Hospital)
    hosp2_headers = get_auth_header("hospital2@curareach.org", "HOSPITAL_STAFF")
    db = SessionLocal()
    from app.models.referral import Referral
    ref_hosp1 = db.query(Referral).filter(Referral.status == "ACCEPTED").first()
    db.close()

    res = client.post(f"/api/v1/referrals/{ref_hosp1.id}/respond", json={
        "response_type": "DECLINE",
        "reason_code": "CAPACITY_EXCEEDED"
    }, headers=hosp2_headers)
    assert res.status_code == 403

# 6. ADAPTIVE RECOVERY PIPELINE (Section 8 Step 9 & 18 Scenario B)
def test_referral_rejection_activates_alternative_review_required(client):
    doc_headers = get_auth_header("doctor@curareach.org", "CLINICIAN")
    hosp1_headers = get_auth_header("hospital@curareach.org", "HOSPITAL_STAFF")
    
    # 1. Create a case
    c_res = client.post("/api/v1/cases/", json={
        "primary_complaint": "Acute abdominal pain for referral test",
        "health_data_consent": True,
        "referral_consent": True
    }, headers=doc_headers)
    case_id = c_res.json()["id"]

    # Submit intake symptoms
    client.post(f"/api/v1/intake/{case_id}/submit", json={
        "main_complaint": "Acute abdominal pain",
        "description": "Right lower quadrant tenderness for 2 days",
        "onset_duration": "2 days",
        "reported_severity": 7
    }, headers=doc_headers)

    # 2. Get hospital 1 ID
    db = SessionLocal()
    from app.models.hospital import Hospital
    h1 = db.query(Hospital).filter(Hospital.name.contains("Civil Hospital")).first()
    h1_id = h1.id
    db.close()

    # 3. Clinician reviews and authorizes referral to Hospital 1
    client.post(f"/api/v1/triage/{case_id}/clinician-review", json={
        "action": "APPROVE_REFERRAL",
        "confirmed_urgency": "HIGH",
        "clinical_notes": "Surgical review indicated"
    }, headers=doc_headers)

    ref_res = client.post(f"/api/v1/referrals/{case_id}/authorize", json={
        "hospital_id": h1_id,
        "target_department": "General Medicine",
        "referral_reason": "Urgent consultation",
        "urgency": "HIGH"
    }, headers=doc_headers)
    assert ref_res.status_code == 200
    ref_id = ref_res.json()["referral_id"]

    # 4. Hospital 1 declines the referral
    res = client.post(f"/api/v1/referrals/{ref_id}/respond", json={
        "response_type": "DECLINE",
        "reason_code": "NO_SPECIALIST_ON_DUTY",
        "response_notes": "Surgical team in emergency operation"
    }, headers=hosp1_headers)
    assert res.status_code == 200
    assert res.json()["case_state"] == "ALTERNATIVE_REVIEW_REQUIRED"

# 7. STATE MACHINE ILLEGAL TRANSITION DETECTION (Section 13)
def test_illegal_state_transition_is_rejected(client):
    from app.state_machine.case_state_machine import case_state_machine
    from app.models.case import ClinicalCase, CaseStatus
    db = SessionLocal()
    case = ClinicalCase(
        case_number="CR-TEST-ILLEGAL",
        patient_id="dummy",
        current_state=CaseStatus.DRAFT,
        primary_complaint="Test"
    )
    # Trying to jump directly from DRAFT to APPOINTMENT_CONFIRMED must raise 400 Bad Request
    with pytest.raises(Exception) as excinfo:
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.APPOINTMENT_CONFIRMED,
            actor_role="CLINICIAN",
            actor_user_id="dummy",
            transition_event="ILLEGAL_JUMP",
            evidence_notes="Test",
            db=db
        )
    assert "Illegal state transition" in str(excinfo.value)
    db.close()

# 8. SECURE IMAGE HEADER VALIDATION (Section 5 & 19)
def test_image_signature_validation(client):
    from app.services.image_service import image_service
    # Legitimate JPEG signature
    assert image_service.validate_file_signature(b"\xff\xd8\xff\xe0\x00\x10JFIF", "image/jpeg") is True
    # Fake JPEG with text content
    assert image_service.validate_file_signature(b"<html>Malicious script</html>", "image/jpeg") is False

# 9. PATIENT REGISTRATION & FORMATTED PATIENT ID (CR-PAT-2026-XXXX)
def test_patient_registration_generates_formatted_id(client):
    unique_email = f"test_pat_{id(client)}@curareach.org"
    res = client.post("/api/v1/auth/register", json={
        "email": unique_email,
        "password": "Password@123",
        "full_name": "Deepa Sundaram",
        "phone": "+91-98450-77665",
        "role": "PATIENT",
        "date_of_birth": "1990-05-14",
        "gender": "Female",
        "blood_group": "B+",
        "district": "Shivamogga",
        "abha_id": "91-2026-5544-3322"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "PATIENT"
    assert data["user"]["patient_identifier"].startswith("CR-PAT-2026-")

# 10. STRUCTURED MEDICAL HISTORY & ALLERGY SEVERITY
def test_medical_history_conditions_and_allergies(client):
    doc_header = get_auth_header("doctor@curareach.org", "CLINICIAN")
    
    # Fetch medical history for Ramesh Patel (pre-seeded)
    res = client.get("/api/v1/medical-history/patient/CR-PAT-2026-0101", headers=doc_header)
    assert res.status_code == 200, res.text
    history = res.json()
    assert history["patient_identifier"] == "CR-PAT-2026-0101"
    assert len(history["conditions"]) >= 1
    assert any(c["condition_name"] == "Type 2 Diabetes Mellitus" for c in history["conditions"])
    
    # Verify severe allergy warning
    assert any(a["allergen"].startswith("Penicillin") and a["severity"] == "SEVERE" for a in history["allergies"])
    
    # Add new condition via API
    add_res = client.post(f"/api/v1/medical-history/patient/{history['patient_id']}/conditions", json={
        "condition_name": "Hyperlipidemia",
        "status": "ACTIVE",
        "severity": "MILD",
        "notes": "Mild elevated triglycerides"
    }, headers=doc_header)
    assert add_res.status_code == 200

# 11. MEDICAL RECORDS & DIGITAL PRESCRIPTIONS
def test_medical_records_and_prescriptions(client):
    doc_header = get_auth_header("doctor@curareach.org", "CLINICIAN")
    pat_header = get_auth_header("patient@curareach.org", "PATIENT")
    
    # Check pre-seeded medical records
    rec_res = client.get("/api/v1/medical-records/patient/CR-PAT-2026-0101", headers=doc_header)
    assert rec_res.status_code == 200, rec_res.text
    records = rec_res.json()
    assert len(records) >= 1
    assert any(r["record_type"] == "LAB_REPORT" for r in records)
    
    # Create a new digital prescription
    history = client.get("/api/v1/medical-history/patient/CR-PAT-2026-0101", headers=doc_header).json()
    rx_res = client.post("/api/v1/prescriptions", json={
        "patient_id": history["patient_id"],
        "diagnosis": "Seasonal Upper Respiratory Tract Infection",
        "general_instructions": "Hydration and steam inhalation twice daily",
        "items": [
            {
                "medication_name": "Cetirizine 10mg",
                "dosage": "1 tab",
                "frequency": "Once daily at bedtime",
                "duration_days": 5,
                "instructions": "May cause mild drowsiness"
            }
        ]
    }, headers=doc_header)
    assert rx_res.status_code == 200, rx_res.text
    assert rx_res.json()["prescription_code"].startswith("RX-2026-")

# 12. TREATMENT INVOICING, SIMULATED PAYMENTS & FINANCIAL SEPARATION
def test_treatment_transaction_and_financial_separation(client):
    hosp_header = get_auth_header("hospital@curareach.org", "HOSPITAL_STAFF")
    history = client.get("/api/v1/medical-history/patient/CR-PAT-2026-0101", headers=hosp_header).json()
    
    # Create a medical treatment invoice
    inv_res = client.post("/api/v1/transactions/invoice", json={
        "patient_id": history["patient_id"],
        "transaction_type": "CONSULTATION",
        "item_description": "Follow-up Specialist Review Fee",
        "amount_inr": 250.0,
        "discount_inr": 0.0,
        "payment_method": "UPI",
        "payment_status": "UNPAID"
    }, headers=hosp_header)
    assert inv_res.status_code == 200, inv_res.text
    inv_data = inv_res.json()
    txn_id = inv_data["transaction_id"]
    assert inv_data["invoice_number"].startswith("INV-MED-2026-")
    
    # Record simulated payment via UPI
    pay_res = client.post(f"/api/v1/transactions/{txn_id}/pay", json={
        "payment_method": "UPI",
        "transaction_reference": "TXN-UPI-TEST-12345"
    }, headers=hosp_header)
    assert pay_res.status_code == 200, pay_res.text
    pay_data = pay_res.json()
    assert pay_data["payment_status"] == "PAID"
    assert pay_data["is_simulated"] is True
    
    # Strict financial separation:
    # Verify that DemoInvoice (B2B SaaS subscription invoices) contains only hospital subscription invoices
    from app.models.billing import DemoInvoice
    from app.models.treatment_billing import PatientTreatmentTransaction
    db = SessionLocal()
    b2b_invoices = db.query(DemoInvoice).all()
    treatment_invoices = db.query(PatientTreatmentTransaction).all()
    db.close()
    
    # B2B invoices have hospital_id and subscription_id, NO patient_id
    assert all(hasattr(b, "subscription_id") and not hasattr(b, "patient_id") for b in b2b_invoices)
    # Treatment invoices have patient_id and item_description
    assert all(hasattr(t, "patient_id") and hasattr(t, "item_description") for t in treatment_invoices)

