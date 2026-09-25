import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Camera, 
  PhoneCall, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  ChevronRight,
  HeartHandshake,
  Upload,
  X,
  CreditCard,
  Pill,
  Download,
  Trash2,
  Receipt,
  FilePlus,
  Activity,
  HeartPulse,
  Eye,
  Check,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { 
  CaseSummary, 
  CaseDetail, 
  TimelineEvent, 
  UserProfile,
  MedicalHistoryOverview,
  MedicalRecordItem,
  PrescriptionDetail,
  PatientTreatmentTransaction
} from '../../types/curareach';
import { 
  createCaseApi, 
  submitIntakeApi, 
  uploadMedicalPhotoApi, 
  fetchCaseDetail, 
  fetchCaseTimeline,
  reportEncounterStatusApi,
  fetchMedicalHistory,
  addConditionApi,
  deleteConditionApi,
  addAllergyApi,
  deleteAllergyApi,
  fetchMedicalRecords,
  uploadMedicalDocumentApi,
  getMedicalRecordDownloadUrl,
  fetchPrescriptions,
  fetchPatientTransactions,
  recordTreatmentPaymentApi,
  registerPatientApi
} from '../../services/curareachApi';

interface PatientDashboardProps {
  currentUser: UserProfile;
  cases: CaseSummary[];
  onRefresh: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  currentUser,
  cases,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'CASES' | 'MEDICAL_HISTORY' | 'MEDICAL_RECORDS' | 'TREATMENT_BILLING'>('CASES');

  // Cases State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(cases[0]?.id || null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);

  // Medical History State
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistoryOverview | null>(null);
  const [records, setRecords] = useState<MedicalRecordItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDetail[]>([]);
  const [transactions, setTransactions] = useState<PatientTreatmentTransaction[]>([]);
  const [isLoadingMedical, setIsLoadingMedical] = useState(false);

