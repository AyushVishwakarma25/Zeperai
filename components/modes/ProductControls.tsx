
import React from 'react';
import type { GenerateImageParams } from '../../types';
import { ANGLE_OPTIONS, PRO_PRODUCT_STYLE_PRESETS, AI_SUGGESTED } from '../../constants';
import { SectionTitle, HelpLabel, BestForLabel } from './shared';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';

interface ProductControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    handleAngleChange: (angle: string) => void;
}

export const ProductControls: React.FC<ProductControlsProps> = ({ 
    params, handleParamChange, handleAngleChange 
}) => {
    return (
        <>
            <SectionTitle title="STUDIO SETTINGS" className="mt-6" />
            <BestForLabel text="Professional e-commerce photography with customizable angles and lighting." />
            
            <div className="space-y-6">
                <div>
                    <HelpLabel label="Camera Angles" tooltip="Select multiple angles to generate a complete photoshoot." />
                    <div className="grid grid-cols-3 gap-2">
                        {ANGLE_OPTIONS.map((opt) => {
                            const isSelected = params.selectedAngles?.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => handleAngleChange(opt.value)}
                                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <HelpLabel label="Studio Style Preset" tooltip="Choose a lighting and background preset for your product." className="mb-0" />
                        {params.productStylePreset && params.productStylePreset !== AI_SUGGESTED && (
                            <button 
                                onClick={() => handleParamChange('productStylePreset', AI_SUGGESTED)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center transition-colors"
                                title="Reset to AI Suggested"
                            >
                                <Icon name="refresh" className="w-3 h-3 mr-1" />
                                Reset
                            </button>
                        )}
                    </div>
                    <Select 
                        label="" 
                        value={params.productStylePreset || AI_SUGGESTED} 
                        onChange={e => handleParamChange('productStylePreset', e.target.value)}
                    >
                        <option value={AI_SUGGESTED}>{AI_SUGGESTED}</option>
                        {PRO_PRODUCT_STYLE_PRESETS.map(category => (
                            <optgroup key={category.category} label={category.category}>
                                {category.presets.map(preset => (
                                    <option key={preset.name} value={`${category.category}|${preset.name}`}>
                                        {preset.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </Select>
                </div>
            </div>
        </>
    );
};
