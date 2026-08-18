
import { AppMode, ResolutionQuality, GenerateImageParams, ImageModel } from '../types';
import { CATALOG_BUNDLE_DISCOUNT } from '../constants';
import { resolveModelForGeneration } from '../src/config/modelConfig';

/**
 * Calculates the total credit cost for a generation request.
 * 
 * Formula: 
 * (Base Variations) * (Number of Aspect Ratios) * (Model Multiplier) * (Quality Multiplier)
 */
export const calculateGenerationCost = (params: GenerateImageParams, userTier: string): number => {
    // 1. Get Multipliers
    // Default to 1 ratio if array is empty/undefined to prevent 0 cost
    const numRatios = (params.aspectRatios && params.aspectRatios.length > 0) ? params.aspectRatios.length : 1;
    
    // Model Multipliers from Central Model Configuration:
    // Free -> Nano Banana 2 Lite (1x)
    // Paid Standard -> Nano Banana 2 (1x)
    // Paid Pro -> Nano Banana Pro (2x)
    const resolvedModel = resolveModelForGeneration(userTier, params.quality, params.appMode);
    const modelMultiplier = resolvedModel.credits;

    // Quality Multiplier: 2K quality adds +1 credit per image
    let qualityMultiplier = params.resolutionQuality === ResolutionQuality.TwoK ? 1.5 : 1;

    let baseVariations = 1;
    let isCatalogBatch = false;

    // 2. Calculate Base Variations based on Mode
    switch (params.appMode) {
        case AppMode.Product:
            // Product Mode: 
            // We treat ALL uploaded images as a single "Context Set" for the AI.
            // Therefore, we do NOT multiply by bulkImages.length.
            // We only multiply by the number of output variations requested (Angles * Presets).
            
            // Limit angles based on tier
            let maxAngles = userTier === 'PayAsYouGo' ? 6 : 1;
            
            // Defensively ensure at least 1 angle is counted if the array is empty or undefined
            const currentAngles = params.selectedAngles && params.selectedAngles.length > 0 ? params.selectedAngles.length : 1;
            const selectedAngleCount = Math.min(currentAngles, maxAngles);
            
            const presets = (params.productStylePresets && params.productStylePresets.length > 0) 
                ? params.productStylePresets 
                : [params.productStylePreset || 'AI Suggested'];

            // Cost = Number of Presets * Number of Angles
            // Example: 3 Presets * 1 Angle = 3 Credits (regardless of how many reference images uploaded)
            baseVariations = presets.length * selectedAngleCount;
            break;

        case AppMode.Fashion:
            if (params.bulkImages && params.bulkImages.length > 0) {
                baseVariations = params.bulkImages.length;
            } else if (params.fashionPose && params.fashionPose.length > 0) {
                baseVariations = Math.min(params.fashionPose.length, 12);
                // Multi-pose selection counts as a catalog batch for bundle discount
                isCatalogBatch = params.fashionPose.length > 1 || !!params.catalogMode;
            } else if (params.catalogMode) {
                // No poses hand-picked, but Catalog Mode is on: auto-fills a curated pose set
                const setSize = params.catalogSetSize === 4 ? 4 : 5;
                baseVariations = setSize;
                isCatalogBatch = true;
            } else {
                baseVariations = 1;
            }
            break;

        case AppMode.Festival:
            // Festival Mode: Presets * 1 (Images are context)
            // Similar to Product Mode, we treat uploaded images as context unless explicitly separate batches
            const festivalPresetCount = (params.festivalStylePresets && params.festivalStylePresets.length > 0) 
                ? params.festivalStylePresets.length 
                : 1;
            baseVariations = festivalPresetCount;
            break;

        case AppMode.Bulk:
            // Simple Bulk Mode - strictly 1 output per input image
            baseVariations = params.bulkImages && params.bulkImages.length > 0 ? params.bulkImages.length : 1;
            break;

        case AppMode.Remix:
            // Remix is typically 1 input -> 1 output unless explicitly multi-ratio
            baseVariations = 1; 
            break;

        default:
            // Influencer, AdCreative, etc.
            if (params.bulkImages && params.bulkImages.length > 0) {
                baseVariations = params.bulkImages.length;
            } else {
                baseVariations = 1;
            }
            break;
    }

    // 3. Final Calculation
    // Math.ceil((Base Items) * (Output Ratios) * (Model Multiplier) * (Quality Multiplier))
    let totalCost = Math.max(1, Math.ceil(baseVariations * numRatios * modelMultiplier * qualityMultiplier));

    // 4. Catalog Set Bundle Discount
    // Reward generating a full multi-pose catalog set in one go instead of paying full
    // price per image.
    if (isCatalogBatch) {
        totalCost = Math.max(1, Math.round(totalCost * CATALOG_BUNDLE_DISCOUNT));
    }

    return totalCost;
};

/**
 * Returns discount metadata for display purposes (e.g. "20% off, was 5 credits")
 * without affecting the actual charge logic above. Returns null when no discount applies.
 */
export const getCatalogDiscountInfo = (params: GenerateImageParams, userTier: string): { fullPrice: number; discountedPrice: number; percentOff: number } | null => {
    if (params.appMode !== AppMode.Fashion) return null;
    const isCatalog = params.catalogMode || (params.fashionPose && params.fashionPose.length > 1);
    if (!isCatalog) return null;

    const count = (params.fashionPose && params.fashionPose.length > 0) 
        ? params.fashionPose.length 
        : (params.catalogSetSize === 4 ? 4 : 5);

    const singlePoseParams: GenerateImageParams = { 
        ...params, 
        catalogMode: false, 
        fashionPose: ['pose'] 
    };

    const perImageFullPrice = calculateGenerationCost(singlePoseParams, userTier);
    const fullPrice = perImageFullPrice * count;
    const discountedPrice = calculateGenerationCost(params, userTier);

    if (fullPrice <= discountedPrice) return null;

    const percentOff = Math.round((1 - discountedPrice / fullPrice) * 100);
    return { fullPrice, discountedPrice, percentOff };
};

