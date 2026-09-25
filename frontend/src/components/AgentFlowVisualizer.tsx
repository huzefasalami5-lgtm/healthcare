import React from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Building2, 
  Boxes, 
  Compass, 
  Ambulance, 
  CalendarClock,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu
} from 'lucide-react';
import { CoordinatedCarePathway } from '../types';

interface AgentFlowVisualizerProps {
  currentStep: number; // 0 (idle), 1 to 7 (agent active), 8 (complete)
  pathway?: CoordinatedCarePathway | null;
  onSelectAgent?: (agentKey: string) => void;
  selectedAgentKey?: string;
}

export const AgentFlowVisualizer: React.FC<AgentFlowVisualizerProps> = ({
  currentStep,
  pathway,
  onSelectAgent,
  selectedAgentKey,
}) => {
  const agents = [
    {
      key: 'triage',
      stepNum: 1,
      name: 'Triage Agent',
      shortName: 'Triage',
      icon: Stethoscope,
      role: 'Urgency Stratification',
      outputSummary: pathway?.agents?.triage ? `Priority: ${pathway.agents.triage.priority}` : 'Pending vitals...',
      color: 'teal'
    },
    {
      key: 'access_intel',
      stepNum: 2,
      name: 'Access Intelligence',
      shortName: 'Access Intel',
      icon: MapPin,
      role: 'Terrain & Connectivity',
      outputSummary: pathway?.agents?.access_intel ? `Risk: ${pathway.agents.access_intel.access_risk}` : 'Pending route...',
      color: 'cyan'
    },
    {
      key: 'facility_matcher',
      stepNum: 3,
      name: 'Facility Agent',
      shortName: 'Facility Matcher',
      icon: Building2,
      role: 'Capacity-Aware Matching',
      outputSummary: pathway?.agents?.facility_matcher ? pathway.agents.facility_matcher.selected_facility_name.split(' ')[0] + ' (' + pathway.agents.facility_matcher.selected_facility_tier.split(' ')[0] + ')' : 'Pending inventory...',
      color: 'blue'
    },
    {
      key: 'resource_verifier',
      stepNum: 4,
      name: 'Resource Agent',
      shortName: 'Resource Agent',
      icon: Boxes,
      role: 'Drugs, Diag & Oxygen',
      outputSummary: pathway?.agents?.resource_verifier ? `Meds: ${pathway.agents.resource_verifier.medicines_status} | O2: ${pathway.agents.resource_verifier.equipment_status}` : 'Verifying supply...',
      color: 'emerald'
    },
    {
      key: 'coordinator',
      stepNum: 5,
      name: 'Coordinator Agent',
      shortName: 'Coordinator',
      icon: Compass,
      role: 'Unified Care Synthesis',
      outputSummary: pathway?.agents?.coordinator ? pathway.agents.coordinator.action_priority : 'Synthesizing...',
      color: 'indigo'
    },
    {
      key: 'referral_coordinator',
      stepNum: 6,
      name: 'Referral Agent',
      shortName: 'Referral Agent',
      icon: Ambulance,
      role: '108 Protocol & Slip',
      outputSummary: pathway?.agents?.referral_coordinator ? (pathway.agents.referral_coordinator.referral_required ? 'Referral Slip Issued' : 'Local Care') : 'Evaluating need...',
      color: 'amber'
    },
    {
      key: 'care_continuity',
      stepNum: 7,
      name: 'Care Continuity',
      shortName: 'Care Continuity',
      icon: CalendarClock,
      role: 'Longitudinal ASHA Grid',
      outputSummary: pathway?.agents?.care_continuity ? `${pathway.agents.care_continuity.timeline_tasks.length} Milestones Scheduled` : 'Pending plan...',
      color: 'purple'
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>Agent Intelligence Pipeline & Inter-Agent Data Bus</span>
          </h3>
          <p className="text-xs text-slate-400">
            Autonomous specialized agents passing validated structured payloads in sequence
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Workflow State:</span>
          {currentStep === 0 && (
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-mono">
              Ready to Execute
            </span>
          )}
          {currentStep >= 1 && currentStep <= 7 && (
            <span className="px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-mono font-bold animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>Agent {currentStep} of 7 Active</span>
            </span>
          )}
          {currentStep >= 8 && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>7 Agents Coordinated</span>
            </span>
          )}
        </div>
      </div>

      {/* 7-Node Horizontal Workflow Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
        {agents.map((agent, index) => {
          const Icon = agent.icon;
          const isDone = currentStep > agent.stepNum || currentStep >= 8;
          const isActive = currentStep === agent.stepNum;
          const isPending = currentStep < agent.stepNum && currentStep !== 0;
          const isSelected = selectedAgentKey === agent.key;

          return (
            <div
              key={agent.key}
              onClick={() => onSelectAgent?.(agent.key)}
              className={`relative rounded-xl p-3 border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between min-h-[135px] ${
                isActive
                  ? 'bg-teal-950/60 border-teal-500 shadow-lg shadow-teal-500/20 scale-[1.03] ring-1 ring-teal-400'
                  : isDone
                    ? isSelected
                      ? 'bg-slate-800/90 border-teal-400 ring-1 ring-teal-400/50 shadow-md'
                      : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/60'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              {/* Agent Step Number & Status Icon */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'bg-teal-400 text-slate-950'
                    : isDone
                      ? 'bg-slate-800 text-slate-300'
                      : 'bg-slate-900 text-slate-600'
                }`}>
                  0{agent.stepNum}
                </span>

                {isDone && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {isActive && (
                  <Clock className="w-4 h-4 text-teal-400 animate-spin shrink-0" />
                )}
                {!isDone && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                )}
              </div>

              {/* Agent Title & Icon */}
              <div className="my-1.5">
                <div className="flex items-center gap-1.5 text-slate-300 mb-0.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-300 animate-bounce' : isDone ? 'text-teal-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold truncate">{agent.shortName}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate leading-tight">
                  {agent.role}
                </div>
              </div>

              {/* Structured Output Pill */}
              <div className="pt-1 border-t border-white/5">
                <div className={`text-[10px] font-mono px-2 py-1 rounded truncate ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-200 border border-teal-500/30'
                    : isDone
                      ? 'bg-slate-950/70 text-slate-300 border border-slate-800'
                      : 'bg-black/30 text-slate-600'
                }`}>
                  {agent.outputSummary}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
