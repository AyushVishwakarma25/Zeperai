
import { AppMode } from '../types.js';

export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

export const getActionLabel = (mode: AppMode): string => {
    switch(mode) {
        case AppMode.Product: return 'Product Photoshoot';
        case AppMode.Bulk: return 'Bulk Catalog processing';
        case AppMode.Influencer: return 'Influencer Campaign';
        case AppMode.AdCreative: return 'Ad Creative';
        case AppMode.Remix: return 'Image Remix';
        case AppMode.Fashion: return 'Fashion Photoshoot';
        case AppMode.Banner: return 'Banner Design';
        case AppMode.Youtube: return 'YouTube Thumbnail';
        case AppMode.Festival: return 'Festival Post';
        default: return 'Generated Image';
    }
};
