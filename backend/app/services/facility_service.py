import json
import os
from typing import List, Optional, Dict, Any
from app.models.facility import HealthcareFacility

class FacilityService:
    def __init__(self):
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        facilities_path = os.path.join(current_dir, "data", "facilities.json")
        with open(facilities_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            self.facilities: List[HealthcareFacility] = [HealthcareFacility(**item) for item in raw_data]

    def get_all_facilities(self) -> List[HealthcareFacility]:
        return self.facilities

    def get_facility_by_id(self, facility_id: str) -> Optional[HealthcareFacility]:
        for f in self.facilities:
            if f.id == facility_id:
                return f
        return None

    def find_capable_facilities(self, required_capabilities: List[str], max_distance_km: float = 100.0) -> List[HealthcareFacility]:
        results = []
        for facility in self.facilities:
            has_match = any(
                req.lower() in cap.lower() 
                for req in required_capabilities 
                for cap in facility.capabilities
            )
            if has_match and facility.distance_km <= max_distance_km:
                results.append(facility)
        return sorted(results, key=lambda x: (x.distance_km, -x.tier_level))

facility_service = FacilityService()
