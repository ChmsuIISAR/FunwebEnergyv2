import React from 'react';

interface ControlPanelProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ title, description, children }) => {
  return (
    <div className="bg-slate-900 border-t border-white/10 shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.5)] p-5 pb-8 z-10 relative">
      {/* Decorative top sheen */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      <div className="max-w-md mx-auto flex flex-col gap-5">
        <div className="mb-1">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            {title}
          </h2>
          {description && <p className="text-xs text-slate-400 leading-normal mt-1">{description}</p>}
        </div>
        <div className="flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;