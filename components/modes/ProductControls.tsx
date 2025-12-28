
import React from 'react';
import type { GenerateImageParams, ProProductStyleCategory } from '../../types';
import { ANGLE_OPTIONS, PRO_PRODUCT_STYLE_PRESETS, AI_SUGGESTED } from '../../constants';
import { Select } from '../ui/Select';
import { ControlButton, SectionTitle, HelpLabel, BestForLabel } from './shared';

interface ProductControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    handleAngleChange: (angle: string) => void;
}

export const ProductControls: React.FC<ProductControlsProps> = ({ 
    params, handleParamChange, handleAngleChange 
}) => {
    
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

    return (
        <>
            <SectionTitle title="PHOTOSHOOT STYLE" className="mt-6" />
            <BestForLabel text="Clean, high-quality product shots for catalogs and marketplaces." />
            
            <HelpLabel label="Product Angles" tooltip="Select multiple angles to generate a variety of shots at once." />
            <div className="grid grid-cols-3 gap-2">
                {ANGLE_OPTIONS.map(opt => ( 
                    <ControlButton key={opt.value} onClick={() => handleAngleChange(opt.value)} selected={params.selectedAngles?.includes(opt.value)}> 
                        {opt.label} 
                    </ControlButton> 
                ))}
            </div>
            <div className="mt-4">
                <HelpLabel label="Visual Style Preset" tooltip="Apply a professional lighting and background style instantly." />
                <Select label="" value={params.productStylePreset} onChange={e => handleParamChange('productStylePreset', e.target.value)}>
                    {productStylePresetOptions()}
                </Select>
            </div>
        </>
    );
};
