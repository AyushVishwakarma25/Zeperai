
import React from 'react';
import type { GenerateImageParams, AspectRatio } from '../../types';
import { AppMode, ResolutionQuality } from '../../types';
import { ASPECT_RATIO_OPTIONS, OUTPUT_FORMAT_OPTIONS, RESOLUTION_QUALITY_OPTIONS } from '../../constants';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { ControlButton, SectionTitle, HelpLabel } from './shared';
import { toggleAspectRatio } from '../../utils/configLogic';

interface CommonControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    // We pass the setter wrapper or the logic directly? 
    // Passing the raw setter is flexible, but here we can handle the logic if we have userTier
    handleAspectRatioChange: (ratio: AspectRatio) => void; 
    batchOptions: number[];
    userTier: 'Free' | 'Starter' | 'Standard' | 'Agency';
    hideMultiSelectLabel?: boolean;
}

export const CommonControls: React.FC<CommonControlsProps> = ({ 
    params, handleParamChange, handleAspectRatioChange, batchOptions, userTier, hideMultiSelectLabel 
}) => {
    
    const maxBatch = userTier === 'Agency' ? 12 : userTier === 'Standard' ? 4 : 1;
    // Multi-select enabled for all tiers now
    const canMultiSelect = true; 
    
    // Only show batch size for specific modes
    const showBatchControls = [AppMode.Influencer, AppMode.Fashion, AppMode.AdCreative].includes(params.appMode);

    return (
        <>
            <SectionTitle title="OUTPUT SETTINGS" className="mt-6" />
            <div className="flex justify-between items-center mb-2">
                <HelpLabel label="Aspect Ratio" tooltip="Select dimensions suitable for your target platform. Select multiple to generate variations." className="mb-0" />
                {canMultiSelect && !hideMultiSelectLabel && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">MULTI-SELECT ON</span>}
            </div>
            
            <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIO_OPTIONS.map(opt => {
                    const isSelected = params.aspectRatios?.includes(opt.value);
                    return (
                        <ControlButton 
                            key={opt.value} 
                            onClick={() => handleAspectRatioChange(opt.value)} 
                            selected={isSelected || false}
                        >
                            <Icon name={opt.icon} className="w-4 h-4" />
                            <span>{opt.label}</span>
                        </ControlButton>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <HelpLabel label="Format" />
                    <Select label="" value={params.outputFormat} onChange={e => handleParamChange('outputFormat', e.target.value)}>
                        {OUTPUT_FORMAT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                </div>
                <div>
                    <HelpLabel label="Quality" tooltip="High quality uses 4x credits but provides printable resolution (2K)." />
                    <Select label="" value={params.resolutionQuality} onChange={e => handleParamChange('resolutionQuality', e.target.value)}>
                        {RESOLUTION_QUALITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </Select>
                </div>
            </div>

            {showBatchControls && batchOptions.length > 0 && (
                <div className="mt-6">
                    <HelpLabel label="Batch Size" tooltip="Number of variations generated in one go. Higher batches save time." />
                    <div className="grid grid-cols-4 gap-2">
                        {batchOptions.map(count => {
                            const isDisabled = count > maxBatch;
                            return (
                                <ControlButton 
                                    key={count} 
                                    onClick={() => handleParamChange('batchSize', count)} 
                                    selected={params.batchSize === count}
                                    disabled={isDisabled}
                                >
                                    {count}
                                    {isDisabled && <Icon name="lock" className="w-3 h-3 text-slate-300 ml-1" />}
                                </ControlButton>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};
