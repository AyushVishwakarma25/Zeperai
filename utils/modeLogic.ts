
/**
 * FILE: modeLogic.ts
 *
 * PURPOSE:
 * - Centralizes business logic for AppMode transitions.
 * - Determines default parameters when switching modes.
 *
 * FLOW:
 * UI (App.tsx) calls getModeConfiguration -> logic returns new state
 *
 * INPUT:
 * - targetMode: AppMode
 * - currentParams: GenerateImageParams
 *
 * OUTPUT:
 * - Partial<GenerateImageParams> (updates to apply)
 *
 * NOTES:
 * - Ensures clean state transitions and applies mode-specific defaults.
 */

import { AppMode, GenerateImageParams, AspectRatio, ProductCategory } from '../types.js';
import { AI_SUGGESTED } from '../constants.js';

export const getModeConfiguration = (
    targetMode: AppMode, 
    currentParams: GenerateImageParams
): Partial<GenerateImageParams> => {
    
    const updates: Partial<GenerateImageParams> = {
        appMode: targetMode
    };

    // 1. Cleanup Fashion Parameters if exiting Fashion Mode
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

    // 2. Cleanup Product Parameters if exiting Product Mode
    if (currentParams.appMode === AppMode.Product && targetMode !== AppMode.Product) {
        updates.productStylePreset = AI_SUGGESTED;
    }

    // 3. Apply Defaults for Specific Modes
    if (targetMode === AppMode.Youtube || targetMode === AppMode.Banner) {
        updates.aspectRatios = [AspectRatio.Landscape]; // 16:9
    } else if (targetMode === AppMode.Fashion) {
        updates.productCategory = ProductCategory.Fashion;
        // Fashion usually prefers portrait
        if (!currentParams.aspectRatios?.includes(AspectRatio.PortraitPost) && !currentParams.aspectRatios?.includes(AspectRatio.FashionShopify)) {
             updates.aspectRatios = [AspectRatio.PortraitPost];
        }
    } else if (targetMode === AppMode.Influencer) {
        updates.modelSourceOption = 'new';
    }

    return updates;
};
