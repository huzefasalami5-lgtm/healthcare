import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Wifi, 
  WifiOff, 
  Truck, 
  Building2, 
  Heart, 
  Thermometer, 
  Activity, 
  Wind, 
  Gauge, 
  AlertCircle,
  SlidersHorizontal,
  Stethoscope,
  LineChart as LineChartIcon,
  FileText
} from 'lucide-react';
import { PatientProfile } from '../types';
import { VitalsTelemetryChart } from './VitalsTelemetryChart';

interface PatientOverviewProps {
  patient: PatientProfile;
  presets: PatientProfile[];
  onSelectPreset: (preset: PatientProfile) => void;
  onOpenCustomModal: () => void;
  isProcessing: boolean;
}

export const PatientOverview: React.FC<PatientOverviewProps> = ({
  patient,
  presets,
  onSelectPreset,
  onOpenCustomModal,
  isProcessing
}) => {
  const vitals = patient.vitals;

  // Visual helper for abnormal vitals
  const isSpo2Critical = vitals.spo2 < 90;
  const isSpo2Warning = vitals.spo2 >= 90 && vitals.spo2 < 94;

  const isRRCritical = vitals.respiratory_rate >= 28;
  const isRRWarning = vitals.respiratory_rate >= 22 && vitals.respiratory_rate < 28;

  const isBPCritical = vitals.systolic_bp >= 160 || vitals.diastolic_bp >= 105;
  const isBPWarning = vitals.systolic_bp >= 140 || vitals.diastolic_bp >= 90;

  const isTempHigh = vitals.temperature >= 101.5;
  const [showChart, setShowChart] = useState(true);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Preset Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-400" />
            <span>Target Patient Profile & Clinical Vitals</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a synthetic rural patient case or configure custom clinical inputs
          </p>
        </div>

        {/* Preset Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {presets.map((preset) => {
            const isSelected = preset.id === patient.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                disabled={isProcessing}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-sm shadow-teal-500/10'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>{preset.name.split(' ')[0]} ({preset.age}y)</span>
              </button>
            );
          })}

          <button
            onClick={onOpenCustomModal}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 flex items-center gap-1.5 cursor-pointer transition-all duration-150"
            title="Configure custom patient parameters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
            <span>Customize</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('section-medical-reports');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 flex items-center gap-1.5 cursor-pointer transition-all duration-150 shadow-sm"
            title="View Patient Medical & Diagnostic Reports"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lab & Reports</span>
          </button>
        </div>
      </div>

      {/* Patient Demographic & Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
        {/* Identity & Basic Info */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Patient Details</div>
          <div className="text-base font-bold text-white flex items-center gap-1.5">
            {patient.name}
            <span className="text-xs font-normal text-slate-400">({patient.age}y, {patient.gender})</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px] pt-1">
            ID: {patient.id}
          </div>
        </div>

        {/* Location & Terrain */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Community Location</span>
          </div>
          <div className="text-slate-200 font-semibold truncate" title={patient.location}>
            {patient.location}
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Truck className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="capitalize">{patient.road_condition.replace('_', ' ')}</span>
            <span>•</span>
            <span>{patient.district}</span>
          </div>
        </div>

        {/* Connectivity & Access Signal */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            {patient.connectivity === 'offline' ? (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>Network & Facility</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase ${
              patient.connectivity === 'offline' || patient.connectivity === '2g_only' || patient.connectivity === 'limited'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
            }`}>
              {patient.connectivity.replace('_', ' ')}
            </span>
            <span className="text-slate-400 text-[11px]">Bandwidth</span>
          </div>
          <div className="text-slate-400 text-[11px] flex items-center gap-1 pt-0.5">
            <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">Node: {patient.current_facility_id}</span>
          </div>
        </div>

        {/* Presenting Clinical Summary */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
            <span>Onset & Comorbidities</span>
          </div>
          <div className="text-slate-200 text-xs">
            Onset: <span className="text-amber-300 font-medium">{patient.onset_duration}</span>
          </div>
          <div className="text-slate-400 text-[11px] truncate">
            {patient.comorbidities.length > 0 ? patient.comorbidities.join(', ') : 'None documented'}
          </div>
        </div>
      </div>

      {/* Vitals Grid with Clinical Threshold Highlighting */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Bedside Clinical Vitals</span>
            <span className="text-slate-500 font-normal">Real-time Telemetry / Organisation Field Kit</span>
          </div>
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-700/80 text-xs font-medium cursor-pointer transition-colors"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>{showChart ? 'Hide Telemetry Trends' : 'View Telemetry Trends'}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* SpO2 */}
          <div className={`p-3 rounded-xl border transition-all ${
            isSpo2Critical 
              ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/50' 
              : isSpo2Warning 
                ? 'bg-amber-950/30 border-amber-500/50' 
                : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>SpO2</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">&gt;95%</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                isSpo2Critical ? 'text-rose-400 animate-pulse' : isSpo2Warning ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {vitals.spo2}
              </span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isSpo2Critical ? 'Severe Hypoxemia' : isSpo2Warning ? 'Borderline' : 'Normal'}
            </div>
          </div>

          {/* Respiratory Rate */}
          <div className={`p-3 rounded-xl border transition-all ${
            isRRCritical 
              ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/50' 
              : isRRWarning 
                ? 'bg-amber-950/30 border-amber-500/50' 
                : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>Resp Rate</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">12-20</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                isRRCritical ? 'text-rose-400 animate-pulse' : isRRWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {vitals.respiratory_rate}
              </span>
              <span className="text-xs text-slate-400">/min</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isRRCritical ? 'Tachypneic Red Flag' : isRRWarning ? 'Elevated' : 'Normal'}
            </div>
          </div>

          {/* Blood Pressure */}
          <div className={`p-3 rounded-xl border transition-all ${
            isBPCritical 
              ? 'bg-rose-950/40 border-rose-600/60 shadow-lg shadow-rose-950/50' 
              : isBPWarning 
                ? 'bg-amber-950/30 border-amber-500/50' 
                : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                <span>Blood Pressure</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">120/80</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-xl font-black font-mono tracking-tight ${
                isBPCritical ? 'text-rose-400' : isBPWarning ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {vitals.systolic_bp}/{vitals.diastolic_bp}
              </span>
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isBPCritical ? 'Severe Hypertension' : isBPWarning ? 'Pre-HTN' : 'Normotensive'}
            </div>
          </div>

          {/* Heart Rate */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Pulse Rate</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">60-100</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                vitals.heart_rate > 105 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {vitals.heart_rate}
              </span>
              <span className="text-xs text-slate-400">BPM</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {vitals.heart_rate > 105 ? 'Tachycardia' : 'Regular rhythm'}
            </div>
          </div>

          {/* Temperature */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span>Temperature</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">98.6°F</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                isTempHigh ? 'text-orange-400' : 'text-emerald-400'
              }`}>
                {vitals.temperature}
              </span>
              <span className="text-xs text-slate-400">°F</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {isTempHigh ? 'Febrile spike' : 'Afebrile / Low grade'}
            </div>
          </div>
        </div>

        {/* Recharts Vitals Telemetry Area */}
        {showChart && (
          <div className="pt-2">
            <VitalsTelemetryChart vitals={vitals} patientName={patient.name} />
          </div>
        )}
      </div>

      {/* Reported Symptoms Tags */}
      <div className="flex items-center flex-wrap gap-1.5 pt-1">
        <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-teal-400" />
          <span>Presenting Symptoms:</span>
        </span>
        {patient.symptoms.map((symptom, idx) => (
          <span 
            key={idx}
            className="px-2.5 py-1 rounded-md bg-slate-800/90 text-slate-200 border border-slate-700 text-xs font-medium"
          >
            {symptom}
          </span>
        ))}
      </div>

      {/* Clinical Notes Context */}
      {patient.notes && (
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300 mr-1">Field Intake Context:</span>
            <span>{patient.notes}</span>
          </div>
        </div>
      )}
    </div>
  );
};
