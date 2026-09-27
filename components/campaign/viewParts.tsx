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

/** "Worth double-checking" callout for facts web search didn't confirm this time. */
export const SearchGapsNotice: React.FC<{ gaps: string[] }> = ({ gaps }) =>
  gaps.length ? (
    <Notice tone="warning">
      <p className="font-semibold mb-1">Worth double-checking</p>
      <ul className="list-disc pl-5 space-y-0.5 mb-1.5">
        {gaps.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
      <p className="text-xs text-slate-600">Regenerate to search again.</p>
    </Notice>
  ) : null;

/** "Only you know this" callout for business data no search will find. */
export const AskUserGapsNotice: React.FC<{
  gaps: string[];
  onOpenKnownFacts?: () => void;
}> = ({ gaps, onOpenKnownFacts }) => {
  if (!gaps.length) return null;

  const handleClick = () => {
    if (onOpenKnownFacts) {
      onOpenKnownFacts();
    } else {
      window.dispatchEvent(new CustomEvent('campaign:open-known-facts'));
      const el = document.getElementById('campaign-known-facts-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Notice tone="info">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="font-semibold mb-1 text-slate-800">Only you know this</p>
          <ul className="list-disc pl-5 space-y-0.5 mb-2">
            {gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-600">
            These are business details no search can find. Add them under &ldquo;Anything we should know?&rdquo; when you regenerate, so every later step can use them.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline shrink-0 mt-1 sm:mt-0"
        >
          <Icon name="edit" className="w-3.5 h-3.5" />
          Add to context
        </button>
      </div>
    </Notice>
  );
};

/** Informs when the answer was not backed by live search results this time. */
export const GroundingNotice: React.FC<{ grounded: boolean }> = ({ grounded }) =>
  grounded ? null : (
    <Notice tone="warning">
      This answer used general knowledge rather than a live search this time — regenerate if you want it to search again.
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
