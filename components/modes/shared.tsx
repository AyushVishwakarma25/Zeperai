
import React from 'react';
import { Tooltip } from '../ui/Tooltip';

export const SectionTitle: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
    <h3 className={`text-xs font-semibold text-black uppercase tracking-wider mb-3 ${className || ''}`}>{title}</h3>
);

export const ControlButton: React.FC<{
  onClick: () => void;
  selected: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, selected, children, className }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border ${
      selected
        ? 'bg-primary text-white border-primary shadow-sm'
        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
    } ${className}`}
  >
    {children}
  </button>
);

export const HelpLabel: React.FC<{ label: string; tooltip?: string; className?: string }> = ({ label, tooltip, className = '' }) => (
    <div className={`flex items-center gap-2 mb-2 ${className}`}>
        <label className="text-sm font-semibold text-black">{label}</label>
        {tooltip && <Tooltip content={tooltip} />}
    </div>
);

export const BestForLabel: React.FC<{ text: string }> = ({ text }) => (
    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs mb-4 flex items-start">
        <span className="font-bold mr-1">Best for:</span> {text}
    </div>
);
