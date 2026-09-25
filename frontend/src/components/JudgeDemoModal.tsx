import React, { useState } from 'react';
import { 
  X, 
  Award, 
  ChevronRight, 
  ChevronLeft, 
  Users, 
  Cpu, 
  Stethoscope, 
  MapPin, 
  Boxes, 
  Ambulance, 
  CalendarClock, 
  Sparkles,
  Play,
  ShieldCheck,
  TrendingUp,
  HeartPulse
} from 'lucide-react';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunDemo: () => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({
  isOpen,
  onClose,
  onRunDemo,
}) => {
  const [slide, setSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: "1. The Rural Healthcare Crisis in India",
      badge: "Problem Statement",
      icon: Users,
      color: "rose",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Over <strong className="text-white">70% of India's population</strong> resides in rural areas, yet more than <strong className="text-white">60% of secondary and tertiary hospital beds</strong> are clustered in metropolitan cities.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-1">
              <span className="font-bold text-rose-300">The 3 Crucial Delays:</span>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li>Delay in deciding to seek care (misjudging triage)</li>
                <li>Delay in reaching appropriate facility (distance/roads)</li>
                <li>Delay in receiving adequate care (stockouts & missing doctors)</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="font-bold text-teal-300">Fragmented Information:</span>
              <p className="text-slate-400">
                Primary Health Centres (PHCs) lack real-time visibility into bed and oxygen status at District Hospitals, causing blind transfers and lost-to-follow-up cases.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "2. Target Patient Persona",
      badge: "Synthetic Case Study",
      icon: HeartPulse,
      color: "teal",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Meet <strong className="text-white">Rameshappa G. (58y, Male)</strong>, an agricultural worker from Mallenahalli Gram Panchayat, Bhadravathi, Karnataka.
          </p>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-black/40"><span className="text-slate-400">SpO2:</span> <strong className="text-rose-400 font-mono">88% (Severe)</strong></div>
              <div className="p-2 rounded bg-black/40"><span className="text-slate-400">Resp Rate:</span> <strong className="text-rose-400 font-mono">28 /min (Tachypnea)</strong></div>
              <div className="p-2 rounded bg-black/40"><span className="text-slate-400">Connectivity:</span> <strong className="text-amber-400">Limited / 2G</strong></div>
              <div className="p-2 rounded bg-black/40"><span className="text-slate-400">Road:</span> <strong className="text-amber-400">Rough Terrain</strong></div>
            </div>
            <p className="text-slate-300 pt-1">
              Brought on motorcycle to Kudligere PHC. The local PHC oxygen concentrator filter is defective and IV antibiotics are stocked out. A blind decision could be fatal.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "3. Seven Cooperating AI Agents (Not a Chatbot)",
      badge: "Agentic Architecture",
      icon: Cpu,
      color: "purple",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            Unlike generic LLM chatbots that produce conversational hallucinations, CuraReach AgentX executes a <strong className="text-white">structured multi-agent pipeline</strong> where each agent has an isolated clinical responsibility:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-teal-500/30 font-mono text-[11px] text-teal-300">1. Triage Agent</div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-cyan-500/30 font-mono text-[11px] text-cyan-300">2. Access Intel</div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-blue-500/30 font-mono text-[11px] text-blue-300">3. Facility Match</div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/30 font-mono text-[11px] text-emerald-300">4. Resource Agent</div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-indigo-500/30 font-mono text-[11px] text-indigo-300">5. Coordinator</div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-amber-500/30 font-mono text-[11px] text-amber-300">6. Referral Agent</div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-purple-500/30 font-mono text-[11px] text-purple-300 col-span-2">7. Care Continuity Agent</div>
          </div>
        </div>
      )
    },
    {
      title: "4. Clinical Triage & Red-Flag Escalation",
      badge: "Decision Support",
      icon: Stethoscope,
      color: "rose",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p className="text-sm leading-relaxed">
            The Triage Agent categorizes into 4 standardized tiers: <strong className="text-emerald-400">LOW</strong>, <strong className="text-cyan-400">MODERATE</strong>, <strong className="text-amber-400">HIGH</strong>, and <strong className="text-rose-400">EMERGENCY</strong>.
          </p>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-200">Strict Human Clinical Safety Rule:</div>
            <p className="text-slate-400 leading-relaxed">
              "AI-generated decision support. Not a medical diagnosis. Human verification is required."
              High and emergency escalations mandate registered doctor sign-off before ambulance release.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "5. Access Intelligence & Road Modeling",
      badge: "Geographic Feasibility",
      icon: MapPin,
      color: "cyan",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p className="text-sm leading-relaxed">
            The Access Intelligence Agent integrates real-world rural physical constraints:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-teal-300 block mb-1">Road Condition:</span>
              <span>Predicts transit slowdowns on rough or unpaved terrain (+20 mins).</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">Bandwidth:</span>
              <span>Contraindicates video teleconsult when 2G/offline; shifts to local storage.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-cyan-300 block mb-1">108 Dispatch:</span>
              <span>Estimates realistic ambulance response windows (~45 mins).</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "6. Facility & Resource Gap Matching",
      badge: "Capacity Routing",
      icon: Boxes,
      color: "emerald",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p className="text-sm leading-relaxed">
            Rather than simply picking the closest clinic, the Facility & Resource agents cross-examine clinical readiness:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-200 font-semibold">
              <span>Why McGann District Hospital was matched:</span>
              <span className="text-teal-300 font-mono">Match Score: 94%</span>
            </div>
            <p className="text-slate-400">
              1. Continuous medical oxygen manifold is operational.<br />
              2. On-duty pulmonologist and ICU beds available.<br />
              3. Kudligere PHC is bypassed because of defective oxygen concentrator and drug stockout.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "7. 108 Referral Protocol & Digital Handover",
      badge: "Inter-Facility Protocol",
      icon: Ambulance,
      color: "amber",
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p className="text-sm leading-relaxed">
            Eliminating blind transfers through standardized digital referral slips:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300">Pre-Hospital Stabilization:</span>
              <p className="text-slate-400">
                Directives issued to ambulance EMT: keep patient upright at 45°, maintain supplemental O2, log vitals every 10 mins.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-teal-300">Doctor Sign-Off:</span>
              <p className="text-slate-400">
                Medical Officer can review justification, add notes, and approve the referral directly in the UI.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "8. Organisation Community Worker Care Continuity & System Impact",
      badge: "Longitudinal Care",
      icon: TrendingUp,
      color: "teal",
      content: (
        <div className="space-y-4 text-xs text-slate-300">
          <p className="text-sm leading-relaxed">
            Care does not stop when the patient leaves the hospital. The Care Continuity Agent establishes an unbroken link to the village:
          </p>
          <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-2">
            <span className="font-bold text-teal-300 block">Longitudinal Follow-up Grid:</span>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>Automatic scheduling of organisation-appointed community health worker 48-hour home visit.</li>
              <li>Automated patient telephony/SMS dispatch in local language.</li>
              <li>Interactive milestone tracker preventing post-acute relapse and mortality.</li>
            </ul>
          </div>
          <div className="text-center pt-2">
            <button
              onClick={() => {
                onClose();
                onRunDemo();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/25 inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Launch Live Interactive Demo Now</span>
            </button>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slides[slide];
  const Icon = currentSlide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b1220] border border-teal-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                Judge Presentation Mode
              </span>
              <h3 className="text-lg font-bold text-white">
                CuraReach AgentX Walkthrough
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              {currentSlide.badge}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Slide {slide + 1} of {slides.length}
            </span>
          </div>
          <h4 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Icon className="w-5 h-5 text-teal-400" />
            <span>{currentSlide.title}</span>
          </h4>
        </div>

        {/* Slide Body */}
        <div className="min-h-[220px]">
          {currentSlide.content}
        </div>

        {/* Slide Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setSlide(prev => Math.max(0, prev - 1))}
            disabled={slide === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-300 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === slide ? 'bg-teal-400 w-5' : 'bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {slide < slides.length - 1 ? (
            <button
              onClick={() => setSlide(prev => Math.min(slides.length - 1, prev + 1))}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onRunDemo();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Run Live Demo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
