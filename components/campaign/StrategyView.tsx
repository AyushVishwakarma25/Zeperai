import React from 'react';
import type { CampaignStrategy } from '../../src/campaignStudio/types.js';
import { Chip, Notice, SectionCard } from './shared.js';
import { Bullets, ChipList, Row } from './viewParts.js';

const STAGE_LABEL: Record<string, string> = { awareness: 'Awareness', consideration: 'Consideration', conversion: 'Conversion', retention: 'Retention' };

export const StrategyView: React.FC<{ data: CampaignStrategy }> = ({ data }) => {
  const countFor = (pillar: string) => data.creativeMix.find((m) => m.pillar === pillar)?.count ?? 0;
  const total = data.creativeMix.reduce((n, m) => n + m.count, 0);
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-purple-50 border border-primary/20 p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary mb-1">The big idea</p>
        <h3 className="text-xl sm:text-2xl font-bold text-text-primary leading-snug">{data.bigIdea}</h3>
        <p className="text-sm text-text-secondary mt-2">{data.positioningStatement}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <Chip tone="good">{STAGE_LABEL[data.funnelStage] ?? data.funnelStage}</Chip>
          {data.offer && <Chip>Offer: {data.offer}</Chip>}
          <Chip>CTA: {data.cta}</Chip>
        </div>
      </section>

      <SectionCard title="Objective" icon="lightbulb">
        <p className="text-sm text-text-primary">{data.objective}</p>
      </SectionCard>

      <SectionCard title="Who we’re talking to" icon="users">
        <Row label="Audience">{data.audience.primary}</Row>
        {data.audience.insight && <Row label="Insight">{data.audience.insight}</Row>}
        {data.audience.mindset && <Row label="Mindset">{data.audience.mindset}</Row>}
      </SectionCard>

      <SectionCard title="Key messages" icon="quote">
        <ul className="space-y-3">
          {data.keyMessages.map((m) => (
            <li key={m.message}>
              <p className="text-sm font-semibold text-text-primary">{m.message}</p>
              {m.proof && <p className="text-xs text-text-secondary">Proof: {m.proof}</p>}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title={`Content pillars · ${total} creatives`} icon="layers">
        <ul className="grid sm:grid-cols-2 gap-3">
          {data.contentPillars.map((p) => (
            <li key={p.name} className="rounded-xl border border-border-light p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-text-primary">{p.name}</p>
                <Chip>{countFor(p.name)} {countFor(p.name) === 1 ? 'creative' : 'creatives'}</Chip>
              </div>
              <p className="text-xs text-text-secondary mt-1">{p.description}</p>
              {p.exampleAd && <p className="text-xs text-slate-500 mt-1.5">Example: {p.exampleAd}</p>}
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid sm:grid-cols-2 gap-4">
        <SectionCard title="Formats" icon="image">
          <ul className="space-y-2">
            {data.creativeFormats.map((f) => (
              <li key={f.format} className="text-sm">
                <span className="font-semibold text-text-primary">{f.format}</span>
                {f.why && <span className="block text-xs text-text-secondary">{f.why}</span>}
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Tone and success" icon="trending-up">
          <Row label="Tone">
            <ChipList items={data.tone} />
          </Row>
          <Row label="How we’ll measure it">
            <Bullets items={data.successMetrics} />
          </Row>
        </SectionCard>
      </div>

      {data.guardrails.length > 0 && (
        <Notice tone="warning">
          <p className="font-semibold mb-1">Guardrails</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {data.guardrails.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Notice>
      )}

      <SectionCard title="Why this works" icon="lightbulb">
        <p className="text-sm text-text-primary leading-relaxed">{data.rationale}</p>
      </SectionCard>
    </div>
  );
};
