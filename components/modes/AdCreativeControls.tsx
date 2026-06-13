
import React, { useState } from 'react';
import type { GenerateImageParams } from '../../types';
import { AD_TEMPLATES, COMPARISON_LAYOUT_OPTIONS } from '../../constants';
import { FormInput, FormTextArea } from '../ui/Form';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { HelpLabel, BestForLabel } from './shared';
import { CreativeScorecard } from '../CreativeScorecard';
import { StyleSelector } from '../ui/StyleSelector';
import { Spinner } from '../ui/Spinner';
import { generateAdCopy } from '../../services/geminiService';

interface AdCreativeControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const AdCreativeControls: React.FC<AdCreativeControlsProps> = ({ 
    params, handleParamChange 
}) => {
    const [showScorecard, setShowScorecard] = useState(false);
    const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

    // Convert comparison layout options to StyleSelector format
    const comparisonStyleSelectorOptions = COMPARISON_LAYOUT_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        thumbnail: opt.thumbnail
    }));

    const handleTemplateSelect = (templateId: string) => {
        const template = AD_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            handleParamChange('adTemplateId', template.id);
            handleParamChange('adLayout', template.adLayout);
            handleParamChange('adFontFamily', template.fontFamily);
            handleParamChange('adTextColor', template.textColor);
        }
    };

    const handleAutoGenerateCopy = async () => {
        if (!params.productDescription) {
            alert("Please add a Product Description in the Settings (Common Controls) below to generate copy.");
            return;
        }
        setIsGeneratingCopy(true);
        try {
            const templateName = AD_TEMPLATES.find(t => t.id === params.adTemplateId)?.name || 'Modern';
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

    return (
        <>
            <div className="mt-6 flex justify-between items-start mb-4">
                <BestForLabel text={params.isComparisonMode 
                    ? "D2C brands comparing their product vs competitors or generic alternatives." 
                    : "High-conversion social media ads with integrated BI performance metrics."} 
                />
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                <button
                    onClick={() => handleParamChange('isComparisonMode', false)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!params.isComparisonMode ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Standard Ad
                </button>
                <button
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
                        <HelpLabel label="Ad Template" tooltip="Choose a pre-designed template with optimized layouts, fonts, and AI prompts." />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {AD_TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template.id)}
                                    className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all text-left ${
                                        params.adTemplateId === template.id 
                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className={`w-full aspect-video rounded-lg mb-2 flex items-center justify-center border ${template.previewColor}`}>
                                        <span className={`text-xs font-bold ${template.textColor} ${template.fontFamily}`}>
                                            {template.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-800 w-full truncate">{template.name}</span>
                                    <span className="text-xs text-slate-500 w-full truncate">{template.category}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex items-center justify-between mt-4 mb-2 pt-4 border-t border-slate-200">
                    <HelpLabel label="Ad Content" tooltip="Write your own or use AI to generate high-converting copy based on your product details." />
                    <Button 
                        variant="secondary" 
                        className="h-8 py-0.5 px-3 text-xs gap-1 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                        onClick={handleAutoGenerateCopy}
                        disabled={isGeneratingCopy || !params.productDescription}
                        isLoading={isGeneratingCopy}
                    >
                        <Icon name="sparkles" className="w-3.5 h-3.5" />
                        Auto-Write Copy
                    </Button>
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

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 mt-4">
                     <FormInput 
                        label="Text Color (Hex)"
                        id="ad-text-color"
                        placeholder="#ffffff"
                        value={params.adTextColor || ''}
                        onChange={e => handleParamChange('adTextColor', e.target.value)}
                    />
                     <div>
                        <HelpLabel label="Brand Setup" />
                        <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={params.applyBrandIdentity || false}
                                onChange={(e) => handleParamChange('applyBrandIdentity', e.target.checked)}
                                className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm font-medium text-slate-700">Apply Brand Kit Assets</span>
                        </label>
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                        onClick={() => setShowScorecard(!showScorecard)} 
                        variant="secondary" 
                        fullWidth
                        className={showScorecard ? 'bg-primary/10 text-primary border-primary/20' : ''}
                    >
                        <Icon name="strategy" className="w-4 h-4 mr-2" />
                        {showScorecard ? 'Hide Creative Intelligence' : 'Analyze Performance Potential'}
                    </Button>
                </div>

                {showScorecard && <CreativeScorecard params={params} />}
            </div>
        </>
    );
};
