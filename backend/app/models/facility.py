from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FacilityResourceSummary(BaseModel):
    medicines_available: List[str] = Field(default_factory=list)
    medicines_stockout: List[str] = Field(default_factory=list)
    diagnostics_available: List[str] = Field(default_factory=list)
    diagnostics_unavailable: List[str] = Field(default_factory=list)
    doctors_on_duty: List[str] = Field(default_factory=list)
    equipment_functional: List[str] = Field(default_factory=list)
    equipment_down: List[str] = Field(default_factory=list)
    oxygen_status: str = Field("available", description="available, low_reserve, critical, none")
    icu_beds_available: int = 0
    general_beds_available: int = 0

class HealthcareFacility(BaseModel):
    id: str
    name: str
    tier: str = Field(..., description="Sub-Centre, PHC, CHC, Sub-District Hospital, District Hospital, Medical College")
    tier_level: int = Field(..., description="1=Sub-centre, 2=PHC, 3=CHC, 4=District, 5=Apex Medical College")
    district: str
    taluka: str
    distance_km: float = 0.0
    travel_time_mins: int = 0
    capabilities: List[str] = Field(default_factory=list)
    connectivity_level: str = "good"  # good, moderate, poor
    operating_hours: str = "24x7"
    contact_number: str = "+91-8182-224411"
    resources: FacilityResourceSummary
