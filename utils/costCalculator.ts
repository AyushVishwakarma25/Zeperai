
import { AppMode, ResolutionQuality, GenerateImageParams } from '../types';

export const calculateGenerationCost = (params: GenerateImageParams, userTier: string): number => {
    const numRatios = params.aspectRatios?.length || 0;
    if (numRatios === 0) return 0;

    let numVariants = 1;
    const isFashion = params.appMode === AppMode.Fashion;

    if (isFashion) {
        if (params.fashionPose && params.fashionPose.length > 0) {
            numVariants = params.fashionPose.length;
        } else {
            numVariants = 1;
        }
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
        numVariants = 1;
    }
    
    // If product mode has 0 valid angles, cost is 0
    if (params.appMode === AppMode.Product && numVariants === 0) return 0;

    let baseCost = numVariants * numRatios;

    // Apply 2K Quality Multiplier (1.5x) if 2K resolution quality is selected
    if (params.resolutionQuality === ResolutionQuality.TwoK) {
        baseCost = Math.ceil(baseCost * 1.5);
    }

    return baseCost;
};
