"""Comprehensive Synthetic Demo Seed Service for Hackathon Scenarios A-F (Section 17)"""
import os
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash, Role
from app.models.user import User, PatientProfile, CommunityWorkerProfile
from app.models.hospital import Hospital, HospitalDepartment, HospitalService, AppointmentSlot
from app.models.case import ClinicalCase, CaseStatus, UrgencyLevel, ConsentRecord, SymptomSubmission, UploadedImage
from app.models.clinical import TriageAssessment, ClinicianReview, ReviewAction
from app.models.referral import Referral, ReferralStatus, ReferralResponse, Appointment, AppointmentStatus, FacilityRecommendation
from app.models.care_rescue import FollowUpTask, TaskStatus, Notification
from app.models.billing import SubscriptionPlan, OrganizationSubscription, DemoInvoice
from app.models.audit import CaseStatusEvent, AgentExecution
from app.models.medical_history import (
    PatientCondition,
    PatientAllergy,
    PatientSurgery,
    PatientMedication,
    FamilyMedicalHistory,
)
from app.models.medical_records import (
    MedicalRecord,
    MedicalRecordType,
    Prescription,
    PrescriptionItem,
)
from app.models.treatment_billing import (
    PatientTreatmentTransaction,
    TransactionType,
    PaymentStatus,
    PaymentMethod,
)

