
import { supabase } from './supabaseClient';

export const storageService = {
  /**
   * Uploads a Base64 image or Blob to storage and returns a public URL.
   */
  async uploadImage(imageData: string | Blob, fileName: string): Promise<string> {
    let blob: Blob;
    if (typeof imageData === 'string') {
        const response = await fetch(imageData);
        blob = await response.blob();
    } else {
        blob = imageData;
    }

    // Upload to 'designs' bucket
    const { data, error } = await supabase.storage
      .from('designs')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      if (error.message.includes('Bucket not found') || error.message.includes('row-level security policy')) {
          console.error("Storage Error: The 'designs' bucket is missing or RLS policies are blocking access.");
          throw new Error("Storage bucket not configured. Please run the setup script in Supabase.");
      }
      throw error;
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from('designs')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  },

  /**
   * Deletes an image from storage
   */
  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage.from('designs').remove([path]);
    if (error) throw error;
  }
};
