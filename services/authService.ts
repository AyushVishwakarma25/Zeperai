
import { supabase } from './supabaseClient';
import { UserProfileData, userService } from './userService';

// Helper to construct profile object from Supabase user data
const mapUserToProfile = async (user: any): Promise<UserProfileData> => {
    // Attempt to fetch full profile from DB
    let profile = await userService.getUserProfile(user.id);

    // Fallback based on auth metadata if profile row not found/ready yet
    if (!profile) {
        profile = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: 'Creator',
            bio: '',
            location: '',
            avatarUrl: user.user_metadata?.avatar_url || '',
            tier: 'Free'
        };
    }

    // Special access for sharma25ayush@gmail.com
    if (profile.email === 'sharma25ayush@gmail.com') {
        profile.tier = 'Standard';
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
    // 1. Call Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    // 2. Handle Response
    if (error || !session) return null;

    // 3. Transform Data
    const userProfile = await mapUserToProfile(session.user);
    
    // 4. Return Safe Output
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
    // 1. Call Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    // 2. Handle Response
    if (error) throw error;
    if (!data.session) throw new Error("No session created");

    // 3. Transform Data
    const userProfile = await mapUserToProfile(data.session.user);

    // 4. Return Safe Output
    return {
        user: userProfile,
        token: data.session.access_token,
        expiresAt: (data.session.expires_at || 0) * 1000
    };
  },

  /**
   * Sign Up
   */
  async signUpWithPassword(name: string, email: string, password: string): Promise<AuthSession> {
    // 1. Call Supabase
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

    // 2. Handle Response
    if (error) throw error;
    
    // Check if session exists (it might be null if email confirmation is required)
    if (!data.session) {
        throw new Error("Signup successful! Please check your email to verify your account.");
    }

    // 3. Transform Data
    const userProfile = await mapUserToProfile(data.session.user);

    // 4. Return Safe Output
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
    await supabase.auth.signOut();
  }
};