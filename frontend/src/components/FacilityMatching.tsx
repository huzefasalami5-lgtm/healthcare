import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  UserCheck, 
  FlaskConical, 
  Wind, 
  BedDouble, 
  CheckCircle2, 
  AlertCircle, 
  Navigation,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { FacilityAgentOutput, CandidateFacility } from '../types';
import { FacilityComparisonChart } from './FacilityComparisonChart';

interface FacilityMatchingProps {
  facilityData?: FacilityAgentOutput;
  isProcessing: boolean;
}

export const FacilityMatching: React.FC<FacilityMatchingProps> = ({
  facilityData,
  isProcessing
}) => {
  if (isProcessing && !facilityData) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4">
        <div className="h-6 bg-slate-800 rounded w-1/3"></div>
        <div className="h-36 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  const candidates: CandidateFacility[] = facilityData?.candidate_facilities || [
    {
      id: 'dh-shivamogga',
      name: 'McGann District Teaching Hospital, Shivamogga',
      tier: 'District Hospital / Tertiary Care Node',
      tier_level: 4,
      distance_km: 26.5,
      travel_time_mins: 42,
      doctor_availability: 'Pulmonologist, Intensivist, Chief MO',
      diagnostics_ready: 6,
      oxygen_status: 'available',
      icu_beds: 12,
      connectivity: 'high_speed',
      match_score: 94,
      is_current: false
    },
    {
      id: 'chc-bhadravathi',
      name: 'Bhadravathi Taluk General Hospital (CHC)',
      tier: 'Community Health Centre',
      tier_level: 3,
      distance_km: 14.2,
      travel_time_mins: 25,
      doctor_availability: 'General Physician, Pediatrician',
      diagnostics_ready: 4,
      oxygen_status: 'available',
      icu_beds: 2,
      connectivity: 'moderate',
      match_score: 78,
      is_current: false
    },
    {
      id: 'phc-kudligere',
      name: 'Kudligere Primary Health Centre (PHC)',
      tier: 'Primary Health Centre',
      tier_level: 2,
      distance_km: 1.8,
      travel_time_mins: 5,
      doctor_availability: '1 MBBS Medical Officer on duty',
      diagnostics_ready: 2,
      oxygen_status: 'low_reserve',
      icu_beds: 0,
      connectivity: 'limited',
      match_score: 42,
      is_current: true
    }
  ];

  const selectedFacilityId = facilityData?.selected_facility_id || 'dh-shivamogga';
  const [showChart, setShowChart] = useState(true);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span>Agent 3: Capability-Aware Facility Matching</span>
          </h3>
          <p className="text-xs text-slate-400">
            Multi-tier healthcare node evaluation based on clinical severity, distance, and critical beds
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-400 border border-slate-700/80 text-xs font-medium cursor-pointer transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showChart ? 'Hide Comparison Chart' : 'View Comparison Chart'}</span>
          </button>

          {facilityData?.is_referral_needed ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-amber-400" />
              <span>Inter-Facility Referral Required</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manageable at Local Facility</span>
            </span>
          )}
        </div>
      </div>

      {/* Facilities Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {candidates.map((facility) => {
          const isSelected = facility.id === selectedFacilityId;

          return (
            <div
              key={facility.id}
              className={`rounded-xl p-4 border transition-all duration-200 relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-teal-950/60 to-slate-900 border-teal-500/80 ring-2 ring-teal-500/40 shadow-xl shadow-teal-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Selected Recommended Ribbon */}
              {isSelected && (
                <div className="absolute -top-3 right-3 px-3 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md">
                  Recommended Destination
                </div>
              )}

              {/* Title & Tier */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      Tier {facility.tier_level} • {facility.tier.split('/')[0].trim()}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                      {facility.name}
                    </h4>
                  </div>
                </div>

                {/* Geo Transit Specs */}
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2.5 pb-3 border-b border-white/5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-mono text-slate-200">{facility.distance_km} km</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono text-slate-200">~{facility.travel_time_mins} mins</span>
                  </span>
                  {facility.is_current && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Current Location
                    </span>
                  )}
                </div>

                {/* Capability Matrix */}
                <div className="space-y-2 py-3 text-xs">
                  {/* Doctors */}
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-[11px] leading-tight">
                      <strong className="text-slate-400 font-medium">Doctors:</strong> {facility.doctor_availability}
                    </span>
                  </div>

                  {/* Oxygen Status */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Medical Oxygen:</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono font-semibold uppercase text-[10px] ${
                      facility.oxygen_status === 'available'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {facility.oxygen_status}
                    </span>
                  </div>

                  {/* ICU Beds */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <BedDouble className="w-3.5 h-3.5 text-purple-400" />
                      <span>ICU / High-Dependency Beds:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-200">
                      {facility.icu_beds} Available
                    </span>
                  </div>

                  {/* Diagnostics Ready */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                      <span>Diagnostics Ready:</span>
                    </span>
                    <span className="font-mono text-slate-200">
                      {facility.diagnostics_ready} Tests On-Site
                    </span>
                  </div>
                </div>
              </div>

              {/* Match Score Footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Capability Match:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-600'}`}
                      style={{ width: `${facility.match_score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-teal-300' : 'text-slate-400'}`}>
                    {facility.match_score}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Facility Readiness Matrix */}
      {showChart && (
        <FacilityComparisonChart candidates={candidates} selectedFacilityId={selectedFacilityId} />
      )}

      {/* Facility Selection Rationale */}
      {facilityData?.reasoning && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
          <ArrowUpRight className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-teal-300 mr-1">Facility Agent Selection Rationale:</span>
            <span>{facilityData.reasoning}</span>
          </div>
        </div>
      )}
    </div>
  );
};
