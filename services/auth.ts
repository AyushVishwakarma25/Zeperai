
import { supabase } from './supabaseClient';
import { UserProfileData, user as userService } from './user';

const mapUserToProfile = async (user: any): Promise<UserProfileData> => {
    const profile = await userService.getUserProfile(user.id);
    if (profile) return profile;

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

export const auth = {
  async getSession(): Promise<AuthSession | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    const userProfile = await mapUserToProfile(session.user);
    return { user: userProfile, token: session.access_token, expiresAt: (session.expires_at || 0) * 1000 };
  },

  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error("No session created");
    const userProfile = await mapUserToProfile(data.session.user);
    return { user: userProfile, token: data.session.access_token, expiresAt: (data.session.expires_at || 0) * 1000 };
  },

  async signUpWithPassword(name: string, email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name, avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` } }
    });
    if (error) throw error;
    if (!data.session) throw new Error("Signup successful! Please check your email to verify your account.");
    const userProfile = await mapUserToProfile(data.session.user);
    return { user: userProfile, token: data.session.access_token, expiresAt: (data.session.expires_at || 0) * 1000 };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
};
