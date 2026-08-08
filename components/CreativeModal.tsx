
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { GenerateImageParams, GeneratedImage, SavedModel, BrandKit } from '../types';
import { AspectRatio, AppMode, ResolutionQuality } from '../types';
import { FREE_TRIAL_LIMIT } from '../constants';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { ImageDropzone } from './ui/ImageDropzone';
import { FormTextArea } from './ui/Form';
import { calculateGenerationCost } from '../utils/costs';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SectionTitle, HelpLabel } from './modes/shared';
import { toggleAspectRatio } from '../utils/configLogic';
import { Toggle } from './ui/Toggle';
import { analyzeProductContext } from '../services/geminiService';

// Mode Components
import { InfluencerControls } from './modes/InfluencerControls';
import { ProductControls } from './modes/ProductControls';
import { FashionControls } from './modes/FashionControls';
import { CommonControls } from './modes/CommonControls';
import { AdCreativeControls } from './modes/AdCreativeControls';
import { FestivalControls } from './modes/FestivalControls';
import { RemixControls } from './modes/RemixControls';

interface CreativeModalProps {
  mode: AppMode;
  onClose: () => void;
  params: GenerateImageParams;
  onParamsChange: React.Dispatch<React.SetStateAction<GenerateImageParams>>;
  onGenerate: (params: GenerateImageParams) => void;
  isLoading: boolean;
  storyboardSourceImage: GeneratedImage | null;
  onClearStoryboardSource: () => void;
  
  onFileChange: (file: File | null, paramName: keyof GenerateImageParams, previewSetter: React.Dispatch<React.SetStateAction<string | null>>, options: any) => void;
  
  // Single preview
  frontProductImagePreview: string | null;
  setFrontProductImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Bulk preview props
  bulkImagePreviews?: string[];
  onBulkFilesChange?: (files: File[]) => void;
  onRemoveBulkImage?: (index: number) => void;

  remixReferenceImagePreview: string | null;
  setRemixReferenceImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  remixProductImagePreview: string | null;
  setRemixProductImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  onGenerateVariants: (field: 'modelPersona' | 'poseSuggestion') => void;
  userTier: 'Free' | 'PayAsYouGo';
  onOpenPricingModal: () => void;
  freeGenerationsUsed: number;
  savedModels: SavedModel[];
  onReset: () => void;
  brandKit: BrandKit | null;
}

