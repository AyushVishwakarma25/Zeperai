import React, { useEffect, useState } from 'react';
import type { BrandContext, CampaignStep, CampaignStrategy, CompetitorResearch, MarketResearch } from '../../src/campaignStudio/types.js';
import { MAX_REGENERATIONS_PER_STEP } from '../../src/campaignStudio/types.js';
import { AGENT_BLURBS, AGENT_START_LABELS, EDITABLE_AGENTS, FEEDBACK_SUGGESTIONS, type AgentView, type GateView } from '../../src/campaignStudio/client/viewModel.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { BrandContextEditor } from './BrandContextEditor.js';
import { BrandContextView } from './BrandContextView.js';
import { CompetitorResearchView, MarketResearchView } from './ResearchViews.js';
import { Chip, GeneratingPanel, Notice, inputClass } from './shared.js';
import { StrategyView } from './StrategyView.js';

export type BusyKind = 'run' | 'regenerate' | 'edit' | 'approve' | null;

interface Props {
  gate: GateView;
  agent: AgentView;
  busy: BusyKind;
  /** Error from the last action on this step (server message). */
  error: string | null;
  /** Cancelled/completed campaigns are read-only. */
  readOnly?: boolean;
  /** Heading for this card. Defaults to the gate label (use the agent label inside multi-agent gates). */
  title?: string;
  /** False inside multi-agent gates, where one gate-level button approves everything together. */
  showApprove?: boolean;
  onRun: () => void;
  onRegenerate: (feedback: string) => void;
  onEdit: (output: unknown) => void;
  onApprove: () => void;
  onDismissError: () => void;
}

const GENERATING_HINTS: Record<string, string[]> = {
  brand_analysis: ['Reading your website…', 'Finding your products and brand colours…', 'Working out your audience and tone…', 'Writing your brand profile…'],
  market_research: ['Searching for category trends…', 'Looking at what buyers say and ask…', 'Checking seasonal and festive demand…', 'Writing up the market picture…'],
  competitor_research: ['Finding your closest competitors…', 'Reading how they position and price…', 'Looking at the ads and content they run…', 'Spotting the space you can own…'],
  strategy: ['Weighing the research against your goal…', 'Choosing one big idea…', 'Planning your content pillars…', 'Splitting your creatives across the pillars…'],
};

/** Renders a step's output. Only the brand analysis has a dedicated view so far. */
const OutputView: React.FC<{ agent: string; output: unknown }> = ({ agent, output }) => {
  if (agent === 'brand_analysis' && output) return <BrandContextView brand={output as BrandContext} />;
  if (agent === 'market_research' && output) return <MarketResearchView data={output as MarketResearch} />;
  if (agent === 'competitor_research' && output) return <CompetitorResearchView data={output as CompetitorResearch} />;
  if (agent === 'strategy' && output) return <StrategyView data={output as CampaignStrategy} />;
  return <pre className="text-xs bg-slate-50 rounded-xl p-3 overflow-auto max-h-96">{JSON.stringify(output, null, 2)}</pre>;
};

