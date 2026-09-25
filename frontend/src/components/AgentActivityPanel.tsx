import React, { useState } from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Building2, 
  Boxes, 
  Compass, 
  Ambulance, 
  CalendarClock,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Code2,
  HelpCircle,
  Zap,
  Activity
} from 'lucide-react';
import { CoordinatedCarePathway, AgentOutputBase } from '../types';

interface AgentActivityPanelProps {
  pathway?: CoordinatedCarePathway | null;
  currentStep: number;
  selectedAgentKey?: string;
  onSelectAgent?: (key: string) => void;
}

export const AgentActivityPanel: React.FC<AgentActivityPanelProps> = ({
  pathway,
  currentStep,
  selectedAgentKey,
  onSelectAgent
}) => {
  const [expandedJson, setExpandedJson] = useState<Record<string, boolean>>({});

  const toggleJson = (key: string) => {
    setExpandedJson(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const agentDefinitions = [
    {
      key: 'triage',
      stepNum: 1,
      title: 'Triage Agent',
      subtitle: 'Clinical Urgency Stratification & Vital Decompensation Flagging',
      icon: Stethoscope,
      data: pathway?.agents?.triage,
      inputDescription: 'Patient vital telemetry (SpO2, RR, HR, BP, Temp) + reported acute symptoms + comorbidities'
    },
    {
      key: 'access_intel',
      stepNum: 2,
      title: 'Access Intelligence Agent',
      subtitle: 'Geographic Terrain, Network Signal & Transit Delay Modeling',
      icon: MapPin,
      data: pathway?.agents?.access_intel,
      inputDescription: 'Village geography + road transit difficulty + cellular signal bandwidth + baseline PHC distance'
    },
    {
      key: 'facility_matcher',
      stepNum: 3,
      title: 'Facility Agent',
      subtitle: 'Tiered Healthcare Node Matching (Sub-Centre → PHC → CHC → District Hospital)',
      icon: Building2,
      data: pathway?.agents?.facility_matcher,
      inputDescription: 'Candidate facility registry + bed availability + doctor shifts + ICU capacity + distance geometry'
    },
    {
      key: 'resource_verifier',
      stepNum: 4,
      title: 'Resource Agent',
      subtitle: 'Inventory Verification (Medical Oxygen, Emergency Drugs & Diagnostics)',
      icon: Boxes,
      data: pathway?.agents?.resource_verifier,
      inputDescription: 'Real-time stockout ledger at origin PHC vs verified destination capabilities'
    },
    {
      key: 'coordinator',
      stepNum: 5,
      title: 'Coordinator Agent',
      subtitle: 'Multi-Agent Synthesis & Coordinated Care Pathway Formulation',
      icon: Compass,
      data: pathway?.agents?.coordinator,
      inputDescription: 'Aggregated outputs from Triage, Access, Facility, and Resource agents'
    },
    {
      key: 'referral_coordinator',
      stepNum: 6,
      title: 'Referral Agent',
      subtitle: 'Capability-Aware Referral Protocol & Digital Handover Slip Creation',
      icon: Ambulance,
      data: pathway?.agents?.referral_coordinator,
      inputDescription: 'Origin facility gap analysis + destination acceptance protocol + 108 ALS dispatch'
    },
    {
      key: 'care_continuity',
      stepNum: 7,
      title: 'Care Continuity Agent',
      subtitle: 'Longitudinal Care Timeline, Organisation Community Worker Domiciliary Checklist & Telephony Alerts',
      icon: CalendarClock,
      data: pathway?.agents?.care_continuity,
      inputDescription: 'Inpatient milestones + discharge planning + organisation community health worker network assignment'
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>Agent Activity & Explainability Log</span>
          </h3>
          <p className="text-xs text-slate-400">
            Transparent breakdown of inputs, clinical reasoning, structured outputs, and timestamps
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {pathway ? 'All 7 Agents Executed' : 'Awaiting Workflow Execution'}
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-3">
        {agentDefinitions.map((agent) => {
          const Icon = agent.icon;
          const isCompleted = (currentStep > agent.stepNum || currentStep >= 8) && agent.data;
          const isRunning = currentStep === agent.stepNum;
          const isPending = !isCompleted && !isRunning;
          const isJsonOpen = !!expandedJson[agent.key];

          return (
            <div
              key={agent.key}
              id={`agent-card-${agent.key}`}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isRunning
                  ? 'bg-slate-900/90 border-teal-500/80 ring-1 ring-teal-500/40'
                  : isCompleted
                    ? 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900/80 opacity-60'
              }`}
            >
              {/* Agent Bar */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/50">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isRunning 
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 animate-pulse'
                      : isCompleted 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800/60 text-slate-500 border-slate-700/60'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        Agent 0{agent.stepNum}:
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {agent.title}
                      </h4>
                      {agent.data?.status === 'escalated' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Escalated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {agent.subtitle}
                    </p>
                  </div>
                </div>

                {/* Status & Latency Pills */}
                <div className="flex items-center space-x-2 self-start md:self-auto text-xs">
                  {isCompleted && (
                    <>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-teal-400" />
                        <span>{agent.data?.execution_time_ms || 42}ms</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Completed</span>
                      </span>
                    </>
                  )}
                  {isRunning && (
                    <span className="px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-medium animate-pulse flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                      <span>Processing Payload...</span>
                    </span>
                  )}
                  {isPending && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-500 font-medium">
                      Waiting in Sequence
                    </span>
                  )}

                  {isCompleted && (
                    <button
                      onClick={() => toggleJson(agent.key)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-1"
                      title="Toggle Structured JSON Payload"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Agent Details when Completed */}
              {isCompleted && agent.data && (
                <div className="p-4 border-t border-slate-800/80 space-y-3 text-xs bg-slate-950/40">
                  {/* Inputs and Output Summary Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Input Payload Summary */}
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/70 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Validated Input Context
                      </div>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {agent.inputDescription}
                      </p>
                    </div>

                    {/* Key Factors Produced */}
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/70 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Key Output Signals
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {agent.data.key_factors?.map((factor: string, i: number) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 rounded bg-teal-950/60 border border-teal-800/50 text-teal-300 font-mono text-[11px]"
                          >
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Explainability & Clinical Reasoning */}
                  <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-800/30 text-xs space-y-1">
                    <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                      <span>Clinical Reasoning & Explainability (Why this action):</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {agent.data.reasoning}
                    </p>
                  </div>

                  {/* Collapsible Structured JSON */}
                  {isJsonOpen && (
                    <div className="mt-2 p-3 rounded-lg bg-black/80 border border-slate-800 font-mono text-[11px] text-teal-300 overflow-x-auto">
                      <div className="text-[10px] text-slate-400 uppercase mb-1">
                        Structured Output JSON ({agent.data.agent_name})
                      </div>
                      <pre>{JSON.stringify(agent.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
