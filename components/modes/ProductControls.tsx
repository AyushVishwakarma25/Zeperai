
import React, { useState, useEffect } from 'react';
import type { GenerateImageParams } from '../../types';
import { ANGLE_OPTIONS, PRO_PRODUCT_STYLE_PRESETS, AI_SUGGESTED } from '../../constants';
import { SectionTitle, HelpLabel, BestForLabel } from './shared';
import { Icon } from '../ui/Icon';
import { StyleSelector } from '../ui/StyleSelector';

interface ProductControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    handleAngleChange: (angle: string) => void;
}

export const ProductControls: React.FC<ProductControlsProps> = ({ 
    params, handleParamChange, handleAngleChange 
}) => {
    // Initialize category based on current selection or default to first
    const [activeCategory, setActiveCategory] = useState<string>(() => {
        if (params.productStylePreset && params.productStylePreset.includes('|')) {
            return params.productStylePreset.split('|')[0];
        }
        return PRO_PRODUCT_STYLE_PRESETS[0].category;
    });

    const currentPresets = PRO_PRODUCT_STYLE_PRESETS.find(c => c.category === activeCategory)?.presets || [];
    
    // Convert to StyleOption format
    const styleOptions = currentPresets.map(p => ({
        label: p.name,
        value: `${activeCategory}|${p.name}`,
        // Using placeholder logic if thumbnail is missing for immediate visual feedback
        thumbnail: p.thumbnail || `https://placehold.co/300x300/e2e8f0/64748b?text=${encodeURIComponent(p.name)}`
    }));

    const handlePresetsChange = (newPresets: string[]) => {
        handleParamChange('productStylePresets', newPresets);
        // Sync singular for compatibility/preview if needed
        handleParamChange('productStylePreset', newPresets.length > 0 ? newPresets[0] : AI_SUGGESTED);
    };

    const clearPresets = () => {
        handleParamChange('productStylePresets', []);
        handleParamChange('productStylePreset', AI_SUGGESTED);
    };

    const hasSelection = params.productStylePresets && params.productStylePresets.length > 0;

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
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <HelpLabel label="Visual Style" tooltip="Choose multiple lighting and background presets." className="mb-0" />
                            {hasSelection && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">MULTI-SELECT ON</span>}
                        </div>
                        {hasSelection && (
                            <button 
                                onClick={clearPresets}
                                className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center transition-colors px-2 py-1 rounded hover:bg-red-50"
                                title="Clear all presets"
                            >
                                <Icon name="remove" className="w-3 h-3 mr-1" />
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Category Tabs - Scrollbar Hidden */}
                    <div className="flex overflow-x-auto gap-2 pb-2 mb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] mask-fade-right">
                        {PRO_PRODUCT_STYLE_PRESETS.map(cat => {
                            const isActive = activeCategory === cat.category;
                            return (
                                <button 
                                    key={cat.category}
                                    onClick={() => setActiveCategory(cat.category)}
                                    className={`px-4 py-1.5 whitespace-nowrap text-xs font-bold rounded-full transition-all duration-200 border ${
                                        isActive 
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' 
                                        : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                >
                                    {cat.category}
                                </button>
                            )
                        })}
                    </div>

                    {/* Visual Grid */}
                    <StyleSelector 
                        options={styleOptions}
                        value={params.productStylePresets || []}
                        onChange={handlePresetsChange}
                        multiple={true}
                    />
                </div>
            </div>
        </>
    );
};
