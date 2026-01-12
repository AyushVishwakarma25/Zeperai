
import { supabase } from './supabaseClient';
import { storageService } from './storageService';
import { GeneratedImage } from '../types';

export const designService = {
  /**
   * Fetch all saved designs for the current user.
   */
  async getSavedDesigns(): Promise<GeneratedImage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        // Silently fail if table missing or connection issue during init
        // 42P01: relation does not exist
        // 404: resource not found (often generic 404 from PostgREST if endpoint not mapped)
        if (error.code === '42P01' || error.code === '404' || (error as any).status === 404) {
            return [];
        }
        
        // Handle Fetch/Network errors gracefully
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
             throw new Error("Network connection failed. Unable to load designs.");
        }

        // For actual network/auth errors, throw so the UI knows it failed
        console.error("Failed to load designs:", errorMessage);
        throw error;
    }

    return data.map((row: any) => ({
        id: row.id,
        imageUrl: row.image_url,
        caption: row.caption,
        hashtags: row.hashtags,
        aspectRatio: row.aspect_ratio,
        params: row.params || {}, // Ensure params is not null to prevent crashes
        timestamp: new Date(row.created_at).getTime(),
    }));
  },

  /**
   * Save a new design.
   * Auto-uploads to storage (persistence) but does NOT auto-share to gallery.
   */
  async saveDesign(design: GeneratedImage): Promise<GeneratedImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 1. Upload to Storage (Persistence)
    // We upload first to get a permanent URL for both the design record
    let imageUrl = design.imageUrl;
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        const fileName = `users/${user.id}/designs/${Date.now()}.png`;
        imageUrl = await storageService.uploadImage(imageUrl, fileName);
    }

    // 2. Save to Private Collection
    const dbRow = {
        // Let Supabase generate the UUID for the primary key
        user_id: user.id,
        image_url: imageUrl,
        caption: design.caption,
        hashtags: design.hashtags,
        aspect_ratio: design.aspectRatio,
        params: design.params
    };

    const { data, error } = await supabase
        .from('designs')
        .insert(dbRow)
        .select()
        .single();
    
    if (error) {
        if (error.code === '42P01' || error.code === '404') {
             throw new Error("Database table 'designs' is missing. Please run setup SQL.");
        }
        throw error;
    }

    const savedDesign = {
        ...design,
        id: data.id, // Use the authoritative UUID from DB
        imageUrl: imageUrl // Use the persistent Cloud URL
    };

    return savedDesign;
  },

  /**
   * Delete a design by ID.
   */
  async deleteDesign(designId: string): Promise<void> {
    const { error } = await supabase
        .from('designs')
        .delete()
        .eq('id', designId);
    
    if (error) throw error;
  }
};
