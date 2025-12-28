
import React from 'react';
import type { GenerateImageParams } from '../../types';
import { FashionGender, FashionShootType, FashionBodyType, FashionAgeBracket, RegionalStyle } from '../../types';
import { FASHION_CATEGORIES, FASHION_MODEL_LOCKS } from '../../constants';
import { Select } from '../ui/Select';
import { Icon } from '../ui/Icon';
import { Toggle } from '../ui/Toggle';
import { SectionTitle, HelpLabel, BestForLabel } from './shared';

interface FashionControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    isHyperRealismLocked: boolean;
    onOpenPricingModal: () => void;
}

export const FashionControls: React.FC<FashionControlsProps> = ({ 
    params, handleParamChange, isHyperRealismLocked, onOpenPricingModal 
}) => {
    const gender = params.fashionGender || FashionGender.Women;
    const categories = FASHION_CATEGORIES[gender];
    const category = params.fashionCategory || Object.keys(categories)[0];
    const subCategories = categories[category] ? categories[category] : [];
    const locks = FASHION_MODEL_LOCKS[gender] || [];

    return (
        <>
            <SectionTitle title="FASHION SHOOT DETAILS" className="mt-6" />
            <BestForLabel text="On-model clothing photography, lookbooks, and fashion e-commerce." />
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <HelpLabel label="Gender" />
                    <Select label="" value={params.fashionGender || FashionGender.Women} onChange={e => handleParamChange('fashionGender', e.target.value)}>
                        {Object.values(FashionGender).map(g => <option key={g} value={g}>{g}</option>)}
                    </Select>
                </div>
                <div>
                    <HelpLabel label="Shoot Type" tooltip="Choose how the product is presented." />
                    <Select label="" value={params.fashionShootType || FashionShootType.ModelShoot} onChange={e => handleParamChange('fashionShootType', e.target.value)}>
                        {Object.values(FashionShootType).map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                </div>
            </div>
            
            {params.fashionShootType === FashionShootType.ModelShoot && (
                <div className="mt-4">
                    <HelpLabel label="Select Model" tooltip="Consistent models allow you to create a cohesive brand look." />
                    <Select label="" value={params.modelLockId || ''} onChange={e => handleParamChange('modelLockId', e.target.value)}>
                        <option value="">Standard Model (Random)</option>
                        {locks.map(lock => <option key={lock.id} value={lock.id}>{lock.name} - {lock.desc}</option>)}
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <HelpLabel label="Body Type" />
                    <Select label="" value={params.fashionBodyType || FashionBodyType.Regular} onChange={e => handleParamChange('fashionBodyType', e.target.value)}>
                        {Object.values(FashionBodyType).map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </Select>
                </div>
                <div>
                    <HelpLabel label="Age Bracket" />
                    <Select label="" value={params.fashionAgeBracket || ''} onChange={e => handleParamChange('fashionAgeBracket', e.target.value)}>
                        <option value="">Adult (Standard)</option>
                        {Object.values(FashionAgeBracket).map(ab => <option key={ab} value={ab}>{ab}</option>)}
                    </Select>
                </div>
            </div>

            <div className="mt-4">
                <HelpLabel label="Category" />
                <Select label="" value={params.fashionCategory || ''} onChange={e => handleParamChange('fashionCategory', e.target.value)}>
                    <option value="">Select Category</option>
                    {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
            </div>
            {category && (
                <div className="mt-4">
                    <HelpLabel label="Apparel Type" />
                    <Select label="" value={params.fashionSubCategory || ''} onChange={e => handleParamChange('fashionSubCategory', e.target.value)}>
                        <option value="">Select Apparel</option>
                        {subCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                    </Select>
                </div>
            )}
            <div className="mt-4">
                <HelpLabel label="Regional Style (Optional)" tooltip="Adds cultural context to the outfit and background." />
                <Select label="" value={params.regionalStyle || RegionalStyle.None} onChange={e => handleParamChange('regionalStyle', e.target.value)}>
                    {Object.values(RegionalStyle).map(rs => <option key={rs} value={rs}>{rs}</option>)}
                </Select>
            </div>
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Icon name="camera" className="w-5 h-5 mr-2 text-primary" />
                        <span className="text-sm font-semibold text-slate-800">Hyper-Realism</span>
                    </div>
                    {isHyperRealismLocked ? (
                        <button onClick={onOpenPricingModal} className="flex items-center text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded">
                            <Icon name="lock" className="w-3 h-3 mr-1" />
                            PRO
                        </button>
                    ) : (
                        <Toggle 
                            label="" 
                            enabled={params.hyperRealism || false} 
                            onChange={(v) => handleParamChange('hyperRealism', v)} 
                        />
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Enables 8K resolution, detailed skin texture, and cinema-grade lighting.
                </p>
            </div>
        </>
    );
};
