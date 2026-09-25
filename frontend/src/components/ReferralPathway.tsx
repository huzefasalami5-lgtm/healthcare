import React, { useState } from 'react';
import { 
  Ambulance, 
  MapPin, 
  Building2, 
  ArrowRight, 
  FileText, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  Clock, 
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import { ReferralAgentOutput, ReferralSlip } from '../types';

interface ReferralPathwayProps {
  referralData?: ReferralAgentOutput;
  patientName: string;
  isProcessing: boolean;
  onApproveReferral: (referralId: string, doctorName: string, notes?: string) => Promise<void>;
}

export const ReferralPathway: React.FC<ReferralPathwayProps> = ({
  referralData,
  patientName,
  isProcessing,
  onApproveReferral
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. S. K. Murthy (MO In-Charge)');
  const [doctorNotes, setDoctorNotes] = useState('Referral approved. Ambulance dispatched with B-type oxygen cylinder.');
  const [isSigned, setIsSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);

  if (isProcessing && !referralData) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/3"></div>
        <div className="h-32 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  const isReferralNeeded = referralData?.referral_required ?? true;
  const slip: ReferralSlip | null = referralData?.referral_slip || null;

  const handleSignOff = async () => {
    if (!slip) return;
    setIsApproving(true);
    try {
      await onApproveReferral(slip.referral_id, doctorName, doctorNotes);
      setIsSigned(true);
      setSignedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Sign-off error:', err);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Ambulance className="w-4 h-4 text-teal-400" />
            <span>Agent 6: Capability-Aware Referral Protocol & Digital Handover</span>
          </h3>
          <p className="text-xs text-slate-400">
            Algorithmic patient transfer routing with medical dispatch alerts and clinical verification
          </p>
        </div>

        {isReferralNeeded ? (
          <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>108 Emergency Transfer Initiated</span>
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Management Authorized</span>
          </span>
        )}
      </div>

      {/* Visual Referral Route Diagram */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Care Transit Corridor
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Node 1: Community Patient */}
          <div className="w-full md:w-1/4 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-center space-y-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-teal-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="font-bold text-white text-xs">{patientName}</div>
            <div className="text-[10px] text-slate-400">Rural Household / Sub-Centre</div>
          </div>

          <ArrowRight className="w-4 h-4 text-teal-400 rotate-90 md:rotate-0 shrink-0" />

          {/* Node 2: Origin Facility */}
          <div className="w-full md:w-1/4 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-center space-y-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="font-bold text-white text-xs truncate">
              {referralData?.referring_facility || 'Origin Primary Health Centre'}
            </div>
            <div className="text-[10px] text-amber-400 font-medium">Initial Bedside Intake</div>
          </div>

          <ArrowRight className="w-4 h-4 text-amber-400 rotate-90 md:rotate-0 shrink-0" />

          {/* Node 3: 108 Transfer Transit */}
          <div className="w-full md:w-1/4 p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-center space-y-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
              <Ambulance className="w-4 h-4" />
            </div>
            <div className="font-bold text-amber-300 text-xs">
              {referralData?.transport_mode.split('(')[0].trim() || '108 ALS Ambulance'}
            </div>
            <div className="text-[10px] text-slate-300">Continuous O2 & Telemetry</div>
          </div>

          <ArrowRight className="w-4 h-4 text-teal-400 rotate-90 md:rotate-0 shrink-0" />

          {/* Node 4: Destination Hospital */}
          <div className="w-full md:w-1/4 p-3 rounded-lg bg-teal-950/30 border border-teal-500/40 text-center space-y-1">
            <div className="w-8 h-8 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="font-bold text-teal-300 text-xs truncate">
              {referralData?.destination_facility || 'McGann District Teaching Hospital'}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">Specialist & ICU Intake</div>
          </div>
        </div>
      </div>

      {/* Digital Referral Slip Card */}
      {isReferralNeeded && slip && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-teal-800/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <FileText className="w-5 h-5 text-teal-400" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Official Inter-Facility Digital Referral Slip
                  </h4>
                  <span className="font-mono text-[11px] text-teal-300 font-semibold px-2 py-0.5 rounded bg-teal-950 border border-teal-800">
                    {slip.referral_id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ayushman Bharat Health Account (ABHA) Interoperability Standard
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-teal-400" />
                <span>{slip.qr_auth_token.slice(0, 10)}...</span>
              </span>
            </div>
          </div>

          {/* Clinical Justification & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Clinical Indication for Transfer:
              </div>
              <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                {slip.clinical_reason}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pre-Referral In-Transit Directives:
              </div>
              <ul className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-slate-300">
                {slip.provisional_pre_referral_care.map((item, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Doctor Clinical Verification Panel */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 text-xs">
                <Stethoscope className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-slate-200">Mandatory Human Clinical Verification:</span>
                {isSigned ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified by Medical Officer</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/40">
                    Awaiting Doctor Signature
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {isSigned ? (
                  <span>Verified by <strong>{doctorName}</strong> at {signedAt || 'Just now'}. Transport alert dispatched.</span>
                ) : (
                  <span>Registered Medical Officer (RMO) must review and approve before ambulance release.</span>
                )}
              </div>
            </div>

            {!isSigned ? (
              <button
                onClick={handleSignOff}
                disabled={isApproving}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isApproving ? 'Verifying...' : 'Sign & Authorize Transfer'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorized</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* When Referral Not Needed */}
      {!isReferralNeeded && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-emerald-200">Care Retained at Local Facility:</span>
            {' '}Patient's clinical severity does not warrant inter-facility transfer. Local PHC/CHC resources and doctor staffing are adequate for outpatient stabilization, avoiding unnecessary transport overhead and patient fatigue.
          </div>
        </div>
      )}
    </div>
  );
};
