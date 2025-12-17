
import { supabase } from './supabaseClient';
import { UserProfileData, userService } from './userService';

// Helper to construct profile object from Supabase user data
const mapUserToProfile = async (user: any): Promise<UserProfileData> => {
    // Attempt to fetch full profile from DB
    const profile = await userService.getUserProfile(user.id);
    if (profile) return profile;

    // Fallback based on auth metadata if profile row not found/ready yet
    return {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'Creator',
        bio: '',
        location: '',
        avatarUrl: user.user_metadata?.avatar_url || '',
        tier: 'Free'
    };
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
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;

    const userProfile = await mapUserToProfile(session.user);
    
    return {
        user: userProfile,
        token: session.access_token,
        expiresAt: (session.expires_at || 0) * 1000
    };
  },

  /**
   * Sign In with Email and Password
   */
  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    if (!data.session) throw new Error("No session created");

    const userProfile = await mapUserToProfile(data.session.user);

    return {
        user: userProfile,
        token: data.session.access_token,
        expiresAt: (data.session.expires_at || 0) * 1000
    };
  },

  // Kept for backward compatibility if needed, but should not be used with real auth without password
  async signIn(email: string): Promise<AuthSession> {
      throw new Error("Password is required for authentication.");
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
    
    // Check if session exists (it might be null if email confirmation is required)
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

  // Legacy signature wrapper
  async signUp(name: string, email: string): Promise<AuthSession> {
      throw new Error("Password is required for signup.");
  },

  /**
   * Sign Out
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
};
