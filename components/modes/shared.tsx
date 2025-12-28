
import React from 'react';

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
