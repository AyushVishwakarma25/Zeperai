import React, { useMemo, useState } from 'react';
import type { BrandContext } from '../../src/campaignStudio/types.js';
import {
  LIMITS,
  brandContextToDraft,
  draftToBrandContext,
  draftsDiffer,
  normalizeHex,
  validateDraft,
  type BrandDraft,
} from '../../src/campaignStudio/client/brandDraft.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { Field, Notice, SectionCard, inputClass } from './shared.js';

interface Props {
  initial: BrandContext;
  saving: boolean;
  /** Server-side rejection message, if any. */
  error?: string | null;
  onSave: (output: BrandContext) => void;
  onCancel: () => void;
}

export const BrandContextEditor: React.FC<Props> = ({ initial, saving, error, onSave, onCancel }) => {
  const original = useMemo(() => brandContextToDraft(initial), [initial]);
  const [draft, setDraft] = useState<BrandDraft>(original);
  const [showErrors, setShowErrors] = useState(false);

  const { ok, errors } = validateDraft(draft);
  const changed = draftsDiffer(draft, original);
  const err = (key: string) => (showErrors ? errors[key] : undefined);

  const set = <K extends keyof BrandDraft>(key: K, value: BrandDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = () => {
    if (!ok) {
      setShowErrors(true);
      return;
    }
    onSave(draftToBrandContext(draft));
  };

  return (
    <div className="space-y-4" data-testid="brand-editor">
      {error && <Notice tone="error">{error}</Notice>}

      <SectionCard title="Brand" icon="info">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Brand name" error={err('brandName')}>
            <input className={inputClass} value={draft.brandName} maxLength={LIMITS.brandName + 20} onChange={(e) => set('brandName', e.target.value)} />
          </Field>
          <Field label="Category" error={err('category')}>
            <input className={inputClass} value={draft.category} onChange={(e) => set('category', e.target.value)} />
          </Field>
        </div>
        <Field label="Summary" className="mt-3" error={err('summary')}>
          <textarea className={inputClass} rows={3} value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
        </Field>
        <Field label="Positioning" className="mt-3" error={err('positioning')} hint="One or two sentences: who it is for and why it is different.">
          <textarea className={inputClass} rows={2} value={draft.positioning} onChange={(e) => set('positioning', e.target.value)} />
        </Field>
        <Field label="Key selling points" className="mt-3" error={err('usps')} hint="One per line, up to 8.">
          <textarea className={inputClass} rows={4} value={draft.usps} onChange={(e) => set('usps', e.target.value)} />
        </Field>
      </SectionCard>

      <SectionCard title="Audience" icon="users">
        <Field label="Primary audience" error={err('audiencePrimary')}>
          <input className={inputClass} value={draft.audiencePrimary} onChange={(e) => set('audiencePrimary', e.target.value)} />
        </Field>
        <Field label="Secondary audience (optional)" className="mt-3" error={err('audienceSecondary')}>
          <input className={inputClass} value={draft.audienceSecondary} onChange={(e) => set('audienceSecondary', e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="Pain points" error={err('painPoints')} hint="One per line, up to 6.">
            <textarea className={inputClass} rows={4} value={draft.painPoints} onChange={(e) => set('painPoints', e.target.value)} />
          </Field>
          <Field label="Desires" error={err('desires')} hint="One per line, up to 6.">
            <textarea className={inputClass} rows={4} value={draft.desires} onChange={(e) => set('desires', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Voice" icon="quote">
        <Field label="Tone" error={err('tone')} hint="Separate with commas, e.g. friendly, direct.">
          <input className={inputClass} value={draft.tone} onChange={(e) => set('tone', e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="Do say" error={err('doSay')} hint="One per line.">
            <textarea className={inputClass} rows={3} value={draft.doSay} onChange={(e) => set('doSay', e.target.value)} />
          </Field>
          <Field label="Don’t say" error={err('dontSay')} hint="One per line.">
            <textarea className={inputClass} rows={3} value={draft.dontSay} onChange={(e) => set('dontSay', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Look and feel" icon="palette">
        <p className="text-xs font-semibold text-slate-700 mb-2">Brand colours</p>
        <div className="space-y-2">
          {draft.colors.map((c, i) => (
            <div key={i}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`Pick colour ${i + 1}`}
                  value={/^#[0-9a-f]{6}$/i.test(normalizeHex(c.hex)) ? normalizeHex(c.hex).toLowerCase() : '#000000'}
                  onChange={(e) => set('colors', draft.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value.toUpperCase() } : x)))}
                  className="w-10 h-10 rounded-lg border border-border-light bg-white p-0.5 shrink-0"
                />
                <input
                  aria-label={`Colour ${i + 1} hex`}
                  className={`${inputClass} !w-32 font-mono`}
                  value={c.hex}
                  onChange={(e) => set('colors', draft.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))}
                />
                <input
                  aria-label={`Colour ${i + 1} name`}
                  placeholder="Name (optional)"
                  className={inputClass}
                  value={c.name}
                  onChange={(e) => set('colors', draft.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                />
                <button type="button" aria-label={`Remove colour ${i + 1}`} onClick={() => set('colors', draft.colors.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-rose-600">
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </div>
              {err(`colors.${i}`) && (
                <p role="alert" className="text-[11px] text-red-600 mt-1">
                  {err(`colors.${i}`)}
                </p>
              )}
            </div>
          ))}
        </div>
        {draft.colors.length < LIMITS.colors.items && (
          <button type="button" onClick={() => set('colors', [...draft.colors, { name: '', hex: '#6A5AE0' }])} className="mt-2 inline-flex items-center text-xs font-semibold text-primary hover:underline">
            <Icon name="plus" className="w-3.5 h-3.5 mr-1" />
            Add colour
          </button>
        )}
        {err('colors') && <p role="alert" className="text-[11px] text-red-600 mt-1">{err('colors')}</p>}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <Field label="Typography" error={err('typography')}>
            <input className={inputClass} value={draft.typography} onChange={(e) => set('typography', e.target.value)} />
          </Field>
          <Field label="Style keywords" error={err('styleKeywords')} hint="Separate with commas.">
            <input className={inputClass} value={draft.styleKeywords} onChange={(e) => set('styleKeywords', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Products and markets" icon="shopping-bag">
        <div className="space-y-3">
          {draft.products.map((p, i) => (
            <div key={i} className="rounded-xl border border-border-light p-3">
              <div className="grid sm:grid-cols-3 gap-2">
                <Field label="Product name" className="sm:col-span-2">
                  <input className={inputClass} value={p.name} onChange={(e) => set('products', draft.products.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                </Field>
                <Field label="Price note">
                  <input className={inputClass} value={p.priceHint} onChange={(e) => set('products', draft.products.map((x, j) => (j === i ? { ...x, priceHint: e.target.value } : x)))} />
                </Field>
              </div>
              <Field label="Description" className="mt-2">
                <textarea className={inputClass} rows={2} value={p.description} onChange={(e) => set('products', draft.products.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
              </Field>
              <div className="flex items-center justify-between mt-1">
                {err(`products.${i}`) ? <p role="alert" className="text-[11px] text-red-600">{err(`products.${i}`)}</p> : <span />}
                <button type="button" onClick={() => set('products', draft.products.filter((_, j) => j !== i))} className="text-xs font-semibold text-slate-400 hover:text-rose-600 inline-flex items-center">
                  <Icon name="trash" className="w-3.5 h-3.5 mr-1" />
                  Remove product
                </button>
              </div>
            </div>
          ))}
        </div>
        {draft.products.length < LIMITS.products.items && (
          <button type="button" onClick={() => set('products', [...draft.products, { name: '', description: '', priceHint: '', imageUrls: [] }])} className="mt-2 inline-flex items-center text-xs font-semibold text-primary hover:underline">
            <Icon name="plus" className="w-3.5 h-3.5 mr-1" />
            Add product
          </button>
        )}
        <Field label="Markets" className="mt-4" error={err('markets')} hint="Countries or regions you sell to, separated by commas.">
          <input className={inputClass} value={draft.markets} onChange={(e) => set('markets', e.target.value)} />
        </Field>
      </SectionCard>

      <SectionCard title="Open questions" icon="info">
        <Field label="Things still to confirm" error={err('gaps')} hint="One per line. Delete a line once you have dealt with it.">
          <textarea className={inputClass} rows={3} value={draft.gaps} onChange={(e) => set('gaps', e.target.value)} />
        </Field>
      </SectionCard>

      <div className="sticky bottom-0 -mx-1 px-1 py-3 bg-gradient-to-t from-main via-main to-transparent flex flex-wrap items-center gap-2">
        <Button onClick={submit} isLoading={saving} disabled={!changed} className="">
          Save as new version
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving} className="">
          Cancel
        </Button>
        {showErrors && !ok && <span role="alert" className="text-xs text-red-600">Please fix the highlighted fields.</span>}
        {!changed && <span className="text-xs text-slate-400">No changes yet.</span>}
      </div>
    </div>
  );
};
