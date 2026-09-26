import React, { useState } from 'react';
import type { CampaignAsset, CreativeOverlay } from '../../src/campaignStudio/types.js';
import { campaignApi } from '../../src/campaignStudio/client/defaultApi.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';
import { Chip, Notice } from './shared.js';

interface Props {
  runId: string;
  assets: CampaignAsset[];
  readOnly?: boolean;
  onRefresh?: () => Promise<void> | void;
  notify?: (message: string, type?: 'success' | 'error') => void;
}

export const CreativesView: React.FC<Props> = ({ runId, assets = [], readOnly = false, onRefresh, notify }) => {
  const [redoIndex, setRedoIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<CampaignAsset | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  // Group assets by creative_index and pick the newest version
  const latestByIndex = new Map<number, CampaignAsset>();
  for (const a of assets) {
    const existing = latestByIndex.get(a.creative_index);
    if (!existing || a.version > existing.version) {
      latestByIndex.set(a.creative_index, a);
    }
  }
  const displayAssets = Array.from(latestByIndex.values()).sort((a, b) => a.creative_index - b.creative_index);

  const handleRegenerateOne = async (creativeIndex: number) => {
    setBusyIndex(creativeIndex);
    setErrorMsg(null);
    try {
      await campaignApi.regenerateCreative(runId, creativeIndex, feedback.trim() || undefined);
      setRedoIndex(null);
      setFeedback('');
      if (notify) notify(`Creative #${creativeIndex} regenerated successfully`);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to regenerate creative #${creativeIndex}`);
      if (onRefresh) await onRefresh();
    } finally {
      setBusyIndex(null);
    }
  };

  const downloadImage = (asset: CampaignAsset) => {
    if (!asset.image_url) return;
    const a = document.createElement('a');
    a.href = asset.image_url;
    a.download = `campaign-creative-${asset.creative_index}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (displayAssets.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-secondary">
        No creatives generated yet.
      </div>
    );
  }

  const readyCount = displayAssets.filter((a) => a.status === 'ready').length;
  const failedCount = displayAssets.filter((a) => a.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border-light">
        <div>
          <h4 className="text-base font-bold text-text-primary">
            Generated Creatives ({readyCount} of {displayAssets.length} ready)
          </h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Background visuals generated without baked-in text. Headlines and CTAs are overlaid cleanly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOverlay(!showOverlay)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border-light hover:bg-slate-50 text-slate-700"
          >
            <Icon name={showOverlay ? 'eye-off' : 'eye'} className="w-3.5 h-3.5" />
            {showOverlay ? 'Hide text overlay' : 'Show text overlay'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <Notice tone="error" onDismiss={() => setErrorMsg(null)}>
          {errorMsg}
        </Notice>
      )}

      {failedCount > 0 && !errorMsg && (
        <Notice tone="warning">
          {failedCount} creative{failedCount > 1 ? 's' : ''} failed to generate. You can retry each failed concept below without re-running the entire batch.
        </Notice>
      )}

      {/* Creatives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayAssets.map((asset) => {
          const overlay = (asset.overlay || {}) as CreativeOverlay;
          const isBusy = busyIndex === asset.creative_index;
          const isRedoing = redoIndex === asset.creative_index;

          return (
            <div
              key={`${asset.run_id}-${asset.creative_index}`}
              className="rounded-2xl border border-border-light bg-white overflow-hidden shadow-sm flex flex-col"
            >
              {/* Card Header */}
              <div className="px-4 py-3 bg-slate-50/80 border-b border-border-light flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Creative #{asset.creative_index}
                  </span>
                  {asset.version > 1 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      v{asset.version}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {asset.status === 'ready' && <Chip tone="good">Ready</Chip>}
                  {asset.status === 'generating' && (
                    <Chip tone="warn">
                      <Spinner className="w-3 h-3 inline mr-1" /> Generating
                    </Chip>
                  )}
                  {asset.status === 'failed' && <Chip tone="bad">Failed</Chip>}
                  {asset.credits_charged > 0 && (
                    <span className="text-[11px] text-slate-400">
                      {asset.credits_charged} credit{asset.credits_charged > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Preview Container */}
              <div className="relative aspect-square w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                {isBusy ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-white">
                    <Spinner className="w-8 h-8 text-primary mb-3" />
                    <p className="text-xs font-semibold">Regenerating creative #{asset.creative_index}…</p>
                  </div>
                ) : asset.status === 'ready' && asset.image_url ? (
                  <>
                    <img
                      src={asset.image_url}
                      alt={overlay.headline || `Creative ${asset.creative_index}`}
                      className="w-full h-full object-cover select-none"
                    />

                    {/* Clean Overlay */}
                    {showOverlay && (
                      <div className="absolute inset-0 p-5 flex flex-col justify-between pointer-events-none bg-gradient-to-t from-black/75 via-transparent to-black/40">
                        {/* Top / Headline */}
                        <div className="space-y-1">
                          {overlay.headline && (
                            <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
                              {overlay.headline}
                            </h3>
                          )}
                          {overlay.subheading && (
                            <p className="text-xs sm:text-sm font-medium text-slate-200 drop-shadow">
                              {overlay.subheading}
                            </p>
                          )}
                        </div>

                        {/* Bottom / CTA */}
                        {overlay.cta && (
                          <div className="pt-2">
                            <span className="inline-block px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-lg uppercase tracking-wide">
                              {overlay.cta}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* View full / Download hover buttons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setExpandedAsset(asset)}
                        title="Expand preview"
                        className="p-1 text-white hover:text-primary transition-colors"
                      >
                        <Icon name="maximize" className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadImage(asset)}
                        title="Download background"
                        className="p-1 text-white hover:text-primary transition-colors"
                      >
                        <Icon name="download" className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : asset.status === 'failed' ? (
                  <div className="p-6 text-center text-white max-w-sm">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-2">
                      <Icon name="alert-triangle" className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-rose-300 mb-1">Generation Failed</p>
                    <p className="text-[11px] text-slate-300 mb-3">{asset.error || 'The model could not render this image.'}</p>
                    {!readOnly && (
                      <Button
                        variant="secondary"
                        onClick={() => handleRegenerateOne(asset.creative_index)}
                        disabled={isBusy}
                        className="!text-xs !py-1 !px-3 mx-auto"
                      >
                        <Icon name="refresh-cw" className="w-3.5 h-3.5 mr-1" />
                        Retry this one
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400">
                    <Spinner className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs">Preparing generation…</p>
                  </div>
                )}
              </div>

              {/* Card Footer / Copy Details & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                <div className="space-y-1.5 text-left">
                  {overlay.headline && (
                    <p className="text-xs font-bold text-text-primary">
                      <span className="text-slate-400 font-normal">Headline: </span>
                      {overlay.headline}
                    </p>
                  )}
                  {overlay.subheading && (
                    <p className="text-xs text-text-secondary">
                      <span className="text-slate-400">Subheading: </span>
                      {overlay.subheading}
                    </p>
                  )}
                  {overlay.cta && (
                    <p className="text-xs text-primary font-semibold">
                      <span className="text-slate-400 font-normal">CTA: </span>
                      {overlay.cta}
                    </p>
                  )}
                  {asset.prompt && (
                    <details className="text-[11px] text-slate-500 mt-2">
                      <summary className="cursor-pointer text-slate-400 hover:text-slate-600">
                        View image prompt
                      </summary>
                      <p className="mt-1 p-2 bg-slate-50 rounded-lg text-slate-600 leading-relaxed font-mono text-[10px]">
                        {asset.prompt}
                      </p>
                    </details>
                  )}
                </div>

                {/* Inline Redo Controls */}
                {!readOnly && (
                  <div className="pt-2 border-t border-border-light">
                    {isRedoing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Optional: what should change for this creative? (e.g. warmer lighting, dramatic angle)"
                          className="w-full text-xs p-2 rounded-lg border border-border-light focus:outline-none focus:border-primary"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleRegenerateOne(asset.creative_index)}
                            disabled={isBusy}
                            isLoading={isBusy}
                            className="!text-xs !py-1 !px-3"
                          >
                            Regenerate this one
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setRedoIndex(null);
                              setFeedback('');
                            }}
                            className="!text-xs !py-1 !px-3"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setRedoIndex(asset.creative_index);
                            setFeedback('');
                          }}
                          disabled={isBusy}
                          className="inline-flex items-center text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
                        >
                          <Icon name="refresh-cw" className="w-3.5 h-3.5 mr-1" />
                          Regenerate this one
                        </button>
                        {asset.image_url && (
                          <button
                            type="button"
                            onClick={() => downloadImage(asset)}
                            className="text-xs text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1"
                          >
                            <Icon name="download" className="w-3 h-3" />
                            Download
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Modal */}
      {expandedAsset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedAsset(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full">
              {expandedAsset.image_url && (
                <img
                  src={expandedAsset.image_url}
                  alt="Creative preview"
                  className="w-full h-full object-cover"
                />
              )}
              {showOverlay && (
                <div className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/50">
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {(expandedAsset.overlay as CreativeOverlay)?.headline}
                    </h3>
                    <p className="text-sm sm:text-base font-medium text-slate-200">
                      {(expandedAsset.overlay as CreativeOverlay)?.subheading}
                    </p>
                  </div>
                  {(expandedAsset.overlay as CreativeOverlay)?.cta && (
                    <div>
                      <span className="inline-block px-5 py-2.5 rounded-full bg-primary text-white text-sm font-bold shadow-xl uppercase tracking-wider">
                        {(expandedAsset.overlay as CreativeOverlay)?.cta}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Creative #{expandedAsset.creative_index}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => downloadImage(expandedAsset)}
                  className="!text-xs !py-1 !px-3"
                >
                  <Icon name="download" className="w-3.5 h-3.5 mr-1" />
                  Download
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setExpandedAsset(null)}
                  className="!text-xs !py-1 !px-3"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
