import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { DemoScenarioModal } from './components/common/DemoScenarioModal';
import { PatientDashboard } from './components/dashboards/PatientDashboard';
import { WorkerDashboard } from './components/dashboards/WorkerDashboard';
import { ClinicianDashboard } from './components/dashboards/ClinicianDashboard';
import { HospitalDashboard } from './components/dashboards/HospitalDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { UserRole, UserProfile, CaseSummary, DemoScenario } from './types/curareach';
import { 
  fetchMe, 
  fetchCases, 
  fetchDemoScenarios, 
  switchDemoRoleApi,
  getStoredToken 
} from './services/curareachApi';
import { Activity, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react';

export const App: React.FC = () => {
  const [activeRole, setActiveRole] = useState<UserRole>('PATIENT');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize or fetch current session
  const initSession = async () => {
    setIsLoading(true);
    try {
      // Check if token exists, else switch into default demo patient role
      let token = getStoredToken();
      if (!token) {
        const res = await switchDemoRoleApi('PATIENT');
        setCurrentUser(res.user);
        setActiveRole('PATIENT');
      } else {
        try {
          const user = await fetchMe();
          setCurrentUser(user);
          setActiveRole(user.role);
        } catch {
          const res = await switchDemoRoleApi('PATIENT');
          setCurrentUser(res.user);
          setActiveRole('PATIENT');
        }
      }

      // Load cases and demo scenarios
      const [casesRes, scRes] = await Promise.all([
        fetchCases(),
        fetchDemoScenarios()
      ]);
      setCases(casesRes);
      setScenarios(scRes);
    } catch (err: any) {
      console.error('Initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  const handleRefreshData = async () => {
    try {
      const [user, casesRes] = await Promise.all([
        fetchMe().catch(() => currentUser),
        fetchCases()
      ]);
      if (user) setCurrentUser(user);
      setCases(casesRes);
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setActiveRole(newRole);
    try {
      const res = await switchDemoRoleApi(newRole);
      setCurrentUser(res.user);
      const casesRes = await fetchCases();
      setCases(casesRes);
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  const handleSelectScenario = async (
    scenario: DemoScenario, 
    targetRole: UserRole, 
    targetCaseNumber?: string
  ) => {
    await handleRoleChange(targetRole);
    await handleRefreshData();
  };

  return (
    <div className="min-h-screen bg-[#060D17] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Persistent Navigation Header & Quick Role Switcher */}
      <Header
        currentUser={currentUser}
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        onOpenScenarioModal={() => setIsScenarioModalOpen(true)}
        onRefreshData={handleRefreshData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-ping" />
              <div className="w-14 h-14 rounded-full border-4 border-teal-500 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-200">Initializing CuraReach 360 AI Grid...</p>
              <p className="text-xs text-teal-400 font-mono mt-1">Connecting to FastAPI &amp; SQLite Shared Database</p>
            </div>
          </div>
        ) : (
          <>
            {activeRole === 'PATIENT' && (
              <PatientDashboard
                currentUser={currentUser!}
                cases={cases}
                onRefresh={handleRefreshData}
              />
            )}

            {activeRole === 'COMMUNITY_WORKER' && (
              <WorkerDashboard
                currentUser={currentUser!}
                cases={cases}
                onRefresh={handleRefreshData}
              />
            )}

            {activeRole === 'CLINICIAN' && (
              <ClinicianDashboard
                currentUser={currentUser!}
                cases={cases}
                onRefresh={handleRefreshData}
              />
            )}

            {activeRole === 'HOSPITAL_STAFF' && (
              <HospitalDashboard
                currentUser={currentUser!}
                cases={cases}
                onRefresh={handleRefreshData}
              />
            )}

            {activeRole === 'CURAREACH_ADMIN' && (
              <AdminDashboard
                currentUser={currentUser!}
                cases={cases}
                onRefresh={handleRefreshData}
              />
            )}
          </>
        )}
      </main>

      {/* Safety & Compliance Disclaimer Footer */}
      <footer className="bg-[#0B192C] border-t border-slate-800/80 py-6 px-4 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-300 font-bold">
              <span>CuraReach 360</span>
              <span className="text-teal-400">&bull;</span>
              <span className="text-teal-300 font-medium">Predict the Gap. Adapt the Pathway. Complete the Care.</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
              <strong>Mandatory Safety Notice:</strong> AI-generated decision support only. Not an autonomous medical diagnostic service, emergency dispatch system, or guarantee of treatment. Clinician verification required for all clinical decisions and referral dispatches. In India, call <strong>112</strong> for immediate medical emergencies.
            </p>
          </div>

          <div className="text-right text-[11px] text-slate-500 space-y-0.5">
            <div>Team ID: <strong className="text-slate-300">AX26-202</strong> (Agent X 2026 Hackathon)</div>
            <div>Lead: Huzefa Salami | MD Muneeb | Mohammed Uzair | G Sumith Reddy</div>
          </div>
        </div>
      </footer>

      {/* Judge Demo Scenario Modal */}
      <DemoScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        scenarios={scenarios}
        onSelectScenario={handleSelectScenario}
      />
    </div>
  );
};

export default App;
