
import React from 'react';
import type { GenerateImageParams } from '../../types';
import { FESTIVAL_STYLE_OPTIONS } from '../../constants';
import { Select } from '../ui/Select';
import { SectionTitle, BestForLabel, HelpLabel } from './shared';

interface FestivalControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const FestivalControls: React.FC<FestivalControlsProps> = ({ 
    params, handleParamChange 
}) => {
    return (
        <>
            <SectionTitle title="FESTIVAL THEME" className="mt-6" />
            <BestForLabel text="Thematic visuals for holidays like Diwali, Holi, Eid, and Christmas." />
            
            <HelpLabel label="Festival Style" tooltip="Select the specific holiday theme to apply culturally relevant props and lighting." />
            <Select label="" value={params.festivalStyle || ''} onChange={e => handleParamChange('festivalStyle', e.target.value)}>
                <option value="">Select a Festival</option>
                {FESTIVAL_STYLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>
        </>
    );
};
