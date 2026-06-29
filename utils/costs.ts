
import { AppMode, ResolutionQuality, GenerateImageParams, ImageModel } from '../types';

/**
 * Calculates the total credit cost for a generation request.
 * 
 * Formula: 
 * (Base Variations) * (Number of Aspect Ratios) * (Model Multiplier)
 */
export const calculateGenerationCost = (params: GenerateImageParams, userTier: string): number => {
    // 1. Get Multipliers
    // Default to 1 ratio if array is empty/undefined to prevent 0 cost
    const numRatios = (params.aspectRatios && params.aspectRatios.length > 0) ? params.aspectRatios.length : 1;
    
    // Model Multipliers:
    // Imagen 3 Fast: 1x
    // Imagen 3 High Quality: 2x
    // Imagen 3 Pro: 4x
    let modelMultiplier = 2; // Default to 2 (High Quality) per original behavior
    if (params.imageModel) {
        switch (params.imageModel) {
            case ImageModel.Imagen3Fast:
                modelMultiplier = 1;
                break;
            case ImageModel.Imagen3HighQuality:
                modelMultiplier = 2;
                break;
            case ImageModel.Imagen3Pro:
                modelMultiplier = 4;
                break;
            case ImageModel.DallE3:
                modelMultiplier = 6;
                break;
            case ImageModel.NanoBananaPro:
                modelMultiplier = 3;
                break;
            case ImageModel.NanoBanana2:
                modelMultiplier = 5;
                break;
        }
    }

    let baseVariations = 1;

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
            // Fashion Mode Priority: Bulk > Poses > Batch Size
            if (params.bulkImages && params.bulkImages.length > 0) {
                // If uploading multiple garments/refs, cost is per garment (Batch processing)
                baseVariations = params.bulkImages.length;
            } else if (params.fashionPose && params.fashionPose.length > 0) {
                // If specific poses are selected, cost is number of poses
                let maxPoses = userTier === 'PayAsYouGo' ? 12 : 1;
                baseVariations = Math.min(params.fashionPose.length, maxPoses);
            } else {
                // Standard generation batch size slider
                let maxBatch = userTier === 'PayAsYouGo' ? 12 : 1;
                const requested = params.batchSize || 1;
                baseVariations = Math.min(requested, maxBatch);
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
                let maxBatch = userTier === 'PayAsYouGo' ? 12 : 1;
                const requested = params.batchSize || 1;
                baseVariations = Math.min(requested, maxBatch);
            }
            break;
    }

    // 3. Final Calculation
    // (Base Items) * (Output Ratios) * (Model Multiplier)
    const totalCost = Math.max(1, baseVariations * numRatios * modelMultiplier);

    return totalCost;
};
