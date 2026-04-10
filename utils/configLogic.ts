
import { AppMode, GenerateImageParams, AspectRatio, ProductCategory, ResolutionQuality, AdLayout } from '../types';
import { AI_SUGGESTED } from '../constants';

/**
 * GLOBAL CONFIGURATION LOGIC
 * 
 * This file centralizes logic for:
 * 1. Mode Transitions (Defaults)
 * 2. Aspect Ratio Selection (Single vs Multiple based on Tier)
 * 3. Validation Rules
 */

export const getModeDefaults = (
    targetMode: AppMode, 
    currentParams: GenerateImageParams
): Partial<GenerateImageParams> => {
    
    const updates: Partial<GenerateImageParams> = {
        appMode: targetMode
    };

    // When entering Remix mode, clear standard image assets to avoid conflicts.
    if (targetMode === AppMode.Remix) {
        updates.frontProductImage = undefined;
        updates.bulkImages = undefined;
    } 
    // When entering a standard image mode, clear Remix assets.
    else if ([AppMode.Product, AppMode.Fashion, AppMode.Influencer, AppMode.Festival, AppMode.AdCreative, AppMode.Bulk].includes(targetMode)) {
        updates.remixReferenceImage = undefined;
        updates.remixProductImage = undefined;
    }

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
        // Ensure at least one portrait ratio is selected for fashion if none exists
        const currentRatios = currentParams.aspectRatios || [];
        const hasPortrait = currentRatios.includes(AspectRatio.PortraitPost) || currentRatios.includes(AspectRatio.FashionShopify);
        
        if (!hasPortrait) {
             updates.aspectRatios = [AspectRatio.PortraitPost];
        }
    } else if (targetMode === AppMode.Influencer) {
        updates.modelSourceOption = 'new';
    } else if (targetMode === AppMode.AdCreative) {
        updates.adTemplateId = 'luxury-minimal';
        updates.adLayout = AdLayout.TextRightImageLeft;
        updates.adFontFamily = 'font-serif';
        updates.adTextColor = 'text-slate-800';
    }

    return updates;
};

/**
 * Centralized Aspect Ratio Toggle Logic
 * Handles the business rule: Free/Starter = Single Ratio, Standard/Agency = Multiple Ratios
 * UPDATE: Multi-select enabled for all tiers to improve UX; costs are calculated per image.
 */
export const toggleAspectRatio = (
    currentRatios: AspectRatio[], 
    targetRatio: AspectRatio, 
    userTier: 'Free' | 'Starter' | 'Standard' | 'Agency'
): AspectRatio[] => {
    
    const canSelectMultiple = true; 

    // Case 1: Restricted Tiers (Single Select) - DISABLED restriction
    if (!canSelectMultiple) {
        // If clicking the same one, don't unselect (must have at least one).
        // If clicking a different one, switch to it.
        return [targetRatio];
    }

    // Case 2: Multi Select
    if (currentRatios.includes(targetRatio)) {
        // Deselecting
        const newRatios = currentRatios.filter(r => r !== targetRatio);
        // Prevent empty selection - keep the one we just tried to remove if it was the last one
        return newRatios.length === 0 ? [targetRatio] : newRatios;
    } else {
        // Selecting
        return [...currentRatios, targetRatio];
    }
};
