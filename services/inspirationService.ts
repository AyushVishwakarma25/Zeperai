
import { supabase } from './supabaseClient';
import { storageService } from './storageService';
import type { InspirationItem, GeneratedImage } from '../types';
import { INSPIRATION_GALLERY } from '../data/inspirationGallery';
import { AppMode } from '../types';

const TABLE_NAME = 'inspiration_gallery';

export const inspirationService = {
  /**
   * Fetch all inspirations (Static curated list + Community submissions)
   */
  async getInspirations(): Promise<InspirationItem[]> {
    // 1. Fetch from DB
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // 42P01: undefined table
      // PGRST200: Schema cache refresh needed / table not found
      // schema cache: generic message for missing table/cache issues
      const isSchemaError = error.code === '42P01' || error.code === '404' || error.message.includes('schema cache');
      
      if (!isSchemaError) {
          console.warn("Failed to fetch community inspirations:", error.message);
      }
      return INSPIRATION_GALLERY; // Return static only if DB fails/missing
    }

    // 2. Map DB items to InspirationItem type
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

    // 3. Combine with static gallery (Community first)
    return [...communityItems, ...INSPIRATION_GALLERY];
  },

  /**
   * Submit a generated image to the global inspiration gallery
   */
  async submitToInspiration(image: GeneratedImage): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("You must be logged in to share to the gallery.");

    // 1. Upload Image to Public Storage (if not already a public URL we own)
    let publicUrl = image.imageUrl;
    
    // If it's a data URL (base64) or blob, we must upload it. 
    // If it's already a Supabase URL (from designService), we reuse it.
    if (image.imageUrl.startsWith('data:') || image.imageUrl.startsWith('blob:')) {
       const fileName = `inspiration/${user.id}/${Date.now()}_insp.png`;
       publicUrl = await storageService.uploadImage(image.imageUrl, fileName);
    }

    // 2. Prepare Params for Remixing
    // Clean up params to only include essential style info
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

    // 3. Insert into DB
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
        if (insertError.code === '42P01') throw new Error("Missing 'inspiration_gallery' table. Please run the SQL setup script.");
        throw insertError;
    }
  }
};
