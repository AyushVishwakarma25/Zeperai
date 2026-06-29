
import React from 'react';
import type { GenerateImageParams, AspectRatio } from '../../types';
import { AppMode, ResolutionQuality, ImageModel } from '../../types';
import { ASPECT_RATIO_OPTIONS, OUTPUT_FORMAT_OPTIONS, RESOLUTION_QUALITY_OPTIONS } from '../../constants';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { ControlButton, SectionTitle, HelpLabel } from './shared';
import { toggleAspectRatio } from '../../utils/configLogic';

interface CommonControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    handleAspectRatioChange: (ratio: AspectRatio) => void; 
    batchOptions: number[];
    userTier: 'Free' | 'PayAsYouGo';
    hideMultiSelectLabel?: boolean;
}

export const CommonControls: React.FC<CommonControlsProps> = ({ 
    params, handleParamChange, handleAspectRatioChange, batchOptions, userTier, hideMultiSelectLabel 
}) => {
    
    const maxBatch = userTier === 'PayAsYouGo' ? 12 : 1;
    const canMultiSelect = true; 
    
    // Hide batch controls if multiple poses are selected in Fashion mode to prevent combinatorial explosion
    const hasMultiplePoses = params.appMode === AppMode.Fashion && params.fashionPose && params.fashionPose.length > 0;
    const hasMultipleProductOptions = params.appMode === AppMode.Product && ((params.productStylePresets?.length || 0) > 1 || (params.selectedAngles?.length || 0) > 1);
    const showBatchControls = [AppMode.Influencer, AppMode.Fashion, AppMode.AdCreative, AppMode.Product].includes(params.appMode) && !hasMultiplePoses && !hasMultipleProductOptions;

    return (
        <div className="mt-8 border-t border-slate-100 pt-8">
            <div className="flex justify-between items-end mb-4">
                <SectionTitle title="Aspect Ratio" className="!mb-0" />
                {canMultiSelect && !hideMultiSelectLabel && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-semibold tracking-wide border border-slate-200">
                        MULTI-SELECT AVAILABLE
                    </span>
                )}
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
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

            {/* AI Image Generation Model Selection */}
            <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                    <SectionTitle title="AI Generation Model" className="m-0" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                        Dropdown Select
                    </span>
                </div>
                
                {/* Dropdown element */}
                <div className="relative mb-3">
                    <select
                        value={params.imageModel || ImageModel.Imagen3HighQuality}
                        onChange={(e) => handleParamChange('imageModel', e.target.value as ImageModel)}
                        className="w-full bg-white border-2 border-slate-200 text-slate-800 py-3 px-4 pr-10 rounded-xl font-medium text-sm focus:outline-none focus:border-primary transition-all cursor-pointer appearance-none shadow-sm hover:border-slate-300"
                    >
                        <option value={ImageModel.Imagen3Fast}>Imagen 3 Fast (1 Credit)</option>
                        <option value={ImageModel.Imagen3HighQuality}>Imagen 3 High Quality (2 Credits)</option>
                        <option value={ImageModel.NanoBananaPro}>Nano Banana Pro (3 Credits) 🍌</option>
                        <option value={ImageModel.Imagen3Pro}>Imagen 3 Pro (4 Credits)</option>
                        <option value={ImageModel.NanoBanana2}>Nano Banana 2 (5 Credits) 🍌</option>
                        <option value={ImageModel.DallE3}>DALL-E 3 (ChatGPT - 6 Credits)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <Icon name="chevron-down" className="w-4 h-4" />
                    </div>
                </div>

                {/* Display card for selected model */}
                {(() => {
                    const currentModel = params.imageModel || ImageModel.Imagen3HighQuality;
                    const modelOptions = [
                        { 
                            value: ImageModel.Imagen3Fast, 
                            label: 'Imagen 3 Fast', 
                            desc: 'Speed optimized, ideal for fast iterations & general concepts.', 
                            cost: '1 Credit / img',
                            badge: 'Eco',
                            color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        },
                        { 
                            value: ImageModel.Imagen3HighQuality, 
                            label: 'Imagen 3 High Quality', 
                            desc: 'Enhanced textures, lighting, and layout accuracy.', 
                            cost: '2 Credits / img',
                            badge: 'Recommended',
                            color: 'bg-primary/10 text-primary border-primary/20'
                        },
                        { 
                            value: ImageModel.NanoBananaPro, 
                            label: 'Nano Banana Pro', 
                            desc: 'Advanced Banana vision engine. Exceptional prompt comprehension with natural artistic styling.', 
                            cost: '3 Credits / img',
                            badge: 'New 🍌',
                            color: 'bg-yellow-50 text-yellow-600 border-yellow-200'
                        },
                        { 
                            value: ImageModel.Imagen3Pro, 
                            label: 'Imagen 3 Pro', 
                            desc: 'Google\'s state-of-the-art flagship model for exceptional details & true photorealism.', 
                            cost: '4 Credits / img',
                            badge: 'Pro',
                            color: 'bg-amber-50 text-amber-600 border-amber-100'
                        },
                        { 
                            value: ImageModel.NanoBanana2, 
                            label: 'Nano Banana 2', 
                            desc: 'Next-gen Banana model tuned for hyper-vivid colors, ultra-creative layouts, and cinematic flair.', 
                            cost: '5 Credits / img',
                            badge: 'New 🍌',
                            color: 'bg-yellow-50 text-yellow-600 border-yellow-200'
                        },
                        { 
                            value: ImageModel.DallE3, 
                            label: 'DALL-E 3 (ChatGPT)', 
                            desc: 'OpenAI\'s premium creative model. Superb composition compliance and complex design execution.', 
                            cost: '6 Credits / img',
                            badge: 'Dall-E',
                            color: 'bg-purple-50 text-purple-600 border-purple-100'
                        }
                    ];
                    
                    const opt = modelOptions.find(o => o.value === currentModel) || modelOptions[1];
                    
                    return (
                        <div className="flex flex-col p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 shadow-inner">
                            <div className="flex justify-between items-center w-full mb-1.5 gap-2">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                                    {opt.label}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${opt.color}`}>
                                    {opt.badge}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium mb-3 leading-relaxed">
                                {opt.desc}
                            </p>
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-semibold text-slate-700">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cost</span>
                                <span className="text-primary font-bold">{opt.cost}</span>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {showBatchControls && batchOptions.length > 0 && (
                <div className="mt-8">
                    <HelpLabel label="Batch Size" tooltip="Number of variations generated in one go. Higher batches save time." />
                    <div className="flex gap-2">
                        {batchOptions.map(count => {
                            const isDisabled = count > maxBatch;
                            const isSelected = params.batchSize === count;
                            return (
                                <button
                                    key={count}
                                    onClick={() => !isDisabled && handleParamChange('batchSize', count)}
                                    disabled={isDisabled}
                                    className={`
                                        flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center transition-all
                                        ${isSelected 
                                            ? 'border-slate-900 bg-slate-900 text-white shadow-md' 
                                            : (isDisabled 
                                                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed' 
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50')}
                                    `}
                                >
                                    {count} {isDisabled && <Icon name="lock" className="w-3 h-3 ml-1.5" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
