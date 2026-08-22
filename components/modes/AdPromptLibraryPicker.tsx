import React from 'react';
import { AD_CREATIVE_PROMPT_LIBRARY, type AdPromptTemplate } from './adCreativePromptLibrary.js';
import type { GenerateImageParams } from '../../types.js';
import { HelpLabel } from './shared.js';

interface Props {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    onTemplateSelected?: (template: AdPromptTemplate) => void;
}

export const AdPromptLibraryPicker: React.FC<Props> = ({ params, handleParamChange, onTemplateSelected }) => {
    const handleSelect = (template: AdPromptTemplate) => {
        handleParamChange('adTemplateId', template.id);
        handleParamChange('aspectRatios', [template.aspectRatio]);
        // Clear previous background so user can preview new layout before explicitly generating
        handleParamChange('adBackgroundImageUrl', '');
        onTemplateSelected?.(template);
    };

    return (
        <div>
            <HelpLabel
                label="Ad Template"
                tooltip="Pick a style layout to preview. Fine-tune text layers, then click 'Generate Background Scene' to generate AI background graphics."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AD_CREATIVE_PROMPT_LIBRARY.map(template => {
                    const isSelected = params.adTemplateId === template.id;
                    return (
                        <button
                            type="button"
                            key={template.id}
                            onClick={() => handleSelect(template)}
                            className={`relative flex flex-col items-start rounded-xl border-2 overflow-hidden transition-all text-left ${
                                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="w-full aspect-[4/5] bg-slate-100">
                                <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                            </div>
                            <div className="p-2 w-full">
                                <span className="text-xs font-semibold text-slate-800 block truncate">{template.name}</span>
                                <span className="text-[11px] text-slate-500 block truncate">{template.category}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
