
import { supabase } from './supabaseClient';
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
        console.error("Failed to load designs:", error.message || error);
        return [];
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
   */
  async saveDesign(design: GeneratedImage): Promise<GeneratedImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const dbRow = {
        // Let Supabase generate the UUID for the primary key if needed, or use the client ID if valid UUID.
        // Since client IDs are 'gen-timestamp', they are not valid UUIDs. We omit 'id' to let DB generate one.
        // We will map the returned DB ID back to the object.
        user_id: user.id,
        image_url: design.imageUrl,
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
    
    if (error) throw error;

    return {
        ...design,
        id: data.id // Use the authoritative UUID from DB
    };
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
