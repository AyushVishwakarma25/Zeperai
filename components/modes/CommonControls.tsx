
import React, { useState } from 'react';
import type { GenerateImageParams, AspectRatio } from '../../types';
import { AppMode, ResolutionQuality, ImageModel } from '../../types';
import { ASPECT_RATIO_OPTIONS, OUTPUT_FORMAT_OPTIONS, RESOLUTION_QUALITY_OPTIONS } from '../../constants';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { ControlButton, SectionTitle, HelpLabel } from './shared';
import { toggleAspectRatio } from '../../utils/configLogic';
import { FeaturePricingTable } from '../FeaturePricingTable';

interface CommonControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    handleAspectRatioChange: (ratio: AspectRatio) => void; 
    batchOptions?: number[];
    userTier: 'Free' | 'PayAsYouGo';
    hideMultiSelectLabel?: boolean;
    onOpenPricingModal?: () => void;
}

export const CommonControls: React.FC<CommonControlsProps> = ({ 
    params, handleParamChange, handleAspectRatioChange, userTier, hideMultiSelectLabel, onOpenPricingModal
}) => {
    const canMultiSelect = true;
    const [showPricingTable, setShowPricingTable] = useState(false);

    return (
        <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="flex justify-between items-end mb-4">
                <SectionTitle title="Aspect Ratio" className="!mb-0" />
                {!hideMultiSelectLabel ? (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-semibold tracking-wide border border-slate-200">
                        MULTI-SELECT AVAILABLE
                    </span>
                ) : (
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-bold tracking-wide border border-amber-200">
                        SINGLE RATIO PER CATALOG BATCH
                    </span>
                )}
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                {ASPECT_RATIO_OPTIONS.map(opt => {
                    const isSelected = params.aspectRatios?.includes(opt.value);
                    return (
                        <button 
                            key={opt.value} 
                            onClick={() => handleAspectRatioChange(opt.value)} 
                            className={`
                                relative group flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 h-28
                                ${isSelected 
                                    ? 'border-primary bg-primary/5 shadow-sm' 
                                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}
                            `}
                        >
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center shadow-sm">
                                    <Icon name="check-circle" className="w-3 h-3" />
                                </div>
                            )}
                            <div className={`mb-3 p-2 rounded-lg ${isSelected ? 'bg-white text-primary shadow-sm' : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'}`}>
                                <Icon name={opt.icon} className="w-6 h-6" />
                            </div>
                            <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-slate-600'}`}>{opt.label}</span>
                            <span className={`text-[9px] font-medium mt-0.5 ${isSelected ? 'text-primary/70' : 'text-slate-400'}`}>({opt.value})</span>
                        </button>
                    );
                })}
            </div>
            {hideMultiSelectLabel && (
                <p className="text-xs text-slate-400 mb-8 italic">
                    Catalog sets generate all 4–5 poses in a single, standardized aspect ratio (3:4 Portrait is recommended for e-commerce listings).
                </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <SectionTitle title="Export Format" className="mb-3" />
                    <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 flex">
                        {OUTPUT_FORMAT_OPTIONS.map(opt => {
                            const isSelected = params.outputFormat === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => handleParamChange('outputFormat', opt.value)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                        isSelected 
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-100' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
                
                <div>
                    <SectionTitle title="Output Quality" className="mb-3" />
                    <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 flex">
                        {RESOLUTION_QUALITY_OPTIONS.map(opt => {
                            const isSelected = params.resolutionQuality === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => handleParamChange('resolutionQuality', opt.value)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                        isSelected 
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-100' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* AI Generation Model Selection - Simplified to Nano Banana & Nano Banana Pro */}
            <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <SectionTitle title="AI Generation Model" className="m-0" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        2 Options
                    </span>
                </div>
                
                {/* 2-Option selector buttons */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                        type="button"
                        onClick={() => handleParamChange('imageModel', ImageModel.NanoBanana)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                            (params.imageModel || ImageModel.NanoBanana) === ImageModel.NanoBanana
                                ? 'border-primary bg-primary/5 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">Nano Banana</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">Standard (1x)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">Fast, studio-quality output for general creatives & ads.</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleParamChange('imageModel', ImageModel.NanoBananaPro)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                            params.imageModel === ImageModel.NanoBananaPro
                                ? 'border-primary bg-primary/5 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                Nano Banana Pro 🍌
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold">Pro (2x)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">Flagship photorealism, detailed lighting & text perfection.</p>
                    </button>
                </div>

                <button
                    onClick={() => setShowPricingTable(!showPricingTable)}
                    className="mt-1 w-full py-2 px-3 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-200/70"
                >
                    <Icon name="sparkles" className="w-3.5 h-3.5 text-primary" />
                    <span>{showPricingTable ? 'Hide Credit Rates' : 'View Credit Rates'}</span>
                </button>

                {showPricingTable && (
                    <div className="mt-4">
                        <FeaturePricingTable
                            onOpenPricingModal={onOpenPricingModal}
                            onClose={() => setShowPricingTable(false)}
                            compact
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
