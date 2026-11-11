import React, { useState } from 'react';
import type { CampaignAsset, CreativeOverlay, MetaCampaignPackage, StandardAspectRatio } from '../../src/campaignStudio/types.js';
import { campaignApi } from '../../src/campaignStudio/client/defaultApi.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';
import { Chip, Notice } from './shared.js';
import { QualityScoreBadge } from './QualityScoreBadge.js';

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

  // Phase 5: Multi-Aspect Ratio Adaptation & Meta Export State
  const [selectedRatio, setSelectedRatio] = useState<Record<number, StandardAspectRatio>>({});
  const [adaptedComposites, setAdaptedComposites] = useState<Record<string, string>>({});
  const [isAdapting, setIsAdapting] = useState<Record<string, boolean>>({});
  const [metaPackageModalOpen, setMetaPackageModalOpen] = useState(false);
  const [metaPackage, setMetaPackage] = useState<MetaCampaignPackage | null>(null);
  const [loadingMetaPackage, setLoadingMetaPackage] = useState(false);

  // Group assets by creative_index and pick the newest version
  const latestByIndex = new Map<number, CampaignAsset>();
  for (const a of assets) {
    const existing = latestByIndex.get(a.creative_index);
    if (!existing || a.version > existing.version) {
      latestByIndex.set(a.creative_index, a);
    }
  }
  const displayAssets = Array.from(latestByIndex.values()).sort((a, b) => a.creative_index - b.creative_index);

  const handleSelectRatio = async (creativeIndex: number, targetRatio: StandardAspectRatio) => {
    setSelectedRatio((prev) => ({ ...prev, [creativeIndex]: targetRatio }));
    const cacheKey = `${creativeIndex}-${targetRatio}`;
    if (adaptedComposites[cacheKey]) return;

    const asset = latestByIndex.get(creativeIndex);
    const overlay = (asset?.overlay || {}) as CreativeOverlay;
    if (overlay.adaptations?.[targetRatio]?.compositeUrl) {
      setAdaptedComposites((prev) => ({
        ...prev,
        [cacheKey]: overlay.adaptations![targetRatio].compositeUrl,
      }));
      return;
    }

    // Call server to derive adaptation
    setIsAdapting((prev) => ({ ...prev, [cacheKey]: true }));
    try {
      const res = await campaignApi.adaptCreative(runId, creativeIndex, targetRatio);
      if (res.success && res.compositeUrl) {
        setAdaptedComposites((prev) => ({ ...prev, [cacheKey]: res.compositeUrl }));
      }
    } catch (err: any) {
      console.warn('Adaptation failed:', err);
    } finally {
      setIsAdapting((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  const handleOpenMetaPackage = async () => {
    setMetaPackageModalOpen(true);
    if (metaPackage) return;
    setLoadingMetaPackage(true);
    try {
      const res = await campaignApi.getMetaPackage(runId);
      if (res.success && res.package) {
        setMetaPackage(res.package);
      }
    } catch (err: any) {
      if (notify) notify('Failed to generate Meta copy package: ' + (err.message || 'Server error'), 'error');
    } finally {
      setLoadingMetaPackage(false);
    }
  };

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

  const handleTargetedFix = async (creativeIndex: number, component: string, instructions: string) => {
    setBusyIndex(creativeIndex);
    setErrorMsg(null);
    try {
      await campaignApi.targetedRegenerateCreative(runId, creativeIndex, {
        component: component as any,
        instructions,
      });
      if (notify) notify(`Applied targeted fix to ${component} on Creative #${creativeIndex}`);
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to apply fix on creative #${creativeIndex}`);
    } finally {
      setBusyIndex(null);
    }
  };

  const downloadImage = (asset: CampaignAsset) => {
    const overlay = (asset.overlay || {}) as CreativeOverlay;
    const downloadUrl = overlay.renderedCompositeUrl || asset.image_url;
    if (!downloadUrl) return;
    const isSvg = downloadUrl.startsWith('data:image/svg+xml');
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `campaign-creative-${asset.creative_index}.${isSvg ? 'svg' : 'png'}`;
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenMetaPackage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors"
          >
            <Icon name="file-text" className="w-3.5 h-3.5" />
            <span>Copy Sheet & Angles</span>
          </button>
          <a
            href={`/api/campaign/runs/${encodeURIComponent(runId)}/export-zip`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <Icon name="download" className="w-3.5 h-3.5" />
            <span>Export Meta Package (.zip)</span>
          </a>
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
          const refCount = overlay.referenceImageCount ?? 0;
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
                  {overlay.document?.advertisingFormat && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {overlay.document.advertisingFormat}
                    </span>
                  )}
                  {asset.version > 1 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      v{asset.version}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {overlay.document?.layers && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {overlay.document.layers.length} layers
                    </span>
                  )}
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

              {/* Status Sub-header: Reference Photo + Quality Score Badge */}
              <div className="px-4 py-2 bg-slate-50/60 border-b border-border-light flex items-center justify-between gap-2 text-[11px]">
                {refCount > 0 ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    title={`${refCount} real product reference photo(s) were attached to guide generation for this creative.`}
                  >
                    <Icon name="camera" className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{refCount} {refCount === 1 ? 'reference photo' : 'reference photos'} used</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium bg-amber-50/80 text-amber-800 border border-amber-200/70"
                    title="No uploaded product reference photos were attached — the model approximated the product appearance from prompt descriptions alone."
                  >
                    <Icon name="sparkles" className="w-3.5 h-3.5 text-amber-600" />
                    <span>no reference photo</span>
                  </span>
                )}

                <QualityScoreBadge
                  evaluation={overlay.evaluation}
                  onTargetedFix={(comp, fix) => handleTargetedFix(asset.creative_index, comp, fix)}
                  isBusy={isBusy}
                />
              </div>

              {/* Aspect Ratio Placement Tabs (Phase 5) */}
              <div className="px-3 py-1.5 bg-slate-100/80 border-b border-border-light flex items-center justify-between gap-1 overflow-x-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                  Placement:
                </span>
                <div className="flex items-center gap-1">
                  {(['1:1', '4:5', '9:16', '1.91:1'] as const).map((ratio) => {
                    const isSelected = (selectedRatio[asset.creative_index] || '1:1') === ratio;
                    const adapting = isAdapting[`${asset.creative_index}-${ratio}`];
                    return (
                      <button
                        key={ratio}
                        type="button"
                        disabled={adapting}
                        onClick={() => handleSelectRatio(asset.creative_index, ratio)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {adapting ? <Spinner className="w-2.5 h-2.5 inline mr-1" /> : null}
                        {ratio === '1:1' && '1:1 Feed'}
                        {ratio === '4:5' && '4:5 Mobile'}
                        {ratio === '9:16' && '9:16 Stories'}
                        {ratio === '1.91:1' && '1.91:1 Wide'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Preview Container */}
              {(() => {
                const currentRatio = selectedRatio[asset.creative_index] || '1:1';
                const cacheKey = `${asset.creative_index}-${currentRatio}`;
                const previewSrc =
                  adaptedComposites[cacheKey] ||
                  overlay.adaptations?.[currentRatio]?.compositeUrl ||
                  (currentRatio === '1:1' && overlay.renderedCompositeUrl
                    ? overlay.renderedCompositeUrl
                    : asset.image_url);

                const aspectClass =
                  currentRatio === '1:1'
                    ? 'aspect-square'
                    : currentRatio === '4:5'
                      ? 'aspect-[4/5]'
                      : currentRatio === '9:16'
                        ? 'aspect-[9/16] max-h-[500px]'
                        : 'aspect-[1200/628]';

                return (
                  <div className={`relative ${aspectClass} w-full bg-slate-900 overflow-hidden flex items-center justify-center transition-all`}>
                    {isBusy ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-white">
                        <Spinner className="w-8 h-8 text-primary mb-3" />
                        <p className="text-xs font-semibold">Regenerating creative #{asset.creative_index}…</p>
                      </div>
                    ) : asset.status === 'ready' && asset.image_url ? (
                      <>
                        <img
                          src={showOverlay && previewSrc ? previewSrc : asset.image_url}
                          alt={overlay.headline || `Creative ${asset.creative_index}`}
                          className="w-full h-full object-cover select-none"
                        />

                        {/* Clean Overlay (Only displayed if no deterministic composite is embedded) */}
                        {showOverlay && !previewSrc && (
                          <div className="absolute inset-0 p-5 flex flex-col justify-between pointer-events-none bg-gradient-to-t from-black/75 via-transparent to-black/40">
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
                            title="Download image"
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
                );
              })()}

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
                  src={
                    showOverlay && (expandedAsset.overlay as CreativeOverlay)?.renderedCompositeUrl
                      ? (expandedAsset.overlay as CreativeOverlay).renderedCompositeUrl!
                      : expandedAsset.image_url
                  }
                  alt="Creative preview"
                  className="w-full h-full object-cover"
                />
              )}
              {showOverlay && !(expandedAsset.overlay as CreativeOverlay)?.renderedCompositeUrl && (
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Creative #{expandedAsset.creative_index}
                </span>
                {((expandedAsset.overlay as CreativeOverlay)?.referenceImageCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px]">
                    <Icon name="camera" className="w-3 h-3 text-emerald-400" />
                    <span>
                      {(expandedAsset.overlay as CreativeOverlay).referenceImageCount}{' '}
                      {(expandedAsset.overlay as CreativeOverlay).referenceImageCount === 1 ? 'reference photo' : 'reference photos'} used
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-amber-950/80 text-amber-300 border border-amber-800/80 text-[10px]">
                    <Icon name="sparkles" className="w-3 h-3 text-amber-400" />
                    <span>no reference photo — AI approximated the product</span>
                  </span>
                )}
              </div>
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

      {/* Meta Ad Package Copy Sheet Modal (Phase 5) */}
      {metaPackageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setMetaPackageModalOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl my-8 max-h-[85vh] flex flex-col text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Icon name="file-text" className="w-5 h-5 text-emerald-400" />
                  <span>Meta Ads Copy Package & Placement Strategy</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pre-formatted ad copy variations and targeting hooks ready for Meta Ads Manager.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMetaPackageModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
              {loadingMetaPackage ? (
                <div className="py-16 text-center text-slate-500">
                  <Spinner className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-semibold">Generating Meta copy variations & placement packages…</p>
                </div>
              ) : metaPackage ? (
                <>
                  {/* Campaign Metadata Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Recommended Objective</span>
                      <span className="text-xs font-bold text-emerald-700">{metaPackage.campaignObjective}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Targeting Hooks</span>
                      <span className="text-xs text-slate-700 truncate block">
                        {metaPackage.suggestedTargetingHooks[0] || 'Broad / Advantage+ Audience'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Placement Package</span>
                      <span className="text-xs text-slate-700 block">1:1, 4:5, 9:16, 1.91:1 included</span>
                    </div>
                  </div>

                  {/* Concepts Copy List */}
                  <div className="space-y-6">
                    {metaPackage.concepts.map((concept) => (
                      <div
                        key={concept.conceptId}
                        className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                              Concept #{concept.creativeIndex} • {concept.marketingAngle}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{concept.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                              CTA: {concept.copy.callToAction}
                            </span>
                          </div>
                        </div>

                        {/* Primary Text */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-600 block">
                            Primary Text (3 Variations, &le; 250 chars)
                          </span>
                          <div className="space-y-2">
                            {concept.copy.primaryText.map((text, i) => (
                              <div
                                key={i}
                                className="group relative p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs text-slate-700"
                              >
                                <span className="font-mono text-[10px] text-slate-400 shrink-0 mt-0.5">
                                  {i === 0 ? 'Hook' : i === 1 ? 'Benefit' : 'Question'}:
                                </span>
                                <span className="flex-1 select-all">{text}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(text);
                                    if (notify) notify('Primary text copied to clipboard', 'success');
                                  }}
                                  className="text-[10px] font-bold text-primary hover:underline shrink-0"
                                >
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Headlines */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-600 block">
                            Headlines (&le; 40 chars)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {concept.copy.headlines.map((hl, i) => (
                              <div
                                key={i}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="truncate select-all text-slate-800 font-medium" title={hl}>
                                  {hl}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(hl);
                                    if (notify) notify('Headline copied', 'success');
                                  }}
                                  className="text-[10px] font-bold text-primary hover:underline shrink-0"
                                >
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Descriptions */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-600 block">
                            Descriptions (&le; 30 chars)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {concept.copy.descriptions.map((desc, i) => (
                              <div
                                key={i}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="truncate select-all text-slate-800 font-medium" title={desc}>
                                  {desc}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(desc);
                                    if (notify) notify('Description copied', 'success');
                                  }}
                                  className="text-[10px] font-bold text-primary hover:underline shrink-0"
                                >
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <p>Could not load Meta copy package.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                All formats & copy sheets ready for Meta Ads Manager.
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/campaign/runs/${encodeURIComponent(runId)}/export-zip`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <Icon name="download" className="w-3.5 h-3.5" />
                  <span>Download Package (.zip)</span>
                </a>
                <Button
                  variant="secondary"
                  onClick={() => setMetaPackageModalOpen(false)}
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
