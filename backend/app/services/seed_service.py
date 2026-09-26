"""Comprehensive Synthetic Demo Seed Service for Hackathon Scenarios A-F (Section 17)"""
import os
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash, Role
from app.models.user import User, PatientProfile, CommunityWorkerProfile
from app.models.patient import Patient
from app.models.lab_results import LabResult
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
from app.models.lifelink import (
    DonorProfile,
    DonorStatus,
    DonationPreference,
    DonationCategory,
    DonorAvailability,
    DonorConsent,
    HospitalDonorRequest,
    DonorRequestStatus,
    DonorRequestInvitation,
    InvitationStatus,
    DonorResponse,
    AuthorizedIntroduction,
    IntroductionStatus,
    LifeLinkSubscriptionPlan,
    HospitalLifeLinkSubscription,
    LifeLinkSubscriptionInvoice,
    DeceasedDonationEnquiry,
    DeceasedEnquiryStatus,
)

def seed_database(db: Session) -> None:
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(User).filter(User.email == "admin@curareach.org").first():
        seed_medical_and_financial_records(db)
        seed_lifelink_records(db)
        seed_deceased_enquiry_records(db)
        seed_patient_database_records(db)
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
    seed_lifelink_records(db)

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

def seed_lifelink_records(db: Session) -> None:
    """Seed synthetic voluntary donors, subscription plans, and hospital requests for LifeLink"""
    if db.query(DonorProfile).first():
        return

    now = datetime.now(timezone.utc)
    hashed_pwd = get_password_hash("Password123!")

    # 1. LIFELINK SUBSCRIPTION PLANS
    p_starter = LifeLinkSubscriptionPlan(
        id="plan-ll-starter", code="STARTER", name="LifeLink Starter",
        description="Hospital verification & basic voluntary blood donor broadcast coordination",
        demo_price_inr=4999.00, billing_interval="MONTHLY",
        feature_flags={"max_requests_per_month": 10, "staff_accounts": 2, "multi_branch": False}
    )
    p_pro = LifeLinkSubscriptionPlan(
        id="plan-ll-pro", code="PROFESSIONAL", name="LifeLink Professional",
        description="Advanced voluntary coordination, automated reminder queue & priority broadcast",
        demo_price_inr=14999.00, billing_interval="MONTHLY",
        feature_flags={"max_requests_per_month": 50, "staff_accounts": 10, "multi_branch": False}
    )
    p_ent = LifeLinkSubscriptionPlan(
        id="plan-ll-ent", code="ENTERPRISE", name="LifeLink Network Enterprise",
        description="Multi-facility hospital network coordination, aggregate reporting & dedicated support",
        demo_price_inr=39999.00, billing_interval="MONTHLY",
        feature_flags={"max_requests_per_month": -1, "staff_accounts": -1, "multi_branch": True}
    )
    db.add_all([p_starter, p_pro, p_ent])
    db.commit()

    # 2. SEED 8 SYNTHETIC VOLUNTEER DONORS
    donors_data = [
        ("donor1@curareach.org", "Rahul Verma", "O-", "Shivamogga", "Shivamogga", "+91-98450-77101", "1994-03-12"),
        ("donor2@curareach.org", "Sneha Nair", "B+", "Bhadravathi", "Shivamogga", "+91-98450-77102", "1997-07-25"),
        ("donor3@curareach.org", "Arjun Rao", "A+", "Shivamogga", "Shivamogga", "+91-98450-77103", "1991-11-05"),
        ("donor4@curareach.org", "Meera Kulkarni", "AB+", "Kudligere", "Shivamogga", "+91-98450-77104", "1998-02-18"),
        ("donor5@curareach.org", "Vikram Gowda", "O+", "Holalur", "Shivamogga", "+91-98450-77105", "1989-09-30"),
        ("donor6@curareach.org", "Ananya Bhat", "A-", "Shivamogga", "Shivamogga", "+91-98450-77106", "1996-06-14"),
        ("donor7@curareach.org", "Mohammed Farhan", "B-", "Bhadravathi", "Shivamogga", "+91-98450-77107", "1993-12-22"),
        ("donor8@curareach.org", "Pooja Hegde", "O+", "Shivamogga", "Shivamogga", "+91-98450-77108", "1995-04-08"),
    ]

    donor_profiles = []
    for idx, (email, name, bg, city, dist, phone, dob) in enumerate(donors_data):
        u = db.query(User).filter(User.email == email).first()
        if not u:
            u = User(
                id=f"user-donor-{idx+1}",
                email=email,
                hashed_password=hashed_pwd,
                full_name=name,
                role=Role.DONOR,
                phone=phone
            )
            db.add(u)
            db.flush()

        d_prof = DonorProfile(
            id=f"donor-prof-{idx+1}",
            user_id=u.id,
            donor_reference=f"CR-DON-2026-{1001 + idx}",
            date_of_birth=dob,
            city=city,
            district=dist,
            state="Karnataka",
            preferred_language="English" if idx % 2 == 0 else "Kannada",
            preferred_contact_method="Phone",
            account_status=DonorStatus.ACTIVE
        )
        db.add(d_prof)
        db.flush()

        pref = DonationPreference(
            id=f"pref-{idx+1}",
            donor_id=d_prof.id,
            donation_category=DonationCategory.BLOOD,
            self_reported_blood_group=bg,
            preferred_city=city,
            preferred_district=dist,
            willing_to_travel=True,
            active=True
        )
        avail = DonorAvailability(
            id=f"avail-{idx+1}",
            donor_id=d_prof.id,
            availability_status="AVAILABLE"
        )
        c_priv = DonorConsent(
            id=f"consent-priv-{idx+1}",
            donor_id=d_prof.id,
            consent_type="PRIVACY_NOTICE",
            consent_version="1.0",
            granted=True
        )
        c_notif = DonorConsent(
            id=f"consent-notif-{idx+1}",
            donor_id=d_prof.id,
            consent_type="REQUEST_NOTIFICATIONS",
            consent_version="1.0",
            granted=True
        )
        db.add_all([pref, avail, c_priv, c_notif])
        donor_profiles.append(d_prof)

    db.commit()

    # 3. SEED ACTIVE HOSPITAL SUBSCRIPTION FOR SHIVAMOGGA DISTRICT HOSPITAL
    hosp = db.query(Hospital).first()
    if hosp:
        hosp_sub = HospitalLifeLinkSubscription(
            id="hosp-sub-shivamogga-1",
            hospital_id=hosp.id,
            plan_id=p_pro.id,
            subscription_status="ACTIVE",
            starts_at=now - timedelta(days=10),
            ends_at=now + timedelta(days=355),
            demo_mode=True
        )
        sub_inv = LifeLinkSubscriptionInvoice(
            id="inv-sub-1",
            subscription_id=hosp_sub.id,
            invoice_reference="INV-LL-2026-SHV01",
            amount_inr=14999.00,
            invoice_status="PAID",
            simulated=True
        )
        db.add_all([hosp_sub, sub_inv])

        # 4. SEED SAMPLE BLOOD DONOR REQUEST FOR O- NEGATIVE
        admin_u = db.query(User).filter(User.role == Role.HOSPITAL_STAFF).first() or db.query(User).first()
        req_1 = HospitalDonorRequest(
            id="req-donor-1001",
            hospital_id=hosp.id,
            created_by=admin_u.id,
            internal_case_reference="CR-REQ-2026-1001",
            donation_category=DonationCategory.BLOOD,
            requested_blood_group="O-",
            units_needed=2,
            city="Shivamogga",
            district="Shivamogga",
            requested_from=now - timedelta(hours=6),
            requested_until=now + timedelta(hours=42),
            request_status=DonorRequestStatus.INTRODUCTION_AUTHORIZED,
            request_description="Critical acute requirement: 2 units of O- Negative blood for postpartum hemorrhage emergency.",
            expires_at=now + timedelta(hours=42)
        )
        db.add(req_1)
        db.flush()

        donor_o_neg = donor_profiles[0] if donor_profiles else db.query(DonorProfile).first()
        # Add consent first and flush
        c_contact = DonorConsent(
            id="consent-contact-donor-1",
            donor_id=donor_o_neg.id,
            consent_type="CONTACT_SHARING",
            consent_version="1.0",
            granted=True
        )
        db.add(c_contact)
        db.flush()

        inv_1 = DonorRequestInvitation(
            id="inv-req-1001-donor-1",
            request_id=req_1.id,
            donor_id=donor_o_neg.id,
            invitation_status=InvitationStatus.ACCEPTED,
            sent_at=now - timedelta(hours=5),
            responded_at=now - timedelta(hours=4),
            expires_at=req_1.expires_at
        )
        db.add(inv_1)
        db.flush()

        resp_1 = DonorResponse(
            id="resp-1001-1",
            invitation_id=inv_1.id,
            donor_id=donor_o_neg.id,
            response="ACCEPT",
            responded_at=now - timedelta(hours=4),
            contact_sharing_approved=True
        )
        intro_1 = AuthorizedIntroduction(
            id="intro-req-1001-donor-1",
            request_id=req_1.id,
            donor_id=donor_o_neg.id,
            hospital_id=hosp.id,
            consent_id=c_contact.id,
            authorized_by=donor_o_neg.user_id,
            permitted_contact_fields={
                "donor_name": "Rahul Verma",
                "phone": "+91-98450-77101",
                "city": "Shivamogga",
                "district": "Shivamogga",
                "preferred_language": "English"
            },
            status=IntroductionStatus.AUTHORIZED,
            authorized_at=now - timedelta(hours=4),
            expires_at=req_1.expires_at
        )
        db.add_all([resp_1, intro_1])
        db.commit()


    print("[SUCCESS] CuraReach LifeLink seeded with 8 voluntary donors, plans, requests, and authorized introduction.")

