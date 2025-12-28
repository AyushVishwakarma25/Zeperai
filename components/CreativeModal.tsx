
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { GenerateImageParams, GeneratedImage, SavedModel } from '../types';
import { AspectRatio, AppMode, ResolutionQuality } from '../types';
import { FREE_TRIAL_LIMIT } from '../constants';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { ImageDropzone } from './ui/ImageDropzone';
import { FormTextArea } from './ui/Form';
import { calculateGenerationCost } from '../utils/costs';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { SectionTitle } from './modes/shared';

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
  frontProductImagePreview: string | null;
  setFrontProductImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  remixReferenceImagePreview: string | null;
  setRemixReferenceImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  remixProductImagePreview: string | null;
  setRemixProductImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  onGenerateVariants: (field: 'modelPersona' | 'poseSuggestion') => void;
  userTier: 'Free' | 'Starter' | 'Standard' | 'Agency';
  onOpenPricingModal: () => void;
  freeGenerationsUsed: number;
  savedModels: SavedModel[];
}

export const CreativeModal: React.FC<CreativeModalProps> = ({ 
    mode, onClose, params, onParamsChange, onGenerate, isLoading,
    onFileChange, frontProductImagePreview, setFrontProductImagePreview,
    remixReferenceImagePreview, setRemixReferenceImagePreview,
    remixProductImagePreview, setRemixProductImagePreview,
    onGenerateVariants, storyboardSourceImage, onClearStoryboardSource,
    userTier, onOpenPricingModal, freeGenerationsUsed,
    savedModels
}) => {
  const isOnline = useNetworkStatus();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleParamChange = useCallback((param: keyof GenerateImageParams, value: any) => {
    onParamsChange(prev => ({ ...prev, [param]: value }));
  }, [onParamsChange]);

  const isFashion = mode === AppMode.Fashion;
  const isAdCreative = [AppMode.AdCreative, AppMode.Youtube, AppMode.Banner].includes(mode);

  // Cost Calculation
  const cost = useMemo(() => calculateGenerationCost(params, userTier), [params, userTier]);

  const isFreeTier = userTier === 'Free';
  const isStarterTier = userTier === 'Starter';
  const isStandardGeneration = params.resolutionQuality === ResolutionQuality.Standard;
  const isBulkOperation = cost > 1;
  const isProOperation = isBulkOperation || !isStandardGeneration;

  const remainingFreeGenerations = isFreeTier ? Math.max(0, FREE_TRIAL_LIMIT - freeGenerationsUsed) : 0;
  const isFreeTrialGeneration = isFreeTier && isStandardGeneration && cost > 0 && cost <= remainingFreeGenerations;

  const needsUpgrade = isFreeTier && isProOperation && !isFreeTrialGeneration;
  const isHyperRealismLocked = isFreeTier || isStarterTier;

  // Validation
  const isValid = useMemo(() => {
      if (mode === AppMode.Remix) {
          if (!params.remixReferenceImage && !remixReferenceImagePreview) return false;
          if (!params.remixProductImage && !remixProductImagePreview) return false;
          return true;
      }
      const needsMainImage = [AppMode.Product, AppMode.Fashion, AppMode.Influencer, AppMode.Festival].includes(mode);
      if (needsMainImage && !params.bulkImages) {
          if (!params.frontProductImage && !frontProductImagePreview) return false;
      }
      if (mode === AppMode.AdCreative) {
          if (!params.frontProductImage && !frontProductImagePreview) return false;
          if (!params.adTitle || params.adTitle.trim() === '') return false;
      }
      if (!params.aspectRatios || params.aspectRatios.length === 0) return false;
      return true;
  }, [mode, params, frontProductImagePreview, remixReferenceImagePreview, remixProductImagePreview]);

  const getButtonText = () => {
      if (!isOnline) return 'Reconnecting...';
      if (isLoading) return 'Generating...';
      if (!isValid) return 'Complete Setup to Continue';
      if (needsUpgrade) return 'Upgrade for Pro Features';
      if (isFreeTrialGeneration) return `Generate ${cost} Image(s) (Free Trial)`;
      const creditText = `(${cost} Credit${cost > 1 ? 's' : ''})`;
      if (isFashion) return `Start Photoshoot ${creditText}`;
      if (mode === AppMode.Product) return `Generate ${cost} Image(s) ${creditText}`;
      return `Generate ${cost} Creative${cost > 1 ? 's' : ''} ${creditText}`;
  };

  const getModalTitle = () => {
      switch(mode) {
          case AppMode.Product: return 'Product Photoshoot Settings';
          case AppMode.Influencer: return 'Influencer Settings';
          case AppMode.Fashion: return 'Fashion Photoshoot Settings';
          case AppMode.AdCreative: return 'Ad Creative Settings';
          case AppMode.Remix: return 'Remix Studio';
          default: return `${mode} Settings`;
      }
  }

  const batchOptions = useMemo(() => {
      if (mode === AppMode.Product) return []; 
      if (isFashion) {
          if (userTier === 'Agency') return [4, 8, 12];
          if (userTier === 'Standard') return [1, 4];
          return [1];
      }
      if (userTier === 'Agency') return [1, 4, 8, 12];
      if (userTier === 'Standard') return [1, 4];
      return [1];
  }, [userTier, mode, isFashion]);
  
  const handleAspectRatioChange = (ratio: AspectRatio) => {
      if (userTier === 'Free' || userTier === 'Starter') {
            onParamsChange(prev => ({ ...prev, aspectRatios: [ratio] }));
            return;
      }
      onParamsChange(prev => {
          const currentRatios = prev.aspectRatios || [];
          const newRatios = currentRatios.includes(ratio)
              ? currentRatios.filter(r => r !== ratio)
              : [...currentRatios, ratio];
          return { ...prev, aspectRatios: newRatios };
      });
  };
  
  const handleAngleChange = (angle: string) => {
      if (userTier === 'Free' || userTier === 'Starter') {
            onParamsChange(prev => ({ ...prev, selectedAngles: [angle] }));
            return;
      }
      onParamsChange(prev => {
          const currentAngles = prev.selectedAngles || [];
          const newAngles = currentAngles.includes(angle)
              ? currentAngles.filter(a => a !== angle)
              : [...currentAngles, angle];
          return { ...prev, selectedAngles: newAngles };
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
            <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-white">
                <div className="flex items-center">
                    <Icon name="sparkles" className="w-6 h-6 mr-3 text-primary" />
                    <h2 className="text-xl font-bold text-slate-800">{getModalTitle()}</h2>
                </div>
                <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                    <Icon name="close" className="w-5 h-5"/>
                </button>
            </header>

            <div className="flex-grow flex flex-col md:flex-row overflow-y-auto md:overflow-hidden scrollbar-thin">
                {/* LEFT ASSETS PANEL */}
                <div className={`w-full ${mode === AppMode.Remix ? 'md:w-1/2' : 'md:w-1/3'} bg-slate-50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col gap-6 shrink-0`}>
                    {mode === AppMode.Remix ? (
                        <>
                            <SectionTitle title="REMIX ASSETS" />
                            <ImageDropzone 
                                id="remix-reference-image-upload"
                                prompt="Upload Scene Image"
                                previewUrl={remixReferenceImagePreview}
                                onFileChange={(file) => onFileChange(file, 'remixReferenceImage', setRemixReferenceImagePreview, { maxWidth: 1024, maxHeight: 1024 })}
                                className={`aspect-[3/2] md:aspect-auto w-full md:flex-grow ${!remixReferenceImagePreview ? 'border-red-200 bg-red-50' : ''}`}
                            />
                            <ImageDropzone 
                                id="remix-product-image-upload"
                                prompt="Upload New Product (Cutout)"
                                previewUrl={remixProductImagePreview}
                                onFileChange={(file) => onFileChange(file, 'remixProductImage', setRemixProductImagePreview, { maxWidth: 1024, maxHeight: 1024, format: 'image/png' })}
                                className={`aspect-[3/2] md:aspect-auto w-full md:flex-grow ${!remixProductImagePreview ? 'border-red-200 bg-red-50' : ''}`}
                            />
                        </>
                    ) : (
                        <>
                            <div className={`flex flex-col ${isAdCreative ? 'flex-shrink-0' : ''}`}>
                                <SectionTitle title="ASSETS" />
                                <ImageDropzone 
                                    id="asset-upload-main"
                                    prompt={isFashion ? "Fabric or Garment" : "Upload Product Image"}
                                    previewUrl={frontProductImagePreview}
                                    onFileChange={(file) => onFileChange(file, 'frontProductImage', setFrontProductImagePreview, { maxWidth: 2048, maxHeight: 2048, format: 'image/png' })}
                                    className={`w-full ${isAdCreative ? 'h-48 sm:h-56' : 'aspect-[3/2] md:h-64'} ${!frontProductImagePreview ? 'border-red-200 bg-red-50 animate-pulse' : ''}`}
                                />
                            </div>
                            {isAdCreative && (
                                <div className="flex flex-col mt-2">
                                    <p className="text-xs font-semibold text-black mb-2 uppercase tracking-wider">Brand Logo</p>
                                    <ImageDropzone 
                                        id="logo-upload-main"
                                        prompt="Upload Logo (Opt)"
                                        previewUrl={logoPreview}
                                        onFileChange={(file) => onFileChange(file, 'logoImage', setLogoPreview, { maxWidth: 512, maxHeight: 512, format: 'image/png' })}
                                        className="h-24 w-full"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* RIGHT SETTINGS PANEL */}
                <div className="flex-1 p-4 md:p-6 md:overflow-y-auto scrollbar-thin">
                    
                    {mode === AppMode.Remix ? (
                        <RemixControls 
                            params={params} 
                            handleParamChange={handleParamChange} 
                        />
                    ) : (
                        <>
                            <SectionTitle title="CREATIVE SETTINGS" />
                            <FormTextArea 
                                label="Product Description"
                                id="product-description"
                                placeholder="e.g., A refreshing watermelon-flavored energy drink in a sleek can."
                                value={params.productDescription}
                                onChange={e => handleParamChange('productDescription', e.target.value)}
                                rows={4}
                                className="!mb-0"
                            />
                        </>
                    )}

                    {mode === AppMode.Influencer && (
                        <InfluencerControls 
                            params={params} 
                            handleParamChange={handleParamChange} 
                            onGenerateVariants={onGenerateVariants}
                            savedModels={savedModels}
                        />
                    )}

                    {(mode === AppMode.Product) && (
                        <ProductControls 
                            params={params}
                            handleParamChange={handleParamChange}
                            handleAngleChange={handleAngleChange}
                        />
                    )}
                    
                    {isAdCreative && (
                        <AdCreativeControls 
                            params={params}
                            handleParamChange={handleParamChange}
                        />
                    )}

                    {mode === AppMode.Festival && (
                        <FestivalControls 
                            params={params}
                            handleParamChange={handleParamChange}
                        />
                    )}

                    {isFashion && (
                        <FashionControls 
                            params={params}
                            handleParamChange={handleParamChange}
                            isHyperRealismLocked={isHyperRealismLocked}
                            onOpenPricingModal={onOpenPricingModal}
                        />
                    )}
                    
                    <CommonControls 
                        params={params}
                        handleParamChange={handleParamChange}
                        handleAspectRatioChange={handleAspectRatioChange}
                        batchOptions={batchOptions}
                    />
                </div>
            </div>

            <footer className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
                 <div className="text-sm text-slate-500 flex items-center gap-2">
                    {cost > 0 && <span className="font-semibold text-primary">{cost} Credits</span>}
                 </div>
                 <Button 
                    onClick={handleMainAction} 
                    isLoading={isLoading} 
                    disabled={!isOnline || isLoading || !isValid || (cost === 0 && !isFreeTrialGeneration && !needsUpgrade)}
                    className={!isValid || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}
                 >
                    {getButtonText()}
                 </Button>
            </footer>
        </div>
    </div>
  );
};
