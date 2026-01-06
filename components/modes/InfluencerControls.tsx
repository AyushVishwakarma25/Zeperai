
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

interface InfluencerControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    onGenerateVariants: (field: 'modelPersona' | 'poseSuggestion') => void;
    savedModels: SavedModel[];
}

export const InfluencerControls: React.FC<InfluencerControlsProps> = ({ 
    params, handleParamChange, onGenerateVariants, savedModels 
}) => {
    
    const backgroundOptionsForCategory = ALL_BACKGROUND_OPTIONS[params.productCategory] || ALL_BACKGROUND_OPTIONS[ProductCategory.Generic];
    const backgroundOptions = Object.keys(backgroundOptionsForCategory).map((group) => (
        <optgroup label={group} key={group}>
            {backgroundOptionsForCategory[group].map(option => <option key={option} value={option}>{option}</option>)}
        </optgroup>
    ));

    // Logic: If background is specifically set (not default), block UGC Style. 
    // And if UGC Style is set, block background style.
    // Default background is often "AI Suggested" which should be considered "empty" in this context
    const isBackgroundSet = params.backgroundStyle && params.backgroundStyle !== AI_SUGGESTED;
    const isUgcStyleSet = params.ugcStyle && params.ugcStyle !== '';

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
            <div className="relative mt-4">
                <HelpLabel label="Model Persona" tooltip="Defines the vibe and demographic of the influencer." />
                <Select label="" value={params.modelPersona} onChange={e => handleParamChange('modelPersona', e.target.value)}>
                    {Object.keys(MODEL_PERSONA_OPTIONS).map(group => ( <optgroup key={group} label={group}> {MODEL_PERSONA_OPTIONS[group].map(opt => <option key={opt} value={opt}>{opt}</option>)} </optgroup> ))}
                </Select>
                <button onClick={() => onGenerateVariants('modelPersona')} className="absolute top-8 right-2 p-1 text-slate-400 hover:text-primary"><Icon name="sparkles" className="w-4 h-4"/></button>
            </div>
            
            <div className="border-t border-slate-200 my-6"></div>
            
            <div className="mt-4">
                <HelpLabel label="UGC Style (Presets)" tooltip="Complete influencer presets. Disables Background Style if selected." />
                <Select 
                    label="" 
                    value={params.ugcStyle || ''} 
                    onChange={e => handleParamChange('ugcStyle', e.target.value)}
                    disabled={isBackgroundSet}
                    className={isBackgroundSet ? 'opacity-50 cursor-not-allowed' : ''}
                >
                    <option value="">Select a Style...</option>
                    {UGC_STYLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Select>
                {isBackgroundSet && <p className="text-xs text-red-500 mt-1">Reset Background Style to enable UGC Styles</p>}
            </div>

            <div className="mt-4">
                <HelpLabel label="Outfit Type" />
                <div className="grid grid-cols-4 gap-2">
                    {CLOTHING_TYPE_OPTIONS.map(opt => (
                        <ControlButton key={opt.value} onClick={() => handleParamChange('clothingType', opt.value)} selected={params.clothingType === opt.value}>
                        <Icon name={opt.icon} className="w-4 h-4" /> <span>{opt.label}</span>
                        </ControlButton>
                    ))}
                </div>
            </div>
            <div className="mt-4">
                <HelpLabel label="Background Style" tooltip="Disables UGC Style if selected." />
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
