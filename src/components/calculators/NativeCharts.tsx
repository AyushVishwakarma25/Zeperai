import React from 'react';

export interface WaterfallItem {
  label: string;
  amount: number;
  type: 'base' | 'deduction' | 'profit' | 'loss';
}

export const WaterfallChart: React.FC<{
  items: WaterfallItem[];
  currencySymbol?: string;
}> = ({ items, currencySymbol = '₹' }) => {
  const maxAbs = Math.max(1, ...items.map((i) => Math.abs(i.amount)));

  return (
    <div className="space-y-2.5 w-full">
      {items.map((item, idx) => {
        const percentage = Math.min(100, (Math.abs(item.amount) / maxAbs) * 100);
        const isNegative = item.amount < 0 || item.type === 'deduction';
        const isProfit = item.type === 'profit';

        let barColor = 'bg-slate-500';
        if (item.type === 'base') barColor = 'bg-blue-600';
        else if (item.type === 'deduction') barColor = 'bg-rose-500';
        else if (item.type === 'profit') barColor = 'bg-emerald-600';
        else if (item.type === 'loss') barColor = 'bg-rose-600';

        return (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-semibold">{item.label}</span>
              <span
                className={`font-bold ${
                  isProfit
                    ? 'text-emerald-700'
                    : isNegative
                    ? 'text-rose-600'
                    : 'text-slate-900'
                }`}
              >
                {isNegative && item.type === 'deduction' ? '-' : ''}
                {currencySymbol}
                {Math.abs(item.amount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(2, percentage)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const RoasGauge: React.FC<{
  currentRoas: number;
  breakEvenRoas: number;
}> = ({ currentRoas, breakEvenRoas }) => {
  const maxDisplayRoas = Math.max(6, Math.max(currentRoas, breakEvenRoas) * 1.3);
  const currentRatio = Math.min(1, Math.max(0, currentRoas / maxDisplayRoas));
  const breakEvenRatio = Math.min(1, Math.max(0, breakEvenRoas / maxDisplayRoas));

  const currentAngle = Math.PI * (1 - currentRatio);
  const breakEvenAngle = Math.PI * (1 - breakEvenRatio);

  const cx = 100;
  const cy = 90;
  const r = 70;

  const nx = cx + r * Math.cos(currentAngle);
  const ny = cy - r * Math.sin(currentAngle);

  const bx = cx + (r + 8) * Math.cos(breakEvenAngle);
  const by = cy - (r + 8) * Math.sin(breakEvenAngle);

  const isProfitable = currentRoas >= breakEvenRoas && breakEvenRoas > 0;

  return (
    <div className="flex flex-col items-center justify-center p-3 text-center">
      <svg viewBox="0 0 200 115" className="w-48 sm:w-56 overflow-visible">
        <defs>
          <linearGradient id="roasGradientLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="45%" stopColor="#d97706" />
            <stop offset="75%" stopColor="#059669" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d="M 30 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Colored progress arc */}
        <path
          d="M 30 90 A 70 70 0 0 1 170 90"
          fill="none"
          stroke="url(#roasGradientLight)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="220"
          strokeDashoffset={220 * (1 - currentRatio)}
          className="transition-all duration-700"
        />

        {/* Break-even tick */}
        <circle cx={bx} cy={by} r="4.5" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />

        {/* Needle pointer */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#0f172a"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6.5" fill="#0f172a" />
      </svg>

      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900">{currentRoas}x</span>
        <span className="text-xs font-semibold text-slate-500">Current ROAS</span>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
          <span className="text-slate-600 font-medium">
            Break-Even: <strong className="text-amber-700 font-bold">{breakEvenRoas}x</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isProfitable ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          />
          <span className={isProfitable ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
            {isProfitable ? 'Profitable Ad Scaling' : 'Below Break-Even'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const DonutBreakdown: React.FC<{
  segments: { label: string; amount: number; color: string }[];
  currencySymbol?: string;
}> = ({ segments, currencySymbol = '₹' }) => {
  const total = Math.max(1, segments.reduce((sum, s) => sum + Math.max(0, s.amount), 0));

  let cumulativeAngle = 0;
  const r = 36;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, idx) => {
            const fraction = Math.max(0, seg.amount) / total;
            const strokeDash = fraction * circumference;
            const offset = cumulativeAngle * circumference;
            cumulativeAngle += fraction;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                strokeDashoffset={-offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Total
          </span>
          <span className="text-xs font-extrabold text-slate-900">
            {currencySymbol}
            {Math.round(total).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 w-full text-xs">
        {segments.map((seg, idx) => {
          const percent = ((Math.max(0, seg.amount) / total) * 100).toFixed(1);
          return (
            <div key={idx} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-700 font-medium truncate">{seg.label}</span>
              </div>
              <span className="font-bold text-slate-900 flex-shrink-0">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
