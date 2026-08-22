import { supabase } from '../../services/supabaseClient.js';

const ADMIN_TOKEN_STORAGE_KEY = 'zeperai_admin_token';
const ADMIN_USER_STORAGE_KEY = 'zeperai_admin_user';

export const getAdminAuthToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || null;
};

export const setAdminAuthSession = (token: string, user: any, remember: boolean = true) => {
  if (remember) {
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(user));
  }
};

export const getStoredAdminUser = (): any | null => {
  const raw = localStorage.getItem(ADMIN_USER_STORAGE_KEY) || sessionStorage.getItem(ADMIN_USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearAdminAuthSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(ADMIN_USER_STORAGE_KEY);
};

export const getAdminAuthHeader = async (): Promise<string | null> => {
  // 1. Check dedicated admin session token first
  const dedicatedToken = getAdminAuthToken();
  if (dedicatedToken) {
    return dedicatedToken;
  }

  // 2. Fallback to Supabase access token
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (err) {
    console.error('Failed to get Supabase session for admin request:', err);
    return null;
  }
};

