/**
 * CuraReach 360 - Frontend TypeScript Type Definitions
 * Tagline: Predict the Gap. Adapt the Pathway. Complete the Care.
 * Team ID: AX26-202
 */

export type UserRole = 
  | 'PATIENT' 
  | 'COMMUNITY_WORKER' 
  | 'CLINICIAN' 
  | 'HOSPITAL_STAFF' 
  | 'CURAREACH_ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  organization_id?: string;
  profile?: Record<string, any>;
}

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
}

export type UrgencyTier = 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';

export type CaseStatusType = 
  | 'DRAFT'
  | 'INTAKE_SUBMITTED'
  | 'EMERGENCY_GUIDANCE_SHOWN'
  | 'AWAITING_CLINICIAN_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'CLINICIAN_REVIEWED'
  | 'REFERRAL_APPROVED'
  | 'REFERRAL_SENT'
  | 'HOSPITAL_INFORMATION_REQUESTED'
  | 'REFERRAL_DECLINED'
  | 'ALTERNATIVE_REVIEW_REQUIRED'
  | 'REFERRAL_ACCEPTED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_MISSED'
  | 'CARE_ENCOUNTER_REPORTED'
  | 'FOLLOW_UP_PENDING'
  | 'FOLLOW_UP_COMPLETED'
  | 'CLOSED';

export interface CaseSummary {
  id: string;
  case_number: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_district: string;
  current_state: CaseStatusType;
  provisional_urgency: UrgencyTier;
  confirmed_urgency?: UrgencyTier;
  primary_complaint: string;
  is_assisted_by_worker: boolean;
  worker_name?: string;
  clinician_name?: string;
  target_hospital_name?: string;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
}

export interface BedsideVitals {
  temperature?: number;
  heart_rate?: number;
  blood_pressure?: string;
  spo2?: number;
  respiratory_rate?: number;
}

export interface CaseDetail extends CaseSummary {
  chief_complaint_summary?: string;
  closure_reason?: string;
  consent?: {
    health_data: boolean;
    referral: boolean;
    photo: boolean;
    worker_assistance: boolean;
  };
  symptoms?: {
    main_complaint: string;
    description: string;
    onset_duration: string;
    reported_severity: number;
    accompanying_symptoms?: string;
    existing_conditions?: string;
    current_medications?: string;
    access_barriers?: string;
    vitals: BedsideVitals;
  };
  images: Array<{
    id: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    ai_cautious_description?: string;
    created_at: string;
  }>;
  triage?: {
    provisional_urgency: UrgencyTier;
    emergency_flags: string[];
    clinical_rationale: string;
    missing_information: string[];
    recommended_specialty: string;
    is_vital_compromised: boolean;
    stabilization_directives: string[];
  };
  reviews: Array<{
    id: string;
    clinician_name: string;
    action: string;
    confirmed_urgency: UrgencyTier;
    clinical_notes: string;
    created_at: string;
  }>;
  referrals: Array<{
    id: string;
    hospital_id: string;
    hospital_name: string;
    status: string;
    target_department: string;
    referral_reason: string;
    urgency: string;
    is_alternative: boolean;
    decline_reason?: string;
    sent_at?: string;
    appointment?: {
      scheduled_at: string;
      doctor_name: string;
      department: string;
      status: string;
      arrival_status: string;
      consultation_notes?: string;
      discharge_instructions?: string;
    };
  }>;
  tasks: Array<{
    id: string;
    task_type: string;
    description: string;
    due_date?: string;
    status: string;
    barrier_reported?: string;
    worker_notes?: string;
    created_at: string;
  }>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  from_state: string;
  to_state: string;
  transition_event: string;
  evidence_notes?: string;
}

export interface Facility {
  id: string;
  name: string;
  facility_type: string;
  address: string;
  district: string;
  contact_phone: string;
  contact_email: string;
  total_beds: number;
  available_beds: number;
  has_icu: boolean;
  has_oxygen_manifold: boolean;
  last_capacity_update?: string;
  operating_hours?: string;
  departments: string[];
}

export interface FacilityMatch {
  hospital_id: string;
  hospital_name: string;
  facility_type: string;
  district: string;
  address: string;
  contact_phone: string;
  contact_email: string;
  available_beds: number;
  has_icu: boolean;
  has_oxygen_manifold: boolean;
  capability_score: number;
  distance_estimate: string;
  match_reasons: string[];
  freshness_warning?: string;
  is_alternative: boolean;
}

export interface FollowUpTask {
  id: string;
  case_id: string;
  case_number: string;
  patient_name: string;
  task_type: string;
  description: string;
  due_date?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
  barrier_reported?: string;
  worker_notes?: string;
  escalation_reason?: string;
  created_at: string;
  completed_at?: string;
}

export interface InAppNotification {
  id: string;
  case_id?: string;
  title: string;
  message: string;
  notification_type: 'INFO' | 'ALERT' | 'URGENT' | 'RESCUE';
  is_read: boolean;
  created_at: string;
}

export interface DemoScenario {
  code: string;
  title: string;
  patient: string;
  role_focus: string;
  description: string;
  case_number?: string;
  initial_state?: string;
}
