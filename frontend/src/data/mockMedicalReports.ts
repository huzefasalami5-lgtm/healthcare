export interface DiagnosticParameter {
  name: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'borderline' | 'critical';
  notes?: string;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  category: 'radiology' | 'abg' | 'hematology' | 'ecg' | 'biochemistry';
  title: string;
  modality: string;
  facility: string;
  conductedAt: string;
  reportedBy: string;
  status: 'completed' | 'critical_review_needed' | 'verified_by_doctor';
  summaryImpression: string;
  clinicalSignificance: string;
  parameters: DiagnosticParameter[];
  imagingUrl?: string;
  findings: string[];
}

export const MOCK_MEDICAL_REPORTS: Record<string, MedicalReport[]> = {
  // Default: Rameshappa G. (58y, Severe Hypoxemic Pneumonia)
  'DEMO-RESP-58': [
    {
      id: 'REP-RAD-0912',
      patientId: 'DEMO-RESP-58',
      category: 'radiology',
      title: 'Digital Chest Radiography (PA View)',
      modality: 'Digital X-Ray (High-Frequency Chest Unit)',
      facility: 'Kudligere PHC / Holalur Tele-Radiology Hub',
      conductedAt: '2 hours ago (Today, 10:15 AM)',
      reportedBy: 'Dr. Anupama Rao, MD (Consultant Radiologist)',
      status: 'critical_review_needed',
      summaryImpression: 'Bilateral lower lobe heterogeneous alveolar consolidation consistent with severe acute community-acquired pneumonia. Blunting of right costophrenic angle.',
      clinicalSignificance: 'Severe lung parenchyma compromise explaining refractory hypoxemia (SpO2 88%). Requires urgent tertiary pulmonology intake and high-flow oxygen.',
      findings: [
        'Patchy opacification with air bronchograms in bilateral lower lung zones (Right > Left)',
        'Cardiothoracic ratio within normal physiological limits (CTR < 0.50)',
        'Trachea midline; mediastinal contours normal',
        'No active pneumothorax or rib fracture detected',
        'Bilateral hemidiaphragms visualized; mild right basal effusion'
      ],
      parameters: [
        { name: 'Consolidation Severity', value: 'Grade III (Extensive)', unit: 'Scale I-IV', referenceRange: 'None', status: 'critical', notes: 'Air bronchograms visible' },
        { name: 'Cardiothoracic Ratio', value: '0.48', unit: 'ratio', referenceRange: '< 0.50', status: 'normal' },
        { name: 'Pleural Space', value: 'Minimal right effusion', unit: 'grade', referenceRange: 'Clear', status: 'borderline' }
      ]
    },
    {
      id: 'REP-ABG-0421',
      patientId: 'DEMO-RESP-58',
      category: 'abg',
      title: 'Arterial Blood Gas (ABG) & Blood Gas Profile',
      modality: 'Direct Arterial Radial Sample (Heparinized Cartridge)',
      facility: 'Kudligere PHC Point-of-Care Lab',
      conductedAt: '1.5 hours ago (Today, 10:45 AM)',
      reportedBy: 'Dr. S. K. Murthy (Medical Officer In-Charge)',
      status: 'critical_review_needed',
      summaryImpression: 'Type-1 Acute Hypoxemic Respiratory Failure with mild respiratory alkalemia due to tachypneic hyperventilation.',
      clinicalSignificance: 'PaO2 severely depressed at 56 mmHg on room air. P/F ratio < 200 indicates urgent requirement for supplemental oxygen titration or Non-Invasive Ventilation (NIV).',
      findings: [
        'Significant PaO2 deficit on room air indicating ventilation-perfusion (V/Q) mismatch',
        'Mild compensatory hypocapnia secondary to elevated respiratory rate (28/min)',
        'Serum lactate mildly elevated (2.4 mmol/L) suggesting tissue hypoxia'
      ],
      parameters: [
        { name: 'pH (Arterial)', value: 7.46, unit: 'pH units', referenceRange: '7.35 - 7.45', status: 'borderline', notes: 'Mild respiratory alkalemia' },
        { name: 'PaO2 (Arterial Oxygen)', value: 56, unit: 'mmHg', referenceRange: '75.0 - 100.0', status: 'critical', notes: 'Severe hypoxemia alert' },
        { name: 'PaCO2 (Carbon Dioxide)', value: 31, unit: 'mmHg', referenceRange: '35.0 - 45.0', status: 'borderline', notes: 'Washed out via tachypnea' },
        { name: 'HCO3- (Bicarbonate)', value: 22.4, unit: 'mEq/L', referenceRange: '22.0 - 26.0', status: 'normal' },
        { name: 'SaO2 (Arterial Saturation)', value: 88.2, unit: '%', referenceRange: '95.0 - 100.0', status: 'critical', notes: 'Dangerous desaturation' },
        { name: 'Blood Lactate', value: 2.4, unit: 'mmol/L', referenceRange: '0.5 - 1.6', status: 'borderline', notes: 'Early tissue hypoperfusion' }
      ]
    },
    {
      id: 'REP-CBC-1088',
      patientId: 'DEMO-RESP-58',
      category: 'hematology',
      title: 'Complete Blood Count (CBC) & Acute Phase Reactants',
      modality: 'Automated 5-Part Hematology Analyzer',
      facility: 'Kudligere PHC / Taluk Lab Grid',
      conductedAt: '2.5 hours ago (Today, 09:50 AM)',
      reportedBy: 'K. R. Vani (Senior Lab Technologist)',
      status: 'completed',
      summaryImpression: 'Marked neutrophilic leukocytosis with significant CRP elevation indicative of bacterial pneumonia consolidation.',
      clinicalSignificance: 'WBC 14,800 with 86% neutrophils and CRP 52 mg/L confirms acute infectious inflammatory cascade requiring immediate parenteral antibiotic therapy.',
      findings: [
        'Leukocytosis with absolute neutrophilia; toxic granulation noted on peripheral smear',
        'C-Reactive Protein elevated tenfold above upper normal limit',
        'Platelet count and hemoglobin adequate with no acute coagulopathy'
      ],
      parameters: [
        { name: 'Total Leukocyte Count (WBC)', value: '14,800', unit: '/uL', referenceRange: '4,000 - 11,000', status: 'critical', notes: 'Leukocytosis' },
        { name: 'Neutrophils', value: '86.4', unit: '%', referenceRange: '40.0 - 70.0', status: 'critical', notes: 'Marked left shift' },
        { name: 'Lymphocytes', value: '9.2', unit: '%', referenceRange: '20.0 - 40.0', status: 'borderline', notes: 'Relative lymphopenia' },
        { name: 'C-Reactive Protein (CRP)', value: '52.0', unit: 'mg/L', referenceRange: '< 6.0', status: 'critical', notes: 'Marked systemic inflammation' },
        { name: 'Hemoglobin (Hb)', value: '12.8', unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'normal' },
        { name: 'Platelet Count', value: '2.4', unit: 'Lakh/uL', referenceRange: '1.5 - 4.5', status: 'normal' }
      ]
    },
    {
      id: 'REP-ECG-3304',
      patientId: 'DEMO-RESP-58',
      category: 'ecg',
      title: '12-Lead Electrocardiogram (ECG) Report',
      modality: 'Digital 12-Lead ECG Machine with Tele-Cardiology Link',
      facility: 'Kudligere PHC Bedside Cart',
      conductedAt: '3 hours ago (Today, 09:30 AM)',
      reportedBy: 'Dr. H. G. Suresh (District Pulmo-Cardiology On-Call)',
      status: 'verified_by_doctor',
      summaryImpression: 'Sinus Tachycardia at 112 BPM. P-pulmonale pattern in Lead II suggestive of acute right atrial overload secondary to pulmonary resistance.',
      clinicalSignificance: 'No acute ST-elevation or transmural myocardial infarction. Tachycardia represents hemodynamic compensation for hypoxemia and fever.',
      findings: [
        'Regular sinus rhythm with ventricular rate of 112 BPM',
        'Tall peaked P-waves (>2.5mm) in leads II, III, and aVF (P-pulmonale)',
        'Normal PR interval (152 ms) and QRS duration (88 ms)',
        'No pathological Q waves; mild non-specific ST flattening in anterolateral leads'
      ],
      parameters: [
        { name: 'Heart Rate', value: '112', unit: 'BPM', referenceRange: '60 - 100', status: 'borderline', notes: 'Compensatory tachycardia' },
        { name: 'PR Interval', value: '152', unit: 'ms', referenceRange: '120 - 200', status: 'normal' },
        { name: 'QRS Duration', value: '88', unit: 'ms', referenceRange: '80 - 120', status: 'normal' },
        { name: 'QTc Interval', value: '428', unit: 'ms', referenceRange: '< 450', status: 'normal' },
        { name: 'ST Segment', value: 'Non-specific flattening', unit: 'morphology', referenceRange: 'Isoelectric', status: 'normal' }
      ]
    },
    {
      id: 'REP-BIO-5510',
      patientId: 'DEMO-RESP-58',
      category: 'biochemistry',
      title: 'Point-of-Care Renal, Electrolytes & Glucose Screen',
      modality: 'Cartridge Dry-Chemistry Biosensor',
      facility: 'Kudligere PHC Field Laboratory',
      conductedAt: '2 hours ago (Today, 10:20 AM)',
      reportedBy: 'K. R. Vani (Senior Lab Technologist)',
      status: 'completed',
      summaryImpression: 'Mild prerenal azotemia (Serum Creatinine 1.3 mg/dL) likely secondary to reduced oral intake and febrile perspiration. Electrolytes within acceptable limits.',
      clinicalSignificance: 'Requires gentle isotonic hydration during ambulance transfer without pulmonary fluid overload.',
      findings: [
        'Normal random blood glucose with no acute diabetic ketoacidosis',
        'Serum potassium normal (4.2 mEq/L) allowing standard antibiotic administrations'
      ],
      parameters: [
        { name: 'Random Blood Glucose', value: '138', unit: 'mg/dL', referenceRange: '70 - 140', status: 'normal' },
        { name: 'Serum Creatinine', value: '1.3', unit: 'mg/dL', referenceRange: '0.7 - 1.2', status: 'borderline', notes: 'Mild dehydration azotemia' },
        { name: 'Blood Urea Nitrogen', value: '26', unit: 'mg/dL', referenceRange: '7 - 20', status: 'borderline' },
        { name: 'Serum Sodium (Na+)', value: '137', unit: 'mEq/L', referenceRange: '135 - 145', status: 'normal' },
        { name: 'Serum Potassium (K+)', value: '4.2', unit: 'mEq/L', referenceRange: '3.5 - 5.0', status: 'normal' }
      ]
    }
  ]
};

export function getReportsForPatient(patientId: string): MedicalReport[] {
  if (MOCK_MEDICAL_REPORTS[patientId]) {
    return MOCK_MEDICAL_REPORTS[patientId];
  }
  // Fallback to default patient reports
  return MOCK_MEDICAL_REPORTS['DEMO-RESP-58'] || [];
}
