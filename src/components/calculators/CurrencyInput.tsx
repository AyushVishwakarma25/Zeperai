import React from 'react';

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  placeholder?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  helperText,
  min = 0,
  max,
  step = 10,
  prefix = '₹',
  placeholder,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const num = parseFloat(raw);
    if (isNaN(num)) {
      onChange(0);
    } else {
      let constrained = num;
      if (min !== undefined && constrained < min) constrained = min;
      if (max !== undefined && constrained > max) constrained = max;
      onChange(constrained);
    }
  };

  const handleAdjust = (delta: number) => {
    let next = value + delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    onChange(Math.max(0, next));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">
          {label}
        </label>
        {helperText && (
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {helperText}
          </span>
        )}
      </div>

      <div className="relative flex items-center rounded-xl bg-white border border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 shadow-sm transition-all">
        <span className="pl-3.5 pr-1 text-sm font-bold text-slate-400 select-none">
          {prefix}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={value === 0 ? '' : value}
          onChange={handleChange}
          placeholder={placeholder || '0'}
          className="w-full bg-transparent py-2.5 pr-14 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
        />

        <div className="absolute right-1.5 flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => handleAdjust(-step)}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition font-bold"
            title={`Decrease by ${step}`}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => handleAdjust(step)}
            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition font-bold"
            title={`Increase by ${step}`}
          >
            +
          </button>
        </div>
      </div>
      {helperText && (
        <p className="text-[11px] text-slate-500 sm:hidden">
          {helperText}
        </p>
      )}
    </div>
  );
};
