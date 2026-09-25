import React from 'react';
import { 
  X, 
  Zap, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  HeartHandshake, 
  Camera, 
  Flame, 
  Building 
} from 'lucide-react';
import { DemoScenario, UserRole } from '../../types/curareach';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: DemoScenario[];
  onSelectScenario: (scenario: DemoScenario, targetRole: UserRole, targetCaseNumber?: string) => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  onSelectScenario
}) => {
  if (!isOpen) return null;

  const getScenarioIcon = (code: string) => {
    switch (code) {
      case 'SCENARIO_A': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'SCENARIO_B': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'SCENARIO_C': return <HeartHandshake className="w-5 h-5 text-teal-400" />;
      case 'SCENARIO_D': return <Camera className="w-5 h-5 text-blue-400" />;
      case 'SCENARIO_E': return <Flame className="w-5 h-5 text-red-500 animate-pulse" />;
      case 'SCENARIO_F': return <Building className="w-5 h-5 text-purple-400" />;
      default: return <Zap className="w-5 h-5 text-teal-400" />;
    }
  };

  const getRecommendedRole = (code: string): UserRole => {
    switch (code) {
      case 'SCENARIO_A': return 'PATIENT';
      case 'SCENARIO_B': return 'CLINICIAN';
      case 'SCENARIO_C': return 'COMMUNITY_WORKER';
      case 'SCENARIO_D': return 'CLINICIAN';
      case 'SCENARIO_E': return 'PATIENT';
      case 'SCENARIO_F': return 'CURAREACH_ADMIN';
      default: return 'CLINICIAN';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-slate-900 border border-teal-500/30 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950/80 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400 border border-teal-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Hackathon Judge Demo Scenarios
                <span className="text-xs font-normal text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">
                  Agent X 2026
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                1-Click verification of all 6 required end-to-end scenarios across the shared 5-role backend.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
          {scenarios.map((sc) => {
            const role = getRecommendedRole(sc.code);
            return (
              <div
                key={sc.code}
                className="bg-slate-950/70 border border-slate-800 hover:border-teal-500/50 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-teal-950/30"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getScenarioIcon(sc.code)}
                      <span className="font-bold text-sm text-slate-200">{sc.title}</span>
                    </div>
                    {sc.case_number && (
                      <span className="text-[10px] font-mono bg-slate-800 text-teal-300 px-1.5 py-0.5 rounded">
                        {sc.case_number}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    {sc.description}
                  </p>

                  <div className="text-[11px] text-slate-400 space-y-1 mb-4 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <strong className="text-slate-300">Focus:</strong>{' '}
                      <span className="text-teal-400 font-medium">{sc.role_focus}</span>
                    </div>
                    <div>
                      <strong className="text-slate-300">Subject:</strong> {sc.patient}
                    </div>
                    {sc.initial_state && (
                      <div>
                        <strong className="text-slate-300">State:</strong>{' '}
                        <span className="font-mono text-amber-300">{sc.initial_state}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectScenario(sc, role, sc.case_number);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                >
                  <span>Launch as {role.replace('_', ' ')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>All five dashboards share live SQLite database state.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
