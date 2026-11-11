import React from 'react';

interface PercentageInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  label,
  value,
  onChange,
  helperText,
  min = 0,
  max = 100,
  step = 1,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      onChange(0);
    } else {
      const clamped = Math.max(min, Math.min(max, num));
      onChange(clamped);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">
          {label}
        </label>
        <span className="text-xs font-bold text-emerald-600">
          {value}%
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />

        <div className="relative w-20 flex-shrink-0">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleInputChange}
            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 pr-6 text-xs font-bold text-slate-900 text-right shadow-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
          />
          <span className="absolute right-2 top-1.5 text-xs text-slate-400 pointer-events-none font-bold">
            %
          </span>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
};
