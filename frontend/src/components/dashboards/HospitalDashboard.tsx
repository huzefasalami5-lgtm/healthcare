import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bed, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  AlertCircle, 
  RotateCw, 
  Send, 
  X, 
  FileText, 
  UserCheck,
  CreditCard,
  Receipt,
  Upload,
  Plus,
  Check,
  Download,
  Heart,
  Droplet,
  Shield,
  Bell
} from 'lucide-react';
import { UserProfile, CaseSummary } from '../../types/curareach';
import { 
  fetchHospitalProfile, 
  updateHospitalCapacityApi, 
  fetchHospitalReferrals, 
  respondToReferralApi, 
  confirmAppointmentApi,
  reportEncounterStatusApi,
  fetchAllTreatmentTransactions,
  createTreatmentInvoiceApi,
  uploadMedicalDocumentApi,
  createHospitalDonorRequestApi,
  getHospitalDonorRequestsApi,
  getAuthorizedIntroductionsApi,
  closeHospitalDonorRequestApi,
  getLifeLinkPlansApi,
  activateDemoSubscriptionApi
} from '../../services/curareachApi';


interface HospitalDashboardProps {
  currentUser: UserProfile;
  cases: CaseSummary[];
  onRefresh: () => void;
}

export const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  currentUser,
  cases,
  onRefresh
}) => {
  const [profile, setProfile] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [treatmentInvoices, setTreatmentInvoices] = useState<any[]>([]);
  const [activeHospitalTab, setActiveHospitalTab] = useState<'REFERRALS' | 'TREATMENT_BILLING' | 'LIFELINK_DONORS'>('REFERRALS');
  const [isLoading, setIsLoading] = useState(true);

  // LifeLink Voluntary Donors State
  const [donorRequests, setDonorRequests] = useState<any[]>([]);
  const [introductions, setIntroductions] = useState<any[]>([]);
  const [isDonorReqModalOpen, setIsDonorReqModalOpen] = useState(false);
  const [reqBloodGroup, setReqBloodGroup] = useState('O-');
  const [reqUnits, setReqUnits] = useState(2);
  const [reqHours, setReqHours] = useState(24);
  const [reqDesc, setReqDesc] = useState('Urgent blood requirement for emergency admission.');
  const [isSubmittingDonorReq, setIsSubmittingDonorReq] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subPlans, setSubPlans] = useState<any[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState('PROFESSIONAL');
  const [isActivatingSub, setIsActivatingSub] = useState(false);

  // Treatment Invoicing State
  const [invoicingRef, setInvoicingRef] = useState<any>(null);
  const [invType, setInvType] = useState('CONSULTATION');
  const [invDesc, setInvDesc] = useState('');
  const [invAmount, setInvAmount] = useState(300);
  const [invDiscount, setInvDiscount] = useState(0);
  const [invMethod, setInvMethod] = useState('UPI');
  const [invPaid, setInvPaid] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Document Upload State
  const [uploadingDocRef, setUploadingDocRef] = useState<any>(null);
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadDocType, setUploadDocType] = useState('LAB_REPORT');
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [uploadDocDesc, setUploadDocDesc] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Capacity Modal State
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [totalBeds, setTotalBeds] = useState(150);
  const [availableBeds, setAvailableBeds] = useState(20);
  const [hasIcu, setHasIcu] = useState(true);
  const [hasOxygen, setHasOxygen] = useState(true);

  // Accept Referral Modal
  const [acceptingRef, setAcceptingRef] = useState<any>(null);
  const [apptTime, setApptTime] = useState('Tomorrow, 10:30 AM');
  const [doctorName, setDoctorName] = useState('Duty Specialist');

  // Decline Referral Modal
  const [decliningRef, setDecliningRef] = useState<any>(null);
  const [declineReasonCode, setDeclineReasonCode] = useState('NO_SPECIALIST_ON_DUTY');
  const [declineNotes, setDeclineNotes] = useState('');

  // Log Encounter Modal
  const [encounterAppt, setEncounterAppt] = useState<any>(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const [dischargeInstructions, setDischargeInstructions] = useState('');

  const loadHospitalData = async () => {
    setIsLoading(true);
    try {
      const [profRes, refsRes, txRes, donorReqs, intros, plans] = await Promise.all([
        fetchHospitalProfile(),
        fetchHospitalReferrals(),
        fetchAllTreatmentTransactions().catch(() => []),
        getHospitalDonorRequestsApi().catch(() => []),
        getAuthorizedIntroductionsApi().catch(() => []),
        getLifeLinkPlansApi().catch(() => [])
      ]);
      setProfile(profRes);
      setTotalBeds(profRes.total_beds);
      setAvailableBeds(profRes.available_beds);
      setHasIcu(profRes.has_icu);
      setHasOxygen(profRes.has_oxygen_manifold);
      setReferrals(refsRes);
      setTreatmentInvoices(txRes);
      setDonorRequests(donorReqs || []);
      setIntroductions(intros || []);
      setSubPlans(plans || []);
    } catch (err: any) {
      console.error('Failed to load hospital data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTreatmentInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoicingRef) return;
    setIsCreatingInvoice(true);
    try {
      await createTreatmentInvoiceApi({
        patient_id: invoicingRef.patient_id,
        case_id: invoicingRef.case_id,
        appointment_id: invoicingRef.appointment?.id || invoicingRef.id,
        transaction_type: invType,
        item_description: invDesc || `${invType} services at ${profile?.name || 'Hospital'}`,
        amount_inr: Number(invAmount),
        discount_inr: Number(invDiscount),
        payment_status: invPaid ? 'PAID' : 'UNPAID',
        payment_method: invMethod
      });
      alert('Treatment invoice generated successfully.');
      setInvoicingRef(null);
      setInvDesc('');
      loadHospitalData();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingDocRef || !uploadDocFile || !uploadDocTitle.trim()) {
      alert('Document title and file are required.');
      return;
    }
    setIsUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', uploadDocFile);
    formData.append('title', uploadDocTitle);
    formData.append('record_type', uploadDocType);
    formData.append('facility_name', profile?.name || 'Hospital');
    formData.append('description', uploadDocDesc);
    if (uploadingDocRef.case_id) formData.append('case_id', uploadingDocRef.case_id);
    if (uploadingDocRef.appointment?.id) formData.append('appointment_id', uploadingDocRef.appointment.id);

    try {
      await uploadMedicalDocumentApi(uploadingDocRef.patient_id, formData);
      alert('Diagnostic report uploaded and attached to patient medical records!');
      setUploadingDocRef(null);
      setUploadDocTitle('');
      setUploadDocFile(null);
      setUploadDocDesc('');
      loadHospitalData();
    } catch (err: any) {
      alert(err.message || 'Failed to upload diagnostic report.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleCreateDonorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setIsSubmittingDonorReq(true);
    try {
      await createHospitalDonorRequestApi({
        hospital_id: profile.id,
        donation_category: 'BLOOD',
        requested_blood_group: reqBloodGroup,
        units_needed: reqUnits,
        city: profile.city || 'Shivamogga',
        district: profile.district || 'Shivamogga',
        requested_until_hours: reqHours,
        description: reqDesc
      });
      alert(`Emergency blood broadcast submitted! Voluntary donors in ${profile.district || 'the district'} are being notified.`);
      setIsDonorReqModalOpen(false);
      loadHospitalData();
    } catch (err: any) {
      alert(`Failed to broadcast: ${err.message}`);
    } finally {
      setIsSubmittingDonorReq(false);
    }
  };

  const handleCloseDonorRequest = async (reqId: string) => {
    if (!window.confirm('Close this emergency donor broadcast request?')) return;
    try {
      await closeHospitalDonorRequestApi(reqId);
      alert('Broadcast request closed.');
      loadHospitalData();
    } catch (err: any) {
      alert(`Failed to close request: ${err.message}`);
    }
  };

  const handleActivateDemoSub = async (planCode: string) => {
    if (!profile?.id) return;
    setIsActivatingSub(true);
    try {
      await activateDemoSubscriptionApi(profile.id, planCode);
      alert(`LifeLink Software Subscription successfully updated to ${planCode} plan!`);
      setIsSubModalOpen(false);
      loadHospitalData();
    } catch (err: any) {
      alert(`Failed to activate subscription: ${err.message}`);
    } finally {
      setIsActivatingSub(false);
    }
  };

  useEffect(() => {
    loadHospitalData();
  }, []);

  const handleUpdateCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateHospitalCapacityApi({
        total_beds: totalBeds,
        available_beds: availableBeds,
        has_icu: hasIcu,
        has_oxygen_manifold: hasOxygen
      });
      setIsCapacityModalOpen(false);
      alert('Operational capacity updated successfully.');
      loadHospitalData();
    } catch (err: any) {
      alert(`Error updating capacity: ${err.message}`);
    }
  };

  const handleAcceptReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingRef) return;
    try {
      // 1. Accept referral
      await respondToReferralApi(acceptingRef.id, {
        response_type: 'ACCEPT',
        proposed_appointment_time: apptTime,
        response_notes: `Accepted. Slot confirmed with ${doctorName}`
      });

      // 2. Confirm appointment
      await confirmAppointmentApi(acceptingRef.id, {
        scheduled_at: apptTime,
        doctor_name: doctorName,
        department_name: acceptingRef.target_department
      });

      setAcceptingRef(null);
      alert('Referral accepted and appointment confirmed. Care rescue reminders generated.');
      loadHospitalData();
      onRefresh();
    } catch (err: any) {
      alert(`Error accepting referral: ${err.message}`);
    }
  };

  const handleDeclineReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decliningRef) return;
    try {
      await respondToReferralApi(decliningRef.id, {
        response_type: 'DECLINE',
        reason_code: declineReasonCode,
        response_notes: declineNotes || 'Department at maximum capacity.'
      });
      setDecliningRef(null);
      setDeclineNotes('');
      alert('Referral decline recorded. Adaptive Recovery pipeline activated for alternative facility.');
      loadHospitalData();
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleLogEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encounterAppt) return;
    try {
      await reportEncounterStatusApi(encounterAppt.id, {
        arrival_status: 'ARRIVED',
        consultation_notes: consultationNotes || 'Clinical consultation documented.',
        discharge_instructions: dischargeInstructions || 'Prescribed oral medication and 48-hr recovery.'
      });
      setEncounterAppt(null);
      setConsultationNotes('');
      setDischargeInstructions('');
      alert('Patient visit documented. Follow-up monitoring tasks created.');
      loadHospitalData();
      onRefresh();
    } catch (err: any) {
      alert(`Error logging encounter: ${err.message}`);
    }
  };

  const handleReportNoShow = async (apptId: string) => {
    if (!window.confirm('Mark this patient as No-Show / Missed? This triggers the Care Rescue protocol.')) return;
    try {
      await reportEncounterStatusApi(apptId, {
        arrival_status: 'NOT_ARRIVED',
        consultation_notes: 'Patient did not arrive for scheduled appointment.'
      });
      alert('Patient marked as missed. Rescue task assigned to community worker.');
      loadHospitalData();
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hospital Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/20 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">
              Hospital Operations & Admissions
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-xs text-slate-400">{profile?.facility_type || 'Civil District Hospital'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            {profile?.name || 'Hospital Operations'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
            <span>District: <strong>{profile?.district || 'Shivamogga'}</strong></span>
            <span>Operating Hours: <strong>{profile?.operating_hours || '24/7 Emergency & OPD'}</strong></span>
            <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded text-[11px] border border-emerald-800/40">
              Verified Facility
            </span>
          </p>
        </div>

        <button
          onClick={() => setIsCapacityModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all self-start md:self-auto"
        >
          Update Capacity
        </button>
      </div>

      {/* Operational Capacity Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-xs text-slate-400 block">Total Inpatient Beds</span>
          <span className="text-2xl font-black text-white mt-1 block">{profile?.total_beds ?? 150}</span>
          <span className="text-[10px] text-slate-500">Official Roster</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-xs text-slate-400 block">Available Vacant Beds</span>
          <span className="text-2xl font-black text-teal-400 mt-1 block">{profile?.available_beds ?? 20}</span>
          <span className="text-[10px] text-teal-300/80">Manually Maintained</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-xs text-slate-400 block">ICU Capability</span>
          <span className="text-sm font-bold text-emerald-400 mt-2 block">
            {profile?.has_icu ? 'Functional (Available)' : 'Unavailable'}
          </span>
          <span className="text-[10px] text-slate-500">Critical Care Unit</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-xs text-slate-400 block">Medical Oxygen Manifold</span>
          <span className="text-sm font-bold text-emerald-400 mt-2 block">
            {profile?.has_oxygen_manifold ? 'Connected & Active' : 'Cylinder Only'}
          </span>
          <span className="text-[10px] text-slate-500">IPHS Compliant</span>
        </div>
      </div>

      {/* Hospital Sub-Tab Bar */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveHospitalTab('REFERRALS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
            activeHospitalTab === 'REFERRALS'
              ? 'bg-slate-800 text-teal-300 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Inbound Referrals & Encounters</span>
          <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {referrals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveHospitalTab('TREATMENT_BILLING')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
            activeHospitalTab === 'TREATMENT_BILLING'
              ? 'bg-slate-800 text-teal-300 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Clinical Treatment Invoices (Simulated)</span>
          <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {treatmentInvoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveHospitalTab('LIFELINK_DONORS')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
            activeHospitalTab === 'LIFELINK_DONORS'
              ? 'bg-rose-950/60 text-rose-300 border-b-2 border-rose-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>LifeLink Voluntary Donors</span>
          <span className="bg-rose-900/60 text-rose-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {donorRequests.length}
          </span>
        </button>
      </div>

      {activeHospitalTab === 'REFERRALS' && (

        /* Incoming Referrals Queue */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Incoming Clinician-Approved Referrals ({referrals.length})
            </h2>
            <span className="text-[11px] text-slate-500 italic">
              (Filtered strictly to this facility's organization queue)
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
              No pending inbound referrals at this time.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referrals.map((r) => {
                const hasConfirmedAppt = r.appointment && r.appointment.status === 'CONFIRMED';
                return (
                  <div
                    key={r.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs space-y-3 shadow-md hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-cyan-400 text-[11px] block">{r.case_number}</span>
                        <h3 className="font-bold text-white text-sm mt-0.5">{r.patient_name}</h3>
                        <span className="text-slate-400 text-[11px]">Phone: {r.patient_phone} &bull; {r.patient_district}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'ACCEPTED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                        r.status === 'DECLINED' ? 'bg-red-950 text-red-300 border border-red-800/40' :
                        'bg-blue-950 text-blue-300 border border-blue-800/40'
                      }`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <div>
                        <strong className="text-slate-400">Target Department:</strong>{' '}
                        <span className="text-white font-medium">{r.target_department}</span>
                      </div>
                      <div>
                        <strong className="text-slate-400">Referral Reason:</strong>{' '}
                        <span className="text-slate-300">{r.referral_reason}</span>
                      </div>
                      <div>
                        <strong className="text-slate-400">Clinical Urgency:</strong>{' '}
                        <span className="text-amber-300 font-semibold">{r.urgency}</span>
                      </div>
                    </div>

                    {/* Confirmed Appointment Details */}
                    {hasConfirmedAppt && (
                      <div className="bg-teal-950/40 border border-teal-800/40 p-3 rounded-xl text-teal-200 text-[11px] space-y-2">
                        <div className="font-bold text-teal-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmed Appointment Slot
                        </div>
                        <div>Scheduled: <strong>{r.appointment.scheduled_at}</strong></div>
                        <div>Doctor: {r.appointment.doctor_name}</div>
                        <div>Arrival Status: <strong className="text-white">{r.appointment.arrival_status}</strong></div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-teal-900/60">
                          <button
                            onClick={() => setEncounterAppt(r.appointment)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold shadow"
                          >
                            Log Consultation
                          </button>
                          <button
                            onClick={() => {
                              setInvoicingRef(r);
                              setInvDesc(`OPD Specialist Consultation — ${r.target_department}`);
                              setInvAmount(300);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-700/50 rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Create Bill</span>
                          </button>
                          <button
                            onClick={() => {
                              setUploadingDocRef(r);
                              setUploadDocTitle(`${r.target_department} Diagnostic Summary`);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Scan/Report</span>
                          </button>
                          <button
                            onClick={() => handleReportNoShow(r.appointment.id)}
                            className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-200 rounded text-[10px] border border-amber-800/40"
                          >
                            No-Show
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons for Incoming Referral */}
                    {r.status === 'SENT' && (
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => setDecliningRef(r)}
                          className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-200 rounded-lg text-xs font-semibold border border-red-800/50"
                        >
                          Decline Referral
                        </button>
                        <button
                          onClick={() => {
                            setAcceptingRef(r);
                            setApptTime('Tomorrow, 10:30 AM');
                            setDoctorName(`Dr. ${r.target_department} Specialist`);
                          }}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                        >
                          Accept & Confirm Slot
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeHospitalTab === 'TREATMENT_BILLING' && (
        /* Clinical Treatment Billing Table */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Hospital Clinical Billing & Transactions</h3>
              <p className="text-xs text-slate-400">
                Patient clinical service fees (OPD, lab panels, pharmacy). Strictly segregated from B2B platform fees.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800/50 px-3 py-1 rounded-lg">
              Simulated Mode
            </span>
          </div>

          {treatmentInvoices.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No patient treatment transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Service / Description</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Method & Reference</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {treatmentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-mono font-bold text-teal-400">{inv.invoice_number}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{inv.patient_name}</div>
                        <div className="font-mono text-[10px] text-slate-500">{inv.patient_identifier}</div>
                      </td>
                      <td className="p-3 text-slate-300">{inv.item_description}</td>
                      <td className="p-3 font-bold text-white">₹{inv.net_amount_inr}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.payment_status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {inv.payment_status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {inv.transaction_reference || 'Pending'} ({inv.payment_method})
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">{inv.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. LifeLink Voluntary Donors Management Tab */}
      {activeHospitalTab === 'LIFELINK_DONORS' && (
        <div className="space-y-6">
          {/* Software Tier & Platform Status Banner */}
          <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-900/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  LifeLink B2B Software Module
                </span>
                <span className="text-xs text-slate-400">
                  Facility Tier: <strong className="text-white">Professional Emergency Network</strong>
                </span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                <span>Voluntary Donor Coordination Network</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                CuraReach LifeLink connects your clinical team to verified voluntary blood donors. Contact details are strictly private until a volunteer accepts the emergency broadcast and provides explicit consent.
              </p>
              <div className="pt-1 text-[11px] text-amber-300/90 font-medium flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Legal & Clinical Safeguard: Emergency clinical referrals are never gated by software licenses.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <button
                onClick={() => setIsSubModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <span>Manage Software Tier</span>
              </button>
              <button
                onClick={() => setIsDonorReqModalOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Broadcast Emergency Blood Request</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Active Broadcasts</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">
                {donorRequests.filter(r => r.status === 'BROADCASTED').length}
              </span>
              <span className="text-[10px] text-slate-500">Live matching in district</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Authorized Introductions</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {introductions.length}
              </span>
              <span className="text-[10px] text-slate-500">Volunteers with contact consent</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Donor Network</span>
              <span className="text-xl font-bold text-teal-400 mt-1 block">Verified Voluntary</span>
              <span className="text-[10px] text-slate-500">Zero commercial remuneration</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">NOTTO Integration</span>
              <span className="text-xl font-bold text-indigo-400 mt-1 block">Educational</span>
              <span className="text-[10px] text-slate-500">Official registry referrals</span>
            </div>
          </div>

          {/* Authorized Volunteer Introductions (Direct Contact) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Authorized Volunteer Introductions ({introductions.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  These voluntary donors accepted an emergency broadcast and explicitly consented to share their contact with this hospital team.
                </p>
              </div>
              <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-2.5 py-0.5 rounded-full font-mono">
                Consent Verified
              </span>
            </div>

            {introductions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                No active donor introductions. When a volunteer donor accepts your emergency broadcast and grants contact sharing, their unmasked contact details and arrival ETA will appear here immediately.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {introductions.map((intro) => (
                  <div
                    key={intro.id}
                    className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">{intro.donor_name}</strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            {intro.blood_group || 'Blood Donor'}
                          </span>
                        </div>
                        <span className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                          <span>{intro.city}, {intro.district}</span>
                          <span>&bull;</span>
                          <span>Prefers: {intro.preferred_language || 'English'}</span>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                        {intro.status}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-300">Authorized Phone:</span>
                        <strong className="text-emerald-300 font-mono text-xs">{intro.donor_phone}</strong>
                      </div>
                      <a
                        href={`tel:${intro.donor_phone}`}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all"
                      >
                        Call Donor
                      </a>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Ref ID: <span className="font-mono text-slate-400">{intro.id.slice(0, 8)}...</span></span>
                      <span>Introduced: {intro.introduced_at ? new Date(intro.introduced_at).toLocaleString() : 'Recently'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hospital Emergency Broadcast Requests Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-400" />
                  <span>Emergency Blood Broadcast Log ({donorRequests.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Targeted broadcast requests dispatched to matching donors in {profile?.district || 'this district'}.
                </p>
              </div>
              <button
                onClick={() => setIsDonorReqModalOpen(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Broadcast</span>
              </button>
            </div>

            {donorRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
                No active or historical emergency blood broadcasts. Click "+ Broadcast Emergency Blood Request" to issue a live request.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Blood Group</th>
                      <th className="p-3">Units Needed</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Valid Until</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {donorRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-950/40">
                        <td className="p-3 font-mono font-bold text-slate-300">
                          {req.id ? req.id.slice(0, 8) : 'REQ'}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            {req.requested_blood_group || 'Any'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-white">
                          {req.units_needed} units
                        </td>
                        <td className="p-3 text-slate-400">
                          {req.city || profile?.city || 'Shivamogga'}, {req.district || profile?.district || 'Shivamogga'}
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {req.requested_until ? new Date(req.requested_until).toLocaleString() : 'Open'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            req.status === 'BROADCASTED'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : req.status === 'FULFILLED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs truncate">
                          {req.description || 'Emergency requirement.'}
                        </td>
                        <td className="p-3 text-right">
                          {req.status === 'BROADCASTED' && (
                            <button
                              onClick={() => handleCloseDonorRequest(req.id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold border border-slate-700"
                            >
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accept & Confirm Modal */}
      {acceptingRef && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Accept Referral & Confirm Appointment</h3>
            <p className="text-xs text-slate-400">
              Proposing consultation slot for {acceptingRef.patient_name} ({acceptingRef.target_department}).
            </p>
            <form onSubmit={handleAcceptReferral} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Appointment Slot Time *</label>
                <input
                  type="text"
                  required
                  value={apptTime}
                  onChange={(e) => setApptTime(e.target.value)}
                  placeholder="e.g. 2026-09-28 10:30 AM"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Specialist *</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAcceptingRef(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Referral Modal (Scenario B) */}
      {decliningRef && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-red-400">Decline Referral</h3>
            <p className="text-xs text-slate-400">
              Declining will activate the adaptive recovery pipeline to route {decliningRef.patient_name} to an alternative facility.
            </p>
            <form onSubmit={handleDeclineReferral} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason Code *</label>
                <select
                  value={declineReasonCode}
                  onChange={(e) => setDeclineReasonCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="NO_SPECIALIST_ON_DUTY">No Specialist On Duty</option>
                  <option value="NO_BEDS">No Available Inpatient Beds</option>
                  <option value="CAPACITY_EXCEEDED">Department Capacity Exceeded</option>
                  <option value="EQUIPMENT_MAINTENANCE">Diagnostic Equipment Under Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Response Explanation *</label>
                <textarea
                  required
                  rows={3}
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="e.g. Surgical theater under emergency decontamination; please reroute to District Civil Hospital..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecliningRef(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Encounter Modal */}
      {encounterAppt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Document Patient Care Encounter</h3>
            <p className="text-xs text-slate-400">
              Record physical arrival and consultation findings. This updates longitudinal tracking.
            </p>
            <form onSubmit={handleLogEncounter} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Clinical Findings & Diagnosis *</label>
                <textarea
                  required
                  rows={3}
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="Document physical exam, diagnostics performed, and findings..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Discharge & Follow-Up Directions</label>
                <textarea
                  rows={2}
                  value={dischargeInstructions}
                  onChange={(e) => setDischargeInstructions(e.target.value)}
                  placeholder="Prescription directions, recovery monitoring, community worker check..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEncounterAppt(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg"
                >
                  Document Encounter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Capacity Modal */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Update Operational Bed Capacity</h3>
            <p className="text-xs text-slate-400">
              Manually maintained operational numbers. CuraReach 360 does not falsely claim automated IoT bed feeds.
            </p>
            <form onSubmit={handleUpdateCapacity} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Total Inpatient Beds</label>
                  <input
                    type="number"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Available Vacant Beds</label>
                  <input
                    type="number"
                    value={availableBeds}
                    onChange={(e) => setAvailableBeds(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-center space-x-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasIcu}
                    onChange={(e) => setHasIcu(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span>Functional Intensive Care Unit (ICU)</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasOxygen}
                    onChange={(e) => setHasOxygen(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span>Continuous Medical Oxygen Manifold</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCapacityModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Treatment Invoice Modal */}
      {invoicingRef && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleCreateTreatmentInvoice} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Generate Treatment Bill</h3>
              </div>
              <button type="button" onClick={() => setInvoicingRef(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">Patient / Case</span>
              <strong className="text-white text-sm">{invoicingRef.patient_name}</strong>
              <span className="font-mono text-teal-400 ml-2">({invoicingRef.case_number})</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Service Type</label>
                <select
                  value={invType}
                  onChange={(e) => setInvType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="CONSULTATION">OPD Specialist Consultation</option>
                  <option value="LAB_TEST">Diagnostic / Pathology Panel</option>
                  <option value="PHARMACY">Pharmacy Dispensation</option>
                  <option value="PROCEDURE">Minor Procedure / Dressing</option>
                  <option value="HOSPITAL_ADMISSION">Inpatient / Ward Admission</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Service Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up consultation fee, HbA1c lab test..."
                  value={invDesc}
                  onChange={(e) => setInvDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={invDiscount}
                    onChange={(e) => setInvDiscount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invPaid}
                    onChange={(e) => setInvPaid(e.target.checked)}
                    className="accent-teal-500 rounded"
                  />
                  <span>Mark as Paid Immediately (Simulated Counter Settlement)</span>
                </label>

                {invPaid && (
                  <div>
                    <label className="text-slate-400 text-[11px] block mb-1">Payment Method</label>
                    <select
                      value={invMethod}
                      onChange={(e) => setInvMethod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    >
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CASH">Cash Counter</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="PM_JAY">Ayushman Bharat (PM-JAY)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInvoicingRef(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingInvoice}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5"
              >
                {isCreatingInvoice ? <Clock className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                <span>Issue Invoice (₹{Math.max(0, invAmount - invDiscount)})</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Diagnostic Report Modal */}
      {uploadingDocRef && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleUploadReport} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Attach Diagnostic Document</h3>
              </div>
              <button type="button" onClick={() => setUploadingDocRef(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase">Patient / Case</span>
              <strong className="text-white text-sm">{uploadingDocRef.patient_name}</strong>
              <span className="font-mono text-teal-400 ml-2">({uploadingDocRef.case_number})</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest X-Ray PA View Report, Complete Hemogram"
                  value={uploadDocTitle}
                  onChange={(e) => setUploadDocTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="LAB_REPORT">Pathology / Lab Report</option>
                  <option value="DIAGNOSTIC_IMAGING">Radiology Scan / X-Ray</option>
                  <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                  <option value="VISIT_NOTE">Specialist Consultation Note</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Document File (PDF, PNG, JPG) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/png,image/jpeg,image/webp,text/plain"
                  onChange={(e) => setUploadDocFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-400 text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-950 file:text-teal-300 hover:file:bg-teal-900"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Clinical Impressions / Observations</label>
                <textarea
                  rows={2}
                  placeholder="Key test findings, normal ranges, follow-up instructions..."
                  value={uploadDocDesc}
                  onChange={(e) => setUploadDocDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUploadingDocRef(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploadingDoc}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5"
              >
                {isUploadingDoc ? <Clock className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Upload & Link to Patient Record</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Broadcast Emergency Blood Request Modal */}
      {isDonorReqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleCreateDonorRequest} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Droplet className="w-5 h-5 fill-rose-500/20" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Broadcast Emergency Blood Request</h3>
                  <p className="text-[11px] text-slate-400">Targeted voluntary donor alert for {profile?.district || 'Shivamogga'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsDonorReqModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3 text-xs text-rose-200/90 space-y-1">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Ethical & Voluntary Compliance</span>
              </div>
              <p className="text-[11px] text-slate-300">
                In strict accordance with the National Blood Policy of India, all coordination is voluntary and non-remunerated. Contact info will be shared only when a matching donor explicitly opts in.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Required Blood Group *</label>
                  <select
                    value={reqBloodGroup}
                    onChange={(e) => setReqBloodGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold"
                  >
                    <option value="O-">O Negative (Universal Donor)</option>
                    <option value="O+">O Positive</option>
                    <option value="A-">A Negative</option>
                    <option value="A+">A Positive</option>
                    <option value="B-">B Negative</option>
                    <option value="B+">B Positive</option>
                    <option value="AB-">AB Negative</option>
                    <option value="AB+">AB Positive (Universal Recipient)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Units Required (Whole Blood / PRBC) *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={reqUnits}
                    onChange={(e) => setReqUnits(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Broadcast Validity Window *</label>
                <select
                  value={reqHours}
                  onChange={(e) => setReqHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value={6}>6 Hours (Extreme Emergency / Acute Hemorrhage)</option>
                  <option value={12}>12 Hours (Urgent Inpatient Requirement)</option>
                  <option value={24}>24 Hours (Next-day Surgery Reserve)</option>
                  <option value={48}>48 Hours (Standard Hospital Replenishment)</option>
                  <option value={72}>72 Hours (Elective / Scheduled Procedure)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Clinical Context / Urgency Details *</label>
                <textarea
                  rows={3}
                  required
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="e.g. Critical requirement for acute poly-trauma stabilization in ICU Ward 3. Cross-match ready."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDonorReqModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingDonorReq}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5"
              >
                {isSubmittingDonorReq ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Broadcast to Volunteer Donors</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hospital LifeLink Software Subscription Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">LifeLink Hospital Software Subscription</h3>
                  <p className="text-[11px] text-slate-400">Institutional tooling for voluntary donor coordination</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsSubModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-200/90 space-y-1">
              <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Strict Separation of Revenue and Emergency Care</span>
              </div>
              <p className="text-[11px] text-slate-300">
                CuraReach 360 clinical referrals, case transfers, and emergency triage are 100% free and open. LifeLink subscription plans are voluntary B2B software licenses providing automated multi-channel messaging and institutional analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {subPlans.length > 0 ? (
                subPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-xl p-4 border flex flex-col justify-between space-y-3 ${
                      plan.plan_code === 'PROFESSIONAL'
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase">{plan.plan_name}</span>
                        {plan.plan_code === 'PROFESSIONAL' && (
                          <span className="text-[9px] bg-indigo-500 text-white font-bold px-1.5 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-white">₹{plan.monthly_fee_inr}</span>
                        <span className="text-[10px] text-slate-400"> / month</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">{plan.description}</p>
                    </div>

                    <button
                      type="button"
                      disabled={isActivatingSub}
                      onClick={() => handleActivateDemoSub(plan.plan_code)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                        plan.plan_code === 'PROFESSIONAL'
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isActivatingSub ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Activate {plan.plan_name}</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-6 text-xs text-slate-500">
                  Loading software subscription plans...
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
