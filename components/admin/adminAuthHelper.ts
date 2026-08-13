import { supabase } from '../../services/supabaseClient';

export const getAdminAuthHeader = async (): Promise<string | null> => {
  // Check direct Admin Portal token first
  const portalToken = localStorage.getItem('zeperai_admin_token');
  if (portalToken) {
    return portalToken;
  }

  // Fallback to active Supabase session
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (err) {
    return null;
  }
};

export const clearAdminSession = () => {
  localStorage.removeItem('zeperai_admin_token');
};
