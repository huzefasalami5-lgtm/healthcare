import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Cpu, 
  Play, 
  RotateCcw, 
  Award, 
  Sparkles,
  HeartPulse,
  Wifi,
  ExternalLink,
  UserPlus,
  HeartHandshake
} from 'lucide-react';
import { ThemeSelector, AppTheme } from './ThemeSelector';

export type DashboardView = 'command-center' | 'registration' | 'patient-portal';

interface HeaderProps {
  isRunning: boolean;
  onRunDemo: () => void;
  onResetDemo: () => void;
  onOpenJudgeMode: () => void;
  backendOnline: boolean;
  activePresetName: string;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  activeView: DashboardView;
  onSelectView: (view: DashboardView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onRunDemo,
  onResetDemo,
  onOpenJudgeMode,
  backendOnline,
  activePresetName,
  currentTheme,
  onSelectTheme,
  activeView,
  onSelectView,
}) => {
  const isWhite = currentTheme === 'clinical-white' || currentTheme === 'clinical-light';

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-300 ${
      isWhite
        ? 'border-slate-200/90 bg-white/95 text-slate-900 shadow-sm'
        : 'border-slate-800/80 bg-[#080d1a]/90 text-white'
    }`}>
      {/* Top AI Safety Compliance Banner */}
      <div className={`border-b px-4 py-1.5 text-xs flex items-center justify-between transition-colors ${
        isWhite
          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
          : 'bg-gradient-to-r from-amber-500/15 via-teal-500/10 to-amber-500/15 border-amber-500/20 text-amber-300/90'
      }`}>
        <div className="flex items-center space-x-2 mx-auto sm:mx-0">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold">
            Clinical Decision Support Prototype:
          </span>
          <span className={`hidden sm:inline ${isWhite ? 'text-slate-600' : 'text-slate-300'}`}>
            Not a medical diagnosis. Human clinical verification required for all actions.
          </span>
        </div>
        <div className={`hidden md:flex items-center space-x-3 text-[11px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>7 Autonomous Agents Online</span>
          </span>
          <span>•</span>
          <span>Ayushman Bharat / 108 Referral Grid</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-0.5 shadow-lg shadow-teal-500/20 flex items-center justify-center">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${isWhite ? 'bg-white' : 'bg-slate-950'}`}>
              <HeartPulse className="w-5 h-5 text-teal-600 animate-pulse-badge" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className={`text-xl font-bold tracking-tight flex items-center gap-1.5 ${isWhite ? 'text-slate-900' : 'text-white'}`}>
                CuraReach <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent">AgentX</span>
              </h1>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                isWhite
                  ? 'bg-teal-50 text-teal-700 border border-teal-300'
                  : 'bg-teal-950/80 text-teal-300 border border-teal-800/60'
              }`}>
                Agentic AI
              </span>
            </div>
            <p className={`text-xs flex items-center gap-2 ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Predict → Triage → Match → Refer → Follow-up</span>
              <span className={`hidden lg:inline ${isWhite ? 'text-slate-300' : 'text-slate-600'}`}>•</span>
              <span className={`hidden lg:inline font-mono text-[11px] ${isWhite ? 'text-teal-700 font-medium' : 'text-teal-400/80'}`}>Rural Healthcare Grid</span>
            </p>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="hidden xl:flex items-center space-x-3 text-xs">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${
            isWhite ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`font-medium ${isWhite ? 'text-slate-700' : 'text-slate-300'}`}>
              {backendOnline ? 'FastAPI Grid Active' : 'Offline Deterministic Grid'}
            </span>
          </div>

          <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border ${
            isWhite ? 'bg-slate-100/90 border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}>
            <span className={isWhite ? 'text-slate-500' : 'text-slate-400'}>Active Case:</span>
            <span className={`font-medium truncate max-w-[140px] ${isWhite ? 'text-teal-700 font-semibold' : 'text-teal-300'}`}>{activePresetName}</span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Background Theme Selector */}
          <ThemeSelector currentTheme={currentTheme} onSelectTheme={onSelectTheme} />

          {/* Judge Demo Presentation Mode */}
          <button
            onClick={onOpenJudgeMode}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-xs font-semibold shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              isWhite
                ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
                : 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-800/60 hover:to-indigo-800/60 border-purple-500/40 text-purple-200'
            }`}
            title="Open Judge Presentation Walkthrough"
          >
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Judge Demo Mode</span>
            <span className="sm:hidden">Judges</span>
          </button>

          {/* Reset Demo */}
          <button
            onClick={onResetDemo}
            disabled={isRunning}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150 disabled:opacity-50 ${
              isWhite
                ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300'
            }`}
            title="Reset to Initial State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Start Care Assessment / Run Demo */}
          <button
            onClick={onRunDemo}
            disabled={isRunning}
            className="relative flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRunning ? (
              <>
                <Cpu className="w-4 h-4 animate-spin text-white" />
                <span>Agents Processing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span className="tracking-wide uppercase text-[11px]">Start Care Assessment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary View Switcher Navigation Strip */}
      <div className={`border-t px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs transition-colors duration-300 ${
        isWhite
          ? 'border-slate-200 bg-slate-50/95 text-slate-700'
          : 'border-slate-800/80 bg-slate-950/70 text-slate-300'
      }`}>
        <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => onSelectView('command-center')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeView === 'command-center'
                ? isWhite
                  ? 'bg-teal-100 text-teal-800 border border-teal-400 shadow-sm'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-sm'
                : isWhite
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Clinical Command Center</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
              isWhite
                ? 'bg-teal-50 text-teal-700 border-teal-300'
                : 'bg-teal-950/80 text-teal-300 border border-teal-800'
            }`}>
              7 AI Agents
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('registration')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeView === 'registration'
                ? isWhite
                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-400 shadow-sm'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : isWhite
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-600" />
            <span>Patient Bedside Registration</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
              isWhite
                ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
            }`}>
              Field Intake
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('patient-portal')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeView === 'patient-portal'
                ? isWhite
                  ? 'bg-rose-100 text-rose-800 border border-rose-400 shadow-sm'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                : isWhite
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
            <span>Patient & Caregiver Portal</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
              isWhite
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800'
            }`}>
              My Care
            </span>
          </button>
        </div>

        {/* Active Patient Indicator */}
        <div className={`hidden lg:flex items-center space-x-2 text-[11px] ${isWhite ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>Active Patient:</span>
          <span className={`font-bold ${isWhite ? 'text-teal-700' : 'text-teal-300'}`}>{activePresetName}</span>
        </div>
      </div>
    </header>
  );
};
