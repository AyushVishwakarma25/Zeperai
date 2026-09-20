/** The app's wired API client (uses the Supabase session for the bearer token). */

import { supabase } from '../../../services/supabaseClient.js';
import { createCampaignApi } from './api.js';

export const campaignApi = createCampaignApi({
  getToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
});

/** Stable id of the signed-in user, used to key per-user caches. */
export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
