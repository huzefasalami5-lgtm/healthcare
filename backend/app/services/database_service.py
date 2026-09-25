import os
import json
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "patients.db")

SEED_PATIENTS: List[Dict[str, Any]] = [
    {
        "id": "PAT-RESP-58",
        "name": "Rameshappa G.",
        "age": 58,
        "gender": "Male",
        "location": "Kudligere Village, Bhadravathi",
        "sub_district": "Bhadravathi",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "limited",
        "road_condition": "rough_terrain",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Severe dyspnea on minimal exertion", "High fever with chills", "Productive cough with purulent sputum", "Right pleuritic chest pain"],
        "vitals": {
            "spo2": 88,
            "heart_rate": 112,
            "respiratory_rate": 28,
            "systolic_bp: ": 150,
            "systolic_bp": 150,
            "diastolic_bp": 95,
            "temperature": 102.2
        },
        "comorbidities": ["Chronic Obstructive Pulmonary Disease (COPD)", "Systemic Arterial Hypertension"],
        "onset_duration": "3 days",
        "notes": "Patient escorted by organisation community health worker. Marked respiratory distress with accessory muscle use. Refractory hypoxemia.",
        "phone": "+91 94480 54321",
        "caregiver_name": "Parvathamma (Spouse)",
        "emergency_contact": "+91 98451 98765",
        "abha_id": "91-5842-9901-3829",
        "registered_at": "2026-09-25 09:15:00 UTC",
        "assigned_asha": "Lakshmi Bai (Organisation Community Lead)",
        "triage_priority": "EMERGENCY",
        "status": "In-Transit (108 ALS)"
    },
    {
        "id": "PAT-MAT-26",
        "name": "Sunita Devi",
        "age": 26,
        "gender": "Female",
        "location": "Guddehalli Settlement, Holehonnur",
        "sub_district": "Bhadravathi",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "2g_only",
        "road_condition": "unpaved",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Severe occipital headache", "Visual blurring and scotoma", "Epigastric pain", "Bilateral pedal & facial edema"],
        "vitals": {
            "spo2": 96,
            "heart_rate": 104,
            "respiratory_rate": 22,
            "systolic_bp": 168,
            "diastolic_bp": 108,
            "temperature": 99.4
        },
        "comorbidities": ["Primigravida 32 Weeks Gestation", "Gestational Hypertension"],
        "onset_duration": "24 hours",
        "notes": "Pre-eclampsia with severe features. Brisk patellar reflexes. Requires emergent parenteral magnesium sulfate loading and tertiary obstetric intake.",
        "phone": "+91 99011 23456",
        "caregiver_name": "Raju (Husband)",
        "emergency_contact": "+91 98860 34567",
        "abha_id": "91-7712-3401-8192",
        "registered_at": "2026-09-25 08:30:00 UTC",
        "assigned_asha": "Kavitha Devi (Organisation Sector 2)",
        "triage_priority": "EMERGENCY",
        "status": "In-Transit (108 Obstetric)"
    },
    {
        "id": "PAT-STB-38",
        "name": "Manjunatha Rao",
        "age": 38,
        "gender": "Male",
        "location": "Holalur Rural Main, Shimoga",
        "sub_district": "Shivamogga Rural",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "moderate",
        "road_condition": "paved",
        "current_facility_id": "chc-bhadravathi",
        "symptoms": ["Moderate febrile episodes", "Dry intermittent cough", "Generalized myalgia and fatigue"],
        "vitals": {
            "spo2": 97,
            "heart_rate": 84,
            "respiratory_rate": 18,
            "systolic_bp": 122,
            "diastolic_bp": 80,
            "temperature": 100.8
        },
        "comorbidities": [],
        "onset_duration": "2 days",
        "notes": "Hemodynamically stable viral presentation. Suitable for local primary outpatient symptomatic care and oral antipyretic therapy.",
        "phone": "+91 94483 11223",
        "caregiver_name": "Sharada (Wife)",
        "emergency_contact": "+91 98452 44556",
        "abha_id": "91-1234-5678-9012",
        "registered_at": "2026-09-25 10:00:00 UTC",
        "assigned_asha": "Meenakshi K. (Organisation Field Lead)",
        "triage_priority": "LOW",
        "status": "Under-Observation (PHC)"
    },
    {
        "id": "PAT-TOX-44",
        "name": "Basavaraju M.",
        "age": 44,
        "gender": "Male",
        "location": "Honnali Taluk Rural Paddy Fields",
        "sub_district": "Honnali",
        "district": "Davanagere",
        "state": "Karnataka",
        "connectivity": "limited",
        "road_condition": "rough_terrain",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Suspected Russell's Viper snakebite on right foot", "Spontaneous gingival bleeding", "Rapidly ascending limb swelling", "Vomiting and dizziness"],
        "vitals": {
            "spo2": 93,
            "heart_rate": 118,
            "respiratory_rate": 24,
            "systolic_bp": 92,
            "diastolic_bp": 60,
            "temperature": 98.4
        },
        "comorbidities": ["None documented"],
        "onset_duration": "90 minutes",
        "notes": "Hemotoxic snakebite envenomation. 20-minute whole blood clotting test (20WBCT) positive for incoagulability. Immediate Polyvalent ASV and tertiary ICU referral required.",
        "phone": "+91 98455 77889",
        "caregiver_name": "Gangamma (Mother)",
        "emergency_contact": "+91 94482 12398",
        "abha_id": "91-9988-1122-4433",
        "registered_at": "2026-09-25 11:20:00 UTC",
        "assigned_asha": "Shobha R. (Organisation Community Worker)",
        "triage_priority": "EMERGENCY",
        "status": "In-Transit (108 ALS)"
    },
    {
        "id": "PAT-PED-04",
        "name": "Baby Ananya",
        "age": 4,
        "gender": "Female",
        "location": "Channagiri Forest Hamlet",
        "sub_district": "Channagiri",
        "district": "Davanagere",
        "state": "Karnataka",
        "connectivity": "limited",
        "road_condition": "unpaved",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Acute watery diarrhea (>8 episodes)", "Persistent vomiting", "Sunken eyes and delayed skin pinch", "Extreme lethargy"],
        "vitals": {
            "spo2": 95,
            "heart_rate": 138,
            "respiratory_rate": 34,
            "systolic_bp": 82,
            "diastolic_bp": 50,
            "temperature": 101.4
        },
        "comorbidities": ["Moderate Acute Malnutrition (MAM)"],
        "onset_duration": "18 hours",
        "notes": "Severe dehydration secondary to acute infectious gastroenteritis with hypovolemic shock signs. Requires immediate intravenous Ringer's Lactate and pediatric admission.",
        "phone": "+91 97410 44556",
        "caregiver_name": "Manjula (Mother)",
        "emergency_contact": "+91 99020 99887",
        "abha_id": "91-4433-2211-0099",
        "registered_at": "2026-09-25 08:45:00 UTC",
        "assigned_asha": "Radhamma (Organisation Pediatric Field Worker)",
        "triage_priority": "HIGH",
        "status": "Admitted (Sub-District Hospital)"
    },
    {
        "id": "PAT-DIA-62",
        "name": "Parvathamma S.",
        "age": 62,
        "gender": "Female",
        "location": "Holehonnur Riverbank Colony",
        "sub_district": "Bhadravathi",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "moderate",
        "road_condition": "paved",
        "current_facility_id": "chc-bhadravathi",
        "symptoms": ["Deep foul-smelling left plantar diabetic ulcer", "Ascending cellulitis to mid-calf", "High swinging fever", "Altered appetite and malaise"],
        "vitals": {
            "spo2": 94,
            "heart_rate": 102,
            "respiratory_rate": 20,
            "systolic_bp": 148,
            "diastolic_bp": 92,
            "temperature": 102.4
        },
        "comorbidities": ["Type-2 Diabetes Mellitus (Uncontrolled)", "Diabetic Peripheral Neuropathy", "Hypertension"],
        "onset_duration": "5 days",
        "notes": "Diabetic foot sepsis (Wagner Grade 3/4) with potential deep fascial space infection. Random blood glucose 340 mg/dL. Requires urgent surgical debridement and broad-spectrum IV antibiotics.",
        "phone": "+91 98451 22334",
        "caregiver_name": "Girish (Son)",
        "emergency_contact": "+91 94488 44332",
        "abha_id": "91-6655-4433-2211",
        "registered_at": "2026-09-25 07:30:00 UTC",
        "assigned_asha": "Renuka Bai (Organisation Chronic Care Lead)",
        "triage_priority": "HIGH",
        "status": "Under-Observation (CHC Bhadravathi)"
    },
    {
        "id": "PAT-ACS-54",
        "name": "Chandrashekar B.",
        "age": 54,
        "gender": "Male",
        "location": "Mandagadde Forest Fringe",
        "sub_district": "Thirthahalli",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "limited",
        "road_condition": "rough_terrain",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Crushing retrosternal chest pain radiating to left jaw & shoulder", "Cold profuse diaphoresis", "Nausea and presyncope", "Severe anxiety"],
        "vitals": {
            "spo2": 92,
            "heart_rate": 106,
            "respiratory_rate": 24,
            "systolic_bp": 172,
            "diastolic_bp": 104,
            "temperature": 98.2
        },
        "comorbidities": ["Heavy Chronic Smoker (30 pack-years)", "Undiagnosed Dyslipidemia"],
        "onset_duration": "45 minutes",
        "notes": "Acute Coronary Syndrome (Suspected STEMI / Acute Myocardial Infarction). Bedside ECG indicates ST elevations in anteroseptal leads V1-V4. Immediate aspirin, clopidogrel, atorvastatin loading given. Emergency 108 cath-lab transfer active.",
        "phone": "+91 99801 55667",
        "caregiver_name": "Sunandamma (Wife)",
        "emergency_contact": "+91 94490 88776",
        "abha_id": "91-8899-7766-5544",
        "registered_at": "2026-09-25 11:45:00 UTC",
        "assigned_asha": "Nagaraj K. (Organisation Rapid Responder)",
        "triage_priority": "EMERGENCY",
        "status": "In-Transit (108 ALS)"
    },
    {
        "id": "PAT-TB-49",
        "name": "Govindappa N.",
        "age": 49,
        "gender": "Male",
        "location": "Shikaripura Rural Outskirts",
        "sub_district": "Shikaripura",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "moderate",
        "road_condition": "paved",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Chronic productive cough (>3 weeks)", "Recurrent hemoptysis (streaks of blood in sputum)", "Night drenching sweats", "Severe weight loss (cachexia)"],
        "vitals": {
            "spo2": 91,
            "heart_rate": 96,
            "respiratory_rate": 24,
            "systolic_bp": 108,
            "diastolic_bp": 72,
            "temperature": 100.6
        },
        "comorbidities": ["Severe Malnutrition (BMI 15.4)", "Chronic Alcohol Use Disorder"],
        "onset_duration": "3 weeks",
        "notes": "Suspected Active Pulmonary Tuberculosis with cavitation. Sputum CBNAAT / GeneXpert sent. Strict respiratory airborne isolation and urgent DOTS initiation required.",
        "phone": "+91 94484 33221",
        "caregiver_name": "Lokesh (Brother)",
        "emergency_contact": "+91 98450 66778",
        "abha_id": "91-3322-1100-9988",
        "registered_at": "2026-09-24 16:20:00 UTC",
        "assigned_asha": "Sangeetha B. (Organisation TB Field Officer)",
        "triage_priority": "HIGH",
        "status": "Active (PHC Referral)"
    },
    {
        "id": "PAT-NEP-67",
        "name": "Venkatalakshmi",
        "age": 67,
        "gender": "Female",
        "location": "Soraba Malnad Settlement",
        "sub_district": "Soraba",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "limited",
        "road_condition": "rough_terrain",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Generalized anasarca and bilateral pulmonary crepitations", "Marked oliguria (<300ml/day)", "Refractory nausea and asterixis", "Orthopnea"],
        "vitals": {
            "spo2": 89,
            "heart_rate": 94,
            "respiratory_rate": 26,
            "systolic_bp": 178,
            "diastolic_bp": 102,
            "temperature": 98.6
        },
        "comorbidities": ["End-Stage Renal Disease (ESRD on maintenance hemodialysis)", "Hypertensive Nephrosclerosis"],
        "onset_duration": "4 days",
        "notes": "Missed two hemodialysis sessions due to local monsoon transport cutoff. Critical hyperkalemia risk (K+ 6.4 mEq/L) and fluid overload. Urgent emergency hemodialysis required.",
        "phone": "+91 97405 88990",
        "caregiver_name": "Venkatesh (Son)",
        "emergency_contact": "+91 99002 11223",
        "abha_id": "91-5544-3322-1100",
        "registered_at": "2026-09-25 06:10:00 UTC",
        "assigned_asha": "Deepa V. (Organisation Elder Care Worker)",
        "triage_priority": "EMERGENCY",
        "status": "In-Transit (Dialysis Center)"
    },
    {
        "id": "PAT-TRM-32",
        "name": "Chethan Kumar",
        "age": 32,
        "gender": "Male",
        "location": "Bhadravathi Agricultural Outskirts",
        "sub_district": "Bhadravathi",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "moderate",
        "road_condition": "paved",
        "current_facility_id": "chc-bhadravathi",
        "symptoms": ["High-energy tractor rollover trauma", "Open compound fracture right tibia-fibula (Gustilo-Anderson IIIB)", "Severe pain out of proportion to injury", "Tense swollen calf"],
        "vitals": {
            "spo2": 97,
            "heart_rate": 116,
            "respiratory_rate": 22,
            "systolic_bp": 112,
            "diastolic_bp": 74,
            "temperature": 98.8
        },
        "comorbidities": ["None"],
        "onset_duration": "2 hours",
        "notes": "Impending anterior compartment syndrome of right lower limb with active bleeding. Sterile pressure dressing and rigid splint applied. Urgent emergency orthopedic surgery & fasciotomy intake.",
        "phone": "+91 98800 12349",
        "caregiver_name": "Manju (Cousin)",
        "emergency_contact": "+91 94481 99001",
        "abha_id": "91-2211-0099-8877",
        "registered_at": "2026-09-25 12:10:00 UTC",
        "assigned_asha": "Harish M. (Organisation First Responder)",
        "triage_priority": "EMERGENCY",
        "status": "In-Transit (Orthopedic Surgery)"
    },
    {
        "id": "PAT-SCR-29",
        "name": "Roopa M.",
        "age": 29,
        "gender": "Female",
        "location": "Thirthahalli Arecanut Plantation",
        "sub_district": "Thirthahalli",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "limited",
        "road_condition": "rough_terrain",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["High continuous remittent fever with chills", "Characteristic black necrotic eschar in right groin", "Maculopapular rash on trunk", "Tachypnea and suffused conjunctiva"],
        "vitals": {
            "spo2": 90,
            "heart_rate": 114,
            "respiratory_rate": 28,
            "systolic_bp": 104,
            "diastolic_bp": 68,
            "temperature": 103.8
        },
        "comorbidities": ["Agricultural worker with frequent scrub exposure"],
        "onset_duration": "6 days",
        "notes": "Scrub Typhus (Orientia tsutsugamushi) with early multi-organ dysfunction syndrome (MODS) and pneumonitis. Requires immediate oral/IV Doxycycline and high-flow oxygen monitoring.",
        "phone": "+91 99450 77112",
        "caregiver_name": "Shrikant (Brother)",
        "emergency_contact": "+91 98453 22119",
        "abha_id": "91-1199-8822-3344",
        "registered_at": "2026-09-25 09:40:00 UTC",
        "assigned_asha": "Prema G. (Organisation Vector-Borne Disease Lead)",
        "triage_priority": "EMERGENCY",
        "status": "Admitted (ICU Referral)"
    },
    {
        "id": "PAT-ORG-51",
        "name": "Mahadevappa",
        "age": 51,
        "gender": "Male",
        "location": "Ayanur Farming Belt",
        "sub_district": "Shivamogga Rural",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "moderate",
        "road_condition": "paved",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Accidental monocrotophos pesticide inhalation", "Excessive salivation and lacrimation", "Pinpoint constricted pupils (miosis)", "Wheezing and muscular fasciculations"],
        "vitals": {
            "spo2": 91,
            "heart_rate": 54,
            "respiratory_rate": 26,
            "systolic_bp": 118,
            "diastolic_bp": 70,
            "temperature": 98.0
        },
        "comorbidities": ["Farmer with chronic pesticide handling"],
        "onset_duration": "2 hours",
        "notes": "Acute Organophosphate (OP) Poisoning (SLUDGE syndrome). Atropine 2mg IV bolus administered at PHC with partial response. Requires continuous atropinization titration, Pralidoxime (PAM), and tertiary ICU intake.",
        "phone": "+91 94487 66554",
        "caregiver_name": "Basamma (Wife)",
        "emergency_contact": "+91 99014 55667",
        "abha_id": "91-7788-9900-1122",
        "registered_at": "2026-09-25 10:45:00 UTC",
        "assigned_asha": "Shivananda P. (Organisation Toxicology Scout)",
        "triage_priority": "EMERGENCY",
        "status": "In-Transit (Atropine Protocol)"
    },
    {
        "id": "PAT-AST-19",
        "name": "Pooja K.",
        "age": 19,
        "gender": "Female",
        "location": "Tyavarekoppa Tribal Hamlet",
        "sub_district": "Shivamogga Rural",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "limited",
        "road_condition": "unpaved",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Acute severe bronchial asthma exacerbation", "Inability to complete sentences in one breath", "Audible expiratory wheeze", "Intercostal retraction"],
        "vitals": {
            "spo2": 91,
            "heart_rate": 118,
            "respiratory_rate": 30,
            "systolic_bp": 128,
            "diastolic_bp": 82,
            "temperature": 99.0
        },
        "comorbidities": ["Atopic Childhood Asthma", "Allergic Rhinitis"],
        "onset_duration": "6 hours",
        "notes": "Acute severe asthma attack refractory to home Salbutamol MDI. Continuous Salbutamol/Ipratropium nebulization and IV hydrocortisone initiated. Monitoring for peak flow improvement.",
        "phone": "+91 98458 99112",
        "caregiver_name": "Chandramma (Mother)",
        "emergency_contact": "+91 94480 33445",
        "abha_id": "91-3344-5566-7788",
        "registered_at": "2026-09-25 08:15:00 UTC",
        "assigned_asha": "Anasuya N. (Organisation Field Worker)",
        "triage_priority": "HIGH",
        "status": "Under-Observation (Nebulization Hub)"
    },
    {
        "id": "PAT-HYP-73",
        "name": "Siddappa G.",
        "age": 73,
        "gender": "Male",
        "location": "Sirigere Village",
        "sub_district": "Channagiri",
        "district": "Davanagere",
        "state": "Karnataka",
        "connectivity": "moderate",
        "road_condition": "paved",
        "current_facility_id": "chc-bhadravathi",
        "symptoms": ["Sudden acute occipital burst headache", "Right-sided facial droop and arm weakness", "Slurred dysarthric speech", "Vomiting"],
        "vitals": {
            "spo2": 95,
            "heart_rate": 88,
            "respiratory_rate": 20,
            "systolic_bp": 208,
            "diastolic_bp": 116,
            "temperature": 98.6
        },
        "comorbidities": ["Longstanding Untreated Hypertension", "Type-2 Diabetes Mellitus"],
        "onset_duration": "75 minutes",
        "notes": "Hypertensive Emergency with Acute Cerebrovascular Event (Stroke in evolution). Cincinnati Prehospital Stroke Scale positive. Immediate non-contrast CT brain and stroke unit intake required within 4.5-hour thrombolysis window.",
        "phone": "+91 98802 44331",
        "caregiver_name": "Kumar (Son)",
        "emergency_contact": "+91 94485 77665",
        "abha_id": "91-9900-1122-3344",
        "registered_at": "2026-09-25 11:00:00 UTC",
        "assigned_asha": "Yashodha S. (Organisation Stroke Protocol Lead)",
        "triage_priority": "EMERGENCY",
        "status": "In-Transit (Stroke Center)"
    },
    {
        "id": "PAT-GAS-35",
        "name": "Rajeshwari P.",
        "age": 35,
        "gender": "Female",
        "location": "Mattur Sanskrit Heritage Village",
        "sub_district": "Shivamogga",
        "district": "Shivamogga",
        "state": "Karnataka",
        "connectivity": "high",
        "road_condition": "paved",
        "current_facility_id": "phc-kudligere",
        "symptoms": ["Acute right iliac fossa (McBurney's point) abdominal pain", "Low-grade fever", "Nausea and anorexia", "Rebound tenderness and guarding"],
        "vitals": {
            "spo2": 98,
            "heart_rate": 96,
            "respiratory_rate": 18,
            "systolic_bp": 116,
            "diastolic_bp": 76,
            "temperature": 101.2
        },
        "comorbidities": ["None"],
        "onset_duration": "24 hours",
        "notes": "Clinical Acute Appendicitis (Alvarado score 8/10). Nil per oral (NPO) ordered, IV fluid resuscitation begun. Transferred for emergency ultrasonography and laparoscopic appendectomy.",
        "phone": "+91 99451 88992",
        "caregiver_name": "Prasad (Husband)",
        "emergency_contact": "+91 98457 11223",
        "abha_id": "91-5566-7788-9900",
        "registered_at": "2026-09-25 09:00:00 UTC",
        "assigned_asha": "Bhavani K. (Organisation Field Worker)",
        "triage_priority": "HIGH",
        "status": "Under-Observation (Surgical Evaluation)"
    }
]

