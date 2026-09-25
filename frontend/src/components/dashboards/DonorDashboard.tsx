import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Droplet, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Share2, 
  ExternalLink, 
  RefreshCw, 
  Bell, 
  User, 
  MapPin, 
  Calendar, 
  Award,
  Lock,
  Eye,
  Info,
  Users,
  PlusCircle
} from 'lucide-react';
import {
  getDonorProfileApi,
  updateDonorPreferencesApi,
  updateDonorAvailabilityApi,
  updateDonorConsentApi,
  getDonorInvitationsApi,
  respondToInvitationApi,
  getDonorActivityApi,
  recordEducationalPledgeApi
} from '../../services/curareachApi';
import { LifeLinkRegistrationModal } from '../lifelink/LifeLinkRegistrationModal';
import { FamilyEnquiriesPanel } from '../lifelink/FamilyEnquiriesPanel';

interface DonorDashboardProps {
  currentUser?: any;
  onRefresh?: () => void;
  onUserChange?: (user: any) => void;
}

export const DonorDashboard: React.FC<DonorDashboardProps> = ({ currentUser, onRefresh, onUserChange }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'interests' | 'availability' | 'requests' | 'activity' | 'privacy' | 'official' | 'enquiries'>('requests');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [activity, setActivity] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [willingToTravel, setWillingToTravel] = useState(true);
  const [livingOrganInterest, setLivingOrganInterest] = useState('');
  const [tissueInterest, setTissueInterest] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('AVAILABLE');
  const [notifConsent, setNotifConsent] = useState(true);
  const [nottoReference, setNottoReference] = useState('');

  // Invitation response modal
  const [selectedInvite, setSelectedInvite] = useState<any>(null);
  const [contactSharingApproved, setContactSharingApproved] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    loadDonorData();
  }, [currentUser]);

  const loadDonorData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [profData, invsData, actData] = await Promise.all([
        getDonorProfileApi().catch(() => null),
        getDonorInvitationsApi().catch(() => []),
        getDonorActivityApi().catch(() => null)
      ]);

      if (profData) {
        setProfile(profData);
        setAvailabilityStatus(profData.availability || 'AVAILABLE');
        const bloodPref = profData.preferences?.find((p: any) => p.category === 'BLOOD');
        if (bloodPref) {
          setBloodGroup(bloodPref.blood_group || 'O-');
          setWillingToTravel(bloodPref.willing_to_travel ?? true);
        }
        const notif = profData.consents?.find((c: any) => c.type === 'REQUEST_NOTIFICATIONS');
        setNotifConsent(notif ? notif.granted : true);
      }
      setInvitations(invsData || []);
      setActivity(actData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load donor portal');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSubmittingAction(true);
      await updateDonorPreferencesApi({
        self_reported_blood_group: bloodGroup,
        willing_to_travel: willingToTravel,
        living_organ_interest: livingOrganInterest,
        tissue_interest: tissueInterest
      });
      setSuccessMsg('Donation preferences updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadDonorData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateAvailability = async (newStatus: string) => {
    try {
      setSubmittingAction(true);
      await updateDonorAvailabilityApi(newStatus);
      setAvailabilityStatus(newStatus);
      setSuccessMsg(`Availability updated to ${newStatus}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleNotificationConsent = async () => {
    try {
      const nextVal = !notifConsent;
      await updateDonorConsentApi('REQUEST_NOTIFICATIONS', nextVal);
      setNotifConsent(nextVal);
      setSuccessMsg(nextVal ? 'Opted in to emergency broadcast notifications.' : 'Notification consent withdrawn. Future invitations paused.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRespondInvitation = async (responseType: 'ACCEPT' | 'DECLINE') => {
    if (!selectedInvite) return;
    try {
      setSubmittingAction(true);
      await respondToInvitationApi(selectedInvite.id, responseType, contactSharingApproved);
      setSuccessMsg(responseType === 'ACCEPT' 
        ? (contactSharingApproved ? 'Invitation accepted & contact information securely authorized.' : 'Invitation accepted without contact disclosure.')
        : 'Invitation declined.');
      setSelectedInvite(null);
      setContactSharingApproved(false);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadDonorData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRecordNottoPledge = async () => {
    try {
      setSubmittingAction(true);
      await recordEducationalPledgeApi('DECEASED_ORGAN_PLEDGE', nottoReference);
      setSuccessMsg('Pledge recorded. Thank you for your commitment to voluntary donation.');
      setNottoReference('');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadDonorData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-rose-500 mb-3" />
        <p>Connecting to CuraReach LifeLink Network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 p-6 border border-rose-800/40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> LifeLink Volunteer Donor Network
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                100% Free & Voluntary
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Welcome, {profile?.full_name || 'Volunteer Donor'}
              <span className="text-sm font-normal text-rose-300 font-mono">({profile?.donor_reference || 'CR-DON-2026-1001'})</span>
            </h1>
            <p className="text-slate-300 text-sm">
              Be a Volunteer Donor. Help Connect Care. CuraReach facilitates consent-based introductions for verified hospitals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsRegModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-950 flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register / Deceased Enquiry</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-right">
              <div className="text-xs text-slate-400">Self-Reported Blood Group</div>
              <div className="text-xl font-bold text-rose-400 font-mono flex items-center justify-end gap-1">
                <Droplet className="w-4 h-4 fill-rose-400 text-rose-400" /> {bloodGroup}
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-right">
              <div className="text-xs text-slate-400">Availability</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> {availabilityStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/80 border border-rose-700/60 text-rose-200 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'requests', label: 'Incoming Requests', count: invitations.filter(i => i.invitation_status === 'PENDING').length, icon: Bell },
          { id: 'enquiries', label: 'Family Enquiries', icon: Users },
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'interests', label: 'Donation Interests', icon: Droplet },
          { id: 'availability', label: 'Availability', icon: Clock },
          { id: 'activity', label: 'My Activity', icon: Award },
          { id: 'privacy', label: 'Consent & Privacy', icon: Shield },
          { id: 'official', label: 'Official Donation Info', icon: ExternalLink }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-xs font-bold font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: INCOMING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-400" />
              Verified Hospital Emergency Requests
            </h2>
            <button 
              onClick={loadDonorData}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Requests
            </button>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Privacy Guarantee:</strong> You were notified because your self-reported blood group matches a verified hospital request and you opted into alerts.
              <strong> Your name and phone number will NEVER be shared with the hospital unless you explicitly grant separate contact-sharing authorization.</strong>
            </div>
          </div>

          {invitations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-white font-medium">No Pending Requests</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                There are currently no urgent blood requests matching your profile in your district. You will be alerted when a verified hospital posts a compatible need.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {invitations.map((inv) => (
                <div 
                  key={inv.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    inv.invitation_status === 'ACCEPTED'
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : inv.invitation_status === 'DECLINED'
                      ? 'bg-slate-900/30 border-slate-800 opacity-60'
                      : 'bg-slate-900/80 border-slate-700 shadow-lg hover:border-rose-700/60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 font-mono">
                          {inv.requested_blood_group || 'O-'} Required
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {inv.city}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          inv.invitation_status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          inv.invitation_status === 'DECLINED' ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {inv.invitation_status}
                        </span>
                      </div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        {inv.hospital_name}
                      </div>
                      <p className="text-xs text-slate-300 max-w-2xl">
                        {inv.description || 'Emergency requirement for hospitalized patient.'}
                      </p>
                      <div className="text-xs text-slate-400 flex items-center gap-4">
                        <span>Units Needed: <strong className="text-white">{inv.units_needed || 1} Unit(s)</strong></span>
                        <span>Expires: <strong className="text-slate-300">{new Date(inv.expires_at).toLocaleString()}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {inv.invitation_status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => setSelectedInvite(inv)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold shadow-lg shadow-rose-900/40 flex items-center gap-1.5"
                          >
                            <Heart className="w-4 h-4" /> Respond to Request
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          Responded on {new Date(inv.responded_at || inv.sent_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: FAMILY ENQUIRIES */}
      {activeTab === 'enquiries' && (
        <FamilyEnquiriesPanel onOpenNewEnquiry={() => setIsRegModalOpen(true)} />
      )}

      {/* TAB 2: MY PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-rose-400" />
            Volunteer Donor Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Unique Donor Reference</div>
              <div className="text-base font-mono font-bold text-white">{profile?.donor_reference}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Full Name</div>
              <div className="text-base font-bold text-white">{profile?.full_name}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">City / District</div>
              <div className="text-base text-white">{profile?.city}, {profile?.district} ({profile?.state})</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Preferred Language</div>
              <div className="text-base text-white">{profile?.preferred_language || 'English'}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Account Status</div>
              <div className="text-base text-emerald-400 font-semibold">{profile?.account_status}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Age Requirement</div>
              <div className="text-base text-emerald-400 font-semibold">Verified Adult (18+)</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DONATION INTERESTS */}
      {activeTab === 'interests' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-rose-400" />
              Donation Interests & Self-Reported Compatibility
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Specify your donation categories. Note: CuraReach never charges for donations or sells donor data.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Self-Reported Blood Group</label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`py-2 px-3 rounded-xl font-bold font-mono text-sm transition-all border ${
                      bloodGroup === bg
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 italic flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 inline" />
                Self-reported blood group is not proof of compatibility. Registered hospitals handle pre-donation crossmatching and viral screening.
              </p>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={willingToTravel}
                  onChange={(e) => setWillingToTravel(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-800 border-slate-700"
                />
                <span className="text-sm text-slate-200">Willing to travel to neighboring health centres in emergency cases</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-400" /> Living Organ Donation Interest (Educational)
                </div>
                <p className="text-xs text-slate-400">
                  Voluntary expression of interest to speak with an authorized transplant hospital. CuraReach does not match or market living organs.
                </p>
                <input
                  type="text"
                  placeholder="e.g. Voluntary Kidney Donation inquiry"
                  value={livingOrganInterest}
                  onChange={(e) => setLivingOrganInterest(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" /> Tissue Donation Interest (Cornea / Eye)
                </div>
                <p className="text-xs text-slate-400">
                  Voluntary pledge expression for cornea or tissue donation through official authorized eye banks.
                </p>
                <input
                  type="text"
                  placeholder="e.g. Eye donation intention"
                  value={tissueInterest}
                  onChange={(e) => setTissueInterest(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSavePreferences}
                disabled={submittingAction}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-900/30 flex items-center gap-2"
              >
                {submittingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-400" />
              Update Voluntary Availability
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your current availability status to help hospitals anticipate active volunteer responses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'AVAILABLE', label: 'Available', desc: 'Ready to receive emergency broadcast invitations', color: 'emerald' },
              { id: 'EMERGENCY_ONLY', label: 'Critical Only', desc: 'Alert only for life-threatening shortages', color: 'amber' },
              { id: 'BUSY', label: 'Temporarily Busy', desc: 'Unavailable for the next 7 days', color: 'slate' },
              { id: 'UNAVAILABLE', label: 'Unavailable / Resting', desc: 'Recently donated or travelling', color: 'rose' }
            ].map(status => {
              const isSelected = availabilityStatus === status.id;
              return (
                <div
                  key={status.id}
                  onClick={() => handleUpdateAvailability(status.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-900/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">{status.label}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-rose-400" />}
                  </div>
                  <p className="text-xs text-slate-400">{status.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: MY ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-400" />
            Voluntary Contribution & Activity Log
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="text-2xl font-bold text-white font-mono">{activity?.total_invitations || 0}</div>
              <div className="text-xs text-slate-400 mt-1">Broadcast Invitations Received</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="text-2xl font-bold text-emerald-400 font-mono">{activity?.accepted_invitations || 0}</div>
              <div className="text-xs text-slate-400 mt-1">Invitations Accepted</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="text-2xl font-bold text-rose-400 font-mono">{activity?.authorized_introductions || 0}</div>
              <div className="text-xs text-slate-400 mt-1">Authorized Introductions</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CONSENT & PRIVACY */}
      {activeTab === 'privacy' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Consent & Privacy Center</h2>
          </div>

          <p className="text-xs text-slate-300">
            CuraReach enforces privacy-by-design. You hold full control over how you receive alerts and who receives your contact details.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Emergency Request Broadcasts</div>
                <div className="text-xs text-slate-400">Receive in-app alerts when a nearby verified hospital needs your blood group</div>
              </div>
              <button
                onClick={handleToggleNotificationConsent}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  notifConsent
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {notifConsent ? 'Enabled (Opted In)' : 'Disabled (Paused)'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">Contact Sharing Protocol</div>
                <div className="text-xs text-slate-400">
                  Separated from request acceptance. Contact information is only shared when you check the explicit authorization box for a specific hospital request.
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                Consent Required Per Request
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs text-slate-300 space-y-2">
              <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-400" /> Revocation Rights & Retention
              </div>
              <p>
                You may withdraw any consent at any time. When you revoke contact-sharing consent, any active introductions are immediately revoked in the database. Note: Contact details already physically communicated to an attending clinician cannot be retracted once received.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: OFFICIAL DONATION INFORMATION */}
      {activeTab === 'official' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-white">
            <ExternalLink className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">National Organ & Tissue Transplant Organization (NOTTO)</h2>
          </div>

          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 space-y-2">
            <strong>Statutory Compliance & Legal Scope:</strong>
            <p>
              CuraReach 360 is NOT an organ allocation agency, organ registry, or organ procurement organization. Organ transplantation in India is regulated strictly under the Transplantation of Human Organs and Tissues Act (THOTA), 1994. 
            </p>
            <p>
              Official deceased organ donation pledges must be completed directly through the Ministry of Health and Family Welfare's NOTTO platform.
            </p>
            <div className="pt-1">
              <a
                href="https://notto.mohfw.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all"
              >
                Open Official NOTTO Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="text-sm font-semibold text-white">Record Official NOTTO Pledge Reference (Optional)</div>
            <p className="text-xs text-slate-400">
              If you have registered an official donor pledge on NOTTO, you may save your official certificate or pledge reference here for your personal records.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
              <input
                type="text"
                placeholder="e.g. NOTTO-2026-IND-XXXX"
                value={nottoReference}
                onChange={(e) => setNottoReference(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                onClick={handleRecordNottoPledge}
                disabled={!nottoReference || submittingAction}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                Record Reference
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESPOND MODAL WITH SEPARATE CONTACT SHARING CONSENT */}
      {selectedInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" /> Respond to Hospital Request
              </div>
              <button 
                onClick={() => setSelectedInvite(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Requesting Facility: <strong className="text-white">{selectedInvite.hospital_name}</strong></div>
              <div className="text-slate-400">Requested Group: <strong className="text-rose-400 font-mono font-bold">{selectedInvite.requested_blood_group}</strong></div>
              <div className="text-slate-400">Location: <span className="text-slate-200">{selectedInvite.city}</span></div>
            </div>

            {/* SEPARATE CONTACT SHARING CONSENT GATE */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contactSharingApproved}
                  onChange={(e) => setContactSharingApproved(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 bg-slate-800 border-slate-700"
                />
                <span className="text-xs text-amber-200 leading-relaxed">
                  <strong>Explicit Contact Sharing Authorization:</strong> Do you authorize CuraReach to disclose your registered name and contact phone number to this verified hospital staff for coordination of this specific donation request?
                </span>
              </label>
              <div className="text-[11px] text-amber-300/80 italic pl-6">
                * If unticked, the hospital only receives an anonymous acceptance signal without your phone number.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleRespondInvitation('DECLINE')}
                disabled={submittingAction}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Decline
              </button>
              <button
                onClick={() => handleRespondInvitation('ACCEPT')}
                disabled={submittingAction}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 flex items-center gap-1.5"
              >
                {submittingAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIFELINK REGISTRATION & ENQUIRY MODAL */}
      <LifeLinkRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        onRegisteredSuccess={async (ref, type, newUser) => {
          setIsRegModalOpen(false);
          if (newUser && onUserChange) {
            onUserChange(newUser);
          }
          await loadDonorData();
          if (type === 'DECEASED_ENQUIRY') {
            setActiveTab('enquiries');
            setSuccessMsg(`Compassionate enquiry submitted (${ref}). Coordinator notified.`);
          } else {
            setActiveTab('profile');
            setSuccessMsg(`Voluntary donor registration complete (${ref}). Profile synchronized.`);
          }
          setTimeout(() => setSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
};
export default DonorDashboard;
