
import { AppMode, GenerateImageParams, AspectRatio, ProductCategory } from '../types.js';
import { AI_SUGGESTED } from '../constants.js';

export const getModeConfiguration = (
    targetMode: AppMode, 
    currentParams: GenerateImageParams
): Partial<GenerateImageParams> => {
    
    const updates: Partial<GenerateImageParams> = {
        appMode: targetMode
    };

    if (targetMode !== AppMode.Fashion) {
        updates.fashionGender = undefined;
        updates.fashionShootType = undefined;
        updates.fashionCategory = undefined;
        updates.fashionSubCategory = undefined;
        updates.fashionBodyType = undefined;
        updates.fashionAgeBracket = undefined;
        updates.regionalStyle = undefined;
        updates.modelLockId = undefined;
    }

    if (currentParams.appMode === AppMode.Product && targetMode !== AppMode.Product) {
        updates.productStylePreset = AI_SUGGESTED;
    }

    if (targetMode === AppMode.Youtube || targetMode === AppMode.Banner) {
        updates.aspectRatios = [AspectRatio.Landscape]; 
    } else if (targetMode === AppMode.Fashion) {
        updates.productCategory = ProductCategory.Fashion;
        if (!currentParams.aspectRatios?.includes(AspectRatio.PortraitPost) && !currentParams.aspectRatios?.includes(AspectRatio.FashionShopify)) {
             updates.aspectRatios = [AspectRatio.PortraitPost];
        }
    } else if (targetMode === AppMode.Influencer) {
        updates.modelSourceOption = 'new';
    }

    return updates;
};
