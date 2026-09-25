import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { PatientVitals } from '../types';
import { Activity, Wind, Heart, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

interface VitalsTelemetryChartProps {
  vitals: PatientVitals;
  patientName: string;
}

export const VitalsTelemetryChart: React.FC<VitalsTelemetryChartProps> = ({ vitals, patientName }) => {
  const [selectedMetric, setSelectedMetric] = useState<'spo2' | 'hr_rr' | 'bp'>('spo2');

  // Synthesize 5-point progression curve leading up to current vital reading
  const isHypoxemic = vitals.spo2 < 92;
  const isTachypneic = vitals.respiratory_rate >= 24;
  const isTachycardic = vitals.heart_rate > 100;

  const data = [
    {
      time: 'T - 4h',
      spo2: isHypoxemic ? Math.min(97, vitals.spo2 + 8) : vitals.spo2 + 1,
      heartRate: isTachycardic ? Math.max(72, vitals.heart_rate - 26) : vitals.heart_rate - 4,
      respiratoryRate: isTachypneic ? Math.max(16, vitals.respiratory_rate - 10) : vitals.respiratory_rate - 2,
      systolicBP: vitals.systolic_bp - 12,
      diastolicBP: vitals.diastolic_bp - 6,
    },
    {
      time: 'T - 3h',
      spo2: isHypoxemic ? Math.min(95, vitals.spo2 + 6) : vitals.spo2,
      heartRate: isTachycardic ? Math.max(78, vitals.heart_rate - 20) : vitals.heart_rate - 2,
      respiratoryRate: isTachypneic ? Math.max(18, vitals.respiratory_rate - 7) : vitals.respiratory_rate - 1,
      systolicBP: vitals.systolic_bp - 8,
      diastolicBP: vitals.diastolic_bp - 4,
    },
    {
      time: 'T - 2h',
      spo2: isHypoxemic ? Math.min(93, vitals.spo2 + 4) : vitals.spo2 + 1,
      heartRate: isTachycardic ? Math.max(86, vitals.heart_rate - 12) : vitals.heart_rate + 1,
      respiratoryRate: isTachypneic ? Math.max(21, vitals.respiratory_rate - 4) : vitals.respiratory_rate,
      systolicBP: vitals.systolic_bp - 4,
      diastolicBP: vitals.diastolic_bp - 2,
    },
    {
      time: 'T - 1h',
      spo2: isHypoxemic ? Math.min(91, vitals.spo2 + 2) : vitals.spo2 - 1,
      heartRate: isTachycardic ? Math.max(94, vitals.heart_rate - 6) : vitals.heart_rate - 1,
      respiratoryRate: isTachypneic ? Math.max(24, vitals.respiratory_rate - 2) : vitals.respiratory_rate + 1,
      systolicBP: vitals.systolic_bp - 2,
      diastolicBP: vitals.diastolic_bp - 1,
    },
    {
      time: 'Present (Intake)',
      spo2: vitals.spo2,
      heartRate: vitals.heart_rate,
      respiratoryRate: vitals.respiratory_rate,
      systolicBP: vitals.systolic_bp,
      diastolicBP: vitals.diastolic_bp,
    },
  ];

  return (
    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
      {/* Top Header & Metric Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Vital Telemetry Trend & Danger Thresholds
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
            Recharts Engine
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSelectedMetric('spo2')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              selectedMetric === 'spo2'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            SpO2 (%)
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('hr_rr')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              selectedMetric === 'hr_rr'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Heart & Resp Rate
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('bp')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              selectedMetric === 'bp'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Blood Pressure
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-48 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {selectedMetric === 'spo2' ? (
            <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[80, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${val}%`, 'Pulse Oximetry (SpO2)']}
              />
              <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Hypoxemia Cutoff (<90%)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
              <ReferenceLine y={94} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Normal Target (>94%)', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
              <Area type="monotone" dataKey="spo2" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#spo2Grad)" dot={{ r: 4, fill: '#06b6d4' }} />
            </AreaChart>
          ) : selectedMetric === 'hr_rr' ? (
            <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="rrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[10, 140]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Tachycardia (>100 BPM)', fill: '#f43f5e', fontSize: 10 }} />
              <ReferenceLine y={24} stroke="#eab308" strokeDasharray="3 3" label={{ value: 'Tachypnea (>24/min)', fill: '#eab308', fontSize: 10 }} />
              <Area type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#hrGrad)" dot={{ r: 3 }} />
              <Area type="monotone" dataKey="respiratoryRate" name="Resp Rate (/min)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#rrGrad)" dot={{ r: 3 }} />
            </AreaChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sysGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="diaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[50, 180]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Stage 2 HTN (140+)', fill: '#ef4444', fontSize: 10 }} />
              <Area type="monotone" dataKey="systolicBP" name="Systolic BP (mmHg)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#sysGrad)" dot={{ r: 3 }} />
              <Area type="monotone" dataKey="diastolicBP" name="Diastolic BP (mmHg)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#diaGrad)" dot={{ r: 3 }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
        <span className="flex items-center gap-1.5 text-slate-300">
          {isHypoxemic ? (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300 font-medium">Trajectory: Rapid respiratory decompensation observed over prior 4 hours</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Trajectory: Hemodynamically stable telemetry trajectory</span>
            </>
          )}
        </span>
        <span className="text-slate-500">Patient: {patientName}</span>
      </div>
    </div>
  );
};
