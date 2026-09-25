import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle, 
  Building2, 
  ArrowRight, 
  FileCheck, 
  Eye, 
  RotateCw, 
  Clock, 
  Activity, 
  Heart, 
  Thermometer, 
  Wind, 
  X,
  Send,
  AlertTriangle,
  Pill,
  HeartPulse,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { CaseSummary, CaseDetail, FacilityMatch, UserProfile, MedicalHistoryOverview } from '../../types/curareach';
import { 
  fetchCaseDetail, 
  submitClinicianReviewApi, 
  matchFacilitiesForCase, 
  authorizeReferralApi, 
  approveAlternativeReferralApi,
  closeCaseApi,
  getImageUrl,
  fetchMedicalHistory,
  createPrescriptionApi
} from '../../services/curareachApi';

interface ClinicianDashboardProps {
  currentUser: UserProfile;
  cases: CaseSummary[];
  onRefresh: () => void;
}

export const ClinicianDashboard: React.FC<ClinicianDashboardProps> = ({
  currentUser,
  cases,
  onRefresh
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(cases[0]?.id || null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');

  // Medical History & Prescription State
  const [patientMedicalHistory, setPatientMedicalHistory] = useState<MedicalHistoryOverview | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxValidUntil, setRxValidUntil] = useState('2026-10-30');
  const [rxItems, setRxItems] = useState<Array<{
    medication_name: string;
    dosage: string;
    frequency: string;
    duration_days: number;
    instructions: string;
  }>>([
    { medication_name: '', dosage: '500 mg', frequency: 'Twice daily after food', duration_days: 7, instructions: 'Drink plenty of water' }
  ]);
  const [isSubmittingRx, setIsSubmittingRx] = useState(false);

  // Review Drawer State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<string>('CONFIRM_URGENCY');
  const [confirmedUrgency, setConfirmedUrgency] = useState<string>('MODERATE');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Facility Matching State
  const [facilityMatches, setFacilityMatches] = useState<FacilityMatch[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [targetDept, setTargetDept] = useState<string>('General Medicine');
  const [referralReason, setReferralReason] = useState<string>('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Close Case State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closureReason, setClosureReason] = useState('');

  const loadCase = async (caseId: string) => {
    setSelectedCaseId(caseId);
    setIsLoadingDetail(true);
    try {
      const detail = await fetchCaseDetail(caseId);
      setCaseDetail(detail);
      setConfirmedUrgency(detail.confirmed_urgency || detail.provisional_urgency);
      setClinicalNotes(detail.reviews[0]?.clinical_notes || '');

      // Load patient medical history
      fetchMedicalHistory(detail.patient_id)
        .then(hist => setPatientMedicalHistory(hist))
        .catch(err => console.warn('Could not load patient medical history:', err));

      // Pre-load facility matches if ready
      if (['AWAITING_CLINICIAN_REVIEW', 'CLINICIAN_REVIEWED', 'ALTERNATIVE_REVIEW_REQUIRED'].includes(detail.current_state)) {
        loadFacilityMatches(caseId);
      }
    } catch (err: any) {
      console.error('Failed to load case:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const loadFacilityMatches = async (caseId: string) => {
    setIsLoadingFacilities(true);
    try {
      const res = await matchFacilitiesForCase(caseId);
      setFacilityMatches(res.matches);
      if (res.matches.length > 0) {
        setSelectedHospitalId(res.matches[0].hospital_id);
      }
    } catch (err: any) {
      console.error('Failed to match facilities:', err);
    } finally {
      setIsLoadingFacilities(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadCase(selectedCaseId);
    } else if (cases.length > 0) {
      loadCase(cases[0].id);
    }
  }, [selectedCaseId, cases.length]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseDetail) return;
    try {
      await submitClinicianReviewApi(caseDetail.id, {
        action: reviewAction,
        confirmed_urgency: confirmedUrgency,
        clinical_notes: clinicalNotes || 'Clinician sign-off approved.',
        override_reason: reviewAction === 'OVERRIDE_URGENCY' ? overrideReason : undefined
      });
      setIsReviewModalOpen(false);
      onRefresh();
      loadCase(caseDetail.id);
    } catch (err: any) {
      alert(`Error submitting review: ${err.message}`);
    }
  };

  const handleAuthorizeReferral = async (isAlternative: boolean = false) => {
    if (!caseDetail || !selectedHospitalId) {
      alert('Please select a hospital.');
      return;
    }
    setIsAuthorizing(true);
    try {
      if (isAlternative) {
        await approveAlternativeReferralApi(caseDetail.id, {
          hospital_id: selectedHospitalId,
          target_department: targetDept,
          referral_reason: referralReason || caseDetail.primary_complaint,
          urgency: confirmedUrgency
        });
      } else {
        await authorizeReferralApi(caseDetail.id, {
          hospital_id: selectedHospitalId,
          target_department: targetDept,
          referral_reason: referralReason || caseDetail.primary_complaint,
          urgency: confirmedUrgency,
          is_alternative: isAlternative
        });
      }
      alert('Referral authorized and dispatched to hospital queue.');
      onRefresh();
      loadCase(caseDetail.id);
    } catch (err: any) {
      alert(`Referral authorization failed: ${err.message}`);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleCloseCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseDetail || !closureReason) return;
    try {
      await closeCaseApi(caseDetail.id, closureReason);
      setIsCloseModalOpen(false);
      setClosureReason('');
      alert('Case closed and clinical outcome documented.');
      onRefresh();
      loadCase(caseDetail.id);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredCases = cases.filter(c => {
    if (urgencyFilter === 'ALL') return true;
    return (c.confirmed_urgency || c.provisional_urgency) === urgencyFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
              Doctor & Care Coordinator Queue
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs text-slate-400">Clinical Verification Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            {currentUser.full_name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Human-in-the-Loop Triage Review, Urgency Overrides, and Care Intelligence Referral Authorization.
          </p>
        </div>

        {/* Urgency Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto text-xs">
          {['ALL', 'EMERGENCY', 'HIGH', 'MODERATE', 'LOW'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setUrgencyFilter(lvl)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                urgencyFilter === lvl
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Cases Queue (5 cols) & Detail/Care Intelligence (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Triage Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Triage & Review Queue ({filteredCases.length})
            </h2>
            <button onClick={onRefresh} className="p-1 text-slate-400 hover:text-white text-xs flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredCases.map(c => {
              const isSelected = c.id === selectedCaseId;
              const isEmergency = c.provisional_urgency === 'EMERGENCY';
              const isRejectionPending = c.current_state === 'ALTERNATIVE_REVIEW_REQUIRED';
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400">{c.case_number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.provisional_urgency === 'EMERGENCY' ? 'bg-red-950 text-red-300 border border-red-800/50' :
                      c.provisional_urgency === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800/50' :
                      'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                    }`}>
                      {c.confirmed_urgency ? `CONFIRMED: ${c.confirmed_urgency}` : `AI: ${c.provisional_urgency}`}
                    </span>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-200 mt-2 line-clamp-1">
                    {c.patient_name} — {c.primary_complaint}
                  </h3>

                  <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
                    <span className="font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/30">
                      {c.current_state.replace(/_/g, ' ')}
                    </span>
                    <span>{c.patient_district}</span>
                  </div>

                  {isRejectionPending && (
                    <div className="mt-2 bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] px-2 py-1 rounded flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Referral Declined — Alternative Review Required</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Case Review & Care Intelligence (7 cols) */}
        <div className="lg:col-span-7">
          {isLoadingDetail ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Clock className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
              <p className="text-sm">Loading clinical details...</p>
            </div>
          ) : !caseDetail ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <p className="text-sm">Select a case from the queue to conduct clinical review.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Patient & Complaint Header */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between border-b border-slate-800 pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400">{caseDetail.case_number}</span>
                      {patientMedicalHistory?.patient_identifier && (
                        <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
                          {patientMedicalHistory.patient_identifier}
                        </span>
                      )}
                      {patientMedicalHistory?.blood_group && (
                        <span className="text-[11px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          Blood: {patientMedicalHistory.blood_group}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-white mt-0.5">{caseDetail.patient_name}</h2>
                    <p className="text-xs text-slate-400">{caseDetail.primary_complaint}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/50 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
                      <span>Medical History</span>
                    </button>
                    <button
                      onClick={() => setIsPrescriptionModalOpen(true)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Issue Rx</span>
                    </button>
                    <button
                      onClick={() => setIsReviewModalOpen(true)}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow"
                    >
                      Conduct Triage Review
                    </button>
                    {caseDetail.current_state !== 'CLOSED' && (
                      <button
                        onClick={() => setIsCloseModalOpen(true)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                      >
                        Document Closure
                      </button>
                    )}
                  </div>
                </div>

                {/* Severe Allergy Safety Alert Gate */}
                {patientMedicalHistory?.allergies?.some(a => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING') && (
                  <div className="bg-red-950/70 border-2 border-red-500/80 rounded-xl p-3.5 flex items-start gap-3 text-red-200">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-red-300 uppercase tracking-wider flex items-center gap-2">
                        <span>Allergy Safety Gate Active</span>
                        <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded font-mono">CRITICAL</span>
                      </div>
                      <p className="text-red-100">
                        Patient has documented severe allergy to:{' '}
                        <strong>
                          {patientMedicalHistory.allergies
                            .filter(a => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING')
                            .map(a => `${a.allergen} (${a.reaction || 'Severe Reaction'})`)
                            .join(', ')}
                        </strong>
                      </p>
                      <p className="text-[11px] text-red-300 italic">
                        Safety Rule: Do NOT prescribe cross-reactive antibiotics or compounds. Verification gate enforced.
                      </p>
                    </div>
                  </div>
                )}

                {/* Objective Vitals Banner */}
                {caseDetail.symptoms?.vitals && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Wind className="w-3 h-3 text-cyan-400" /> SpO2
                      </span>
                      <strong className={`text-sm block mt-0.5 ${
                        caseDetail.symptoms.vitals.spo2 && caseDetail.symptoms.vitals.spo2 < 90 ? 'text-red-400 font-black' : 'text-white'
                      }`}>
                        {caseDetail.symptoms.vitals.spo2 ? `${caseDetail.symptoms.vitals.spo2}%` : 'N/A'}
                      </strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-400" /> Heart Rate
                      </span>
                      <strong className="text-sm block text-white mt-0.5">
                        {caseDetail.symptoms.vitals.heart_rate ? `${caseDetail.symptoms.vitals.heart_rate} bpm` : 'N/A'}
                      </strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-amber-400" /> Blood Pressure
                      </span>
                      <strong className="text-sm block text-white mt-0.5">
                        {caseDetail.symptoms.vitals.blood_pressure || 'N/A'}
                      </strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-teal-400" /> Temperature
                      </span>
                      <strong className="text-sm block text-white mt-0.5">
                        {caseDetail.symptoms.vitals.temperature ? `${caseDetail.symptoms.vitals.temperature}°C` : 'N/A'}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Uploaded Clinical Photo (Section 5 Scenario D) */}
                {caseDetail.images.length > 0 && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">
                      Uploaded Clinical Photograph (Consented)
                    </span>
                    {caseDetail.images.map(img => (
                      <div key={img.id} className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="h-28 w-44 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0">
                          <img
                            src={getImageUrl(img.id)}
                            alt={img.filename}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                        <div className="text-xs text-slate-400 space-y-1">
                          <span className="font-mono text-slate-300">{img.filename}</span>
                          <p className="text-[11px] text-teal-300/90 leading-relaxed bg-teal-950/40 p-2 rounded border border-teal-800/40">
                            {img.ai_cautious_description || 'Supportive visual inspection logged.'}
                          </p>
                          <span className="text-[10px] text-slate-500 italic block">
                            Note: Supportive inspection only. Autonomous medical diagnosis is prohibited.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Provisional Stratification & Red Flags */}
                {caseDetail.triage && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">
                        Agent 1 (Clinical Intake) Evaluation
                      </span>
                      <span className="font-mono text-cyan-400">
                        Rec Specialty: {caseDetail.triage.recommended_specialty}
                      </span>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed">
                      {caseDetail.triage.clinical_rationale}
                    </p>

                    {caseDetail.triage.emergency_flags.length > 0 && (
                      <div className="bg-red-950/60 border border-red-500/50 p-2.5 rounded-lg text-red-200">
                        <strong className="block mb-1 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                          Emergency Warning Signs Detected:
                        </strong>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                          {caseDetail.triage.emergency_flags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Scenario B: Adaptive Recovery Box (Rejection Handling) */}
              {caseDetail.current_state === 'ALTERNATIVE_REVIEW_REQUIRED' && (
                <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-2xl p-5 shadow-xl text-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-white text-sm">
                        Adaptive Recovery Protocol: Hospital Referral Declined
                      </h3>
                    </div>
                    <span className="bg-amber-900 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
                      RECOVERY GATE
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">
                    The initial referral was declined by the hospital. Care Intelligence Agent has analyzed alternative facilities in the regional health network. Renewed clinician sign-off is required prior to transmitting the alternative referral.
                  </p>

                  {/* Previous Decline Reason */}
                  {caseDetail.referrals.length > 0 && (
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-amber-800/40 text-amber-200">
                      <strong>Decline Reason Logged:</strong>{' '}
                      {caseDetail.referrals[0].decline_reason || 'Department capacity exceeded'}
                    </div>
                  )}

                  {/* Alternative Facility Selector */}
                  <div className="space-y-2 pt-2">
                    <span className="font-semibold text-slate-200 block">Select Approved Alternative Facility:</span>
                    <div className="grid grid-cols-1 gap-2">
                      {facilityMatches.map(m => (
                        <label
                          key={m.hospital_id}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selectedHospitalId === m.hospital_id
                              ? 'bg-amber-950/50 border-amber-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="alt_hospital"
                              value={m.hospital_id}
                              checked={selectedHospitalId === m.hospital_id}
                              onChange={() => setSelectedHospitalId(m.hospital_id)}
                              className="accent-amber-500"
                            />
                            <div>
                              <span className="font-bold block">{m.hospital_name}</span>
                              <span className="text-[11px] text-slate-400">{m.facility_type} &bull; {m.distance_estimate}</span>
                            </div>
                          </div>
                          <span className="font-bold text-amber-400 text-xs">{m.capability_score}% Match</span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAuthorizeReferral(true)}
                      disabled={isAuthorizing}
                      className="w-full mt-3 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isAuthorizing ? 'Transmitting...' : 'Clinician Sign-off: Authorize Alternative Referral'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Care Intelligence Facility Matching Engine (Agent 2) */}
              {caseDetail.current_state !== 'ALTERNATIVE_REVIEW_REQUIRED' && caseDetail.current_state !== 'CLOSED' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        Care Intelligence Agent — Facility Matching
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Multi-attribute tiered facility ranking based on specialty, proximity, reported barriers, and verified capacity.
                      </p>
                    </div>
                  </div>

                  {isLoadingFacilities ? (
                    <div className="py-6 text-center text-slate-400">
                      <Clock className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-1" />
                      <span>Calculating matching facilities...</span>
                    </div>
                  ) : facilityMatches.length === 0 ? (
                    <p className="text-slate-400 py-4 text-center">No matching verified facilities found for this specialty.</p>
                  ) : (
                    <div className="space-y-3">
                      {facilityMatches.map(m => {
                        const isChosen = selectedHospitalId === m.hospital_id;
                        return (
                          <div
                            key={m.hospital_id}
                            onClick={() => setSelectedHospitalId(m.hospital_id)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              isChosen
                                ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/20'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-white text-sm">{m.hospital_name}</span>
                                <span className="text-[11px] text-slate-400 block">{m.facility_type} &bull; {m.distance_estimate}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-cyan-400 text-sm">{m.capability_score}%</span>
                                <span className="text-[10px] text-slate-500 block">Match Score</span>
                              </div>
                            </div>

                            {/* Transparent Explainable WHY List */}
                            <div className="mt-2 text-[11px] text-slate-300 space-y-0.5 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                              <strong className="text-slate-400 block text-[10px] uppercase">Explainability Rationale:</strong>
                              {m.match_reasons.map((r, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-teal-300">
                                  <span className="w-1 h-1 rounded-full bg-teal-400" />
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>

                            {/* Freshness Disclaimer */}
                            {m.freshness_warning && (
                              <span className="text-[10px] text-slate-500 block mt-1.5 italic">
                                {m.freshness_warning}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Authorize Referral Button */}
                      <div className="pt-2">
                        <button
                          onClick={() => handleAuthorizeReferral(false)}
                          disabled={isAuthorizing || !selectedHospitalId}
                          className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          <span>{isAuthorizing ? 'Authorizing Referral...' : 'Clinician Authorization: Dispatch Referral to Hospital Queue'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal / Drawer */}
      {isReviewModalOpen && caseDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Clinician Review & Urgency Classification</h3>
              <button onClick={() => setIsReviewModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Clinical Action</label>
                <select
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="CONFIRM_URGENCY">Confirm Proposed Urgency</option>
                  <option value="OVERRIDE_URGENCY">Override Urgency</option>
                  <option value="REQUEST_MORE_INFO">Request Additional Patient History</option>
                  <option value="APPROVE_REFERRAL">Authorize Direct Referral</option>
                  <option value="CLOSE_ROUTINE">Close as Routine (Self-Care Advice Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirmed Urgency Classification</label>
                <select
                  value={confirmedUrgency}
                  onChange={(e) => setConfirmedUrgency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="LOW">LOW — Routine outpatient guidance</option>
                  <option value="MODERATE">MODERATE — Standard secondary referral</option>
                  <option value="HIGH">HIGH — Priority secondary / tertiary assessment</option>
                  <option value="EMERGENCY">EMERGENCY — Immediate life-threatening intervention</option>
                </select>
              </div>

              {reviewAction === 'OVERRIDE_URGENCY' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Override Clinical Rationale *</label>
                  <input
                    type="text"
                    required
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Document clinical reason for overriding AI recommendation..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Clinical Notes & Directions *</label>
                <textarea
                  required
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Record formal assessment, recommended diagnostic workup, or pre-referral directives..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl"
                >
                  Save Clinical Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Case Modal */}
      {isCloseModalOpen && caseDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Document Final Case Closure</h3>
            <p className="text-xs text-slate-400">
              Only authorized clinicians or coordinators may document formal care completion (Section 8 Step 13).
            </p>
            <form onSubmit={handleCloseCase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Closure Rationale *</label>
                <textarea
                  required
                  rows={3}
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="e.g. Care pathway completed & documented; follow-up verified; patient recovered..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg"
                >
                  Confirm Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical History Modal */}
      {isHistoryModalOpen && caseDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  Patient Medical History & Safety Profile — {caseDetail.patient_name}
                </h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!patientMedicalHistory ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading medical profile...</p>
            ) : (
              <div className="space-y-4 text-xs">
                {/* ID & Blood Group */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-wrap gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Patient ID</span>
                    <span className="font-mono font-bold text-teal-400">{patientMedicalHistory.patient_identifier}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Blood Group</span>
                    <span className="font-bold text-white">{patientMedicalHistory.blood_group || 'O+'}</span>
                  </div>
                </div>

                {/* Allergies */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-red-300 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400" /> Allergies & Adverse Drug Reactions
                  </h4>
                  {patientMedicalHistory.allergies.length === 0 ? (
                    <p className="text-slate-500">No known allergies on record.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {patientMedicalHistory.allergies.map(a => (
                        <div key={a.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-200">{a.allergen}</span>
                            {a.reaction && <span className="text-slate-400 ml-2">Reaction: {a.reaction}</span>}
                            {a.notes && <div className="text-[11px] text-slate-500">{a.notes}</div>}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {a.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conditions */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-teal-300 text-xs">Diagnosed Chronic / Active Conditions</h4>
                  {patientMedicalHistory.conditions.length === 0 ? (
                    <p className="text-slate-500">No conditions recorded.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {patientMedicalHistory.conditions.map(c => (
                        <div key={c.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-200">{c.condition_name}</span>
                            {c.notes && <p className="text-[11px] text-slate-400 mt-0.5">{c.notes}</p>}
                          </div>
                          <span className="text-[10px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded">
                            {c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Regular Medications */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-slate-300 text-xs flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-400" /> Current Medications
                  </h4>
                  {patientMedicalHistory.medications.length === 0 ? (
                    <p className="text-slate-500">None documented.</p>
                  ) : (
                    <div className="space-y-1">
                      {patientMedicalHistory.medications.map(m => (
                        <div key={m.id} className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                          <span className="text-slate-200 font-semibold">{m.medication_name} ({m.dosage})</span>
                          <span className="text-slate-400">{m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Digital Prescription Modal */}
      {isPrescriptionModalOpen && caseDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">
                  Issue Digital Prescription — {caseDetail.patient_name}
                </h3>
              </div>
              <button onClick={() => setIsPrescriptionModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contraindication reminder */}
            {patientMedicalHistory?.allergies?.some(a => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING') && (
              <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl text-[11px] text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  Safety Check: Patient has <strong>{patientMedicalHistory.allergies.filter(a => a.severity === 'SEVERE').map(a => a.allergen).join(', ')}</strong> allergy. Avoid all contraindicated formulations.
                </span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const validItems = rxItems.filter(i => i.medication_name.trim());
                if (validItems.length === 0) {
                  alert('Please enter at least one medication item.');
                  return;
                }
                setIsSubmittingRx(true);
                try {
                  const res = await createPrescriptionApi({
                    patient_id: caseDetail.patient_id,
                    case_id: caseDetail.id,
                    diagnosis: rxDiagnosis || caseDetail.primary_complaint,
                    general_instructions: rxInstructions,
                    valid_until: rxValidUntil,
                    items: validItems
                  });
                  alert(`Prescription ${res.prescription_code} issued successfully!`);
                  setIsPrescriptionModalOpen(false);
                  setRxDiagnosis('');
                  setRxInstructions('');
                } catch (err: any) {
                  alert(err.message || 'Failed to issue prescription.');
                } finally {
                  setIsSubmittingRx(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Type 2 Diabetes Mellitus with Peripheral Dysesthesia"
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Medication Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">Medications ({rxItems.length})</label>
                  <button
                    type="button"
                    onClick={() => setRxItems([...rxItems, { medication_name: '', dosage: '500 mg', frequency: 'Twice daily', duration_days: 7, instructions: '' }])}
                    className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                {rxItems.map((item, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Medication name (e.g. Metformin, Cetirizine)"
                        value={item.medication_name}
                        onChange={(e) => {
                          const updated = [...rxItems];
                          updated[idx].medication_name = e.target.value;
                          setRxItems(updated);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                      />
                      {rxItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRxItems(rxItems.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Dosage</span>
                        <input
                          type="text"
                          placeholder="e.g. 500 mg"
                          value={item.dosage}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].dosage = e.target.value;
                            setRxItems(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Frequency</span>
                        <input
                          type="text"
                          placeholder="e.g. Twice daily"
                          value={item.frequency}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].frequency = e.target.value;
                            setRxItems(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Duration (Days)</span>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={item.duration_days}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].duration_days = Number(e.target.value);
                            setRxItems(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Special instructions (e.g. Take after food with water)"
                      value={item.instructions}
                      onChange={(e) => {
                        const updated = [...rxItems];
                        updated[idx].instructions = e.target.value;
                        setRxItems(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-[11px]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">General Dietary / Lifestyle Directives</label>
                <textarea
                  rows={2}
                  placeholder="Low sodium diet, hydration, 30-min walking..."
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPrescriptionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRx}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  {isSubmittingRx ? <Clock className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
                  <span>Sign & Issue Digital Rx</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
