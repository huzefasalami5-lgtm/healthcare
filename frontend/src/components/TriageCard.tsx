import React from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  ArrowUpRight,
  Stethoscope,
  Info
} from 'lucide-react';
import { TriageAgentOutput } from '../types';

interface TriageCardProps {
  triageData?: TriageAgentOutput;
  isProcessing: boolean;
}

export const TriageCard: React.FC<TriageCardProps> = ({ triageData, isProcessing }) => {
  if (isProcessing && !triageData) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/3"></div>
        <div className="h-20 bg-slate-800/60 rounded-xl"></div>
        <div className="h-12 bg-slate-800/40 rounded-lg"></div>
      </div>
    );
  }

  const priority = triageData?.priority || 'MODERATE';
  const isEmergency = priority === 'EMERGENCY';
  const isHigh = priority === 'HIGH';
  const isModerate = priority === 'MODERATE';
  const isLow = priority === 'LOW';

  // Urgency styling configurations
  const config = {
    EMERGENCY: {
      bg: 'from-rose-950/90 via-red-950/70 to-slate-950/90',
      border: 'border-red-500/60',
      text: 'text-red-400',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
      glow: 'shadow-red-950/50 shadow-2xl',
      icon: AlertTriangle,
      label: 'EMERGENCY ESCALATION',
      subtext: 'Critical decompensation risk — immediate life support & transfer indicated'
    },
    HIGH: {
      bg: 'from-amber-950/80 via-orange-950/60 to-slate-950/90',
      border: 'border-amber-500/60',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      glow: 'shadow-amber-950/40 shadow-xl',
      icon: ShieldAlert,
      label: 'HIGH PRIORITY ESCALATION',
      subtext: 'Urgent hospital referral & specialist clinical intervention required'
    },
    MODERATE: {
      bg: 'from-blue-950/70 via-cyan-950/50 to-slate-950/90',
      border: 'border-cyan-500/50',
      text: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      glow: 'shadow-cyan-950/30 shadow-lg',
      icon: Activity,
      label: 'MODERATE PRIORITY',
      subtext: 'Subacute clinical presentation — manageable with CHC observation'
    },
    LOW: {
      bg: 'from-emerald-950/70 via-teal-950/50 to-slate-950/90',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      glow: 'shadow-emerald-950/30 shadow-lg',
      icon: ShieldCheck,
      label: 'LOW PRIORITY',
      subtext: 'Hemodynamically stable — suitable for primary outpatient & organisation community worker home care'
    }
  }[priority];

  const IconComponent = config.icon;

  return (
    <div className={`rounded-2xl border ${config.border} bg-gradient-to-br ${config.bg} ${config.glow} p-6 space-y-4 backdrop-blur-xl relative overflow-hidden transition-all duration-300`}>
      {/* Top Card Badge & Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-teal-400">
            <Stethoscope className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Agent 1: Triage Stratification
            </h3>
            <p className="text-[11px] text-slate-400">
              Automated Severity Scoring & Vital-Sign Escalation Filter
            </p>
          </div>
        </div>

        {triageData?.escalation_needed && (
          <span className="animate-pulse flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Escalation Required</span>
          </span>
        )}
      </div>

      {/* Main Big Visual Indicator */}
      <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-white/10">
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-2xl bg-black/40 border ${config.border} flex items-center justify-center shrink-0`}>
            <IconComponent className={`w-10 h-10 ${config.text}`} />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-400">
              Triage Urgency Tier
            </div>
            <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${config.text}`}>
              {priority}
            </div>
            <div className="text-xs text-slate-300 mt-1 max-w-md">
              {config.subtext}
            </div>
          </div>
        </div>

        {/* 4-Tier Visual Scale Bar */}
        <div className="flex sm:flex-col gap-1 sm:gap-1.5 w-full sm:w-32 text-[10px] font-mono font-bold">
          <div className={`py-1 px-2 rounded text-center transition-all ${isLow ? 'bg-emerald-500 text-slate-950 scale-105 shadow-md font-extrabold' : 'bg-slate-900/60 text-slate-500'}`}>
            1. LOW
          </div>
          <div className={`py-1 px-2 rounded text-center transition-all ${isModerate ? 'bg-cyan-500 text-slate-950 scale-105 shadow-md font-extrabold' : 'bg-slate-900/60 text-slate-500'}`}>
            2. MODERATE
          </div>
          <div className={`py-1 px-2 rounded text-center transition-all ${isHigh ? 'bg-amber-500 text-slate-950 scale-105 shadow-md font-extrabold' : 'bg-slate-900/60 text-slate-500'}`}>
            3. HIGH
          </div>
          <div className={`py-1 px-2 rounded text-center transition-all ${isEmergency ? 'bg-rose-500 text-white scale-105 shadow-md font-extrabold animate-pulse' : 'bg-slate-900/60 text-slate-500'}`}>
            4. EMERGENCY
          </div>
        </div>
      </div>

      {/* Vital & Symptom Flags Detected */}
      {triageData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Key Vital Flags */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Vital Sign Red Flags Detected:</span>
            </div>
            {triageData.vital_flags.length > 0 ? (
              <ul className="space-y-1 text-xs text-slate-200">
                {triageData.vital_flags.map((flag, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-rose-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>No life-threatening vital deviations identified</span>
              </div>
            )}
          </div>

          {/* Clinical Advisory Recommendation */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400" />
              <span>Clinical Advisory Directive:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {triageData.clinical_advisory || 'Routine primary observation recommended.'}
            </p>
          </div>
        </div>
      )}

      {/* Mandatory Safety Notice */}
      <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div className="leading-snug">
          <span className="font-semibold text-amber-200">AI Safety Verification Notice:</span>
          {' '}AI-generated decision support. Not a medical diagnosis. Human clinical verification by a registered medical officer is strictly required before pharmacological or surgical intervention.
        </div>
      </div>
    </div>
  );
};
