from typing import List, Optional
from pydantic import BaseModel, Field

class Vitals(BaseModel):
    heart_rate: int = Field(..., description="Beats per minute (BPM)")
    systolic_bp: int = Field(..., description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: int = Field(..., description="Diastolic Blood Pressure (mmHg)")
    spo2: int = Field(..., description="Oxygen Saturation percentage (%)")
    temperature: float = Field(..., description="Body temperature in Fahrenheit")
    respiratory_rate: int = Field(..., description="Breaths per minute")

class PatientProfile(BaseModel):
    id: str = Field(..., description="Unique synthetic patient identifier")
    name: str = Field(..., description="Patient name")
    age: int = Field(..., description="Patient age in years")
    gender: str = Field(..., description="Male, Female, or Other")
    location: str = Field(..., description="Village / District description")
    sub_district: str = Field("Bhadravathi", description="Taluka or Sub-district")
    district: str = Field("Shivamogga", description="District")
    state: str = Field("Karnataka", description="State")
    connectivity: str = Field("limited", description="connectivity level: good, limited, 2g_only, offline")
    road_condition: str = Field("rough_terrain", description="paved, gravel, rough_terrain, flooded")
    current_facility_id: str = Field("phc-kudligere", description="Current facility where patient reported")
    symptoms: List[str] = Field(default_factory=list, description="Reported symptoms")
    vitals: Vitals
    comorbidities: List[str] = Field(default_factory=list, description="Existing conditions e.g. Hypertension, COPD")
    onset_duration: str = Field("2 days", description="Duration of symptoms")
    notes: Optional[str] = Field(None, description="Clinical or community health worker field notes")
    phone: Optional[str] = Field(None, description="Patient or caregiver contact phone number")
    caregiver_name: Optional[str] = Field(None, description="Caregiver name")
    emergency_contact: Optional[str] = Field(None, description="Emergency phone number")
    abha_id: Optional[str] = Field(None, description="Ayushman Bharat Health Account (ABHA) number")
    registered_at: Optional[str] = Field(None, description="Registration timestamp")
    assigned_asha: Optional[str] = Field(None, description="Organisation-appointed community health worker name")
