import React, { useState } from 'react';
import { 
  Heart, 
  ShieldCheck, 
  Ambulance, 
  Phone, 
  MapPin, 
  Clock, 
  QrCode, 
  Download, 
  CalendarClock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  FileText, 
  PhoneCall, 
  Globe, 
  Building2, 
  Pill, 
  HeartPulse, 
  Share2,
  Bell
} from 'lucide-react';
import { PatientProfile, CoordinatedCarePathway } from '../types';

interface PatientPortalProps {
  patient: PatientProfile;
  pathway?: CoordinatedCarePathway | null;
  onNavigateToClinicalGrid: () => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  patient,
  pathway,
  onNavigateToClinicalGrid
}) => {
  const [language, setLanguage] = useState<'en' | 'kn' | 'hi' | 'te'>('en');
  const [sosTriggered, setSosTriggered] = useState(false);
  const [callInitiated, setCallInitiated] = useState<string | null>(null);

  const isEmergencyOrHigh = pathway?.triage_priority === 'EMERGENCY' || pathway?.triage_priority === 'HIGH';

  // Vernacular translations for rural accessibility
  const t = {
    en: {
      portalTitle: "My Care Portal & Digital Health Pass",
      portalSubtitle: "Personalized care pathway, ambulance status, and organisation community worker follow-up for patient and family caregivers.",
      abhaCard: "Ayushman Bharat Digital Health Card",
      careStatus: "Care Status",
      referralInTransit: "Emergency 108 Transfer Active",
      stableLocal: "Monitored Local Primary Care",
      assignedFacility: "Destination Healthcare Facility",
      ambulanceTracker: "Live 108 Ambulance Status",
      eta: "Estimated Arrival Time",
      driver: "Assigned Paramedic",
      vehicle: "Ambulance Vehicle No",
      emergencySos: "Emergency 108 SOS",
      sosDispatched: "SOS Signal Sent! 108 Control Room alerted with your GPS location.",
      ashaCard: "Community Health Worker (Appointed by Organisation)",
      callAsha: "Call Community Worker",
      ashaVisit: "Home Follow-up Visit Scheduled in 48 Hours",
      medSchedule: "Medication & Field Care Directives",
      clinicalGridBtn: "Switch to Doctor / Clinical AI View",
      downloadPass: "Download Referral Pass"
    },
    kn: {
      portalTitle: "ನನ್ನ ಆರೈಕೆ ಪೋರ್ಟಲ್ ಮತ್ತು ಡಿಜಿಟಲ್ ಹೆಲ್ತ್ ಪಾಸ್",
      portalSubtitle: "ರೋಗಿ ಮತ್ತು ಕುಟುಂಬದ ಪೋಷಕರಿಗೆ ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ ಆರೈಕೆ ಮಾರ್ಗ, ಆಂಬ್ಯುಲೆನ್ಸ್ ಸ್ಥಿತಿ ಮತ್ತು ಸಂಸ್ಥೆಯ ಸಮುದಾಯ ಕಾರ್ಯಕರ್ತರ ಫಾಲೋ-ಅಪ್.",
      abhaCard: "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಡಿಜಿಟಲ್ ಹೆಲ್ತ್ ಕಾರ್ಡ್",
      careStatus: "ಆರೈಕೆ ಸ್ಥಿತಿ",
      referralInTransit: "108 ತುರ್ತು ಆಸ್ಪತ್ರೆ ವರ್ಗಾವಣೆ ಸಕ್ರಿಯವಾಗಿದೆ",
      stableLocal: "ಸ್ಥಳೀಯ ಪ್ರಾಥಮಿಕ ಆರೈಕೆ",
      assignedFacility: "ನಿಗದಿಪಡಿಸಿದ ಆಸ್ಪತ್ರೆ",
      ambulanceTracker: "ಲೈವ್ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಸ್ಥಿತಿ",
      eta: "ಅಂದಾಜು ಆಗಮನದ ಸಮಯ",
      driver: "ಪ್ಯಾರಾಮೆಡಿಕ್ ಸಿಬ್ಬಂದಿ",
      vehicle: "ವಾಹನ ಸಂಖ್ಯೆ",
      emergencySos: "ತುರ್ತು 108 ಕರೆ (SOS)",
      sosDispatched: "SOS ಸಂದೇಶ ಕಳುಹಿಸಲಾಗಿದೆ! ಜಿಪಿಎಸ್ ಸ್ಥಳದೊಂದಿಗೆ 108 ನಿಯಂತ್ರಣ ಕೊಠಡಿಗೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ.",
      ashaCard: "ಸಂಸ್ಥೆಯಿಂದ ನೇಮಿಸಲ್ಪಟ್ಟ ಸಮುದಾಯ ಆರೋಗ್ಯ ಕಾರ್ಯಕರ್ತ",
      callAsha: "ಸಮುದಾಯ ಕಾರ್ಯಕರ್ತನಿಗೆ ಕರೆ ಮಾಡಿ",
      ashaVisit: "48 ಗಂಟೆಗಳಲ್ಲಿ ಮನೆಯ ಭೇಟಿ ನಿಗದಿಯಾಗಿದೆ",
      medSchedule: "ಔಷಧಿ ಮತ್ತು ಪ್ರಾಥಮಿಕ ಆರೈಕೆ ಮಾರ್ಗಸೂಚಿಗಳು",
      clinicalGridBtn: "ವೈದ್ಯರ / ಕ್ಲಿನಿಕಲ್ AI ಗ್ರಿಡ್ ವೀಕ್ಷಣೆ",
      downloadPass: "ರೆಫರಲ್ ಪಾಸ್ ಡೌನ್‌ಲೋಡ್"
    },
    hi: {
      portalTitle: "मेरा स्वास्थ्य पोर्टल एवं डिजिटल हेल्थ पास",
      portalSubtitle: "मरीज़ और देखभालकर्ता के लिए समन्वित देखभाल, एम्बुलेंस स्थिति और संस्था के सामुदायिक कार्यकर्ता का अनुवर्ती विवरण।",
      abhaCard: "आयुष्मान भारत डिजिटल स्वास्थ्य कार्ड",
      careStatus: "देखभाल स्थिति",
      referralInTransit: "108 आपातकालीन रेफरल ट्रांसफर सक्रिय",
      stableLocal: "प्राथमिक स्वास्थ्य केंद्र में स्थानीय देखभाल",
      assignedFacility: "अनुशंसित उच्चतर अस्पताल",
      ambulanceTracker: "लाइव 108 एम्बुलेंस स्थिति",
      eta: "अनुमानित आगमन समय",
      driver: "पैरामेडिक प्रभारी",
      vehicle: "एम्बुलेंस संख्या",
      emergencySos: "आपातकालीन 108 एसओएस",
      sosDispatched: "एसओएस अलर्ट भेजा गया! जीपीएस स्थान 108 केंद्र को प्रेषित।",
      ashaCard: "संस्था द्वारा नियुक्त सामुदायिक स्वास्थ्य कार्यकर्ता",
      callAsha: "सामुदायिक कार्यकर्ता को कॉल करें",
      ashaVisit: "48 घंटे में घरेलू फॉलो-अप विज़िट निर्धारित",
      medSchedule: "दवाएं और देखभाल निर्देश",
      clinicalGridBtn: "डॉक्टर / क्लिनिकल एआई व्यू देखें",
      downloadPass: "रेफरल पास डाउनलोड करें"
    },
    te: {
      portalTitle: "నా సంరక్షణ పోర్టల్ మరియు డిజిటల్ హెల్త్ కార్డ్",
      portalSubtitle: "రోగి మరియు కుటుంబ సంరక్షకుల కోసం వ్యక్తిగతీకరించిన చికిత్సా మార్గం, అంబులెన్స్ సమాచారం మరియు సంస్థ కమ్యూనిటీ కార్యకర్త ఫాలో-అప్.",
      abhaCard: "ఆయుష్మాన్ భారత్ డిజిటల్ హెల్త్ కార్డ్",
      careStatus: "చికిత్సా స్థితి",
      referralInTransit: "108 అత్యవసర ఆసుపత్రి బదిలీ ప్రక్రియ ప్రారంభమైంది",
      stableLocal: "స్థానిక ప్రాథమిక ఆరోగ్య కేంద్రంలో పర్యవేక్షణ",
      assignedFacility: "కేటాయించిన ఉన్నత ఆసుపత్రి",
      ambulanceTracker: "లైవ్ 108 అంబులెన్స్ ట్రాకర్",
      eta: "చేరుకునే అంచనా సమయం",
      driver: "పారామెడిక్ సిబ్బంది",
      vehicle: "అంబులెన్స్ వాహన నంబర్",
      emergencySos: "అత్యవసర 108 SOS",
      sosDispatched: "SOS సందేశం పంపబడింది! GPS లొకేషన్‌తో 108 కంట్రోల్ రూమ్‌కు సమాచారం చేరింది.",
      ashaCard: "సంస్థ నియమించిన కమ్యూనిటీ ఆరోగ్య కార్యకర్త",
      callAsha: "కమ్యూనిటీ కార్యకర్తకు కాల్ చేయండి",
      ashaVisit: "48 గంటల్లో ఇంటి సందర్శన ఖరారైంది",
      medSchedule: "మందులు మరియు ప్రాథమిక సంరక్షణ సూచనలు",
      clinicalGridBtn: "వైద్యుల / క్లినికల్ AI గ్రిడ్ వీక్షణ",
      downloadPass: "డిజిటల్ రెఫరల్ పాస్ డౌన్‌లోడ్"
    }
  }[language];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Welcome Bar & Language Switcher */}
      <div className="glass-panel-glow rounded-2xl p-6 border border-teal-500/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                Patient & Caregiver Portal
              </span>
              <span className="text-xs text-slate-400">ABHA Linked</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
              <HeartPulse className="w-7 h-7 text-rose-400" />
              <span>{t.portalTitle}</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {t.portalSubtitle}
            </p>
          </div>

          {/* Controls: Language Selector & Switch to Clinical View */}
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {/* Vernacular Language Switcher */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900/90 border border-slate-700">
              <Globe className="w-3.5 h-3.5 text-teal-400 ml-1.5" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${language === 'en' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('kn')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${language === 'kn' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${language === 'hi' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('te')}
                className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${language === 'te' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                తెలుగు
              </button>
            </div>

            {/* Switch to Doctor / Command Center */}
            <button
              onClick={onNavigateToClinicalGrid}
              className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.clinicalGridBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Patient Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Digital Health Card & Urgent SOS (1 col) */}
        <div className="space-y-6">
          {/* Official Ayushman Bharat Health Account (ABHA) Card */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-teal-950/80 via-slate-900 to-indigo-950/80 border border-teal-500/50 shadow-2xl space-y-4 relative overflow-hidden">
            {/* Top Card Strip */}
            <div className="flex items-center justify-between pb-3 border-b border-teal-500/30">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-sm">
                  AB
                </div>
                <div>
                  <div className="text-[10px] font-mono text-teal-300 uppercase tracking-widest font-bold">
                    National Health Authority
                  </div>
                  <div className="text-xs font-bold text-white">
                    Ayushman Bharat Health Card
                  </div>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Patient Identity */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Patient Name</span>
                <h3 className="text-xl font-black text-white">{patient.name}</h3>
                <span className="text-xs text-slate-300 font-medium block mt-0.5">
                  {patient.age}y • {patient.gender} • Karnataka
                </span>
              </div>

              {/* Scannable ABHA QR */}
              <div className="p-2 bg-white rounded-xl shadow-lg shrink-0 flex flex-col items-center">
                <QrCode className="w-14 h-14 text-slate-950" />
                <span className="text-[8px] font-mono text-slate-600 font-bold uppercase mt-0.5">ABHA SCAN</span>
              </div>
            </div>

            {/* ABHA Number & Coordinates */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">ABHA ID:</span>
                <span className="text-teal-300 font-bold">{patient.abha_id || '91-4521-8890-4412'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">Mobile:</span>
                <span className="text-slate-200">{patient.phone || '+91 94480 54321'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px]">Village Post:</span>
                <span className="text-slate-200 truncate max-w-[170px]">{patient.location}</span>
              </div>
            </div>

            {/* Emergency SOS & Pass Download */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSosTriggered(true);
                  setTimeout(() => setSosTriggered(false), 5000);
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  sosTriggered
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{sosTriggered ? 'SOS SENT!' : t.emergencySos}</span>
              </button>

              <button
                type="button"
                onClick={() => alert(`Digital Health & Referral Pass downloaded for ${patient.name} (${patient.abha_id})`)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                title={t.downloadPass}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {sosTriggered && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-[11px] text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{t.sosDispatched}</span>
              </div>
            )}
          </div>

          {/* Frontline Organisation Community Health Worker Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.ashaCard}</h4>
                <p className="text-[10px] text-slate-400">Organisation-Appointed Field Healthcare Partner</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Worker Name:</span>
                <span className="text-white font-bold">{patient.assigned_asha || 'Lakshmi Bai (Organisation Community Lead)'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Organisation Sector:</span>
                <span className="text-slate-300 font-medium">Kudligere Community Health Sector</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Scheduled Visit:</span>
                <span className="text-teal-300 font-semibold">{pathway?.follow_up_target || 'Within 48 Hours'}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setCallInitiated('Community Health Worker (+91 94480 11223)');
                  setTimeout(() => setCallInitiated(null), 4000);
                }}
                className="w-full py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{t.callAsha}</span>
              </button>
              {callInitiated && (
                <p className="text-[11px] text-emerald-400 text-center mt-1.5 font-medium">
                  Connecting voice call to {callInitiated}...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Care Journey & Live Ambulance (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Care Status Banner */}
          <div className={`p-5 rounded-2xl border ${
            isEmergencyOrHigh 
              ? 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border-rose-500/60' 
              : 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border-emerald-500/60'
          } space-y-3`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${isEmergencyOrHigh ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                  {t.careStatus}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                isEmergencyOrHigh ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              }`}>
                {isEmergencyOrHigh ? t.referralInTransit : t.stableLocal}
              </span>
            </div>

            <div>
              <div className="text-sm text-slate-400 font-medium">{t.assignedFacility}</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {pathway?.recommended_facility || 'McGann District Teaching Hospital, Shivamogga'}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {pathway?.execution_summary || 
                  'Your vital signs indicate urgent need for high-flow oxygen and specialist physician care. A pre-arrival intimation has been transmitted to the emergency intake department.'}
              </p>
            </div>
          </div>

          {/* Live Ambulance & Transfer Tracking Card */}
          {isEmergencyOrHigh && (
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Ambulance className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {t.ambulanceTracker}
                    </h3>
                    <p className="text-[11px] text-slate-400">108 Advanced Life Support (ALS) Dispatch</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  En Route (18 mins ETA)
                </span>
              </div>

              {/* Progress Line */}
              <div className="relative pt-2 pb-4">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 via-amber-400 to-rose-500 rounded-full w-2/3 animate-pulse" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                  <span>PHC Kudligere (Origin)</span>
                  <span className="text-teal-300 font-bold">Bhadravathi Bypass (Now)</span>
                  <span>District Hospital (Arrival)</span>
                </div>
              </div>

              {/* Vehicle & Paramedic Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">{t.vehicle}</span>
                  <div className="font-mono font-bold text-white text-sm">KA-14-G-1082</div>
                  <span className="text-[10px] text-teal-400">Ventilator & Oxygen Ready</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">{t.driver}</span>
                  <div className="font-bold text-white text-sm">Eshwarappa (EMT Lead)</div>
                  <span className="text-[10px] text-slate-400">Radio Channel #04</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider">Emergency Contact</span>
                  <div className="font-mono font-bold text-white text-sm">+91 94480 10811</div>
                  <button
                    onClick={() => alert('Dialing 108 Ambulance Unit KA-14-G-1082...')}
                    className="text-[10px] text-teal-300 hover:underline cursor-pointer"
                  >
                    Click to Call Driver
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Simple Care Directives & Home Instructions */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <Pill className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {t.medSchedule}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-teal-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>Immediate Transit & Bedside Steps</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>Keep patient seated upright at a 45-degree angle to assist breathing.</li>
                  <li>Administer continuous high-flow oxygen via nasal cannula.</li>
                  <li>Do not offer solid foods during ambulance transit.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Warning Signs to Immediately Report</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>SpO2 dropping below 88% on pulse oximeter.</li>
                  <li>Bluish discoloration of lips, tongue, or fingertips (cyanosis).</li>
                  <li>Sudden drowsiness, confusion, or difficulty waking up.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
