export interface PatientVitals {
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  temperature: number;
  respiratory_rate: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  sub_district: string;
  district: string;
  state: string;
  connectivity: string; // 'offline' | '2g_only' | 'limited' | 'moderate' | 'high_speed'
  road_condition: string; // 'paved' | 'rough_terrain' | 'flooded' | 'unpaved'
  current_facility_id: string;
  symptoms: string[];
  vitals: PatientVitals;
  comorbidities: string[];
  onset_duration: string;
  notes?: string;
  phone?: string;
  caregiver_name?: string;
  emergency_contact?: string;
  abha_id?: string;
  registered_at?: string;
  assigned_asha?: string;
}

export interface CareTimelineTask {
  task_id: string;
  phase: string;
  title: string;
  description: string;
  owner: string;
  due_in: string;
  status: 'pending' | 'in_progress' | 'completed';
  verification_required: boolean;
}

export interface ReferralSlip {
  referral_id: string;
  patient_id: string;
  patient_name: string;
  referring_facility_id: string;
  referring_facility_name: string;
  destination_facility_id: string;
  destination_facility_name: string;
  urgency_tier: string;
  clinical_reason: string;
  missing_capabilities_origin: string[];
  required_services: string[];
  transport_type_recommended: string;
  provisional_pre_referral_care: string[];
  status: string;
  created_at: string;
  qr_auth_token: string;
  verified_by_doctor?: string;
  verified_at?: string;
}

export interface AgentOutputBase {
  agent_id: string;
  agent_name: string;
  status: 'running' | 'completed' | 'escalated' | 'failed' | 'waiting';
  execution_time_ms: number;
  timestamp: string;
  reasoning: string;
  key_factors: string[];
  requires_human_review: boolean;
  data: Record<string, any>;
}

export interface TriageAgentOutput extends AgentOutputBase {
  priority: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';
  escalation_needed: boolean;
  vital_flags: string[];
  symptom_flags: string[];
  clinical_advisory: string;
}

export interface AccessAgentOutput extends AgentOutputBase {
  access_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  connectivity_status: string;
  road_feasibility: string;
  nearest_phc_distance_km: number;
  ambulance_delay_estimate_mins: number;
  teleconsult_possible: boolean;
  access_barriers: string[];
}

export interface CandidateFacility {
  id: string;
  name: string;
  tier: string;
  tier_level: number;
  distance_km: number;
  travel_time_mins: number;
  doctor_availability: string;
  diagnostics_ready: number;
  oxygen_status: string;
  icu_beds: number;
  connectivity: string;
  match_score: number;
  is_current: boolean;
}

export interface FacilityAgentOutput extends AgentOutputBase {
  selected_facility_id: string;
  selected_facility_name: string;
  selected_facility_tier: string;
  candidate_facilities: CandidateFacility[];
  capability_match_score: number;
  is_referral_needed: boolean;
  distance_km: number;
  travel_time_mins: number;
}

export interface ResourceAgentOutput extends AgentOutputBase {
  critical_resources_available: boolean;
  medicines_status: string;
  diagnostics_status: string;
  specialist_status: string;
  equipment_status: string;
  available_items: string[];
  missing_items: string[];
  stockout_contingency: string;
}

export interface CoordinatorAgentOutput extends AgentOutputBase {
  coordinated_pathway_title: string;
  action_priority: string;
  why_pathway_selected: string;
  primary_facility: string;
  interventions_ordered: string[];
  contingency_plan: string;
}

export interface ReferralAgentOutput extends AgentOutputBase {
  referral_required: boolean;
  referring_facility: string;
  destination_facility: string;
  urgency: string;
  transport_mode: string;
  referral_slip: ReferralSlip | null;
  referral_reason: string;
  clinical_handover_notes: string[];
}

export interface ContinuityAgentOutput extends AgentOutputBase {
  timeline_tasks: CareTimelineTask[];
  asha_action_checklist: string[];
  patient_telephony_sms: string;
  next_review_target: string;
  follow_up_frequency: string;
}

export interface CoordinatedCarePathway {
  patient_id: string;
  patient_name: string;
  triage_priority: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';
  access_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_facility: string;
  referral_required: boolean;
  resource_status: string;
  follow_up_target: string;
  human_verification_required: boolean;
  disclaimer: string;
  agents: {
    triage?: TriageAgentOutput;
    access_intel?: AccessAgentOutput;
    facility_matcher?: FacilityAgentOutput;
    resource_verifier?: ResourceAgentOutput;
    coordinator?: CoordinatorAgentOutput;
    referral_coordinator?: ReferralAgentOutput;
    care_continuity?: ContinuityAgentOutput;
  };
  timeline: CareTimelineTask[];
  referral_slip: ReferralSlip | null;
  execution_summary: string;
  created_at: string;
  mode: string;
}
