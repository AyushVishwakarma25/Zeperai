import React from 'react';
import type { CreativeDirection } from '../../src/campaignStudio/types.js';
import { Chip, SectionCard } from './shared.js';
import { Bullets, ChipList, Row } from './viewParts.js';

export const CreativeDirectionView: React.FC<{ data: CreativeDirection }> = ({ data }) => {
  const byPillar = new Map<string, typeof data.concepts>();
  for (const c of data.concepts) byPillar.set(c.pillar, [...(byPillar.get(c.pillar) ?? []), c]);

  return (
    <div className="space-y-4">
      <SectionCard title="Visual direction" icon="palette">
        <Row label="Theme">{data.visualTheme}</Row>
        <div className="grid sm:grid-cols-2 gap-3">
          <Row label="Mood">
            <ChipList items={data.moodKeywords} />
          </Row>
          <Row label="Photography style">{data.photographyStyle || <span className="text-slate-400">Not specified</span>}</Row>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Row label="Colour guidance">{data.colorGuidance || <span className="text-slate-400">Not specified</span>}</Row>
          <Row label="Typography guidance">{data.typographyGuidance || <span className="text-slate-400">Not specified</span>}</Row>
        </div>
      </SectionCard>

      {[...byPillar.entries()].map(([pillar, concepts]) => (
        <SectionCard key={pillar} title={`${pillar} · ${concepts.length} concept${concepts.length === 1 ? '' : 's'}`} icon="layers">
          <div className="grid sm:grid-cols-2 gap-3">
            {concepts.map((c) => (
              <div key={c.id} className="rounded-xl border border-border-light p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-text-primary">{c.headline}</p>
                  <Chip>{c.id}</Chip>
                </div>
                {c.subheadline && <p className="text-xs text-text-secondary">{c.subheadline}</p>}
                <p className="text-xs text-slate-500 mt-2">{c.visualIdea}</p>
                {c.storyline && <p className="text-xs text-text-secondary mt-1.5">{c.storyline}</p>}
                {c.composition && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    <span className="font-semibold">Composition: </span>
                    {c.composition}
                  </p>
                )}
                <p className="text-xs text-primary font-medium mt-1.5">{c.cta}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}

      {data.thingsToAvoid.length > 0 && (
        <SectionCard title="Avoid" icon="x">
          <Bullets items={data.thingsToAvoid} />
        </SectionCard>
      )}
    </div>
  );
};
