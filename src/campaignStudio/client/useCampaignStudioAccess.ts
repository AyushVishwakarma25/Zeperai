/**
 * Decides whether the Campaign Studio entry points (sidebar, dashboard card) are shown.
 * The server is the source of truth: /meta answers 404 unless the feature is enabled for this user.
 * Definitive answers are cached per user for the page's lifetime; transient failures are not.
 */

import { useEffect, useState } from 'react';
import type { CampaignMeta } from './api.js';
import { campaignApi, currentUserId } from './defaultApi.js';

export type AccessState =
  | { status: 'loading'; enabled: false; meta: null }
  | { status: 'enabled'; enabled: true; meta: CampaignMeta }
  | { status: 'disabled'; enabled: false; meta: null };

const cache = new Map<string, Promise<AccessState>>();

async function resolveAccess(): Promise<AccessState> {
  const userId = await currentUserId();
  if (!userId) return { status: 'disabled', enabled: false, meta: null };

  const cached = cache.get(userId);
  if (cached) return cached;

  const pending = campaignApi
    .getMeta()
    .then((m): AccessState => ({ status: 'enabled', enabled: true, meta: { goals: m.goals, aspectRatios: m.aspectRatios, maxCreatives: m.maxCreatives, defaults: m.defaults } }))
    .catch((err: any): AccessState => {
      // 404 (feature off / not on the beta list) and 403 are definitive. Anything else may be transient: don't cache it.
      if (!(err && (err.status === 404 || err.status === 403))) cache.delete(userId);
      return { status: 'disabled', enabled: false, meta: null };
    });
  cache.set(userId, pending);
  return pending;
}

export function useCampaignStudioAccess(): AccessState {
  const [state, setState] = useState<AccessState>({ status: 'loading', enabled: false, meta: null });
  useEffect(() => {
    let alive = true;
    resolveAccess().then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
