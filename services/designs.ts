
import { supabase } from './supabaseClient';
import { GeneratedImage } from '../types';

export const designs = {
  async getSavedDesigns(): Promise<GeneratedImage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.from('designs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

    if (error) return [];

    return data.map((row: any) => ({
        id: row.id,
        imageUrl: row.image_url,
        caption: row.caption,
        hashtags: row.hashtags,
        aspectRatio: row.aspect_ratio,
        params: row.params || {},
        timestamp: new Date(row.created_at).getTime(),
    }));
  },

  async saveDesign(design: GeneratedImage): Promise<GeneratedImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const dbRow = {
        user_id: user.id,
        image_url: design.imageUrl,
        caption: design.caption,
        hashtags: design.hashtags,
        aspect_ratio: design.aspectRatio,
        params: design.params
    };

    const { data, error } = await supabase.from('designs').insert(dbRow).select().single();
    
    if (error) throw error;

    return { ...design, id: data.id };
  },

  async deleteDesign(designId: string): Promise<void> {
    const { error } = await supabase.from('designs').delete().eq('id', designId);
    if (error) throw error;
  }
};
