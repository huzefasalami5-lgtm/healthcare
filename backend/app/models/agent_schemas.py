from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentOutputBase(BaseModel):
    agent_id: str
    agent_name: str
    status: str = "completed"  # running, completed, escalated, failed
    execution_time_ms: int = 0
    timestamp: str
    reasoning: str
    key_factors: List[str] = Field(default_factory=list)
    requires_human_review: bool = True
    data: Dict[str, Any] = Field(default_factory=dict)

class TriageAgentOutput(AgentOutputBase):
    priority: str = Field(..., description="LOW, MODERATE, HIGH, EMERGENCY")
    escalation_needed: bool
    vital_flags: List[str]
    symptom_flags: List[str]
    clinical_advisory: str

class AccessAgentOutput(AgentOutputBase):
    access_risk: str = Field(..., description="LOW, MEDIUM, HIGH")
    connectivity_status: str
    road_feasibility: str
    nearest_phc_distance_km: float
    ambulance_delay_estimate_mins: int
    teleconsult_possible: bool
    access_barriers: List[str]

class FacilityAgentOutput(AgentOutputBase):
    selected_facility_id: str
    selected_facility_name: str
    selected_facility_tier: str
    candidate_facilities: List[Dict[str, Any]]
    capability_match_score: int  # 0-100
    is_referral_needed: bool
    distance_km: float
    travel_time_mins: int

class ResourceAgentOutput(AgentOutputBase):
    critical_resources_available: bool
    medicines_status: str  # Available, Partial, Stockout
    diagnostics_status: str  # Available, Partial, Unavailable
    specialist_status: str  # Available, On-Call, Unavailable
    equipment_status: str  # Operational, Degraded, Unavailable
    available_items: List[str]
    missing_items: List[str]
    stockout_contingency: str

class CoordinatorAgentOutput(AgentOutputBase):
    coordinated_pathway_title: str
    action_priority: str
    why_pathway_selected: str
    primary_facility: str
    interventions_ordered: List[str]
    contingency_plan: str

class ReferralAgentOutput(AgentOutputBase):
    referral_required: bool
    referring_facility: str
    destination_facility: str
    urgency: str
    transport_mode: str
    referral_slip: Optional[Dict[str, Any]] = None
    referral_reason: str
    clinical_handover_notes: List[str]

class CareTimelineTask(BaseModel):
    task_id: str
    phase: str  # Assessment, Triage, Stabilization, Transfer, Consultation, Follow-Up
    title: str
    description: str
    owner: str  # Organisation Community Worker, PHC Nurse, MO Doctor, District Specialist, Caregiver
    due_in: str
    status: str = "pending"  # pending, in_progress, completed
    verification_required: bool = True

class ContinuityAgentOutput(AgentOutputBase):
    timeline_tasks: List[CareTimelineTask]
    asha_action_checklist: List[str]
    patient_telephony_sms: str
    next_review_target: str
    follow_up_frequency: str

class CoordinatedCarePathway(BaseModel):
    patient_id: str
    patient_name: str
    triage_priority: str  # LOW, MODERATE, HIGH, EMERGENCY
    access_risk: str      # LOW, MEDIUM, HIGH
    recommended_facility: str
    referral_required: bool
    resource_status: str  # Available, Partial, Stockout
    follow_up_target: str
    human_verification_required: bool = True
    disclaimer: str = "AI-generated decision support. Not a medical diagnosis. Human verification is required."
    agents: Dict[str, Any] = Field(default_factory=dict)
    timeline: List[CareTimelineTask] = Field(default_factory=list)
    referral_slip: Optional[Dict[str, Any]] = None
    execution_summary: str
    created_at: str
    mode: str = "Live Deterministic Multi-Agent Grid"
