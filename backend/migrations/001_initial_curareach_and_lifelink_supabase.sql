-- ====================================================================
-- CURAREACH 360 + LIFELINK SUPABASE POSTGRESQL SCHEMA MIGRATION 001
-- Tagline: Predict the Gap. Adapt the Pathway. Complete the Care.
-- Option A: Preserve Existing MVP + Add LifeLink Donor Connect
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
        'PATIENT', 'COMMUNITY_WORKER', 'AGENCY_ADMIN', 'CLINICIAN', 
        'HOSPITAL_STAFF', 'HOSPITAL_ADMIN', 'DONOR', 'PLATFORM_ADMIN'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE urgency_tier_enum AS ENUM ('LOW', 'MODERATE', 'HIGH', 'EMERGENCY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE donation_category_enum AS ENUM ('BLOOD', 'LIVING_ORGAN_INTEREST', 'DECEASED_ORGAN_PLEDGE', 'TISSUE_INTEREST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. CORE USER PROFILES & ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    preferred_language TEXT DEFAULT 'English',
    avatar_path TEXT,
    account_status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_type TEXT NOT NULL, -- 'HOSPITAL', 'AGENCY', 'HEALTH_CENTRE'
    registration_number TEXT,
    verification_status TEXT DEFAULT 'PENDING_VERIFICATION', -- 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT DEFAULT 'Karnataka',
    country TEXT DEFAULT 'India',
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'HOSPITAL_STAFF', 'HOSPITAL_ADMIN', 'AGENCY_ADMIN', 'COMMUNITY_WORKER'
    status TEXT DEFAULT 'ACTIVE',
    invited_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(organization_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS public.user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    revoked_at TIMESTAMPTZ
);

-- 4. PATIENTS & CLINICAL TABLES
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    agency_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_reference TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    sex TEXT,
    contact_phone TEXT,
    preferred_language TEXT DEFAULT 'English',
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT DEFAULT 'Karnataka',
    registration_source TEXT DEFAULT 'SELF_SERVICE',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,
    consent_version TEXT DEFAULT '1.0',
    granted BOOLEAN DEFAULT TRUE,
    recorded_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    withdrawn_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    history_category TEXT NOT NULL,
    protected_content JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    private_storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.clinical_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    symptoms_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    provisional_urgency TEXT NOT NULL DEFAULT 'MODERATE',
    intake_status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    agent_version TEXT DEFAULT '1.0',
    clinician_review_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.clinician_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID NOT NULL REFERENCES public.clinical_intakes(id) ON DELETE CASCADE,
    clinician_id UUID NOT NULL REFERENCES auth.users(id),
    approved_urgency TEXT NOT NULL,
    clinical_decision TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    clinician_review_id UUID REFERENCES public.clinician_reviews(id),
    hospital_id UUID NOT NULL REFERENCES public.organizations(id),
    referral_status TEXT NOT NULL DEFAULT 'PENDING_HOSPITAL_RESPONSE',
    urgency TEXT NOT NULL,
    approved_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    appointment_status TEXT DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id),
    due_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    case_reference UUID,
    input_reference TEXT,
    output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    human_approval_required BOOLEAN DEFAULT TRUE,
    execution_status TEXT DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    event_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. LIFELINK MODULE: DONOR TABLES
