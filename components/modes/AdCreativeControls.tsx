import React, { useState } from 'react';
import type { GenerateImageParams } from '../../types';
import { AD_TEMPLATES, COMPARISON_LAYOUT_OPTIONS } from '../../constants';
import { FormInput, FormTextArea } from '../ui/Form';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { HelpLabel, BestForLabel } from './shared';
import { CreativeScorecard } from '../CreativeScorecard';
import { StyleSelector } from '../ui/StyleSelector';
import { generateAdCopy, generateAdBackground } from '../../services/geminiService';
import { AdPromptLibraryPicker } from './AdPromptLibraryPicker';
import { AdElementEditorPanel } from './AdElementEditorPanel';
import { AdLayerOverlay } from './AdLayerOverlay';
import { AD_CREATIVE_PROMPT_LIBRARY, AdPromptTemplate } from './adCreativePromptLibrary';
import { type AdElementKey } from './layoutBlueprints';

interface AdCreativeControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const AdCreativeControls: React.FC<AdCreativeControlsProps> = ({ 
    params, handleParamChange 
}) => {
    const [showScorecard, setShowScorecard] = useState(false);
    const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
    const [isGeneratingBg, setIsGeneratingBg] = useState(false);
    const [selectedElement, setSelectedElement] = useState<AdElementKey | null>('title');

    // Convert comparison layout options to StyleSelector format
    const comparisonStyleSelectorOptions = COMPARISON_LAYOUT_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        thumbnail: opt.thumbnail
    }));

    const handleGenerateBackground = async () => {
        const template = AD_CREATIVE_PROMPT_LIBRARY.find(t => t.id === params.adTemplateId);
        if (!template) {
            alert("Please select an Ad Template first.");
            return;
        }
        setIsGeneratingBg(true);
        try {
            const productDesc = params.productDescription || 'featured product';
            const brandColor = 'deep blue';
            const promptText = template.prompt
                .replace(/\[PRODUCT\]/g, productDesc)
                .replace(/\[BRAND_COLOR\]/g, brandColor);
            
            const bgUrl = await generateAdBackground(promptText, template.aspectRatio);
            handleParamChange('adBackgroundImageUrl', bgUrl);
        } catch (err) {
            console.error('Failed to generate ad background:', err);
        } finally {
            setIsGeneratingBg(false);
        }
    };

    const handleAutoGenerateCopy = async () => {
        if (!params.productDescription) {
            alert("Please add a Product Description in Common Controls below to generate copy.");
            return;
        }
        setIsGeneratingCopy(true);
        try {
            const templateName = AD_CREATIVE_PROMPT_LIBRARY.find(t => t.id === params.adTemplateId)?.name 
                || AD_TEMPLATES.find(t => t.id === params.adTemplateId)?.name || 'Modern';
            const result = await generateAdCopy(params.productDescription, templateName);
            handleParamChange('adTitle', result.title);
            handleParamChange('adSubheading', result.subheading);
            handleParamChange('adCta', result.cta);
        } catch (e) {
            console.error("Copy generation failed:", e);
        } finally {
            setIsGeneratingCopy(false);
        }
    };

    const currentTemplate = AD_CREATIVE_PROMPT_LIBRARY.find(t => t.id === params.adTemplateId);
    const layoutBlueprintId = currentTemplate ? currentTemplate.layoutBlueprintId : (params.adTemplateId || null);

    return (
        <>
            <div className="mt-6 flex justify-between items-start mb-4">
                <BestForLabel text={params.isComparisonMode 
                    ? "D2C brands comparing their product vs competitors or generic alternatives." 
                    : "High-conversion social media ads with interactive background AI and Canva-style editable layers."} 
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

                        {/* Editable Overlay & Editor Panel */}
                        {params.adTemplateId && (
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Icon name="layers" className="w-4 h-4 text-primary" />
                                        Visual Ad Canvas & Layer Editor
                                    </h4>
                                    <Button
                                        variant="primary"
                                        className="h-8 py-0.5 px-3 text-xs gap-1"
                                        onClick={handleGenerateBackground}
                                        disabled={isGeneratingBg || !params.adTemplateId}
                                        isLoading={isGeneratingBg}
                                    >
                                        <Icon name="sparkles" className="w-3.5 h-3.5" />
                                        {params.adBackgroundImageUrl ? 'Regenerate Background' : 'Generate Background Scene'}
                                    </Button>
                                </div>

                                <AdLayerOverlay 
                                    backgroundImageUrl={params.adBackgroundImageUrl || null}
                                    layoutBlueprintId={layoutBlueprintId}
                                    params={params}
                                    handleParamChange={handleParamChange}
                                    selectedElement={selectedElement}
                                    onSelectElement={setSelectedElement}
                                    onGenerateBackground={handleGenerateBackground}
                                    isGeneratingBg={isGeneratingBg}
                                />

                                <AdElementEditorPanel 
                                    selectedElement={selectedElement}
                                    layoutBlueprintId={layoutBlueprintId}
                                    params={params}
                                    handleParamChange={handleParamChange}
                                />
                            </div>
                        )}
                    </div>
                )}
                
                <div className="mt-4 mb-2 pt-4 border-t border-slate-200">
                    <HelpLabel label="Ad Content" tooltip="Write your own copy based on your product details." />
                </div>
                
                <FormInput 
                    label={params.isComparisonMode ? "Headline (e.g. Us vs Them)" : "Ad Title"}
                    id="ad-title"
                    placeholder={params.isComparisonMode ? "Chocolate, but make it better" : "e.g. Summer Sale 50% Off"}
                    value={params.adTitle || ''}
                    onChange={e => handleParamChange('adTitle', e.target.value)}
                    className={!params.adTitle ? 'border-red-300' : ''}
                />
                
                <FormInput 
                    label="Subheading"
                    id="ad-subheading"
                    placeholder={params.isComparisonMode ? "The smarter choice for your daily fix" : "e.g. Limited time offer"}
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
                
                <div className="grid grid-cols-2 gap-4">
                    <FormInput 
                        label="CTA Button"
                        id="ad-cta"
                        placeholder="e.g. Shop Now"
                        value={params.adCta || ''}
                        onChange={e => handleParamChange('adCta', e.target.value)}
                    />
                    <FormInput 
                        label="CTA Bg Color (Hex)"
                        id="ad-cta-bg"
                        placeholder="#6A5AE0"
                        value={params.adCtaBgColor || ''}
                        onChange={e => handleParamChange('adCtaBgColor', e.target.value)}
                    />
                </div>

                <div className="pt-2 border-t border-slate-200 mt-4">
                     <FormInput 
                        label="Text Color (Hex)"
                        id="ad-text-color"
                        placeholder="#ffffff"
                        value={params.adTextColor || ''}
                        onChange={e => handleParamChange('adTextColor', e.target.value)}
                    />
                </div>
            </div>
        </>
    );
};
