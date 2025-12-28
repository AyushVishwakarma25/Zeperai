
import React from 'react';
import type { GenerateImageParams } from '../../types';
import { FormTextArea } from '../ui/Form';
import { SectionTitle, BestForLabel, HelpLabel } from './shared';

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
            <BestForLabel text="Modifying existing images creatively while keeping specific elements intact." />
            
            <HelpLabel label="Modification Prompt" tooltip="Describe exactly what you want to change in the reference image." />
            <FormTextArea
                label=""
                id="remix-prompt"
                placeholder="e.g., Change the fruits to lemons and make the background blue. (Leave blank to auto-adapt)"
                rows={4}
                value={params.productDescription}
                onChange={e => handleParamChange('productDescription', e.target.value)}
            />
        </>
    );
};
