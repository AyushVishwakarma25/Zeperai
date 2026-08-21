
import React from 'react';
import type { GenerateImageParams, SavedModel } from '../../types';
import { 
    MODEL_GENDER_OPTIONS, SKIN_TONE_OPTIONS, MODEL_PERSONA_OPTIONS, 
    CLOTHING_TYPE_OPTIONS, ALL_BACKGROUND_OPTIONS, 
    UGC_STYLE_OPTIONS, AI_SUGGESTED
} from '../../constants';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { ControlButton, SectionTitle, HelpLabel, BestForLabel } from './shared';
import { ProductCategory } from '../../types';
import { StyleSelector } from '../ui/StyleSelector';

interface InfluencerControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    onGenerateVariants: (field: 'modelPersona' | 'poseSuggestion') => void;
    savedModels: SavedModel[];
}

export const InfluencerControls: React.FC<InfluencerControlsProps> = ({ 
    params, handleParamChange, onGenerateVariants, savedModels 
}) => {
    
    // Safely retrieve background options, ensuring fallback exists
    const backgroundOptionsForCategory = 
        (params.productCategory && ALL_BACKGROUND_OPTIONS[params.productCategory]) 
        ? ALL_BACKGROUND_OPTIONS[params.productCategory] 
        : ALL_BACKGROUND_OPTIONS[ProductCategory.Generic];

    const backgroundOptions = backgroundOptionsForCategory 
        ? Object.keys(backgroundOptionsForCategory).map((group) => (
            <optgroup label={group} key={group}>
                {backgroundOptionsForCategory[group].map(option => <option key={option} value={option}>{option}</option>)}
            </optgroup>
          ))
        : null;

    const isBackgroundSet = params.backgroundStyle && params.backgroundStyle !== AI_SUGGESTED;
    const isUgcStyleSet = params.ugcStyle && params.ugcStyle !== '';

    // Convert UGC options to StyleSelector format
    const ugcStyleOptions = UGC_STYLE_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        thumbnail: `https://placehold.co/300x300/f3e8ff/7e22ce?text=${encodeURIComponent(opt.label.split(' ')[0])}` // Placeholder
    }));

    return (
        <>
            <SectionTitle title="INFLUENCER DETAILS" className="mt-6" />
            <BestForLabel text="Lifestyle marketing visuals featuring diverse AI models with your product." />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <HelpLabel label="Gender" />
                    <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                        {MODEL_GENDER_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => handleParamChange('modelGender', opt.value)} className={`flex-1 py-1.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 ${params.modelGender === opt.value ? 'bg-primary text-white shadow-sm' : 'text-slate-700'}`}>
                                <Icon name={opt.icon} className="w-4 h-4" />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                <HelpLabel label="Skin Tone" />
                    <div className="flex space-x-2 items-center h-10">
                    {SKIN_TONE_OPTIONS.map(option => (
                        <button key={option.value} onClick={() => handleParamChange('skinTone', option.value)}
                            className={`w-8 h-8 rounded-full transition-all border-2 ${params.skinTone === option.value ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-slate-200 bg-clip-content p-0.5 hover:scale-105'}`}
                            style={{ backgroundColor: option.color }}
                        />
                    ))}
                </div>
                </div>
            </div>
            
            <div className="mt-4">
                <HelpLabel label="Model Source" tooltip="Create a fresh face or reuse a saved consistent model." />
                <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                    <button onClick={() => handleParamChange('modelSourceOption', 'new')} className={`flex-1 py-1.5 rounded-md text-sm font-semibold ${params.modelSourceOption === 'new' ? 'bg-primary text-white shadow-sm' : 'text-slate-700'}`}>
                        New Model
                    </button>
                    <button onClick={() => handleParamChange('modelSourceOption', 'existing')} className={`flex-1 py-1.5 rounded-md text-sm font-semibold ${params.modelSourceOption === 'existing' ? 'bg-primary text-white shadow-sm' : 'text-slate-700'}`}>
                        Existing Model
                    </button>
                </div>
            </div>
            {params.modelSourceOption === 'existing' && (
                <div className="mt-4">
                    <Select label="Select Saved Model" value={params.modelSeedId || ''} onChange={e => handleParamChange('modelSeedId', e.target.value)} disabled={savedModels.length === 0}>
                        <option value="">Select a model</option>
                        {savedModels.length > 0 ? (
                            savedModels.map(model => <option key={model.id} value={model.id}>{model.name}</option>)
                        ) : (
                            <option value="" disabled>No saved models found</option>
                        )}
                    </Select>
                </div>
            )}
            {params.modelSourceOption === 'new' && (
                <div className="mt-4 flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">Save this Model</span>
                        <span className="text-xs text-slate-500">Keep this AI model for future shoots</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={params.saveModel === true}
                            onChange={(e) => handleParamChange('saveModel', e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            )}
            <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <HelpLabel label="Model Persona" tooltip="Defines the vibe and demographic of the influencer." className="!mb-0" />
                    <button 
                        type="button"
                        onClick={() => onGenerateVariants('modelPersona')} 
                        className="text-xs text-[#4452FB] hover:text-[#3641C9] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                        <Icon name="sparkles" className="w-3.5 h-3.5"/>
                        <span>AI Ideas</span>
                    </button>
                </div>
                <Select label="" value={params.modelPersona} onChange={e => handleParamChange('modelPersona', e.target.value)}>
                    {Object.keys(MODEL_PERSONA_OPTIONS).map(group => ( <optgroup key={group} label={group}> {MODEL_PERSONA_OPTIONS[group].map(opt => <option key={opt} value={opt}>{opt}</option>)} </optgroup> ))}
                </Select>
            </div>
            
            <div className="border-t border-slate-200 my-6"></div>
            
            <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                    <HelpLabel label="UGC Styles (Presets)" tooltip="Complete influencer presets. Disables Background Style if selected." className="mb-0" />
                    {isUgcStyleSet && (
                        <button 
                            onClick={() => handleParamChange('ugcStyle', '')}
                            className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                            <Icon name="remove" className="w-3 h-3 mr-1" />
                            Clear
                        </button>
                    )}
                </div>
                
                <StyleSelector 
                    options={ugcStyleOptions}
                    value={params.ugcStyle || ''}
                    onChange={(val) => handleParamChange('ugcStyle', val)}
                    disabled={isBackgroundSet}
                    className="grid-cols-2 sm:grid-cols-3"
                />
                
                {isBackgroundSet && <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded-lg text-center">Reset Background Style below to enable UGC Styles</p>}
            </div>

            <div className="mt-6">
                <HelpLabel label="Outfit Type" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CLOTHING_TYPE_OPTIONS.map(opt => (
                        <ControlButton 
                            key={opt.value} 
                            onClick={() => handleParamChange('clothingType', opt.value)} 
                            selected={params.clothingType === opt.value}
                            className="!px-2 !py-2 text-[11px] sm:text-xs font-semibold whitespace-nowrap overflow-hidden flex items-center justify-center gap-1.5"
                        >
                            <Icon name={opt.icon} className="w-3.5 h-3.5 shrink-0" /> 
                            <span className="truncate">{opt.label}</span>
                        </ControlButton>
                    ))}
                </div>
            </div>
            <div className="mt-4">
                <HelpLabel label="Custom Background" tooltip="Disables UGC Style if selected." />
                <Select 
                    label="" 
                    value={params.backgroundStyle} 
                    onChange={e => handleParamChange('backgroundStyle', e.target.value)}
                    disabled={isUgcStyleSet}
                    className={isUgcStyleSet ? 'opacity-50 cursor-not-allowed' : ''}
                >
                    {backgroundOptions}
                </Select>
                {isUgcStyleSet && <p className="text-xs text-red-500 mt-1">Unselect UGC Style to enable custom Background</p>}
            </div>
        </>
    );
};
