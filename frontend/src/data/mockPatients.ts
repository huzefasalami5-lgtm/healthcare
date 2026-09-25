import { PatientProfile } from '../types';

export const DEMO_PATIENTS: PatientProfile[] = [
  {
    id: "DEMO-RESP-58",
    name: "Rameshappa G.",
    age: 58,
    gender: "Male",
    location: "Mallenahalli Gram Panchayat, Bhadravathi",
    sub_district: "Bhadravathi",
    district: "Shivamogga",
    state: "Karnataka",
    connectivity: "limited",
    road_condition: "rough_terrain",
    current_facility_id: "phc-kudligere",
    symptoms: ["fever (3 days)", "severe weakness", "progressive breathing difficulty", "productive cough"],
    vitals: {
      heart_rate: 108,
      systolic_bp: 138,
      diastolic_bp: 86,
      spo2: 88,
      temperature: 102.4,
      respiratory_rate: 28
    },
    comorbidities: ["Type 2 Diabetes", "Chronic Smoker"],
    onset_duration: "3 days",
    notes: "Patient brought on motorcycle to Kudligere PHC. Cyanotic nail beds, tachypneic. PHC oxygen concentrator filter defective and IV Ceftriaxone stocked out."
  },
  {
    id: "DEMO-MATERNAL-26",
    name: "Sunita Devi",
    age: 26,
    gender: "Female",
    location: "Bilikere Tribal Settlement",
    sub_district: "Bhadravathi",
    district: "Shivamogga",
    state: "Karnataka",
    connectivity: "2g_only",
    road_condition: "rough_terrain",
    current_facility_id: "sc-mallenahalli",
    symptoms: ["severe persistent headache", "blurred vision", "pedal edema bilateral", "epigastric discomfort"],
    vitals: {
      heart_rate: 96,
      systolic_bp: 164,
      diastolic_bp: 108,
      spo2: 96,
      temperature: 98.6,
      respiratory_rate: 20
    },
    comorbidities: ["Primigravida 32 Weeks Gestation"],
    onset_duration: "24 hours",
    notes: "Organisation-appointed community health worker accompanied. Suspicion of Severe Pre-Eclampsia. Sub-Centre lacks Magnesium Sulfate and obstetrician."
  },
  {
    id: "DEMO-DIAB-62",
    name: "Parvathamma S.",
    age: 62,
    gender: "Female",
    location: "Holehonnur Village",
    sub_district: "Bhadravathi",
    district: "Shivamogga",
    state: "Karnataka",
    connectivity: "moderate",
    road_condition: "paved",
    current_facility_id: "phc-kudligere",
    symptoms: ["non-healing right heel ulcer (3 weeks)", "burning neuropathic pain", "polyuria"],
    vitals: {
      heart_rate: 84,
      systolic_bp: 142,
      diastolic_bp: 90,
      spo2: 97,
      temperature: 99.1,
      respiratory_rate: 18
    },
    comorbidities: ["Type 2 Diabetes Mellitus (12 yrs)", "Hypertension"],
    onset_duration: "3 weeks",
    notes: "Requires surgical debridement, antibiotic wound culture, and insulin regimen titration at Community Health Centre (CHC)."
  },
  {
    id: "DEMO-PED-06",
    name: "Aarav Naik",
    age: 6,
    gender: "Male",
    location: "Kudligere Village",
    sub_district: "Bhadravathi",
    district: "Shivamogga",
    state: "Karnataka",
    connectivity: "moderate",
    road_condition: "paved",
    current_facility_id: "phc-kudligere",
    symptoms: ["mild fever", "watery loose stools (3 episodes)", "slight thirst"],
    vitals: {
      heart_rate: 98,
      systolic_bp: 102,
      diastolic_bp: 64,
      spo2: 98,
      temperature: 100.1,
      respiratory_rate: 22
    },
    comorbidities: [],
    onset_duration: "1 day",
    notes: "Good skin pinch recovery, alert. Mild dehydration. PHC has adequate ORS and Zinc oral dispersible tablets."
  }
];
