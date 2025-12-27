
import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Fix: Add SavedModel to type imports
import type { GenerateImageParams, GeneratedImage, BrandKit, StoryboardScene, ProProductStyleCategory, SavedModel } from '../types';
import { 
  AspectRatio, AppMode, OutputFormat, MarketplacePreset, 
  FashionGender, FashionShootType, FashionBodyType, 
  FashionAgeBracket, RegionalStyle, ModelGender, 
  ProductCategory, ClothingType,
  ModelChoice, OutfitChoice, StylePreset, AdLayout, ResolutionQuality
} from '../types';
import { 
  MARKETPLACE_RULES,
  FASHION_CATEGORIES,
  FASHION_MODEL_LOCKS,
  AI_SUGGESTED,
  PRODUCT_CATEGORY_OPTIONS,
  MODEL_GENDER_OPTIONS,
  MODEL_PERSONA_OPTIONS,
  CUSTOM_PERSONA_TRIGGER,
  SKIN_TONE_OPTIONS,
  POSE_SUGGESTIONS,
  CUSTOM_POSE_TRIGGER,
  CLOTHING_TYPE_OPTIONS,
  ANGLE_OPTIONS,
  PRO_PRODUCT_STYLE_PRESETS,
  AD_LAYOUT_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  OUTPUT_FORMAT_OPTIONS,
  RESOLUTION_QUALITY_OPTIONS,
  STYLE_PRESET_OPTIONS,
  ALL_BACKGROUND_OPTIONS,
  FESTIVAL_STYLE_OPTIONS,
  FREE_TRIAL_LIMIT,
} from '../constants';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { ImageDropzone } from './ui/ImageDropzone';
import { Select } from './ui/Select';
import { FormInput, FormTextArea } from './ui/Form';
import { Toggle } from './ui/Toggle';

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
  // Fix: Destructure savedModels from props
  savedModels: SavedModel[];
}

const SectionTitle: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
    <h3 className={`text-xs font-semibold text-black uppercase tracking-wider mb-3 ${className || ''}`}>{title}</h3>
);

