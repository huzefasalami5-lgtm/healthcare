import React, { useState } from 'react';
import { 
  UserPlus, 
  Heart, 
  MapPin, 
  Wifi, 
  Truck, 
  Stethoscope, 
  Activity, 
  Wind, 
  Thermometer, 
  Gauge, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  FileText, 
  Phone, 
  Users, 
  QrCode, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { PatientProfile, PatientVitals } from '../types';

interface PatientRegistrationProps {
  onRegisterSuccess: (patient: PatientProfile) => void;
  isProcessing: boolean;
}

export const PatientRegistration: React.FC<PatientRegistrationProps> = ({
  onRegisterSuccess,
  isProcessing
}) => {
  const [formData, setFormData] = useState<Partial<PatientProfile>>({
    id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    age: 45,
    gender: 'Male',
    location: '',
    sub_district: 'Bhadravathi',
    district: 'Shivamogga',
    state: 'Karnataka',
    connectivity: 'limited',
    road_condition: 'rough_terrain',
    current_facility_id: 'phc-kudligere',
    symptoms: ['Fever', 'Breathing difficulty'],
    vitals: {
      spo2: 89,
      heart_rate: 108,
      respiratory_rate: 26,
      systolic_bp: 150,
      diastolic_bp: 95,
      temperature: 101.8
    },
    comorbidities: ['Hypertension'],
    onset_duration: '2 days',
    notes: 'Patient escorted by organisation community health worker. Severe shortness of breath on mild exertion.',
    phone: '+91 98450 12345',
    caregiver_name: 'Parvathamma (Spouse)',
    emergency_contact: '+91 94481 67890',
    abha_id: `91-5842-9901-${Math.floor(1000 + Math.random() * 9000)}`,
    assigned_asha: 'Lakshmi Bai (Organisation Community Lead)'
  });

  const [customSymptom, setCustomSymptom] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Common symptoms for rural triage
  const COMMON_SYMPTOMS = [
    'Fever',
    'Breathing difficulty',
    'Chest pain / pressure',
    'Extreme weakness',
    'Persistent cough',
    'High headache',
    'Dizziness',
    'Severe vomiting',
    'Pediatric stridor',
    'Maternal edema'
  ];

  // Common comorbidities
  const COMMON_COMORBIDITIES = [
    'Hypertension',
    'Diabetes Mellitus',
    'COPD / Asthma',
    'Coronary Artery Disease',
    'Tuberculosis history',
    'Chronic Kidney Disease',
    'Pregnancy (3rd Trimester)'
  ];

  const handleToggleSymptom = (symptom: string) => {
    const current = formData.symptoms || [];
    if (current.includes(symptom)) {
      setFormData({ ...formData, symptoms: current.filter(s => s !== symptom) });
    } else {
      setFormData({ ...formData, symptoms: [...current, symptom] });
    }
  };

  const handleToggleComorbidity = (condition: string) => {
    const current = formData.comorbidities || [];
    if (current.includes(condition)) {
      setFormData({ ...formData, comorbidities: current.filter(c => c !== condition) });
    } else {
      setFormData({ ...formData, comorbidities: [...current, condition] });
    }
  };

  const handleAddCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !(formData.symptoms || []).includes(customSymptom.trim())) {
      setFormData({ ...formData, symptoms: [...(formData.symptoms || []), customSymptom.trim()] });
      setCustomSymptom('');
    }
  };

  const updateVitals = (key: keyof PatientVitals, val: number) => {
    setFormData({
      ...formData,
      vitals: {
        ...(formData.vitals as PatientVitals),
        [key]: val
      }
    });
  };

  // Quick fill presets for judging and fast testing
  const loadQuickPreset = (presetType: 'emergency-respiratory' | 'maternal-crisis' | 'routine-fever') => {
    if (presetType === 'emergency-respiratory') {
      setFormData({
        id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        name: 'Rameshappa G.',
        age: 58,
        gender: 'Male',
        location: 'Mallenahalli Gram Panchayat, Bhadravathi',
        sub_district: 'Bhadravathi',
        district: 'Shivamogga',
        state: 'Karnataka',
        connectivity: 'limited',
        road_condition: 'rough_terrain',
        current_facility_id: 'phc-kudligere',
        symptoms: ['Fever', 'Breathing difficulty', 'Extreme weakness'],
        vitals: {
          spo2: 88,
          heart_rate: 114,
          respiratory_rate: 28,
          systolic_bp: 155,
          diastolic_bp: 95,
          temperature: 102.2
        },
        comorbidities: ['COPD / Asthma', 'Hypertension'],
        onset_duration: '3 days',
        notes: 'Oxygen saturation falling rapidly. Needs immediate higher-tier referral.',
        phone: '+91 94480 54321',
        caregiver_name: 'Shankar (Son)',
        emergency_contact: '+91 98451 98765',
        abha_id: `91-4521-8890-${Math.floor(1000 + Math.random() * 9000)}`,
        assigned_asha: 'Lakshmi Bai (Organisation Kudligere Sector)'
      });
    } else if (presetType === 'maternal-crisis') {
      setFormData({
        id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        name: 'Sunita Devi',
        age: 26,
        gender: 'Female',
        location: 'Guddehalli Settlement, Holehonnur',
        sub_district: 'Bhadravathi',
        district: 'Shivamogga',
        state: 'Karnataka',
        connectivity: '2g_only',
        road_condition: 'unpaved',
        current_facility_id: 'phc-kudligere',
        symptoms: ['High headache', 'Dizziness', 'Maternal edema', 'Severe vomiting'],
        vitals: {
          spo2: 96,
          heart_rate: 104,
          respiratory_rate: 22,
          systolic_bp: 168,
          diastolic_bp: 108,
          temperature: 99.4
        },
        comorbidities: ['Pregnancy (3rd Trimester)', 'Hypertension'],
        onset_duration: '1 day',
        notes: 'Pre-eclampsia alert. Urgent tertiary obstetric intake required.',
        phone: '+91 99011 23456',
        caregiver_name: 'Raju (Husband)',
        emergency_contact: '+91 98860 34567',
        abha_id: `91-7712-3401-${Math.floor(1000 + Math.random() * 9000)}`,
        assigned_asha: 'Kavitha Devi (Organisation Sector 2)'
      });
    } else {
      setFormData({
        id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        name: 'Manjunatha Rao',
        age: 38,
        gender: 'Male',
        location: 'Holalur Rural Main, Shimoga',
        sub_district: 'Shivamogga Rural',
        district: 'Shivamogga',
        state: 'Karnataka',
        connectivity: 'moderate',
        road_condition: 'paved',
        current_facility_id: 'chc-bhadravathi',
        symptoms: ['Fever', 'Persistent cough', 'Extreme weakness'],
        vitals: {
          spo2: 97,
          heart_rate: 84,
          respiratory_rate: 18,
          systolic_bp: 122,
          diastolic_bp: 80,
          temperature: 100.8
        },
        comorbidities: [],
        onset_duration: '2 days',
        notes: 'Stable hemodynamics. Candidate for local primary outpatient treatment.',
        phone: '+91 94483 11223',
        caregiver_name: 'Sharada (Wife)',
        emergency_contact: '+91 98452 44556',
        abha_id: `91-1234-5678-${Math.floor(1000 + Math.random() * 9000)}`,
        assigned_asha: 'Meenakshi K. (Organisation Field Lead)'
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      alert('Please fill in patient name and village location');
      return;
    }

    const patientComplete: PatientProfile = {
      id: formData.id || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name,
      age: Number(formData.age) || 45,
      gender: formData.gender || 'Male',
      location: formData.location,
      sub_district: formData.sub_district || 'Bhadravathi',
      district: formData.district || 'Shivamogga',
      state: formData.state || 'Karnataka',
      connectivity: formData.connectivity || 'limited',
      road_condition: formData.road_condition || 'rough_terrain',
      current_facility_id: formData.current_facility_id || 'phc-kudligere',
      symptoms: formData.symptoms && formData.symptoms.length > 0 ? formData.symptoms : ['Fever'],
      vitals: formData.vitals as PatientVitals,
      comorbidities: formData.comorbidities || [],
      onset_duration: formData.onset_duration || '2 days',
      notes: formData.notes || '',
      phone: formData.phone || '+91 98000 00000',
      caregiver_name: formData.caregiver_name || '',
      emergency_contact: formData.emergency_contact || '',
      abha_id: formData.abha_id || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      registered_at: new Date().toISOString(),
      assigned_asha: formData.assigned_asha || 'Organisation-Appointed Community Worker'
    };

    setSubmitted(true);
    onRegisterSuccess(patientComplete);
  };

  const vitals = formData.vitals as PatientVitals;
  const isHypoxemic = vitals.spo2 < 90;
  const isTachypneic = vitals.respiratory_rate >= 26;
  const isHypertensive = vitals.systolic_bp >= 160;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Registration Title Banner */}
      <div className="glass-panel-glow rounded-2xl p-6 border border-teal-500/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                Community Worker & PHC Field Intake
              </span>
              <span className="text-xs text-slate-400">Ayushman Bharat (ABHA) Grid Integration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <UserPlus className="w-7 h-7 text-teal-400" />
              <span>Patient Bedside Registration</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Enroll a rural or underserved community member. Once submitted, the <strong>7-Agent Network</strong> will immediately predict access delays, perform clinical triage, evaluate facility capabilities, check oxygen/medicine stock, and coordinate care.
            </p>
          </div>

          {/* Preset Buttons for Quick Judge Testing */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>1-Click Test Scenarios:</span>
            </span>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => loadQuickPreset('emergency-respiratory')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-[11px] font-semibold text-left flex items-center justify-between transition-colors"
              >
                <span>Severe Respiratory (SpO2 88%)</span>
                <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-rose-900/80">EMERGENCY</span>
              </button>
              <button
                type="button"
                onClick={() => loadQuickPreset('maternal-crisis')}
                className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 text-[11px] font-semibold text-left flex items-center justify-between transition-colors"
              >
                <span>Maternal Crisis (BP 168/108)</span>
                <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-amber-900/80">HIGH PRIORITY</span>
              </button>
              <button
                type="button"
                onClick={() => loadQuickPreset('routine-fever')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-semibold text-left flex items-center justify-between transition-colors"
              >
                <span>Mild Febrile Outpatient</span>
                <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-emerald-900/80">MODERATE</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics & Identity */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>1. Demographics & ABHA Digital Health Identity</span>
            </h3>
            <span className="text-[11px] font-mono text-teal-400">ID: {formData.id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Legal Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rameshappa G."
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Age in Years *</label>
              <input
                type="number"
                value={formData.age || ''}
                onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
                required
                min={1}
                max={110}
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Gender *</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Mobile / Caregiver Phone</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Caregiver / Escort Name</label>
              <input
                type="text"
                value={formData.caregiver_name || ''}
                onChange={e => setFormData({ ...formData, caregiver_name: e.target.value })}
                placeholder="e.g. Shankar (Son)"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Emergency SOS Phone</label>
              <input
                type="text"
                value={formData.emergency_contact || ''}
                onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="+91 Emergency Contact"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>Ayushman Bharat Health Account (ABHA ID)</span>
                <span className="text-[10px] text-teal-400">National Health Stack</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={formData.abha_id || ''}
                  onChange={e => setFormData({ ...formData, abha_id: e.target.value })}
                  placeholder="91-XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 font-mono text-teal-300 focus:border-teal-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, abha_id: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` })}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs shrink-0 flex items-center gap-1"
                  title="Generate synthetic ABHA ID"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gen ABHA</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Rural Location & Access Geometry */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>2. Rural Geography & Physical Access Barriers</span>
            </h3>
            <span className="text-[11px] text-slate-400">Evaluated by Access Intelligence Agent</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Village / Gram Panchayat *</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Mallenahalli Gram Panchayat, Bhadravathi"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Taluka / Sub-district</label>
              <input
                type="text"
                value={formData.sub_district || ''}
                onChange={e => setFormData({ ...formData, sub_district: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">District / State</label>
              <input
                type="text"
                value={`${formData.district}, ${formData.state}`}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cellular Signal / Bandwidth</span>
              </label>
              <select
                value={formData.connectivity}
                onChange={e => setFormData({ ...formData, connectivity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
              >
                <option value="limited">Limited (Intermittent voice/SMS)</option>
                <option value="2g_only">2G Only (Text only, no teleconsult)</option>
                <option value="offline">Offline / Dead Zone (Local caching mode)</option>
                <option value="moderate">Moderate 3G/4G</option>
                <option value="high_speed">High Speed 4G/5G</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Road & Transit Terrain</span>
              </label>
              <select
                value={formData.road_condition}
                onChange={e => setFormData({ ...formData, road_condition: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
              >
                <option value="rough_terrain">Rough Terrain (+25 mins ambulance transit)</option>
                <option value="unpaved">Unpaved Dirt Track (+40 mins transit)</option>
                <option value="flooded">Flooded / Monsoon Stream Hazard</option>
                <option value="paved">Paved Tar Road (Smooth 108 transit)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Presenting Health Post</label>
              <select
                value={formData.current_facility_id}
                onChange={e => setFormData({ ...formData, current_facility_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
              >
                <option value="phc-kudligere">Kudligere PHC (Primary Health Centre)</option>
                <option value="chc-bhadravathi">Bhadravathi CHC (Community Health Centre)</option>
                <option value="sc-mallenahalli">Mallenahalli Health Sub-Centre</option>
                <option value="dh-shivamogga">McGann District Hospital, Shivamogga</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Assigned Community Worker (Appointed by Organisation)</label>
              <input
                type="text"
                value={formData.assigned_asha || ''}
                onChange={e => setFormData({ ...formData, assigned_asha: e.target.value })}
                placeholder="Organisation-Appointed Community Worker Name"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bedside Vitals Telemetry (Evaluated by Triage Agent) */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>3. Real-Time Bedside Clinical Vitals</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct telemetry from Organisation Community Worker field pulse oximeter and digital sphygmomanometer
              </p>
            </div>

            {(isHypoxemic || isTachypneic || isHypertensive) && (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Critical Red Flags Active</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* SpO2 */}
            <div className={`p-3 rounded-xl border ${isHypoxemic ? 'bg-rose-950/40 border-rose-500' : 'bg-slate-900/80 border-slate-700'} space-y-1`}>
              <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>SpO2 (%)</span>
                <span className="text-[10px] text-slate-500">&gt;95%</span>
              </label>
              <input
                type="number"
                value={vitals.spo2}
                onChange={e => updateVitals('spo2', Number(e.target.value))}
                min={50}
                max={100}
                className={`w-full text-2xl font-black font-mono px-2 py-1 rounded bg-black/40 border border-white/10 ${isHypoxemic ? 'text-rose-400' : 'text-emerald-400'}`}
                required
              />
              <span className="text-[10px] text-slate-400 block">{isHypoxemic ? 'Severe Hypoxemia' : 'Normal'}</span>
            </div>

            {/* Heart Rate */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Pulse (BPM)</span>
                <span className="text-[10px] text-slate-500">60-100</span>
              </label>
              <input
                type="number"
                value={vitals.heart_rate}
                onChange={e => updateVitals('heart_rate', Number(e.target.value))}
                min={30}
                max={220}
                className="w-full text-2xl font-black font-mono px-2 py-1 rounded bg-black/40 border border-white/10 text-white"
                required
              />
              <span className="text-[10px] text-slate-400 block">{vitals.heart_rate > 100 ? 'Tachycardia' : 'Regular'}</span>
            </div>

            {/* Respiratory Rate */}
            <div className={`p-3 rounded-xl border ${isTachypneic ? 'bg-rose-950/40 border-rose-500' : 'bg-slate-900/80 border-slate-700'} space-y-1`}>
              <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Resp Rate (/min)</span>
                <span className="text-[10px] text-slate-500">12-20</span>
              </label>
              <input
                type="number"
                value={vitals.respiratory_rate}
                onChange={e => updateVitals('respiratory_rate', Number(e.target.value))}
                min={8}
                max={60}
                className={`w-full text-2xl font-black font-mono px-2 py-1 rounded bg-black/40 border border-white/10 ${isTachypneic ? 'text-rose-400' : 'text-emerald-400'}`}
                required
              />
              <span className="text-[10px] text-slate-400 block">{isTachypneic ? 'Tachypnea Flag' : 'Normal'}</span>
            </div>

            {/* Systolic BP */}
            <div className={`p-3 rounded-xl border ${isHypertensive ? 'bg-amber-950/40 border-amber-500' : 'bg-slate-900/80 border-slate-700'} space-y-1`}>
              <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Systolic (mmHg)</span>
                <span className="text-[10px] text-slate-500">&lt;140</span>
              </label>
              <input
                type="number"
                value={vitals.systolic_bp}
                onChange={e => updateVitals('systolic_bp', Number(e.target.value))}
                min={50}
                max={260}
                className={`w-full text-2xl font-black font-mono px-2 py-1 rounded bg-black/40 border border-white/10 ${isHypertensive ? 'text-amber-400' : 'text-white'}`}
                required
              />
              <span className="text-[10px] text-slate-400 block">{isHypertensive ? 'Hypertensive' : 'Normal'}</span>
            </div>

            {/* Diastolic BP */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Diastolic (mmHg)</span>
                <span className="text-[10px] text-slate-500">&lt;90</span>
              </label>
              <input
                type="number"
                value={vitals.diastolic_bp}
                onChange={e => updateVitals('diastolic_bp', Number(e.target.value))}
                min={30}
                max={160}
                className="w-full text-2xl font-black font-mono px-2 py-1 rounded bg-black/40 border border-white/10 text-white"
                required
              />
              <span className="text-[10px] text-slate-400 block">Baseline</span>
            </div>

            {/* Temperature */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700 space-y-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Temp (°F)</span>
                <span className="text-[10px] text-slate-500">98.6°F</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={e => updateVitals('temperature', parseFloat(e.target.value))}
                min={94}
                max={108}
                className="w-full text-2xl font-black font-mono px-2 py-1 rounded bg-black/40 border border-white/10 text-orange-400"
                required
              />
              <span className="text-[10px] text-slate-400 block">{vitals.temperature >= 101 ? 'High Grade Fever' : 'Normal'}</span>
            </div>
          </div>
        </div>

        {/* Section 4: Presenting Symptoms & Comorbidities */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>4. Clinical Symptoms, Onset & Existing Conditions</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5 text-xs">
                Select Presenting Symptoms (Click to toggle):
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => {
                  const isSelected = (formData.symptoms || []).includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleToggleSymptom(symptom)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/60 shadow-sm shadow-teal-500/10'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {symptom}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom symptom input */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={customSymptom}
                onChange={e => setCustomSymptom(e.target.value)}
                placeholder="Type another symptom..."
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-teal-500 focus:outline-none w-64"
              />
              <button
                type="button"
                onClick={handleAddCustomSymptom}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                Add Symptom
              </button>
            </div>

            <div className="pt-2">
              <label className="block text-slate-400 font-medium mb-1.5 text-xs">
                Pre-existing Comorbidities:
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_COMORBIDITIES.map((cond) => {
                  const isSelected = (formData.comorbidities || []).includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => handleToggleComorbidity(cond)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Onset & Duration</label>
                <input
                  type="text"
                  value={formData.onset_duration || ''}
                  onChange={e => setFormData({ ...formData, onset_duration: e.target.value })}
                  placeholder="e.g. 2 days, sudden onset"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Frontline Worker Field Notes</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Escorted by caregiver on motorcycle. Weak breathing."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Registration automatically registers the case and triggers the 7-Agent AI Care Coordination loop.</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 fill-slate-950" />
            <span>Register & Start AI Care Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
