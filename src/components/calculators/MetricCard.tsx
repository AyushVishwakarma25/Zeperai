import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'primary';
  badge?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  variant = 'neutral',
  badge,
  icon,
}) => {
  const getBorderColor = () => {
    switch (variant) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/60';
      case 'danger':
        return 'border-rose-200 bg-rose-50/60';
      case 'warning':
        return 'border-amber-200 bg-amber-50/60';
      case 'primary':
        return 'border-indigo-200 bg-indigo-50/60';
      default:
        return 'border-slate-200 bg-white';
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case 'success':
        return 'text-emerald-700';
      case 'danger':
        return 'text-rose-700';
      case 'warning':
        return 'text-amber-700';
      case 'primary':
        return 'text-indigo-700';
      default:
        return 'text-slate-900';
    }
  };

  const getBadgeStyle = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'danger':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'primary':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all ${getBorderColor()}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getBadgeStyle()}`}
          >
            {badge}
          </span>
        )}
      </div>

      <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${getValueColor()}`}>
        {value}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
          {subtext}
        </p>
      )}
    </div>
  );
};
