
import React, { useState } from 'react';
import type { GenerateImageParams } from '../../types';
import { AD_TEMPLATES, COMPARISON_LAYOUT_OPTIONS } from '../../constants';
import { FormInput, FormTextArea } from '../ui/Form';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { HelpLabel, BestForLabel } from './shared';
import { CreativeScorecard } from '../CreativeScorecard';
import { StyleSelector } from '../ui/StyleSelector';

interface AdCreativeControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const AdCreativeControls: React.FC<AdCreativeControlsProps> = ({ 
    params, handleParamChange 
}) => {
    const [showScorecard, setShowScorecard] = useState(false);

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
            // We can store the prompt instruction in adStylePreset or a new field.
            // For now, we'll just rely on adTemplateId in geminiService.
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
                
                <FormInput 
                    label="CTA Button"
                    id="ad-cta"
                    placeholder="e.g. Shop Now"
                    value={params.adCta || ''}
                    onChange={e => handleParamChange('adCta', e.target.value)}
                />

                <div className="pt-2">
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
