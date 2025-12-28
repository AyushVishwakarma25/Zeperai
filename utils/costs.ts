
import { AppMode, ResolutionQuality, GenerateImageParams } from '../types';

export const calculateGenerationCost = (params: GenerateImageParams, userTier: string): number => {
    const numRatios = params.aspectRatios?.length || 0;
    if (numRatios === 0) return 0;

    let numVariants = 1;
    const isFashion = params.appMode === AppMode.Fashion;

    if (isFashion) {
        let maxBatch = 1;
        if (userTier === 'Agency') maxBatch = 12;
        else if (userTier === 'Standard') maxBatch = 4;
        
        const requested = params.batchSize || (maxBatch > 1 ? 4 : 1);
        numVariants = Math.min(requested, maxBatch);
        
    } else if (params.appMode === AppMode.Product) {
        let maxAngles = 1;
        if (userTier === 'Agency') maxAngles = 10;
        else if (userTier === 'Standard') maxAngles = 4;
        
        const effectiveAngles = Math.min(params.selectedAngles.length, maxAngles);
        numVariants = effectiveAngles;
    } else if (params.appMode === AppMode.Bulk && params.bulkImages) {
        numVariants = params.bulkImages.length;
    } else {
        numVariants = params.batchSize || 1;
    }
    
    if (params.appMode === AppMode.Product && numVariants === 0) return 0;

    let baseCost = numVariants * numRatios;

    const isProTier = userTier === 'Standard' || userTier === 'Agency';
    if (params.resolutionQuality === ResolutionQuality.High && isProTier) {
        baseCost *= 4;
    }

    return baseCost;
};
