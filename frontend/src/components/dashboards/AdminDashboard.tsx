import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Building2, 
  CreditCard, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Zap, 
  TrendingUp, 
  Users,
  RotateCw,
  X,
  Heart,
  Droplet
} from 'lucide-react';
import { UserProfile, CaseSummary } from '../../types/curareach';
import { 
  fetchAdminMetrics, 
  fetchAdminHospitals, 
  verifyHospitalApi, 
  fetchSubscriptions, 
  fetchInvoices, 
  fetchAgentExecutions, 
  fetchAuditLogs,
  getPublicNetworkInsightsApi,
  getLifeLinkPlansApi
} from '../../services/curareachApi';

interface AdminDashboardProps {
  currentUser: UserProfile;
  cases: CaseSummary[];
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  cases,
  onRefresh
}) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [agentExecutions, setAgentExecutions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [lifelinkInsights, setLifelinkInsights] = useState<any>(null);
  const [lifelinkPlans, setLifelinkPlans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HOSPITALS' | 'BILLING' | 'AGENTS' | 'AUDIT' | 'LIFELINK'>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(true);

  // Verification Modal
  const [verifyingHosp, setVerifyingHosp] = useState<any>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [m, h, s, inv, execs, logs, lInsights, lPlans] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminHospitals(),
        fetchSubscriptions(),
        fetchInvoices(),
        fetchAgentExecutions(),
        fetchAuditLogs(),
        getPublicNetworkInsightsApi().catch(() => null),
        getLifeLinkPlansApi().catch(() => [])
      ]);
      setMetrics(m);
      setHospitals(h);
      setSubscriptions(s);
      setInvoices(inv);
      setAgentExecutions(execs);
      setAuditLogs(logs);
      setLifelinkInsights(lInsights);
      setLifelinkPlans(lPlans);
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!verifyingHosp) return;
    try {
      await verifyHospitalApi(verifyingHosp.id, status, verificationNotes);
      setVerifyingHosp(null);
      setVerificationNotes('');
      alert(`Facility updated to ${status}.`);
      loadAdminData();
      onRefresh();
    } catch (err: any) {
      alert(`Error updating verification: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/25 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-purple-400">
              Platform Administration & Oversight
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-xs text-slate-400">Central Operations Command</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            CuraReach 360 Operations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hospital verification, multi-agent observability, SLA monitoring, and organization governance.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 self-start md:self-auto border border-slate-700"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block text-[11px]">Total Cases</span>
          <span className="text-xl font-black text-white mt-1 block">{metrics?.total_cases ?? 5}</span>
          <span className="text-[10px] text-teal-400">Active: {metrics?.active_cases ?? 4}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block text-[11px]">Emergency Alerts</span>
          <span className="text-xl font-black text-red-400 mt-1 block">{metrics?.emergency_cases ?? 1}</span>
          <span className="text-[10px] text-slate-500">112 Bypasses Logged</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block text-[11px]">Referrals Dispatched</span>
          <span className="text-xl font-black text-cyan-400 mt-1 block">{metrics?.total_referrals ?? 2}</span>
          <span className="text-[10px] text-emerald-400">{metrics?.referral_success_rate_pct ?? 100}% Accepted</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block text-[11px]">Clinician Overrides</span>
          <span className="text-xl font-black text-amber-400 mt-1 block">{metrics?.clinician_overrides ?? 0}</span>
          <span className="text-[10px] text-slate-500">Human-in-Loop</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block text-[11px]">Verified Hospitals</span>
          <span className="text-xl font-black text-white mt-1 block">{metrics?.verified_hospitals ?? 3}</span>
          <span className="text-[10px] text-amber-400">Pending: {metrics?.pending_hospital_verifications ?? 1}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-slate-400 block text-[11px]">Agent Invocations</span>
          <span className="text-xl font-black text-purple-400 mt-1 block">{metrics?.total_agent_executions ?? 12}</span>
          <span className="text-[10px] text-slate-500">4 Core Agents Grid</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        {[
          { key: 'OVERVIEW', label: 'Platform Summary' },
          { key: 'HOSPITALS', label: 'Hospital Verification (Scenario F)' },
          { key: 'LIFELINK', label: 'LifeLink Donors & Subscriptions' },
          { key: 'BILLING', label: 'Subscriptions & Demo Billing' },
          { key: 'AGENTS', label: 'Agent Execution Stream' },
          { key: 'AUDIT', label: 'Security & State Audit Logs' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === t.key
                ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Platform Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Four Cooperating Core Agents Status</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Agent 1: Clinical Intake Agent', role: 'Text normalization, deterministic red flags, provisional urgency', status: 'Active (Deterministic Mode)' },
                { name: 'Agent 2: Care Intelligence Agent', role: 'Tiered node matching, barrier accounting, explainable "WHY"', status: 'Active (Deterministic Mode)' },
                { name: 'Agent 3: Adaptive Referral Agent', role: 'Referral packaging, destination queues, rejection recovery', status: 'Active (Deterministic Mode)' },
                { name: 'Agent 4: Care Rescue Agent', role: 'Follow-up tasks, missed appointment intervention, care milestones', status: 'Active (Deterministic Mode)' }
              ].map((ag, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">{ag.name}</span>
                    <span className="text-[11px] text-slate-400">{ag.role}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                    {ag.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm">Explicit 18-State Machine Compliance</h3>
            <p className="text-slate-400 leading-relaxed">
              Every case transition enforces role authorization, prerequisite evidence, and writes an immutable audit record to the SQLite database. Frontend bypass is strictly prevented by server-side validation.
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-teal-300 space-y-1">
              <div>&bull; DRAFT &rarr; INTAKE_SUBMITTED</div>
              <div>&bull; INTAKE_SUBMITTED &rarr; EMERGENCY_GUIDANCE_SHOWN (112 Alert)</div>
              <div>&bull; INTAKE_SUBMITTED &rarr; AWAITING_CLINICIAN_REVIEW</div>
              <div>&bull; CLINICIAN_REVIEWED &rarr; REFERRAL_APPROVED &rarr; REFERRAL_SENT</div>
              <div>&bull; REFERRAL_DECLINED &rarr; ALTERNATIVE_REVIEW_REQUIRED (Recovery Gate)</div>
              <div>&bull; APPOINTMENT_MISSED &rarr; FOLLOW_UP_PENDING (Care Rescue)</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Hospital Verification (Scenario F) */}
      {activeTab === 'HOSPITALS' && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Participating Hospitals & Verification Queue</h3>
            <span className="text-slate-400">Only verified facilities receive patient referrals</span>
          </div>

          <div className="space-y-3">
            {hospitals.map(h => (
              <div
                key={h.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{h.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      h.verification_status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                      h.verification_status === 'SUBMITTED' ? 'bg-amber-950 text-amber-300 border border-amber-800/40' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {h.verification_status}
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px] block mt-0.5">
                    {h.facility_type} &bull; {h.district} &bull; Contact: {h.contact_phone}
                  </span>
                  {h.verification_notes && (
                    <span className="text-slate-500 text-[10px] block mt-1">
                      Notes: {h.verification_notes}
                    </span>
                  )}
                </div>

                {h.verification_status === 'SUBMITTED' && (
                  <button
                    onClick={() => {
                      setVerifyingHosp(h);
                      setVerificationNotes('Infrastructure and medical licenses verified for referral reception.');
                    }}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow"
                  >
                    Review & Verify Facility (Scenario F)
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Subscriptions & Billing (Section 11) */}
      {activeTab === 'BILLING' && (
        <div className="space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-white text-sm mb-3">Subscription Plans (Sample Pricing Model)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscriptions?.plans?.map((p: any) => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                  <span className="font-mono text-purple-400 font-bold">{p.tier}</span>
                  <h4 className="font-bold text-white text-sm">{p.plan_name}</h4>
                  <div className="text-lg font-black text-teal-400">
                    ₹{p.monthly_fee_inr?.toLocaleString()}<span className="text-xs text-slate-500 font-normal"> /month</span>
                  </div>
                  <span className="text-slate-400 block text-[11px]">Up to {p.max_monthly_referrals} referrals/month</span>
                  <span className="text-[10px] text-slate-500 block italic">Clearly labeled synthetic demonstration pricing.</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm mb-3">Demo Invoices</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase">
                  <tr>
                    <th className="p-3">Invoice Number</th>
                    <th className="p-3">Hospital</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payment Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-300">{inv.invoice_number}</td>
                      <td className="p-3 text-white font-medium">{inv.hospital_name}</td>
                      <td className="p-3 font-bold text-teal-400">₹{inv.amount_inr?.toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{inv.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Agent Execution Stream */}
      {activeTab === 'AGENTS' && (
        <div className="space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Auditable Multi-Agent Invocations</h3>
          <div className="space-y-2">
            {agentExecutions.map(e => (
              <div key={e.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">{e.agent_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-[10px]">{e.duration_ms} ms</span>
                    <span className="bg-slate-800 text-teal-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {e.is_deterministic ? 'Deterministic Heuristic' : 'LLM Live'}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400">
                  <strong>Inputs:</strong> {e.input_summary}
                </div>
                <div className="text-[11px] text-teal-200">
                  <strong>Outputs:</strong> {e.output_summary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: System Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Security & Consent Event Audit Stream</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-500 text-[10px]">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-purple-300">{l.action}</td>
                    <td className="p-3 font-mono text-slate-400">{l.resource_type}</td>
                    <td className="p-3 text-slate-300">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: LifeLink Donors & SaaS Subscriptions */}
      {activeTab === 'LIFELINK' && (
        <div className="space-y-6 text-xs">
          {/* Statutory Compliance Banner */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <Shield className="w-5 h-5 text-rose-400" />
              <span>National Healthcare Compliance: CuraReach LifeLink Governance</span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              Operating under the Transplantation of Human Organs and Tissues Act (THOTA 1994, amended 2011) and the National Blood Transfusion Council regulations. Voluntary donations are strictly non-commercial and altruistic. Contact details are never exposed without explicit donor verification and consent.
            </p>
          </div>

          {/* Network Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 block text-[11px]">Voluntary Blood Donors</span>
              <span className="text-2xl font-black text-rose-400 mt-1 block">
                {lifelinkInsights?.voluntary_blood_donors_registered ?? 8}
              </span>
              <span className="text-[10px] text-emerald-400">100% Consent Verified</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 block text-[11px]">Hospital Broadcasts</span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block">
                {lifelinkInsights?.hospital_broadcast_requests ?? 1}
              </span>
              <span className="text-[10px] text-slate-500">Live district matching</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 block text-[11px]">Authorized Introductions</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {lifelinkInsights?.authorized_introductions ?? 1}
              </span>
              <span className="text-[10px] text-slate-500">Explicit consent granted</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-slate-400 block text-[11px]">NOTTO Referrals</span>
              <span className="text-2xl font-black text-indigo-400 mt-1 block">
                {lifelinkInsights?.educational_registry_referrals ?? 4}
              </span>
              <span className="text-[10px] text-slate-500">Official registry guidance</span>
            </div>
          </div>

          {/* LifeLink B2B Software Subscription Tiers Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">LifeLink Institutional Software Subscription Tiers</h3>
                <p className="text-xs text-slate-400">
                  Voluntary B2B tooling licenses for multi-channel messaging and donor coordination.
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                SaaS Revenue Model
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lifelinkPlans.map((plan) => (
                <div key={plan.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-sm">{plan.plan_name}</strong>
                    <span className="font-mono text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-900">
                      {plan.plan_code}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    ₹{plan.monthly_fee_inr} <span className="text-xs text-slate-400 font-normal">/ mo</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Annual: ₹{plan.annual_fee_inr} / yr (Save 17%)
                  </div>
                  <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">{plan.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verify Hospital Modal */}
      {verifyingHosp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Verify Hospital Facility (Scenario F)</h3>
            <p className="text-slate-400">
              Reviewing applicant: <strong className="text-white">{verifyingHosp.name}</strong> ({verifyingHosp.facility_type})
            </p>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Verification Audit Notes</label>
              <textarea
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingHosp(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerify('REJECTED')}
                className="px-3.5 py-1.5 bg-red-950 text-red-300 rounded-lg border border-red-800/40 font-semibold"
              >
                Reject Application
              </button>
              <button
                type="button"
                onClick={() => handleVerify('VERIFIED')}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg"
              >
                Verify & Enable Referrals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
