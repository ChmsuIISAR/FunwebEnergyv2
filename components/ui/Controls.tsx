import React from 'react';
import { Plus, Minus, Power } from 'lucide-react';

// --- Stepper Control ---
interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  unit?: string;
}

export const Stepper: React.FC<StepperProps> = ({ label, value, min, max, onChange, unit }) => {
  return (
    <div className="flex items-center justify-between bg-slate-800/50 p-1 pl-4 pr-1 rounded-2xl border border-white/5">
      <span className="font-semibold text-slate-300 text-sm">{label}</span>
      <div className="flex items-center gap-2 bg-slate-900/50 rounded-xl p-1 border border-white/5">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 active:scale-95 transition-all touch-manipulation"
          aria-label="Decrease"
        >
          <Minus size={16} />
        </button>
        <div className="w-10 text-center">
          <span className="text-lg font-bold text-slate-100">{value}</span>
          {unit && <span className="text-[10px] text-slate-500 block -mt-1">{unit}</span>}
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 active:scale-95 transition-all touch-manipulation"
          aria-label="Increase"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

// --- Toggle Switch ---
interface ToggleProps {
  label: string;
  isOn: boolean;
  onToggle: () => void;
}

export const Toggle: React.FC<ToggleProps> = ({ label, isOn, onToggle }) => {
  return (
    <div 
        className={`flex items-center justify-between p-3 pl-4 rounded-2xl border transition-all duration-300 cursor-pointer ${isOn ? 'bg-slate-800/80 border-brand-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'bg-slate-800/50 border-white/5'}`} 
        onClick={onToggle}
    >
      <span className={`font-semibold text-sm transition-colors ${isOn ? 'text-brand-100' : 'text-slate-300'}`}>{label}</span>
      <button
        className={`relative w-14 h-8 rounded-full transition-all duration-300 ease-out focus:outline-none ring-offset-2 focus:ring-2 ring-brand-500 ring-offset-slate-900 ${
          isOn ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-slate-700'
        }`}
        role="switch"
        aria-checked={isOn}
      >
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center ${
            isOn ? 'translate-x-6' : 'translate-x-0'
          }`}
        >
            <Power size={12} className={`transition-colors duration-300 ${isOn ? "text-green-600" : "text-slate-400"}`} />
        </span>
      </button>
    </div>
  );
};

// --- Slider Control ---
interface SliderProps {
  label: string;
  value: number; 
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  labels?: [string, string];
  formatValue?: (val: number) => string;
}

export const Slider: React.FC<SliderProps> = ({ 
    label, 
    value, 
    onChange, 
    min = 0, 
    max = 100, 
    step = 1,
    labels,
    formatValue
}) => {
  
  // Calculate percentage for visual track width
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  const displayValue = formatValue ? formatValue(value) : `${Math.round(value)}%`;

  return (
    <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
      <div className="flex justify-between mb-3 items-center">
        <span className="font-semibold text-slate-300 text-sm">{label}</span>
        <span className="font-mono font-bold text-brand-400 text-xs bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20">
            {displayValue}
        </span>
      </div>
      
      {/* Slider Container - 40px height for touch target */}
      <div className="relative w-full h-10 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-2 bg-slate-700 rounded-full overflow-hidden">
             {/* Fill */}
             <div 
                className="h-full bg-gradient-to-r from-brand-600 to-brand-400" 
                style={{ width: `${percent}%` }}
             />
        </div>
        
        {/* Input (Invisible but interactive) */}
        {/* Removed 'touch-none' to ensure browser handles slider logic naturally on all devices */}
        {/* Added z-30 to ensure it's on top of everything */}
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-30 m-0 p-0"
        />

        {/* Custom Thumb (Visual Only) */}
        <div 
            className="absolute h-6 w-6 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 border-brand-500 pointer-events-none z-20 transition-transform duration-75 ease-out"
            style={{ left: `calc(${percent}% - 12px)` }}
        />
      </div>
      
      {labels && (
        <div className="flex justify-between mt-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
};

// --- Action Button ---
interface ActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, disabled, variant = 'primary', icon, size = 'md' }) => {
  
  const variants = {
    primary: "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25 border-t border-white/20 hover:from-brand-400 hover:to-brand-500",
    secondary: "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600",
    danger: "bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-600/25 border-t border-white/20 hover:from-red-500 hover:to-red-600",
    ghost: "bg-transparent text-slate-400 border border-transparent hover:bg-slate-800 hover:text-slate-200"
  };

  const sizes = {
    sm: "py-2 px-3 text-xs",
    md: "py-3.5 px-4 text-sm"
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full rounded-xl font-bold tracking-wide
        flex items-center justify-center gap-2.5 
        transition-all duration-200 active:scale-[0.98]
        disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:cursor-not-allowed
        touch-manipulation
        ${sizes[size]}
        ${variants[variant]}
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};