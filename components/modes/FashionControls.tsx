
import React, { useState, useMemo } from 'react';
import type { GenerateImageParams, FashionAgentPlan } from '../../types.js';
import { FashionGender, FashionShootType, FashionBodyType, FashionAgeBracket, RegionalStyle } from '../../types.js';
import { FASHION_CATEGORIES, FASHION_MODEL_LOCKS, FASHION_POSE_OPTIONS, FASHION_POSE_TEMPLATES } from '../../constants.js';
import { analyzeFashionGarmentAgent } from '../../services/geminiService.js';
import { Select } from '../ui/Select.js';
import { Icon } from '../ui/Icon.js';
import { Toggle } from '../ui/Toggle.js';
import { SectionTitle, HelpLabel, BestForLabel, ControlButton } from './shared.js';

interface FashionControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    isHyperRealismLocked: boolean;
    onOpenPricingModal: () => void;
    userTier?: 'Free' | 'PayAsYouGo';
    credits?: number;
    onDeductCredits?: (cost: number) => boolean;
}

export const FashionControls: React.FC<FashionControlsProps> = ({ 
    params, handleParamChange, isHyperRealismLocked, onOpenPricingModal, userTier, credits, onDeductCredits 
}) => {
    // Mode Switch: AI Agent (Done-For-You) vs Manual Controls
    const [controlMode, setControlMode] = useState<'ai' | 'manual'>(params.fashionAgentMode || 'ai');
    
    // AI Agent Planning State
    const [isPlanning, setIsPlanning] = useState(false);
    const [agentPlan, setAgentPlan] = useState<FashionAgentPlan | null>(null);
    const [targetMarketplace, setTargetMarketplace] = useState<string>('Amazon & Myntra');
    const [userGenderPref, setUserGenderPref] = useState<string>('Auto');
    const [userOccasionPref, setUserOccasionPref] = useState<string>('Auto');

    const gender = params.fashionGender || FashionGender.Women;
    
    // Safely get categories, defaulting to Women if the gender key is invalid or missing
    const categories = FASHION_CATEGORIES[gender] || FASHION_CATEGORIES[FashionGender.Women];
    
    // Safely get category key, ensuring categories exists before calling Object.keys
    const category = params.fashionCategory || (categories ? Object.keys(categories)[0] : '');
    
    const subCategories = (categories && category) ? (categories[category] || []) : [];
    const locks = FASHION_MODEL_LOCKS[gender] || FASHION_MODEL_LOCKS[FashionGender.Women] || [];

    const maxCatalogSize = params.catalogSetSize || 5;

    const handleModeSwitch = (mode: 'ai' | 'manual') => {
        setControlMode(mode);
        handleParamChange('fashionAgentMode', mode);
    };

    // Run AI Agent Shoot Planning
    const handleRunAgentPlan = async () => {
        const file = params.frontProductImage;
        if (!file) return;

        // Deduct 1 credit for AI Agent vision planning
        if (onDeductCredits) {
            const hasCredits = onDeductCredits(1);
            if (!hasCredits) return;
        }

        setIsPlanning(true);
        try {
            const plan = await analyzeFashionGarmentAgent(file, {
                targetMarketplace,
                genderPreference: userGenderPref,
                occasionPreference: userOccasionPref,
                setSize: maxCatalogSize,
            });

            setAgentPlan(plan);

            // Apply all planned settings into params
            handleParamChange('catalogMode', true);
            handleParamChange('catalogSetSize', plan.poses.length);
            handleParamChange('fashionGender', plan.gender);
            handleParamChange('fashionShootType', FashionShootType.ModelShoot);
            handleParamChange('fashionCategory', plan.category);
            handleParamChange('fashionSubCategory', plan.subCategory);
            handleParamChange('fashionPose', plan.poses);
            handleParamChange('modelLockId', plan.recommendedModelId);
            if (plan.regionalStyle) handleParamChange('regionalStyle', plan.regionalStyle);
            if (plan.bodyType) handleParamChange('fashionBodyType', plan.bodyType);
            if (plan.ageBracket) handleParamChange('fashionAgeBracket', plan.ageBracket);
        } catch (e) {
            console.error('Failed to run Fashion Agent plan:', e);
        } finally {
            setIsPlanning(false);
        }
    };

    // Handle Pose Toggle in Manual Mode
    const handlePoseToggle = (pose: string) => {
        const currentPoses = params.fashionPose || [];
        let newPoses: string[];

        if (currentPoses.includes(pose)) {
            newPoses = currentPoses.filter(p => p !== pose);
        } else {
            if (params.catalogMode && currentPoses.length >= maxCatalogSize) {
                return; // Cannot select more than catalog set size
            }
            newPoses = [...currentPoses, pose];
        }

        handleParamChange('fashionPose', newPoses);
    };

    const hasPoseSelection = params.fashionPose && params.fashionPose.length > 0;

    return (
        <>
            <div className="flex items-center justify-between mt-6 mb-1">
                <SectionTitle title="FASHION SHOOT DETAILS" className="!mt-0 !mb-0" />
                {credits !== undefined && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1 shrink-0">
                        <Icon name="sparkles" className="w-3 h-3" />
                        {credits} {credits === 1 ? 'Credit' : 'Credits'} Available
                    </span>
                )}
            </div>
            <BestForLabel text="On-model clothing photography, lookbooks, and fashion e-commerce." />

            {/* Mode Switcher: AI Done-For-You vs Manual Controls */}
            <div className="mb-6 p-1.5 bg-slate-100 rounded-2xl flex items-center border border-slate-200 shadow-inner">
                <button
                    type="button"
                    onClick={() => handleModeSwitch('ai')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                        controlMode === 'ai'
                            ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Icon name="sparkles" className="w-3.5 h-3.5" />
                    <span>Done-For-You (AI Agent)</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase">
                        Smart
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => handleModeSwitch('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                        controlMode === 'manual'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <Icon name="settings" className="w-3.5 h-3.5" />
                    <span>Manual Controls</span>
                </button>
            </div>

            {/* ========================================================= */}
            {/* 1. AI AGENT (DONE-FOR-YOU) VIEW                          */}
            {/* ========================================================= */}
            {controlMode === 'ai' ? (
                <div className="space-y-4">
                    {/* Agent Header Callout */}
                    <div className="p-3.5 bg-gradient-to-r from-primary/10 via-purple-50/60 to-indigo-50/40 rounded-xl border border-primary/20 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <Icon name="sparkles" className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                Virtual Fashion Studio Director
                                <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-semibold">
                                    AUTO-PLAN
                                </span>
                            </div>
                            <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">
                                Intelligently analyzes your garment fabric, silhouette, and occasion to assemble an optimal 4-5 pose listing set ready for Amazon, Myntra, and Shopify.
                            </p>
                        </div>
                    </div>

                    {/* Preferences & Marketplace Controls */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                            <span>Listing Targets & Specifications</span>
                            <span className="text-[10px] font-semibold text-slate-400">Customizable</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <HelpLabel label="Marketplace" tooltip="Tailors poses and framing to your target store guidelines." className="!mb-1 !text-xs" />
                                <Select
                                    label=""
                                    value={targetMarketplace}
                                    onChange={(e) => setTargetMarketplace(e.target.value)}
                                    className="!text-xs py-1.5"
                                >
                                    <option value="Amazon & Myntra">Amazon & Myntra (Standard)</option>
                                    <option value="Amazon Marketplace">Amazon Marketplace</option>
                                    <option value="Myntra & Flipkart">Myntra & Flipkart</option>
                                    <option value="Shopify / D2C Brand">Shopify / D2C Brand</option>
                                    <option value="Ajio & Trends">Ajio & Trends</option>
                                    <option value="Instagram Lookbook">Instagram Lookbook</option>
                                </Select>
                            </div>

                            <div>
                                <HelpLabel label="Set Size" tooltip="Number of cohesive listing images generated in one batch." className="!mb-1 !text-xs" />
                                <div className="flex gap-1.5">
                                    {[4, 5].map((size) => (
                                        <ControlButton
                                            key={size}
                                            onClick={() => handleParamChange('catalogSetSize', size)}
                                            selected={(params.catalogSetSize || 5) === size}
                                            className="!text-xs px-3 py-1.5 flex-1"
                                        >
                                            {size} Poses
                                        </ControlButton>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                            <div>
                                <HelpLabel label="Model Gender" className="!mb-1 !text-xs" />
                                <Select
                                    label=""
                                    value={userGenderPref}
                                    onChange={(e) => setUserGenderPref(e.target.value)}
                                    className="!text-xs py-1.5"
                                >
                                    <option value="Auto">Auto-Detect from Garment</option>
                                    <option value={FashionGender.Women}>Women</option>
                                    <option value={FashionGender.Men}>Men</option>
                                    <option value={FashionGender.Kids}>Kids</option>
                                    <option value={FashionGender.Unisex}>Unisex</option>
                                </Select>
                            </div>

                            <div>
                                <HelpLabel label="Occasion / Style" className="!mb-1 !text-xs" />
                                <Select
                                    label=""
                                    value={userOccasionPref}
                                    onChange={(e) => setUserOccasionPref(e.target.value)}
                                    className="!text-xs py-1.5"
                                >
                                    <option value="Auto">Auto-Detect</option>
                                    <option value="Festive & Wedding">Festive & Wedding</option>
                                    <option value="Casual & Everyday">Casual & Everyday</option>
                                    <option value="Formal Office">Formal Office</option>
                                    <option value="Streetwear & Party">Streetwear & Party</option>
                                    <option value="Athleisure & Active">Athleisure & Active</option>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Agent Vision Action / Plan Card */}
                    {params.frontProductImage ? (
                        <div className="space-y-3">
                            {isPlanning ? (
                                <div className="p-6 bg-white border border-primary/30 rounded-xl text-center space-y-3 shadow-xs">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary animate-pulse">
                                        <Icon name="sparkles" className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-800">
                                            Fashion Agent Analyzing Garment...
                                        </p>
                                        <p className="text-xs text-slate-500 animate-pulse">
                                            Inspecting fabric weave, collar/neckline cut, matching regional model, and curating {maxCatalogSize} e-commerce poses...
                                        </p>
                                    </div>
                                    <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                                        <div className="h-full bg-primary rounded-full animate-indeterminate" />
                                    </div>
                                </div>
                            ) : agentPlan ? (
                                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                                    {/* Plan Title & Status */}
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                                Shoot Plan Active • {agentPlan.poses.length} Images
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRunAgentPlan}
                                            className="text-[11px] text-primary hover:text-primary/80 font-bold flex items-center gap-1 transition-colors bg-primary/5 px-2.5 py-1 rounded-md border border-primary/20"
                                        >
                                            <Icon name="refresh-cw" className="w-3 h-3" />
                                            Re-Plan (1 Credit)
                                        </button>
                                    </div>

                                    {/* Detected Details Pills */}
                                    <div className="space-y-1.5">
                                        <div className="text-xs font-bold text-slate-900">
                                            {agentPlan.garmentTitle}
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-snug">
                                            {agentPlan.fabricAndDetails}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                                {agentPlan.gender} • {agentPlan.subCategory}
                                            </span>
                                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                                                {agentPlan.occasion}
                                            </span>
                                            {agentPlan.regionalStyle && agentPlan.regionalStyle !== RegionalStyle.None && (
                                                <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium">
                                                    {agentPlan.regionalStyle} Accent
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Assigned Model Persona */}
                                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-xs flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Model Persona</div>
                                            <div className="font-semibold text-slate-800 mt-0.5">
                                                {agentPlan.recommendedModelName || 'Consistent Indian Fashion Model'}
                                            </div>
                                        </div>
                                        <Select
                                            label=""
                                            value={params.modelLockId || agentPlan.recommendedModelId || ''}
                                            onChange={(e) => handleParamChange('modelLockId', e.target.value)}
                                            className="!text-xs py-1 w-36"
                                        >
                                            {locks.map((lock) => (
                                                <option key={lock.id} value={lock.id}>
                                                    {lock.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    {/* Curated Listing Poses */}
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                                            <span>Curated E-Commerce Listing Poses ({agentPlan.poses.length})</span>
                                            <span className="text-[10px] text-green-700 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                                                Locked Across Set
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {agentPlan.poses.map((pose, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-2 bg-slate-50 rounded-lg border border-slate-200/60 text-xs flex items-start gap-2"
                                                >
                                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-[11px] text-slate-700 leading-snug">
                                                        {pose}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Marketplace Conversion Tip */}
                                    {agentPlan.marketplaceTips && (
                                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                                            💡 <span className="font-medium text-slate-700">Marketplace Insight:</span> {agentPlan.marketplaceTips}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-center shadow-xs">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                                        <Icon name="sparkles" className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-slate-800">
                                            Garment Uploaded & Ready
                                        </h4>
                                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                                            Let the Virtual Fashion Studio Director examine your garment to generate an optimal {maxCatalogSize}-pose Amazon/Myntra shoot plan.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRunAgentPlan}
                                        className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon name="sparkles" className="w-4 h-4" />
                                        Auto-Plan Shoot & Poses (1 Credit)
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                                <Icon name="camera" className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-semibold text-slate-700">
                                Upload Apparel Image to Auto-Plan
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                                Upload your clothing image in the Assets section above, and the Fashion Agent will automatically analyze its fabric, cuts, and category.
                            </p>
                        </div>
                    )}

                    {/* Hyper-Realism Toggle */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center">
                            <Icon name="camera" className="w-4 h-4 mr-2 text-primary" />
                            <div>
                                <span className="text-xs font-semibold text-slate-800">Hyper-Realism</span>
                                <p className="text-[10px] text-slate-500">8K texture and studio cinema lighting</p>
                            </div>
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
                </div>
            ) : (
                /* ========================================================= */
                /* 2. MANUAL CONTROLS VIEW                                   */
                /* ========================================================= */
                <div>
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

                    <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl relative">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Icon name="camera" className="w-5 h-5 mr-2 text-primary" />
                                <span className="text-sm font-semibold text-slate-800">Catalog Mode</span>
                            </div>
                            <Toggle
                                label=""
                                enabled={params.catalogMode || false}
                                onChange={(v) => handleParamChange('catalogMode', v)}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Generate a full 4-5 image set (front, angle, back, detail, lifestyle) in one go — ready for Amazon, Flipkart, or Myntra listings. The same model's face and build stay consistent across every shot.
                        </p>
                        {params.catalogMode && (
                            <div className="mt-3">
                                <HelpLabel label="Set Size" className="mb-1" />
                                <div className="flex gap-2">
                                    {[4, 5].map(size => (
                                        <ControlButton
                                            key={size}
                                            onClick={() => handleParamChange('catalogSetSize', size)}
                                            selected={(params.catalogSetSize || 5) === size}
                                            className="!text-xs px-4 py-1.5"
                                        >
                                            {size} images
                                        </ControlButton>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <HelpLabel label="Model Poses" tooltip={params.catalogMode ? "Optional: hand-pick poses to override the default catalog set." : "Select poses for your shoot."} className="mb-0" />
                                {hasPoseSelection && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">MULTI-SELECT ON</span>}
                                {params.catalogMode && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">{(params.fashionPose || []).length}/{maxCatalogSize}</span>}
                            </div>
                            {hasPoseSelection && (
                                <button 
                                    onClick={() => { handleParamChange('fashionPose', []); }}
                                    className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center transition-colors px-2 py-1 rounded hover:bg-red-50"
                                >
                                    <Icon name="remove" className="w-3 h-3 mr-1" />
                                    Clear
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                            {FASHION_POSE_OPTIONS.map((pose) => {
                                const isSelected = params.fashionPose?.includes(pose);
                                return (
                                    <ControlButton
                                        key={pose}
                                        onClick={() => handlePoseToggle(pose)}
                                        selected={isSelected || false}
                                        className="!justify-start text-left h-auto py-2 px-3 !text-xs"
                                    >
                                        <span className="line-clamp-2">{pose}</span>
                                    </ControlButton>
                                );
                            })}
                        </div>
                        {!hasPoseSelection && (
                            <p className="text-xs text-slate-400 mt-2 italic">
                                {params.catalogMode
                                    ? `No poses picked — we'll use the default ${params.catalogSetSize || 5}-pose catalog set for this shoot type.`
                                    : 'No specific poses selected. AI will auto-generate a natural pose.'}
                            </p>
                        )}
                    </div>

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
                            {categories && Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </div>
                    {category && subCategories.length > 0 && (
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
                </div>
            )}
        </>
    );
};

