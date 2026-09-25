import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  MapPin, 
  ShieldCheck, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Save, 
  Send, 
  X,
  AlertCircle
} from 'lucide-react';
import { UserProfile, FollowUpTask, CaseSummary } from '../../types/curareach';
import { 
  fetchAssignedPatients, 
  assistedPatientRegisterApi, 
  createCaseApi, 
  submitIntakeApi, 
  saveDraftIntakeApi, 
  fetchTasks, 
  completeTaskApi, 
  escalateTaskApi, 
  reportBarrierApi 
} from '../../services/curareachApi';

interface WorkerDashboardProps {
  currentUser: UserProfile;
  cases: CaseSummary[];
  onRefresh: () => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({
  currentUser,
  cases,
  onRefresh
}) => {
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Assisted Intake Modal State
  const [isAssistedModalOpen, setIsAssistedModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [transportBarrier, setTransportBarrier] = useState(true);
  const [complaint, setComplaint] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('5 days');
  const [severity, setSeverity] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<string | null>(null);

  // Complete Task Modal
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [workerNotes, setWorkerNotes] = useState('');
  const [barrierReported, setBarrierReported] = useState('');

  // Escalate Task Modal
  const [escalatingTask, setEscalatingTask] = useState<FollowUpTask | null>(null);
  const [escalationReason, setEscalationReason] = useState('');

  // Barrier Report Modal
  const [isBarrierModalOpen, setIsBarrierModalOpen] = useState(false);
  const [barrierCaseId, setBarrierCaseId] = useState('');
  const [barrierCategory, setBarrierCategory] = useState('Transport');
  const [barrierDesc, setBarrierDesc] = useState('');

  const loadWorkerData = async () => {
    setIsLoading(true);
    try {
      const [patientsRes, tasksRes] = await Promise.all([
        fetchAssignedPatients(),
        fetchTasks()
      ]);
      setAssignedPatients(patientsRes);
      setTasks(tasksRes);
    } catch (err: any) {
      console.error('Failed to load worker data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkerData();
  }, []);

  const handleAssistedSubmit = async (asDraft: boolean) => {
    if (!patientName.trim() || !complaint.trim()) {
      alert('Patient name and primary complaint are required.');
      return;
    }
    setIsSubmitting(true);
    setModalFeedback(null);
    try {
      // 1. Assisted register patient
      const reg = await assistedPatientRegisterApi({
        full_name: patientName,
        phone: patientPhone || '+91-98450-77661',
        address: patientAddress || 'Rural Sector, Kudligere',
        transport_access_barrier: transportBarrier,
        district: 'Shivamogga'
      });

      // 2. Create case with worker assignment
      const newCase = await createCaseApi({
        primary_complaint: complaint,
        patient_id: reg.patient_id,
        health_data_consent: true,
        referral_consent: true,
        worker_assistance_consent: true
      });

      // 3. Submit or save draft
      if (asDraft) {
        await saveDraftIntakeApi(newCase.id, {
          main_complaint: complaint,
          description: description || complaint,
          onset_duration: duration,
          reported_severity: severity
        });
        setModalFeedback('Draft intake saved successfully for offline/field resume.');
      } else {
        await submitIntakeApi(newCase.id, {
          main_complaint: complaint,
          description: description || complaint,
          onset_duration: duration,
          reported_severity: severity
        });
        setModalFeedback('Assisted intake submitted directly to Doctor Review Queue.');
      }

      setTimeout(() => {
        setIsAssistedModalOpen(false);
        setModalFeedback(null);
        setPatientName('');
        setComplaint('');
        setDescription('');
        loadWorkerData();
        onRefresh();
      }, 1500);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await completeTaskApi(selectedTask.id, {
        worker_notes: workerNotes,
        barrier_reported: barrierReported || undefined
      });
      setSelectedTask(null);
      setWorkerNotes('');
      setBarrierReported('');
      loadWorkerData();
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEscalateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalatingTask || !escalationReason) return;
    try {
      await escalateTaskApi(escalatingTask.id, escalationReason);
      setEscalatingTask(null);
      setEscalationReason('');
      loadWorkerData();
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleReportBarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barrierCaseId || !barrierDesc) return;
    try {
      await reportBarrierApi(barrierCaseId, barrierCategory, barrierDesc);
      setIsBarrierModalOpen(false);
      setBarrierDesc('');
      alert('Access barrier recorded and mitigation task created.');
      loadWorkerData();
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile & Operational Sector Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
              Community Health Worker Portal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-400">Assisted Access Grid</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            {currentUser.full_name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Service Sector: <strong>{currentUser.profile?.service_area || 'Kudligere & Holalur Sector'}</strong>
            </span>
            <span>Supervisor: <strong>{currentUser.profile?.supervisor || 'Dr. Ananya Sen'}</strong></span>
            <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded text-[11px] border border-emerald-800/40">
              {currentUser.profile?.training_status || 'Certified Level 2 Navigation'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBarrierModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
          >
            Report Access Barrier
          </button>
          <button
            onClick={() => setIsAssistedModalOpen(true)}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Assisted Patient Registration</span>
          </button>
        </div>
      </div>

      {/* Grid: Assigned Patients & Follow-Up Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assigned Patients Roster (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              My Assigned Patients ({assignedPatients.length})
            </h2>
            <span className="text-[11px] text-slate-500 italic">
              (Isolated access: assigned roster only)
            </span>
          </div>

          <div className="space-y-3">
            {assignedPatients.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                No patients currently assigned to your sector roster.
              </div>
            ) : (
              assignedPatients.map((p) => (
                <div
                  key={p.patient_id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-all text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{p.full_name}</span>
                    <span className="font-mono text-slate-400">{p.phone}</span>
                  </div>

                  <div className="text-slate-400">
                    <span>Address: {p.address} ({p.district})</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {p.transport_barrier && (
                        <span className="bg-amber-950 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-800/50">
                          Transport Barrier
                        </span>
                      )}
                      {p.latest_case_number && (
                        <span className="font-mono text-teal-400 text-[10px]">
                          Case: {p.latest_case_number}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setPatientName(p.full_name);
                        setPatientPhone(p.phone);
                        setPatientAddress(p.address || '');
                        setIsAssistedModalOpen(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold"
                    >
                      Conduct Assisted Intake &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Care Rescue Follow-Up Tasks (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Care Rescue Task Queue ({tasks.length})
            </h2>
            <span className="text-[11px] text-teal-400">Active Longitudinal Checklist</span>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                No pending follow-up or rescue tasks.
              </div>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  className={`bg-slate-900 border rounded-xl p-4 text-xs space-y-3 transition-all ${
                    t.status === 'COMPLETED'
                      ? 'border-emerald-800/40 opacity-75'
                      : t.status === 'ESCALATED'
                      ? 'border-red-500/60 bg-red-950/20'
                      : 'border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-200">{t.patient_name}</span>
                      <span className="font-mono text-[10px] text-slate-500 ml-2">({t.case_number})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' :
                      t.status === 'ESCALATED' ? 'bg-red-950 text-red-300 border border-red-800/40' :
                      'bg-amber-950 text-amber-300 border border-amber-800/40'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">{t.description}</p>

                  {t.worker_notes && (
                    <div className="bg-slate-950 p-2 rounded text-[11px] text-slate-400 border border-slate-800">
                      <strong>Worker Log:</strong> {t.worker_notes}
                    </div>
                  )}

                  {t.status !== 'COMPLETED' && (
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setEscalatingTask(t)}
                        className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-200 rounded text-[11px] font-medium border border-red-800/40"
                      >
                        Escalate
                      </button>
                      <button
                        onClick={() => setSelectedTask(t)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold"
                      >
                        Mark Completed
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assisted Patient Intake Modal with Draft Save (Section 16) */}
      {isAssistedModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Assisted Patient Intake</h3>
                <p className="text-xs text-amber-400">Consent-based community navigation assistance</p>
              </div>
              <button onClick={() => setIsAssistedModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalFeedback && (
              <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-200">
                {modalFeedback}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Manjula Gowda"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+91-98450-XXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Village / Address</label>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  placeholder="e.g. Near Kudligere Bus Stop, Shivamogga Taluk"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <label className="flex items-center space-x-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={transportBarrier}
                  onChange={(e) => setTransportBarrier(e.target.checked)}
                  className="accent-amber-500"
                />
                <span>Patient flags road transport / vehicle barrier</span>
              </label>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Complaint *</label>
                <input
                  type="text"
                  required
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="e.g. Bilateral knee swelling, inability to bear weight"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Symptoms & Observations</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Field observations during domiciliary visit..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Onset & Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Severity: <strong>{severity}/10</strong></label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    className="w-full accent-amber-500 mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAssistedSubmit(true)}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Draft (Field Mode)</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleAssistedSubmit(false)}
                  className="flex items-center space-x-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Doctor Queue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Complete Care Rescue Task</h3>
            <p className="text-xs text-slate-400">{selectedTask.description}</p>
            <form onSubmit={handleCompleteTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resolution Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={workerNotes}
                  onChange={(e) => setWorkerNotes(e.target.value)}
                  placeholder="Document visit results, patient condition, or confirmation..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                >
                  Submit Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Task Modal */}
      {escalatingTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Escalate to Doctor / Coordinator
            </h3>
            <p className="text-xs text-slate-400">{escalatingTask.description}</p>
            <form onSubmit={handleEscalateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Escalation Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="e.g. Patient condition worsening, unreachable after multiple attempts, severe financial or transit barrier..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEscalatingTask(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                >
                  Confirm Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Barrier Modal */}
      {isBarrierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Log Patient Access Barrier</h3>
              <button onClick={() => setIsBarrierModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReportBarrier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Case *</label>
                <select
                  required
                  value={barrierCaseId}
                  onChange={(e) => setBarrierCaseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="">-- Choose Assigned Case --</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_number} — {c.patient_name} ({c.primary_complaint})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Barrier Category</label>
                <select
                  value={barrierCategory}
                  onChange={(e) => setBarrierCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  <option value="Transport">Road / Vehicle Transport Obstacle</option>
                  <option value="Financial">Economic Hardship / Fee Inability</option>
                  <option value="Hospital Contact">Unable to Reach Hospital Desk</option>
                  <option value="Mobility">Severe Mobility / Physical Frailty</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Barrier Details *</label>
                <textarea
                  required
                  rows={3}
                  value={barrierDesc}
                  onChange={(e) => setBarrierDesc(e.target.value)}
                  placeholder="Describe the exact obstacle preventing the patient from completing care..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBarrierModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg"
                >
                  Record Barrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
