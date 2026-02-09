
import React, { useState, useRef } from 'react';
import type { GenerateImageParams } from '../../types';
import { FESTIVAL_PRESETS, AI_SUGGESTED } from '../../constants';
import { SectionTitle, BestForLabel } from './shared';
import { Icon } from '../ui/Icon';
import { StyleSelector } from '../ui/StyleSelector';

interface FestivalControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const FestivalControls: React.FC<FestivalControlsProps> = ({ 
    params, handleParamChange 
}) => {
    // Initialize category based on current selection or default to first
    const [activeCategory, setActiveCategory] = useState<string>(() => {
        // If there's a single preset selected, use its category
        if (params.festivalStyle && params.festivalStyle.includes('|')) {
            return params.festivalStyle.split('|')[0];
        }
        // If there are multiple, check the first one
        if (params.festivalStylePresets && params.festivalStylePresets.length > 0) {
             const first = params.festivalStylePresets[0];
             if (first.includes('|')) return first.split('|')[0];
        }
        return FESTIVAL_PRESETS[0].category;
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

    const currentPresets = FESTIVAL_PRESETS.find(c => c.category === activeCategory)?.presets || [];
    
    // Convert to StyleOption format
    const styleOptions = currentPresets.map(p => ({
        label: p.name,
        value: `${activeCategory}|${p.name}`, // Storing category|name similar to product mode
        thumbnail: p.thumbnail || `https://placehold.co/300x300/fcd34d/b45309?text=${encodeURIComponent(p.name)}`
    }));

    const handlePresetsChange = (newPresets: string[]) => {
        handleParamChange('festivalStylePresets', newPresets);
        // Sync singular for backward compatibility/preview logic
        // We set it to the last selected one or clear it if empty
        const lastSelected = newPresets.length > 0 ? newPresets[newPresets.length - 1] : '';
        handleParamChange('festivalStyle', lastSelected);
    };

    const hasSelection = params.festivalStylePresets && params.festivalStylePresets.length > 0;

    return (
        <>
            <SectionTitle title="FESTIVAL THEME" className="mt-6" />
            <BestForLabel text="Thematic visuals for holidays like Diwali, Holi, Eid, and Christmas." />
            
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
                    {FESTIVAL_PRESETS.map(cat => {
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
                value={params.festivalStylePresets || []}
                onChange={handlePresetsChange}
                className="grid-cols-2 sm:grid-cols-3 gap-4"
                multiple={true}
            />

            {hasSelection && (
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={() => {
                            handleParamChange('festivalStylePresets', []);
                            handleParamChange('festivalStyle', '');
                        }}
                        className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                        <Icon name="remove" className="w-3 h-3 mr-1" />
                        Clear Selection
                    </button>
                </div>
            )}
        </>
    );
};
