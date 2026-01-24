
import { supabase } from './supabaseClient';
import { storageService } from './storageService';
import { GeneratedImage } from '../types';
import { createThumbnail } from '../utils/images';

export const designService = {
  /**
   * Fetch saved designs for the current user (gallery view, lightweight).
   * Fetches only essential fields and a limited number of records for fast loading.
   */
  async getSavedDesigns(page: number = 0, limit: number = 20): Promise<GeneratedImage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('designs')
        .select('id, image_url, caption, hashtags, aspect_ratio, created_at, params->>thumbnail_url') // Don't fetch the whole params object
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

    if (error) {
        if (error.code === '42P01' || error.code === '404' || (error as any).status === 404) {
            return [];
        }
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
             throw new Error("Network connection failed. Unable to load designs.");
        }
        console.error("Failed to load designs:", errorMessage);
        throw error;
    }

    return data.map((row: any) => ({
        id: row.id,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url || row.image_url,
        caption: row.caption || '',
        hashtags: row.hashtags || '',
        aspectRatio: row.aspect_ratio,
        params: {} as any, // Initially empty params to keep payload small
        timestamp: new Date(row.created_at).getTime(),
    }));
  },

  /**
   * Fetches the full details for a single design, including the large params object.
   */
  async getDesignDetails(designId: string): Promise<GeneratedImage | null> {
    const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('id', designId)
        .single();
    
    if (error || !data) {
        console.error("Failed to fetch design details:", error?.message);
        return null;
    }

    return {
        id: data.id,
        imageUrl: data.image_url,
        thumbnailUrl: data.params?.thumbnail_url || data.image_url,
        caption: data.caption,
        hashtags: data.hashtags,
        aspectRatio: data.aspect_ratio,
        params: data.params || {},
        timestamp: new Date(data.created_at).getTime(),
    };
  },

  /**
   * Save a new design.
   * Uploads original high-quality image AND a small thumbnail for speed.
   */
  async saveDesign(design: GeneratedImage): Promise<GeneratedImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    let imageUrl = design.imageUrl;
    let thumbnailUrl = null;

    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        const timestamp = Date.now();
        
        try {
            const fileName = `users/${user.id}/designs/${timestamp}.png`;
            imageUrl = await storageService.uploadImage(imageUrl, fileName, 'image/png');
        } catch (e) {
            console.error("Failed to upload high-res image", e);
            throw new Error("Failed to save image.");
        }

        try {
            const thumbBlob = await createThumbnail(design.imageUrl, 400);
            const thumbName = `users/${user.id}/thumbnails/${timestamp}.webp`;
            thumbnailUrl = await storageService.uploadImage(thumbBlob, thumbName, 'image/webp');
        } catch (e) {
            console.warn("Failed to generate/upload thumbnail (skipping)", e);
            thumbnailUrl = imageUrl;
        }
    }

    const dbRow = {
        user_id: user.id,
        image_url: imageUrl,
        caption: design.caption,
        hashtags: design.hashtags,
        aspect_ratio: design.aspectRatio,
        params: {
            ...design.params,
            thumbnail_url: thumbnailUrl
        }
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
        id: data.id, 
        imageUrl: imageUrl,
        thumbnailUrl: thumbnailUrl || imageUrl
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
