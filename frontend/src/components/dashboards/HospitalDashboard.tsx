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
  UserCheck
} from 'lucide-react';
import { UserProfile, CaseSummary } from '../../types/curareach';
import { 
  fetchHospitalProfile, 
  updateHospitalCapacityApi, 
  fetchHospitalReferrals, 
  respondToReferralApi, 
  confirmAppointmentApi,
  reportEncounterStatusApi 
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
  const [isLoading, setIsLoading] = useState(true);

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
      const [profRes, refsRes] = await Promise.all([
        fetchHospitalProfile(),
        fetchHospitalReferrals()
      ]);
      setProfile(profRes);
      setTotalBeds(profRes.total_beds);
      setAvailableBeds(profRes.available_beds);
      setHasIcu(profRes.has_icu);
      setHasOxygen(profRes.has_oxygen_manifold);
      setReferrals(refsRes);
    } catch (err: any) {
      console.error('Failed to load hospital data:', err);
    } finally {
      setIsLoading(false);
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

      {/* Incoming Referrals Queue */}
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
                    <div className="bg-teal-950/40 border border-teal-800/40 p-3 rounded-xl text-teal-200 text-[11px] space-y-1">
                      <div className="font-bold text-teal-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmed Appointment Slot
                      </div>
                      <div>Scheduled: <strong>{r.appointment.scheduled_at}</strong></div>
                      <div>Doctor: {r.appointment.doctor_name}</div>
                      <div>Arrival Status: <strong className="text-white">{r.appointment.arrival_status}</strong></div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => setEncounterAppt(r.appointment)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold"
                        >
                          Log Arrival / Document Consultation
                        </button>
                        <button
                          onClick={() => handleReportNoShow(r.appointment.id)}
                          className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-200 rounded text-[10px] border border-amber-800/40"
                        >
                          Patient No-Show
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
    </div>
  );
};
