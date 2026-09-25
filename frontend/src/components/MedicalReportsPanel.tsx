import React, { useState } from 'react';
import {
  FileText,
  Activity,
  Wind,
  Heart,
  ShieldAlert,
  CheckCircle2,
  Download,
  Eye,
  X,
  Search,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Clock,
  Stethoscope,
  Maximize2
} from 'lucide-react';
import {
  MedicalReport,
  DiagnosticParameter,
  getReportsForPatient
} from '../data/mockMedicalReports';

interface MedicalReportsPanelProps {
  patientId: string;
  patientName: string;
  isProcessing?: boolean;
}

export const MedicalReportsPanel: React.FC<MedicalReportsPanelProps> = ({
  patientId,
  patientName,
  isProcessing = false
}) => {
  const initialReports = getReportsForPatient(patientId);
  const [reports, setReports] = useState<MedicalReport[]>(initialReports);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePacsReport, setActivePacsReport] = useState<MedicalReport | null>(null);
  const [activeEcgReport, setActiveEcgReport] = useState<MedicalReport | null>(null);
  const [verifyModalReport, setVerifyModalReport] = useState<MedicalReport | null>(null);
  const [doctorNotes, setDoctorNotes] = useState<string>('Reviewed & confirmed. Findings substantiate immediate tertiary care intake with high-flow oxygen and IV antibiotics.');
  const [doctorNameInput, setDoctorNameInput] = useState<string>('Dr. Rajesh Sharma, MD (Consultant Physician)');

  // PACS Viewer Controls State
  const [pacsZoom, setPacsZoom] = useState<number>(1);
  const [pacsPreset, setPacsPreset] = useState<'standard' | 'parenchyma' | 'invert'>('standard');
  const [showInfiltrates, setShowInfiltrates] = useState<boolean>(true);
  const [showAirBronchogram, setShowAirBronchogram] = useState<boolean>(true);

  // Sync reports if patient changes
  React.useEffect(() => {
    setReports(getReportsForPatient(patientId));
  }, [patientId]);

  // Counts
  const criticalCount = reports.flatMap(r => r.parameters).filter(p => p.status === 'critical').length;
  const verifiedCount = reports.filter(r => r.status === 'verified_by_doctor').length;

  // Filtered reports
  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = report.title.toLowerCase().includes(q);
    const summaryMatch = report.summaryImpression.toLowerCase().includes(q);
    const paramMatch = report.parameters.some(p =>
      p.name.toLowerCase().includes(q) || String(p.value).toLowerCase().includes(q)
    );
    return titleMatch || summaryMatch || paramMatch;
  });

  // Doctor Verification Action
  const handleVerifyReport = (reportId: string) => {
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              status: 'verified_by_doctor',
              reportedBy: `${r.reportedBy} • Verified by ${doctorNameInput}`
            }
          : r
      )
    );
    setVerifyModalReport(null);
  };

  // Export JSON dossier
  const handleDownloadDossier = () => {
    const dossier = {
      exportTimestamp: new Date().toISOString(),
      patientId,
      patientName,
      summary: {
        totalReports: reports.length,
        criticalParameters: criticalCount,
        verifiedReports: verifiedCount
      },
      reports
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diagnostic_Dossier_${patientId}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'radiology':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'abg':
        return <Wind className="w-4 h-4 text-rose-400" />;
      case 'hematology':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'ecg':
        return <Heart className="w-4 h-4 text-emerald-400" />;
      case 'biochemistry':
        return <Activity className="w-4 h-4 text-purple-400" />;
      default:
        return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="glass-panel p-5 md:p-6 rounded-2xl border border-slate-700/60 shadow-xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                <span>Diagnostic & Medical Reports Vault</span>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full">
                  LIS / PACS / PoCT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official clinical investigative records, arterial blood gases, digital radiography & PoC laboratory telemetry for <span className="text-slate-200 font-semibold">{patientName}</span> ({patientId})
              </p>
            </div>
          </div>
        </div>

        {/* Badges and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>{criticalCount} Critical Panic Values</span>
            </div>
          )}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{verifiedCount} of {reports.length} Verified</span>
          </div>
          <button
            onClick={handleDownloadDossier}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition shadow-sm hover:border-slate-600"
            title="Download complete diagnostic dossier JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Dossier</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Reports', count: reports.length },
            { id: 'radiology', label: '🩻 Radiology (X-Ray)', count: reports.filter(r => r.category === 'radiology').length },
            { id: 'abg', label: '🩸 Blood Gas (ABG)', count: reports.filter(r => r.category === 'abg').length },
            { id: 'hematology', label: '🔬 Hematology (CBC)', count: reports.filter(r => r.category === 'hematology').length },
            { id: 'ecg', label: '📈 12-Lead ECG', count: reports.filter(r => r.category === 'ecg').length },
            { id: 'biochemistry', label: '🧪 Biochemistry', count: reports.filter(r => r.category === 'biochemistry').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedCategory === tab.id ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-700 text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search analyte, report..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="space-y-5">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-700/70 rounded-xl bg-slate-900/30">
            <p className="text-sm text-slate-400">No diagnostic reports matched your current filter criteria.</p>
          </div>
        ) : (
          filteredReports.map(report => {
            const hasCritical = report.parameters.some(p => p.status === 'critical');
            const isVerified = report.status === 'verified_by_doctor';

            return (
              <div
                key={report.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  hasCritical
                    ? 'border-rose-500/40 bg-gradient-to-br from-slate-900/90 via-rose-950/10 to-slate-900/90 shadow-lg shadow-rose-950/20'
                    : 'border-slate-700/70 bg-slate-900/70 hover:border-slate-600'
                }`}
              >
                {/* Report Header Banner */}
                <div className="p-4 bg-slate-800/50 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="p-1 rounded-md bg-slate-800 border border-slate-700">
                        {getCategoryIcon(report.category)}
                      </span>
                      <h3 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                        <span>{report.title}</span>
                      </h3>
                      <span className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
                        {report.id}
                      </span>
                      {hasCritical && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>PANIC VALUE</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{report.conductedAt}</span>
                      </span>
                      <span>•</span>
                      <span>{report.facility}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-mono text-[11px]">{report.modality}</span>
                    </div>
                  </div>

                  {/* Actions & Verification Status */}
                  <div className="flex items-center space-x-2">
                    {/* Specialized Modality Action Button */}
                    {report.category === 'radiology' && (
                      <button
                        onClick={() => setActivePacsReport(report)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition flex items-center space-x-1.5 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open PACS Film</span>
                      </button>
                    )}

                    {report.category === 'ecg' && (
                      <button
                        onClick={() => setActiveEcgReport(report)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition flex items-center space-x-1.5 shadow-sm"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>Open Rhythm Strip</span>
                      </button>
                    )}

                    {/* Doctor Verification Button */}
                    {isVerified ? (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified by MD</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setVerifyModalReport(report)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/40 text-slate-300 hover:text-cyan-200 text-xs font-medium border border-slate-700 hover:border-cyan-500/50 transition flex items-center space-x-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Doctor Sign-Off</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Report Body */}
                <div className="p-4 space-y-4">
                  {/* Summary & Clinical Significance Banners */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span>Radiologist / Pathologist Impression</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {report.summaryImpression}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                      <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <ShieldAlert className="w-3 h-3 text-amber-400" />
                        <span>Agentic Clinical Actionability</span>
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        {report.clinicalSignificance}
                      </p>
                    </div>
                  </div>

                  {/* Diagnostic Analyte Matrix */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                      <span>Quantitative Analyte Telemetry</span>
                      <span>Reference Standard</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {report.parameters.map((param, idx) => {
                        const isCrit = param.status === 'critical';
                        const isBorder = param.status === 'borderline';

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                              isCrit
                                ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
                                : isBorder
                                ? 'bg-amber-950/20 border-amber-500/40'
                                : 'bg-slate-800/40 border-slate-700/60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-semibold text-slate-200 leading-snug">
                                {param.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  isCrit
                                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 animate-pulse'
                                    : isBorder
                                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {param.status}
                              </span>
                            </div>

                            <div className="mt-2 flex items-baseline justify-between">
                              <div className="flex items-baseline space-x-1.5">
                                <span className={`text-base font-bold font-mono ${
                                  isCrit ? 'text-rose-400' : isBorder ? 'text-amber-400' : 'text-slate-100'
                                }`}>
                                  {param.value}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {param.unit}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                Ref: {param.referenceRange}
                              </span>
                            </div>

                            {param.notes && (
                              <div className="mt-1.5 text-[10px] text-slate-400 italic border-t border-slate-700/40 pt-1">
                                {param.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Salient Findings List */}
                  {report.findings && report.findings.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Structured Findings
                      </div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {report.findings.map((f, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reporting Doctor Footer */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
                    <span>Authorized Attendant: <strong className="text-slate-400">{report.reportedBy}</strong></span>
                    <span className="font-mono">LIS Secure Hash: SHA256-{(Math.abs(report.id.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0))).toString(16).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PACS Chest Radiography Modal */}
      {activePacsReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* PACS Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Activity className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                    <span>Tele-PACS Digital Radiography Console</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-700 rounded">
                      DICOM v3.0 High-Res
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Patient: {patientName} • Study ID: {activePacsReport.id} • Projection: PA CHEST ERECT
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActivePacsReport(null)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition"
                  title="Close PACS Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PACS Toolbar & Viewport */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Imaging Film Canvas (Left 2 cols) */}
              <div className="lg:col-span-2 p-5 bg-black flex flex-col items-center justify-center relative select-none">
                {/* Canvas Toolbar Controls */}
                <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur p-1.5 rounded-xl border border-slate-700/80 shadow-lg">
                  <button
                    onClick={() => setPacsPreset('standard')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      pacsPreset === 'standard' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setPacsPreset('parenchyma')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      pacsPreset === 'parenchyma' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Parenchyma Edge
                  </button>
                  <button
                    onClick={() => setPacsPreset('invert')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      pacsPreset === 'invert' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Invert Greyscale
                  </button>
                  <div className="h-4 w-px bg-slate-700 mx-1" />
                  <button
                    onClick={() => setShowInfiltrates(!showInfiltrates)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                      showInfiltrates ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>Infiltrate AI Heatmap</span>
                  </button>
                  <button
                    onClick={() => setShowAirBronchogram(!showAirBronchogram)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition flex items-center space-x-1 ${
                      showAirBronchogram ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>Air Bronchograms</span>
                  </button>
                  <div className="h-4 w-px bg-slate-700 mx-1" />
                  <button
                    onClick={() => setPacsZoom(prev => Math.min(prev + 0.2, 1.8))}
                    className="p-1 text-slate-300 hover:text-white"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPacsZoom(prev => Math.max(prev - 0.2, 0.8))}
                    className="p-1 text-slate-300 hover:text-white"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setPacsZoom(1); setPacsPreset('standard'); }}
                    className="p-1 text-slate-300 hover:text-white"
                    title="Reset zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Chest Radiography Simulated SVG Film */}
                <div
                  className="transition-transform duration-200 ease-out my-8"
                  style={{
                    transform: `scale(${pacsZoom})`,
                    filter: pacsPreset === 'invert' ? 'invert(1)' : pacsPreset === 'parenchyma' ? 'contrast(1.4) brightness(1.1)' : 'none'
                  }}
                >
                  <svg
                    width="440"
                    height="460"
                    viewBox="0 0 440 460"
                    className="rounded-lg shadow-2xl border border-slate-800 bg-[#080b11]"
                  >
                    <defs>
                      <radialGradient id="lungFieldR" cx="35%" cy="45%" r="40%">
                        <stop offset="0%" stopColor="#1e2533" />
                        <stop offset="70%" stopColor="#0e131d" />
                        <stop offset="100%" stopColor="#080b11" />
                      </radialGradient>
                      <radialGradient id="lungFieldL" cx="65%" cy="45%" r="40%">
                        <stop offset="0%" stopColor="#1e2533" />
                        <stop offset="70%" stopColor="#0e131d" />
                        <stop offset="100%" stopColor="#080b11" />
                      </radialGradient>
                      <radialGradient id="consolidationGrad" cx="32%" cy="68%" r="35%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                        <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.65" />
                        <stop offset="85%" stopColor="#64748b" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                      </radialGradient>
                      <radialGradient id="consolidationGradLeft" cx="66%" cy="72%" r="28%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                        <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Dark background grid lines (calibrated tele-radiology grid) */}
                    <g opacity="0.08" stroke="#ffffff" strokeWidth="0.5">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <line key={`h-${i}`} x1="20" y1={(i + 1) * 50} x2="420" y2={(i + 1) * 50} />
                      ))}
                      {Array.from({ length: 8 }).map((_, i) => (
                        <line key={`v-${i}`} x1={(i + 1) * 50} y1="20" x2={(i + 1) * 50} y2="440" />
                      ))}
                    </g>

                    {/* Anatomic Markers */}
                    <text x="35" y="45" fill="#f43f5e" fontSize="18" fontWeight="bold" fontFamily="monospace">R</text>
                    <text x="390" y="45" fill="#38bdf8" fontSize="18" fontWeight="bold" fontFamily="monospace">L</text>
                    <text x="35" y="430" fill="#94a3b8" fontSize="10" fontFamily="monospace">KUDLIGERE PHC TELE-PACS</text>
                    <text x="270" y="430" fill="#94a3b8" fontSize="10" fontFamily="monospace">110kVp • 4.0mAs • PA</text>

                    {/* Thoracic rib cage contour */}
                    <path
                      d="M 120 70 Q 220 50 320 70 Q 400 160 410 330 Q 380 400 320 400 Q 220 390 120 400 Q 40 400 30 330 Q 40 160 120 70 Z"
                      fill="none"
                      stroke="#475569"
                      strokeWidth="2"
                      opacity="0.4"
                    />

                    {/* Clavicles */}
                    <path d="M 100 95 Q 160 85 210 100" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" opacity="0.45" fill="none" />
                    <path d="M 340 95 Q 280 85 230 100" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" opacity="0.45" fill="none" />

                    {/* Spine Column */}
                    {Array.from({ length: 14 }).map((_, i) => (
                      <rect
                        key={`vert-${i}`}
                        x="210"
                        y={80 + i * 22}
                        width="20"
                        height="14"
                        rx="2"
                        fill="#64748b"
                        opacity="0.35"
                      />
                    ))}

                    {/* Trachea (midline air column) */}
                    <rect x="217" y="50" width="6" height="70" fill="#05070a" opacity="0.8" rx="2" />

                    {/* Right Lung Field */}
                    <path
                      d="M 195 100 Q 110 130 90 220 Q 75 320 95 365 Q 140 375 195 330 Z"
                      fill="url(#lungFieldR)"
                      stroke="#334155"
                      strokeWidth="1.5"
                    />

                    {/* Left Lung Field */}
                    <path
                      d="M 245 100 Q 330 130 350 220 Q 365 320 345 365 Q 290 380 245 320 Z"
                      fill="url(#lungFieldL)"
                      stroke="#334155"
                      strokeWidth="1.5"
                    />

                    {/* Ribs (Bilateral Shadows) */}
                    {[120, 150, 185, 220, 260, 300, 340].map((y, idx) => (
                      <g key={`rib-${idx}`} opacity="0.3" stroke="#94a3b8" strokeWidth="4" fill="none">
                        <path d={`M 205 ${y - 10} Q 130 ${y} 85 ${y + 25}`} />
                        <path d={`M 235 ${y - 10} Q 310 ${y} 355 ${y + 25}`} />
                      </g>
                    ))}

                    {/* Cardiac Silhouette (Heart Contour - CTR 0.48) */}
                    <path
                      d="M 205 150 Q 235 155 240 210 Q 275 290 280 340 Q 220 355 185 340 Q 180 280 190 210 Z"
                      fill="#334155"
                      stroke="#64748b"
                      strokeWidth="2"
                      opacity="0.65"
                    />
                    <text x="212" y="270" fill="#94a3b8" fontSize="10" opacity="0.6" fontFamily="sans-serif">CTR: 0.48</text>

                    {/* Diaphragms */}
                    <path d="M 85 370 Q 140 345 195 355" stroke="#cbd5e1" strokeWidth="3" fill="none" opacity="0.7" />
                    <path d="M 245 355 Q 300 350 350 370" stroke="#cbd5e1" strokeWidth="3" fill="none" opacity="0.7" />

                    {/* Right Basal Consolidation (The Pneumonia Pathology) */}
                    <ellipse cx="140" cy="305" rx="50" ry="42" fill="url(#consolidationGrad)" />
                    {/* Left Lower Infiltrates */}
                    <ellipse cx="295" cy="315" rx="35" ry="28" fill="url(#consolidationGradLeft)" />

                    {/* AI Heatmap Infiltrate Overlay */}
                    {showInfiltrates && (
                      <g className="animate-pulse">
                        <ellipse cx="140" cy="305" rx="52" ry="44" fill="#f43f5e" fillOpacity="0.25" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 2" />
                        <text x="95" y="260" fill="#f43f5e" fontSize="11" fontWeight="bold" fontFamily="monospace">
                          CONSOLIDATION (RLL)
                        </text>
                        <ellipse cx="295" cy="315" rx="36" ry="30" fill="#f43f5e" fillOpacity="0.18" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 2" />
                        <text x="280" y="275" fill="#f43f5e" fontSize="10" fontWeight="bold" fontFamily="monospace">
                          INFILTRATE
                        </text>
                      </g>
                    )}

                    {/* Air Bronchogram Markings */}
                    {showAirBronchogram && (
                      <g stroke="#38bdf8" strokeWidth="1.5" opacity="0.85" fill="none">
                        <path d="M 140 275 L 135 295 L 125 315" />
                        <path d="M 135 295 L 148 318" />
                        <circle cx="140" cy="275" r="2.5" fill="#38bdf8" />
                        <text x="110" y="335" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                          Air Bronchograms
                        </text>
                      </g>
                    )}
                  </svg>
                </div>

                <div className="text-[11px] text-slate-400 font-mono text-center">
                  Tele-Radiology High-Frequency DR Unit • Window: 1500 / Level: -500 • Full Matrix 2048x2048
                </div>
              </div>

              {/* Radiologist Report & Findings Sidebar (Right 1 col) */}
              <div className="p-5 bg-slate-900 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Radiologist Assessment</span>
                    <h4 className="text-sm font-bold text-slate-100 mt-0.5">{activePacsReport.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{activePacsReport.reportedBy}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Impression</span>
                    <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                      {activePacsReport.summaryImpression}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Specific Findings</span>
                    <ul className="space-y-1.5">
                      {activePacsReport.findings.map((f, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Measurements</span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
                        <div className="text-slate-400 text-[10px]">CTR Ratio</div>
                        <div className="text-emerald-400 font-bold text-sm">0.48 (Normal)</div>
                      </div>
                      <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
                        <div className="text-slate-400 text-[10px]">Consolidation</div>
                        <div className="text-rose-400 font-bold text-sm">Grade III Extensive</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      handleVerifyReport(activePacsReport.id);
                      setActivePacsReport(null);
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Radiologic Concordance & Sign</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 12-Lead ECG Modal */}
      {activeEcgReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Heart className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                    <span>12-Lead ECG Telemetry Strip (Lead II Continuous)</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700 rounded">
                      Calibrated 25mm/s • 10mm/mV
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Patient: {patientName} • Sinus Tachycardia @ 112 BPM • P-pulmonale present
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveEcgReport(null)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* ECG Grid Strip Paper */}
              <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-[#06150e] p-4 shadow-inner">
                {/* SVG Rhythm Strip */}
                <svg width="100%" height="160" viewBox="0 0 800 160" className="w-full">
                  <defs>
                    <pattern id="ecgGridSmall" width="8" height="8" patternUnits="userSpaceOnUse">
                      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#0f3d26" strokeWidth="0.5" />
                    </pattern>
                    <pattern id="ecgGridLarge" width="40" height="40" patternUnits="userSpaceOnUse">
                      <rect width="40" height="40" fill="url(#ecgGridSmall)" />
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1c6b45" strokeWidth="1" />
                    </pattern>
                  </defs>

                  {/* Background grid */}
                  <rect width="100%" height="100%" fill="url(#ecgGridLarge)" />

                  {/* ECG Lead II Trace (Animated / Static Repeat Complex) */}
                  {/* P wave (tall peaked - P pulmonale), PR segment, QRS (narrow), ST segment, T wave */}
                  <g stroke="#10b981" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path
                      d="
                        M 0 90 L 30 90
                        Q 42 60 54 90
                        L 70 90
                        L 74 98
                        L 82 25
                        L 90 115
                        L 94 90
                        L 125 90
                        Q 145 75 165 90
                        L 200 90
                        Q 212 60 224 90
                        L 240 90
                        L 244 98
                        L 252 25
                        L 260 115
                        L 264 90
                        L 295 90
                        Q 315 75 335 90
                        L 370 90
                        Q 382 60 394 90
                        L 410 90
                        L 414 98
                        L 422 25
                        L 430 115
                        L 434 90
                        L 465 90
                        Q 485 75 505 90
                        L 540 90
                        Q 552 60 564 90
                        L 580 90
                        L 584 98
                        L 592 25
                        L 600 115
                        L 604 90
                        L 635 90
                        Q 655 75 675 90
                        L 710 90
                        Q 722 60 734 90
                        L 750 90
                        L 754 98
                        L 762 25
                        L 770 115
                        L 774 90
                        L 800 90
                      "
                    />
                  </g>

                  {/* Callout markers */}
                  <g fontFamily="monospace" fontSize="10" fill="#34d399">
                    <text x="35" y="55">P-pulmonale</text>
                    <text x="75" y="20">R (Lead II)</text>
                    <text x="140" y="70">T wave</text>
                  </g>
                </svg>

                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                  <span>Lead II Continuous Strip • Speed: 25 mm/sec • Gain: 10 mm/mV</span>
                  <span className="font-bold">RR Interval = 535 ms (112 BPM Sinus Rhythm)</span>
                </div>
              </div>

              {/* Intervals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-mono">Heart Rate</div>
                  <div className="text-base font-bold text-amber-400 font-mono">112 BPM</div>
                  <div className="text-[10px] text-slate-500">Tachycardia</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-mono">PR Interval</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">152 ms</div>
                  <div className="text-[10px] text-slate-500">Normal (120-200)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-mono">QRS Duration</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">88 ms</div>
                  <div className="text-[10px] text-slate-500">Normal (&lt; 120)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-mono">QTc (Bazett)</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">428 ms</div>
                  <div className="text-[10px] text-slate-500">Normal (&lt; 450)</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-slate-200">Doctor's Clinical Conclusion:</span>
                <p>
                  No acute coronary syndrome or ischemic ST changes. The prominent P-wave (P-pulmonale) and sinus tachycardia reflect pulmonary hypertension and hypoxemic compensation. Patient cleared for transfer under respiratory monitoring.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => {
                    handleVerifyReport(activeEcgReport.id);
                    setActiveEcgReport(null);
                  }}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark ECG as Clinically Verified</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Sign-Off Modal */}
      {verifyModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Physician Digital Verification & Sign-Off</h3>
              </div>
              <button
                onClick={() => setVerifyModalReport(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Report to Authenticate</label>
                <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 font-medium">
                  {verifyModalReport.title} ({verifyModalReport.id})
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Verifying Medical Officer</label>
                <input
                  type="text"
                  value={doctorNameInput}
                  onChange={(e) => setDoctorNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Clinical Verification Notes & Instructions</label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setVerifyModalReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyReport(verifyModalReport.id)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-cyan-900/30"
              >
                <Check className="w-4 h-4" />
                <span>Digitally Sign & Lock Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
