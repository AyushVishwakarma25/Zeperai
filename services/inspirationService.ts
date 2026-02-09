
import { supabase } from './supabaseClient';
import { storageService } from './storageService';
import type { InspirationItem, GeneratedImage } from '../types';
import { INSPIRATION_GALLERY } from '../data/inspirationGallery';
import { AppMode } from '../types';
import { compressImage } from '../utils/images';

const TABLE_NAME = 'inspiration_gallery';

export const inspirationService = {
  /**
   * Fetch all inspirations (Static curated list + Community submissions)
   */
  async getInspirations(): Promise<InspirationItem[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const isSchemaError = error.code === '42P01' || error.code === '404' || error.message.includes('schema cache');
      if (!isSchemaError) {
          console.warn("Failed to fetch community inspirations:", error.message);
      }
      return INSPIRATION_GALLERY; 
    }

    const communityItems: InspirationItem[] = data.map((row: any) => ({
      id: row.id,
      imageUrl: row.image_url,
      title: row.title || 'Community Design',
      category: row.category || 'Community',
      appMode: (row.app_mode as AppMode) || AppMode.Product,
      isRemixable: true,
      badge: 'Community',
      remixParams: row.remix_params || {}
    }));

    return [...communityItems, ...INSPIRATION_GALLERY];
  },

  /**
   * Submit a generated image to the global inspiration gallery.
   * Optimizes the image size to save bandwidth for the global feed.
   */
  async submitToInspiration(image: GeneratedImage): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be logged in to share to the gallery.");

    let publicUrl = image.imageUrl;
    
    // Optimization: Compress the image for community sharing (Max 1024px, 0.8 quality WebP)
    // Community gallery doesn't need 4K source files.
    try {
        const optimizedBlob = await compressImage(image.imageUrl, { 
            quality: 0.8, 
            type: 'image/webp'
        });
        const fileName = `inspiration/${user.id}/${Date.now()}_insp.webp`;
        publicUrl = await storageService.uploadImage(optimizedBlob, fileName, 'image/webp');
    } catch (optError) {
        console.warn("Optimization failed, falling back to original upload", optError);
        // Fallback to original if compression fails
        if (image.imageUrl.startsWith('data:') || image.imageUrl.startsWith('blob:')) {
           const fileName = `inspiration/${user.id}/${Date.now()}_insp.png`;
           publicUrl = await storageService.uploadImage(image.imageUrl, fileName);
        }
    }

    const remixParams = {
        appMode: image.params?.appMode,
        productCategory: image.params?.productCategory,
        productStylePreset: image.params?.productStylePreset,
        aspectRatios: image.params?.aspectRatios,
        productDescription: image.params?.productDescription,
        fashionGender: image.params?.fashionGender,
        fashionCategory: image.params?.fashionCategory,
        backgroundStyle: image.params?.backgroundStyle,
        adLayout: image.params?.adLayout,
        adStylePreset: image.params?.adStylePreset,
        ugcStyle: image.params?.ugcStyle
    };

    const { error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        title: image.caption?.substring(0, 50) || 'Community Creation',
        category: image.params?.productCategory || 'Creative',
        app_mode: image.params?.appMode || AppMode.Product,
        remix_params: remixParams
      });

    if (insertError) {
        if (insertError.code === '42P01') throw new Error("Missing 'inspiration_gallery' table.");
        throw insertError;
    }
  }
};
