import React from 'react';

interface ToggleProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, enabled, onChange, className }) => {
  return (
    <label className={`flex items-center justify-between cursor-pointer ${className}`}>
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-spring focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
          enabled ? 'bg-primary' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-spring ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
};