export const StepReviewCard: React.FC<Props> = ({ gate, agent, busy, error, readOnly, title: titleProp, showApprove = true, onRun, onRegenerate, onEdit, onApprove, onDismissError }) => {
  const [mode, setMode] = useState<'view' | 'regenerate' | 'edit'>('view');
  const [feedback, setFeedback] = useState('');
  const [viewVersion, setViewVersion] = useState<number | null>(null); // null = live version

  const title = titleProp ?? gate.label;
  const canEdit = EDITABLE_AGENTS.includes(agent.agent);
  const current = agent.current;
  const usable = agent.versions.filter((v) => v.output && v.status !== 'failed');
  const shown: CampaignStep | null = viewVersion !== null ? usable.find((v) => v.version === viewVersion) ?? current : current;
  const viewingOld = !!shown && !!current && shown.version !== current.version;
  const working = busy === 'run' || busy === 'regenerate' || !!agent.inFlight;

  // A new live version (after regenerate/edit) resets local UI state.
  useEffect(() => {
    setMode('view');
    setFeedback('');
    setViewVersion(null);
  }, [current?.id]);

  if (working) {
    return <GeneratingPanel title={busy === 'regenerate' || (agent.inFlight?.user_feedback ?? '') ? 'Applying your feedback…' : `Working on ${title.toLowerCase()}…`} hints={GENERATING_HINTS[agent.agent] ?? []} />;
  }

  // ---- Not generated yet (or first attempt failed) ----
  if (!current) {
    return (
      <div className="text-center py-10 px-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <Icon name="sparkles" className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto mt-1">{AGENT_BLURBS[agent.agent] ?? gate.blurb}</p>
        {(error || agent.failedAfterCurrent) && (
          <div className="max-w-md mx-auto mt-4 text-left">
            <Notice tone="error" onDismiss={error ? onDismissError : undefined}>
              {error || agent.failedAfterCurrent?.error || 'That did not work. Please try again.'}
            </Notice>
          </div>
        )}
        {!readOnly && (
          <Button onClick={onRun} className="mt-5 mx-auto">
            {agent.failedAfterCurrent || error ? 'Try again' : AGENT_START_LABELS[agent.agent] ?? 'Start'}
          </Button>
        )}
      </div>
    );
  }

  const isApproved = current.status === 'approved';
  const redosLeft = agent.redosLeft;

  const startRegenerate = () => {
    const text = feedback.trim();
    if (text.length >= 5) onRegenerate(text);
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-text-primary mr-1">{title}</h3>
        <Chip tone={isApproved ? 'good' : 'warn'}>{isApproved ? 'Approved' : 'Waiting for your review'}</Chip>
        {usable.length > 1 && (
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-500" aria-label="Versions">
            <button type="button" aria-label="Previous version" disabled={shown?.version === usable[0].version} onClick={() => setViewVersion(usable[Math.max(0, usable.findIndex((v) => v.version === shown?.version) - 1)].version)} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
              <Icon name="chevron-left" className="w-4 h-4" />
            </button>
            <span data-testid="version-label">
              Version {usable.findIndex((v) => v.version === shown?.version) + 1} of {usable.length}
            </span>
            <button type="button" aria-label="Next version" disabled={shown?.version === usable[usable.length - 1].version} onClick={() => { const i = usable.findIndex((v) => v.version === shown?.version); const next = usable[Math.min(usable.length - 1, i + 1)]; setViewVersion(next.version === current.version ? null : next.version); }} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
              <Icon name="arrow-right" className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {agent.failedAfterCurrent && !error && (
        <div className="mb-3">
          <Notice tone="warning">
            Your last change didn’t go through: {agent.failedAfterCurrent.error || 'please try again'}. Your previous version is still here.
          </Notice>
        </div>
      )}
      {error && (
        <div className="mb-3">
          <Notice tone="error" onDismiss={onDismissError}>
            {error}
          </Notice>
        </div>
      )}

      {viewingOld && (
        <div className="mb-3">
          <Notice tone="info">
            You’re looking at an earlier version (read-only).{' '}
            <button type="button" className="font-semibold underline" onClick={() => setViewVersion(null)}>
              Back to the latest version
            </button>
          </Notice>
        </div>
      )}

      {/* Body */}
      {mode === 'edit' && canEdit && current.output ? (
        <BrandContextEditor
          initial={current.output as BrandContext}
          saving={busy === 'edit'}
          onSave={(out) => onEdit(out)}
          onCancel={() => setMode('view')}
        />
      ) : (
        <>
          <OutputView agent={agent.agent} output={shown?.output} />

          {!readOnly && !viewingOld && (
            <div className="mt-5">
              {mode === 'regenerate' ? (
                <div className="rounded-2xl border border-border-light bg-white p-4" data-testid="regenerate-panel">
                  <label className="block">
                    <span className="block text-sm font-semibold text-text-primary mb-1">What should we change?</span>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={feedback}
                      autoFocus
                      maxLength={2000}
                      placeholder="e.g. Position us as a premium brand for busy professionals, and drop the discount language."
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(FEEDBACK_SUGGESTIONS[agent.agent] ?? []).map((s) => (
                      <button key={s} type="button" onClick={() => setFeedback((f) => (f.trim() ? `${f.trim()}. ${s}` : s))} className="text-xs px-2.5 py-1 rounded-full border border-border-light text-slate-600 hover:border-primary hover:text-primary">
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button onClick={startRegenerate} disabled={feedback.trim().length < 5 || redosLeft === 0} className="">
                      Regenerate
                    </Button>
                    <Button variant="secondary" onClick={() => setMode('view')} className="">
                      Cancel
                    </Button>
                    <span className="text-xs text-slate-400 ml-auto" data-testid="redos-left">
                      {redosLeft} of {MAX_REGENERATIONS_PER_STEP} regenerations left
                    </span>
                  </div>
                  {isApproved && <p className="text-xs text-amber-700 mt-2">This step is approved. The new version replaces it, and you’ll approve again before moving on.</p>}
                  {redosLeft === 0 && <p className="text-xs text-rose-600 mt-2">You’ve used every regeneration for this step. You can still edit it by hand.</p>}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {!isApproved && showApprove && (
                    <Button onClick={onApprove} isLoading={busy === 'approve'} className="">
                      <Icon name="check" className="w-4 h-4 mr-1.5" />
                      Approve and continue
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setMode('regenerate')} disabled={busy === 'approve'} className="">
                    <Icon name="refresh-cw" className="w-4 h-4 mr-1.5" />
                    {isApproved ? 'Redo this step' : 'Regenerate'}
                  </Button>
                  {!isApproved && canEdit && (
                    <Button variant="secondary" onClick={() => setMode('edit')} disabled={busy === 'approve'} className="">
                      <Icon name="edit" className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
