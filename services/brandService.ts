
import { supabase } from './supabaseClient';
import type { BrandKit } from '../types';

export const brandService = {
  async getBrandKit(): Promise<BrandKit | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
          // PGRST116: JSON object requested, multiple (or no) rows returned - Normal for new users
          // 42P01: relation "public.brand_kits" does not exist - Normal before DB setup
          if (error.code !== 'PGRST116' && error.code !== '42P01') {
              console.warn('Brand kits fetch error:', error.message);
          }
          return null;
      }

      return {
        id: data.id,
        brandName: data.brand_name,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        accentColor: data.accent_color,
        fonts: data.fonts,
        voice: data.voice,
        description: data.description,
        logoUrl: data.logo_url,
        updatedAt: new Date(data.updated_at).getTime(),
      };
    } catch (e) {
      console.error("Critical error in getBrandKit:", e);
      return null;
    }
  },

  async saveBrandKit(kit: BrandKit): Promise<BrandKit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Authenticated user required to save brand kit.");

    const dbData = {
      user_id: user.id,
      brand_name: kit.brandName,
      primary_color: kit.primaryColor,
      secondary_color: kit.secondaryColor,
      accent_color: kit.accentColor,
      fonts: kit.fonts,
      voice: kit.voice,
      description: kit.description,
      logo_url: kit.logoUrl,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('brand_kits')
      .upsert(dbData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
        if (error.message.includes('relation "public.brand_kits" does not exist') || error.code === '42P01') {
            throw new Error("Database setup incomplete. Please run the SQL setup script in your Supabase dashboard.");
        }
        throw error;
    }

    return {
      id: data.id,
      brandName: data.brand_name,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      accentColor: data.accent_color,
      fonts: data.fonts,
      voice: data.voice,
      description: data.description,
      logoUrl: data.logo_url,
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }
};
