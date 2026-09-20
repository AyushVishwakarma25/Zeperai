import React, { useState } from 'react';
import type { CampaignGoal, CampaignInputType } from '../../src/campaignStudio/types.js';
import { CampaignApiError, type CampaignMeta, type CreateRunPayload } from '../../src/campaignStudio/client/api.js';
import { campaignApi } from '../../src/campaignStudio/client/defaultApi.js';
import { GOAL_INFO } from '../../src/campaignStudio/client/viewModel.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Field, Notice, inputClass } from './shared.js';

interface Props {
  meta: CampaignMeta;
  onCreated: (runId: string) => void;
  onCancel: () => void;
}

/** Client-side checks mirror the server so the user gets instant feedback; the server remains the authority. */
export function validateNewCampaign(v: { inputType: CampaignInputType; url: string; details: string; goal: CampaignGoal | ''; goalNotes: string }): string | null {
  if (v.inputType === 'website' && !v.url.trim()) return 'Enter your website address.';
  if (v.inputType === 'details' && v.details.trim().length < 20) return 'Describe your brand in a couple of sentences (at least 20 characters).';
  if (!v.goal) return 'Choose what this campaign should achieve.';
  if (v.goal === 'custom' && v.goalNotes.trim().length < 5) return 'Tell us about your goal.';
  return null;
}

export const NewCampaignForm: React.FC<Props> = ({ meta, onCreated, onCancel }) => {
  const [inputType, setInputType] = useState<CampaignInputType>('website');
  const [url, setUrl] = useState('');
  const [details, setDetails] = useState('');
  const [goal, setGoal] = useState<CampaignGoal | ''>('');
  const [goalNotes, setGoalNotes] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [creativeCount, setCreativeCount] = useState(meta.defaults.creativeCount);
  const [aspectRatio, setAspectRatio] = useState(meta.defaults.aspectRatio);
  const [quality, setQuality] = useState<'Standard' | 'Pro'>(meta.defaults.quality === 'Pro' ? 'Pro' : 'Standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateNewCampaign({ inputType, url, details, goal, goalNotes });
    if (problem) return setError(problem);

    const payload: CreateRunPayload = {
      inputType,
      goal: goal as CampaignGoal,
      goalNotes: goalNotes.trim() || undefined,
      brandDetails: details.trim() || undefined,
      websiteUrl: inputType === 'website' ? url.trim() : undefined,
      settings: { creativeCount, aspectRatio, quality },
    };
    setSubmitting(true);
    setError(null);
    try {
      const run = await campaignApi.createRun(payload);
      onCreated(run.id);
    } catch (err) {
      setError(err instanceof CampaignApiError ? err.message : 'Could not start your campaign. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto w-full space-y-6" noValidate>
      <div>
        <h2 className="text-xl font-bold text-text-primary">New campaign</h2>
        <p className="text-sm text-text-secondary mt-1">Tell us about the brand and what you want to achieve. You’ll review and approve every step.</p>
      </div>

      {error && <Notice tone="error" onDismiss={() => setError(null)}>{error}</Notice>}

      {/* Source */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-text-primary mb-2">Where should we learn about your brand?</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Brand source">
          {([['website', 'From my website', 'globe'], ['details', 'I’ll describe it', 'edit']] as const).map(([value, label, icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={inputType === value}
              onClick={() => setInputType(value)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${inputType === value ? 'border-primary bg-primary/5 text-primary' : 'border-border-light bg-white text-slate-600 hover:border-primary/50'}`}
            >
              <Icon name={icon} className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {inputType === 'website' ? (
          <>
            <Field label="Website address" hint="For example prustlr.com. We read your public pages only.">
              <input className={inputClass} inputMode="url" autoComplete="url" placeholder="yourbrand.com" value={url} onChange={(e) => setUrl(e.target.value)} />
            </Field>
            <Field label="Anything else we should know? (optional)" hint="Products to focus on, audience, tone, things to avoid.">
              <textarea className={inputClass} rows={3} maxLength={8000} value={details} onChange={(e) => setDetails(e.target.value)} />
            </Field>
          </>
        ) : (
          <Field label="Describe your brand" hint="What you sell, who it is for, what makes it different, and how you want to sound.">
            <textarea className={inputClass} rows={6} maxLength={8000} placeholder="We make handmade soy candles for gifting across India…" value={details} onChange={(e) => setDetails(e.target.value)} />
          </Field>
        )}
      </fieldset>

      {/* Goal */}
      <fieldset>
        <legend className="text-sm font-semibold text-text-primary mb-2">What should this campaign achieve?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Campaign goal">
          {meta.goals.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={goal === g}
              onClick={() => setGoal(g)}
              className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${goal === g ? 'border-primary bg-primary/5' : 'border-border-light bg-white hover:border-primary/50'}`}
            >
              <span className={`block text-sm font-semibold ${goal === g ? 'text-primary' : 'text-text-primary'}`}>{GOAL_INFO[g].label}</span>
              <span className="block text-xs text-text-secondary">{GOAL_INFO[g].hint}</span>
            </button>
          ))}
        </div>
        <Field label={goal === 'custom' ? 'Describe your goal' : 'Anything specific about the goal? (optional)'} className="mt-3" hint="E.g. “Push our Diwali gift boxes, target corporate buyers”.">
          <textarea className={inputClass} rows={2} maxLength={2000} value={goalNotes} onChange={(e) => setGoalNotes(e.target.value)} />
        </Field>
      </fieldset>

      {/* Advanced */}
      <div>
        <button type="button" aria-expanded={showAdvanced} onClick={() => setShowAdvanced((s) => !s)} className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-primary">
          <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} className="w-4 h-4 mr-1" />
          Creative settings
        </button>
        {showAdvanced && (
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <Field label="Number of creatives">
              <select className={inputClass} value={creativeCount} onChange={(e) => setCreativeCount(Number(e.target.value))}>
                {Array.from({ length: meta.maxCreatives }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Shape">
              <select className={inputClass} value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                {meta.aspectRatios.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Image quality" hint="Used when creatives are generated.">
              <select className={inputClass} value={quality} onChange={(e) => setQuality(e.target.value as 'Standard' | 'Pro')}>
                <option value="Standard">Standard</option>
                <option value="Pro">Pro</option>
              </select>
            </Field>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" isLoading={submitting} className="">Start campaign</Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting} className="">Cancel</Button>
      </div>
    </form>
  );
};