export const CreativeModal: React.FC<CreativeModalProps> = ({ 
    mode, onClose, params, onParamsChange, onGenerate, isLoading,
    onFileChange, frontProductImagePreview, setFrontProductImagePreview,
    bulkImagePreviews = [], onBulkFilesChange, onRemoveBulkImage,
    remixReferenceImagePreview, setRemixReferenceImagePreview,
    remixProductImagePreview, setRemixProductImagePreview,
    onGenerateVariants, storyboardSourceImage, onClearStoryboardSource,
    userTier, onOpenPricingModal, freeGenerationsUsed,
    savedModels, onReset, brandKit
}) => {
  const isOnline = useNetworkStatus();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [competitorPreview, setCompetitorPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      if (competitorPreview && competitorPreview.startsWith('blob:')) URL.revokeObjectURL(competitorPreview);
    };
  }, [logoPreview, competitorPreview]);

  const handleParamChange = useCallback((param: keyof GenerateImageParams, value: any) => {
    onParamsChange(prev => ({ ...prev, [param]: value }));
  }, [onParamsChange]);

  const isFashion = mode === AppMode.Fashion;
  const isAdCreative = [AppMode.AdCreative, AppMode.Youtube, AppMode.Banner].includes(mode);
  const isInfluencerMode = mode === AppMode.Influencer;
  const isComparisonAd = isAdCreative && params.isComparisonMode;

  const [suggestedEnvironments, setSuggestedEnvironments] = useState<string[]>([]);
  const [analyzingContext, setAnalyzingContext] = useState(false);

  const handleAnalyzeContext = useCallback(async (file: File) => {
    setAnalyzingContext(true);
    try {
        const result = await analyzeProductContext(file);
        setSuggestedEnvironments(result.environments);
        
        // Auto-fill fashion details if in Fashion mode
        if (mode === AppMode.Fashion && result.fashionInfo) {
            const info = result.fashionInfo;
            onParamsChange(prev => ({
                ...prev,
                fashionGender: (info.gender || prev.fashionGender) as any,
                fashionCategory: info.category || prev.fashionCategory,
                fashionSubCategory: info.subCategory || prev.fashionSubCategory,
                // Do NOT fill productDescription for Fashion to avoid AI confusion
            }));
        } 
        // Standard analysis for other modes - do NOT auto-fill description
        else if (result.context.length > 0) {
            // We still analyze to get suggestedEnvironments, but we don't touch productDescription
        }
    } catch (e) {
        console.error(e);
    } finally {
        setAnalyzingContext(false);
    }
  }, [params.productDescription, onParamsChange, mode]);

  useEffect(() => {
    if (params.frontProductImage && suggestedEnvironments.length === 0 && !analyzingContext) {
        handleAnalyzeContext(params.frontProductImage);
    }
  }, [params.frontProductImage, suggestedEnvironments.length, analyzingContext, handleAnalyzeContext]);

  const cost = useMemo(() => calculateGenerationCost(params, userTier), [params, userTier]);

  const isFreeTier = userTier === 'Free';
  const isStandardGeneration = params.resolutionQuality === ResolutionQuality.Standard;
  const isProOperation = cost > 1 || !isStandardGeneration;

  const remainingFreeGenerations = isFreeTier ? Math.max(0, FREE_TRIAL_LIMIT - freeGenerationsUsed) : 0;
  const isFreeTrialGeneration = isFreeTier && isStandardGeneration && cost > 0 && cost <= remainingFreeGenerations;
  const needsUpgrade = isFreeTier && (mode !== AppMode.Product || (isProOperation && !isFreeTrialGeneration));

  const isValid = useMemo(() => {
      if (mode === AppMode.Remix) {
          const hasScene = !!params.remixReferenceImage || !!remixReferenceImagePreview || !!params.remixReferenceImageUrl;
          const hasProduct = !!params.frontProductImage || !!frontProductImagePreview || (params.bulkImages && params.bulkImages.length > 0) || (bulkImagePreviews && bulkImagePreviews.length > 0);
          return hasScene && hasProduct;
      }
      const needsMainImage = [AppMode.Product, AppMode.Fashion, AppMode.Influencer, AppMode.Festival, AppMode.Bulk].includes(mode);
      if (needsMainImage) {
          const hasSingle = !!params.frontProductImage || !!frontProductImagePreview;
          const hasBulk = (params.bulkImages && params.bulkImages.length > 0) || (bulkImagePreviews && bulkImagePreviews.length > 0);
          if (!hasSingle && !hasBulk) return false;
      }
      return !!params.aspectRatios && params.aspectRatios.length > 0;
  }, [mode, params, frontProductImagePreview, bulkImagePreviews, remixReferenceImagePreview]);

  const getButtonText = () => {
      if (!isOnline) return 'Reconnecting...';
      if (isLoading) return 'Generating...';
      if (!isValid) return 'Complete Setup';
      if (needsUpgrade) return 'Upgrade to Pro';
      if (isFreeTrialGeneration) return `Generate (Free Trial)`;
      return `Generate (${cost} ${cost === 1 ? 'Credit' : 'Credits'})`;
  };

  const getModalTitle = () => {
      switch(mode) {
          case AppMode.Product: return 'Product Studio';
          case AppMode.Influencer: return 'AI UGC Influencer';
          case AppMode.Fashion: return 'Fashion Studio';
          case AppMode.AdCreative: return 'Ad Generator';
          case AppMode.Remix: return 'Remix Studio';
          default: return `${mode} Settings`;
      }
  }

    const handleAspectRatioChange = (ratio: AspectRatio) => {
        if (mode === AppMode.Fashion) {
            // Restrict Fashion Studio to a single aspect ratio
            onParamsChange(prev => ({
                ...prev,
                aspectRatios: [ratio]
            }));
        } else if (mode === AppMode.Product) {
            // Restrict Product Studio to a single aspect ratio if multiple presets or angles are selected
            onParamsChange(prev => {
                const hasMultiplePresets = prev.productStylePresets && prev.productStylePresets.length > 1;
                const hasMultipleAngles = prev.selectedAngles && prev.selectedAngles.length > 1;
                if (hasMultiplePresets || hasMultipleAngles) {
                    return { ...prev, aspectRatios: [ratio] };
                }
                return { ...prev, aspectRatios: toggleAspectRatio(prev.aspectRatios || [], ratio, userTier) };
            });
        } else {
            onParamsChange(prev => ({
                ...prev,
                aspectRatios: toggleAspectRatio(prev.aspectRatios || [], ratio, userTier)
            }));
        }
    };

  const handleAngleChange = (angle: string) => {
      onParamsChange(prev => {
          const current = prev.selectedAngles || [];
          if (current.includes(angle)) {
              return { ...prev, selectedAngles: current.filter(a => a !== angle) };
          } else {
              return { ...prev, selectedAngles: [...current, angle] };
          }
      });
  };

  const handleMainAction = () => {
      if (!isValid) return; 
      if (needsUpgrade) onOpenPricingModal();
      else onGenerate(params);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div 
            className="bg-main w-full max-w-6xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in-scale-up"
            onClick={e => e.stopPropagation()}
        >
            <header className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <div className="flex items-center">
                    <Icon name="sparkles" className="w-6 h-6 mr-3 text-primary" />
                    <h2 className="text-xl font-bold text-slate-800">{getModalTitle()}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onReset} className="text-xs font-medium text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors mr-2 flex items-center">
                        <Icon name="remove" className="w-3 h-3 mr-1" /> Reset
                    </button>
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </div>
            </header>

            <div className="flex-grow flex flex-col md:flex-row overflow-y-auto md:overflow-hidden scrollbar-thin">
                {/* ASSETS PANEL */}
                <div className={`w-full ${mode === AppMode.Remix ? 'md:w-1/2' : 'md:w-1/3'} bg-slate-50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col gap-6 shrink-0`}>
                    {mode === AppMode.Remix ? (
                        <>
                            <SectionTitle title="PRECISION ASSETS" />
                            <div>
                                <HelpLabel label="1. Scene (Spatial Blueprint)" tooltip="AI will replicate this angle and lighting setup exactly." />
                                <ImageDropzone 
                                    id="remix-reference-image-upload"
                                    prompt="Upload Scene Template"
                                    previewUrl={remixReferenceImagePreview}
                                    onFileChange={(file) => onFileChange(file, 'remixReferenceImage', setRemixReferenceImagePreview, { maxWidth: 1024, maxHeight: 1024 })}
                                    className={`aspect-[3/2] md:aspect-auto w-full md:h-48 ${!remixReferenceImagePreview ? 'border-primary border-dashed bg-primary/5' : ''}`}
                                />
                            </div>
                            <div>
                                <HelpLabel label="2. Product (Immutable Identity)" tooltip="Upload clear product shots. Labels and packaging will be strictly preserved." />
                                <ImageDropzone 
                                    id="remix-product-upload"
                                    prompt="Upload Product Asset"
                                    multiple={true}
                                    maxFiles={5}
                                    previewUrls={bulkImagePreviews} 
                                    onFilesChange={onBulkFilesChange}
                                    onRemoveFile={onRemoveBulkImage}
                                    className={`aspect-[3/2] md:aspect-auto w-full md:flex-grow ${(!bulkImagePreviews || bulkImagePreviews.length === 0) ? 'border-primary border-dashed bg-primary/5' : ''}`}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <SectionTitle title="ASSETS" />
                            <ImageDropzone 
                                id="asset-upload-main"
                                prompt={isComparisonAd ? "Your Product Image" : "Upload Product Image(s)"}
                                icon={isInfluencerMode ? "shirt" : (isAdCreative ? "megaphone" : undefined)}
                                multiple={!isInfluencerMode && !isComparisonAd}
                                maxFiles={5}
                                previewUrls={(!isInfluencerMode && !isComparisonAd) ? bulkImagePreviews : undefined} 
                                onFilesChange={onBulkFilesChange}
                                onRemoveFile={onRemoveBulkImage}
                                previewUrl={(isInfluencerMode || isComparisonAd) ? frontProductImagePreview : undefined}
                                onFileChange={(isInfluencerMode || isComparisonAd) ? (file) => onFileChange(file, 'frontProductImage', setFrontProductImagePreview, { maxWidth: 1024, maxHeight: 1024 }) : undefined}
                                className={`w-full ${isAdCreative ? 'h-40 sm:h-48' : 'aspect-[3/2] md:h-64'} ${!frontProductImagePreview ? 'border-primary border-dashed bg-primary/5 ring-2 ring-primary/20 animate-pulse' : ''}`}
                            />
                            {isComparisonAd && (
                                <div className="mt-4">
                                    <HelpLabel label="Competitor Product" />
                                    <ImageDropzone 
                                        id="competitor-upload"
                                        prompt="Upload Competitor Image"
                                        previewUrl={competitorPreview}
                                        onFileChange={(file) => onFileChange(file, 'competitorImage', setCompetitorPreview, { maxWidth: 1024, maxHeight: 1024 })}
                                        className="h-40 w-full"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* SETTINGS PANEL */}
                <div className="flex-1 p-4 md:p-6 md:overflow-y-auto scrollbar-thin">
                    {mode === AppMode.Remix ? (
                        <RemixControls params={params} handleParamChange={handleParamChange} />
                     ) : (
                        <>
                            <SectionTitle title="CREATIVE SETTINGS" />

                            <FormTextArea 
                                label="Description & Context"
                                id="product-description"
                                placeholder="e.g. A premium, minimal energy drink in a sleek metallic can."
                                value={params.productDescription}
                                onChange={e => handleParamChange('productDescription', e.target.value)}
                                rows={4}
                            />

                            {suggestedEnvironments.length > 0 && (
                                <div className="mt-4 animate-fade-in">
                                    <HelpLabel label="Magic Scene Suggestions" tooltip="AI analyzed your product and suggested these high-converting environments." />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {suggestedEnvironments.map((env, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleParamChange('backdropAndProps', env)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                                                    params.backdropAndProps === env 
                                                    ? 'bg-primary text-white border-primary shadow-sm' 
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                                                }`}
                                            >
                                                {env}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analyzingContext && (
                                <div className="mt-4 flex items-center gap-2 text-primary animate-pulse">
                                    <Icon name="sparkles" className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Analyzing Product Context...</span>
                                </div>
                            )}
                        </>
                    )}

                    {isInfluencerMode && <InfluencerControls params={params} handleParamChange={handleParamChange} onGenerateVariants={onGenerateVariants} savedModels={savedModels} />}
                    {mode === AppMode.Product && <ProductControls params={params} handleParamChange={handleParamChange} handleAngleChange={handleAngleChange} />}
                    {isAdCreative && <AdCreativeControls params={params} handleParamChange={handleParamChange} />}
                    {mode === AppMode.Festival && <FestivalControls params={params} handleParamChange={handleParamChange} />}
                    {isFashion && <FashionControls params={params} handleParamChange={handleParamChange} isHyperRealismLocked={userTier === 'Free'} onOpenPricingModal={onOpenPricingModal} userTier={userTier} />}
                    
                    <CommonControls 
                        params={params}
                        handleParamChange={handleParamChange}
                        handleAspectRatioChange={handleAspectRatioChange}
                        userTier={userTier}
                        hideMultiSelectLabel={isFashion || (mode === AppMode.Product && ((params.productStylePresets?.length || 0) > 1 || (params.selectedAngles?.length || 0) > 1))}
                    />
                </div>
            </div>

            <footer className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
                 <div className="text-xs sm:text-sm font-bold text-primary shrink-0">
                    {cost > 0 && `${cost} ${cost === 1 ? 'Credit' : 'Credits'} Required`}
                 </div>
                 <Button 
                   onClick={handleMainAction} 
                   isLoading={isLoading} 
                   disabled={!isOnline || !isValid}
                   className="!py-2 !px-3 sm:!px-5 !text-xs sm:!text-sm font-bold whitespace-nowrap"
                 >
                    {getButtonText()}
                 </Button>
            </footer>
        </div>
    </div>
  );
};
