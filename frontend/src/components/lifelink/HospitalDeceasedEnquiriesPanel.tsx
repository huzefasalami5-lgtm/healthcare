import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Building2, 
  PhoneCall, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X, 
  FileText, 
  MapPin, 
  Calendar,
  Lock
} from 'lucide-react';
import { 
  getHospitalDeceasedEnquiriesApi, 
  updateDeceasedEnquiryStatusApi, 
  DeceasedDonationEnquiry 
} from '../../services/curareachApi';

interface HospitalDeceasedEnquiriesPanelProps {
  hospitalProfile: any;
}

export const HospitalDeceasedEnquiriesPanel: React.FC<HospitalDeceasedEnquiriesPanelProps> = ({
  hospitalProfile
}) => {
  const [enquiries, setEnquiries] = useState<DeceasedDonationEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Status Action Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState<DeceasedDonationEnquiry | null>(null);
  const [actionType, setActionType] = useState<'ACKNOWLEDGE' | 'REFER' | 'CLOSE' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const isVerified = hospitalProfile?.verification_status === 'VERIFIED';

  useEffect(() => {
    if (isVerified) {
      loadEnquiries();
    } else {
      setLoading(false);
    }
  }, [hospitalProfile?.id, isVerified]);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getHospitalDeceasedEnquiriesApi(hospitalProfile?.id);
      setEnquiries(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch deceased donation enquiries.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (enquiry: DeceasedDonationEnquiry, type: 'ACKNOWLEDGE' | 'REFER' | 'CLOSE') => {
    setSelectedEnquiry(enquiry);
    setActionType(type);
    if (type === 'ACKNOWLEDGE') {
      setActionNotes('Coordinator reviewed enquiry and initiated contact with family.');
    } else if (type === 'REFER') {
      setActionNotes(`Treating hospital transplant coordinator assigned at ${enquiry.hospital_name || hospitalProfile?.name || 'facility'}.`);
    } else {
      setActionNotes('');
    }
  };

  const handleExecuteStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !actionType) return;

    let nextStatus = 'ACKNOWLEDGED';
    if (actionType === 'REFER') nextStatus = 'REFERRED_TO_AUTHORIZED_HOSPITAL';
    if (actionType === 'CLOSE') nextStatus = 'CLOSED';

    try {
      setSubmittingAction(true);
      await updateDeceasedEnquiryStatusApi(selectedEnquiry.id, {
        new_status: nextStatus,
        coordinator_notes: actionNotes.trim() || undefined,
        hospital_id: hospitalProfile?.id
      });
      setSuccessMsg(`Enquiry ${selectedEnquiry.enquiry_reference} updated to ${nextStatus}.`);
      setSelectedEnquiry(null);
      setActionType(null);
      setActionNotes('');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadEnquiries();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update enquiry status.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            SUBMITTED
          </span>
        );
      case 'AWAITING_AUTHORIZED_COORDINATOR':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> AWAITING COORDINATOR
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-cyan-400" /> ACKNOWLEDGED
          </span>
        );
      case 'REFERRED_TO_AUTHORIZED_HOSPITAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-emerald-400" /> HOSPITAL COORDINATING
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            CLOSED
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            WITHDRAWN
          </span>
        );
      default:
        return <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  if (!isVerified) {
    return (
      <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-6 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-white">
          Hospital Coordinator Verification Required
        </h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
          In strict accordance with the Transplantation of Human Organs and Tissues Act (THOTA 1994 / 2011), only verified hospital transplant coordinators may view or manage deceased donation enquiries. Your facility status is currently <span className="text-amber-300 font-mono font-bold">{hospitalProfile?.verification_status || 'PENDING'}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Authorized Deceased Donation Enquiries ({enquiries.length})</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Facility
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Post-mortem enquiries initiated by families in {hospitalProfile?.district || 'this district'}. Authorized coordinators can review, acknowledge, and assign treating hospital teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEnquiries}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Refresh enquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <a
            href="https://notto.abdm.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold flex items-center gap-1.5 border border-teal-500/30 transition-colors"
          >
            <span>NOTTO Guidance</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Enquiries Table / Cards */}
      {loading && enquiries.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          <span>Loading assigned deceased donation enquiries...</span>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-1">
          <p className="font-semibold text-slate-300">No Pending Deceased Donation Enquiries</p>
          <p>Enquiries routed to {hospitalProfile?.district || 'this hospital'} will appear here for coordinator review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {enquiries.map((enq) => {
            const isClosed = enq.enquiry_status === 'CLOSED';
            const isWithdrawn = enq.enquiry_status === 'WITHDRAWN';
            const canAct = !isClosed && !isWithdrawn;

            return (
              <div
                key={enq.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
              >
                {/* Top Row: Reference, Family Contact & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-teal-300 font-bold text-xs sm:text-sm">
                        {enq.enquiry_reference}
                      </span>
                      <span>&bull;</span>
                      <span className="text-xs text-slate-300 font-medium">
                        {enq.family_member_name} ({enq.relationship_to_deceased})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <PhoneCall className="w-3 h-3 text-emerald-400" />
                      <strong className="text-emerald-300 font-mono">{enq.family_member_contact}</strong>
                      <span>&bull;</span>
                      <span>Lang: {enq.preferred_language}</span>
                      <span>&bull;</span>
                      <span>Recd: {new Date(enq.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(enq.enquiry_status)}
                  </div>
                </div>

                {/* Middle Row: Deceased Relative & Facility Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-900/90 p-3 rounded-lg text-xs border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Deceased Relative</span>
                    <strong className="text-slate-200">
                      {enq.deceased_name || 'Name Withheld'}
                    </strong>
                    {enq.deceased_age && (
                      <span className="text-slate-400 block text-[11px]">Age: {enq.deceased_age} yrs</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Facility &amp; Location</span>
                    <span className="text-slate-200 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {enq.hospital_name || enq.current_location}
                    </span>
                    <span className="text-slate-400 block text-[11px]">{enq.current_location}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Pledge &amp; Communication</span>
                    <span className="text-slate-200 block">
                      {enq.already_speaking_with_coordinator ? 'Speaking with Treating Team' : 'Initial Enquiry'}
                    </span>
                    {enq.official_pledge_reference && (
                      <span className="text-amber-400 font-mono text-[11px] block">
                        Pledge: {enq.official_pledge_reference}
                      </span>
                    )}
                  </div>
                </div>

                {/* Coordinator Notes if present */}
                {enq.coordinator_notes && (
                  <div className="text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-cyan-300">
                    <strong className="text-slate-400">Coordinator Notes:</strong> {enq.coordinator_notes}
                  </div>
                )}

                {/* Action Buttons for Authorized Coordinator */}
                {canAct && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                    {enq.enquiry_status !== 'ACKNOWLEDGED' && enq.enquiry_status !== 'REFERRED_TO_AUTHORIZED_HOSPITAL' && (
                      <button
                        onClick={() => handleOpenActionModal(enq, 'ACKNOWLEDGE')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge Enquiry</span>
                      </button>
                    )}

                    {enq.enquiry_status !== 'REFERRED_TO_AUTHORIZED_HOSPITAL' && (
                      <button
                        onClick={() => handleOpenActionModal(enq, 'REFER')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition-colors flex items-center gap-1"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Record Treating Hospital Referral</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenActionModal(enq, 'CLOSE')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close Enquiry</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {selectedEnquiry && actionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                {actionType === 'ACKNOWLEDGE' && 'Acknowledge Deceased Donation Enquiry'}
                {actionType === 'REFER' && 'Record Treating Hospital Referral'}
                {actionType === 'CLOSE' && 'Close Deceased Donation Enquiry'}
              </h4>
              <button
                onClick={() => { setSelectedEnquiry(null); setActionType(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div>Ref: <strong className="text-teal-300 font-mono">{selectedEnquiry.enquiry_reference}</strong></div>
              <div>Family Contact: <span className="text-white">{selectedEnquiry.family_member_name} ({selectedEnquiry.family_member_contact})</span></div>
              <div>Hospital / Location: <span className="text-slate-300">{selectedEnquiry.hospital_name || selectedEnquiry.current_location}</span></div>
            </div>

            <form onSubmit={handleExecuteStatusUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Coordinator Action Notes / Outcome <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={
                    actionType === 'CLOSE'
                      ? 'Please specify outcome reason (e.g. legal consent completed under Form 8, medical contraindication, family chose not to proceed)...'
                      : 'Add administrative notes...'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setSelectedEnquiry(null); setActionType(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !actionNotes.trim()}
                  className={`px-4 py-2 text-white text-xs rounded-xl font-bold transition-all disabled:opacity-50 ${
                    actionType === 'CLOSE' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                >
                  {submittingAction ? 'Updating...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
