
import React, { useState } from 'react';
import type { GenerateImageParams } from '../../types';
import { AD_LAYOUT_OPTIONS, AD_STYLE_PRESETS } from '../../constants';
import { Select } from '../ui/Select';
import { FormInput } from '../ui/Form';
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

    return (
        <>
            <div className="mt-6">
                <BestForLabel text="High-conversion social media ads with integrated BI performance metrics." />
            </div>
            
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <HelpLabel label="Ad Layout" tooltip="Choose a layout that fits your content strategy." />
                        <Select label="" value={params.adLayout || ''} onChange={e => handleParamChange('adLayout', e.target.value)}>
                            {AD_LAYOUT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
                    label="Ad Title"
                    id="ad-title"
                    placeholder="e.g. Summer Sale 50% Off"
                    value={params.adTitle || ''}
                    onChange={e => handleParamChange('adTitle', e.target.value)}
                    className={!params.adTitle ? 'border-red-300' : ''}
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
