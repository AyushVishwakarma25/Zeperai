
import React, { useState } from 'react';
import type { GenerateImageParams, ProProductStyleCategory } from '../../types';
import { ANGLE_OPTIONS, PRO_PRODUCT_STYLE_PRESETS, AI_SUGGESTED } from '../../constants';
import { ControlButton, SectionTitle, HelpLabel, BestForLabel } from './shared';
import { Icon } from '../ui/Icon';

interface ProductControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    handleAngleChange: (angle: string) => void;
}

export const ProductControls: React.FC<ProductControlsProps> = ({ 
    params, handleParamChange, handleAngleChange 
}) => {
    
    // Helpers for Multi-Select
    const selectedPresets = params.productStylePresets || [];
    
    const togglePreset = (presetValue: string) => {
        let newPresets = [...selectedPresets];
        if (newPresets.includes(presetValue)) {
            newPresets = newPresets.filter(p => p !== presetValue);
        } else {
            newPresets.push(presetValue);
        }
        
        // If empty, we might want to default back to AI_SUGGESTED implicitly in logic, 
        // but let's keep the array empty in state.
        
        // Also update the single 'productStylePreset' for backward compatibility or single-mode display logic elsewhere
        const primary = newPresets.length > 0 ? newPresets[0] : AI_SUGGESTED;
        
        handleParamChange('productStylePresets', newPresets);
        handleParamChange('productStylePreset', primary);
    };

    const isSelected = (val: string) => selectedPresets.includes(val);

    return (
        <>
            <SectionTitle title="PHOTOSHOOT STYLE" className="mt-6" />
            <BestForLabel text="Clean, high-quality product shots for catalogs and marketplaces." />
            
            <HelpLabel label="Product Angles" tooltip="Select multiple angles to generate a variety of shots at once." />
            <div className="grid grid-cols-3 gap-2 mb-6">
                {ANGLE_OPTIONS.map(opt => ( 
                    <ControlButton key={opt.value} onClick={() => handleAngleChange(opt.value)} selected={params.selectedAngles?.includes(opt.value)}> 
                        {opt.label} 
                    </ControlButton> 
                ))}
            </div>

            <div className="mt-4">
                <HelpLabel label="Batch Style Selection" tooltip="Select multiple styles to generate variations in one go." />
                
                {/* AI Suggested Toggle */}
                <button
                    onClick={() => togglePreset(AI_SUGGESTED)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all mb-3 flex items-center justify-between ${
                        isSelected(AI_SUGGESTED) 
                        ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <span className={`font-semibold text-sm ${isSelected(AI_SUGGESTED) ? 'text-primary' : 'text-slate-700'}`}>
                        ✨ AI Suggested
                    </span>
                    {isSelected(AI_SUGGESTED) && <Icon name="check-circle" className="w-5 h-5 text-primary" />}
                </button>

                {/* Categories Accordion / List */}
                <div className="space-y-4">
                    {(PRO_PRODUCT_STYLE_PRESETS as ProProductStyleCategory[]).map((category) => (
                        <div key={category.category} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category.category}</h4>
                            </div>
                            <div className="p-2 grid grid-cols-1 gap-1">
                                {category.presets.map((preset) => {
                                    const value = `${category.category}|${preset.name}`;
                                    const active = isSelected(value);
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => togglePreset(value)}
                                            className={`px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                                                active 
                                                ? 'bg-white text-primary font-medium shadow-sm border border-primary/20' 
                                                : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                            }`}
                                        >
                                            <span>{preset.name}</span>
                                            {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-3 text-xs text-slate-500 text-center">
                    {selectedPresets.length === 0 
                        ? "No styles selected. Defaulting to AI Suggested." 
                        : `${selectedPresets.length} style(s) selected.`}
                </div>
            </div>
        </>
    );
};