const ControlButton: React.FC<{
  onClick: () => void;
  selected: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, selected, children, className }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border ${
      selected
        ? 'bg-primary text-white border-primary shadow-sm'
        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
    } ${className}`}
  >
    {children}
  </button>
);


export const CreativeModal: React.FC<CreativeModalProps> = ({ 
    mode, onClose, params, onParamsChange, onGenerate, isLoading,
    onFileChange, frontProductImagePreview, setFrontProductImagePreview,
    remixReferenceImagePreview, setRemixReferenceImagePreview,
    remixProductImagePreview, setRemixProductImagePreview,
    onGenerateVariants, storyboardSourceImage, onClearStoryboardSource,
    userTier, onOpenPricingModal, freeGenerationsUsed,
    savedModels
}) => {
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

  const applyPreset = (preset: MarketplacePreset) => {
      const rules = MARKETPLACE_RULES[preset];
      onParamsChange(prev => ({
          ...prev,
          marketplacePreset: preset,
          aspectRatios: [rules.aspectRatio],
          backgroundStyle: rules.allowLifestyle ? prev.backgroundStyle : rules.background,
          outputFormat: rules.format,
      }));
  };
  
  const isFashion = mode === AppMode.Fashion;

  const cost = useMemo(() => {
      const numRatios = params.aspectRatios?.length || 0;
      if (numRatios === 0) return 0;

      let numVariants = 1;

      // Ensure cost calculation matches the enforcement logic in geminiService
      if (isFashion) {
          // Check limits logic matches backend
          let maxBatch = 1;
          if (userTier === 'Agency') maxBatch = 12;
          else if (userTier === 'Standard') maxBatch = 4;
          
          // Clamp requested batch size to allowed max
          const requested = params.batchSize || (maxBatch > 1 ? 4 : 1);
          numVariants = Math.min(requested, maxBatch);
          
      } else if (mode === AppMode.Product) {
          let maxAngles = 1;
          if (userTier === 'Agency') maxAngles = 10;
          else if (userTier === 'Standard') maxAngles = 4;
          // Free/Starter capped at 1
          
          const effectiveAngles = Math.min(params.selectedAngles.length, maxAngles);
          numVariants = effectiveAngles;
      } else {
          numVariants = params.batchSize || 1;
      }
      
      // If product mode has 0 valid angles, cost is 0
      if (mode === AppMode.Product && numVariants === 0) return 0;

      let baseCost = numVariants * numRatios;

      // Apply High Quality Multiplier (4x) only if user is on Pro/Agency tier
      const isProTier = userTier === 'Standard' || userTier === 'Agency';
      if (params.resolutionQuality === ResolutionQuality.High && isProTier) {
          baseCost *= 4;
      }

      return baseCost;
  }, [params, isFashion, mode, userTier]);

  const isFreeTier = userTier === 'Free';
  const isStarterTier = userTier === 'Starter';
  const isStandardGeneration = params.resolutionQuality === ResolutionQuality.Standard;
  const isBulkOperation = cost > 1;
  const isProOperation = isBulkOperation || !isStandardGeneration;

  const remainingFreeGenerations = isFreeTier ? Math.max(0, FREE_TRIAL_LIMIT - freeGenerationsUsed) : 0;
  const isFreeTrialGeneration = isFreeTier && isStandardGeneration && cost > 0 && cost <= remainingFreeGenerations;

  const needsUpgrade = isFreeTier && isProOperation && !isFreeTrialGeneration;
  
  const isHyperRealismLocked = isFreeTier || isStarterTier;

  const getButtonText = () => {
      if (isLoading) return 'Generating...';
      
      const hasRatios = params.aspectRatios && params.aspectRatios.length > 0;
      
      if (!hasRatios) {
          return 'Select an Aspect Ratio';
      }

      if (mode === AppMode.Product && params.selectedAngles.length === 0) {
          return 'Select an Angle';
      }
      
      if (cost === 0) {
          return 'Complete Setup to Generate';
      }
      
      if (needsUpgrade) {
          return 'Upgrade for Pro Features';
      }
      
      if (isFreeTrialGeneration) {
          const plural = cost > 1 ? 's' : '';
          return `Generate ${cost} Image${plural} (Free Trial)`;
      }
      
      const creditText = `(${cost} Credit${cost > 1 ? 's' : ''})`;

      if (isFashion) return `Start Photoshoot ${creditText}`;
      if (mode === AppMode.Product) return `Generate ${cost} Image(s) ${creditText}`;
      
      return `Generate ${cost} Creative${cost > 1 ? 's' : ''} ${creditText}`;
  };

  const productStylePresetOptions = () => {
    return [
      <option key="ai-suggested" value={AI_SUGGESTED}>✨ AI Suggested</option>,
      ...(PRO_PRODUCT_STYLE_PRESETS as ProProductStyleCategory[]).map((category) => (
          <optgroup label={category.category} key={category.category}>
            {category.presets.map((preset) => (<option key={`${category.category}|${preset.name}`} value={`${category.category}|${preset.name}`}>{preset.name}</option>))}
          </optgroup>
        ))
    ];
  };

  const backgroundOptionsForCategory = ALL_BACKGROUND_OPTIONS[params.productCategory] || ALL_BACKGROUND_OPTIONS[ProductCategory.Generic];
  const backgroundOptions = Object.keys(backgroundOptionsForCategory).map((group) => (
      <optgroup label={group} key={group}>
          {backgroundOptionsForCategory[group].map(option => <option key={option} value={option}>{option}</option>)}
      </optgroup>
  ));
  
  const getModalTitle = () => {
      switch(mode) {
          case AppMode.Product: return 'Product Photoshoot Settings';
          case AppMode.Influencer: return 'Influencer Settings';
          case AppMode.Fashion: return 'Fashion Photoshoot Settings';
          case AppMode.AdCreative: return 'Ad Creative Settings';
          case AppMode.Youtube: return 'YouTube Thumbnail Settings';
          case AppMode.Banner: return 'Banner Settings';
          case AppMode.Festival: return 'Festival Photoshoot Settings';
          case AppMode.Remix: return 'Remix Studio';
          default: return `${mode} Settings`;
      }
  }

  // --- Logic lifted from previous renderContent function ---
  const isAdCreative = [AppMode.AdCreative, AppMode.Youtube, AppMode.Banner].includes(mode);
    
  // Fashion specific derived state
  const gender = params.fashionGender || FashionGender.Women;
  const categories = isFashion ? FASHION_CATEGORIES[gender] : {};
  const category = params.fashionCategory || (isFashion ? Object.keys(categories)[0] : '');
  const subCategories = isFashion && categories[category] ? categories[category] : [];
  const locks = isFashion ? FASHION_MODEL_LOCKS[gender] || [] : [];

  const batchOptions = useMemo(() => {
      if (mode === AppMode.Product) return []; 
      
      // Fashion Mode Batch Logic
      if (isFashion) {
          if (userTier === 'Agency') return [4, 8, 12];
          if (userTier === 'Standard') return [1, 4];
          return [1]; // Free/Starter restricted to single generation
      }

      // Standard Modes
      if (userTier === 'Agency') return [1, 4, 8, 12];
      if (userTier === 'Standard') return [1, 4];
      return [1]; // Free/Starter
  }, [userTier, mode, isFashion]);
  
  const handleAspectRatioChange = (ratio: AspectRatio) => {
      // Enforce single aspect ratio for Free and Starter tiers to limit credit usage
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
      // Enforce single angle selection for Free and Starter tiers to limit load
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

  const commonOutputSettings = (
      <>
          <SectionTitle title="OUTPUT SETTINGS" className="mt-6" />
          <label className="block text-sm font-semibold text-black mb-2">Aspect Ratio</label>
          <div className="grid grid-cols-4 gap-2">
              {ASPECT_RATIO_OPTIONS.map(opt => (
                  <ControlButton key={opt.value} onClick={() => handleAspectRatioChange(opt.value)} selected={params.aspectRatios?.includes(opt.value)}>
                      <Icon name={opt.icon} className="w-4 h-4" /><span>{opt.label}</span>
                  </ControlButton>
              ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
              <Select label="Format" value={params.outputFormat} onChange={e => handleParamChange('outputFormat', e.target.value)}>
                  {OUTPUT_FORMAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
              <Select label="Quality" value={params.resolutionQuality} onChange={e => handleParamChange('resolutionQuality', e.target.value)}>
                  {RESOLUTION_QUALITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
          </div>

          {mode !== AppMode.Product && batchOptions.length > 0 && (
              <div className="mt-6">
                  <label className="block text-sm font-semibold text-black mb-2">Batch Size</label>
                  <div className="grid grid-cols-4 gap-2">
                      {batchOptions.map(count => (
                          <ControlButton key={count} onClick={() => handleParamChange('batchSize', count)} selected={params.batchSize === count}>
                              {count}
                          </ControlButton>
                      ))}
                  </div>
              </div>
          )}
      </>
  );

  const handleMainAction = () => {
      if (needsUpgrade) {
          onOpenPricingModal();
      } else {
          onGenerate(params);
      }
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
                                className="aspect-[3/2] md:aspect-auto w-full md:flex-grow"
                            />
                            <ImageDropzone 
                                id="remix-product-image-upload"
                                prompt="Upload New Product (Cutout)"
                                previewUrl={remixProductImagePreview}
                                onFileChange={(file) => onFileChange(file, 'remixProductImage', setRemixProductImagePreview, { maxWidth: 1024, maxHeight: 1024, format: 'image/png' })}
                                className="aspect-[3/2] md:aspect-auto w-full md:flex-grow"
                            />
                        </>
                    ) : (
                        <>
                            <div className="flex flex-col">
                                <SectionTitle title="ASSETS" />
                                <ImageDropzone 
                                    id="asset-upload-main"
                                    prompt={isFashion ? "Fabric or Garment" : "Upload Product Image"}
                                    previewUrl={frontProductImagePreview}
                                    onFileChange={(file) => onFileChange(file, 'frontProductImage', setFrontProductImagePreview, { maxWidth: 2048, maxHeight: 2048, format: 'image/png' })}
                                    className="aspect-[3/2] md:h-64 w-full"
                                />
                            </div>
                            {isAdCreative && (
                                <div className="flex flex-col">
                                    <ImageDropzone 
                                        id="logo-upload-main"
                                        prompt="Upload Brand Logo (Optional)"
                                        previewUrl={logoPreview}
                                        onFileChange={(file) => onFileChange(file, 'logoImage', setLogoPreview, { maxWidth: 512, maxHeight: 512, format: 'image/png' })}
                                        className="h-32 md:h-auto md:aspect-square w-full md:flex-grow"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* RIGHT SETTINGS PANEL */}
                <div className="flex-1 p-4 md:p-6 md:overflow-y-auto scrollbar-thin">
                    {mode === AppMode.Remix ? (
                        <>
                            <SectionTitle title="REMIX SETTINGS" />
                            <FormTextArea
                                label="Modification Prompt"
                                id="remix-prompt"
                                placeholder="e.g., Change the fruits to lemons and make the background blue. (Leave blank to auto-adapt)"
                                rows={4}
                                value={params.productDescription}
                                onChange={e => handleParamChange('productDescription', e.target.value)}
                            />
                        </>
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
                        <>
                            <SectionTitle title="INFLUENCER DETAILS" className="mt-6" />
                            <Select label="Product Category" value={params.productCategory} onChange={e => handleParamChange('productCategory', e.target.value)}>
                                {PRODUCT_CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </Select>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">Gender</label>
                                    <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                                        {MODEL_GENDER_OPTIONS.map(opt => (
                                            <button key={opt.value} onClick={() => handleParamChange('modelGender', opt.value)} className={`flex-1 py-1.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 ${params.modelGender === opt.value ? 'bg-primary text-white shadow-sm' : 'text-slate-700'}`}>
                                                <Icon name={opt.icon} className="w-4 h-4" />
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                <label className="block text-sm font-semibold text-black mb-2">Skin Tone</label>
                                    <div className="flex space-x-2 items-center h-10">
                                    {SKIN_TONE_OPTIONS.map(option => (
                                        <button key={option.value} onClick={() => handleParamChange('skinTone', option.value)}
                                            className={`w-8 h-8 rounded-full transition-all border-2 ${params.skinTone === option.value ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-slate-200 bg-clip-content p-0.5 hover:scale-105'}`}
                                            style={{ backgroundColor: option.color }}
                                        />
                                    ))}
                                </div>
                                </div>
                            </div>
                            {/* Fix: Add UI for selecting new or existing model */}
                            <div className="mt-4">
                                <label className="block text-sm font-semibold text-black mb-2">Model Source</label>
                                <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                                    <button onClick={() => handleParamChange('modelSourceOption', 'new')} className={`flex-1 py-1.5 rounded-md text-sm font-semibold ${params.modelSourceOption === 'new' ? 'bg-primary text-white shadow-sm' : 'text-slate-700'}`}>
                                        New Model
                                    </button>
                                    <button onClick={() => handleParamChange('modelSourceOption', 'existing')} className={`flex-1 py-1.5 rounded-md text-sm font-semibold ${params.modelSourceOption === 'existing' ? 'bg-primary text-white shadow-sm' : 'text-slate-700'}`}>
                                        Existing Model
                                    </button>
                                </div>
                            </div>
                            {params.modelSourceOption === 'existing' && (
                                <div className="mt-4">
                                    <Select label="Select Saved Model" value={params.modelSeedId || ''} onChange={e => handleParamChange('modelSeedId', e.target.value)} disabled={savedModels.length === 0}>
                                        <option value="">Select a model</option>
                                        {savedModels.length > 0 ? (
                                            savedModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)
                                        ) : (
                                            <option value="" disabled>No saved models found</option>
                                        )}
                                    </Select>
                                </div>
                            )}
                            <div className="relative mt-4">
                                <Select label="Model Persona" value={params.modelPersona} onChange={e => handleParamChange('modelPersona', e.target.value)}>
                                    {Object.keys(MODEL_PERSONA_OPTIONS).map(group => ( <optgroup key={group} label={group}> {MODEL_PERSONA_OPTIONS[group].map(opt => <option key={opt} value={opt}>{opt}</option>)} </optgroup> ))}
                                </Select>
                                <button onClick={() => onGenerateVariants('modelPersona')} className="absolute top-8 right-2 p-1 text-slate-400 hover:text-primary"><Icon name="sparkles" className="w-4 h-4"/></button>
                            </div>
                            <div className="relative mt-4">
                                <Select label="Pose / Action" value={params.poseSuggestion} onChange={e => handleParamChange('poseSuggestion', e.target.value)}>
                                    {POSE_SUGGESTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </Select>
                                <button onClick={() => onGenerateVariants('poseSuggestion')} className="absolute top-8 right-2 p-1 text-slate-400 hover:text-primary"><Icon name="sparkles" className="w-4 h-4"/></button>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-semibold text-black mb-2">Outfit Type</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {CLOTHING_TYPE_OPTIONS.map(opt => (
                                        <ControlButton key={opt.value} onClick={() => handleParamChange('clothingType', opt.value)} selected={params.clothingType === opt.value}>
                                        <Icon name={opt.icon} className="w-4 h-4" /> <span>{opt.label}</span>
                                        </ControlButton>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4"><Select label="Background Style" value={params.backgroundStyle} onChange={e => handleParamChange('backgroundStyle', e.target.value)}>{backgroundOptions}</Select></div>
                        </>
                    )}

                    {(mode === AppMode.Product) && (
                        <>
                            <SectionTitle title="PHOTOSHOOT STYLE" className="mt-6" />
                            <label className="block text-sm font-semibold text-black mb-2">Product Angles</label>
                            <div className="grid grid-cols-3 gap-2">
                                {ANGLE_OPTIONS.map(opt => ( 
                                    <ControlButton key={opt.value} onClick={() => handleAngleChange(opt.value)} selected={params.selectedAngles?.includes(opt.value)}> 
                                        {opt.label} 
                                    </ControlButton> 
                                ))}
                            </div>
                            <div className="mt-4"><Select label="Visual Style Preset" value={params.productStylePreset} onChange={e => handleParamChange('productStylePreset', e.target.value)}>{productStylePresetOptions()}</Select></div>
                        </>
                    )}
                    
                    {isAdCreative && (
                        <>
                            <SectionTitle title="AD CREATIVE DETAILS" className="mt-6" />
                            <div className="space-y-4">
                                <Select label="Ad Layout" value={params.adLayout || ''} onChange={e => handleParamChange('adLayout', e.target.value)}>
                                    {AD_LAYOUT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                                <FormInput 
                                    label="Ad Title"
                                    id="ad-title"
                                    placeholder="e.g. Summer Sale 50% Off"
                                    value={params.adTitle || ''}
                                    onChange={e => handleParamChange('adTitle', e.target.value)}
                                />
                                <FormInput 
                                    label="Subheading"
                                    id="ad-subheading"
                                    placeholder="e.g. Limited time offer"
                                    value={params.adSubheading || ''}
                                    onChange={e => handleParamChange('adSubheading', e.target.value)}
                                />
                                <FormInput 
                                    label="CTA Button"
                                    id="ad-cta"
                                    placeholder="e.g. Shop Now"
                                    value={params.adCta || ''}
                                    onChange={e => handleParamChange('adCta', e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    {mode === AppMode.Festival && (
                        <>
                            <SectionTitle title="FESTIVAL THEME" className="mt-6" />
                            <Select label="Festival Style" value={params.festivalStyle || ''} onChange={e => handleParamChange('festivalStyle', e.target.value)}>
                                <option value="">Select a Festival</option>
                                {FESTIVAL_STYLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </Select>
                        </>
                    )}

                    {isFashion && (
                        <>
                            <SectionTitle title="FASHION SHOOT DETAILS" className="mt-6" />
                            <div className="grid grid-cols-2 gap-4">
                                <Select label="Gender" value={params.fashionGender || FashionGender.Women} onChange={e => handleParamChange('fashionGender', e.target.value)}>
                                    {Object.values(FashionGender).map(g => <option key={g} value={g}>{g}</option>)}
                                </Select>
                                <Select label="Shoot Type" value={params.fashionShootType || FashionShootType.ModelShoot} onChange={e => handleParamChange('fashionShootType', e.target.value)}>
                                    {Object.values(FashionShootType).map(t => <option key={t} value={t}>{t}</option>)}
                                </Select>
                            </div>
                            
                            {/* NEW: Model Selection Logic */}
                            {params.fashionShootType === FashionShootType.ModelShoot && (
                                <div className="mt-4">
                                    <Select label="Select Model" value={params.modelLockId || ''} onChange={e => handleParamChange('modelLockId', e.target.value)}>
                                        <option value="">Standard Model (Random)</option>
                                        {locks.map(lock => <option key={lock.id} value={lock.id}>{lock.name} - {lock.desc}</option>)}
                                    </Select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <Select label="Body Type" value={params.fashionBodyType || FashionBodyType.Regular} onChange={e => handleParamChange('fashionBodyType', e.target.value)}>
                                    {Object.values(FashionBodyType).map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                </Select>
                                <Select label="Age Bracket" value={params.fashionAgeBracket || ''} onChange={e => handleParamChange('fashionAgeBracket', e.target.value)}>
                                    <option value="">Adult (Standard)</option>
                                    {Object.values(FashionAgeBracket).map(ab => <option key={ab} value={ab}>{ab}</option>)}
                                </Select>
                            </div>

                            <div className="mt-4">
                                <Select label="Category" value={params.fashionCategory || ''} onChange={e => handleParamChange('fashionCategory', e.target.value)}>
                                    <option value="">Select Category</option>
                                    {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                                </Select>
                            </div>
                            {category && (
                                <div className="mt-4">
                                    <Select label="Apparel Type" value={params.fashionSubCategory || ''} onChange={e => handleParamChange('fashionSubCategory', e.target.value)}>
                                        <option value="">Select Apparel</option>
                                        {subCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                                    </Select>
                                </div>
                            )}
                            <div className="mt-4">
                                <Select label="Regional Style (Optional)" value={params.regionalStyle || RegionalStyle.None} onChange={e => handleParamChange('regionalStyle', e.target.value)}>
                                    {Object.values(RegionalStyle).map(rs => <option key={rs} value={rs}>{rs}</option>)}
                                </Select>
                            </div>
                            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Icon name="camera" className="w-5 h-5 mr-2 text-primary" />
                                        <span className="text-sm font-semibold text-slate-800">Hyper-Realism</span>
                                    </div>
                                    {isHyperRealismLocked ? (
                                        <button onClick={onOpenPricingModal} className="flex items-center text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded">
                                            <Icon name="lock" className="w-3 h-3 mr-1" />
                                            PRO
                                        </button>
                                    ) : (
                                        <Toggle 
                                            label="" 
                                            enabled={params.hyperRealism || false} 
                                            onChange={(v) => handleParamChange('hyperRealism', v)} 
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Enables 8K resolution, detailed skin texture, and cinema-grade lighting.
                                </p>
                            </div>
                        </>
                    )}
                    
                    {commonOutputSettings}
                </div>
            </div>

            <footer className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center flex-shrink-0">
                 <div className="text-sm text-slate-500 flex items-center gap-2">
                    {/* Cost info */}
                    {cost > 0 && <span className="font-semibold text-primary">{cost} Credits</span>}
                 </div>
                 <Button onClick={handleMainAction} isLoading={isLoading} disabled={isLoading || (cost === 0 && !isFreeTrialGeneration && !needsUpgrade)}>
                    {getButtonText()}
                 </Button>
            </footer>
        </div>
    </div>
  );
};
