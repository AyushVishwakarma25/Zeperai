
import React from 'react';
import type { GenerateImageParams } from '../../types';
import { AD_LAYOUT_OPTIONS } from '../../constants';
import { Select } from '../ui/Select';
import { FormInput } from '../ui/Form';
import { SectionTitle, HelpLabel, BestForLabel } from './shared';

interface AdCreativeControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const AdCreativeControls: React.FC<AdCreativeControlsProps> = ({ 
    params, handleParamChange 
}) => {
    return (
        <>
            <SectionTitle title="AD CREATIVE DETAILS" className="mt-6" />
            <BestForLabel text="High-conversion social media ads with integrated text, logos, and call-to-actions." />
            
            <div className="space-y-4">
                <div>
                    <HelpLabel label="Ad Layout" tooltip="Choose a layout that fits your content strategy." />
                    <Select label="" value={params.adLayout || ''} onChange={e => handleParamChange('adLayout', e.target.value)}>
                        {AD_LAYOUT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
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
            </div>
        </>
    );
};
