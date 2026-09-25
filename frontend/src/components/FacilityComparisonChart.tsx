import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CandidateFacility } from '../types';
import { BarChart3, Building2, CheckCircle2 } from 'lucide-react';

interface FacilityComparisonChartProps {
  candidates: CandidateFacility[];
  selectedFacilityId: string;
}

export const FacilityComparisonChart: React.FC<FacilityComparisonChartProps> = ({
  candidates,
  selectedFacilityId,
}) => {
  const chartData = candidates.map(c => ({
    name: c.name.length > 20 ? c.name.substring(0, 18) + '...' : c.name,
    fullName: c.name,
    tier: c.tier,
    matchScore: c.match_score,
    distanceKm: c.distance_km,
    travelTimeMins: c.travel_time_mins,
    icuBeds: c.icu_beds,
    isSelected: c.id === selectedFacilityId,
    id: c.id
  }));

  return (
    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Algorithmic Facility Readiness & Capability Comparison
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            Recharts Matrix
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-teal-400 inline-block" />
          <span>Optimal Matched Node Highlighted</span>
        </div>
      </div>

      <div className="h-52 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} interval={0} angle={-10} textAnchor="end" />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              formatter={(val: any, name: any) => {
                if (name === 'Match Score') return [`${val} / 100`, name];
                if (name === 'Distance (km)') return [`${val} km`, name];
                if (name === 'Est. Travel Time') return [`${val} mins`, name];
                return [val, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar dataKey="matchScore" name="Match Score" fill="#14b8a6" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isSelected ? '#2dd4bf' : '#334155'}
                  stroke={entry.isSelected ? '#5eead4' : 'none'}
                  strokeWidth={entry.isSelected ? 2 : 0}
                />
              ))}
            </Bar>
            <Bar dataKey="distanceKm" name="Distance (km)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="travelTimeMins" name="Est. Travel Time" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Multi-objective optimization balances clinical capability requirements against travel latency.</span>
        </span>
      </div>
    </div>
  );
};
