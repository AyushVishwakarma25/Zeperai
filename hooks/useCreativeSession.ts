
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { GenerateImageParams, GeneratedImage, BrandKit, AspectRatio } from '../types';
import { AppMode, ResolutionQuality } from '../types';
import { INITIAL_GENERATE_PARAMS, FREE_TRIAL_LIMIT, LOADING_MESSAGES } from '../constants';
import { generateImages } from '../services/geminiService';
import { processImageFile, isImageBlurry } from '../utils/images';
import { getModeDefaults, toggleAspectRatio } from '../utils/configLogic';
import { calculateGenerationCost } from '../utils/costs';

export const useCreativeSession = (
    userTier: 'Free' | 'PayAsYouGo',
    freeGenerationsUsed: number,
    setFreeGenerationsUsed: React.Dispatch<React.SetStateAction<number>>,
    checkAndDeductCredits: (cost: number) => boolean,
    refundCredits: (amount: number) => void
) => {
    // Session State
    const [params, setParams] = useState<GenerateImageParams>(() => {
        try {
            const saved = localStorage.getItem('krackx_last_params');
            return saved ? { ...INITIAL_GENERATE_PARAMS, ...JSON.parse(saved) } : INITIAL_GENERATE_PARAMS;
        } catch (e) {
            return INITIAL_GENERATE_PARAMS;
        }
    });

    const [activeMode, setActiveMode] = useState<AppMode | null>(null);
    const [lastActiveMode, setLastActiveMode] = useState<AppMode | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessages, setLoadingMessages] = useState<{title: string, subtext: string}>({ title: '', subtext: '' });
    
    // Image Previews State
    const [frontProductImagePreview, setFrontProductImagePreview] = useState<string | null>(null);
    const [bulkImagePreviews, setBulkImagePreviews] = useState<string[]>([]);
    const [remixReferenceImagePreview, setRemixReferenceImagePreview] = useState<string | null>(null);
    const [remixProductImagePreview, setRemixProductImagePreview] = useState<string | null>(null);
    
    const generationModeRef = useRef<AppMode | null>(null);
    const isGeneratingRef = useRef(false);

    // Persistence Effect
    useEffect(() => {
        const { frontProductImage, bulkImages, customAvatarImage, outfitReferenceImage, logoImage, remixReferenceImage, remixProductImage, ...safeParams } = params;
        localStorage.setItem('krackx_last_params', JSON.stringify(safeParams));
    }, [params]);

    // Loading Message Effect
    useEffect(() => {
        if (isLoading) {
            const mode = generationModeRef.current;
            const isAdMode = mode === AppMode.AdCreative || mode === AppMode.Banner || mode === AppMode.Youtube;
            const messageSetKey = isAdMode ? AppMode.AdCreative : (mode && LOADING_MESSAGES[mode] ? mode : 'default');
            const messages = LOADING_MESSAGES[messageSetKey];
            const progress = batchProgress ? (batchProgress.current / batchProgress.total) * 100 : -1;
            
            let subtextPool;
            if (progress === -1) subtextPool = messages.subtext.mid;
            else if (progress <= 30) subtextPool = messages.subtext.low;
            else if (progress <= 70) subtextPool = messages.subtext.mid;
            else subtextPool = messages.subtext.high;
            
            const subtext = subtextPool[Math.floor(Math.random() * subtextPool.length)];

            setLoadingMessages(prev => {
                const isNewLoadingState = !prev.title;
                const title = isNewLoadingState
                    ? messages.title[Math.floor(Math.random() * messages.title.length)]
                    : prev.title;
                return { title: title || 'Generating...', subtext };
            });
        } else {
            setLoadingMessages({ title: '', subtext: '' });
        }
    }, [isLoading, batchProgress]);

    // --- Actions ---

    const handleSelectMode = useCallback((tool: AppMode) => {
        setLastActiveMode(tool);
        setParams(prev => ({ ...prev, ...getModeDefaults(tool, prev) }));
        setActiveMode(tool);
    }, []);

    const handleResetParams = useCallback(() => {
        if (!activeMode) return;
        setParams(prev => ({ ...INITIAL_GENERATE_PARAMS, ...getModeDefaults(activeMode, INITIAL_GENERATE_PARAMS) }));
    }, [activeMode]);

    const handleFileChange = useCallback(async (file: File | null, paramName: keyof GenerateImageParams, previewSetter: React.Dispatch<React.SetStateAction<string | null>>, options: any) => {
        if (file === null) previewSetter(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
        if (file) {
            // Check for blur
            const isBlurry = await isImageBlurry(file);
            if (isBlurry) {
                window.dispatchEvent(new CustomEvent('zeper-blurry-image'));
            }

            const processedFile = await processImageFile(file, options);
            previewSetter(URL.createObjectURL(processedFile));
            setParams(prev => ({ ...prev, [paramName]: processedFile }));
        } else {
            setParams(prev => ({ ...prev, [paramName]: undefined }));
        }
    }, []);

    const handleBulkFilesChange = useCallback(async (files: File[]) => {
        const MAX_FILES = 5;
        const currentPreviews = bulkImagePreviews;
        const filesToProcess = files.slice(0, MAX_FILES - currentPreviews.length);

        // Check first file for blur in bulk uploads
        if (filesToProcess.length > 0) {
            const isBlurry = await isImageBlurry(filesToProcess[0]);
            if (isBlurry) {
                window.dispatchEvent(new CustomEvent('zeper-blurry-image'));
            }
        }

        const newPreviews = filesToProcess.map(f => URL.createObjectURL(f));
        const processedNewFiles = await Promise.all(filesToProcess.map(f => processImageFile(f, { maxWidth: 2048, maxHeight: 2048, format: 'image/png' })));
        
        const updatedBulkPreviews = [...currentPreviews, ...newPreviews];
        setBulkImagePreviews(updatedBulkPreviews);
        
        setParams(prev => {
            const newBulkImages = [...(prev.bulkImages || []), ...processedNewFiles];
            return { 
                ...prev, 
                bulkImages: newBulkImages, 
                frontProductImage: newBulkImages.length > 0 ? newBulkImages[0] : undefined 
            };
        });
        
        setFrontProductImagePreview(updatedBulkPreviews.length > 0 ? updatedBulkPreviews[0] : null);
    }, [bulkImagePreviews]);

    const handleRemoveBulkImage = useCallback((index: number) => {
        setBulkImagePreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]);
            newPreviews.splice(index, 1);
            if (index === 0) setFrontProductImagePreview(newPreviews.length > 0 ? newPreviews[0] : null);
            return newPreviews;
        });
        setParams(prev => {
            const currentBulk = prev.bulkImages ? [...prev.bulkImages] : [];
            currentBulk.splice(index, 1);
            return { ...prev, bulkImages: currentBulk, frontProductImage: currentBulk.length > 0 ? currentBulk[0] : undefined };
        });
    }, []);

    const handleGenerate = useCallback(async (currentParams: GenerateImageParams, brandKit: BrandKit | null, previewUrlOverride?: string) => {
        if (isGeneratingRef.current) return;
        isGeneratingRef.current = true;
        
        // Critical Fix: Sync state race condition
        // If frontProductImage is missing in params but exists in preview (common after fresh login/upload), restore it.
        let finalParams = { ...currentParams };
        if (!finalParams.frontProductImage && previewUrlOverride && previewUrlOverride.startsWith('blob:')) {
            try {
                const response = await fetch(previewUrlOverride);
                const blob = await response.blob();
                const restoredFile = new File([blob], "restored_upload.png", { type: blob.type });
                finalParams.frontProductImage = restoredFile;
            } catch (e) {
                console.warn("Failed to sync file from preview", e);
            }
        }

        const cost = calculateGenerationCost(finalParams, userTier);
        
        // Limit check: Max 5 generations per request
        if (cost > 5) {
            setError("You can only generate up to 5 images at once. Please deselect some options.");
            isGeneratingRef.current = false;
            return;
        }

        const isFreeTrialGeneration = userTier === 'Free' && finalParams.resolutionQuality === ResolutionQuality.Standard && cost > 0 && cost <= (FREE_TRIAL_LIMIT - freeGenerationsUsed);
        
        if (!isFreeTrialGeneration && !checkAndDeductCredits(cost)) { 
            isGeneratingRef.current = false; 
            return; 
        }
        
        generationModeRef.current = finalParams.appMode;
        setIsLoading(true);
        setError(null);
        setActiveMode(null); 
        setGeneratedImages([]); // Clear previous
        
        try {
            const results = await generateImages(
                finalParams, 
                userTier, 
                brandKit, 
                previewUrlOverride ?? frontProductImagePreview ?? undefined, 
                (current, total) => setBatchProgress({ current, total })
            );
            setGeneratedImages(results);
            if (isFreeTrialGeneration) {
                setFreeGenerationsUsed(prev => prev + cost);
            }
            return results;
        } catch (err: any) {
            if (!isFreeTrialGeneration) refundCredits(cost);
            setError(err.message || 'Generation failed');
            // Restore the form so the user doesn't lose their place
            setActiveMode(generationModeRef.current);
            return [];
        } finally {
            setIsLoading(false);
            isGeneratingRef.current = false; 
        }
    }, [userTier, freeGenerationsUsed, frontProductImagePreview, checkAndDeductCredits, refundCredits, setFreeGenerationsUsed]);

    return {
        params, setParams,
        activeMode, setActiveMode,
        lastActiveMode, setLastActiveMode,
        generatedImages, setGeneratedImages,
        isLoading, batchProgress, error, loadingMessages,
        frontProductImagePreview, setFrontProductImagePreview,
        bulkImagePreviews, setBulkImagePreviews,
        remixReferenceImagePreview, setRemixReferenceImagePreview,
        remixProductImagePreview, setRemixProductImagePreview,
        handleSelectMode,
        handleResetParams,
        handleFileChange,
        handleBulkFilesChange,
        handleRemoveBulkImage,
        handleGenerate,
        setError
    };
};
