import React from 'react';
import type { CompetitorResearch, MarketResearch } from '../../src/campaignStudio/types.js';
import { hostnameOf, isHttpUrl } from '../../src/campaignStudio/client/viewModel.js';
import { Chip, SectionCard } from './shared.js';
import { Bullets, ChipList, Empty, GapsNotice, GroundingNotice, Row, Sources } from './viewParts.js';

export const MarketResearchView: React.FC<{ data: MarketResearch }> = ({ data }) => (
  <div className="space-y-4">
    <GroundingNotice grounded={data.grounded} />
    <SectionCard title="The market" icon="trending-up">
      <p className="text-xs font-semibold text-slate-500 mb-1">{data.category}</p>
      <p className="text-sm text-text-primary leading-relaxed">{data.marketSummary}</p>
    </SectionCard>

    <SectionCard title="Trends" icon="trending-up">
      {data.trends.length ? (
        <ul className="space-y-3">
          {data.trends.map((t) => (
            <li key={t.trend}>
              <p className="text-sm font-semibold text-text-primary">{t.trend}</p>
              {t.whyItMatters && <p className="text-sm text-text-secondary">{t.whyItMatters}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <Empty />
      )}
    </SectionCard>

    <SectionCard title="What buyers think and feel" icon="users">
      {data.customerInsights.length ? (
        <ul className="space-y-3">
          {data.customerInsights.map((c) => (
            <li key={c.insight}>
              <p className="text-sm font-semibold text-text-primary">{c.insight}</p>
              {c.evidence && <p className="text-xs text-text-secondary">Evidence: {c.evidence}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <Empty />
      )}
    </SectionCard>

    {data.seasonalMoments.length > 0 && (
      <SectionCard title="Moments to use" icon="calendar">
        <ul className="space-y-2">
          {data.seasonalMoments.map((m) => (
            <li key={m.moment} className="text-sm">
              <span className="font-semibold text-text-primary">{m.moment}</span>
              {m.timing && <span className="text-slate-500"> · {m.timing}</span>}
              <span className="block text-text-secondary">{m.angle}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    )}

    {data.channelInsights.length > 0 && (
      <SectionCard title="Channels" icon="megaphone">
        <ul className="space-y-2">
          {data.channelInsights.map((c) => (
            <li key={c.channel} className="text-sm">
              <span className="font-semibold text-text-primary">{c.channel}: </span>
              <span className="text-text-secondary">{c.insight}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    )}

    <div className="grid sm:grid-cols-2 gap-4">
      <SectionCard title="Opportunities" icon="lightbulb">
        <Bullets items={data.opportunities} />
      </SectionCard>
      <SectionCard title="Risks" icon="alert-triangle">
        <Bullets items={data.risks} />
      </SectionCard>
    </div>

    <GapsNotice gaps={data.gaps} />
    <Sources sources={data.sources} />
  </div>
);

export const CompetitorResearchView: React.FC<{ data: CompetitorResearch }> = ({ data }) => (
  <div className="space-y-4">
    <GroundingNotice grounded={data.grounded} />

    {data.competitors.length ? (
      <div className="grid sm:grid-cols-2 gap-4">
        {data.competitors.map((c) => (
          <SectionCard key={c.name}>
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-base font-bold text-text-primary">{c.name}</h4>
              {c.pricePoint && <Chip>{c.pricePoint}</Chip>}
            </div>
            {isHttpUrl(c.website) && (
              <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                {hostnameOf(c.website)}
              </a>
            )}
            <p className="text-sm text-text-secondary mt-1.5">{c.positioning}</p>
            {c.audienceFocus && <p className="text-xs text-slate-500 mt-1">Targets: {c.audienceFocus}</p>}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Row label="Strengths">
                <Bullets items={c.strengths} />
              </Row>
              <Row label="Weaknesses">
                <Bullets items={c.weaknesses} />
              </Row>
            </div>
            {c.adAngles.length > 0 && (
              <Row label="Ad angles">
                <ChipList items={c.adAngles} />
              </Row>
            )}
          </SectionCard>
        ))}
      </div>
    ) : (
      <SectionCard>
        <Empty />
      </SectionCard>
    )}

    <div className="grid sm:grid-cols-2 gap-4">
      <SectionCard title="Space you can own" icon="lightbulb">
        <Bullets items={data.whiteSpace} />
      </SectionCard>
      <SectionCard title="How you stand apart" icon="sparkles">
        <Bullets items={data.differentiators} />
      </SectionCard>
    </div>
    <div className="grid sm:grid-cols-2 gap-4">
      <SectionCard title="Common ad patterns" icon="layers">
        <Bullets items={data.adPatterns} />
      </SectionCard>
      <SectionCard title="Overused messaging" icon="x">
        <ChipList items={data.messagingToAvoid} tone="bad" />
      </SectionCard>
    </div>

    <GapsNotice gaps={data.gaps} />
    <Sources sources={data.sources} />
  </div>
);