def seed_database(db: Session) -> None:
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(User).filter(User.email == "admin@curareach.org").first():
        seed_medical_and_financial_records(db)
        return

    now = datetime.now(timezone.utc)

    # 1. SUBSCRIPTION PLANS
    p1 = SubscriptionPlan(
        plan_name="Starter Clinic Coordination",
        tier="BASIC",
        monthly_fee_inr=4999.0,
        max_monthly_referrals=50,
        analytics_enabled=False,
        features_json='["Inbound Referral Queue", "Manual Availability Updates", "Basic Appointment Confirmation"]'
    )
    p2 = SubscriptionPlan(
        plan_name="Hospital Health Network",
        tier="PRO",
        monthly_fee_inr=14999.0,
        max_monthly_referrals=300,
        analytics_enabled=True,
        features_json='["Multi-Department Queues", "Care Rescue Integration", "Community Worker Handoff", "Advanced Analytics"]'
    )
    p3 = SubscriptionPlan(
        plan_name="Regional Enterprise Health System",
        tier="ENTERPRISE",
        monthly_fee_inr=39999.0,
        max_monthly_referrals=2000,
        analytics_enabled=True,
        features_json='["Unlimited Referrals", "SLA Escalation Alerts", "Cross-District Teleconsult Matching", "Dedicated Account Lead"]'
    )
    db.add_all([p1, p2, p3])
    db.commit()

    # 2. PARTICIPATING HOSPITALS
    h1 = Hospital(
        name="Shivamogga District Civil Hospital",
        facility_type="District Hospital",
        address="B.H. Road, Gandhi Bazaar",
        district="Shivamogga",
        state="Karnataka",
        pincode="577201",
        contact_phone="+91-8182-224411",
        contact_email="civil.hospital@shivamogga-health.gov.in",
        verification_status="VERIFIED",
        total_beds=180,
        available_beds=24,
        has_icu=True,
        has_oxygen_manifold=True,
        operating_hours="24/7 Emergency, Inpatient, OPD: 08:30 - 16:30"
    )
    h2 = Hospital(
        name="Apex Multi-Specialty & Trauma Centre",
        facility_type="Tertiary Hospital",
        address="Savalanga Road, Tilak Nagar",
        district="Shivamogga",
        state="Karnataka",
        pincode="577204",
        contact_phone="+91-8182-278900",
        contact_email="referrals@apexhospital.org",
        verification_status="VERIFIED",
        total_beds=220,
        available_beds=35,
        has_icu=True,
        has_oxygen_manifold=True,
        operating_hours="24/7 Tertiary Referral & Emergency Services"
    )
    h3 = Hospital(
        name="Bhadravathi Community Health Centre",
        facility_type="Community Health Centre",
        address="Old Town Main Road, Bhadravathi",
        district="Shivamogga",
        state="Karnataka",
        pincode="577301",
        contact_phone="+91-8282-261200",
        contact_email="chc.bhadravathi@health.org",
        verification_status="VERIFIED",
        total_beds=30,
        available_beds=4,
        has_icu=False,
        has_oxygen_manifold=True,
        operating_hours="Emergency 24/7, General OPD: 09:00 - 15:00"
    )
    # Hospital pending verification for Admin verification demo (Scenario F)
    h4 = Hospital(
        name="Sahyadri Rural Health Initiative",
        facility_type="Primary Health Centre",
        address="Kudligere Junction, Shivamogga Taluk",
        district="Shivamogga",
        state="Karnataka",
        pincode="577227",
        contact_phone="+91-8182-290111",
        contact_email="intake@sahyadrirural.org",
        verification_status="SUBMITTED",
        verification_notes="Awaiting CuraReach Admin review of license & infrastructure compliance",
        total_beds=15,
        available_beds=8,
        has_icu=False,
        has_oxygen_manifold=False,
        operating_hours="OPD: 09:00 - 17:00"
    )
    db.add_all([h1, h2, h3, h4])
    db.commit()

    # Hospital Departments
    dept_names = ["General Medicine", "Emergency Medicine", "Dermatology", "Pulmonology", "Orthopedics", "Cardiology"]
    for hosp in [h1, h2, h3]:
        for d in dept_names:
            if hosp == h3 and d in ["Cardiology", "Dermatology"]:
                continue # CHC has limited departments
            db.add(HospitalDepartment(
                hospital_id=hosp.id,
                name=d,
                head_doctor=f"Dr. {d} Specialist"
            ))
    db.commit()

    # Subscriptions & Invoices
    sub1 = OrganizationSubscription(
        hospital_id=h1.id,
        plan_id=p2.id,
        status="ACTIVE",
        start_date=now - timedelta(days=60),
        end_date=now + timedelta(days=305)
    )
    sub2 = OrganizationSubscription(
        hospital_id=h2.id,
        plan_id=p3.id,
        status="ACTIVE",
        start_date=now - timedelta(days=30),
        end_date=now + timedelta(days=335)
    )
    db.add_all([sub1, sub2])
    db.commit()

    inv1 = DemoInvoice(
        hospital_id=h1.id,
        subscription_id=sub1.id,
        invoice_number="INV-2026-0811",
        amount_inr=14999.0,
        status="PAID",
        payment_method="CSR Health Grant"
    )
    inv2 = DemoInvoice(
        hospital_id=h2.id,
        subscription_id=sub2.id,
        invoice_number="INV-2026-0812",
        amount_inr=39999.0,
        status="PAID",
        payment_method="Bank Wire Transfer"
    )
    db.add_all([inv1, inv2])
    db.commit()

    # 3. DEMO USERS ACROSS ALL 5 ROLES
    # Admin
    u_admin = User(
        email="admin@curareach.org",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin Officer (Central Operations)",
        phone="+91-98450-00101",
        role=Role.CURAREACH_ADMIN
    )
    # Clinicians
    u_doc1 = User(
        email="doctor@curareach.org",
        hashed_password=get_password_hash("doctor123"),
        full_name="Dr. Rajesh Kumar",
        phone="+91-98450-00201",
        role=Role.CLINICIAN
    )
    u_doc2 = User(
        email="doctor2@curareach.org",
        hashed_password=get_password_hash("doctor123"),
        full_name="Dr. Ananya Sen",
        phone="+91-98450-00202",
        role=Role.CLINICIAN
    )
    # Community Workers
    u_worker1 = User(
        email="worker@curareach.org",
        hashed_password=get_password_hash("worker123"),
        full_name="Anita Devi",
        phone="+91-98450-00301",
        role=Role.COMMUNITY_WORKER
    )
    u_worker2 = User(
        email="worker2@curareach.org",
        hashed_password=get_password_hash("worker123"),
        full_name="Priya Rao",
        phone="+91-98450-00302",
        role=Role.COMMUNITY_WORKER
    )
    # Hospital Staff
    u_hosp1 = User(
        email="hospital@curareach.org",
        hashed_password=get_password_hash("hospital123"),
        full_name="Dr. Suresh Babu (Admissions Desk)",
        phone="+91-98450-00401",
        role=Role.HOSPITAL_STAFF,
        organization_id=h1.id
    )
    u_hosp2 = User(
        email="hospital2@curareach.org",
        hashed_password=get_password_hash("hospital123"),
        full_name="Dr. Meenakshi Iyer (Triage & Beds)",
        phone="+91-98450-00402",
        role=Role.HOSPITAL_STAFF,
        organization_id=h2.id
    )
    # Patients
    u_pat1 = User(
        email="patient@curareach.org",
        hashed_password=get_password_hash("patient123"),
        full_name="Ramesh Patel",
        phone="+91-98450-00501",
        role=Role.PATIENT
    )
    u_pat2 = User(
        email="patient2@curareach.org",
        hashed_password=get_password_hash("patient123"),
        full_name="Sunita Devi",
        phone="+91-98450-00502",
        role=Role.PATIENT
    )
    u_pat3 = User(
        email="patient3@curareach.org",
        hashed_password=get_password_hash("patient123"),
        full_name="Manjula Gowda",
        phone="+91-98450-00503",
        role=Role.PATIENT
    )
    u_pat4 = User(
        email="patient4@curareach.org",
        hashed_password=get_password_hash("patient123"),
        full_name="Ravi Naik",
        phone="+91-98450-00504",
        role=Role.PATIENT
    )
    u_pat5 = User(
        email="patient5@curareach.org",
        hashed_password=get_password_hash("patient123"),
        full_name="Suresh Kumar",
        phone="+91-98450-00505",
        role=Role.PATIENT
    )

    db.add_all([
        u_admin, u_doc1, u_doc2, u_worker1, u_worker2,
        u_hosp1, u_hosp2, u_pat1, u_pat2, u_pat3, u_pat4, u_pat5
    ])
    db.commit()

    # Profiles
    p_worker1 = CommunityWorkerProfile(
        user_id=u_worker1.id,
        assigned_service_area="Kudligere & Holalur Rural Sector",
        assigned_supervisor="Dr. Ananya Sen",
        training_status="Certified (Level 2 Navigation)",
        active_case_count=3
    )
    p_worker2 = CommunityWorkerProfile(
        user_id=u_worker2.id,
        assigned_service_area="Bhadravathi Peri-Urban Belt",
        assigned_supervisor="Dr. Rajesh Kumar",
        training_status="Certified (Level 2 Navigation)",
        active_case_count=1
    )
    db.add_all([p_worker1, p_worker2])

    p_prof1 = PatientProfile(
        user_id=u_pat1.id,
        date_of_birth="1978-04-12",
        gender="Male",
        address="Main Bazaar, Kudligere",
        district="Shivamogga",
        emergency_contact_phone="+91-98450-99881",
        transport_access_barrier=True
    )
    p_prof2 = PatientProfile(
        user_id=u_pat2.id,
        date_of_birth="1984-11-20",
        gender="Female",
        address="River View Colony, Holalur",
        district="Shivamogga",
        emergency_contact_phone="+91-98450-99882",
        financial_barrier=True
    )
    p_prof3 = PatientProfile(
        user_id=u_pat3.id,
        date_of_birth="1965-02-15",
        gender="Female",
        address="Near Primary School, Kudligere",
        district="Shivamogga",
        emergency_contact_phone="+91-98450-99883",
        transport_access_barrier=True
    )
    p_prof4 = PatientProfile(
        user_id=u_pat4.id,
        date_of_birth="1992-08-30",
        gender="Male",
        address="Vinobha Nagar, Shivamogga",
        district="Shivamogga",
        emergency_contact_phone="+91-98450-99884"
    )
    p_prof5 = PatientProfile(
        user_id=u_pat5.id,
        date_of_birth="1970-06-18",
        gender="Male",
        address="Railway Station Road, Bhadravathi",
        district="Shivamogga",
        emergency_contact_phone="+91-98450-99885"
    )
    db.add_all([p_prof1, p_prof2, p_prof3, p_prof4, p_prof5])
    db.commit()

    # 4. PRE-SEEDED CASES FOR DEMO SCENARIOS A - E

    # SCENARIO A: General Healthcare Referral (Ramesh Patel)
    # Journey: Intake -> Clinician review -> Referral Approved -> Hospital Accepted -> Appointment Confirmed -> Care Rescue tasks
    case_a = ClinicalCase(
        case_number="CR-2026-001",
        patient_id=u_pat1.id,
        assigned_worker_id=u_worker1.id,
        assigned_clinician_id=u_doc1.id,
        target_hospital_id=h1.id,
        current_state=CaseStatus.APPOINTMENT_CONFIRMED,
        provisional_urgency=UrgencyLevel.MODERATE,
        confirmed_urgency=UrgencyLevel.MODERATE,
        primary_complaint="Persistent productive cough and evening fever for 10 days",
        chief_complaint_summary="Intake analysis (Pulmonology): Moderate clinical concern (Severity 6/10, duration: 10 days). Requires routine clinician review and referral coordination.",
        created_at=now - timedelta(days=2)
    )
    db.add(case_a)
    db.commit()

    consent_a = ConsentRecord(
        case_id=case_a.id,
        patient_id=u_pat1.id,
        health_data_consent=True,
        referral_consent=True,
        photo_consent=False,
        worker_assistance_consent=True
    )
    symptoms_a = SymptomSubmission(
        case_id=case_a.id,
        main_complaint="Persistent productive cough and evening fever",
        description="Cough producing yellowish sputum, mild fatigue, low-grade evening chills for over a week. No haemoptysis.",
        onset_duration="10 days",
        reported_severity=6,
        accompanying_symptoms="Mild chills, appetite loss",
        temperature=38.1,
        heart_rate=88,
        systolic_bp=128,
        diastolic_bp=82,
        spo2=96,
        respiratory_rate=20
    )
    triage_a = TriageAssessment(
        case_id=case_a.id,
        provisional_urgency=UrgencyLevel.MODERATE,
        clinical_rationale="Subacute respiratory presentation. Sputum analysis and chest radiograph indicated. No acute vital distress.",
        recommended_specialty="Pulmonology"
    )
    review_a = ClinicianReview(
        case_id=case_a.id,
        clinician_id=u_doc1.id,
        action=ReviewAction.APPROVE_REFERRAL,
        previous_urgency=UrgencyLevel.MODERATE,
        confirmed_urgency=UrgencyLevel.MODERATE,
        clinical_notes="Confirmed moderate subacute pulmonary infection. Refer to Shivamogga District Hospital for sputum AFB and chest X-ray."
    )
    referral_a = Referral(
        case_id=case_a.id,
        hospital_id=h1.id,
        authorized_by_clinician_id=u_doc1.id,
        status=ReferralStatus.ACCEPTED,
        referral_reason="Diagnostic workup for subacute productive cough (AFB / CXR)",
        target_department="Pulmonology",
        urgency="MODERATE"
    )
    db.add_all([consent_a, symptoms_a, triage_a, review_a, referral_a])
    db.commit()

    resp_a = ReferralResponse(
        referral_id=referral_a.id,
        responding_staff_id=u_hosp1.id,
        response_type="ACCEPT",
        response_notes="Referral accepted. Chest clinic slot available on Monday morning.",
        proposed_appointment_time="2026-09-28 10:30 AM"
    )
    appt_a = Appointment(
        referral_id=referral_a.id,
        case_id=case_a.id,
        hospital_id=h1.id,
        scheduled_at="2026-09-28 10:30 AM",
        department_name="Pulmonology",
        doctor_name="Dr. Pulmonology Specialist",
        status=AppointmentStatus.CONFIRMED
    )
    task_a = FollowUpTask(
        case_id=case_a.id,
        assigned_worker_id=u_worker1.id,
        assigned_patient_id=u_pat1.id,
        task_type="APPOINTMENT_REMINDER",
        description="Confirm patient Ramesh Patel has transport arranged for Monday 10:30 AM appointment at Civil Hospital.",
        due_date="2026-09-28 08:30 AM",
        status=TaskStatus.PENDING
    )
    event_a1 = CaseStatusEvent(
        case_id=case_a.id,
        actor_user_id=u_pat1.id,
        actor_role=Role.PATIENT,
        from_state=CaseStatus.DRAFT,
        to_state=CaseStatus.INTAKE_SUBMITTED,
        transition_event="INTAKE_SUBMITTED",
        evidence_notes="Patient logged online symptom questionnaire."
    )
    event_a2 = CaseStatusEvent(
        case_id=case_a.id,
        actor_user_id=u_doc1.id,
        actor_role=Role.CLINICIAN,
        from_state=CaseStatus.AWAITING_CLINICIAN_REVIEW,
        to_state=CaseStatus.REFERRAL_APPROVED,
        transition_event="CLINICIAN_APPROVED_REFERRAL",
        evidence_notes="Dr. Rajesh Kumar authorized referral to Civil Hospital."
    )
    event_a3 = CaseStatusEvent(
        case_id=case_a.id,
        actor_user_id=u_hosp1.id,
        actor_role=Role.HOSPITAL_STAFF,
        from_state=CaseStatus.REFERRAL_SENT,
        to_state=CaseStatus.APPOINTMENT_CONFIRMED,
        transition_event="HOSPITAL_CONFIRMED_SLOT",
        evidence_notes="Civil Hospital confirmed Monday 10:30 AM OPD appointment."
    )
    db.add_all([resp_a, appt_a, task_a, event_a1, event_a2, event_a3])
    db.commit()

    # SCENARIO B: Referral Rejection and Recovery (Sunita Devi)
    # Hospital 3 declined due to bed shortage -> State is ALTERNATIVE_REVIEW_REQUIRED -> Clinician can approve Hospital 1 or 2!
    case_b = ClinicalCase(
        case_number="CR-2026-002",
        patient_id=u_pat2.id,
        assigned_worker_id=u_worker1.id,
        assigned_clinician_id=u_doc1.id,
        target_hospital_id=h3.id,
        current_state=CaseStatus.ALTERNATIVE_REVIEW_REQUIRED,
        provisional_urgency=UrgencyLevel.HIGH,
        confirmed_urgency=UrgencyLevel.HIGH,
        primary_complaint="Progressive severe right lower quadrant abdominal discomfort",
        chief_complaint_summary="High-priority presentation (Severity 8/10). Requires ultrasound and acute surgical review.",
        created_at=now - timedelta(days=1)
    )
    db.add(case_b)
    db.commit()

    consent_b = ConsentRecord(
        case_id=case_b.id,
        patient_id=u_pat2.id,
        health_data_consent=True,
        referral_consent=True,
        worker_assistance_consent=True
    )
    symptoms_b = SymptomSubmission(
        case_id=case_b.id,
        main_complaint="Severe right lower quadrant abdominal discomfort",
        description="Pain worsening over 48 hours, localized tenderness, mild nausea and low fever.",
        onset_duration="2 days",
        reported_severity=8,
        accompanying_symptoms="Nausea, localized tenderness, low-grade fever",
        temperature=38.4,
        heart_rate=98,
        systolic_bp=118,
        diastolic_bp=78,
        spo2=98,
        respiratory_rate=22
    )
    triage_b = TriageAssessment(
        case_id=case_b.id,
        provisional_urgency=UrgencyLevel.HIGH,
        clinical_rationale="Acute abdomen presentation. Differential includes acute appendicitis. Urgent ultrasound required.",
        recommended_specialty="General Surgery / Gastroenterology"
    )
    review_b = ClinicianReview(
        case_id=case_b.id,
        clinician_id=u_doc1.id,
        action=ReviewAction.APPROVE_REFERRAL,
        previous_urgency=UrgencyLevel.HIGH,
        confirmed_urgency=UrgencyLevel.HIGH,
        clinical_notes="Suspected acute appendicitis. Refer for ultrasound and surgical consult."
    )
    referral_b1 = Referral(
        case_id=case_b.id,
        hospital_id=h3.id,
        authorized_by_clinician_id=u_doc1.id,
        status=ReferralStatus.DECLINED,
        referral_reason="Acute abdominal assessment and surgical consult",
        target_department="General Medicine",
        urgency="HIGH",
        decline_reason="[NO_SURGICAL_TEAM] CHC surgical theater under emergency sterilization; no on-duty general surgeon today."
    )
    db.add_all([consent_b, symptoms_b, triage_b, review_b, referral_b1])
    db.commit()

    resp_b1 = ReferralResponse(
        referral_id=referral_b1.id,
        responding_staff_id=u_hosp1.id,
        response_type="DECLINE",
        reason_code="NO_SPECIALIST_ON_DUTY",
        response_notes="No on-duty surgeon at CHC today. Please divert to District Hospital."
    )
    event_b1 = CaseStatusEvent(
        case_id=case_b.id,
        actor_user_id=u_hosp1.id,
        actor_role=Role.HOSPITAL_STAFF,
        from_state=CaseStatus.REFERRAL_SENT,
        to_state=CaseStatus.REFERRAL_DECLINED,
        transition_event="REFERRAL_DECLINED",
        evidence_notes="Bhadravathi CHC declined due to lack of surgical team."
    )
    event_b2 = CaseStatusEvent(
        case_id=case_b.id,
        actor_user_id=None,
        actor_role="SYSTEM",
        from_state=CaseStatus.REFERRAL_DECLINED,
        to_state=CaseStatus.ALTERNATIVE_REVIEW_REQUIRED,
        transition_event="ADAPTIVE_RECOVERY_TRIGGERED",
        evidence_notes="Care Intelligence generated alternative matches: Shivamogga District Hospital (Score: 95%). Awaiting clinician re-approval."
    )
    db.add_all([resp_b1, event_b1, event_b2])
    db.commit()

    # SCENARIO C: Rural Assisted Access (Manjula Gowda assisted by Anita Devi)
    # Worker registered patient and drafted intake -> In Doctor Review Queue
    case_c = ClinicalCase(
        case_number="CR-2026-003",
        patient_id=u_pat3.id,
        assigned_worker_id=u_worker1.id,
        assigned_clinician_id=u_doc2.id,
        current_state=CaseStatus.AWAITING_CLINICIAN_REVIEW,
        provisional_urgency=UrgencyLevel.MODERATE,
        primary_complaint="Bilateral knee swelling and inability to walk to village market",
        chief_complaint_summary="Assisted intake by worker Anita Devi: Moderate osteoarticular pain (Severity 7/10). Needs orthopedic review and physical rehabilitation.",
        is_assisted_by_worker=True,
        created_at=now - timedelta(hours=6)
    )
    db.add(case_c)
    db.commit()

    consent_c = ConsentRecord(
        case_id=case_c.id,
        patient_id=u_pat3.id,
        health_data_consent=True,
        referral_consent=True,
        worker_assistance_consent=True
    )
    symptoms_c = SymptomSubmission(
        case_id=case_c.id,
        main_complaint="Bilateral knee swelling and limited mobility",
        description="Patient has chronic joint stiffness, swelling exacerbated in morning. Difficulty bearing weight. Recorded during home visit.",
        onset_duration="3 weeks",
        reported_severity=7,
        accompanying_symptoms="Joint stiffness, morning difficulty",
        temperature=37.0,
        heart_rate=76,
        systolic_bp=135,
        diastolic_bp=85,
        spo2=97,
        respiratory_rate=18
    )
    triage_c = TriageAssessment(
        case_id=case_c.id,
        provisional_urgency=UrgencyLevel.MODERATE,
        clinical_rationale="Chronic osteoarthritis with acute flare-up. Non-emergency. Recommend orthopedic consultation and NSAID review.",
        recommended_specialty="Orthopedics"
    )
    event_c = CaseStatusEvent(
        case_id=case_c.id,
        actor_user_id=u_worker1.id,
        actor_role=Role.COMMUNITY_WORKER,
        from_state=CaseStatus.DRAFT,
        to_state=CaseStatus.INTAKE_SUBMITTED,
        transition_event="WORKER_SUBMITTED_INTAKE",
        evidence_notes="Community Worker Anita Devi conducted domiciliary assessment with consent."
    )
    db.add_all([consent_c, symptoms_c, triage_c, event_c])
    db.commit()

    # SCENARIO D: Optional Skin-Photo Intake (Ravi Naik)
    # Patient uploaded fictional skin photo with consent -> Cautious AI description -> Clinician reviewed
    case_d = ClinicalCase(
        case_number="CR-2026-004",
        patient_id=u_pat4.id,
        assigned_worker_id=None,
        assigned_clinician_id=u_doc1.id,
        target_hospital_id=h2.id,
        current_state=CaseStatus.CLINICIAN_REVIEWED,
        provisional_urgency=UrgencyLevel.MODERATE,
        confirmed_urgency=UrgencyLevel.MODERATE,
        primary_complaint="Spreading erythematous annular rash with itching on forearm",
        chief_complaint_summary="Dermatological concern with photo intake. Provisional: Annular cutaneous erythema. Clinician confirmed non-urgent outpatient dermatology referral.",
        created_at=now - timedelta(hours=12)
    )
    db.add(case_d)
    db.commit()

    consent_d = ConsentRecord(
        case_id=case_d.id,
        patient_id=u_pat4.id,
        health_data_consent=True,
        referral_consent=True,
        photo_consent=True,
        worker_assistance_consent=False
    )
    symptoms_d = SymptomSubmission(
        case_id=case_d.id,
        main_complaint="Spreading erythematous annular rash on right forearm",
        description="Ring-shaped reddish patch noticed 5 days ago, mildly pruritic, expanding borders. No systemic fever.",
        onset_duration="5 days",
        reported_severity=4,
        accompanying_symptoms="Pruritus (itching), mild scaling",
        temperature=36.8,
        heart_rate=72,
        systolic_bp=120,
        diastolic_bp=80,
        spo2=99,
        respiratory_rate=16
    )
    img_d = UploadedImage(
        case_id=case_d.id,
        stored_filename="sample_skin_lesion_dermatology.jpg",
        original_filename="forearm_rash.jpg",
        mime_type="image/jpeg",
        file_size_bytes=42500,
        has_consent=True,
        uploaded_by_user_id=u_pat4.id,
        ai_cautious_description="Provisional supportive inspection: Localized circular erythema with well-demarcated peripheral border. Cautious note: No diagnostic allergy or fungal confirmation. Requires physical clinical evaluation by dermatologist."
    )
    triage_d = TriageAssessment(
        case_id=case_d.id,
        provisional_urgency=UrgencyLevel.MODERATE,
        clinical_rationale="Non-acute cutaneous lesion without airway or mucosal involvement. Outpatient dermatology referral recommended.",
        recommended_specialty="Dermatology"
    )
    review_d = ClinicianReview(
        case_id=case_d.id,
        clinician_id=u_doc1.id,
        action=ReviewAction.CONFIRM_URGENCY,
        previous_urgency=UrgencyLevel.MODERATE,
        confirmed_urgency=UrgencyLevel.MODERATE,
        clinical_notes="Reviewed uploaded clinical photograph. Consistent with annular dermatophytosis vs contact dermatitis. Approved for outpatient dermatology OPD referral."
    )
    db.add_all([consent_d, symptoms_d, img_d, triage_d, review_d])
    db.commit()

    # SCENARIO E: Emergency Branch (Suresh Kumar)
    # Patient reported crushing chest pressure and low SpO2 -> Deterministic red flag -> EMERGENCY_GUIDANCE_SHOWN (112 notice)
    case_e = ClinicalCase(
        case_number="CR-2026-005",
        patient_id=u_pat5.id,
        current_state=CaseStatus.EMERGENCY_GUIDANCE_SHOWN,
        provisional_urgency=UrgencyLevel.EMERGENCY,
        confirmed_urgency=UrgencyLevel.EMERGENCY,
        primary_complaint="Crushing chest pressure radiating to left jaw, severe breathlessness, SpO2 88%",
        chief_complaint_summary="CRITICAL RED-FLAG ALERT: Acute Coronary Syndrome and Hypoxia. Immediate 112 emergency services advised. Routine referral queue completely bypassed.",
        created_at=now - timedelta(hours=1)
    )
    db.add(case_e)
    db.commit()

    consent_e = ConsentRecord(
        case_id=case_e.id,
        patient_id=u_pat5.id,
        health_data_consent=True,
        referral_consent=True
    )
    symptoms_e = SymptomSubmission(
        case_id=case_e.id,
        main_complaint="Crushing chest pressure radiating to left arm and jaw",
        description="Sudden severe retrosternal pressure, diaphoresis (cold sweats), severe shortness of breath started 45 minutes ago while climbing stairs.",
        onset_duration="45 minutes",
        reported_severity=10,
        accompanying_symptoms="Cold sweats, nausea, left arm pain",
        temperature=36.9,
        heart_rate=118,
        systolic_bp=178,
        diastolic_bp=108,
        spo2=88,
        respiratory_rate=28
    )
    triage_e = TriageAssessment(
        case_id=case_e.id,
        provisional_urgency=UrgencyLevel.EMERGENCY,
        emergency_flags_detected="CHEST PAIN: Suspected acute coronary syndrome / cardiac ischemic event; CRITICAL HYPOXIA (SpO2 88% < 90%): Severe respiratory failure risk",
        clinical_rationale="Deterministic emergency screening triggered. The patient presents with one or more life-threatening red-flag indicators requiring immediate physical emergency medical intervention. Ordinary referral and appointment queues are bypassed. Prompt local emergency services (Dial 112 in India).",
        recommended_specialty="Emergency Medicine / Trauma ICU",
        is_vital_compromised=True,
        stabilization_directives="Immediate supplemental high-flow oxygen (10-15 L/min NRB); continuous cardiovascular monitoring"
    )
    event_e = CaseStatusEvent(
        case_id=case_e.id,
        actor_user_id=u_pat5.id,
        actor_role="SYSTEM",
        from_state=CaseStatus.INTAKE_SUBMITTED,
        to_state=CaseStatus.EMERGENCY_GUIDANCE_SHOWN,
        transition_event="DETERMINISTIC_EMERGENCY_TRIGGERED",
        evidence_notes="Severe cardiac red-flags and hypoxia detected. Displayed prominent Emergency 112 guidance card. Routine referral bypass enforced."
    )
    db.add_all([consent_e, symptoms_e, triage_e, event_e])
    db.commit()

    seed_medical_and_financial_records(db)

    print("[SUCCESS] CuraReach 360 database seeded with users, hospitals, subscriptions, and demo Scenarios A-E.")