class DatabaseService:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS patients (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    age INTEGER NOT NULL,
                    gender TEXT NOT NULL,
                    location TEXT NOT NULL,
                    sub_district TEXT,
                    district TEXT,
                    state TEXT,
                    connectivity TEXT,
                    road_condition TEXT,
                    current_facility_id TEXT,
                    symptoms TEXT,
                    vitals TEXT,
                    comorbidities TEXT,
                    onset_duration TEXT,
                    notes TEXT,
                    phone TEXT,
                    caregiver_name TEXT,
                    emergency_contact TEXT,
                    abha_id TEXT,
                    registered_at TEXT,
                    assigned_asha TEXT,
                    triage_priority TEXT DEFAULT 'MODERATE',
                    status TEXT DEFAULT 'Active'
                )
            """)
            conn.commit()

            # Seed if table is empty
            cursor.execute("SELECT COUNT(*) as count FROM patients")
            row = cursor.fetchone()
            if row["count"] == 0:
                self.seed_database(conn)

    def seed_database(self, conn: sqlite3.Connection):
        cursor = conn.cursor()
        for p in SEED_PATIENTS:
            cursor.execute("""
                INSERT OR REPLACE INTO patients (
                    id, name, age, gender, location, sub_district, district, state,
                    connectivity, road_condition, current_facility_id, symptoms, vitals,
                    comorbidities, onset_duration, notes, phone, caregiver_name,
                    emergency_contact, abha_id, registered_at, assigned_asha,
                    triage_priority, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p["id"],
                p["name"],
                p["age"],
                p["gender"],
                p["location"],
                p.get("sub_district", "Shivamogga"),
                p.get("district", "Shivamogga"),
                p.get("state", "Karnataka"),
                p.get("connectivity", "moderate"),
                p.get("road_condition", "paved"),
                p.get("current_facility_id", "phc-kudligere"),
                json.dumps(p.get("symptoms", [])),
                json.dumps(p.get("vitals", {})),
                json.dumps(p.get("comorbidities", [])),
                p.get("onset_duration", "2 days"),
                p.get("notes", ""),
                p.get("phone", ""),
                p.get("caregiver_name", ""),
                p.get("emergency_contact", ""),
                p.get("abha_id", ""),
                p.get("registered_at", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")),
                p.get("assigned_asha", "Organisation Community Worker"),
                p.get("triage_priority", "MODERATE"),
                p.get("status", "Active")
            ))
        conn.commit()

    def _row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        d = dict(row)
        if "symptoms" in d and d["symptoms"]:
            try:
                d["symptoms"] = json.loads(d["symptoms"])
            except Exception:
                d["symptoms"] = []
        if "vitals" in d and d["vitals"]:
            try:
                d["vitals"] = json.loads(d["vitals"])
            except Exception:
                d["vitals"] = {}
        if "comorbidities" in d and d["comorbidities"]:
            try:
                d["comorbidities"] = json.loads(d["comorbidities"])
            except Exception:
                d["comorbidities"] = []
        return d

    def get_all_patients(
        self,
        search: Optional[str] = None,
        priority: Optional[str] = None,
        district: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM patients WHERE 1=1"
            params = []

            if priority and priority != "all":
                query += " AND triage_priority = ?"
                params.append(priority.upper())

            if district and district != "all":
                query += " AND district = ?"
                params.append(district)

            if status and status != "all":
                query += " AND status LIKE ?"
                params.append(f"%{status}%")

            if search:
                query += " AND (name LIKE ? OR id LIKE ? OR location LIKE ? OR abha_id LIKE ? OR assigned_asha LIKE ? OR notes LIKE ?)"
                search_param = f"%{search}%"
                params.extend([search_param] * 6)

            query += " ORDER BY registered_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [self._row_to_dict(r) for r in rows]

    def get_patient_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
            row = cursor.fetchone()
            if row:
                return self._row_to_dict(row)
            return None

    def insert_or_update_patient(self, p: Dict[str, Any]) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO patients (
                    id, name, age, gender, location, sub_district, district, state,
                    connectivity, road_condition, current_facility_id, symptoms, vitals,
                    comorbidities, onset_duration, notes, phone, caregiver_name,
                    emergency_contact, abha_id, registered_at, assigned_asha,
                    triage_priority, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p["id"],
                p["name"],
                p.get("age", 45),
                p.get("gender", "Male"),
                p["location"],
                p.get("sub_district", "Shivamogga"),
                p.get("district", "Shivamogga"),
                p.get("state", "Karnataka"),
                p.get("connectivity", "moderate"),
                p.get("road_condition", "paved"),
                p.get("current_facility_id", "phc-kudligere"),
                json.dumps(p.get("symptoms", [])),
                json.dumps(p.get("vitals", {})),
                json.dumps(p.get("comorbidities", [])),
                p.get("onset_duration", "2 days"),
                p.get("notes", ""),
                p.get("phone", ""),
                p.get("caregiver_name", ""),
                p.get("emergency_contact", ""),
                p.get("abha_id", ""),
                p.get("registered_at", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")),
                p.get("assigned_asha", "Organisation Community Worker"),
                p.get("triage_priority", "MODERATE"),
                p.get("status", "Active")
            ))
            conn.commit()
            return self.get_patient_by_id(p["id"])

    def delete_patient(self, patient_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_stats(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as total FROM patients")
            total = cursor.fetchone()["total"]

            cursor.execute("SELECT COUNT(*) as emergency FROM patients WHERE triage_priority = 'EMERGENCY'")
            emergency = cursor.fetchone()["emergency"]

            cursor.execute("SELECT COUNT(*) as high FROM patients WHERE triage_priority = 'HIGH'")
            high = cursor.fetchone()["high"]

            cursor.execute("SELECT COUNT(*) as transit FROM patients WHERE status LIKE '%Transit%'")
            transit = cursor.fetchone()["transit"]

            cursor.execute("SELECT COUNT(DISTINCT assigned_asha) as workers FROM patients WHERE assigned_asha IS NOT NULL")
            workers = cursor.fetchone()["workers"]

            return {
                "total_patients": total,
                "emergency_cases": emergency,
                "high_priority": high,
                "in_transit": transit,
                "community_workers_deployed": workers,
                "database_engine": "SQLite 3",
                "database_file": os.path.basename(self.db_path)
            }

    def reset_database(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM patients")
            conn.commit()
            self.seed_database(conn)
            return self.get_stats()

database_service = DatabaseService()
