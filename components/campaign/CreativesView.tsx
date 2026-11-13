import React, { useState } from 'react';
import {
  type CampaignAsset,
  type CreativeOverlay,
  type MetaCampaignPackage,
  type StandardAspectRatio,
  isCreativeEligibleForExport,
  resolveCreativeLifecycleStatus,
} from '../../src/campaignStudio/types.js';
import { campaignApi } from '../../src/campaignStudio/client/defaultApi.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';
import { Notice } from './shared.js';
import { QualityReportDrawer } from './QualityReportDrawer.js';

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
  const [isAiGeneratingFormat, setIsAiGeneratingFormat] = useState<Record<string, boolean>>({});
  const [metaPackageModalOpen, setMetaPackageModalOpen] = useState(false);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonCreativeIndex, setComparisonCreativeIndex] = useState<number>(1);
  const [metaPackage, setMetaPackage] = useState<MetaCampaignPackage | null>(null);
  const [loadingMetaPackage, setLoadingMetaPackage] = useState(false);
  const [targetedEditIndex, setTargetedEditIndex] = useState<number | null>(null);
  const [targetedComponent, setTargetedComponent] = useState<'headline' | 'background' | 'product' | 'cta' | 'layout'>('background');
  const [targetedInstructions, setTargetedInstructions] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Quality Report Drawer State
  const [drawerCreativeIndex, setDrawerCreativeIndex] = useState<number | null>(null);

  // Group assets by creative_index and pick the newest version
  const latestByIndex = new Map<number, CampaignAsset>();
  for (const a of assets) {
    const existing = latestByIndex.get(a.creative_index);
    if (!existing || a.version > existing.version) {
      latestByIndex.set(a.creative_index, a);
    }
  }
  const displayAssets = Array.from(latestByIndex.values()).sort((a, b) => a.creative_index - b.creative_index);

  // Lifecycle status metrics
  const approvedCount = displayAssets.filter((a) => resolveCreativeLifecycleStatus(a) === 'Approved').length;
  const readyForReviewCount = displayAssets.filter((a) => resolveCreativeLifecycleStatus(a) === 'Ready for Review').length;
  const needsRevisionCount = displayAssets.filter((a) => resolveCreativeLifecycleStatus(a) === 'Needs Revision').length;
  const qaIncompleteCount = displayAssets.filter((a) => resolveCreativeLifecycleStatus(a) === 'QA Incomplete').length;
  const failedCount = displayAssets.filter((a) => resolveCreativeLifecycleStatus(a) === 'Failed').length;
  const isExportEligible = approvedCount > 0;

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

    if (targetRatio === '1:1') {
      const default1x1 = overlay.renderedCompositeUrl || asset?.image_url;
      if (default1x1) {
        setAdaptedComposites((prev) => ({ ...prev, [cacheKey]: default1x1 }));
        return;
      }
    }

    // Call server to derive reflow adaptation
    setIsAdapting((prev) => ({ ...prev, [cacheKey]: true }));
    try {
      const res = await campaignApi.adaptCreative(runId, creativeIndex, targetRatio);
      if (res.success && res.compositeUrl) {
        setAdaptedComposites((prev) => ({ ...prev, [cacheKey]: res.compositeUrl }));
      }
    } catch (err: any) {
      console.warn('Adaptation failed:', err);
      if (asset?.image_url) {
        setAdaptedComposites((prev) => ({ ...prev, [cacheKey]: overlay.renderedCompositeUrl || asset.image_url! }));
      }
    } finally {
      setIsAdapting((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  // AI-Driven Format Resizing (User explicit decision to generate native background for this ratio)
  const handleAiGenerateFormat = async (creativeIndex: number, targetRatio: StandardAspectRatio) => {
    const cacheKey = `${creativeIndex}-${targetRatio}`;
    setIsAiGeneratingFormat((prev) => ({ ...prev, [cacheKey]: true }));
    setErrorMsg(null);
    try {
      const res = await campaignApi.generateFormatWithAI(runId, creativeIndex, targetRatio);
      if (res.success && res.compositeUrl) {
        setAdaptedComposites((prev) => ({ ...prev, [cacheKey]: res.compositeUrl }));
        if (notify) notify(`AI resized ${targetRatio} format generated successfully!`, 'success');
        if (onRefresh) await onRefresh();
      }
    } catch (err: any) {
      const msg = err.message || `Failed to AI resize format ${targetRatio}`;
      setErrorMsg(msg);
      if (notify) notify(msg, 'error');
    } finally {
      setIsAiGeneratingFormat((prev) => ({ ...prev, [cacheKey]: false }));
    }
  };

  // Explicit Creative Approval Handler
  const handleApprovalAction = async (creativeIndex: number, action: 'approve' | 'request_revision' | 'reset') => {
    setBusyIndex(creativeIndex);
    setErrorMsg(null);
    try {
      await campaignApi.setCreativeApproval(runId, creativeIndex, action);
      if (notify) {
        notify(
          action === 'approve'
            ? `Creative #${creativeIndex} approved!`
            : action === 'request_revision'
              ? `Creative #${creativeIndex} marked for revision`
              : `Creative #${creativeIndex} status reset`,
          'success',
        );
      }
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      const msg = err.message || 'Failed to update approval status';
      setErrorMsg(msg);
      if (notify) notify(msg, 'error');
    } finally {
      setBusyIndex(null);
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

  const downloadImage = (asset: CampaignAsset, formatRatio: StandardAspectRatio = '1:1') => {
    const overlay = (asset.overlay || {}) as CreativeOverlay;
    const cacheKey = `${asset.creative_index}-${formatRatio}`;
    const downloadUrl =
      adaptedComposites[cacheKey] ||
      overlay.adaptations?.[formatRatio]?.compositeUrl ||
      (formatRatio === '1:1' ? overlay.renderedCompositeUrl || asset.image_url : asset.image_url);
    if (!downloadUrl) return;
    const isSvg = downloadUrl.startsWith('data:image/svg+xml');
    const safeRatioName = formatRatio.replace(':', 'x');
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `campaign-creative-${asset.creative_index}-${safeRatioName}.${isSvg ? 'svg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportZip = async () => {
    if (!isExportEligible) {
      setErrorMsg('Export requires at least one explicitly approved creative with zero critical QA failures.');
      return;
    }
    setIsExportingZip(true);
    try {
      const { supabase } = await import('../../services/supabaseClient.js');
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`/api/campaign/runs/${encodeURIComponent(runId)}/export-zip`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Download failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${runId.slice(0, 8)}-meta-package.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      if (notify) notify('Meta Ad Package (.zip) downloaded successfully!');
    } catch (err: any) {
      if (notify) notify(err.message || 'Failed to download ZIP export', 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  if (displayAssets.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-text-secondary bg-slate-50/50 rounded-2xl border border-dashed border-border-light">
        <Icon name="sparkles" className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">No creatives generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">Approve master prompts to produce autonomous creatives.</p>
      </div>
    );
  }

  // Active drawer asset
  const drawerAsset = drawerCreativeIndex ? latestByIndex.get(drawerCreativeIndex) : null;
  const drawerOverlay = (drawerAsset?.overlay || {}) as CreativeOverlay;

  return (
    <div className="space-y-6">
      {/* Header bar with Status Breakdown */}
      <div className="p-4 rounded-2xl bg-white border border-border-light shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
              Generated Creatives
            </h4>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {approvedCount} of {displayAssets.length} Approved
              </span>
              {readyForReviewCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {readyForReviewCount} Ready for Review
                </span>
              )}
              {needsRevisionCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {needsRevisionCount} Needs Revision
                </span>
              )}
              {qaIncompleteCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {qaIncompleteCount} QA Incomplete
                </span>
              )}
              {failedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-200">
                  {failedCount} Failed
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-text-secondary">
            Autonomous multi-placement commercial ads. Inspect QA scores, preview placements, and explicitly approve creatives before export.
          </p>
        </div>

        {/* Global Campaign Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenMetaPackage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors cursor-pointer"
          >
            <Icon name="file-text" className="w-3.5 h-3.5" />
            <span>Copy Sheet & Angles</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setComparisonCreativeIndex(displayAssets[0]?.creative_index || 1);
              setComparisonModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
          >
            <Icon name="columns" className="w-3.5 h-3.5 text-slate-500" />
            <span>Compare Placements</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOverlay(!showOverlay)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border-light hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Icon name={showOverlay ? 'eye-off' : 'eye'} className="w-3.5 h-3.5" />
            <span>{showOverlay ? 'Hide Text Overlay' : 'Show Text Overlay'}</span>
          </button>

          {/* Export Meta Package (.zip) */}
          <div className="relative group">
            <button
              type="button"
              disabled={isExportingZip || !isExportEligible}
              onClick={handleExportZip}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all ${
                isExportEligible
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              {isExportingZip ? <Spinner className="w-3.5 h-3.5 text-white" /> : <Icon name="download" className="w-3.5 h-3.5" />}
              <span>{isExportingZip ? 'Building ZIP…' : 'Export Meta Package (.zip)'}</span>
            </button>
            {!isExportEligible && (
              <div className="absolute right-0 top-full mt-1.5 w-64 p-2 rounded-lg bg-slate-900 text-white text-[11px] shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30">
                Export requires at least one explicitly approved creative with zero critical QA failures.
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <Notice tone="error" onDismiss={() => setErrorMsg(null)}>
          {errorMsg}
        </Notice>
      )}

      {/* Creatives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayAssets.map((asset) => {
          const overlay = (asset.overlay || {}) as CreativeOverlay;
          const refCount = overlay.referenceImageCount ?? 0;
          const isBusy = busyIndex === asset.creative_index;
          const isRedoing = redoIndex === asset.creative_index;
          const lifecycleStatus = resolveCreativeLifecycleStatus(asset);
          const currentRatio = selectedRatio[asset.creative_index] || '1:1';
          const cacheKey = `${asset.creative_index}-${currentRatio}`;
          const isAiResizing = isAiGeneratingFormat[cacheKey];
          const hardRuleFailures = overlay.evaluation?.hardRuleFailures ?? [];
          const hasCriticalFailures = hardRuleFailures.length > 0;
          const isApproved = lifecycleStatus === 'Approved';

          // Format status
          const formatDetail = overlay.formatStatus?.[currentRatio];
          const isNativeAiFormat = formatDetail?.status === 'ai_generated' || currentRatio === '1:1';

          // Preview Source
          const previewSrc =
            adaptedComposites[cacheKey] ||
            overlay.adaptations?.[currentRatio]?.compositeUrl ||
            (currentRatio === '1:1' && overlay.renderedCompositeUrl
              ? overlay.renderedCompositeUrl
              : asset.image_url);

          // Aspect ratio container class preserving true proportions
          const aspectClass =
            currentRatio === '1:1'
              ? 'aspect-square'
              : currentRatio === '4:5'
                ? 'aspect-[4/5]'
                : currentRatio === '9:16'
                  ? 'aspect-[9/16] max-h-[540px]'
                  : 'aspect-[1200/628]';

          return (
            <div
              key={`${asset.run_id}-${asset.creative_index}`}
              className={`rounded-2xl border bg-white overflow-hidden shadow-xs flex flex-col transition-all duration-200 ${
                isApproved
                  ? 'border-emerald-300 ring-1 ring-emerald-400/40'
                  : lifecycleStatus === 'Needs Revision'
                    ? 'border-rose-200'
                    : 'border-border-light'
              }`}
            >
              {/* Card Top Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-border-light flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    Creative #{asset.creative_index}
                  </span>
                  {overlay.document?.advertisingFormat && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {overlay.document.advertisingFormat}
                    </span>
                  )}
                  {asset.version > 1 && (
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      v{asset.version}
                    </span>
                  )}
                </div>

                {/* Lifecycle Status Chip */}
                <div className="flex items-center gap-2">
                  <LifecycleStatusBadge status={lifecycleStatus} />
                </div>
              </div>

              {/* Placement & Format Selector Bar */}
              <div className="px-3.5 py-2 bg-slate-100/70 border-b border-border-light flex items-center justify-between gap-2 overflow-x-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                  Placement:
                </span>
                <div className="flex items-center gap-1.5">
                  {(['1:1', '4:5', '9:16', '1.91:1'] as const).map((ratio) => {
                    const isSelected = currentRatio === ratio;
                    const adapting = isAdapting[`${asset.creative_index}-${ratio}`];
                    const isAi = overlay.formatStatus?.[ratio]?.status === 'ai_generated' || ratio === '1:1';

                    return (
                      <button
                        key={ratio}
                        type="button"
                        disabled={adapting}
                        onClick={() => handleSelectRatio(asset.creative_index, ratio)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {adapting ? <Spinner className="w-2.5 h-2.5 inline mr-0.5" /> : null}
                        <span>
                          {ratio === '1:1' && '1:1 Feed'}
                          {ratio === '4:5' && '4:5 Mobile'}
                          {ratio === '9:16' && '9:16 Stories'}
                          {ratio === '1.91:1' && '1.91:1 Wide'}
                        </span>
                        {isAi && ratio !== '1:1' && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}
                            title="Native AI Resized"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Preview Container */}
              <div className="relative w-full bg-slate-950 flex items-center justify-center overflow-hidden p-2">
                <div className={`relative ${aspectClass} w-full max-w-full overflow-hidden rounded-xl bg-slate-900 shadow-inner flex items-center justify-center transition-all`}>
                  {isBusy || isAiResizing ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-white">
                      <Spinner className="w-8 h-8 text-primary mb-3" />
                      <p className="text-xs font-semibold">
                        {isAiResizing ? `Generating AI native ${currentRatio} format…` : `Updating creative #${asset.creative_index}…`}
                      </p>
                    </div>
                  ) : lifecycleStatus === 'Failed' ? (
                    /* User-Safe Structured Error Presentation */
                    <div className="p-6 text-center text-white max-w-sm space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                        <Icon name="alert-triangle" className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/40 uppercase">
                          {overlay.errorDetail?.code || 'Generation Issue'}
                        </span>
                        <p className="text-xs font-bold text-white pt-1">
                          {asset.error || overlay.errorDetail?.userMessage || 'Creative could not be generated.'}
                        </p>
                        {overlay.errorDetail?.suggestedAction && (
                          <p className="text-[11px] text-slate-300">
                            {overlay.errorDetail.suggestedAction}
                          </p>
                        )}
                      </div>
                      {!readOnly && (
                        <div className="pt-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleRegenerateOne(asset.creative_index)}
                            disabled={isBusy}
                            className="!text-xs !py-1.5 !px-3.5 mx-auto !bg-white hover:!bg-slate-100 !text-slate-900 font-bold"
                          >
                            <Icon name="refresh-cw" className="w-3.5 h-3.5 mr-1" />
                            Retry this creative
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : asset.image_url ? (
                    <>
                      {/* Generated Image Preview */}
                      <img
                        src={showOverlay && previewSrc ? previewSrc : asset.image_url}
                        alt={overlay.headline || `Creative ${asset.creative_index}`}
                        className="w-full h-full object-cover select-none"
                      />

                      {/* Fallback Overlay if composite SVG is not pre-rendered */}
                      {showOverlay && !previewSrc && (
                        <div className="absolute inset-0 p-5 flex flex-col justify-between pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40">
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
                            <div>
                              <span className="inline-block px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-lg uppercase tracking-wide">
                                {overlay.cta}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Format Resolution & AI Status Tag */}
                      <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
                        <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white/90 border border-white/10">
                          {currentRatio === '1:1' && '1080 × 1080 • Feed'}
                          {currentRatio === '4:5' && '1080 × 1350 • Mobile'}
                          {currentRatio === '9:16' && '1080 × 1920 • Stories'}
                          {currentRatio === '1.91:1' && '1200 × 628 • Wide'}
                        </span>
                      </div>

                      {/* Hover Tool Actions */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setExpandedAsset(asset)}
                          title="Fullscreen preview"
                          className="p-1.5 text-white hover:text-primary transition-colors cursor-pointer"
                        >
                          <Icon name="maximize" className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadImage(asset, currentRatio)}
                          title="Download format"
                          className="p-1.5 text-white hover:text-primary transition-colors cursor-pointer"
                        >
                          <Icon name="download" className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* AI Resizing Prompt Banner (If format is not yet AI expanded) */}
                      {currentRatio !== '1:1' && !isNativeAiFormat && !readOnly && (
                        <div className="absolute top-2.5 left-2.5">
                          <button
                            type="button"
                            disabled={isAiResizing}
                            onClick={() => handleAiGenerateFormat(asset.creative_index, currentRatio)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-lg backdrop-blur-xs transition-colors cursor-pointer"
                            title="Generate native AI background visual tailored specifically for this aspect ratio"
                          >
                            <Icon name="sparkles" className="w-3 h-3 text-indigo-200" />
                            <span>AI Resize Format</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-6 text-center text-slate-400">
                      <Spinner className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs">Generating visual…</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions & Quality Audit Bar */}
              <div className="px-4 py-3 bg-slate-50/90 border-t border-border-light flex flex-wrap items-center justify-between gap-2.5">
                {/* Approval Action Buttons */}
                {!readOnly && asset.status === 'ready' && (
                  <div className="flex items-center gap-2">
                    {isApproved ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprovalAction(asset.creative_index, 'reset')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        title="Click to revoke approval"
                      >
                        <Icon name="check-circle" className="w-3.5 h-3.5" />
                        <span>Approved</span>
                      </button>
                    ) : (
                      <div className="relative group">
                        <button
                          type="button"
                          disabled={isBusy || hasCriticalFailures}
                          onClick={() => handleApprovalAction(asset.creative_index, 'approve')}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all ${
                            hasCriticalFailures
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                              : 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
                          }`}
                        >
                          <Icon name="check" className="w-3.5 h-3.5" />
                          <span>Approve Creative</span>
                        </button>
                        {hasCriticalFailures && (
                          <div className="absolute left-0 bottom-full mb-1.5 w-60 p-2 rounded-lg bg-slate-900 text-white text-[10px] shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            Cannot approve: critical compliance failures must be resolved first.
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleApprovalAction(asset.creative_index, 'request_revision')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        lifecycleStatus === 'Needs Revision'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Request Revision</span>
                    </button>
                  </div>
                )}

                {/* Quality Score Trigger Button */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setDrawerCreativeIndex(asset.creative_index)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Icon name="shield-check" className="w-3.5 h-3.5 text-primary" />
                    <span>QA Audit ({overlay.evaluation?.totalScore != null ? `${overlay.evaluation.totalScore}/100` : 'Unverified'})</span>
                  </button>
                </div>
              </div>

              {/* Copy & Narrative Details */}
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
                </div>

                {/* Inline Surgical Redo Controls */}
                {!readOnly && (
                  <div className="pt-2 border-t border-border-light">
                    {targetedEditIndex === asset.creative_index ? (
                      <div className="space-y-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200 animate-fadeIn text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                            <Icon name="sparkles" className="w-3.5 h-3.5 text-purple-600" />
                            Targeted Layer Regeneration (V2)
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 bg-purple-200/80 text-purple-800 rounded font-black">
                            Surgical
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-slate-500 font-medium shrink-0 text-[11px]">Layer:</span>
                          <select
                            value={targetedComponent}
                            onChange={(e) => setTargetedComponent(e.target.value as any)}
                            className="bg-white border border-purple-200 rounded-md text-xs py-1 px-2 font-medium text-slate-700 focus:outline-none focus:border-purple-400"
                          >
                            <option value="background">Background Scene</option>
                            <option value="product">Product Hero Asset</option>
                            <option value="headline">Headline & Typography</option>
                            <option value="cta">Call-to-Action (CTA)</option>
                            <option value="layout">Composition & Layout</option>
                          </select>
                        </div>

                        <textarea
                          rows={2}
                          value={targetedInstructions}
                          onChange={(e) => setTargetedInstructions(e.target.value)}
                          placeholder="e.g. Move the product slightly to the right, make background warm marble..."
                          className="w-full text-xs p-2 bg-white rounded-lg border border-purple-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-400"
                        />

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={async () => {
                              if (!targetedInstructions.trim()) return;
                              await handleTargetedFix(asset.creative_index, targetedComponent, targetedInstructions.trim());
                              setTargetedEditIndex(null);
                              setTargetedInstructions('');
                            }}
                            disabled={isBusy || !targetedInstructions.trim()}
                            isLoading={isBusy}
                            className="!text-xs !py-1 !px-3 !bg-purple-600 hover:!bg-purple-700 !text-white"
                          >
                            Apply Layer Fix (V2)
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setTargetedEditIndex(null);
                              setTargetedInstructions('');
                            }}
                            className="!text-xs !py-1 !px-3"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : isRedoing ? (
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetedEditIndex(asset.creative_index);
                              setRedoIndex(null);
                              setTargetedInstructions('');
                            }}
                            disabled={isBusy}
                            className="inline-flex items-center text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Icon name="sparkles" className="w-3.5 h-3.5 mr-1 text-purple-600" />
                            Targeted Edit (V2)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRedoIndex(asset.creative_index);
                              setTargetedEditIndex(null);
                              setFeedback('');
                            }}
                            disabled={isBusy}
                            className="inline-flex items-center text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer px-2 py-1"
                          >
                            <Icon name="refresh-cw" className="w-3.5 h-3.5 mr-1" />
                            Regenerate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Compact Technical Metadata Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    {refCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <Icon name="camera" className="w-3 h-3 text-emerald-600" />
                        <span>{refCount} {refCount === 1 ? 'photo' : 'photos'}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">No photo attached</span>
                    )}
                    {overlay.document?.layers && (
                      <span>• {overlay.document.layers.length} layers</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {asset.status === 'failed' ? (
                      <span className="text-emerald-600 font-medium">Refunded (0 credits)</span>
                    ) : (
                      <span>{asset.credits_charged} credit{asset.credits_charged === 1 ? '' : 's'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quality Report Side Drawer */}
      <QualityReportDrawer
        isOpen={drawerCreativeIndex !== null}
        onClose={() => setDrawerCreativeIndex(null)}
        creativeIndex={drawerCreativeIndex ?? 1}
        creativeTitle={drawerOverlay.headline}
        evaluation={drawerOverlay.evaluation}
        onTargetedFix={(comp, fix) => {
          if (drawerCreativeIndex) {
            handleTargetedFix(drawerCreativeIndex, comp, fix);
          }
        }}
        isBusy={busyIndex === drawerCreativeIndex}
      />

      {/* Fullscreen High-Resolution Preview Modal */}
      {expandedAsset && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setExpandedAsset(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-sm font-bold">
                Fullscreen Preview: Creative #{expandedAsset.creative_index}
              </span>
              <button
                type="button"
                onClick={() => setExpandedAsset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-square w-full max-h-[70vh] bg-black flex items-center justify-center overflow-hidden">
              {expandedAsset.image_url && (
                <img
                  src={
                    showOverlay && (expandedAsset.overlay as CreativeOverlay)?.renderedCompositeUrl
                      ? (expandedAsset.overlay as CreativeOverlay).renderedCompositeUrl!
                      : expandedAsset.image_url
                  }
                  alt="Creative preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="text-xs text-slate-300">
                {(expandedAsset.overlay as CreativeOverlay)?.headline}
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

      {/* Multi-Placement Comparison Modal */}
      {comparisonModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setComparisonModalOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Icon name="columns" className="w-5 h-5 text-indigo-400" />
                  <span>Meta Placement Comparison (Creative #{comparisonCreativeIndex})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Side-by-side verification across Feed (1:1), Mobile (4:5), Stories (9:16), and Landscape (1.91:1).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComparisonModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {(['1:1', '4:5', '9:16', '1.91:1'] as const).map((ratio) => {
                const asset = latestByIndex.get(comparisonCreativeIndex);
                const overlay = (asset?.overlay || {}) as CreativeOverlay;
                const cacheKey = `${comparisonCreativeIndex}-${ratio}`;
                const src =
                  adaptedComposites[cacheKey] ||
                  overlay.adaptations?.[ratio]?.compositeUrl ||
                  (ratio === '1:1' ? overlay.renderedCompositeUrl || asset?.image_url : asset?.image_url);

                return (
                  <div key={ratio} className="space-y-2 text-center">
                    <span className="text-xs font-bold text-slate-300 block">
                      {ratio === '1:1' && '1:1 Feed'}
                      {ratio === '4:5' && '4:5 Mobile'}
                      {ratio === '9:16' && '9:16 Stories'}
                      {ratio === '1.91:1' && '1.91:1 Wide'}
                    </span>
                    <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-1">
                      {src ? (
                        <img src={src} alt={ratio} className="w-full object-contain max-h-72" />
                      ) : (
                        <div className="py-12 text-slate-500 text-xs">Not adapted</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button variant="secondary" onClick={() => setComparisonModalOpen(false)}>
                Close Comparison
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Meta Ad Package Copy Sheet Modal */}
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

            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
              {loadingMetaPackage ? (
                <div className="py-16 text-center text-slate-500">
                  <Spinner className="w-8 h-8 mx-auto mb-3 text-primary" />
                  <p className="text-sm font-semibold">Generating Meta copy variations & placement packages…</p>
                </div>
              ) : metaPackage ? (
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
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          CTA: {concept.copy.callToAction}
                        </span>
                      </div>

                      {/* Primary Text */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Primary Text (3 Variations)
                        </span>
                        <div className="space-y-2">
                          {concept.copy.primaryText.map((text, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs text-slate-700"
                            >
                              <span className="font-mono text-[10px] text-slate-400 shrink-0 mt-0.5">
                                {i === 0 ? 'Hook' : i === 1 ? 'Benefit' : 'Question'}:
                              </span>
                              <span className="flex-1 select-all">{text}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(text);
                                  if (notify) notify('Primary text copied', 'success');
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
                          Headlines
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">
                  <p>Could not load Meta copy package.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                All formats & copy sheets ready for Meta Ads Manager.
              </span>
              <Button variant="secondary" onClick={() => setMetaPackageModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LifecycleStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Icon name="check-circle" className="w-3 h-3 text-emerald-600" />
          <span>Approved</span>
        </span>
      );
    case 'Ready for Review':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Icon name="eye" className="w-3 h-3 text-blue-600" />
          <span>Ready for Review</span>
        </span>
      );
    case 'Needs Revision':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Icon name="alert-triangle" className="w-3 h-3 text-rose-600" />
          <span>Needs Revision</span>
        </span>
      );
    case 'QA Incomplete':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Icon name="alert-circle" className="w-3 h-3 text-amber-600" />
          <span>QA Incomplete</span>
        </span>
      );
    case 'Generating':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Spinner className="w-3 h-3 inline mr-0.5" />
          <span>Generating</span>
        </span>
      );
    case 'Failed':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
          <Icon name="alert-circle" className="w-3 h-3 text-red-600" />
          <span>Failed</span>
        </span>
      );
  }
};
