import React from 'react';
import type { CreativeEvaluation, QualityIssue } from '../../src/campaignStudio/types.js';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  creativeIndex: number;
  creativeTitle?: string;
  evaluation?: CreativeEvaluation;
  onTargetedFix?: (component: string, suggestedFix: string) => Promise<void> | void;
  isBusy?: boolean;
}

export const QualityReportDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  creativeIndex,
  creativeTitle,
  evaluation,
  onTargetedFix,
  isBusy = false,
}) => {
  if (!isOpen) return null;

  const totalScore = evaluation?.totalScore;
  const status = evaluation?.status ?? 'unverified';
  const scores = evaluation?.scores ?? null;
  const issues = evaluation?.issues ?? [];
  const hardRuleFailures = evaluation?.hardRuleFailures ?? [];
  const isVisualVerified = Boolean(evaluation?.visual?.checksRun && evaluation.visual.status === 'passed');
  const isPartial = status === 'partially_evaluated' || !isVisualVerified;
  const isCriticalFailed = hardRuleFailures.length > 0 || status === 'failed' || status === 'rejected';

  let statusBadgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let statusLabel = 'Passed Full QA';
  if (isCriticalFailed) {
    statusBadgeClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    statusLabel = 'Critical QA Failure';
  } else if (status === 'unverified') {
    statusBadgeClasses = 'bg-slate-100 text-slate-700 border-slate-300';
    statusLabel = 'Unverified (Visual QA Incomplete)';
  } else if (isPartial) {
    statusBadgeClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    statusLabel = 'QA Incomplete (Deterministic Only)';
  } else if (status === 'needs_improvement') {
    statusBadgeClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    statusLabel = 'Needs Improvement';
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative z-10 w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 border-l border-border-light">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary-light flex items-center justify-center">
              <Icon name="shield-check" className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                Quality Audit: Creative #{creativeIndex}
              </h3>
              {creativeTitle && (
                <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                  {creativeTitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Overall Score Banner */}
          <div className="rounded-xl p-4 border border-border-light bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Composite Quality Score
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {totalScore != null ? totalScore : 'Unverified'}
                </span>
                {totalScore != null && <span className="text-slate-400 font-semibold text-sm">/ 100</span>}
              </div>
              <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClasses}`}>
                {statusLabel}
              </span>
            </div>

            {/* Completeness Ring/Box */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Audit Scope
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                <Icon name={isVisualVerified ? 'check-circle' : 'alert-circle'} className={`w-3.5 h-3.5 ${isVisualVerified ? 'text-emerald-500' : 'text-amber-500'}`} />
                {isVisualVerified ? 'Full Multimodal 7-D' : 'Deterministic Only'}
              </span>
            </div>
          </div>

          {/* Hard Rule Failures Alert */}
          {hardRuleFailures.length > 0 && (
            <div className="rounded-xl p-4 bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
                <Icon name="alert-triangle" className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Critical Compliance Failures ({hardRuleFailures.length})</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Approval and export are blocked until all hard constraints are resolved:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800 font-medium pl-1">
                {hardRuleFailures.map((failure, idx) => (
                  <li key={idx}>{failure}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Completeness Clarification Note */}
          {isPartial && !isCriticalFailed && (
            <div className="rounded-xl p-3.5 bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <Icon name="info" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <p className="font-semibold text-amber-800">
                  Visual Evaluation Incomplete Notice
                </p>
                <p className="text-amber-700">
                  {status === 'unverified'
                    ? 'Visual AI evaluation has not yet run or encountered a timeout. Scores are not estimated or fabricated. Please run visual QA or inspect manually.'
                    : 'This creative reflects verified structural checks (bounding containment, aspect ratio, copy presence, and layer alignment). Visual aesthetics and lighting subtlety remain unverified.'}
                </p>
              </div>
            </div>
          )}

          {/* 7-Dimension Commercial Score Meters */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Dimension Breakdown
              </h4>
              <span className="text-[10px] text-slate-400">Target: ≥ 70 / 100</span>
            </div>

            <div className="space-y-2.5 bg-white p-3.5 rounded-xl border border-slate-200">
              <DimensionMeter label="Visual Hierarchy & Composition" score={scores?.visualHierarchy} max={20} verified={isVisualVerified} />
              <DimensionMeter label="Product Packaging & Fidelity" score={scores?.productAccuracy} max={20} verified={isVisualVerified} />
              <DimensionMeter label="Brand Consistency & Palette" score={scores?.brandConsistency} max={15} verified={isVisualVerified} />
              <DimensionMeter label="Typography Readability & Contrast" score={scores?.typography} max={15} verified={isVisualVerified} />
              <DimensionMeter label="Visual Texture & Lighting Polish" score={scores?.visualQuality} max={15} verified={isVisualVerified} />
              <DimensionMeter label="Advertising Hook & Message Clarity" score={scores?.messageClarity} max={10} verified={isVisualVerified} />
              <DimensionMeter label="Technical Compliance & Margins" score={scores?.technicalCompliance} max={5} verified={isVisualVerified} />
            </div>
          </div>

          {/* Verification Scope Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                <Icon name="check-circle" className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Dimensions</span>
              </div>
              <ul className="text-[10px] text-slate-600 space-y-0.5 pl-4 list-disc">
                <li>Canvas aspect ratio</li>
                <li>Layer boundary containment</li>
                <li>Product asset placement</li>
                <li>Headline & CTA presence</li>
                <li>Safe zone margin compliance</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                <Icon name="clock" className="w-3.5 h-3.5 text-amber-600" />
                <span>Unverified / Provisional</span>
              </div>
              <ul className="text-[10px] text-slate-600 space-y-0.5 pl-4 list-disc">
                <li>Lighting realism & shadow subtlety</li>
                <li>Emotional resonance of mood</li>
                <li>Micro-contrast in packaging</li>
              </ul>
            </div>
          </div>

          {/* Diagnostic Issues & Suggested Fixes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Diagnostic Issues ({issues.length})
              </h4>
            </div>

            {issues.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center text-emerald-800 text-xs">
                <Icon name="check-circle" className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="font-bold">No structural issues detected</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Creative satisfies commercial guidelines and layout constraints.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border-light bg-white shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 text-xs">
                        {issue.category}
                      </span>
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {issue.description}
                    </p>
                    {issue.suggestedFix && (
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 italic truncate max-w-[260px]">
                          Fix: {issue.suggestedFix}
                        </span>
                        {onTargetedFix && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onTargetedFix(issue.category.toLowerCase(), issue.suggestedFix)}
                            className="shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                          >
                            {isBusy ? <Spinner className="w-2.5 h-2.5" /> : 'Apply Fix'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-border-light flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400">
            ZeperAI Autonomous QA v2.2
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

const DimensionMeter: React.FC<{
  label: string;
  score?: number | null;
  max: number;
  verified: boolean;
}> = ({ label, score, max, verified }) => {
  const isScored = typeof score === 'number' && !isNaN(score);
  const pct = isScored ? Math.min(100, Math.round((score / max) * 100)) : 0;
  const barColor = !isScored
    ? 'bg-slate-200'
    : pct >= 80
      ? 'bg-emerald-500'
      : pct >= 60
        ? 'bg-amber-500'
        : 'bg-rose-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-slate-700">{label}</span>
          {!verified && (
            <span className="text-[9px] px-1 rounded bg-slate-100 text-slate-400 font-mono">
              unverified
            </span>
          )}
        </div>
        <span className="font-bold text-slate-800">
          {isScored ? score : '—'} <span className="text-slate-400 font-normal">/ {max}</span>
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: isScored ? `${pct}%` : '0%' }}
        />
      </div>
    </div>
  );
};

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const s = severity.toLowerCase();
  if (s === 'critical') {
    return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">CRITICAL</span>;
  }
  if (s === 'high') {
    return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">HIGH</span>;
  }
  if (s === 'medium') {
    return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">MEDIUM</span>;
  }
  return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">LOW</span>;
};
