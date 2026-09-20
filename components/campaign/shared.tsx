import React, { useEffect, useState } from 'react';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';

export const inputClass =
  'w-full rounded-xl border border-border-light bg-white px-3 py-2 text-sm text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-slate-50 disabled:text-slate-400';

/** Label wraps its control so the association works for screen readers and tests. */
export const Field: React.FC<{ label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }> = ({ label, hint, error, className = '', children }) => (
  <label className={`block ${className}`}>
    <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
    {children}
    {hint && !error && <span className="block text-[11px] text-text-secondary mt-1">{hint}</span>}
    {error && (
      <span role="alert" className="block text-[11px] text-red-600 mt-1">
        {error}
      </span>
    )}
  </label>
);

export const SectionCard: React.FC<{ title?: string; icon?: string; className?: string; children: React.ReactNode }> = ({ title, icon, className = '', children }) => (
  <section className={`bg-white border border-border-light rounded-2xl p-4 sm:p-5 ${className}`}>
    {title && (
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
        {icon && <Icon name={icon} className="w-4 h-4 text-primary" />}
        {title}
      </h3>
    )}
    {children}
  </section>
);

export const Chip: React.FC<{ tone?: 'default' | 'good' | 'bad' | 'warn'; children: React.ReactNode }> = ({ tone = 'default', children }) => {
  const tones = {
    default: 'bg-slate-100 text-slate-700',
    good: 'bg-emerald-50 text-emerald-700',
    bad: 'bg-rose-50 text-rose-700',
    warn: 'bg-amber-50 text-amber-800',
  } as const;
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
};

export const Notice: React.FC<{ tone?: 'error' | 'warning' | 'info'; onDismiss?: () => void; children: React.ReactNode }> = ({ tone = 'info', onDismiss, children }) => {
  const tones = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  } as const;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${tones[tone]}`}>
      <Icon name={tone === 'info' ? 'info' : 'alert-triangle'} className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
          <Icon name="x" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/** Shown while an agent works. Requests take up to ~55s, so it explains progress instead of a bare spinner. */
export const GeneratingPanel: React.FC<{ title: string; hints: string[] }> = ({ title, hints }) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const hint = hints.length ? hints[Math.floor(seconds / 7) % hints.length] : '';
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center text-center py-12 px-4">
      <Spinner className="h-10 w-10" />
      <p className="mt-4 text-base font-semibold text-text-primary">{title}</p>
      {hint && <p className="mt-1 text-sm text-text-secondary">{hint}</p>}
      <p className="mt-3 text-xs text-slate-400">
        {seconds}s · usually 20–40 seconds. Your result is saved automatically, so you can safely leave this page.
      </p>
    </div>
  );
};
