
import React, { useState } from 'react';
import type { GenerateImageParams } from '../../types';
import { AD_LAYOUT_OPTIONS, COMPARISON_LAYOUT_OPTIONS, AD_STYLE_PRESETS } from '../../constants';
import { Select } from '../ui/Select';
import { FormInput, FormTextArea } from '../ui/Form';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { HelpLabel, BestForLabel } from './shared';
import { CreativeScorecard } from '../CreativeScorecard';

interface AdCreativeControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const AdCreativeControls: React.FC<AdCreativeControlsProps> = ({ 
    params, handleParamChange 
}) => {
    const [showScorecard, setShowScorecard] = useState(false);

    // Toggle comparison mode
    const toggleComparisonMode = () => {
        handleParamChange('isComparisonMode', !params.isComparisonMode);
    };

    const layoutOptions = params.isComparisonMode ? COMPARISON_LAYOUT_OPTIONS : AD_LAYOUT_OPTIONS;

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
            
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <HelpLabel label="Ad Layout" tooltip="Choose a layout that fits your content strategy." />
                        <Select label="" value={params.adLayout || ''} onChange={e => handleParamChange('adLayout', e.target.value)}>
                            {layoutOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    </div>
                    <div>
                        <HelpLabel label="Creative Style" tooltip="Define the aesthetic mood of the ad." />
                        <Select label="" value={params.adStylePreset || '✨ AI Suggested'} onChange={e => handleParamChange('adStylePreset', e.target.value)}>
                            {AD_STYLE_PRESETS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    </div>
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
