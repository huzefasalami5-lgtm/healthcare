import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun, Moon, Sparkles, Droplet } from 'lucide-react';

export type AppTheme = 'clinical-white' | 'clinical-light' | 'medical-navy' | 'emerald-health' | 'biotech-indigo' | 'midnight-dark';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  shortName: string;
  badge: string;
  bgHex: string;
  borderHex: string;
  accentHex: string;
  desc: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'clinical-white',
    name: 'Clinical White',
    shortName: 'White',
    badge: 'Default',
    bgHex: '#ffffff',
    borderHex: '#0d9488',
    accentHex: '#0f766e',
    desc: 'Crisp pure hospital white aesthetic with high-contrast clinical typography'
  },
  {
    id: 'medical-navy',
    name: 'Medical Navy',
    shortName: 'Navy',
    badge: 'Dark',
    bgHex: '#0a192f',
    borderHex: '#14b8a6',
    accentHex: '#2dd4bf',
    desc: 'Deep clinical navy-slate with vibrant teal & cyan radial glow'
  },
  {
    id: 'emerald-health',
    name: 'Emerald Health',
    shortName: 'Emerald',
    badge: 'Vitality',
    bgHex: '#051e18',
    borderHex: '#10b981',
    accentHex: '#34d399',
    desc: 'Deep forest medical green celebrating frontline life sciences'
  },
  {
    id: 'biotech-indigo',
    name: 'Biotech Indigo',
    shortName: 'Indigo',
    badge: 'Biotech',
    bgHex: '#0f112e',
    borderHex: '#818cf8',
    accentHex: '#a5b4fc',
    desc: 'Sleek high-tech indigo-violet dashboard aesthetic'
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Obsidian',
    shortName: 'Obsidian',
    badge: 'Pitch Dark',
    bgHex: '#030712',
    borderHex: '#38bdf8',
    accentHex: '#38bdf8',
    desc: 'Ultra high-contrast pitch black with glowing neon telemetry'
  }
];

interface ThemeSelectorProps {
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onSelectTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = THEME_OPTIONS.find(t => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div className="flex items-center space-x-1.5" ref={dropdownRef}>
      {/* Quick-Switch Swatches Bar */}
      <div className="hidden md:flex items-center space-x-1 p-1 rounded-lg bg-slate-900/80 border border-slate-700/80">
        {THEME_OPTIONS.map((opt) => {
          const isSelected = opt.id === currentTheme;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectTheme(opt.id)}
              className={`relative px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 flex items-center space-x-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-teal-300 shadow-sm border border-teal-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={`Switch background to ${opt.name} (${opt.desc})`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full border transition-transform ${isSelected ? 'scale-125 ring-1 ring-teal-400' : ''}`}
                style={{ backgroundColor: opt.bgHex, borderColor: opt.borderHex }}
              />
              <span>{opt.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Popover Menu Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 px-2.5 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 text-xs font-medium shadow-sm transition-all duration-150 cursor-pointer"
          title="Background Theme Settings"
          aria-label="Change Background Color Theme"
        >
          <span
            className="w-3 h-3 rounded-full border border-white/30 shadow-sm"
            style={{ backgroundColor: activeOption.bgHex }}
          />
          <Palette className="w-3.5 h-3.5 text-teal-400" />
          <span className="md:hidden font-medium text-[11px]">{activeOption.shortName}</span>
        </button>

        {/* Dropdown Details */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 p-2 rounded-xl bg-[#0b1220] border border-slate-700 shadow-2xl z-50 space-y-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-teal-400" />
                <span>Background Color Theme</span>
              </span>
              <span className="text-[10px] text-teal-400 font-mono">5 Styles</span>
            </div>

            <div className="space-y-1 pt-1">
              {THEME_OPTIONS.map((option) => {
                const isSelected = option.id === currentTheme;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onSelectTheme(option.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left transition-all duration-150 flex items-start space-x-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/15 border border-teal-500/50 text-white'
                        : 'hover:bg-slate-800/70 border border-transparent text-slate-300'
                    }`}
                  >
                    {/* Color Circle Preview */}
                    <div className="relative mt-0.5 shrink-0">
                      <span
                        className="block w-5 h-5 rounded-full border-2 shadow-inner"
                        style={{
                          backgroundColor: option.bgHex,
                          borderColor: option.borderHex
                        }}
                      />
                    </div>

                    {/* Theme Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          {option.name}
                          {option.id === 'clinical-white' || option.id === 'clinical-light' ? (
                            <Sun className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Moon className="w-3 h-3 text-cyan-400" />
                          )}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {option.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {option.desc}
                      </p>
                    </div>

                    {/* Active Checkmark */}
                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-400 shrink-0 self-center" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