def seed_deceased_enquiry_records(db: Session) -> None:
    """Seed initial sample family-assisted deceased donation enquiry"""
    if db.query(DeceasedDonationEnquiry).first():
        return

    now = datetime.now(timezone.utc)
    hosp = db.query(Hospital).filter(Hospital.verification_status == "VERIFIED").first()
    donor_u = db.query(User).filter(User.role == Role.DONOR).first()

    e1 = DeceasedDonationEnquiry(
        id="dec-enq-1001",
        enquiry_reference="CR-DEC-2026-1001",
        submitted_by_user_id=donor_u.id if donor_u else None,
        family_member_name="Sunil Patil",
        family_member_contact="+91-98451-22334",
        relationship_to_deceased="Son",
        preferred_language="Kannada",
        deceased_name="Late Sh. Anand Patil",
        deceased_age=68,
        date_of_death=now - timedelta(hours=8),
        hospital_name="Shivamogga District Civil Hospital",
        current_location="Shivamogga",
        already_speaking_with_coordinator=True,
        official_pledge_reference="NOTTO-PLG-2024-88912",
        privacy_notice_accepted=True,
        coordinator_contact_permission=True,
        enquiry_status=DeceasedEnquiryStatus.AWAITING_AUTHORIZED_COORDINATOR,
        assigned_organization_id=hosp.id if hosp else None,
        coordinator_notes="Family approached treating ICU team. Form 8 statutory consent pending medical fitness review."
    )
    db.add(e1)
    db.commit()
    print("[SUCCESS] CuraReach LifeLink seeded with initial deceased donation enquiry.")

