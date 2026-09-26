import React from 'react';
import type { MasterPrompts } from '../../src/campaignStudio/types.js';
import { Chip, SectionCard } from './shared.js';

export const MasterPromptsView: React.FC<{ data: MasterPrompts }> = ({ data }) => {
  const byPillar = new Map<string, typeof data.prompts>();
  for (const p of data.prompts) byPillar.set(p.pillar, [...(byPillar.get(p.pillar) ?? []), p]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        {data.prompts.length} prompt{data.prompts.length === 1 ? '' : 's'} ready. Headlines and CTAs will be added on top of each generated image, so the images themselves contain no text.
      </p>
      {[...byPillar.entries()].map(([pillar, prompts]) => (
        <SectionCard key={pillar} title={pillar} icon="image">
          <div className="space-y-3">
            {prompts.map((p) => (
              <div key={p.conceptId} className="rounded-xl border border-border-light p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-bold text-text-primary">{p.headline}</p>
                  <Chip>{p.aspectRatio}</Chip>
                </div>
                {p.subheadline && <p className="text-xs text-text-secondary">{p.subheadline}</p>}
                <p className="text-xs text-primary font-medium mt-1">{p.cta}</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  <span className="font-semibold text-slate-600">Image prompt: </span>
                  {p.imagePrompt}
                </p>
                {p.negativePrompt && (
                  <p className="text-xs text-slate-400 mt-1">
                    <span className="font-semibold">Avoid: </span>
                    {p.negativePrompt}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
};
