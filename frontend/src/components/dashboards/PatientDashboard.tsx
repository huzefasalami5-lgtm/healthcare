import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { CaseSummary, CaseDetail, TimelineEvent, UserProfile } from '../../types/curareach';
import { 
  createCaseApi, 
  submitIntakeApi, 
  uploadMedicalPhotoApi, 
  fetchCaseDetail, 
  fetchCaseTimeline,
  reportEncounterStatusApi
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
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(cases[0]?.id || null);
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);

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

  React.useEffect(() => {
    if (selectedCaseId) {
      loadCaseDetail(selectedCaseId);
    } else if (cases.length > 0) {
      loadCaseDetail(cases[0].id);
    }
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
    return 5; // CARE_ENCOUNTER_REPORTED, FOLLOW_UP_PENDING, FOLLOW_UP_COMPLETED, CLOSED
  };

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
          <h1 className="text-2xl font-bold text-white mt-1">
            Welcome, {currentUser.full_name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
            <span>District: <strong>{currentUser.profile?.district || 'Shivamogga'}</strong></span>
            <span>Phone: <strong>{currentUser.phone || '+91-98450-XXXXX'}</strong></span>
            {currentUser.profile?.transport_barrier && (
              <span className="text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded text-[11px] border border-amber-600/40">
                Transport Assistance Flagged
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => setIsNewCaseOpen(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-900/30 transition-all text-sm self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Healthcare Case</span>
        </button>
      </div>

      {/* Main Grid: Cases List on Left, Case Detail & Timeline on Right */}
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
                      <p className="text-xs text-red-200 mt-1 leading-relaxed">
                        Deterministic clinical red flags detected. This condition requires immediate physical emergency medical care. Ordinary referral and appointment queues are bypassed.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <a
                          href="tel:112"
                          className="px-4 py-2 bg-white text-red-900 font-extrabold rounded-xl text-sm shadow hover:bg-red-50 flex items-center gap-2"
                        >
                          <PhoneCall className="w-4 h-4" />
                          <span>Call National Emergency: 112 (India)</span>
                        </a>
                        <span className="text-xs text-red-300 italic">
                          (Never wait for online messaging during cardiac or respiratory distress)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Journey Step Progress Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>Care Coordination Pathway</span>
                  <span className="text-teal-400 font-mono">Stage {getJourneyStep(caseDetail.current_state)} of 5</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                  {[
                    { step: 1, label: '1. Intake', desc: 'Symptoms Logged' },
                    { step: 2, label: '2. Review', desc: 'Clinician Sign-off' },
                    { step: 3, label: '3. Referral', desc: 'Facility Matching' },
                    { step: 4, label: '4. Appointment', desc: 'Confirmed Visit' },
                    { step: 5, label: '5. Follow-Up', desc: 'Care Rescue' }
                  ].map((s) => {
                    const currentStep = getJourneyStep(caseDetail.current_state);
                    const isDone = s.step < currentStep;
                    const isCurrent = s.step === currentStep;
                    return (
                      <div
                        key={s.step}
                        className={`p-2 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-teal-950/60 border-teal-500/50 text-teal-200'
                            : isCurrent
                            ? 'bg-teal-600 text-white border-teal-400 shadow-md font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div>{s.label}</div>
                        <div className="text-[9px] opacity-80 mt-0.5">{s.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Case Overview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono text-slate-400">Case ID: {caseDetail.case_number}</span>
                    <h2 className="text-lg font-bold text-white mt-0.5">{caseDetail.primary_complaint}</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">Urgency:</span>
                    {getUrgencyBadge(caseDetail.confirmed_urgency || caseDetail.provisional_urgency)}
                  </div>
                </div>

                {/* AI Provisional vs Clinician Urgency Status Notice */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">
                      {caseDetail.confirmed_urgency
                        ? `Clinician Verified Urgency: ${caseDetail.confirmed_urgency}`
                        : `Provisional AI Recommendation: ${caseDetail.provisional_urgency}`}
                    </span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {caseDetail.confirmed_urgency
                        ? `Reviewed and authorized by ${caseDetail.clinician_name || 'medical officer'}.`
                        : 'Provisional AI assessment pending human clinician verification. AI recommendations do not replace a medical consultation.'}
                    </p>
                  </div>
                </div>

                {/* Confirmed Appointment Card (Section 8 Step 10) */}
                {caseDetail.referrals.some(r => r.appointment && r.appointment.status === 'CONFIRMED') && (
                  <div className="bg-gradient-to-r from-teal-950/80 to-slate-900 border border-teal-500/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold text-teal-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmed Hospital Appointment
                      </span>
                      <span className="text-xs font-mono bg-teal-900/60 text-teal-200 px-2 py-0.5 rounded">
                        CONFIRMED
                      </span>
                    </div>

                    {caseDetail.referrals.filter(r => r.appointment).map(r => (
                      <div key={r.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
                        <div>
                          <strong className="text-slate-400 block text-[11px]">Facility:</strong>
                          <span className="font-semibold text-white">{r.hospital_name}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 block text-[11px]">Date & Time:</strong>
                          <span className="font-semibold text-teal-300">{r.appointment?.scheduled_at}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 block text-[11px]">Specialist:</strong>
                          <span>{r.appointment?.doctor_name} ({r.appointment?.department})</span>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          const apptId = caseDetail.referrals.find(r => r.appointment)?.appointment?.scheduled_at;
                          // Trigger missed visit report
                          const ref = caseDetail.referrals.find(r => r.appointment);
                          if (ref) {
                            handleReportMissedAppointment(ref.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 rounded-lg text-xs font-medium border border-amber-700/50"
                      >
                        Cannot Attend / Missed Visit
                      </button>
                    </div>
                  </div>
                )}

                {/* Follow-up Tasks / Reminders */}
                {caseDetail.tasks.length > 0 && (
                  <div className="border-t border-slate-800 pt-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Care Tasks & Follow-up Checklist
                    </h3>
                    <div className="space-y-2">
                      {caseDetail.tasks.map(t => (
                        <div key={t.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-200">{t.description}</span>
                            {t.due_date && <span className="text-[11px] text-teal-400 block mt-0.5">Due: {t.due_date}</span>}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Case Audit Timeline */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Verifiable Case Timeline & Audit Journal
                </h3>
                <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative pl-8 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-teal-500 border-2 border-slate-900" />
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200">{event.transition_event}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{event.evidence_notes}</p>
                      <span className="text-[10px] text-teal-400/80 font-mono">
                        By: {event.actor_name} ({event.actor_role})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Healthcare Case Modal */}
      {isNewCaseOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Create New Healthcare Case</h3>
                <p className="text-xs text-slate-400">Structured clinical intake for appropriate triage and referral coordination</p>
              </div>
              <button onClick={() => setIsNewCaseOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Primary Health Complaint *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Persistent productive cough, skin rash on arm, acute knee pain"
                  value={primaryComplaint}
                  onChange={(e) => setPrimaryComplaint(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Detailed Symptom Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your symptoms, how they started, and any associated discomfort..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Onset & Duration
                  </label>
                  <input
                    type="text"
                    value={onsetDuration}
                    onChange={(e) => setOnsetDuration(e.target.value)}
                    placeholder="e.g. 3 days, 1 week"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Self-Reported Severity: <strong className="text-teal-400">{severity}/10</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full accent-teal-500 mt-2"
                  />
                </div>
              </div>

              {/* Optional Vitals */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block">Optional Bedside Vitals (if available)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400">Oxygen Saturation (SpO2 %)</label>
                    <input
                      type="number"
                      placeholder="e.g. 97"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 37.2"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Skin-Photo Upload (Section 5) */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-teal-400" />
                    Optional Photo-Assisted Intake (Skin / Visible Condition)
                  </span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WebP &lt; 10MB</span>
                </div>

                {!photoPreview ? (
                  <label className="border border-dashed border-slate-700 hover:border-teal-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/40">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-slate-300 text-xs font-medium">Click or tap to capture/upload image</span>
                    <span className="text-[10px] text-slate-500">Stored privately in secure clinical storage</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative inline-block border border-teal-500/50 rounded-xl overflow-hidden">
                    <img src={photoPreview} alt="Preview" className="h-28 w-44 object-cover" />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-1 right-1 p-1 bg-red-600 rounded-full text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {photoFile && (
                  <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={photoConsent}
                      onChange={(e) => setPhotoConsent(e.target.checked)}
                      className="accent-teal-500"
                    />
                    <span className="text-[11px] text-slate-300">
                      I explicitly consent to uploading this medical image for clinical triage review.
                    </span>
                  </label>
                )}
              </div>

              {/* Consent Notice */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                By submitting this case, you consent to care navigation, provisional triage stratification, and authorized referral coordination under the CuraReach 360 platform terms.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCaseOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Evaluating with Clinical Intake Agent...' : 'Submit Case for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
