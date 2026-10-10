
import { supabase } from './supabaseClient.js';
import { storageService } from './storageService.js';
import type { SavedModel } from '../types.js';

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  location: string;
  avatarUrl: string;
  tier: 'Free' | 'PayAsYouGo' | 'Pro' | 'Agency' | 'Standard';
  isAdmin?: boolean;
  companyName?: string;
  billingAddress?: string;
  billingState?: string;
  billingPincode?: string;
  gstin?: string;
}

export interface CreditBalance {
  current: number;
  total: number; // Monthly quota
}

export const userService = {
  // Fetch User Profile
  async getUserProfile(userId?: string): Promise<UserProfileData | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 1. Try server-side service role endpoint first (bypasses RLS recursion completely)
      if (token && (!userId || userId === session?.user?.id)) {
        try {
          const res = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.ok) {
            const profile = await res.json();
            if (profile && profile.id) {
              return profile;
            }
          }
        } catch (serverErr) {
          // Fall back to direct Supabase query
        }
      }
    } catch (e) {
      // Continue to Supabase direct query
    }

    let uid = userId;
    if (!uid) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        uid = user.id;
      } catch (e) {
        return null;
      }
    }

    try {
      const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle();
      
      if (error || !data) {
          // If the table doesn't exist or row is missing, just return null (fallback will handle it)
          if (error && error.code !== '42P01' && error.code !== '404' && error.code !== 'PGRST116' && (error as any).status !== 404) {
               console.warn('Failed to load user profile from DB:', error.message || error);
          }
          return null;
      }

      const isProAdmin = !!data.is_admin;

      return {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role || 'Creator',
          bio: data.bio || '',
          location: data.location || '',
          avatarUrl: data.avatar_url || '',
          tier: (data.tier as any) || (isProAdmin ? 'Pro' : 'Free'),
          isAdmin: isProAdmin,
          companyName: data.company_name || '',
          billingAddress: data.billing_address || '',
          billingState: data.billing_state || '',
          billingPincode: data.billing_pincode || '',
          gstin: data.gstin || ''
      };
    } catch (dbErr) {
      console.warn('Profile fetch exception:', dbErr);
      return null;
    }
  },

  // Update User Profile
  async updateUserProfile(updates: Partial<UserProfileData>): Promise<UserProfileData> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const user = session?.user;
    if (!user) throw new Error("No authenticated user");

    // 1. Try server-side service role endpoint first
    if (token) {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        });
        if (res.ok) {
          const updated = await res.json();
          if (updated && updated.id) {
            return updated;
          }
        }
      } catch (e) {
        // Fall back to direct Supabase query
      }
    }

    // Map camelCase to snake_case for DB
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName;
    if (updates.billingAddress !== undefined) dbUpdates.billing_address = updates.billingAddress;
    if (updates.billingState !== undefined) dbUpdates.billing_state = updates.billingState;
    if (updates.billingPincode !== undefined) dbUpdates.billing_pincode = updates.billingPincode;
    if (updates.gstin !== undefined) dbUpdates.gstin = (updates.gstin || '').toUpperCase().trim();

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
        tier: data.tier,
        isAdmin: !!data.is_admin,
        companyName: data.company_name || '',
        billingAddress: data.billing_address || '',
        billingState: data.billing_state || '',
        billingPincode: data.billing_pincode || '',
        gstin: data.gstin || ''
    };
  },

  // Fetch Credit Balance
  async getCredits(): Promise<CreditBalance> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { current: 0, total: 0 };

      const { data, error } = await supabase
          .from('user_credits')
          .select('current_balance, total_quota')
          .eq('user_id', user.id)
          .maybeSingle();

      if (error || !data) {
          if (error && error.code !== '42P01' && error.code !== '404' && (error as any).status !== 404) {
               console.warn('Failed to load credits:', error.message || error);
          }
          return { current: 0, total: 0 };
      }

      return {
          current: data.current_balance,
          total: data.total_quota
      };
    } catch (e) {
      return { current: 0, total: 0 };
    }
  },

  // Mock Check (Internal use, real check is via authService.getSession)
  async checkSession(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  // --- Saved Model Management ---
  async getSavedModels(): Promise<SavedModel[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code !== '42P01' && error.code !== '404' && (error as any).status !== 404) {
            console.warn("Could not fetch saved models:", error.message);
        }
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
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
