import React, { useState } from 'react';
import { 
  Activity, 
  Shield, 
  UserCheck, 
  Stethoscope, 
  Building2, 
  User, 
  RotateCcw, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types/curareach';
import { switchDemoRoleApi, resetDemoDatabaseApi } from '../../services/curareachApi';

interface HeaderProps {
  currentUser: UserProfile | null;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenScenarioModal: () => void;
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeRole,
  onRoleChange,
  onOpenScenarioModal,
  onRefreshData
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleRoleSelect = async (role: UserRole) => {
    try {
      await switchDemoRoleApi(role);
      onRoleChange(role);
      onRefreshData();
    } catch (err: any) {
      console.error('Role switch failed:', err);
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Reset database to clean initial state for Scenarios A - F?')) return;
    setIsResetting(true);
    try {
      await resetDemoDatabaseApi();
      setResetMessage('Database reset successfully!');
      setTimeout(() => setResetMessage(null), 3000);
      onRefreshData();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const rolesConfig: Array<{ role: UserRole; label: string; icon: any; color: string }> = [
    { role: 'PATIENT', label: 'Patient', icon: User, color: 'text-emerald-400' },
    { role: 'COMMUNITY_WORKER', label: 'Community Worker', icon: UserCheck, color: 'text-amber-400' },
    { role: 'CLINICIAN', label: 'Doctor / Coordinator', icon: Stethoscope, color: 'text-cyan-400' },
    { role: 'HOSPITAL_STAFF', label: 'Hospital Staff', icon: Building2, color: 'text-blue-400' },
    { role: 'CURAREACH_ADMIN', label: 'CuraReach Admin', icon: Shield, color: 'text-purple-400' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B192C] border-b border-slate-800 shadow-xl">
      {/* Top Hackathon & Judge Notification Strip */}
      <div className="bg-gradient-to-r from-teal-900/60 via-slate-900 to-indigo-950/80 px-4 py-1.5 text-xs border-b border-teal-500/20 flex flex-wrap items-center justify-between text-slate-300">
        <div className="flex items-center space-x-3">
          <span className="flex items-center font-bold tracking-wider text-teal-400 uppercase bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping mr-1.5 inline-block" />
            Agent X 2026
          </span>
          <span className="text-slate-400">Team ID: <strong className="text-slate-200">AX26-202</strong></span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">Huzefa Salami (Lead), MD Muneeb, Mohammed Uzair, G Sumith Reddy</span>
        </div>

        <div className="flex items-center space-x-3 mt-1 sm:mt-0">
          <button
            onClick={onOpenScenarioModal}
            className="flex items-center space-x-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium shadow-sm transition-all text-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Judge Demo Scenarios (A - F)</span>
          </button>
          <button
            onClick={handleResetDb}
            disabled={isResetting}
            className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700 transition-colors"
            title="Reset database to initial demo seed"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Seed'}</span>
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="bg-emerald-900/90 text-emerald-200 text-xs py-1 px-4 text-center border-b border-emerald-700/50">
          {resetMessage}
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-teal-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white">CuraReach</span>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">360</span>
                <span className="text-[10px] uppercase font-semibold bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">MVP</span>
              </div>
              <p className="text-[11px] text-teal-300/80 tracking-wide font-medium hidden sm:block">
                Predict the Gap. Adapt the Pathway. Complete the Care.
              </p>
            </div>
          </div>

          {/* 5 Connected Dashboard Switcher Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {rolesConfig.map((item) => {
              const Icon = item.icon;
              const isActive = activeRole === item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-900/50' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Current User Pill / Mobile Dropdown */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{currentUser?.full_name || 'Loading user...'}</div>
              <div className="text-[10px] text-teal-400 font-mono flex items-center justify-end space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{currentUser?.role || activeRole}</span>
              </div>
            </div>

            {/* Mobile Role Select */}
            <div className="lg:hidden">
              <select
                value={activeRole}
                onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                className="bg-slate-900 border border-slate-700 text-teal-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
              >
                {rolesConfig.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