CREATE TABLE IF NOT EXISTS public.donor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    donor_reference TEXT UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT DEFAULT 'Karnataka',
    preferred_language TEXT DEFAULT 'English',
    preferred_contact_method TEXT DEFAULT 'Phone',
    account_status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.donation_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    donation_category TEXT NOT NULL CHECK (donation_category IN ('BLOOD', 'LIVING_ORGAN_INTEREST', 'DECEASED_ORGAN_PLEDGE', 'TISSUE_INTEREST')),
    self_reported_blood_group TEXT,
    living_organ_interest TEXT,
    tissue_interest TEXT,
    preferred_city TEXT,
    preferred_district TEXT,
    willing_to_travel BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.donor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID UNIQUE NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    availability_status TEXT DEFAULT 'AVAILABLE',
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.donor_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('PRIVACY_NOTICE', 'REQUEST_NOTIFICATIONS', 'CONTACT_SHARING', 'OPTIONAL_ANALYTICS')),
    consent_version TEXT DEFAULT '1.0',
    consent_text_hash TEXT,
    granted BOOLEAN DEFAULT FALSE,
    granted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    withdrawn_at TIMESTAMPTZ,
    recorded_source TEXT DEFAULT 'WEB_PORTAL',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.donor_consent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL REFERENCES public.donor_consents(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    consent_version TEXT DEFAULT '1.0',
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.hospital_donor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    internal_case_reference TEXT UNIQUE NOT NULL,
    donation_category TEXT DEFAULT 'BLOOD' NOT NULL,
    requested_blood_group TEXT,
    units_needed INTEGER DEFAULT 1,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    requested_from TIMESTAMPTZ NOT NULL,
    requested_until TIMESTAMPTZ NOT NULL,
    request_status TEXT DEFAULT 'ACTIVE',
    request_description TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.donor_request_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.hospital_donor_requests(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    invitation_status TEXT DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(request_id, donor_id)
);

CREATE TABLE IF NOT EXISTS public.donor_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID UNIQUE NOT NULL REFERENCES public.donor_request_invitations(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    response TEXT NOT NULL, -- 'ACCEPT', 'DECLINE', 'REQUEST_MORE_INFO'
    responded_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    contact_sharing_approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.authorized_introductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.hospital_donor_requests(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    consent_id UUID NOT NULL REFERENCES public.donor_consents(id),
    authorized_by UUID NOT NULL REFERENCES auth.users(id),
    permitted_contact_fields JSONB NOT NULL DEFAULT '{"name": true, "phone": true}'::jsonb,
    status TEXT DEFAULT 'AUTHORIZED',
    authorized_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.introduction_access_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    introduction_id UUID NOT NULL REFERENCES public.authorized_introductions(id) ON DELETE CASCADE,
    accessed_by UUID NOT NULL REFERENCES auth.users(id),
    access_action TEXT NOT NULL,
    disclosed_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.donor_coordination_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.hospital_donor_requests(id) ON DELETE CASCADE,
    introduction_id UUID REFERENCES public.authorized_introductions(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    safe_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.donor_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES public.donor_profiles(id) ON DELETE CASCADE,
    authorized_organization_id UUID REFERENCES public.organizations(id),
    donation_category TEXT NOT NULL,
    referral_status TEXT DEFAULT 'INTEREST_RECORDED',
    official_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.donor_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    donor_id UUID REFERENCES public.donor_profiles(id) ON DELETE SET NULL,
    hospital_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    safe_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. LIFELINK HOSPITAL SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.lifelink_subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    demo_price_inr NUMERIC(12,2) DEFAULT 0.00,
    billing_interval TEXT DEFAULT 'MONTHLY',
    feature_flags JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.hospital_lifelink_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.lifelink_subscription_plans(id),
    subscription_status TEXT DEFAULT 'ACTIVE',
    starts_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    ends_at TIMESTAMPTZ,
    demo_mode BOOLEAN DEFAULT TRUE,
    activated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.lifelink_subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.hospital_lifelink_subscriptions(id) ON DELETE CASCADE,
    invoice_reference TEXT UNIQUE NOT NULL,
    amount_inr NUMERIC(12,2) NOT NULL,
    invoice_status TEXT DEFAULT 'PAID',
    simulated BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. NOTIFICATIONS & BACKGROUND JOBS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    related_resource_type TEXT NOT NULL,
    related_resource_id UUID,
    safe_payload JSONB DEFAULT '{}'::jsonb,
    delivery_status TEXT DEFAULT 'DELIVERED',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    delivered_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    job_status TEXT DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,
    idempotency_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_donor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_request_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_introductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: user read/update own profile
CREATE POLICY profiles_user_policy ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Donor Profiles: donor read/update own profile only
CREATE POLICY donor_profiles_owner_policy ON public.donor_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Donor Preferences: donor owner only
CREATE POLICY donor_preferences_owner_policy ON public.donation_preferences
    FOR ALL USING (
        donor_id IN (SELECT id FROM public.donor_profiles WHERE user_id = auth.uid())
    );

-- Donor Consents: donor owner only
CREATE POLICY donor_consents_owner_policy ON public.donor_consents
    FOR ALL USING (
        donor_id IN (SELECT id FROM public.donor_profiles WHERE user_id = auth.uid())
    );

-- Hospital Donor Requests: members of owning hospital
CREATE POLICY hospital_donor_requests_policy ON public.hospital_donor_requests
    FOR ALL USING (
        hospital_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'ACTIVE'
        )
    );

-- Donor Request Invitations: recipient donor can view their invitations
CREATE POLICY donor_invitations_donor_policy ON public.donor_request_invitations
    FOR SELECT USING (
        donor_id IN (SELECT id FROM public.donor_profiles WHERE user_id = auth.uid())
    );

-- Authorized Introductions: donor or authorized hospital member
CREATE POLICY authorized_introductions_policy ON public.authorized_introductions
    FOR SELECT USING (
        donor_id IN (SELECT id FROM public.donor_profiles WHERE user_id = auth.uid())
        OR
        hospital_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'ACTIVE'
        )
    );

-- Notifications: recipient user only
CREATE POLICY notifications_recipient_policy ON public.notifications
    FOR ALL USING (recipient_user_id = auth.uid());
