import React from 'react';
import type { SourceLink } from '../../src/campaignStudio/types.js';
import { hostnameOf, isHttpUrl } from '../../src/campaignStudio/client/viewModel.js';
import { Icon } from '../ui/Icon.js';
import { Chip, Notice } from './shared.js';

export const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-3 last:mb-0">
    <p className="text-[11px] font-semibold text-slate-500 mb-1">{label}</p>
    <div className="text-sm text-text-primary leading-relaxed">{children}</div>
  </div>
);

export const Empty: React.FC = () => <span className="text-slate-400">Nothing found</span>;

export const Bullets: React.FC<{ items: string[] }> = ({ items }) =>
  items.length ? (
    <ul className="list-disc pl-5 space-y-0.5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  ) : (
    <Empty />
  );

export const ChipList: React.FC<{ items: string[]; tone?: 'default' | 'good' | 'bad' | 'warn' }> = ({ items, tone }) =>
  items.length ? (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Chip key={i} tone={tone}>
          {i}
        </Chip>
      ))}
    </div>
  ) : (
    <Empty />
  );

/** "We could not verify these" callout shared by the research views. */
export const GapsNotice: React.FC<{ gaps: string[] }> = ({ gaps }) =>
  gaps.length ? (
    <Notice tone="warning">
      <p className="font-semibold mb-1">Not verified</p>
      <ul className="list-disc pl-5 space-y-0.5">
        {gaps.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </Notice>
  ) : null;

/** Warns when the answer was not backed by search results. */
export const GroundingNotice: React.FC<{ grounded: boolean }> = ({ grounded }) =>
  grounded ? null : (
    <Notice tone="warning">
      This wasn’t backed by live search results, so treat any figures with caution. Regenerate to try again.
    </Notice>
  );

export const Sources: React.FC<{ sources: SourceLink[] }> = ({ sources }) =>
  sources.length ? (
    <div className="text-[11px] text-slate-500">
      <p className="flex items-center gap-1.5 mb-1">
        <Icon name="globe" className="w-3.5 h-3.5" />
        Sources
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {sources
          .filter((s) => isHttpUrl(s.url))
          .map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {s.title || hostnameOf(s.url)}
              </a>
            </li>
          ))}
      </ul>
    </div>
  ) : null;
