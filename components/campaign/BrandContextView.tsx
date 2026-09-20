import React from 'react';
import type { BrandContext } from '../../src/campaignStudio/types.js';
import { hostnameOf, isHttpUrl } from '../../src/campaignStudio/client/viewModel.js';
import { Icon } from '../ui/Icon.js';
import { Chip, Notice, SectionCard } from './shared.js';

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-3 last:mb-0">
    <p className="text-[11px] font-semibold text-slate-500 mb-1">{label}</p>
    <div className="text-sm text-text-primary leading-relaxed">{children}</div>
  </div>
);

const Chips: React.FC<{ items: string[]; tone?: 'default' | 'good' | 'bad' }> = ({ items, tone }) =>
  items.length ? (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Chip key={i} tone={tone}>
          {i}
        </Chip>
      ))}
    </div>
  ) : (
    <span className="text-slate-400">Not specified</span>
  );

const List: React.FC<{ items: string[] }> = ({ items }) =>
  items.length ? (
    <ul className="list-disc pl-5 space-y-0.5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  ) : (
    <span className="text-slate-400">Not specified</span>
  );

/** Read-only rendering of a Brand Context. All text is rendered as text; URLs only if http(s). */
export const BrandContextView: React.FC<{ brand: BrandContext }> = ({ brand }) => {
  const logo = isHttpUrl(brand.visualIdentity?.logoUrl) ? brand.visualIdentity.logoUrl : null;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {logo && (
          <img
            src={logo}
            alt={`${brand.brandName} logo`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
            className="w-14 h-14 rounded-xl border border-border-light object-contain bg-white p-1 shrink-0"
          />
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-text-primary">{brand.brandName}</h2>
          <p className="text-sm text-text-secondary">
            {brand.category}
            {isHttpUrl(brand.website) && (
              <>
                {' · '}
                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {hostnameOf(brand.website)}
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      {brand.gaps && brand.gaps.length > 0 && (
        <Notice tone="warning">
          <p className="font-semibold mb-1">Please confirm or fill these in</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {brand.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs opacity-80">Use “Regenerate” to tell us, or “Edit” to fill them in yourself.</p>
        </Notice>
      )}

      <SectionCard title="What the brand is" icon="info">
        <Row label="Summary">{brand.summary}</Row>
        <Row label="Positioning">{brand.positioning}</Row>
        <Row label="Key selling points">
          <List items={brand.usps} />
        </Row>
      </SectionCard>

      <SectionCard title="Audience" icon="users">
        <Row label="Primary">{brand.audience.primary || <span className="text-slate-400">Not specified</span>}</Row>
        {brand.audience.secondary && <Row label="Secondary">{brand.audience.secondary}</Row>}
        <div className="grid sm:grid-cols-2 gap-3">
          <Row label="Pain points">
            <List items={brand.audience.painPoints} />
          </Row>
          <Row label="Desires">
            <List items={brand.audience.desires} />
          </Row>
        </div>
      </SectionCard>

      <SectionCard title="Voice" icon="quote">
        <Row label="Tone">
          <Chips items={brand.voice.tone} />
        </Row>
        <div className="grid sm:grid-cols-2 gap-3">
          <Row label="Do say">
            <Chips items={brand.voice.doSay} tone="good" />
          </Row>
          <Row label="Don’t say">
            <Chips items={brand.voice.dontSay} tone="bad" />
          </Row>
        </div>
      </SectionCard>

      <SectionCard title="Look and feel" icon="palette">
        <Row label="Colours">
          {brand.visualIdentity.colors.length ? (
            <div className="flex flex-wrap gap-3">
              {brand.visualIdentity.colors.map((c) => (
                <div key={c.hex} className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg border border-border-light" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                  <span className="text-xs leading-tight">
                    <span className="block font-semibold">{c.name || 'Colour'}</span>
                    <span className="text-slate-500">{c.hex}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-400">None found. Add your brand colours by editing.</span>
          )}
        </Row>
        <Row label="Typography">{brand.visualIdentity.typography || <span className="text-slate-400">Not specified</span>}</Row>
        <Row label="Style">
          <Chips items={brand.visualIdentity.styleKeywords} />
        </Row>
      </SectionCard>

      <SectionCard title="Products" icon="shopping-bag">
        {brand.products.length ? (
          <ul className="grid sm:grid-cols-2 gap-3">
            {brand.products.map((p) => (
              <li key={p.name} className="flex gap-3 rounded-xl border border-border-light p-3">
                {p.imageUrls?.[0] && isHttpUrl(p.imageUrls[0]) && (
                  <img src={p.imageUrls[0]} alt={p.name} referrerPolicy="no-referrer" loading="lazy" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} className="w-14 h-14 rounded-lg object-cover bg-slate-50 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                  {p.priceHint && <p className="text-xs text-primary font-medium">{p.priceHint}</p>}
                  {p.description && <p className="text-xs text-text-secondary mt-0.5 line-clamp-3">{p.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-slate-400">No products found.</span>
        )}
        <div className="mt-3">
          <Row label="Markets">
            <Chips items={brand.markets} />
          </Row>
        </div>
      </SectionCard>

      {brand.sources.length > 0 && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Icon name="globe" className="w-3.5 h-3.5" />
          Built from: {brand.sources.map((s) => hostnameOf(s)).filter((h, i, a) => a.indexOf(h) === i).join(', ')}
        </p>
      )}
    </div>
  );
};
