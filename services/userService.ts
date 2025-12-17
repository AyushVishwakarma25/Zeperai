
import { supabase } from './supabaseClient';

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  location: string;
  avatarUrl: string;
  tier: 'Free' | 'Starter' | 'Standard' | 'Agency';
}

export interface CreditBalance {
  current: number;
  total: number; // Monthly quota
}

export const userService = {
  // Fetch User Profile
  async getUserProfile(userId?: string): Promise<UserProfileData | null> {
    let uid = userId;
    if (!uid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        uid = user.id;
    }

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
    
    if (error) {
        // If the table doesn't exist or row is missing, just log warning and return null (fallback will handle it)
        console.warn('Failed to load user profile from DB:', error.message || error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role || 'Creator',
        bio: data.bio || '',
        location: data.location || '',
        avatarUrl: data.avatar_url || '',
        tier: (data.tier as any) || 'Free'
    };
  },

  // Update User Profile
  async updateUserProfile(updates: Partial<UserProfileData>): Promise<UserProfileData> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    // Map camelCase to snake_case for DB
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.bio) dbUpdates.bio = updates.bio;
    if (updates.location) dbUpdates.location = updates.location;
    if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.role) dbUpdates.role = updates.role;

    const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();
    
    if (error) throw error;

    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        bio: data.bio,
        location: data.location,
        avatarUrl: data.avatar_url,
        tier: data.tier
    };
  },

  // Fetch Credit Balance
  async getCredits(): Promise<CreditBalance> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { current: 0, total: 0 };

    const { data, error } = await supabase
        .from('user_credits')
        .select('current_balance, total_quota')
        .eq('user_id', user.id)
        .single();

    if (error) {
        // Fallback or record might not exist yet
        console.warn('Failed to load credits:', error.message || error);
        return { current: 0, total: 0 };
    }

    return {
        current: data.current_balance,
        total: data.total_quota
    };
  },

  // Deduct Credits
  async deductCredits(amount: number): Promise<CreditBalance> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    // 1. Get current
    const { data: currentData, error: fetchError } = await supabase
        .from('user_credits')
        .select('current_balance, total_quota')
        .eq('user_id', user.id)
        .single();
    
    if (fetchError || !currentData) throw new Error("Could not fetch credits");

    if (currentData.current_balance < amount) {
        throw new Error("Insufficient funds");
    }

    const newBalance = currentData.current_balance - amount;

    // 2. Update
    const { error: updateError } = await supabase
        .from('user_credits')
        .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

    if (updateError) throw updateError;

    return {
        current: newBalance,
        total: currentData.total_quota
    };
  },

  // Mock Check (Internal use, real check is via authService.getSession)
  async checkSession(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }
};
