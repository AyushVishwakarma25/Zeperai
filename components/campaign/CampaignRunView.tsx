import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CampaignAgent } from '../../src/campaignStudio/types.js';
import { CampaignApiError, type RunDetail } from '../../src/campaignStudio/client/api.js';
import { campaignApi } from '../../src/campaignStudio/client/defaultApi.js';
import { currentGateIndex, deriveGates, goalLabel, hasInFlight, hostnameOf, progressLabel } from '../../src/campaignStudio/client/viewModel.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';
import { Chip, Notice, SectionCard } from './shared.js';
import { StepReviewCard, type BusyKind } from './StepReviewCard.js';
import { Stepper } from './Stepper.js';

interface Props {
  runId: string;
  onBack: () => void;
  notify: (message: string, type?: 'success' | 'error') => void;
}

const messageOf = (e: unknown) => (e instanceof CampaignApiError ? e.message : 'Something went wrong. Please try again.');

export const CampaignRunView: React.FC<Props> = ({ runId, onBack, notify }) => {
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState<{ agent: CampaignAgent; kind: BusyKind } | null>(null);
  const [actionError, setActionError] = useState<{ agent: CampaignAgent; message: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(
    async (silent = false) => {
      try {
        const d = await campaignApi.getRun(runId);
        if (alive.current) {
          setDetail(d);
          setLoadError(null);
        }
      } catch (e) {
        if (alive.current && !silent) setLoadError(messageOf(e));
      }
    },
    [runId],
  );

  useEffect(() => {
    load();
  }, [load]);

  // If a step is generating on the server (page refreshed mid-run), poll until it settles.
  const inFlight = detail ? hasInFlight(detail.steps) : false;
  useEffect(() => {
    if (!inFlight || busy) return;
    const t = setTimeout(() => load(true), 3000);
    return () => clearTimeout(t);
  }, [inFlight, busy, detail, load]);

  const perform = async (agent: CampaignAgent, kind: Exclude<BusyKind, null>, fn: () => Promise<unknown>, success?: string): Promise<boolean> => {
    setBusy({ agent, kind });
    setActionError(null);
    try {
      await fn();
      await load(true);
      if (success) notify(success);
      return true;
    } catch (e) {
      setActionError({ agent, message: messageOf(e) });
      await load(true); // the server records failed attempts; show the true state
      return false;
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  if (loadError && !detail) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <Notice tone="error">{loadError}</Notice>
        <div className="flex justify-center gap-2">
          <Button onClick={() => load()} className="">Try again</Button>
          <Button variant="secondary" onClick={onBack} className="">Back</Button>
        </div>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const { run, steps } = detail;
  const gates = deriveGates(run, steps);
  const cur = currentGateIndex(run);
  const selIdx = selected !== null && gates[selected]?.status !== 'locked' ? selected : cur;
  const gate = gates[selIdx];
  const active = run.status === 'active';

  const doCancel = async () => {
    try {
      await campaignApi.cancelRun(run.id);
      notify('Campaign cancelled');
      onBack();
    } catch (e) {
      setConfirmCancel(false);
      notify(messageOf(e), 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-5">
      {/* Title row */}
      <div className="flex flex-wrap items-start gap-3">
        <button type="button" onClick={onBack} className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary">
          <Icon name="arrow-left" className="w-4 h-4 mr-1" />
          All campaigns
        </button>
        <div className="ml-auto flex items-center gap-2">
          {active &&
            (confirmCancel ? (
              <span className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Cancel this campaign?</span>
                <Button variant="dark" onClick={doCancel} className="!py-1 !px-3 !text-xs">Yes, cancel</Button>
                <Button variant="secondary" onClick={() => setConfirmCancel(false)} className="!py-1 !px-3 !text-xs">Keep it</Button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmCancel(true)} className="text-xs font-semibold text-slate-400 hover:text-rose-600">
                Cancel campaign
              </button>
            ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary">{run.title || 'Untitled campaign'}</h2>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Chip>{goalLabel(String(run.goal))}</Chip>
          {run.website_url && <Chip>{hostnameOf(run.website_url)}</Chip>}
          <Chip tone={run.status === 'active' ? 'default' : run.status === 'completed' ? 'good' : 'bad'}>{progressLabel(run)}</Chip>
        </div>
      </div>

      {run.status === 'cancelled' && <Notice tone="warning">This campaign was cancelled, so it is read-only.</Notice>}

      <Stepper gates={gates} selected={selIdx} onSelect={(i) => setSelected(i)} />

      <SectionCard className="!p-4 sm:!p-6">
        {gate.implemented ? (
          gate.agents.map((agent) => (
            <StepReviewCard
              key={agent.agent}
              gate={gate}
              agent={agent}
              readOnly={!active}
              busy={busy && busy.agent === agent.agent ? busy.kind : null}
              error={actionError && actionError.agent === agent.agent ? actionError.message : null}
              onDismissError={() => setActionError(null)}
              onRun={() => perform(agent.agent, 'run', () => campaignApi.runStep(run.id, agent.agent))}
              onRegenerate={(feedback) => perform(agent.agent, 'regenerate', () => campaignApi.regenerateStep(run.id, agent.agent, feedback))}
              onEdit={(output) => perform(agent.agent, 'edit', () => campaignApi.editStep(run.id, agent.agent, output), 'Saved as a new version')}
              onApprove={async () => {
                const ok = await perform(agent.agent, 'approve', () => campaignApi.approveStep(run.id, agent.agent), `${gate.label} approved`);
                if (ok) setSelected(null);
              }}
            />
          ))
        ) : (
          <div className="text-center py-10 px-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
              <Icon name="clock" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">{gate.label} is coming soon</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto mt-1">
              {gate.blurb} We’re building this stage now. Your approved brand profile is saved with this campaign and will be used automatically.
            </p>
            {gates[0].status === 'approved' && (
              <button type="button" onClick={() => setSelected(0)} className="mt-4 text-sm font-semibold text-primary hover:underline">
                View your approved brand profile
              </button>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
