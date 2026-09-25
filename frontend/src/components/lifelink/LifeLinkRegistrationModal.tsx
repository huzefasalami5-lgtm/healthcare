import React, { useState } from 'react';
import { 
  Heart, 
  Droplet, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  PhoneCall, 
  ExternalLink, 
  Clock, 
  UserCheck, 
  Users, 
  FileText, 
  Building2, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { 
  registerDonorApi, 
  submitDeceasedEnquiryApi, 
  DeceasedDonationEnquiry 
} from '../../services/curareachApi';

interface LifeLinkRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisteredSuccess?: (reference: string, type: 'DONOR' | 'DECEASED_ENQUIRY', user?: any) => void;
}

export const LifeLinkRegistrationModal: React.FC<LifeLinkRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisteredSuccess
}) => {
  const [selectedOption, setSelectedOption] = useState<'CHOICE' | 'OPTION_A' | 'OPTION_B' | 'CONFIRMATION'>('CHOICE');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    reference: string;
    type: 'DONOR' | 'DECEASED_ENQUIRY';
    message: string;
    details?: any;
  } | null>(null);

  // --- Option A Form State (Voluntary Living Donor) ---
  const [optAName, setOptAName] = useState('');
  const [optAEmail, setOptAEmail] = useState('');
  const [optAPhone, setOptAPhone] = useState('');
  const [optADob, setOptADob] = useState('1994-05-18');
  const [optACity, setOptACity] = useState('Shivamogga');
  const [optADistrict, setOptADistrict] = useState('Shivamogga');
  const [optABloodGroup, setOptABloodGroup] = useState('O+');
  const [optACategories, setOptACategories] = useState<string[]>(['BLOOD', 'PLATELETS']);
  const [optAWillingTravel, setOptAWillingTravel] = useState(true);
  const [optAOptInNotifs, setOptAOptInNotifs] = useState(true);

  // --- Option B Form State (Family-Assisted Deceased Enquiry) ---
  const [optBFamilyName, setOptBFamilyName] = useState('');
  const [optBRelationship, setOptBRelationship] = useState('Daughter');
  const [optBContactPhone, setOptBContactPhone] = useState('');
  const [optBLanguage, setOptBLanguage] = useState('Kannada');
  const [optBDeceasedName, setOptBDeceasedName] = useState('');
  const [optBDeceasedAge, setOptBDeceasedAge] = useState<number | ''>(68);
  const [optBDateOfDeath, setOptBDateOfDeath] = useState(new Date().toISOString().slice(0, 16));
  const [optBHospitalName, setOptBHospitalName] = useState('Shivamogga District Civil Hospital');
  const [optBCurrentLocation, setOptBCurrentLocation] = useState('Shivamogga');
  const [optBAlreadySpeaking, setOptBAlreadySpeaking] = useState(false);
  const [optBOfficialPledgeRef, setOptBOfficialPledgeRef] = useState('');
  
  // Mandatory 3 Confirmations for Option B
  const [optBConfirmNextOfKin, setOptBConfirmNextOfKin] = useState(false);
  const [optBConfirmNoGuarantee, setOptBConfirmNoGuarantee] = useState(false);
  const [optBConfirmRoutingAuth, setOptBConfirmRoutingAuth] = useState(false);

  if (!isOpen) return null;

  const handleToggleCategory = (cat: string) => {
    if (optACategories.includes(cat)) {
      setOptACategories(optACategories.filter(c => c !== cat));
    } else {
      setOptACategories([...optACategories, cat]);
    }
  };

  const handleSubmitOptionA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optAName.trim()) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await registerDonorApi({
        full_name: optAName.trim(),
        email: optAEmail.trim() || undefined,
        phone: optAPhone.trim() || undefined,
        date_of_birth: optADob,
        city: optACity,
        district: optADistrict,
        self_reported_blood_group: optABloodGroup,
        donation_categories: optACategories,
        willing_to_travel: optAWillingTravel,
        opt_in_notifications: optAOptInNotifs
      });
      setSuccessResult({
        reference: res.donor_reference,
        type: 'DONOR',
        message: 'Voluntary Donor Registration Completed Successfully',
        details: res
      });
      setSelectedOption('CONFIRMATION');
      if (onRegisteredSuccess) onRegisteredSuccess(res.donor_reference, 'DONOR', res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOptionB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optBFamilyName.trim() || !optBContactPhone.trim()) {
      setErrorMessage('Family member name and contact phone number are mandatory.');
      return;
    }
    if (!optBConfirmNextOfKin || !optBConfirmNoGuarantee || !optBConfirmRoutingAuth) {
      setErrorMessage('All 3 legal confirmations are required under THOTA guidelines before this enquiry can be routed.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await submitDeceasedEnquiryApi({
        family_member_name: optBFamilyName.trim(),
        family_member_contact: optBContactPhone.trim(),
        relationship_to_deceased: optBRelationship,
        preferred_language: optBLanguage,
        deceased_name: optBDeceasedName.trim() || undefined,
        deceased_age: optBDeceasedAge ? Number(optBDeceasedAge) : undefined,
        date_of_death: optBDateOfDeath ? new Date(optBDateOfDeath).toISOString() : undefined,
        hospital_name: optBHospitalName.trim() || undefined,
        current_location: optBCurrentLocation.trim() || 'Shivamogga',
        already_speaking_with_coordinator: optBAlreadySpeaking,
        official_pledge_reference: optBOfficialPledgeRef.trim() || undefined,
        privacy_notice_accepted: optBConfirmNoGuarantee,
        coordinator_contact_permission: optBConfirmRoutingAuth
      });

      setSuccessResult({
        reference: res.enquiry.enquiry_reference,
        type: 'DECEASED_ENQUIRY',
        message: 'Deceased Donation Enquiry Submitted to Authorized Hospital Network',
        details: res.enquiry
      });
      setSelectedOption('CONFIRMATION');
      if (onRegisteredSuccess) onRegisteredSuccess(res.enquiry.enquiry_reference, 'DECEASED_ENQUIRY');
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#091322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border-b border-rose-900/40 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {selectedOption !== 'CHOICE' && selectedOption !== 'CONFIRMATION' && (
              <button
                type="button"
                onClick={() => { setSelectedOption('CHOICE'); setErrorMessage(null); }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Back to options"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  CuraReach LifeLink
                </span>
                <span className="text-xs text-slate-400">&bull; Separate Voluntary &amp; Deceased Enquiries</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {selectedOption === 'CHOICE' && 'LifeLink Registration &amp; Enquiry Portal'}
                {selectedOption === 'OPTION_A' && 'Option A: Register Myself — Voluntary Donor'}
                {selectedOption === 'OPTION_B' && 'Option B: Family-Assisted Deceased Donation Enquiry'}
                {selectedOption === 'CONFIRMATION' && 'Submission Confirmation'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-rose-950/90 border-b border-rose-800 px-4 py-3 text-rose-200 text-xs sm:text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ============================================================== */}
          {/* STEP 1: CHOICE SCREEN                                          */}
          {/* ============================================================== */}
          {selectedOption === 'CHOICE' && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Please Select the Appropriate Pathway
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  CuraReach maintains strict statutory separation between voluntary living donors and post-mortem family enquiries under Indian healthcare regulations (THOTA 1994 / 2011).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OPTION A CARD */}
                <div 
                  onClick={() => setSelectedOption('OPTION_A')}
                  className="group relative cursor-pointer rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/90 border border-slate-700/80 hover:border-rose-500/70 p-5 sm:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-rose-950/30 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                        <Heart className="w-6 h-6 fill-rose-500/20" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Living Adult (18+)
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                        Option A
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-rose-200 transition-colors">
                        Register Myself — Voluntary Donor
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Register voluntarily for <strong>blood, platelets, plasma</strong> coordination or record your educational intent for post-mortem pledge.
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>100% voluntary, non-remunerated</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Separate contact-sharing consent for every invite</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Generates unique donor ID (CR-DON-2026-XXXX)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 flex items-center justify-between text-xs font-semibold text-rose-400 group-hover:translate-x-1 transition-transform">
                    <span>Continue to Donor Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                {/* OPTION B CARD */}
                <div 
                  onClick={() => setSelectedOption('OPTION_B')}
                  className="group relative cursor-pointer rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/90 border border-amber-800/50 hover:border-amber-500/80 p-5 sm:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-amber-950/30 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Time-Sensitive
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Option B
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                        Family-Assisted — Deceased Donation Enquiry
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Initiate a compassionate enquiry <strong>exclusively after the death of a relative</strong> to connect with an authorized hospital coordinator.
                    </p>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Immediate family member / next of kin only</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Routed to nearest verified hospital transplant coordinator</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Generates enquiry ref (CR-DEC-2026-XXXX)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Initiate Family Enquiry</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Statutory Notice Strip */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Statutory Legal Notice — THOTA (1994 / 2011) &amp; NOTTO Compliance</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  CuraReach LifeLink is an educational and coordination aid. It never facilitates commercial organ transactions or living organ donations to strangers. Living organ donations in India are strictly restricted to near relatives or require State Authorisation Committee sanction. Deceased donation requires legal authorization via Form 8.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-emerald-400" />
                    NOTTO Toll-Free Helpline: <strong>1800-11-4770</strong> (24x7)
                  </span>
                  <a
                    href="https://notto.abdm.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-teal-400 hover:underline"
                  >
                    <span>Official NOTTO Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: OPTION A FORM (VOLUNTARY DONOR)                        */}
          {/* ============================================================== */}
          {selectedOption === 'OPTION_A' && (
            <form onSubmit={handleSubmitOptionA} className="space-y-5">
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start gap-3">
                <Heart className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Voluntary Donor Registration:</strong> You are registering yourself as a living adult volunteer. No contact information is ever shared with hospitals until you explicitly accept an invitation.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optAName}
                    onChange={(e) => setOptAName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Birth <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={optADob}
                    onChange={(e) => setOptADob(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(for login &amp; data sync)</span>
                  </label>
                  <input
                    type="email"
                    value={optAEmail}
                    onChange={(e) => setOptAEmail(e.target.value)}
                    placeholder="e.g. donor.meenakshi@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number <span className="text-slate-400 font-normal">(for verified hospital alerts)</span>
                  </label>
                  <input
                    type="tel"
                    value={optAPhone}
                    onChange={(e) => setOptAPhone(e.target.value)}
                    placeholder="e.g. +91-98450-12345"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Self-Reported Blood Group
                  </label>
                  <select
                    value={optABloodGroup}
                    onChange={(e) => setOptABloodGroup(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={optACity}
                    onChange={(e) => setOptACity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={optADistrict}
                    onChange={(e) => setOptADistrict(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Voluntary Donation Interests (Select all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'BLOOD', label: 'Whole Blood' },
                    { id: 'PLATELETS', label: 'Platelets' },
                    { id: 'PLASMA', label: 'Plasma' },
                    { id: 'DECEASED_ORGAN_PLEDGE', label: 'Deceased Pledge' }
                  ].map(cat => {
                    const checked = optACategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                          checked
                            ? 'bg-rose-500/20 text-rose-200 border-rose-500/60'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>{cat.label}</span>
                        {checked && <CheckCircle className="w-3.5 h-3.5 text-rose-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optAWillingTravel}
                    onChange={(e) => setOptAWillingTravel(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
                  />
                  <span className="text-xs text-slate-300">
                    I am willing to travel to district civil hospital or local blood bank if urgent need arises.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optAOptInNotifs}
                    onChange={(e) => setOptAOptInNotifs(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
                  />
                  <span className="text-xs text-slate-300">
                    Opt-in to emergency hospital broadcast invitations for compatible blood requests.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOption('CHOICE')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Complete Voluntary Donor Registration'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 3: OPTION B FORM (FAMILY-ASSISTED DECEASED ENQUIRY)       */}
          {/* ============================================================== */}
          {selectedOption === 'OPTION_B' && (
            <form onSubmit={handleSubmitOptionB} className="space-y-5">
              {/* URGENT TIME-SENSITIVITY NOTICE BANNER */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-600/70 shadow-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Time-Sensitive Clinical Guidance</span>
                </div>
                <p className="text-xs text-amber-100/90 leading-relaxed font-medium">
                  Deceased organ donation can be time-sensitive. If your relative has recently passed away in a hospital, please contact the treating hospital immediately and ask for the hospital transplant coordinator.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 text-amber-200 border border-amber-500/40 flex items-center gap-1.5 font-bold">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    NOTTO 24x7 Helpline: 1800-11-4770 (Toll-Free)
                  </span>
                  <a
                    href="https://notto.abdm.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-400 hover:text-teal-300 flex items-center gap-1 underline"
                  >
                    <span>NOTTO National Registry</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Family Enquirer Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  <span>1. Family Member (Enquirer) Information</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={optBFamilyName}
                      onChange={(e) => setOptBFamilyName(e.target.value)}
                      placeholder="e.g. Kavita Deshmukh"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Relationship to Deceased <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={optBRelationship}
                      onChange={(e) => setOptBRelationship(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Son">Son</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Sister">Sister</option>
                      <option value="Brother">Brother</option>
                      <option value="Legal Guardian">Legal Guardian / Next-of-Kin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Contact Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={optBContactPhone}
                      onChange={(e) => setOptBContactPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Preferred Language for Coordinator Call
                    </label>
                    <select
                      value={optBLanguage}
                      onChange={(e) => setOptBLanguage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Deceased Relative Details */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. Deceased Relative &amp; Hospital Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Deceased Relative's Name <span className="text-slate-500 font-normal">(Optional if family prefers privacy)</span>
                    </label>
                    <input
                      type="text"
                      value={optBDeceasedName}
                      onChange={(e) => setOptBDeceasedName(e.target.value)}
                      placeholder="e.g. Late Smt. Shanta Deshmukh"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Approximate Age of Deceased
                    </label>
                    <input
                      type="number"
                      value={optBDeceasedAge}
                      onChange={(e) => setOptBDeceasedAge(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 68"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Date &amp; Time of Death (or expected in critical care)
                    </label>
                    <input
                      type="datetime-local"
                      value={optBDateOfDeath}
                      onChange={(e) => setOptBDateOfDeath(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Current Hospital / Facility Name
                    </label>
                    <input
                      type="text"
                      value={optBHospitalName}
                      onChange={(e) => setOptBHospitalName(e.target.value)}
                      placeholder="e.g. Shivamogga District Civil Hospital"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Current City / District <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={optBCurrentLocation}
                      onChange={(e) => setOptBCurrentLocation(e.target.value)}
                      placeholder="e.g. Shivamogga"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Official NOTTO Pledge Reference <span className="text-slate-500 font-normal">(If pledged in life)</span>
                    </label>
                    <input
                      type="text"
                      value={optBOfficialPledgeRef}
                      onChange={(e) => setOptBOfficialPledgeRef(e.target.value)}
                      placeholder="e.g. NOTTO-2025-PLEDGE-9912"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={optBAlreadySpeaking}
                      onChange={(e) => setOptBAlreadySpeaking(e.target.checked)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                    />
                    <span className="text-xs text-slate-300">
                      Our family is already speaking with a hospital coordinator at the facility.
                    </span>
                  </label>
                </div>
              </div>

              {/* MANDATORY STATUTORY CONFIRMATIONS */}
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/60 space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Mandatory Statutory Confirmations (THOTA 1994 / 2011)</span>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={optBConfirmNextOfKin}
                      onChange={(e) => setOptBConfirmNextOfKin(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                    />
                    <span className="text-xs text-slate-200">
                      <strong className="text-white">Next of Kin:</strong> I confirm I am an immediate family member / legal next of kin authorized to initiate this enquiry.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={optBConfirmNoGuarantee}
                      onChange={(e) => setOptBConfirmNoGuarantee(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                    />
                    <span className="text-xs text-slate-200">
                      <strong className="text-white">No Guarantee:</strong> I understand this enquiry does NOT guarantee donation and that clinical evaluation and official legal consent must be completed with an authorized hospital coordinator under THOTA Form 8.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={optBConfirmRoutingAuth}
                      onChange={(e) => setOptBConfirmRoutingAuth(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                    />
                    <span className="text-xs text-slate-200">
                      <strong className="text-white">Authorized Routing:</strong> I authorize CuraReach to route this enquiry to the nearest authorized hospital transplant coordinator and contact me at the phone number provided.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOption('CHOICE')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !optBConfirmNextOfKin || !optBConfirmNoGuarantee || !optBConfirmRoutingAuth}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting Enquiry...' : 'Submit Deceased Donation Enquiry'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 4: CONFIRMATION VIEW                                      */}
          {/* ============================================================== */}
          {selectedOption === 'CONFIRMATION' && successResult && (
            <div className="space-y-6 text-center max-w-xl mx-auto py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 animate-in zoom-in-75">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {successResult.type === 'DONOR' ? 'Voluntary Donor Registered' : 'Enquiry Routed Successfully'}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  {successResult.message}
                </h3>
              </div>

              {/* Reference Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                <div className="text-xs text-slate-400">Unique Tracking Reference</div>
                <div className="text-2xl font-bold font-mono text-teal-300">
                  {successResult.reference}
                </div>
                {successResult.type === 'DECEASED_ENQUIRY' && (
                  <div className="text-xs text-amber-300 font-semibold pt-1">
                    Administrative Status: Awaiting Authorized Coordinator Review
                  </div>
                )}
              </div>

              {/* Next Steps Guidance */}
              {successResult.type === 'DECEASED_ENQUIRY' ? (
                <div className="text-left p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>What Happens Next</span>
                  </div>
                  <p className="leading-relaxed">
                    An authorized hospital transplant coordinator will contact you at your provided phone number to discuss clinical feasibility, explain the legal consent process under THOTA Form 8, and coordinate with the treating hospital.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    <strong>Privacy Assurance:</strong> Your enquiry is shared only with verified hospital coordinators in your district. You may withdraw this enquiry at any time.
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-bold">NOTTO Helpline: 1800-11-4770</span>
                    <a
                      href="https://notto.abdm.gov.in/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-400 hover:underline flex items-center gap-1"
                    >
                      <span>notto.abdm.gov.in</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-left p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Voluntary Donor Rights</span>
                  </div>
                  <p className="leading-relaxed">
                    Thank you for stepping forward. Your contact details remain confidential. Whenever an emergency invitation arrives for your blood group, you will review the case transparently before deciding whether to share your contact number.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close &amp; Go to Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
