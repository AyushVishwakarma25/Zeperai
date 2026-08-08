
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

    // Apply High Quality Multiplier (4x) only if the user is on a tier that actually supports/uses the Pro model
    const isProTier = userTier === 'Standard' || userTier === 'Agency';
    if (params.resolutionQuality === ResolutionQuality.High && isProTier) {
        baseCost *= 4;
    }

    return baseCost;
};
