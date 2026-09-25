import React, { useState } from 'react';
import { X, SlidersHorizontal, Check, AlertCircle } from 'lucide-react';
import { PatientProfile } from '../types';

interface CustomPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePatient: (patient: PatientProfile) => void;
  currentPatient: PatientProfile;
}

export const CustomPatientModal: React.FC<CustomPatientModalProps> = ({
  isOpen,
  onClose,
  onSavePatient,
  currentPatient,
}) => {
  const [formData, setFormData] = useState<PatientProfile>({ ...currentPatient });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePatient(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0b1220] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 text-xs text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configure Custom Patient Profile</h3>
              <p className="text-slate-400 text-xs">Simulate dynamic clinical inputs and observe how all 7 agents adapt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name, Age, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Patient Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Age (Years)</label>
              <input
                type="number"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:border-teal-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 2: Location, Road Condition, Connectivity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Village / Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Road Terrain</label>
              <select
                value={formData.road_condition}
                onChange={e => setFormData({ ...formData, road_condition: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
              >
                <option value="rough_terrain">Rough Terrain / Mountainous</option>
                <option value="unpaved">Unpaved Dirt Track</option>
                <option value="flooded">Flooded / Waterlogged</option>
                <option value="paved">Paved All-Weather Road</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Cellular Connectivity</label>
              <select
                value={formData.connectivity}
                onChange={e => setFormData({ ...formData, connectivity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
              >
                <option value="offline">Zero Signal (Offline)</option>
                <option value="2g_only">2G Audio Only</option>
                <option value="limited">Limited 3G</option>
                <option value="moderate">Moderate 4G</option>
                <option value="high_speed">High Speed Fiber/5G</option>
              </select>
            </div>
          </div>

          {/* Row 3: Bedside Vitals */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="font-semibold text-teal-300 uppercase tracking-wider text-[11px] block">
              Bedside Clinical Telemetry Vitals
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400">SpO2 (%)</label>
                <input
                  type="number"
                  value={formData.vitals.spo2}
                  onChange={e => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, spo2: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-teal-300 font-bold focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400">Resp Rate (/min)</label>
                <input
                  type="number"
                  value={formData.vitals.respiratory_rate}
                  onChange={e => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, respiratory_rate: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-teal-300 font-bold focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400">Pulse HR (BPM)</label>
                <input
                  type="number"
                  value={formData.vitals.heart_rate}
                  onChange={e => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, heart_rate: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-teal-300 font-bold focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400">Systolic BP</label>
                <input
                  type="number"
                  value={formData.vitals.systolic_bp}
                  onChange={e => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, systolic_bp: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-teal-300 font-bold focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vitals.temperature}
                  onChange={e => setFormData({
                    ...formData,
                    vitals: { ...formData.vitals, temperature: parseFloat(e.target.value) || 0 }
                  })}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 font-mono text-teal-300 font-bold focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Symptoms (comma separated) */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Reported Symptoms (Comma Separated)</label>
            <input
              type="text"
              value={formData.symptoms.join(', ')}
              onChange={e => setFormData({
                ...formData,
                symptoms: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:border-teal-500 focus:outline-none"
              placeholder="e.g. fever, breathing difficulty, chest tightness"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save & Set Active Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
