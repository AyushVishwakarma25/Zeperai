
import { AppMode, ResolutionQuality, GenerateImageParams } from '../types';

/**
 * Calculates the total credit cost for a generation request.
 * 
 * Formula: 
 * (Base Variations) * (Number of Aspect Ratios) * (Quality Multiplier)
 */
export const calculateGenerationCost = (params: GenerateImageParams, userTier: string): number => {
    // 1. Get Multipliers
    const numRatios = params.aspectRatios?.length || 1; // Default to 1 if empty, though UI prevents empty
    
    // Per user request, high quality no longer uses a different model, so the cost multiplier is removed.
    const qualityMultiplier = 1;

    let baseVariations = 1;

    // 2. Calculate Base Variations based on Mode
    switch (params.appMode) {
        case AppMode.Product:
            // Product Mode: (Angles) OR (Bulk Images)
            const bulkCount = params.bulkImages?.length || 1;
            
            // Limit angles based on tier (enforced here for cost, UI enforces limits too)
            let maxAngles = userTier === 'Agency' ? 10 : (userTier === 'Standard' ? 4 : 1);
            const selectedAngleCount = Math.min(params.selectedAngles.length, maxAngles);
            
            // If presets are used (future feature), multiplier goes here. currently 1.
            const presetCount = (params.productStylePresets && params.productStylePresets.length > 0) 
                ? params.productStylePresets.length 
                : 1;

            // Cartesian Product: Images * Angles * Presets
            baseVariations = bulkCount * selectedAngleCount * presetCount;
            break;

        case AppMode.Fashion:
            // Fashion Mode: Batch Size
            if (params.bulkImages && params.bulkImages.length > 0) {
                // If uploading multiple garments/refs
                baseVariations = params.bulkImages.length;
            } else {
                // Standard generation batch size
                let maxBatch = userTier === 'Agency' ? 12 : (userTier === 'Standard' ? 4 : 1);
                const requested = params.batchSize || 1;
                baseVariations = Math.min(requested, maxBatch);
            }
            break;

        case AppMode.Bulk:
            // Simple Bulk Mode
            baseVariations = params.bulkImages?.length || 1;
            break;

        default:
            // Influencer, AdCreative, Festival, Remix, etc.
            // These modes typically generate 1 image per "Generate" click unless batchSize is supported
            if (params.bulkImages && params.bulkImages.length > 0) {
                baseVariations = params.bulkImages.length;
            } else {
                let maxBatch = userTier === 'Agency' ? 12 : (userTier === 'Standard' ? 4 : 1);
                const requested = params.batchSize || 1;
                baseVariations = Math.min(requested, maxBatch);
            }
            break;
    }

    // 3. Final Calculation
    // (Base Items) * (Output Ratios) * (Quality Cost)
    const totalCost = baseVariations * numRatios * qualityMultiplier;

    return totalCost;
};
