
import { supabase } from './supabaseClient';
import { storageService } from './storageService';
import type { SavedModel } from '../types';

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  location: string;
  avatarUrl: string;
  tier: 'Free' | 'PayAsYouGo';
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
        // If the table doesn't exist or row is missing, just return null (fallback will handle it)
        // 42P01: relation does not exist
        // 404: resource not found (table)
        // PGRST116: no rows returned (user exists in auth but not profiles table yet)
        if (error.code !== '42P01' && error.code !== '404' && error.code !== 'PGRST116' && (error as any).status !== 404) {
             console.warn('Failed to load user profile from DB:', error.message || error);
        }
        return null;
    }

    const isProAdmin = data.email === 'reachtoayush25@gmail.com' || data.email === 'sharma25ayush@gmail.com' || data.id === 'f58676e8-e373-4c97-803b-57451272154c';

    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role || 'Creator',
        bio: data.bio || '',
        location: data.location || '',
        avatarUrl: data.avatar_url || '',
        tier: isProAdmin ? 'Pro' : ((data.tier as any) || 'Free')
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
        // Silently fail if table missing
        if (error.code !== '42P01' && error.code !== '404' && (error as any).status !== 404) {
             console.warn('Failed to load credits:', error.message || error);
        }
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
  },

  // --- Saved Model Management ---
  async getSavedModels(): Promise<SavedModel[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_models')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      // 42P01: relation does not exist (table missing)
      // 404: resource not found
      if (error.code !== '42P01' && error.code !== '404' && (error as any).status !== 404) {
          console.warn("Could not fetch saved models:", error.message);
      }
      return [];
    }
    return data;
  },

  async saveModel(name: string, imageUrl: string, currentModels: SavedModel[]): Promise<SavedModel[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Enforce max 5 models
    if (currentModels.length >= 5) {
        const oldestModel = currentModels[currentModels.length - 1];
        await this.deleteModel(oldestModel.id);
    }

    // Upload thumbnail to storage
    const thumbnailFileName = `users/${user.id}/models/thumb_${Date.now()}.png`;
    const thumbnailUrl = await storageService.uploadImage(imageUrl, thumbnailFileName);
    
    const { data, error } = await supabase
        .from('saved_models')
        .insert({ name, thumbnail_url: thumbnailUrl, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    
    // Return fresh list
    return this.getSavedModels();
  },

  async deleteModel(modelId: string): Promise<void> {
    // Also delete from storage if needed, for now just DB
    const { error } = await supabase.from('saved_models').delete().eq('id', modelId);
    if (error) throw error;
  },
};
