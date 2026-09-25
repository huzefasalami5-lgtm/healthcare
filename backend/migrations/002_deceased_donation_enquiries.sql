-- ====================================================================
-- CURAREACH 360 + LIFELINK SUPABASE POSTGRESQL SCHEMA MIGRATION 002
-- Family-Assisted Deceased Organ & Tissue Donation Enquiries
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.deceased_donation_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_reference TEXT UNIQUE NOT NULL,
    submitted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    family_member_name TEXT NOT NULL,
    family_member_contact TEXT NOT NULL,
    relationship_to_deceased TEXT NOT NULL,
    preferred_language TEXT DEFAULT 'English',
    deceased_name TEXT,
    deceased_age INTEGER,
    date_of_death TIMESTAMPTZ,
    hospital_name TEXT,
    current_location TEXT NOT NULL,
    already_speaking_with_coordinator BOOLEAN DEFAULT FALSE,
    official_pledge_reference TEXT,
    privacy_notice_accepted BOOLEAN NOT NULL DEFAULT FALSE,
    coordinator_contact_permission BOOLEAN NOT NULL DEFAULT FALSE,
    enquiry_status TEXT NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'AWAITING_AUTHORIZED_COORDINATOR', 'REFERRED_TO_AUTHORIZED_HOSPITAL', 'ACKNOWLEDGED', 'CLOSED', 'WITHDRAWN'
    assigned_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    assigned_coordinator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    coordinator_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_deceased_enquiries_status ON public.deceased_donation_enquiries(enquiry_status);
CREATE INDEX IF NOT EXISTS idx_deceased_enquiries_user ON public.deceased_donation_enquiries(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_deceased_enquiries_org ON public.deceased_donation_enquiries(assigned_organization_id);
CREATE INDEX IF NOT EXISTS idx_deceased_enquiries_ref ON public.deceased_donation_enquiries(enquiry_reference);

-- Restrictive Row Level Security (RLS)
ALTER TABLE public.deceased_donation_enquiries ENABLE ROW LEVEL SECURITY;

-- 1. Family submitter policy: Submitting user can view and withdraw their own enquiry
CREATE POLICY deceased_enquiries_owner_policy ON public.deceased_donation_enquiries
    FOR ALL USING (
        auth.uid() = submitted_by_user_id
    );

-- 2. Verified hospital staff policy: Authorized coordinators in assigned organizations can review and process
CREATE POLICY deceased_enquiries_hospital_policy ON public.deceased_donation_enquiries
    FOR ALL USING (
        assigned_organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND status = 'ACTIVE'
        )
    );

-- 3. Anonymous submission policy: Allow public insertion of deceased donation enquiry
CREATE POLICY deceased_enquiries_insert_policy ON public.deceased_donation_enquiries
    FOR INSERT WITH CHECK (true);

-- Trigger for auto-updating updated_at
DO $$ BEGIN
    CREATE TRIGGER update_deceased_donation_enquiries_modtime
        BEFORE UPDATE ON public.deceased_donation_enquiries
        FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
EXCEPTION WHEN undefined_function THEN null; END $$;
