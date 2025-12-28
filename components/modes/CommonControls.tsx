
import React from 'react';
import type { GenerateImageParams, AspectRatio } from '../../types';
import { AppMode, ResolutionQuality } from '../../types';
import { ASPECT_RATIO_OPTIONS, OUTPUT_FORMAT_OPTIONS, RESOLUTION_QUALITY_OPTIONS } from '../../constants';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { ControlButton, SectionTitle } from './shared';

interface CommonControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    handleAspectRatioChange: (ratio: AspectRatio) => void;
    batchOptions: number[];
}

export const CommonControls: React.FC<CommonControlsProps> = ({ 
    params, handleParamChange, handleAspectRatioChange, batchOptions 
}) => {
    return (
        <>
            <SectionTitle title="OUTPUT SETTINGS" className="mt-6" />
            <label className="block text-sm font-semibold text-black mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIO_OPTIONS.map(opt => (
                    <ControlButton key={opt.value} onClick={() => handleAspectRatioChange(opt.value)} selected={params.aspectRatios?.includes(opt.value)}>
                        <Icon name={opt.icon} className="w-4 h-4" /><span>{opt.label}</span>
                    </ControlButton>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <Select label="Format" value={params.outputFormat} onChange={e => handleParamChange('outputFormat', e.target.value)}>
                    {OUTPUT_FORMAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Select>
                <Select label="Quality" value={params.resolutionQuality} onChange={e => handleParamChange('resolutionQuality', e.target.value)}>
                    {RESOLUTION_QUALITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Select>
            </div>

            {params.appMode !== AppMode.Product && batchOptions.length > 0 && (
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-black mb-2">Batch Size</label>
                    <div className="grid grid-cols-4 gap-2">
                        {batchOptions.map(count => (
                            <ControlButton key={count} onClick={() => handleParamChange('batchSize', count)} selected={params.batchSize === count}>
                                {count}
                            </ControlButton>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
