import React from 'react';
import { 
  Boxes, 
  Pill, 
  FlaskConical, 
  UserCheck, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Wind,
  ShieldCheck
} from 'lucide-react';
import { ResourceAgentOutput } from '../types';

interface ResourceAvailabilityProps {
  resourceData?: ResourceAgentOutput;
  isProcessing: boolean;
}

export const ResourceAvailability: React.FC<ResourceAvailabilityProps> = ({
  resourceData,
  isProcessing
}) => {
  if (isProcessing && !resourceData) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/3"></div>
        <div className="h-28 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  const medsStatus = resourceData?.medicines_status || 'Available';
  const diagStatus = resourceData?.diagnostics_status || 'Available';
  const specStatus = resourceData?.specialist_status || 'Available';
  const eqptStatus = resourceData?.equipment_status || 'Operational';

  const getStatusBadge = (status: string) => {
    if (status === 'Available' || status === 'Operational') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>{status}</span>
        </span>
      );
    }
    if (status === 'Partial' || status === 'Degraded' || status === 'On-Call') {
      return (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>{status}</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center gap-1">
        <XCircle className="w-3 h-3 text-rose-400" />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-teal-400" />
            <span>Agent 4: Supply & Clinical Resource Verification</span>
          </h3>
          <p className="text-xs text-slate-400">
            Real-time stock audit across drugs, laboratory assays, specialists, and medical oxygen
          </p>
        </div>

        <div className="flex items-center gap-2">
          {resourceData?.critical_resources_available ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Facility Fully Provisioned</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Critical Resource Gaps Detected</span>
            </span>
          )}
        </div>
      </div>

      {/* 4 Pillars Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Medicines */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
              <Pill className="w-4 h-4 text-teal-400" />
              <span>Essential Medicines</span>
            </div>
            {getStatusBadge(medsStatus)}
          </div>
          <div className="text-[11px] text-slate-400">
            Broad-spectrum IV antibiotics, bronchodilators & emergency vasopressors
          </div>
        </div>

        {/* Diagnostics */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
              <FlaskConical className="w-4 h-4 text-cyan-400" />
              <span>Diagnostics</span>
            </div>
            {getStatusBadge(diagStatus)}
          </div>
          <div className="text-[11px] text-slate-400">
            Emergency ABG blood gas, digital chest radiograph & cardiac markers
          </div>
        </div>

        {/* Specialist Doctors */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span>Specialist Doctors</span>
            </div>
            {getStatusBadge(specStatus)}
          </div>
          <div className="text-[11px] text-slate-400">
            Physician, Pulmonologist & Intensivist on emergency duty roster
          </div>
        </div>

        {/* Equipment & Oxygen */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
              <Wind className="w-4 h-4 text-blue-400" />
              <span>Oxygen & Equipment</span>
            </div>
            {getStatusBadge(eqptStatus)}
          </div>
          <div className="text-[11px] text-slate-400">
            Continuous manifold supply, high-flow nasal cannula & multi-para monitors
          </div>
        </div>
      </div>

      {/* Available vs Deficit Items Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Available verified items */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Ready at Recommended Facility:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(resourceData?.available_items || [
              'Continuous Medical Oxygen Manifold',
              'Digital Chest X-Ray',
              'ABG Blood Gas Analyzer',
              'IV Ceftriaxone & Hydrocortisone'
            ]).map((item, i) => (
              <span key={i} className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 text-xs font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Deficit / Stockout items triggering referral */}
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Origin Health Centre Bottlenecks (Deficits):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(resourceData?.missing_items?.length ? resourceData.missing_items : [
              'Oxygen Concentrator Filter Defective at Local PHC',
              'Specialist Pulmonologist Unavailable at PHC',
              'Emergency Arterial Blood Gas Unavailable'
            ]).map((item, i) => (
              <span key={i} className="px-2.5 py-1 rounded bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Contingency Transit Advice */}
      {resourceData?.stockout_contingency && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-teal-300 mr-1">Resource Transport Contingency Protocol:</span>
            <span>{resourceData.stockout_contingency}</span>
          </div>
        </div>
      )}
    </div>
  );
};
