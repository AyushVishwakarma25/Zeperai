import { supabase } from '../../services/supabaseClient';

export const getAdminAuthHeader = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (err) {
    console.error('Failed to get Supabase session for admin request:', err);
    return null;
  }
};
