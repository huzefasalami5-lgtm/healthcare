import React, { useState } from 'react';
import { 
  Heart, 
  Droplet, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  PhoneCall, 
  ExternalLink, 
  Clock, 
  Users, 
  Building2, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { 
  registerDonorApi, 
  submitDeceasedEnquiryApi, 
  DeceasedDonationEnquiry 
} from '../../services/curareachApi';

interface LifeLinkRegistrationPageProps {
  onBackToDashboard: () => void;
  onEnquirySubmitted?: (ref: string) => void;
  onDonorRegistered?: (user: any, ref: string) => void;
}

export const LifeLinkRegistrationPage: React.FC<LifeLinkRegistrationPageProps> = ({
  onBackToDashboard,
  onEnquirySubmitted,
  onDonorRegistered
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
      if (onDonorRegistered) onDonorRegistered(res.user, res.donor_reference);
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
      if (onEnquirySubmitted) onEnquirySubmitted(res.enquiry.enquiry_reference);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center space-x-3">
          {selectedOption !== 'CHOICE' && selectedOption !== 'CONFIRMATION' ? (
            <button
              onClick={() => { setSelectedOption('CHOICE'); setErrorMessage(null); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Selection</span>
            </button>
          ) : onBackToDashboard ? (
            <button
              onClick={onBackToDashboard}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Donor Dashboard</span>
            </button>
          ) : null}
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                LifeLink Registration
              </span>
              <span className="text-xs text-slate-400">&bull; Statutory Separation under THOTA 1994 / 2011</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {selectedOption === 'CHOICE' && 'CuraReach LifeLink Registration & Enquiry'}
              {selectedOption === 'OPTION_A' && 'Register Myself — Voluntary Donor'}
              {selectedOption === 'OPTION_B' && 'Family-Assisted — Deceased Donation Enquiry'}
              {selectedOption === 'CONFIRMATION' && 'Submission Confirmation'}
            </h1>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-950/90 border border-rose-800 rounded-xl px-4 py-3 text-rose-200 text-xs sm:text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Choice Screen */}
      {selectedOption === 'CHOICE' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white">Select Your Registration Option</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              In strict compliance with statutory regulations, living voluntary donors and post-mortem family enquiries are separate workflows. Please choose the pathway below:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OPTION A */}
            <div 
              onClick={() => setSelectedOption('OPTION_A')}
              className="group cursor-pointer rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 hover:border-rose-500/70 p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-rose-950/30 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                    <Heart className="w-7 h-7 fill-rose-500/20" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Living Adult (18+)
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Option A
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-rose-200 transition-colors">
                    Register Myself — Voluntary Donor
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Register as an active voluntary donor for <strong>blood, platelets, plasma</strong> or record your educational deceased organ pledge under NOTTO.
                </p>

                <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>100% voluntary, non-remunerated</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Separate contact-sharing consent for each hospital request</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant unique reference (CR-DON-2026-XXXX)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
                <span>Start Voluntary Donor Form</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* OPTION B */}
            <div 
              onClick={() => setSelectedOption('OPTION_B')}
              className="group cursor-pointer rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-800/40 hover:border-amber-500/70 p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-amber-950/30 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Time-Sensitive
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Option B
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
                    Family-Assisted — Deceased Donation Enquiry
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Initiate a compassionate enquiry <strong>strictly after the death of a relative</strong> to connect with an authorized hospital transplant coordinator.
                </p>

                <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Immediate family member / next of kin only</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Routed to authorized district hospital coordinator</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Generates enquiry reference (CR-DEC-2026-XXXX)</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Initiate Deceased Donation Enquiry</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Statutory & NOTTO Strip */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-teal-400 shrink-0" />
              <span>National Regulatory Framework — THOTA 1994 / 2011 &amp; NOTTO</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Living organ donation in India is strictly governed by the Transplantation of Human Organs and Tissues Act (THOTA 1994, amended 2011). Living donation is permitted only to near relatives (spouse, children, parents, siblings, grandparents, grandchildren) or with prior State / Hospital Authorisation Committee approval. CuraReach LifeLink is an educational and coordination aid; it does NOT allocate organs or maintain national waiting lists.
            </p>
            <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                National Organ Donation Helpline: <strong className="text-white">1800-11-4770</strong> (Toll-Free, 24x7)
              </span>
              <a
                href="https://notto.abdm.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-teal-400 hover:text-teal-300 underline font-medium"
              >
                <span>National Organ and Tissue Transplant Organisation (NOTTO) Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Option A Form */}
      {selectedOption === 'OPTION_A' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <form onSubmit={handleSubmitOptionA} className="space-y-6">
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-start gap-3">
              <Heart className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-white">Voluntary Donor Registration:</strong> Register voluntarily to support acute trauma cases, surgeries, and voluntary pledges. You can update availability or withdraw at any time.
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Donation Categories of Interest (Organs, Tissues & Blood)</span>
                <span className="text-[10px] text-rose-400 font-normal">Select all that apply</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'KIDNEY', label: '🫘 Kidney', desc: 'Living / Deceased Pledge' },
                  { id: 'LIVER', label: '🧬 Liver Lobe', desc: 'Living / Deceased Pledge' },
                  { id: 'HEART', label: '🫀 Heart', desc: 'NOTTO Deceased Pledge' },
                  { id: 'LUNGS', label: '🫁 Lungs', desc: 'NOTTO Deceased Pledge' },
                  { id: 'PANCREAS', label: '🩺 Pancreas', desc: 'Deceased Organ Pledge' },
                  { id: 'CORNEA', label: '👁️ Corneas / Eyes', desc: 'Official Eye Bank Pledge' },
                  { id: 'BONE_MARROW', label: '🦴 Bone Marrow', desc: 'Stem Cell Registry' },
                  { id: 'BLOOD', label: '🩸 Whole Blood', desc: 'Emergency Blood Need' },
                  { id: 'PLATELETS', label: '🧪 Platelets / Plasma', desc: 'Component Donation' },
                ].map(cat => {
                  const checked = optACategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`p-3 rounded-xl text-xs font-semibold border transition-all text-left flex flex-col justify-between ${
                        checked
                          ? 'bg-rose-500/20 text-rose-200 border-rose-500/60 shadow-sm shadow-rose-950/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{cat.label}</span>
                        {checked && <CheckCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] font-normal text-slate-500 mt-1">{cat.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optAWillingTravel}
                  onChange={(e) => setOptAWillingTravel(e.target.checked)}
                  className="mt-1 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-950"
                />
                <span className="text-xs sm:text-sm text-slate-300">
                  I am willing to travel to district civil hospital or local blood bank if urgent need arises.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optAOptInNotifs}
                  onChange={(e) => setOptAOptInNotifs(e.target.checked)}
                  className="mt-1 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-950"
                />
                <span className="text-xs sm:text-sm text-slate-300">
                  Opt-in to emergency hospital broadcast invitations for compatible blood requests.
                </span>
              </label>
            </div>

            <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOption('CHOICE')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Back to Selection
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Complete Voluntary Donor Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Option B Form */}
      {selectedOption === 'OPTION_B' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <form onSubmit={handleSubmitOptionB} className="space-y-6">
            {/* URGENT TIME SENSITIVITY BANNER */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-950 to-amber-950 border-2 border-amber-600 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Time-Sensitive Clinical Guidance</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-medium">
                Deceased organ donation can be time-sensitive. If your relative has recently passed away in a hospital, please contact the treating hospital immediately and ask for the hospital transplant coordinator.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-black/50 text-amber-200 border border-amber-500/50 flex items-center gap-2 font-bold">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  NOTTO 24x7 Helpline: 1800-11-4770 (Toll-Free)
                </span>
                <a
                  href="https://notto.abdm.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 hover:text-teal-300 flex items-center gap-1 underline font-medium"
                >
                  <span>NOTTO National Registry</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Section 1: Enquirer Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <span>1. Family Member (Enquirer) Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Relationship to Deceased <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={optBRelationship}
                    onChange={(e) => setOptBRelationship(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Preferred Language for Coordinator Call
                  </label>
                  <select
                    value={optBLanguage}
                    onChange={(e) => setOptBLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
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

            {/* Section 2: Deceased Relative Details */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>2. Deceased Relative &amp; Facility Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deceased Relative's Name <span className="text-slate-500 font-normal">(Optional if family prefers privacy)</span>
                  </label>
                  <input
                    type="text"
                    value={optBDeceasedName}
                    onChange={(e) => setOptBDeceasedName(e.target.value)}
                    placeholder="e.g. Late Smt. Shanta Deshmukh"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date &amp; Time of Death (or expected in critical care)
                  </label>
                  <input
                    type="datetime-local"
                    value={optBDateOfDeath}
                    onChange={(e) => setOptBDateOfDeath(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official NOTTO Pledge Reference <span className="text-slate-500 font-normal">(If relative pledged during life)</span>
                  </label>
                  <input
                    type="text"
                    value={optBOfficialPledgeRef}
                    onChange={(e) => setOptBOfficialPledgeRef(e.target.value)}
                    placeholder="e.g. NOTTO-2025-PLEDGE-9912"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optBAlreadySpeaking}
                    onChange={(e) => setOptBAlreadySpeaking(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <span className="text-xs sm:text-sm text-slate-300">
                    Our family is already speaking with a hospital coordinator at the facility.
                  </span>
                </label>
              </div>
            </div>

            {/* MANDATORY STATUTORY CONFIRMATIONS */}
            <div className="p-5 rounded-2xl bg-slate-950 border-2 border-amber-900/60 space-y-4">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Mandatory Statutory Confirmations (THOTA 1994 / 2011)</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={optBConfirmNextOfKin}
                    onChange={(e) => setOptBConfirmNextOfKin(e.target.checked)}
                    className="mt-1 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                  />
                  <span className="text-xs sm:text-sm text-slate-200">
                    <strong className="text-white">Next of Kin Confirmation:</strong> I confirm I am an immediate family member / legal next of kin authorized to initiate this enquiry.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={optBConfirmNoGuarantee}
                    onChange={(e) => setOptBConfirmNoGuarantee(e.target.checked)}
                    className="mt-1 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                  />
                  <span className="text-xs sm:text-sm text-slate-200">
                    <strong className="text-white">No Guarantee Notice:</strong> I understand this enquiry does NOT guarantee donation and that clinical evaluation and official legal consent must be completed with an authorized hospital coordinator under THOTA Form 8.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={optBConfirmRoutingAuth}
                    onChange={(e) => setOptBConfirmRoutingAuth(e.target.checked)}
                    className="mt-1 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                  />
                  <span className="text-xs sm:text-sm text-slate-200">
                    <strong className="text-white">Authorized Routing Permission:</strong> I authorize CuraReach to route this enquiry to the nearest authorized hospital transplant coordinator and contact me at the phone number provided.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOption('CHOICE')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting || !optBConfirmNextOfKin || !optBConfirmNoGuarantee || !optBConfirmRoutingAuth}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting Enquiry...' : 'Submit Deceased Donation Enquiry'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation View */}
      {selectedOption === 'CONFIRMATION' && successResult && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {successResult.type === 'DONOR' ? 'Voluntary Donor Registered' : 'Deceased Enquiry Routed'}
            </span>
            <h2 className="text-2xl font-bold text-white">
              {successResult.message}
            </h2>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Tracking Reference Number</div>
            <div className="text-3xl font-bold font-mono text-teal-300">
              {successResult.reference}
            </div>
            {successResult.type === 'DECEASED_ENQUIRY' && (
              <div className="text-xs text-amber-300 font-semibold pt-1">
                Administrative Status: Awaiting Authorized Coordinator Review
              </div>
            )}
          </div>

          {successResult.type === 'DECEASED_ENQUIRY' ? (
            <div className="text-left p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Next Steps for the Family</span>
              </div>
              <p className="leading-relaxed">
                An authorized hospital transplant coordinator will contact you at your provided phone number to discuss clinical feasibility, explain the legal consent process under THOTA Form 8, and coordinate with the treating hospital.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold">NOTTO 24x7 Helpline: 1800-11-4770</span>
                <a
                  href="https://notto.abdm.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>notto.abdm.gov.in</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-left p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs sm:text-sm text-slate-300">
              <div className="font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Voluntary Donor Rights</span>
              </div>
              <p className="leading-relaxed">
                Your profile is active and safe. No hospital can access your contact details without your explicit consent for a specific broadcast invitation.
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-4">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition-colors"
              >
                Go to Donor Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={() => { setSelectedOption('CHOICE'); setSuccessResult(null); }}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
