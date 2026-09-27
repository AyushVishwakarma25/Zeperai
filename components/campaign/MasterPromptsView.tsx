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
              <div key={p.conceptId} className="rounded-xl border border-border-light p-3 bg-white">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-bold text-text-primary">{p.headline}</p>
                  <Chip>{p.aspectRatio}</Chip>
                </div>
                {p.subheadline && <p className="text-xs text-text-secondary">{p.subheadline}</p>}
                <p className="text-xs text-primary font-medium mt-1">{p.cta}</p>

                {p.referenceImageUrls && p.referenceImageUrls.length > 0 ? (
                  <div className="flex items-center gap-1.5 my-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {p.referenceImageUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Reference ${idx + 1}`}
                          className="inline-block w-6 h-6 rounded-md object-cover ring-2 ring-white border border-border-light bg-slate-100 shadow-sm"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Product reference linked ({p.referenceImageUrls.length})
                    </span>
                  </div>
                ) : (
                  <div className="my-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/80">
                      No reference photo — AI will approximate the product
                    </span>
                  </div>
                )}

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
