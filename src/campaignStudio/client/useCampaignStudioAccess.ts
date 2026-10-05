/**
 * Decides whether the Campaign Studio entry points (sidebar, dashboard card) are shown.
 * Campaign Studio is a standard global feature for all authenticated users.
 */

import { useEffect, useState } from 'react';
import type { CampaignMeta } from './api.js';
import { campaignApi, currentUserId } from './defaultApi.js';
import { supabase } from '../../../services/supabaseClient.js';

export const DEFAULT_CAMPAIGN_META: CampaignMeta = {
  goals: ['sales', 'awareness', 'engagement', 'leads', 'launch', 'retention', 'custom'],
  platforms: [
    'meta_ads',
    'instagram_organic',
    'google_display',
    'amazon',
    'flipkart',
    'blinkit',
    'zepto',
    'swiggy_instamart',
    'whatsapp',
    'other',
  ],
  aspectRatios: ['1:1', '9:16', '16:9', '4:5'],
  maxCreatives: 10,
  defaults: {
    creativeCount: 5,
    aspectRatio: '1:1',
    platforms: ['meta_ads'],
    quality: 'Standard',
  },
};

export type AccessState =
  | { status: 'loading'; enabled: false; meta: null }
  | { status: 'enabled'; enabled: true; meta: CampaignMeta }
  | { status: 'disabled'; enabled: false; meta: null };

export function useCampaignStudioAccess(): AccessState {
  const [state, setState] = useState<AccessState>({
    status: 'enabled',
    enabled: true,
    meta: DEFAULT_CAMPAIGN_META,
  });

  useEffect(() => {
    let alive = true;

    const syncMeta = async () => {
      try {
        const m = await campaignApi.getMeta();
        if (alive && m && m.goals) {
          setState({
            status: 'enabled',
            enabled: true,
            meta: {
              goals: m.goals,
              platforms: m.platforms,
              aspectRatios: m.aspectRatios,
              maxCreatives: m.maxCreatives,
              defaults: m.defaults,
            },
          });
        }
      } catch {
        // Fallback remains enabled with DEFAULT_CAMPAIGN_META
      }
    };

    syncMeta();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      syncMeta();
    });

    return () => {
      alive = false;
      subscription?.unsubscribe();
    };
  }, []);

  return state;
}
