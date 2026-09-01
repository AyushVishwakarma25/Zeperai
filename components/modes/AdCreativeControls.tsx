import React, { useState } from 'react';
import type { GenerateImageParams } from '../../types.js';
import { AD_TEMPLATES, COMPARISON_LAYOUT_OPTIONS } from '../../constants.js';
import { FormInput, FormTextArea } from '../ui/Form.js';
import { Button } from '../ui/Button.js';
import { Icon } from '../ui/Icon.js';
import { HelpLabel, BestForLabel } from './shared.js';
import { StyleSelector } from '../ui/StyleSelector.js';
import { generateAdCopy } from '../../services/geminiService.js';
import { AdPromptLibraryPicker } from './AdPromptLibraryPicker.js';
import { AD_CREATIVE_PROMPT_LIBRARY } from './adCreativePromptLibrary.js';

interface AdCreativeControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const AdCreativeControls: React.FC<AdCreativeControlsProps> = ({ 
    params, handleParamChange 
}) => {
    const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

    // Convert comparison layout options to StyleSelector format
    const comparisonStyleSelectorOptions = COMPARISON_LAYOUT_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        thumbnail: opt.thumbnail
    }));

    const handleAutoGenerateCopy = async () => {
        if (!params.productDescription) {
            alert("Please provide a product description in the Creative Settings above to auto-generate copy.");
            return;
        }
        setIsGeneratingCopy(true);
        try {
            const templateName = AD_CREATIVE_PROMPT_LIBRARY.find(t => t.id === params.adTemplateId)?.name 
                || AD_TEMPLATES.find(t => t.id === params.adTemplateId)?.name || 'Modern';
            const result = await generateAdCopy(params.productDescription, templateName);
            if (result.title) handleParamChange('adTitle', result.title);
            if (result.subheading) handleParamChange('adSubheading', result.subheading);
            if (result.cta) handleParamChange('adCta', result.cta);
        } catch (e) {
            console.error("Copy generation failed:", e);
        } finally {
            setIsGeneratingCopy(false);
        }
    };

    return (
        <>
            <div className="mt-6 flex justify-between items-start mb-4">
                <BestForLabel text={params.isComparisonMode 
                    ? "D2C brands comparing their product vs competitors or generic alternatives." 
                    : "High-converting social media ads, promo graphics, and marketing creatives."} 
                />
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button
                    type="button"
                    onClick={() => handleParamChange('isComparisonMode', false)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!params.isComparisonMode ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Standard Ad
                </button>
                <button
                    type="button"
                    onClick={() => handleParamChange('isComparisonMode', true)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${params.isComparisonMode ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Comparison Ad
                </button>
            </div>
            
            <div className="space-y-6">
                {params.isComparisonMode ? (
                    <div>
                        <HelpLabel label="Comparison Layout" tooltip="Choose a layout structure for your comparison ad." />
                        <StyleSelector 
                            options={comparisonStyleSelectorOptions}
                            value={params.adLayout || ''}
                            onChange={(val) => handleParamChange('adLayout', val)}
                            className="grid-cols-2"
                        />
                    </div>
                ) : (
                    <div>
                        <AdPromptLibraryPicker 
                            params={params} 
                            handleParamChange={handleParamChange} 
                        />

                        <div className="mt-4">
                            <FormTextArea
                                label="Custom Scene / Describe Instructions (Optional)"
                                id="ad-user-describe-text"
                                placeholder="e.g. Place on dark slate with soft golden rim lighting, sleek modern studio atmosphere"
                                value={params.userDescribeText || ''}
                                onChange={e => handleParamChange('userDescribeText', e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <HelpLabel label="Ad Copy & Typography" tooltip="Enter the text and headline to display in your ad creative." />
                        <Button
                            variant="secondary"
                            className="h-7 py-0.5 px-2.5 text-xs gap-1"
                            onClick={handleAutoGenerateCopy}
                            disabled={isGeneratingCopy || !params.productDescription}
                            isLoading={isGeneratingCopy}
                        >
                            <Icon name="sparkles" className="w-3.5 h-3.5 text-primary" />
                            AI Write Copy
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <FormInput 
                            label={params.isComparisonMode ? "Headline (e.g. Us vs Them)" : "Ad Title / Headline"}
                            id="ad-title"
                            placeholder={params.isComparisonMode ? "Chocolate, but make it better" : "e.g. Summer Sale 50% Off"}
                            value={params.adTitle || ''}
                            onChange={e => handleParamChange('adTitle', e.target.value)}
                        />
                        
                        <FormInput 
                            label="Subheading / Key Benefit"
                            id="ad-subheading"
                            placeholder={params.isComparisonMode ? "The smarter choice for your daily fix" : "e.g. 100% Organic & Handcrafted"}
                            value={params.adSubheading || ''}
                            onChange={e => handleParamChange('adSubheading', e.target.value)}
                        />

                        {params.isComparisonMode && (
                            <div className="space-y-4 pt-2 border-t border-slate-200">
                                <HelpLabel label="Comparison Points" tooltip="List 4-5 key features for each side." />
                                <FormTextArea 
                                    label="Your Product Features"
                                    id="prod-a-features"
                                    placeholder="e.g. High Protein, No Added Sugar, Natural Ingredients"
                                    value={params.productAFeatures || ''}
                                    onChange={e => handleParamChange('productAFeatures', e.target.value)}
                                    rows={3}
                                />
                                <FormTextArea 
                                    label="Competitor / Generic Features"
                                    id="prod-b-features"
                                    placeholder="e.g. Low Protein, Sugar Loaded, Artificial Flavors"
                                    value={params.productBFeatures || ''}
                                    onChange={e => handleParamChange('productBFeatures', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormInput 
                                label="CTA Button (Call to Action)"
                                id="ad-cta"
                                placeholder="e.g. Shop Now / Order Today"
                                value={params.adCta || ''}
                                onChange={e => handleParamChange('adCta', e.target.value)}
                            />
                            <FormInput 
                                label="Brand / Accent Color (Optional)"
                                id="ad-cta-bg"
                                placeholder="e.g. #6A5AE0 or Emerald Green"
                                value={params.adCtaBgColor || ''}
                                onChange={e => handleParamChange('adCtaBgColor', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
