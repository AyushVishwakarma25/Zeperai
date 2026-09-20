import React, { useCallback, useEffect, useState } from 'react';
import { CampaignApiError, type RunSummary } from '../../src/campaignStudio/client/api.js';
import { campaignApi } from '../../src/campaignStudio/client/defaultApi.js';
import { goalLabel, hostnameOf, progressLabel, timeAgo } from '../../src/campaignStudio/client/viewModel.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Spinner } from '../ui/Spinner.js';
import { Chip, Notice } from './shared.js';

interface Props {
  onOpen: (runId: string) => void;
  onNew: () => void;
  notify: (message: string, type?: 'success' | 'error') => void;
}

export const CampaignList: React.FC<Props> = ({ onOpen, onNew, notify }) => {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRuns(await campaignApi.listRuns());
    } catch (e) {
      setError(e instanceof CampaignApiError ? e.message : 'Could not load your campaigns.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id: string) => {
    try {
      await campaignApi.cancelRun(id);
      setConfirmId(null);
      notify('Campaign cancelled');
      load();
    } catch (e) {
      setConfirmId(null);
      notify(e instanceof CampaignApiError ? e.message : 'Could not cancel that campaign.', 'error');
    }
  };

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <Notice tone="error">{error}</Notice>
        <Button onClick={load} className="mx-auto">Try again</Button>
      </div>
    );
  }
  if (!runs) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <Icon name="strategy" className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Plan your first campaign</h2>
        <p className="text-sm text-text-secondary mt-1">
          Share your website or describe your brand. We’ll analyse it, research your market, build a strategy and create your ads, checking with you at every step.
        </p>
        <Button onClick={onNew} className="mt-5 mx-auto">
          <Icon name="plus" className="w-4 h-4 mr-1.5" />
          New campaign
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">Your campaigns</h2>
        <Button onClick={onNew} className="">
          <Icon name="plus" className="w-4 h-4 mr-1.5" />
          New campaign
        </Button>
      </div>
      <ul className="space-y-3">
        {runs.map((r) => (
          <li key={r.id} className="bg-white border border-border-light rounded-2xl p-4 flex items-center gap-3 hover:border-primary/50 transition-colors">
            <button type="button" onClick={() => onOpen(r.id)} className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-text-primary truncate">{r.title || 'Untitled campaign'}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <Chip>{goalLabel(String(r.goal))}</Chip>
                {r.website_url && <span className="text-xs text-text-secondary">{hostnameOf(r.website_url)}</span>}
                <span className="text-xs text-slate-400">· {progressLabel(r)} · {timeAgo(r.updated_at)}</span>
              </div>
            </button>
            {r.status === 'active' &&
              (confirmId === r.id ? (
                <span className="flex items-center gap-1.5 shrink-0">
                  <Button variant="dark" onClick={() => cancel(r.id)} className="!py-1 !px-2.5 !text-xs">Cancel it</Button>
                  <Button variant="secondary" onClick={() => setConfirmId(null)} className="!py-1 !px-2.5 !text-xs">Keep</Button>
                </span>
              ) : (
                <button type="button" aria-label={`Cancel ${r.title || 'campaign'}`} onClick={() => setConfirmId(r.id)} className="p-2 text-slate-300 hover:text-rose-600 shrink-0">
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              ))}
            <Icon name="arrow-right" className="w-4 h-4 text-slate-300 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
};
