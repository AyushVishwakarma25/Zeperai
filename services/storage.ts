
import { supabase } from './supabaseClient';

export const storage = {
  async uploadImage(imageData: string | Blob, fileName: string): Promise<string> {
    let blob: Blob;
    if (typeof imageData === 'string') {
        const response = await fetch(imageData);
        blob = await response.blob();
    } else {
        blob = imageData;
    }

    const { error } = await supabase.storage.from('designs').upload(fileName, blob, { contentType: 'image/png', upsert: true });

    if (error) {
      if (error.message.includes('Bucket not found') || error.message.includes('row-level security policy')) {
          console.error("Storage Error: The 'designs' bucket is missing or RLS policies are blocking access.");
          throw new Error("Storage bucket not configured.");
      }
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from('designs').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  },

  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage.from('designs').remove([path]);
    if (error) throw error;
  }
};
