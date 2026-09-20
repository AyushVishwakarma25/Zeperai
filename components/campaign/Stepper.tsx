import React from 'react';
import type { GateStatus, GateView } from '../../src/campaignStudio/client/viewModel.js';
import { Icon } from '../ui/Icon.js';

const statusStyle: Record<GateStatus, { dot: string; text: string; label: string }> = {
  approved: { dot: 'bg-emerald-500 text-white', text: 'text-emerald-700', label: 'Approved' },
  review: { dot: 'bg-amber-400 text-white', text: 'text-amber-800', label: 'Your review' },
  running: { dot: 'bg-primary text-white animate-pulse', text: 'text-primary', label: 'Working' },
  failed: { dot: 'bg-rose-500 text-white', text: 'text-rose-700', label: 'Needs attention' },
  ready: { dot: 'bg-primary text-white', text: 'text-primary', label: 'Ready' },
  locked: { dot: 'bg-slate-200 text-slate-500', text: 'text-slate-400', label: 'Locked' },
};

interface Props {
  gates: GateView[];
  selected: number;
  onSelect: (index: number) => void;
}

export const Stepper: React.FC<Props> = ({ gates, selected, onSelect }) => (
  <nav aria-label="Campaign steps" className="overflow-x-auto -mx-1 px-1">
    <ol className="flex items-stretch gap-2 min-w-max">
      {gates.map((g) => {
        const st = statusStyle[g.status];
        const isSel = g.index === selected;
        const clickable = g.status !== 'locked';
        return (
          <li key={g.label}>
            <button
              type="button"
              disabled={!clickable}
              aria-current={isSel ? 'step' : undefined}
              onClick={() => onSelect(g.index)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                isSel ? 'border-primary bg-primary/5' : 'border-border-light bg-white'
              } ${clickable ? 'hover:border-primary/60 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${st.dot}`}>
                {g.status === 'approved' ? <Icon name="check" className="w-3.5 h-3.5" /> : g.status === 'locked' ? <Icon name="lock" className="w-3 h-3" /> : g.index + 1}
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-semibold text-text-primary whitespace-nowrap">{g.label}</span>
                <span className={`block text-[10px] ${st.text}`}>{g.implemented || g.status === 'locked' || g.status === 'approved' ? st.label : 'Coming soon'}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);
