
import { supabase } from './supabaseClient';
import { UserProfileData, userService } from './userService';

/**
 * Enhanced profile mapper with internal timeout.
 * If the database query for the user profile takes too long, we fall back to
 * default metadata to keep the app responsive.
 */
const mapUserToProfile = async (user: any): Promise<UserProfileData> => {
    // Attempt to fetch full profile from DB with a 2-second timeout
    const fetchProfilePromise = userService.getUserProfile(user.id);
    
    const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 2000)
    );

    let profile = await Promise.race([fetchProfilePromise, timeoutPromise]);

    // Fallback based on auth metadata if profile row not found/ready or timed out
    if (!profile) {
        profile = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: 'Creator',
            bio: '',
            location: '',
            avatarUrl: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
            tier: 'Free'
        };
    }

    // Special access for development/admin
    if (profile.email === 'reachtoayush25@gmail.com' || profile.email === 'sharma25ayush@gmail.com' || profile.id === 'f58676e8-e373-4c97-803b-57451272154c') {
        profile.tier = 'Pro';
    }

    return profile;
};

export interface AuthSession {
  user: UserProfileData;
  token: string;
  expiresAt: number;
}

export const authService = {
  /**
   * Check if there is an active session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) return null;

        const userProfile = await mapUserToProfile(session.user);
        
        return {
            user: userProfile,
            token: session.access_token,
            expiresAt: (session.expires_at || 0) * 1000
        };
    } catch (e: any) {
        if (e && e.message && e.message.includes('Refresh Token Not Found')) {
            await supabase.auth.signOut().catch(() => {});
        } else {
            console.warn("Auth getSession error:", e);
        }
        return null;
    }
  },

  /**
   * Sign In with Google OAuth
   */
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) throw error;
  },

  /**
   * Sign In with Email and Password
   */
  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    const signInPromise = supabase.auth.signInWithPassword({
        email,
        password
    });

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => 
        setTimeout(() => reject(new Error("Login timed out. Please check your connection and try again.")), 30000)
    );

    const { data, error } = await Promise.race([signInPromise, timeoutPromise]);

    if (error) throw error;
    if (!data.session) throw new Error("No session created");

    const userProfile = await mapUserToProfile(data.session.user);

    return {
        user: userProfile,
        token: data.session.access_token,
        expiresAt: (data.session.expires_at || 0) * 1000
    };
  },

  /**
   * Sign In with Magic Link (OTP)
   */
  async signInWithOtp(email: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
  },

  /**
   * Sign Up
   */
  async signUpWithPassword(name: string, email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
            }
        }
    });

    if (error) throw error;
    
    if (!data.session) {
        throw new Error("Signup successful! Please check your email to verify your account.");
    }

    const userProfile = await mapUserToProfile(data.session.user);

    return {
        user: userProfile,
        token: data.session.access_token,
        expiresAt: (data.session.expires_at || 0) * 1000
    };
  },

  /**
   * Sign Out
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("SignOut exception:", e);
    }
  },

  /**
   * Subscribe to Auth Changes
   */
  subscribe(callback: (event: string, session: AuthSession | null) => void): { unsubscribe: () => void } {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          if (session) {
              const userProfile = await mapUserToProfile(session.user);
              const authSession: AuthSession = {
                  user: userProfile,
                  token: session.access_token,
                  expiresAt: (session.expires_at || 0) * 1000
              };
              callback(event, authSession);
          } else {
              callback(event, null);
          }
        } catch (e) {
          console.warn("Auth state change callback error:", e);
          callback(event, null);
        }
    });
    
    return data.subscription;
  }
};
