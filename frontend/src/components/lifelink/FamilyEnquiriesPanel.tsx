import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Shield, 
  PhoneCall, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Building2,
  FileText,
  MapPin,
  Calendar,
  Lock
} from 'lucide-react';
import { 
  getMyDeceasedEnquiriesApi, 
  withdrawDeceasedEnquiryApi, 
  DeceasedDonationEnquiry 
} from '../../services/curareachApi';

interface FamilyEnquiriesPanelProps {
  onOpenNewEnquiry?: () => void;
}

export const FamilyEnquiriesPanel: React.FC<FamilyEnquiriesPanelProps> = ({ onOpenNewEnquiry }) => {
  const [enquiries, setEnquiries] = useState<DeceasedDonationEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getMyDeceasedEnquiriesApi();
      setEnquiries(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load family enquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (enquiryId: string, ref: string) => {
    if (!window.confirm(`Are you sure you want to withdraw deceased donation enquiry ${ref}?`)) return;
    try {
      setWithdrawingId(enquiryId);
      await withdrawDeceasedEnquiryApi(enquiryId);
      setSuccessMsg(`Enquiry ${ref} has been withdrawn.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadEnquiries();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to withdraw enquiry');
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status: string, orgName?: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Submitted — Awaiting Triage
          </span>
        );
      case 'AWAITING_AUTHORIZED_COORDINATOR':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Routed to {orgName || 'District Hospital'} — Awaiting Coordinator Review
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            Acknowledged by Authorized Coordinator
          </span>
        );
      case 'REFERRED_TO_AUTHORIZED_HOSPITAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            Treating Hospital Coordinator Coordinating
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            Case Closed
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Withdrawn by Family
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/60 border border-amber-800/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Family-Assisted Post-Mortem Enquiries
            </span>
            <span className="text-xs text-slate-400">&bull; Confidential Administrative Tracking</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>My Family Deceased Donation Enquiries</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Track administrative status, coordinator assignments, and emergency NOTTO guidance. This view strictly provides administrative updates and never displays clinical eligibility, organ matching, or recipient data.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadEnquiries}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh enquiries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onOpenNewEnquiry && (
            <button
              onClick={onOpenNewEnquiry}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950 transition-all flex items-center gap-1.5"
            >
              <span>+ New Deceased Enquiry</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Official NOTTO Banner Strip */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Official NOTTO 24x7 Helpline: <strong className="text-white font-mono">1800-11-4770</strong> (Toll-Free, Government of India)
          </span>
        </div>
        <a
          href="https://notto.abdm.gov.in/"
          target="_blank"
          rel="noreferrer"
          className="text-teal-400 hover:underline flex items-center gap-1 font-medium shrink-0"
        >
          <span>National Organ &amp; Tissue Transplant Organisation</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Enquiry Cards List */}
      {loading && enquiries.length === 0 ? (
        <div className="text-center p-12 text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
          <p>Loading family donation enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
          <Users className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Deceased Donation Enquiries</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You have not submitted any deceased donation enquiries. If your relative has recently passed away in a hospital and you wish to explore donation, you may initiate an enquiry.
          </p>
          {onOpenNewEnquiry && (
            <button
              onClick={onOpenNewEnquiry}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
            >
              Initiate Family Enquiry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((enq) => {
            const isWithdrawn = enq.enquiry_status === 'WITHDRAWN';
            const isClosed = enq.enquiry_status === 'CLOSED';
            const canWithdraw = !isWithdrawn && !isClosed;

            return (
              <div 
                key={enq.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 shadow-lg hover:border-slate-700 transition-colors"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-teal-300">
                        {enq.enquiry_reference}
                      </span>
                      <span className="text-xs text-slate-500">&bull;</span>
                      <span className="text-xs text-slate-400">
                        Submitted by: <strong className="text-slate-200">{enq.family_member_name}</strong> ({enq.relationship_to_deceased})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(enq.created_at).toLocaleString()}</span>
                      {enq.preferred_language && (
                        <>
                          <span>&bull;</span>
                          <span>Lang: {enq.preferred_language}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(enq.enquiry_status, enq.assigned_organization_name)}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">Deceased Relative</span>
                    <span className="font-semibold text-slate-200">
                      {enq.deceased_name || 'Name Withheld (Confidential)'}
                    </span>
                    {enq.deceased_age && (
                      <span className="text-slate-400 block">Age: {enq.deceased_age} years</span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 block">Location / Hospital</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {enq.hospital_name || enq.current_location}
                    </span>
                    <span className="text-slate-400 block">{enq.current_location}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Pledge / Coordinator Status</span>
                    <span className="font-semibold text-slate-200">
                      {enq.already_speaking_with_coordinator ? 'In Contact with Treating Hospital' : 'Awaiting Coordinator Routing'}
                    </span>
                    {enq.official_pledge_reference && (
                      <span className="text-amber-400 font-mono block text-[11px]">
                        Ref: {enq.official_pledge_reference}
                      </span>
                    )}
                  </div>
                </div>

                {/* What Happens Next Guidance Box */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>What Happens Next</span>
                  </div>
                  <p className="leading-relaxed text-slate-400">
                    An authorized hospital transplant coordinator will contact you at your provided phone number ({enq.family_member_contact}) to discuss clinical feasibility, explain the legal consent process under THOTA Form 8, and coordinate with the treating hospital.
                  </p>
                  {enq.coordinator_notes && (
                    <div className="pt-2 border-t border-slate-800/80 text-cyan-300">
                      <strong>Coordinator Note:</strong> {enq.coordinator_notes}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Information shared only with verified hospital coordinators</span>
                  </div>

                  {canWithdraw && (
                    <button
                      onClick={() => handleWithdraw(enq.id, enq.enquiry_reference)}
                      disabled={withdrawingId === enq.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition-colors disabled:opacity-50"
                    >
                      {withdrawingId === enq.id ? 'Withdrawing...' : 'Withdraw Enquiry'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