def seed_patient_database_records(db: Session) -> None:
    """Ensure patients, appointments, medical records, prescriptions, and lab results are populated in database"""
    now = datetime.now(timezone.utc)
    
    # 1. Seed Patients
    ramesh_u = db.query(User).filter(User.email == "patient@curareach.org").first()
    doctor_u = db.query(User).filter(User.email == "clinician@curareach.org").first()
    
    if ramesh_u:
        p_ramesh = db.query(Patient).filter(Patient.user_id == ramesh_u.id).first()
        ramesh_pid = ramesh_u.patient_profile.id if ramesh_u.patient_profile else "CR-PAT-2026-0101"
        if not p_ramesh:
            p_ramesh = Patient(
                id=ramesh_pid,
                user_id=ramesh_u.id,
                full_name=ramesh_u.full_name,
                date_of_birth="1982-08-14",
                age=44,
                gender="Male",
                phone=ramesh_u.phone or "+91-98451-22334",
                email=ramesh_u.email,
                address="Holehanasawadi Village, Bhadravathi Taluk, Shivamogga, Karnataka 577201",
                emergency_contact_name="Sunita Patel",
                emergency_contact_phone="+91-98451-99887",
                blood_group="O+",
                allergies="Penicillin (Severe anaphylaxis), Shellfish (Mild hives)",
                medical_conditions="Type 2 Diabetes Mellitus, Essential Hypertension, COPD (Chronic Obstructive Pulmonary Disease)",
                current_medications="Metformin 500mg (twice daily), Amlodipine 5mg (daily), Salbutamol Inhaler (as needed)",
                medical_history="Diagnosed with Type 2 Diabetes in 2018. Smoker for 15 years (quit 2021). Regular monitoring at PHC Kudligere.",
                previous_surgeries="Appendectomy (2012, Shivamogga Civil Hospital), Right knee arthroscopy (2019)",
                family_medical_history="Father: Coronary Artery Disease (CAD). Mother: Hypertension, Type 2 Diabetes."
            )
            db.add(p_ramesh)
            db.commit()

        # Seed sample appointments for Ramesh
        if not db.query(Appointment).filter(Appointment.id == "apt-demo-01").first():
            db.add(Appointment(
                id="apt-demo-01",
                patient_id=p_ramesh.id,
                doctor_id=doctor_u.id if doctor_u else None,
                appointment_date=(now + timedelta(days=2)).strftime("%Y-%m-%d"),
                appointment_time="10:30 AM",
                reason="Routine Diabetic Foot & Blood Sugar Review",
                status="scheduled",
                notes="Fast for 8 hours prior to fasting blood glucose test. Bring current medication chart.",
                scheduled_at=(now + timedelta(days=2)).strftime("%Y-%m-%d 10:30 AM"),
                department_name="General Medicine",
                doctor_name="Dr. Ananya Sen (District Care Lead)"
            ))
        if not db.query(Appointment).filter(Appointment.id == "apt-demo-02").first():
            db.add(Appointment(
                id="apt-demo-02",
                patient_id=p_ramesh.id,
                doctor_id=doctor_u.id if doctor_u else None,
                appointment_date=(now - timedelta(days=14)).strftime("%Y-%m-%d"),
                appointment_time="02:00 PM",
                reason="Cardiorespiratory Follow-up & SpO2 Check",
                status="completed",
                notes="Consultation completed. SpO2 maintained at 97% on room air. Continued bronchodilator therapy.",
                scheduled_at=(now - timedelta(days=14)).strftime("%Y-%m-%d 02:00 PM"),
                department_name="Pulmonology",
                doctor_name="Dr. Rajesh Rao"
            ))
        db.commit()

        # Seed sample medical records for Ramesh
        if not db.query(MedicalRecord).filter(MedicalRecord.id == "mr-demo-01").first():
            db.add(MedicalRecord(
                id="mr-demo-01",
                patient_id=p_ramesh.id,
                doctor_id=doctor_u.id if doctor_u else None,
                visit_date=(now - timedelta(days=14)).strftime("%Y-%m-%d"),
                symptoms="Intermittent breathlessness on exertion, mild bilateral ankle swelling, dry cough for 3 days.",
                diagnosis="Acute exacerbation of chronic bronchitis, early Grade 1 pedal edema secondary to hypertension.",
                treatment="Nebulization with Budecort + Duolin, oral Azithromycin 500mg course, tight sodium restriction.",
                doctor_notes="Patient shows good compliance with oral hypoglycemics. Advised to avoid cold dusty environments.",
                follow_up_date=(now + timedelta(days=7)).strftime("%Y-%m-%d"),
                title="Pulmonology & Hypertension Consultation Note",
                record_type="VISIT_NOTE",
                facility_name="Shivamogga District Civil Hospital"
            ))
            db.commit()

        # Seed sample prescriptions for Ramesh
        if not db.query(Prescription).filter(Prescription.id == "rx-demo-01").first():
            db.add(Prescription(
                id="rx-demo-01",
                prescription_code="RX-2026-0042",
                patient_id=p_ramesh.id,
                doctor_id=doctor_u.id if doctor_u else None,
                clinician_id=doctor_u.id if doctor_u else None,
                medicine_name="Azithromycin 500mg",
                dosage="500 mg",
                frequency="Once daily after lunch",
                duration="5 days",
                instructions="Take with a full glass of water. Complete full 5-day course.",
                prescription_date=(now - timedelta(days=14)).strftime("%Y-%m-%d"),
                diagnosis="Acute bronchitis with respiratory symptoms",
                status="ACTIVE"
            ))
        if not db.query(Prescription).filter(Prescription.id == "rx-demo-02").first():
            db.add(Prescription(
                id="rx-demo-02",
                prescription_code="RX-2026-0043",
                patient_id=p_ramesh.id,
                doctor_id=doctor_u.id if doctor_u else None,
                clinician_id=doctor_u.id if doctor_u else None,
                medicine_name="Metformin Hydrochloride 500mg",
                dosage="500 mg",
                frequency="Twice daily with meals",
                duration="30 days",
                instructions="Maintain regular diet and monitoring. Do not skip doses.",
                prescription_date=(now - timedelta(days=14)).strftime("%Y-%m-%d"),
                diagnosis="Type 2 Diabetes Mellitus Maintenance",
                status="ACTIVE"
            ))
        db.commit()

        # Seed sample lab results for Ramesh
        if not db.query(LabResult).filter(LabResult.id == "lab-demo-01").first():
            db.add(LabResult(
                id="lab-demo-01",
                patient_id=p_ramesh.id,
                doctor_id=doctor_u.id if doctor_u else None,
                test_name="HbA1c Glycated Hemoglobin",
                test_date=(now - timedelta(days=5)).strftime("%Y-%m-%d"),
                result="6.8%",
                normal_range="< 5.7% (Good Control: < 7.0%)",
                doctor_notes="Glycemic control is satisfactory on current Metformin regimen. Re-test in 3 months."
            ))
        if not db.query(LabResult).filter(LabResult.id == "lab-demo-02").first():
            db.add(LabResult(
                id="lab-demo-02",
                patient_id=p_ramesh.id,
                doctor_id=doctor_u.id if doctor_u else None,
                test_name="Complete Blood Count (CBC)",
                test_date=(now - timedelta(days=5)).strftime("%Y-%m-%d"),
                result="Hemoglobin 14.2 g/dL, WBC 7,800/mcL, Platelets 240,000/mcL",
                normal_range="Hb: 13.0-17.0 g/dL, WBC: 4,000-11,000/mcL",
                doctor_notes="Normal hematology parameters. No signs of acute systemic infection or anemia."
            ))
        if not db.query(LabResult).filter(LabResult.id == "lab-demo-03").first():
            db.add(LabResult(
                id="lab-demo-03",
                patient_id=p_ramesh.id,
                doctor_id=doctor_u.id if doctor_u else None,
                test_name="Serum Creatinine & eGFR",
                test_date=(now - timedelta(days=5)).strftime("%Y-%m-%d"),
                result="Creatinine: 0.95 mg/dL, eGFR: 88 mL/min/1.73m²",
                normal_range="Creatinine: 0.7 - 1.3 mg/dL, eGFR > 60",
                doctor_notes="Normal renal function. Safe to continue current antihypertensive and oral hypoglycemic regimen."
            ))
        db.commit()

    # Also seed Lakshmi Devi if present
    lakshmi_u = db.query(User).filter(User.email == "lakshmi.devi@example.com").first()
    if lakshmi_u:
        p_lakshmi = db.query(Patient).filter(Patient.user_id == lakshmi_u.id).first()
        lakshmi_pid = lakshmi_u.patient_profile.id if lakshmi_u.patient_profile else "CR-PAT-2026-0102"
        if not p_lakshmi:
            p_lakshmi = Patient(
                id=lakshmi_pid,
                user_id=lakshmi_u.id,
                full_name=lakshmi_u.full_name,
                date_of_birth="1978-03-22",
                age=48,
                gender="Female",
                phone=lakshmi_u.phone or "+91-98452-66778",
                email=lakshmi_u.email,
                address="Kudligere Village, Bhadravathi, Shivamogga 577201",
                emergency_contact_name="Ravi Kumar",
                emergency_contact_phone="+91-98452-99001",
                blood_group="B+",
                allergies="Sulfa drugs",
                medical_conditions="Mild Asthma, Osteoarthritis right knee",
                current_medications="Salbutamol Inhaler PRN, Paracetamol 650mg SOS",
                medical_history="Knee pain for 2 years, managed conservatively.",
                previous_surgeries="None",
                family_medical_history="Mother had Rheumatoid Arthritis"
            )
            db.add(p_lakshmi)
            db.commit()

    print("[SUCCESS] Patient database seeded with patients, medical records, appointments, prescriptions, and lab results.")

