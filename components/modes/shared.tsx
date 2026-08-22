
import React from 'react';
import { Tooltip } from '../ui/Tooltip.js';

export const SectionTitle: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
    <h3 className={`text-base font-bold text-slate-900 mb-4 ${className || ''}`}>{title}</h3>
);

export const ControlButton: React.FC<{
  onClick: () => void;
  selected: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ onClick, selected, children, className, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border ${
      selected
        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
        : (disabled
            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50')
    } ${className}`}
  >
    {children}
  </button>
);

export const HelpLabel: React.FC<{ label: string; tooltip?: string; className?: string }> = ({ label, tooltip, className = '' }) => (
    <div className={`flex items-center gap-2 mb-2 ${className}`}>
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {tooltip && <Tooltip content={tooltip} />}
    </div>
);

export const BestForLabel: React.FC<{ text: string }> = ({ text }) => (
    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-start shadow-sm">
        <span className="font-bold mr-1 whitespace-nowrap">Best for:</span> {text}
    </div>
);