def seed_medical_and_financial_records(db: Session) -> None:
    now = datetime.now(timezone.utc)
    
    # 1. Update patient identifiers and profile details if missing
    patients_meta = [
        ("patient@curareach.org", "CR-PAT-2026-0101", "B+", "91-2026-4412-8891", "Sunita Patel", "+91-98450-99881", "Wife"),
        ("patient2@curareach.org", "CR-PAT-2026-0102", "O+", "91-2026-8821-3310", "Anil Devi", "+91-98450-99882", "Husband"),
        ("patient3@curareach.org", "CR-PAT-2026-0103", "A+", "91-2026-5541-9923", "Basavaraj Gowda", "+91-98450-99883", "Son"),
        ("patient4@curareach.org", "CR-PAT-2026-0104", "AB+", "91-2026-1194-4421", "Geeta Naik", "+91-98450-99884", "Sister"),
        ("patient5@curareach.org", "CR-PAT-2026-0105", "O-", "91-2026-7731-0082", "Kavita Kumar", "+91-98450-99885", "Wife"),
    ]
    
    for email, pat_id, bg, abha, ec_name, ec_phone, ec_rel in patients_meta:
        u = db.query(User).filter(User.email == email).first()
        if u and u.patient_profile:
            prof = u.patient_profile
            if not prof.patient_identifier:
                prof.patient_identifier = pat_id
            if not prof.blood_group or prof.blood_group == "O+":
                prof.blood_group = bg
            if not prof.abha_id:
                prof.abha_id = abha
            if not prof.emergency_contact_name:
                prof.emergency_contact_name = ec_name
            if not prof.emergency_contact_phone:
                prof.emergency_contact_phone = ec_phone
            if not prof.emergency_contact_relation:
                prof.emergency_contact_relation = ec_rel
    db.commit()

    # Check if medical history is already seeded
    if db.query(PatientCondition).first():
        return

    # Find patient 1 (Ramesh Patel) and patient 2 (Sunita Devi)
    u_pat1 = db.query(User).filter(User.email == "patient@curareach.org").first()
    u_pat2 = db.query(User).filter(User.email == "patient2@curareach.org").first()
    u_doc1 = db.query(User).filter(User.email == "doctor@curareach.org").first()
    h1 = db.query(Hospital).filter(Hospital.name.ilike("%Civil%")).first()
    h2 = db.query(Hospital).filter(Hospital.name.ilike("%Apex%")).first()
    case_a = db.query(ClinicalCase).filter(ClinicalCase.case_number == "CR-2026-001").first()

    if u_pat1 and u_pat1.patient_profile:
        p1 = u_pat1.patient_profile
        
        # Medical History: Conditions
        c1 = PatientCondition(
            patient_id=p1.id,
            condition_name="Type 2 Diabetes Mellitus",
            status="ACTIVE",
            diagnosed_date="2021-03-15",
            severity="MODERATE",
            notes="HbA1c 7.6%. Managed with oral Metformin. Routine glycemic surveillance advised."
        )
        c2 = PatientCondition(
            patient_id=p1.id,
            condition_name="Primary Essential Hypertension",
            status="CONTROLLED",
            diagnosed_date="2019-11-10",
            severity="MILD",
            notes="BP currently stabilized at 128/82 mmHg on Amlodipine 5mg."
        )
        
        # Allergies with severity
        a1 = PatientAllergy(
            patient_id=p1.id,
            allergen="Penicillin / Amoxicillin",
            reaction="Anaphylactoid urticaria and facial angioedema",
            severity="SEVERE",
            date_noted="2017-08-20",
            notes="CRITICAL ALLERGY: Strictly avoid all Beta-Lactam antibiotics."
        )
        a2 = PatientAllergy(
            patient_id=p1.id,
            allergen="Dust & Particulate Matter",
            reaction="Allergic rhinitis, episodic dry cough",
            severity="MILD",
            date_noted="2020-01-15",
            notes="Managed with non-sedating antihistamines as needed."
        )
        
        # Surgery
        s1 = PatientSurgery(
            patient_id=p1.id,
            procedure_name="Laparoscopic Appendectomy",
            surgery_date="2018-06-12",
            hospital_name="Shivamogga District Civil Hospital",
            notes="Uncomplicated procedure; healed primarily without wound infection."
        )
        
        # Current Medications
        m1 = PatientMedication(
            patient_id=p1.id,
            medication_name="Metformin Hydrochloride",
            dosage="500 mg",
            frequency="Twice daily after meals",
            start_date="2021-03-20",
            is_current=True,
            prescribed_by="Dr. Rajesh Kumar",
            notes="Take with plenty of water after food"
        )
        m2 = PatientMedication(
            patient_id=p1.id,
            medication_name="Amlodipine Besylate",
            dosage="5 mg",
            frequency="Once daily in the morning",
            start_date="2019-11-15",
            is_current=True,
            prescribed_by="Dr. Ananya Sen",
            notes="Regular blood pressure monitoring recommended"
        )
        
        # Family Medical History
        f1 = FamilyMedicalHistory(
            patient_id=p1.id,
            relationship_to_patient="Father",
            condition="Coronary Artery Disease & Myocardial Infarction",
            notes="Underwent CABG at age 62"
        )
        f2 = FamilyMedicalHistory(
            patient_id=p1.id,
            relationship_to_patient="Mother",
            condition="Type 2 Diabetes Mellitus",
            notes="Diagnosed at age 54"
        )
        
        db.add_all([c1, c2, a1, a2, s1, m1, m2, f1, f2])
        db.commit()

        # Medical Records & Diagnostic Reports
        rec1 = MedicalRecord(
            patient_id=p1.id,
            case_id=case_a.id if case_a else None,
            recorded_by_user_id=u_doc1.id if u_doc1 else None,
            record_type=MedicalRecordType.LAB_REPORT,
            title="Comprehensive Metabolic Panel & Glycated Hemoglobin (HbA1c)",
            description="Fasting Plasma Glucose: 138 mg/dL (Elevated). HbA1c: 7.6%. Serum Creatinine: 0.9 mg/dL (Normal). eGFR: > 90 mL/min. Electrolytes within normal limits.",
            facility_name="Shivamogga District Civil Hospital - Central Diagnostic Lab",
            document_date="2026-09-20",
            is_sensitive=False
        )
        rec2 = MedicalRecord(
            patient_id=p1.id,
            case_id=case_a.id if case_a else None,
            recorded_by_user_id=u_doc1.id if u_doc1 else None,
            record_type=MedicalRecordType.DIAGNOSTIC_IMAGING,
            title="Chest PA Radiograph (Digital X-Ray)",
            description="Clear bilateral lung parenchyma without active focal consolidation, effusion, or pneumothorax. Normal cardiothoracic ratio (< 0.50). Bony thorax intact.",
            facility_name="Apex Multi-Specialty & Trauma Centre - Dept of Radiology",
            document_date="2026-09-22",
            is_sensitive=False
        )
        rec3 = MedicalRecord(
            patient_id=p1.id,
            case_id=case_a.id if case_a else None,
            recorded_by_user_id=u_doc1.id if u_doc1 else None,
            record_type=MedicalRecordType.VISIT_NOTE,
            title="Initial Clinical Consultation & Triage Assessment Note",
            description="Patient examined via rural primary intake. Presented with fatigue and progressive swelling. Red flags ruled out. Triage category confirmed as MODERATE. Referred to General Medicine OPD.",
            facility_name="CuraReach Tele-Triage & Navigation Hub",
            document_date="2026-09-24",
            is_sensitive=False
        )
        db.add_all([rec1, rec2, rec3])
        db.commit()

        # Digital Prescription
        rx1 = Prescription(
            prescription_code="RX-2026-0101",
            patient_id=p1.id,
            case_id=case_a.id if case_a else None,
            clinician_id=u_doc1.id if u_doc1 else None,
            diagnosis="Sub-optimally Controlled Type 2 Diabetes with Peripheral Fatigue",
            general_instructions="Maintain low glycemic diet, drink 2.5L water daily, 30-minute brisk walk daily. Severe Penicillin allergy noted.",
            status="ACTIVE",
            valid_until="2026-10-25"
        )
        db.add(rx1)
        db.flush()
        
        rx_i1 = PrescriptionItem(
            prescription_id=rx1.id,
            medication_name="Metformin Extended Release",
            dosage="500 mg",
            frequency="Once daily with dinner",
            duration_days=30,
            instructions="Swallow whole with a glass of water"
        )
        rx_i2 = PrescriptionItem(
            prescription_id=rx1.id,
            medication_name="Glimepiride",
            dosage="1 mg",
            frequency="Once daily 15 minutes before breakfast",
            duration_days=30,
            instructions="Monitor for symptoms of hypoglycemia"
        )
        rx_i3 = PrescriptionItem(
            prescription_id=rx1.id,
            medication_name="Multivitamin & Methylcobalamin Tablet",
            dosage="1 tab",
            frequency="Once daily at noon",
            duration_days=30,
            instructions="Supportive neuro-protective supplement"
        )
        db.add_all([rx_i1, rx_i2, rx_i3])
        db.commit()

        # Treatment Transactions (SEPARATE from platform subscriptions; clearly simulated)
        txn1 = PatientTreatmentTransaction(
            invoice_number="INV-MED-2026-0101",
            patient_id=p1.id,
            case_id=case_a.id if case_a else None,
            hospital_id=h1.id if h1 else None,
            transaction_type=TransactionType.CONSULTATION,
            item_description="Specialist Medical Officer OPD Consultation & Assessment",
            amount_inr=300.0,
            discount_inr=0.0,
            net_amount_inr=300.0,
            payment_status=PaymentStatus.PAID,
            payment_method=PaymentMethod.UPI,
            transaction_reference="TXN-UPI-9844210982",
            is_simulated=True,
            notes="Paid instantly via PhonePe / UPI gateway simulation",
            payment_date=now - timedelta(days=2)
        )
        txn2 = PatientTreatmentTransaction(
            invoice_number="INV-MED-2026-0102",
            patient_id=p1.id,
            case_id=case_a.id if case_a else None,
            hospital_id=h1.id if h1 else None,
            transaction_type=TransactionType.LAB_TEST,
            item_description="Diagnostic Fasting Blood Panel + HbA1c Glycated Test",
            amount_inr=650.0,
            discount_inr=50.0,
            net_amount_inr=600.0,
            payment_status=PaymentStatus.PAID,
            payment_method=PaymentMethod.CASH,
            transaction_reference="TXN-CASH-HOSP-00219",
            is_simulated=True,
            notes="Paid at hospital counter; receipt issued",
            payment_date=now - timedelta(days=1)
        )
        txn3 = PatientTreatmentTransaction(
            invoice_number="INV-MED-2026-0103",
            patient_id=p1.id,
            case_id=case_a.id if case_a else None,
            hospital_id=h2.id if h2 else None,
            transaction_type=TransactionType.PHARMACY,
            item_description="Monthly Prescription Refill: Metformin ER + Glimepiride + Multivitamins",
            amount_inr=240.0,
            discount_inr=0.0,
            net_amount_inr=240.0,
            payment_status=PaymentStatus.UNPAID,
            payment_method=PaymentMethod.SIMULATED_GATEWAY,
            is_simulated=True,
            notes="Awaiting patient pharmacy counter settlement or online UPI payment"
        )
        db.add_all([txn1, txn2, txn3])
        db.commit()

    if u_pat2 and u_pat2.patient_profile:
        p2 = u_pat2.patient_profile
        c_p2 = PatientCondition(
            patient_id=p2.id,
            condition_name="Bronchial Asthma (Extrinsic)",
            status="ACTIVE",
            diagnosed_date="2022-01-10",
            severity="MODERATE",
            notes="Intermittent nocturnal bronchospasm exacerbated during winter months"
        )
        a_p2 = PatientAllergy(
            patient_id=p2.id,
            allergen="Sulfonamides (Sulfa Antibiotics)",
            reaction="Diffuse pruritic maculopapular rash",
            severity="MODERATE",
            date_noted="2021-07-14",
            notes="Avoid Bactrim / Septra formulations"
        )
        m_p2 = PatientMedication(
            patient_id=p2.id,
            medication_name="Salbutamol (Albuterol) MDI Inhaler",
            dosage="100 mcg",
            frequency="2 puffs as needed for acute shortness of breath",
            is_current=True,
            prescribed_by="Dr. Ananya Sen"
        )
        db.add_all([c_p2, a_p2, m_p2])
        db.commit()

    print("[SUCCESS] Patient medical histories, records, prescriptions, and simulated transactions initialized.")
