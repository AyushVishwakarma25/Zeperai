
import { AppMode, ResolutionQuality, GenerateImageParams } from '../types';

export const calculateGenerationCost = (params: GenerateImageParams, userTier: string): number => {
    const numRatios = params.aspectRatios?.length || 0;
    if (numRatios === 0) return 0;

    let numVariants = 1;
    const isFashion = params.appMode === AppMode.Fashion;

    if (isFashion) {
        // Fashion Mode Batch Logic
        let maxBatch = 1;
        if (userTier === 'Agency') maxBatch = 12;
        else if (userTier === 'Standard') maxBatch = 4;
        
        // Clamp requested batch size to allowed max
        const requested = params.batchSize || (maxBatch > 1 ? 4 : 1);
        numVariants = Math.min(requested, maxBatch);
        
    } else if (params.appMode === AppMode.Product) {
        // Product Mode Angles Logic
        let maxAngles = 1;
        if (userTier === 'Agency') maxAngles = 10;
        else if (userTier === 'Standard') maxAngles = 4;
        
        const effectiveAngles = Math.min(params.selectedAngles.length, maxAngles);
        numVariants = effectiveAngles;
    } else if (params.appMode === AppMode.Bulk && params.bulkImages) {
        numVariants = params.bulkImages.length;
    } else {
        // Standard batch logic for other modes
        numVariants = params.batchSize || 1;
    }
    
    // If product mode has 0 valid angles, cost is 0
    if (params.appMode === AppMode.Product && numVariants === 0) return 0;

    let baseCost = numVariants * numRatios;

    // Apply High Quality Multiplier (4x) only if the user is on a tier that actually supports/uses the Pro model
    const isProTier = userTier === 'Standard' || userTier === 'Agency';
    if (params.resolutionQuality === ResolutionQuality.High && isProTier) {
        baseCost *= 4;
    }

    return baseCost;
};
