import React from 'react';
import { 
  Award, 
  Building2, 
  Ambulance, 
  MapPin, 
  Boxes, 
  CalendarClock, 
  ShieldAlert, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { CoordinatedCarePathway } from '../types';

interface CoordinatorPathwaySummaryProps {
  pathway: CoordinatedCarePathway;
}

export const CoordinatorPathwaySummary: React.FC<CoordinatorPathwaySummaryProps> = ({ pathway }) => {
  const isEmergencyOrHigh = pathway.triage_priority === 'EMERGENCY' || pathway.triage_priority === 'HIGH';

  return (
    <div className="glass-panel-glow rounded-2xl p-6 border border-teal-500/40 shadow-2xl relative overflow-hidden space-y-5">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-teal-500/20 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 font-bold border border-teal-800 uppercase tracking-widest">
                Agent 5: Coordinator Output
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synchronized Pathway</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              CARE PATHWAY READY
            </h2>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>7 Specialized Agents Cooperated</span>
        </div>
      </div>

      {/* Key Coordinated Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
        {/* Priority */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Triage Priority
          </div>
          <div className={`text-lg font-black font-mono tracking-tight ${
            pathway.triage_priority === 'EMERGENCY' ? 'text-rose-400 animate-pulse' :
            pathway.triage_priority === 'HIGH' ? 'text-amber-400' :
            pathway.triage_priority === 'MODERATE' ? 'text-cyan-400' : 'text-emerald-400'
          }`}>
            {pathway.triage_priority}
          </div>
        </div>

        {/* Recommended Facility */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3 h-3 text-teal-400" />
            <span>Recommended Node</span>
          </div>
          <div className="text-sm font-bold text-teal-300 truncate" title={pathway.recommended_facility}>
            {pathway.recommended_facility}
          </div>
        </div>

        {/* Referral Status */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Ambulance className="w-3 h-3 text-amber-400" />
            <span>Referral</span>
          </div>
          <div className={`text-sm font-bold font-mono ${pathway.referral_required ? 'text-amber-400' : 'text-emerald-400'}`}>
            {pathway.referral_required ? 'REQUIRED' : 'NOT REQUIRED'}
          </div>
        </div>

        {/* Access Risk */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            <span>Access Risk</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-200">
            {pathway.access_risk}
          </div>
        </div>

        {/* Resource Status */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Boxes className="w-3 h-3 text-cyan-400" />
            <span>Resources</span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-200">
            {pathway.resource_status}
          </div>
        </div>
      </div>

      {/* Why This Pathway Selected (Explainability) */}
      {pathway.agents.coordinator?.why_pathway_selected && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-900/50 space-y-2 relative z-10">
          <div className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-400" />
            <span>Synthesized Care Pathway Title: {pathway.agents.coordinator.coordinated_pathway_title}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {pathway.agents.coordinator.why_pathway_selected}
          </p>
          {pathway.agents.coordinator.contingency_plan && (
            <div className="pt-2 border-t border-white/5 text-[11px] text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span><strong>Contingency Directive:</strong> {pathway.agents.coordinator.contingency_plan}</span>
            </div>
          )}
        </div>
      )}

      {/* Mandatory Safety & Coordination Stamp */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-300 relative z-10">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Human Verification:</strong> REQUIRED before clinical or transfer execution.
          </span>
        </div>
        <div className="text-slate-400 text-[11px] font-medium">
          “CuraReach AgentX coordinated this pathway using 7 specialized AI agents.”
        </div>
      </div>
    </div>
  );
};
