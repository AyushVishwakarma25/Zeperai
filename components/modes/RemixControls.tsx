
import React from 'react';
import type { GenerateImageParams } from '../../types.js';
import { FormTextArea, FormInput } from '../ui/Form.js';
import { SectionTitle, BestForLabel, HelpLabel } from './shared.js';

interface RemixControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const RemixControls: React.FC<RemixControlsProps> = ({ 
    params, handleParamChange 
}) => {
    return (
        <>
            <SectionTitle title="REMIX SETTINGS" />
            <BestForLabel text="Recreate an existing ad or image with your own product, adding or removing specific elements." />
            
            <div className="space-y-6">
                <div>
                    <HelpLabel label="Overall Vibe / Changes" tooltip="Describe the general mood or broad changes you want to make." />
                    <FormTextArea
                        label=""
                        id="remix-prompt"
                        placeholder="e.g., Make it look like a golden hour sunset, change the background color to pastel pink. (Leave blank to auto-adapt)"
                        rows={3}
                        value={params.productDescription}
                        onChange={e => handleParamChange('productDescription', e.target.value)}
                    />
                </div>

                <div>
                    <HelpLabel label="Elements to Add" tooltip="Specific items, props, or effects you want to include in the new image." />
                    <FormInput
                        label=""
                        id="remix-add"
                        placeholder="e.g., tropical leaves, water splashes, sun flare"
                        value={params.remixElements || ''}
                        onChange={e => handleParamChange('remixElements', e.target.value)}
                    />
                </div>

                <div>
                    <HelpLabel label="Elements to Remove" tooltip="Specific items, text, or props from the reference image you want to exclude." />
                    <FormInput
                        label=""
                        id="remix-remove"
                        placeholder="e.g., old logos, text, people, specific props"
                        value={params.remixNegativePrompt || ''}
                        onChange={e => handleParamChange('remixNegativePrompt', e.target.value)}
                    />
                </div>

                <div className="pt-2">
                    <HelpLabel label="Pro Lighting Presets" />
                    <div className="flex flex-wrap gap-2 mt-2">
                        {[
                            { label: 'Golden Hour', value: 'warm golden hour sunset lighting, soft long shadows' },
                            { label: 'Cyberpunk', value: 'neon blue and pink cinematic lighting, high contrast' },
                            { label: 'Editorial Mono', value: 'high-end black and white, dramatic hard shadows' },
                            { label: 'Studio Soft', value: 'high-key studio lighting, soft diffused shadows, clean' },
                            { label: 'Cinematic Teal/Orange', value: 'modern cinematic teal and orange color grading' }
                        ].map(preset => (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleParamChange('productDescription', params.productDescription + (params.productDescription ? ', ' : '') + preset.value)}
                                className="px-3 py-1.5 text-[10px] uppercase font-bold bg-white border border-slate-200 rounded-lg hover:border-primary hover:text-primary transition-all"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};
