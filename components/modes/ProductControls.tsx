
import React, { useState, useRef } from 'react';
import type { GenerateImageParams } from '../../types.js';
import { ANGLE_OPTIONS, PRO_PRODUCT_STYLE_PRESETS, AI_SUGGESTED } from '../../constants.js';
import { SectionTitle, BestForLabel } from './shared.js';
import { Icon } from '../ui/Icon.js';
import { StyleSelector } from '../ui/StyleSelector.js';

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

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const currentPresets = PRO_PRODUCT_STYLE_PRESETS.find(c => c.category === activeCategory)?.presets || [];
    
    // Convert to StyleOption format
    const styleOptions = currentPresets.map(p => ({
        label: p.name,
        value: `${activeCategory}|${p.name}`,
        thumbnail: p.thumbnail || `https://placehold.co/300x300/e2e8f0/64748b?text=${encodeURIComponent(p.name)}`
    }));

    const handlePresetsChange = (newPresets: string[]) => {
        handleParamChange('productStylePresets', newPresets);
        // Sync singular for compatibility/preview if needed
        handleParamChange('productStylePreset', newPresets.length > 0 ? newPresets[0] : AI_SUGGESTED);
    };

    const hasSelection = params.productStylePresets && params.productStylePresets.length > 0;

    return (
        <>
            <div className="space-y-8">
                {/* Visual Style (Scene Styles) */}
                <div>
                    <SectionTitle title="Scene Styles" className="mb-3" />
                    
                    <div className="relative group mb-6">
                        {/* Left Arrow */}
                        <button 
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -ml-2 p-1.5 bg-white shadow-lg border border-slate-100 text-slate-500 hover:text-primary rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                            aria-label="Scroll Left"
                        >
                            <Icon name="chevron-left" className="w-4 h-4" />
                        </button>

                        {/* Scroll Container */}
                        <div 
                            ref={scrollContainerRef}
                            className="flex overflow-x-auto gap-2 pb-2 px-1 scroll-smooth w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] mask-image-gradient"
                        >
                            {PRO_PRODUCT_STYLE_PRESETS.map(cat => {
                                const isActive = activeCategory === cat.category;
                                return (
                                    <button 
                                        key={cat.category}
                                        onClick={() => setActiveCategory(cat.category)}
                                        className={`
                                            px-4 py-2 whitespace-nowrap text-xs font-bold rounded-full transition-all duration-200 border flex-shrink-0
                                            ${isActive 
                                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 transform scale-105' 
                                                : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200 hover:border-slate-300'}
                                        `}
                                    >
                                        {cat.category}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Right Arrow */}
                        <button 
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 -mr-2 p-1.5 bg-white shadow-lg border border-slate-100 text-slate-500 hover:text-primary rounded-full transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Scroll Right"
                        >
                            <Icon name="chevron-left" className="w-4 h-4 rotate-180" />
                        </button>
                    </div>

                    <StyleSelector 
                        options={styleOptions}
                        value={params.productStylePresets || []}
                        onChange={handlePresetsChange}
                        multiple={true}
                        className="grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4"
                    />
                    
                    {hasSelection && (
                        <div className="mt-2 flex justify-end">
                            <button 
                                onClick={() => {
                                    handleParamChange('productStylePresets', []);
                                    handleParamChange('productStylePreset', AI_SUGGESTED);
                                }}
                                className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center transition-colors px-2 py-1 rounded hover:bg-red-50"
                            >
                                <Icon name="remove" className="w-3 h-3 mr-1" />
                                Clear Selection
                            </button>
                        </div>
                    )}
                </div>

                {/* Camera Angles */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <SectionTitle title="Camera Angles" className="mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ANGLE_OPTIONS.map((opt) => {
                            const isSelected = params.selectedAngles?.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => handleAngleChange(opt.value)}
                                    className={`
                                        px-4 py-3 text-xs font-bold rounded-xl border-2 transition-all duration-200 text-center
                                        ${isSelected
                                            ? 'bg-white border-primary text-primary shadow-sm'
                                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200 hover:shadow-sm'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
};
