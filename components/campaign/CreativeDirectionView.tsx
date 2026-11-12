import React, { useState } from 'react';
import type { CreativeBlueprint, CreativeDirection, DirectionCritiqueReport } from '../../src/campaignStudio/types.js';
import { Chip, SectionCard } from './shared.js';
import { Bullets, ChipList, Row } from './viewParts.js';
import { Icon } from '../ui/Icon.js';

const IntensityBadge: React.FC<{ intensity?: string }> = ({ intensity }) => {
  if (!intensity) return null;
  const toneMap: Record<string, 'neutral' | 'good' | 'warn' | 'bad'> = {
    minimal: 'neutral',
    balanced: 'good',
    bold: 'warn',
    experimental: 'bad',
  };
  const tone = toneMap[intensity] || 'neutral';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        tone === 'warn'
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : tone === 'good'
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : tone === 'bad'
          ? 'bg-purple-50 text-purple-700 border border-purple-200'
          : 'bg-slate-100 text-slate-700 border border-slate-200'
      }`}
    >
      {intensity}
    </span>
  );
};

export const CreativeDirectionView: React.FC<{ data: CreativeDirection }> = ({ data }) => {
  const [expandedBlueprint, setExpandedBlueprint] = useState<string | null>(null);

  const byPillar = new Map<string, typeof data.concepts>();
  for (const c of data.concepts) byPillar.set(c.pillar, [...(byPillar.get(c.pillar) ?? []), c]);

  const critic = data.criticReport as DirectionCritiqueReport | undefined;

  return (
    <div className="space-y-4">
      {/* V2 Art Director Critic Audit Banner */}
      {critic && (
        <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                <Icon name="shield-check" className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  Art Director Critic Evaluation (V2)
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white">
                    Verified
                  </span>
                </h4>
                <p className="text-xs text-slate-500">Autonomous quality critique before rendering visual assets</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                critic.isApproved 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                Score: {critic.overallScore}/100 · {critic.isApproved ? 'Approved' : 'Needs Review'}
              </span>
            </div>
          </div>

          {critic.summary && (
            <p className="text-xs text-slate-700 mt-2.5 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-purple-100/60">
              <span className="font-bold text-purple-900">Critic Verdict: </span>
              {critic.summary}
            </p>
          )}
        </div>
      )}

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
            {concepts.map((c) => {
              const bp = c.blueprint as CreativeBlueprint | undefined;
              const isBpOpen = expandedBlueprint === c.id;

              return (
                <div key={c.id} className="rounded-xl border border-border-light p-3.5 flex flex-col justify-between bg-white shadow-2xs">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Chip>{c.id}</Chip>
                        {c.conceptName && (
                          <span className="text-[11px] font-bold text-purple-900 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md">
                            {c.conceptName}
                          </span>
                        )}
                        {bp?.advertisingFormat && (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {bp.advertisingFormat}
                          </span>
                        )}
                        <IntensityBadge intensity={bp?.designIntensity} />
                      </div>

                      {c.criticReview && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          c.criticReview.isApproved 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {c.criticReview.overallScore}/100
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-text-primary leading-tight mt-1">{c.headline}</p>
                    {c.subheadline && <p className="text-xs text-text-secondary mt-0.5">{c.subheadline}</p>}
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{c.visualIdea}</p>
                    {c.storyline && <p className="text-xs text-text-secondary mt-1.5 italic">{c.storyline}</p>}

                    {/* V2 Structured Art Direction Dimensions */}
                    {(c.productPlacement || c.lightingDirection || c.backgroundDirection) && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-[10px] text-slate-600">
                        {c.productPlacement && (
                          <div className="bg-slate-50 p-1.5 rounded-md">
                            <span className="font-semibold text-slate-800">Placement: </span>
                            {c.productPlacement}
                          </div>
                        )}
                        {c.lightingDirection && (
                          <div className="bg-slate-50 p-1.5 rounded-md">
                            <span className="font-semibold text-slate-800">Lighting: </span>
                            {c.lightingDirection}
                          </div>
                        )}
                        {c.backgroundDirection && (
                          <div className="col-span-2 bg-slate-50 p-1.5 rounded-md">
                            <span className="font-semibold text-slate-800">Background: </span>
                            {c.backgroundDirection}
                          </div>
                        )}
                      </div>
                    )}

                    {c.composition && (
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-800">Composition: </span>
                        {c.composition}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-border-light flex items-center justify-between">
                    <p className="text-xs text-primary font-bold">{c.cta}</p>

                    {bp && (
                      <button
                        type="button"
                        onClick={() => setExpandedBlueprint(isBpOpen ? null : c.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 font-medium underline transition-colors"
                      >
                        {isBpOpen ? 'Hide Blueprint' : 'View Blueprint Layout'}
                      </button>
                    )}
                  </div>

                  {/* Expanded Blueprint Details */}
                  {bp && isBpOpen && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-50/90 border border-slate-200 text-[11px] space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-slate-600 font-semibold border-b border-slate-200/80 pb-1">
                        <span>Canvas: {bp.canvas.aspectRatio} ({bp.canvas.width}×{bp.canvas.height}px)</span>
                        <span>Font: {bp.typography.headlineStyle.fontFamily}</span>
                      </div>

                      {bp.layout.elements && bp.layout.elements.length > 0 && (
                        <div>
                          <p className="font-bold text-slate-700 mb-1">Layout Elements (Bounding Boxes):</p>
                          <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                            {bp.layout.elements.map((el, idx) => (
                              <div key={`${el.element}-${idx}`} className="bg-white p-1 rounded border border-slate-200">
                                <span className="font-bold text-slate-800">{el.element}: </span>
                                <span className="text-slate-500">
                                  ({Math.round(el.x * 100)}%, {Math.round(el.y * 100)}%) {Math.round(el.width * 100)}×{Math.round(el.height * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {bp.constraints && (
                        <div className="pt-1 text-[10px] text-slate-500 flex flex-wrap gap-2">
                          {bp.constraints.preserveProductPackaging && <span>✓ Preserve Packaging</span>}
                          {bp.constraints.prohibitInventedClaims && <span>✓ Factual Claims Only</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