  // Modals State
  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
  const [newCondName, setNewCondName] = useState('');
  const [newCondSeverity, setNewCondSeverity] = useState('MODERATE');
  const [newCondNotes, setNewCondNotes] = useState('');

  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [newAllergen, setNewAllergen] = useState('');
  const [newAllergyReaction, setNewAllergyReaction] = useState('');
  const [newAllergySeverity, setNewAllergySeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING'>('SEVERE');
  const [newAllergyNotes, setNewAllergyNotes] = useState('');

  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('LAB_REPORT');
  const [docFacility, setDocFacility] = useState('Shivamogga District Hospital');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  const [payingTransaction, setPayingTransaction] = useState<PatientTreatmentTransaction | null>(null);
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'CARD' | 'PM_JAY' | 'CSR_GRANT'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // New Case Form State
  const [primaryComplaint, setPrimaryComplaint] = useState('');
  const [description, setDescription] = useState('');
  const [onsetDuration, setOnsetDuration] = useState('3 days');
  const [severity, setSeverity] = useState(5);
  const [spo2, setSpo2] = useState<number | ''>('');
  const [temp, setTemp] = useState<number | ''>('');
  const [photoConsent, setPhotoConsent] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Self Registration Modal State
  const [isSelfRegisterOpen, setIsSelfRegisterOpen] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('Password@123');
  const [regPhone, setRegPhone] = useState('+91-98450-44332');
  const [regDob, setRegDob] = useState('1988-04-12');
  const [regGender, setRegGender] = useState('Female');
  const [regBloodGroup, setRegBloodGroup] = useState('A+');
  const [regAddress, setRegAddress] = useState('Kudligere Village, Bhadravathi');
  const [regDistrict, setRegDistrict] = useState('Shivamogga');
  const [regState, setRegState] = useState('Karnataka');
  const [regPincode, setRegPincode] = useState('577201');
  const [regLanguage, setRegLanguage] = useState('English');
  const [regEmergencyName, setRegEmergencyName] = useState('Rangappa Gowda');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('+91-94481-22110');
  const [regEmergencyRelation, setRegEmergencyRelation] = useState('Spouse');
  const [regAbhaId, setRegAbhaId] = useState('');
  const [regTransportBarrier, setRegTransportBarrier] = useState(false);
  const [regFinancialBarrier, setRegFinancialBarrier] = useState(false);
  const [regConsent, setRegConsent] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  // Load detailed case data
  const loadCaseDetail = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setIsDetailLoading(true);
    try {
      const [detail, tl] = await Promise.all([
        fetchCaseDetail(caseId),
        fetchCaseTimeline(caseId)
      ]);
      setCaseDetail(detail);
      setTimeline(tl);
    } catch (err: any) {
      console.error('Failed to load case detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const loadMedicalData = async () => {
    setIsLoadingMedical(true);
    try {
      const [hist, recList, rxList, txList] = await Promise.all([
        fetchMedicalHistory('me').catch(() => null),
        fetchMedicalRecords('me').catch(() => []),
        fetchPrescriptions('me').catch(() => []),
        fetchPatientTransactions('me').catch(() => [])
      ]);
      if (hist) setMedicalHistory(hist);
      setRecords(recList);
      setPrescriptions(rxList);
      setTransactions(txList);
    } catch (err) {
      console.error('Failed to load medical data:', err);
    } finally {
      setIsLoadingMedical(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseDetail(selectedCaseId);
    } else if (cases.length > 0) {
      loadCaseDetail(cases[0].id);
    }
    loadMedicalData();
  }, [selectedCaseId, cases.length]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Please select a valid JPEG, PNG, or WebP image.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setPhotoConsent(true);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryComplaint.trim()) {
      setFormError('Please enter your primary complaint.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);

    try {
      // 1. Create Case
      const newCase = await createCaseApi({
        primary_complaint: primaryComplaint,
        health_data_consent: true,
        referral_consent: true,
        photo_consent: photoConsent && photoFile !== null,
        worker_assistance_consent: true
      });

      // 2. Upload optional photo if selected
      if (photoFile && photoConsent) {
        await uploadMedicalPhotoApi(newCase.id, photoFile);
      }

      // 3. Submit symptoms and trigger AI Orchestrator
      await submitIntakeApi(newCase.id, {
        main_complaint: primaryComplaint,
        description: description || primaryComplaint,
        onset_duration: onsetDuration,
        reported_severity: severity,
        spo2: spo2 !== '' ? Number(spo2) : undefined,
        temperature: temp !== '' ? Number(temp) : undefined
      });

      // Close modal and refresh
      setIsNewCaseOpen(false);
      setPrimaryComplaint('');
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
      onRefresh();
      setSelectedCaseId(newCase.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit case.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportMissedAppointment = async (appointmentId: string) => {
    if (!window.confirm('Report that you are unable to attend or missed this scheduled appointment? Care Rescue will coordinate support.')) return;
    try {
      await reportEncounterStatusApi(appointmentId, {
        arrival_status: 'NOT_ARRIVED',
        consultation_notes: 'Patient reported missed visit via portal. Requested rescheduling and community assistance.'
      });
      alert('Missed appointment reported. A CuraReach coordinator has been assigned to help reschedule.');
      onRefresh();
      if (selectedCaseId) loadCaseDetail(selectedCaseId);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Medical History Handlers
  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCondName.trim()) return;
    try {
      await addConditionApi('me', {
        condition_name: newCondName,
        status: 'ACTIVE',
        severity: newCondSeverity,
        notes: newCondNotes
      });
      setIsAddConditionOpen(false);
      setNewCondName('');
      setNewCondNotes('');
      loadMedicalData();
    } catch (err: any) {
      alert(err.message || 'Failed to add condition');
    }
  };

  const handleDeleteCondition = async (condId: string) => {
    if (!window.confirm('Remove this medical condition?')) return;
    try {
      await deleteConditionApi(condId);
      loadMedicalData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergen.trim()) return;
    try {
      await addAllergyApi('me', {
        allergen: newAllergen,
        reaction: newAllergyReaction,
        severity: newAllergySeverity,
        notes: newAllergyNotes
      });
      setIsAddAllergyOpen(false);
      setNewAllergen('');
      setNewAllergyReaction('');
      setNewAllergyNotes('');
      loadMedicalData();
    } catch (err: any) {
      alert(err.message || 'Failed to add allergy');
    }
  };

  const handleDeleteAllergy = async (allergyId: string) => {
    if (!window.confirm('Remove this allergy record?')) return;
    try {
      await deleteAllergyApi(allergyId);
      loadMedicalData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docFile) {
      alert('Document title and file are required.');
      return;
    }
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('title', docTitle);
    formData.append('record_type', docType);
    formData.append('facility_name', docFacility);
    formData.append('description', docDescription);

    try {
      await uploadMedicalDocumentApi('me', formData);
      setIsUploadDocOpen(false);
      setDocTitle('');
      setDocFile(null);
      setDocDescription('');
      loadMedicalData();
      alert('Medical document uploaded securely.');
    } catch (err: any) {
      alert(err.message || 'Failed to upload document.');
    }
  };

  const handleSimulatePayment = async () => {
    if (!payingTransaction) return;
    setIsProcessingPayment(true);
    try {
      await recordTreatmentPaymentApi(payingTransaction.id, {
        payment_method: payMethod,
        notes: `Simulated patient settlement via ${payMethod}`
      });
      alert(`Payment of ₹${payingTransaction.net_amount_inr} simulated successfully via ${payMethod}!`);
      setPayingTransaction(null);
      loadMedicalData();
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case 'EMERGENCY':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">EMERGENCY</span>;
      case 'HIGH':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">HIGH</span>;
      case 'MODERATE':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">MODERATE</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">LOW</span>;
    }
  };

  const getJourneyStep = (state?: string) => {
    if (!state) return 1;
    if (state === 'EMERGENCY_GUIDANCE_SHOWN') return 5;
    if (['DRAFT', 'INTAKE_SUBMITTED'].includes(state)) return 1;
    if (['AWAITING_CLINICIAN_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'CLINICIAN_REVIEWED'].includes(state)) return 2;
    if (['REFERRAL_APPROVED', 'REFERRAL_SENT', 'HOSPITAL_INFORMATION_REQUESTED', 'REFERRAL_DECLINED', 'ALTERNATIVE_REVIEW_REQUIRED'].includes(state)) return 3;
    if (['REFERRAL_ACCEPTED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_MISSED'].includes(state)) return 4;
    return 5;
  };

  const severeAllergies = medicalHistory?.allergies?.filter(a => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING') || [];
  const unpaidInvoices = transactions.filter(t => t.payment_status === 'UNPAID');

  return (
    <div className="space-y-6">
      {/* Top Welcome & Health Pass Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-teal-400">Patient Care Portal</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span className="text-xs text-slate-400">Universal Access MVP</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-white">
              Welcome, {currentUser.full_name}
            </h1>
            <span className="font-mono text-xs px-2.5 py-1 bg-teal-950/80 text-teal-300 border border-teal-700/60 rounded-lg font-bold flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              ID: {currentUser.patient_identifier || medicalHistory?.patient_identifier || 'CR-PAT-2026-0101'}
            </span>
            <span className="font-mono text-xs px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
              Blood: <strong className="text-white">{currentUser.profile?.blood_group || medicalHistory?.blood_group || 'O+'}</strong>
            </span>
            {(currentUser.profile?.abha_id) && (
              <span className="font-mono text-xs px-2 py-1 bg-slate-800/80 text-slate-300 border border-slate-700 rounded-lg">
                ABHA: {currentUser.profile.abha_id}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
            <span>District: <strong>{currentUser.profile?.district || 'Shivamogga'}</strong></span>
            <span>Phone: <strong>{currentUser.phone || '+91-98450-XXXXX'}</strong></span>
            {currentUser.profile?.transport_barrier && (
              <span className="text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[11px] border border-amber-600/40">
                Transport Assistance Flagged
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsSelfRegisterOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold rounded-xl text-xs border border-teal-500/30 transition-all shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-400" />
            <span>Register New Patient</span>
          </button>
          <button
            onClick={() => setIsNewCaseOpen(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-900/30 transition-all text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Healthcare Case</span>
          </button>
        </div>
      </div>

      {/* Critical Allergy Safety Banner (If severe allergies exist) */}
      {severeAllergies.length > 0 && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3.5 flex items-start gap-3 text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-red-300 uppercase tracking-wider">Documented Severe Allergies Alert: </span>
            <span>{severeAllergies.map(a => `${a.allergen} (${a.reaction || 'Anaphylaxis risk'})`).join(', ')}. Clinical warning synchronized across referral hospitals.</span>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto pb-1 gap-2">
        <button
          onClick={() => setActiveTab('CASES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all ${
            activeTab === 'CASES'
              ? 'bg-slate-800 text-teal-300 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Care Pathway & Cases</span>
          <span className="bg-slate-700/80 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {cases.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('MEDICAL_HISTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all ${
            activeTab === 'MEDICAL_HISTORY'
              ? 'bg-slate-800 text-teal-300 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Medical History & Allergies</span>
          {severeAllergies.length > 0 && (
            <span className="bg-red-500/30 text-red-300 border border-red-500/50 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {severeAllergies.length} Alert
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('MEDICAL_RECORDS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all ${
            activeTab === 'MEDICAL_RECORDS'
              ? 'bg-slate-800 text-teal-300 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FilePlus className="w-4 h-4" />
          <span>Medical Records & Prescriptions</span>
          <span className="bg-slate-700/80 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
            {records.length + prescriptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('TREATMENT_BILLING')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all ${
            activeTab === 'TREATMENT_BILLING'
              ? 'bg-slate-800 text-teal-300 border-b-2 border-teal-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Treatment Invoices & Payments</span>
          {unpaidInvoices.length > 0 ? (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {unpaidInvoices.length} Unpaid
            </span>
          ) : (
            <span className="bg-slate-700/80 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {transactions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: CASES VIEW (Preserved exactly as existing) */}
      {activeTab === 'CASES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Cases Roster (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">My Healthcare Cases</h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {cases.length}
              </span>
            </div>

            {cases.length === 0 ? (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-300">No active healthcare cases</p>
                <p className="text-xs text-slate-500 mt-1">Create a new case to initiate clinical triage and referral coordination.</p>
                <button
                  onClick={() => setIsNewCaseOpen(true)}
                  className="mt-4 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold"
                >
                  Create Case
                </button>
              </div>
            ) : (
              cases.map((c) => {
                const isSelected = c.id === selectedCaseId;
                const isEmergency = c.provisional_urgency === 'EMERGENCY' || c.current_state === 'EMERGENCY_GUIDANCE_SHOWN';
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-teal-500/80 shadow-md shadow-teal-950/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-400">{c.case_number}</span>
                      {getUrgencyBadge(c.confirmed_urgency || c.provisional_urgency)}
                    </div>

                    <h3 className="font-semibold text-sm text-slate-200 mt-2 line-clamp-1">
                      {c.primary_complaint}
                    </h3>

                    <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                      <span className="font-mono text-teal-400/90 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                        {c.current_state.replace(/_/g, ' ')}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {isEmergency && (
                      <div className="mt-2 text-[11px] text-red-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Immediate 112 guidance shown</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Selected Case View (8 cols) */}
          <div className="lg:col-span-8">
            {isDetailLoading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <Clock className="w-8 h-8 animate-spin mx-auto text-teal-400 mb-2" />
                <p className="text-sm">Loading case details...</p>
              </div>
            ) : !caseDetail ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <p className="text-sm">Select a case on the left to view details and care pathway.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Emergency Banner (Section 4 Scenario E) */}
                {caseDetail.current_state === 'EMERGENCY_GUIDANCE_SHOWN' && (
                  <div className="bg-gradient-to-r from-red-950/90 via-red-900/80 to-slate-950 border-2 border-red-500 rounded-2xl p-5 shadow-2xl text-white animate-pulse">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-red-600 rounded-xl text-white">
                        <PhoneCall className="w-6 h-6 animate-bounce" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-black tracking-wide text-white uppercase flex items-center gap-2">
                            Emergency Warning — Immediate Action Required
                          </h3>
                          <span className="text-xs bg-red-600 text-white font-bold px-2 py-0.5 rounded">
                            112 EMERGENCY
                          </span>
                        </div>
                        <p className="text-xs text-red-100 mt-1">
                          Our clinical intake safety rules detected critical red-flag symptoms. Routine referral queues have been bypassed.
                        </p>

                        <div className="mt-4 p-3 bg-red-950/80 rounded-xl border border-red-700/50 space-y-2">
                          <div className="text-xs font-semibold text-red-200">
                            <strong>Direct Emergency Actions:</strong>
                          </div>
                          <ul className="text-xs text-red-100 list-disc list-inside space-y-1">
                            <li>Dial <strong>112</strong> immediately for ambulance & paramedic dispatch.</li>
                            <li>Proceed to nearest 24/7 Trauma / ICU: <strong>Shivamogga District Civil Hospital</strong>.</li>
                            <li>Keep patient in comfortable, resting position; avoid physical exertion.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Patient Journey Progress Tracker (5 Steps) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                    <span>Care Pathway Progression</span>
                    <span className="text-teal-400 font-mono text-[11px]">
                      State: {caseDetail.current_state.replace(/_/g, ' ')}
                    </span>
                  </h3>

                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { step: 1, label: 'Intake' },
                      { step: 2, label: 'Clinician' },
                      { step: 3, label: 'Referral' },
                      { step: 4, label: 'Hospital' },
                      { step: 5, label: 'Follow-up' }
                    ].map((s) => {
                      const cur = getJourneyStep(caseDetail.current_state);
                      const isDone = cur > s.step;
                      const isCurrent = cur === s.step;
                      return (
                        <div key={s.step} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                            isDone 
                              ? 'bg-teal-500 text-slate-950 font-bold'
                              : isCurrent 
                                ? 'bg-teal-900 border-2 border-teal-400 text-teal-300'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}>
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                          </div>
                          <span className={`text-[11px] font-semibold ${isCurrent ? 'text-teal-300' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Case Overview Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                          {caseDetail.case_number}
                        </span>
                        <span className="text-xs text-slate-400">
                          Created {new Date(caseDetail.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1">
                        {caseDetail.primary_complaint}
                      </h2>
                    </div>
                    {getUrgencyBadge(caseDetail.confirmed_urgency || caseDetail.provisional_urgency)}
                  </div>

                  {/* Vitals Summary */}
                  {caseDetail.symptoms?.vitals && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Temperature</span>
                        <span className="font-semibold text-slate-200">
                          {caseDetail.symptoms.vitals.temperature ? `${caseDetail.symptoms.vitals.temperature}°C` : 'Normal'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Blood Pressure</span>
                        <span className="font-semibold text-slate-200">
                          {caseDetail.symptoms.vitals.blood_pressure || '120/80 mmHg'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">SpO2 Oxygen</span>
                        <span className={`font-semibold ${
                          (caseDetail.symptoms.vitals.spo2 || 98) < 92 ? 'text-red-400 font-bold' : 'text-slate-200'
                        }`}>
                          {caseDetail.symptoms.vitals.spo2 ? `${caseDetail.symptoms.vitals.spo2}%` : '98%'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Heart Rate</span>
                        <span className="font-semibold text-slate-200">
                          {caseDetail.symptoms.vitals.heart_rate ? `${caseDetail.symptoms.vitals.heart_rate} bpm` : '76 bpm'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Referral & Appointment Card if Available */}
                  {caseDetail.referrals && caseDetail.referrals.length > 0 && (
                    <div className="border border-teal-800/40 bg-teal-950/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4" />
                          Hospital Referral & Appointment
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-teal-900/60 text-teal-300 rounded border border-teal-700/40">
                          {caseDetail.referrals[0].status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1">
                        <div>Facility: <strong>{caseDetail.referrals[0].hospital_name}</strong></div>
                        <div>Target Department: <strong>{caseDetail.referrals[0].target_department}</strong></div>
                      </div>

                      {caseDetail.referrals[0].appointment && (
                        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-xs space-y-2 mt-2">
                          <div className="flex items-center justify-between text-teal-300 font-semibold">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Scheduled: {caseDetail.referrals[0].appointment.scheduled_at}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              Status: {caseDetail.referrals[0].appointment.status}
                            </span>
                          </div>
                          <div className="text-slate-300">
                            Specialist In-Charge: <strong>{caseDetail.referrals[0].appointment.doctor_name}</strong>
                          </div>

                          {/* Missed appointment button (Section 11) */}
                          {['CONFIRMED'].includes(caseDetail.referrals[0].appointment.status) && (
                            <div className="pt-2 border-t border-slate-800 flex justify-end">
                              <button
                                onClick={() => handleReportMissedAppointment(caseDetail.referrals[0].appointment!.status)}
                                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                              >
                                Unable to attend? Report Missed Visit for Rescue Coordination
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audit Trail Timeline */}
                  <div className="border-t border-slate-800 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      Auditable State Machine History
                    </h4>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {timeline.length === 0 ? (
                        <p className="text-xs text-slate-500">No events recorded yet.</p>
                      ) : (
                        timeline.map((t) => (
                          <div key={t.id} className="text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-200">{t.transition_event}</span>
                                <span className="text-[10px] text-teal-400 bg-teal-950 px-1.5 rounded">
                                  {t.actor_role}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">{t.evidence_notes}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MEDICAL HISTORY & ALLERGIES */}
      {activeTab === 'MEDICAL_HISTORY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Conditions Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Diagnosed Conditions</h3>
                </div>
                <button
                  onClick={() => setIsAddConditionOpen(true)}
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-semibold bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-800/40"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Condition</span>
                </button>
              </div>

              {medicalHistory?.conditions?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No conditions documented.</p>
              ) : (
                <div className="space-y-2.5">
                  {medicalHistory?.conditions?.map(c => (
                    <div key={c.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 text-sm">{c.condition_name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            c.status === 'ACTIVE' ? 'bg-teal-950 text-teal-300 border border-teal-800/40' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        {c.notes && <p className="text-xs text-slate-400 mt-1">{c.notes}</p>}
                        {c.diagnosed_date && <span className="text-[11px] text-slate-500 mt-1 block">Diagnosed: {c.diagnosed_date}</span>}
                      </div>
                      <button
                        onClick={() => handleDeleteCondition(c.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Delete condition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Allergies Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Allergies & Sensitivities</h3>
                </div>
                <button
                  onClick={() => setIsAddAllergyOpen(true)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-800/40"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Report Allergy</span>
                </button>
              </div>

              {medicalHistory?.allergies?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No known drug or environmental allergies.</p>
              ) : (
                <div className="space-y-2.5">
                  {medicalHistory?.allergies?.map(a => (
                    <div key={a.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 text-sm">{a.allergen}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {a.severity}
                          </span>
                        </div>
                        {a.reaction && <p className="text-xs text-slate-300 mt-1">Reaction: <strong>{a.reaction}</strong></p>}
                        {a.notes && <p className="text-xs text-slate-400 mt-0.5">{a.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteAllergy(a.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Delete allergy"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Surgeries & Medications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Medications */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Pill className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Current Regular Medications</h3>
              </div>
              {medicalHistory?.medications?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No regular medications documented.</p>
              ) : (
                <div className="space-y-2">
                  {medicalHistory?.medications?.map(m => (
                    <div key={m.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-200 text-sm">{m.medication_name}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {m.dosage} &bull; {m.frequency}
                        </div>
                        {m.notes && <p className="text-[11px] text-slate-500 mt-0.5">{m.notes}</p>}
                      </div>
                      <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-800/40 px-2 py-0.5 rounded font-mono">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Surgeries & Family History */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <HeartHandshake className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Surgeries & Family History</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Past Surgical Procedures</h4>
                  {medicalHistory?.surgeries?.length === 0 ? (
                    <p className="text-xs text-slate-500">No major surgeries on record.</p>
                  ) : (
                    medicalHistory?.surgeries?.map(s => (
                      <div key={s.id} className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-2">
                        <span className="font-semibold text-slate-200">{s.procedure_name}</span>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          {s.hospital_name} &bull; {s.surgery_date}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Family Medical History</h4>
                  {medicalHistory?.family_history?.length === 0 ? (
                    <p className="text-xs text-slate-500">No family conditions recorded.</p>
                  ) : (
                    medicalHistory?.family_history?.map(f => (
                      <div key={f.id} className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 mb-2 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-teal-400">{f.relationship_to_patient}:</span>{' '}
                          <span className="text-slate-200">{f.condition}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEDICAL RECORDS & DIGITAL PRESCRIPTIONS */}
      {activeTab === 'MEDICAL_RECORDS' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Diagnostic Reports & Prescriptions</h2>
            <button
              onClick={() => setIsUploadDocOpen(true)}
              className="flex items-center gap-1.5 text-xs text-white font-semibold bg-teal-600 hover:bg-teal-500 px-3 py-1.5 rounded-lg transition-all shadow-md"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Report / Document</span>
            </button>
          </div>

          {/* Digital Prescriptions Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Pill className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Authorized Digital Prescriptions</h3>
            </div>

            {prescriptions.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No active prescriptions issued yet.</p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map(rx => (
                  <div key={rx.id} className="bg-slate-950/80 border border-teal-800/30 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/50">
                          {rx.prescription_code}
                        </span>
                        <span className="text-xs text-slate-300 ml-2 font-semibold">Diagnosis: {rx.diagnosis}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Prescribed by: <strong className="text-slate-200">{rx.clinician_name}</strong> &bull; Valid to: {rx.valid_until}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {rx.items.map(item => (
                        <div key={item.id} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-slate-200">{item.medication_name}</strong>
                            <span className="text-teal-400 ml-2">({item.dosage})</span>
                            <span className="text-slate-400 ml-2">&bull; {item.frequency}</span>
                            {item.instructions && <div className="text-[11px] text-slate-400 mt-0.5">{item.instructions}</div>}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {item.duration_days} days
                          </span>
                        </div>
                      ))}
                    </div>

                    {rx.general_instructions && (
                      <div className="text-xs text-slate-400 italic bg-slate-900/30 p-2 rounded">
                        Instructions: {rx.general_instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnostic & Lab Reports List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Diagnostic Reports & Visit Summaries</h3>
            </div>

            {records.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No reports or clinical documents uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {records.map(r => (
                  <div key={r.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-950/70 px-2 py-0.5 rounded border border-teal-800/40">
                          {r.record_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">{r.document_date}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-slate-200 mt-2">{r.title}</h4>
                      {r.facility_name && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          {r.facility_name}
                        </p>
                      )}
                      {r.description && <p className="text-xs text-slate-400 mt-2 line-clamp-3">{r.description}</p>}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{r.recorder_name}</span>
                      {r.has_file && (
                        <a
                          href={getMedicalRecordDownloadUrl(r.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-semibold bg-teal-950/80 px-2.5 py-1 rounded border border-teal-800/50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download File</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: TREATMENT INVOICES & PAYMENTS */}
      {activeTab === 'TREATMENT_BILLING' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">Patient Treatment Invoices & Transaction History</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clinical treatment charges (Consultations, Labs, Pharmacy). Strictly separated from CuraReach software subscriptions.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-teal-950/80 text-teal-300 border border-teal-700/60 px-3 py-1 rounded-lg self-start">
                Simulated Gateway Active
              </span>
            </div>

            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No medical treatment invoices on file.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map(t => (
                  <div key={t.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/50">
                          {t.invoice_number}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {t.transaction_type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          t.payment_status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : t.payment_status === 'REFUNDED'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {t.payment_status}
                        </span>
                        {t.is_simulated && (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                            Simulated
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-sm text-slate-200">{t.item_description}</h4>
                      <p className="text-xs text-slate-400">Facility: {t.hospital_name} &bull; Date: {t.created_at}</p>
                      {t.transaction_reference && (
                        <p className="text-[11px] font-mono text-teal-400/90">
                          Ref: {t.transaction_reference} ({t.payment_method})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total Due</span>
                        <span className="text-lg font-bold text-white">₹{t.net_amount_inr}</span>
                      </div>

                      {t.payment_status === 'UNPAID' ? (
                        <button
                          onClick={() => setPayingTransaction(t)}
                          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-teal-900/30 flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Invoice</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/40">
                          <Check className="w-3.5 h-3.5" />
                          <span>Settled</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Pay Invoice Simulation */}
      {payingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-slate-200">Settle Treatment Invoice</h3>
              </div>
              <button onClick={() => setPayingTransaction(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice:</span>
                <span className="font-mono text-teal-400 font-bold">{payingTransaction.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Item:</span>
                <span className="text-slate-200 font-semibold">{payingTransaction.item_description}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-300">Amount to Pay:</span>
                <span className="font-bold text-white text-base">₹{payingTransaction.net_amount_inr}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Select Simulated Payment Mode</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'UPI', label: 'UPI / PhonePe' },
                  { id: 'CASH', label: 'Hospital Cash Desk' },
                  { id: 'CARD', label: 'Debit / Credit Card' },
                  { id: 'PM_JAY', label: 'PM-JAY Scheme' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayMethod(m.id as any)}
                    className={`p-2.5 rounded-lg border text-left font-semibold transition-all ${
                      payMethod === m.id
                        ? 'bg-teal-950/80 border-teal-500 text-teal-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Notice: Transactions are labeled as simulated per hackathon requirements. No actual currency is debited.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayingTransaction(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessingPayment}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-teal-900/30"
              >
                {isProcessingPayment ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Authorize ₹{payingTransaction.net_amount_inr} Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Condition */}
      {isAddConditionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleAddCondition} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-200">Add Medical Condition</h3>
              <button type="button" onClick={() => setIsAddConditionOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Condition Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Type 2 Diabetes, Asthma, Hypertension"
                  value={newCondName}
                  onChange={(e) => setNewCondName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Severity</label>
                <select
                  value={newCondSeverity}
                  onChange={(e) => setNewCondSeverity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="MILD">MILD</option>
                  <option value="MODERATE">MODERATE</option>
                  <option value="SEVERE">SEVERE</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Clinical Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Medication management, diagnosis year, symptoms..."
                  value={newCondNotes}
                  onChange={(e) => setNewCondNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddConditionOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg"
              >
                Save Condition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add Allergy */}
      {isAddAllergyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleAddAllergy} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-200">Report Drug or Food Allergy</h3>
              <button type="button" onClick={() => setIsAddAllergyOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Allergen Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Allergy Severity</label>
                <select
                  value={newAllergySeverity}
                  onChange={(e) => setNewAllergySeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  <option value="MILD">MILD (Mild rash, itching)</option>
                  <option value="MODERATE">MODERATE (Urticaria, swelling)</option>
                  <option value="SEVERE">SEVERE (Anaphylaxis, severe dyspnea)</option>
                  <option value="LIFE_THREATENING">LIFE THREATENING</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Observed Reaction</label>
                <input
                  type="text"
                  placeholder="e.g. Facial angioedema, breathing difficulty"
                  value={newAllergyReaction}
                  onChange={(e) => setNewAllergyReaction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Safety Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Avoid all beta-lactams"
                  value={newAllergyNotes}
                  onChange={(e) => setNewAllergyNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddAllergyOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg"
              >
                Save Allergy Alert
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Upload Medical Document */}
      {isUploadDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleUploadDocument} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-200">Upload Diagnostic Document</h3>
              <button type="button" onClick={() => setIsUploadDocOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fasting Blood Sugar & Lipid Profile"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Record Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value="LAB_REPORT">Lab Report</option>
                    <option value="DIAGNOSTIC_IMAGING">Imaging / X-Ray</option>
                    <option value="VISIT_NOTE">Visit Summary</option>
                    <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={docFacility}
                    onChange={(e) => setDocFacility(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/png,image/jpeg,image/webp,text/plain"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-400 text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-950 file:text-teal-300 hover:file:bg-teal-900"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Summary Description</label>
                <textarea
                  rows={2}
                  placeholder="Key observations or clinical indicators..."
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUploadDocOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg"
              >
                Upload Document
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW CASE MODAL (Preserved from existing MVP) */}
      {isNewCaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-teal-400" />
                <h2 className="text-lg font-bold text-white">Create Healthcare Intake</h2>
              </div>
              <button 
                onClick={() => setIsNewCaseOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Primary Medical Complaint <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Progressive lower limb swelling, recurring fever, severe chest heaviness"
                  value={primaryComplaint}
                  onChange={(e) => setPrimaryComplaint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Detailed Symptoms & Onset
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe when symptoms began, what makes it worse, accompanying pains..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={onsetDuration}
                    onChange={(e) => setOnsetDuration(e.target.value)}
                    placeholder="e.g. 4 days"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Severity: {severity} / 10
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full accent-teal-500 mt-2"
                  />
                </div>
              </div>

              {/* Optional Vitals */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Optional: SpO2 Oxygen (%)
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={100}
                    placeholder="e.g. 97"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Optional: Body Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 37.2"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Optional Photo Upload */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-400" />
                    Optional Clinical Inspection Photo
                  </span>
                  <span className="text-[10px] text-slate-500">MIME & Magic Bytes Verified</span>
                </div>

                {photoPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-xl border border-teal-500/50" 
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-lg hover:bg-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-teal-500/60 hover:bg-slate-900/40 transition-all">
                      <Camera className="w-6 h-6 text-slate-500 mb-1" />
                      <span className="text-xs text-slate-400">Click to upload JPG, PNG or WebP</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Securely encrypted in private local storage</span>
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp" 
                        onChange={handlePhotoSelect} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Patient Consent Declaration */}
              <div className="p-3 bg-teal-950/30 border border-teal-800/40 rounded-xl text-[11px] text-slate-300 space-y-1">
                <div className="font-semibold text-teal-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Consent & Safety Governance
                </div>
                <p className="text-slate-400 leading-relaxed">
                  By submitting, you consent to AI-assisted provisional triage and authorized clinician review. Emergency symptoms bypass referral queues immediately.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCaseOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-teal-900/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Coordinating AI Agents...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Submit Clinical Intake</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Self-Registration Modal */}
      {isSelfRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Self-Service Patient Registration</h3>
              </div>
              <button 
                onClick={() => setIsSelfRegisterOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="bg-red-950/60 border border-red-500/40 p-3 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccessMessage && (
              <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{regSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!regFullName.trim() || !regEmail.trim()) {
                setRegError('Please provide full name and email.');
                return;
              }
              if (!regConsent) {
                setRegError('Informed consent is required to register.');
                return;
              }
              setIsRegistering(true);
              setRegError(null);
              try {
                const res = await registerPatientApi({
                  full_name: regFullName.trim(),
                  email: regEmail.trim(),
                  password: regPassword,
                  phone: regPhone,
                  date_of_birth: regDob,
                  gender: regGender,
                  blood_group: regBloodGroup,
                  address: regAddress,
                  district: regDistrict,
                  state: regState,
                  pincode: regPincode,
                  primary_language: regLanguage,
                  emergency_contact_name: regEmergencyName,
                  emergency_contact_phone: regEmergencyPhone,
                  emergency_contact_relation: regEmergencyRelation,
                  abha_id: regAbhaId || undefined,
                  transport_access_barrier: regTransportBarrier,
                  financial_barrier: regFinancialBarrier
                });
                setRegSuccessMessage(`Registration successful! Unique Patient ID: ${res.user.patient_identifier}`);
                setTimeout(() => {
                  setIsSelfRegisterOpen(false);
                  setRegSuccessMessage(null);
                  onRefresh();
                }, 1500);
              } catch (err: any) {
                setRegError(err.message || 'Registration failed.');
              } finally {
                setIsRegistering(false);
              }
            }} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Lakshmi Devi"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. lakshmi.devi@curareach.org"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile / Alternative Contact *</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91-98450-XXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Blood Group</label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preferred Language</label>
                  <select
                    value={regLanguage}
                    onChange={(e) => setRegLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Kannada">Kannada</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>
              </div>

              {/* Address details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-slate-300 font-semibold mb-1">Village, Town or City Address *</label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="e.g. Kudligere Village, Bhadravathi Taluk"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">District</label>
                  <input
                    type="text"
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pincode</label>
                  <input
                    type="text"
                    value={regPincode}
                    onChange={(e) => setRegPincode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">Emergency Contact</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      value={regEmergencyName}
                      onChange={(e) => setRegEmergencyName(e.target.value)}
                      placeholder="Rangappa Gowda"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Contact Phone</label>
                    <input
                      type="text"
                      value={regEmergencyPhone}
                      onChange={(e) => setRegEmergencyPhone(e.target.value)}
                      placeholder="+91-94481-XXXXX"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Relationship</label>
                    <input
                      type="text"
                      value={regEmergencyRelation}
                      onChange={(e) => setRegEmergencyRelation(e.target.value)}
                      placeholder="Spouse / Parent / Sibling"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Barriers & ABHA ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ABHA ID (Ayushman Bharat Health Account - Optional)</label>
                  <input
                    type="text"
                    value={regAbhaId}
                    onChange={(e) => setRegAbhaId(e.target.value)}
                    placeholder="e.g. 91-2026-8877-6655"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div className="flex flex-col justify-center space-y-2 pt-2">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regTransportBarrier}
                      onChange={(e) => setRegTransportBarrier(e.target.checked)}
                      className="accent-teal-500 rounded"
                    />
                    <span>Requires Transport / Transit Assistance</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={regFinancialBarrier}
                      onChange={(e) => setRegFinancialBarrier(e.target.checked)}
                      className="accent-teal-500 rounded"
                    />
                    <span>Financial Scheme / PM-JAY Assistance Requested</span>
                  </label>
                </div>
              </div>

              {/* Consent check */}
              <div className="p-3 bg-teal-950/40 border border-teal-800/50 rounded-xl">
                <label className="flex items-start space-x-2 text-slate-300 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={regConsent}
                    onChange={(e) => setRegConsent(e.target.checked)}
                    className="accent-teal-500 rounded mt-0.5"
                    required
                  />
                  <span>
                    <strong>Required Informed Consent:</strong> I voluntarily consent to create my CuraReach 360 health record and permit coordinating clinical officers and healthcare workers to facilitate referrals, appointment notifications, and continuity follow-up.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSelfRegisterOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-900/30 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isRegistering ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Patient ID & Profile...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register &amp; Generate Patient ID</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
