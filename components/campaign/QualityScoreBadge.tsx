import React, { useState } from 'react';
import type { CreativeEvaluation, QualityIssue } from '../../src/campaignStudio/types.js';
import { Icon } from '../ui/Icon.js';

interface Props {
  evaluation?: CreativeEvaluation;
  onTargetedFix?: (component: string, suggestedFix: string) => Promise<void> | void;
  onOpenReport?: () => void;
  isBusy?: boolean;
}

export const QualityScoreBadge: React.FC<Props> = ({ evaluation, onTargetedFix, onOpenReport, isBusy = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!evaluation) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
        <Icon name="sparkles" className="w-3 h-3 text-slate-400" />
        <span>Unrated</span>
      </span>
    );
  }

  const { totalScore, status, scores, issues = [], hardRuleFailures = [] } = evaluation;

  let toneClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';
  let label = 'Passed QA';

  if (status === 'pending') {
    toneClasses = 'bg-slate-50 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-400 animate-pulse';
    label = 'Evaluating...';
  } else if (status === 'unverified') {
    toneClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
    label = 'Unverified';
  } else if (status === 'partially_evaluated') {
    toneClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
    label = 'Partial QA';
  } else if (status === 'rejected' || status === 'failed' || hardRuleFailures.length > 0) {
    toneClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    label = 'Failed QA';
  } else if (status === 'needs_improvement') {
    toneClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    label = 'Needs Polish';
  } else if (status === 'ready_for_review') {
    label = 'Ready for Review';
  }

  const handleClick = () => {
    if (onOpenReport) {
      onOpenReport();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors hover:shadow-xs cursor-pointer ${toneClasses}`}
        title="Click to view quality score breakdown & diagnostic audit"
      >
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span>{totalScore != null ? `${totalScore}/100` : 'Unverified'}</span>
        <span className="font-medium text-[10px] opacity-85">({label})</span>
        {!onOpenReport && (
          <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} className="w-3 h-3 opacity-60 ml-0.5" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-84 sm:w-96 rounded-xl border border-border-light bg-white p-4 shadow-xl z-50 text-xs text-text-primary">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div>
                <h5 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Icon name="shield-check" className="w-4 h-4 text-primary" />
                  Quality Evaluation Report
                </h5>
                <p className="text-[11px] text-slate-500">Autonomous QA score across 7 commercial dimensions</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${toneClasses}`}>
                {totalScore != null ? `${totalScore} / 100` : 'Unverified'}
              </span>
            </div>

            {/* Hard rule failures notice */}
            {hardRuleFailures.length > 0 && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Icon name="alert-triangle" className="w-3.5 h-3.5 text-rose-600" />
                  Hard Compliance Failures ({hardRuleFailures.length})
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                  {hardRuleFailures.map((failure, idx) => (
                    <li key={idx}>{failure}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 7-Dimension Score Meters */}
            <div className="mt-3 space-y-2">
              <h6 className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Score Breakdown</h6>
              
              <ScoreRow label="Visual Hierarchy & Composition" score={scores.visualHierarchy} max={20} />
              <ScoreRow label="Product Packaging & Fidelity" score={scores.productAccuracy} max={20} />
              <ScoreRow label="Brand Consistency & Palette" score={scores.brandConsistency} max={15} />
              <ScoreRow label="Typography Readability & Contrast" score={scores.typography} max={15} />
              <ScoreRow label="Visual Texture & Lighting Polish" score={scores.visualQuality} max={15} />
              <ScoreRow label="Advertising Hook & Message Clarity" score={scores.messageClarity} max={10} />
              <ScoreRow label="Technical Compliance & Margins" score={scores.technicalCompliance} max={5} />
            </div>

            {/* Diagnostic Issues List */}
            {issues.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border-light">
                <h6 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-2">
                  Diagnostic Issues ({issues.length})
                </h6>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {issues.map((issue, idx) => (
                    <IssueItem
                      key={idx}
                      issue={issue}
                      onFix={onTargetedFix}
                      isBusy={isBusy}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ScoreRow: React.FC<{ label: string; score: number; max: number }> = ({ label, score, max }) => {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div>
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-slate-600 truncate max-w-[200px]">{label}</span>
        <span className="font-bold font-mono text-slate-800">
          {score} / {max}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const IssueItem: React.FC<{
  issue: QualityIssue;
  onFix?: (component: string, suggestedFix: string) => Promise<void> | void;
  isBusy: boolean;
}> = ({ issue, onFix, isBusy }) => {
  const severityBadge =
    issue.severity === 'critical'
      ? 'bg-rose-100 text-rose-800'
      : issue.severity === 'high'
      ? 'bg-orange-100 text-orange-800'
      : issue.severity === 'medium'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-slate-100 text-slate-700';

  const componentFromCategory = (cat: string): string => {
    if (cat.includes('product')) return 'product';
    if (cat.includes('typography')) return 'headline';
    if (cat.includes('message')) return 'cta';
    if (cat.includes('visual')) return 'background';
    return 'headline';
  };

  return (
    <div className="p-2 rounded-lg bg-slate-50 border border-slate-150 text-[11px] space-y-1">
      <div className="flex items-center justify-between gap-1.5">
        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${severityBadge}`}>
          {issue.severity}
        </span>
        {issue.affectedLayerId && (
          <span className="text-[10px] text-slate-400 font-mono">#{issue.affectedLayerId}</span>
        )}
      </div>
      <p className="text-slate-800 leading-snug">{issue.description}</p>
      {issue.suggestedFix && (
        <div className="pt-1 flex items-center justify-between gap-2 text-slate-500 text-[10px]">
          <span className="truncate">Fix: {issue.suggestedFix}</span>
          {onFix && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onFix(componentFromCategory(issue.category), issue.suggestedFix)}
              className="shrink-0 text-primary font-bold hover:underline disabled:opacity-50"
            >
              Apply Fix
            </button>
          )}
        </div>
      )}
    </div>
  );
};

