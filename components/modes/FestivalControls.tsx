import React, { useState, useRef, useEffect } from 'react';
import type { GenerateImageParams, FestivalCreativePlan, FestivalChatMessage } from '../../types.js';
import { FESTIVAL_PRESETS } from '../../constants.js';
import { SectionTitle, BestForLabel, HelpLabel } from './shared.js';
import { Icon } from '../ui/Icon.js';
import { StyleSelector } from '../ui/StyleSelector.js';
import { analyzeFestivalCreativeAgent } from '../../services/geminiService.js';

interface FestivalControlsProps {
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    credits?: number;
    onDeductCredits?: (cost: number) => boolean;
}

const POPULAR_FESTIVALS = [
    { name: 'Diwali', type: 'Major' },
    { name: 'Holi', type: 'Major' },
    { name: 'Durga Puja', type: 'Major' },
    { name: 'Eid', type: 'Major' },
    { name: 'Christmas', type: 'Major' },
    { name: 'Ganesh Chaturthi', type: 'Major' },
    { name: 'Navratri', type: 'Major' },
    { name: 'Chhath Puja', type: 'Regional' },
    { name: 'Onam', type: 'Regional' },
    { name: 'Pongal', type: 'Regional' },
    { name: 'Baisakhi', type: 'Regional' },
    { name: 'Karwa Chauth', type: 'Regional' },
    { name: 'Makar Sankranti', type: 'Regional' },
    { name: 'Bihu', type: 'Regional' },
    { name: 'Raksha Bandhan', type: 'Regional' },
    { name: 'Lohri', type: 'Regional' },
    { name: 'Teej', type: 'Regional' },
    { name: 'Bathukamma', type: 'Regional' },
    { name: 'Ugadi', type: 'Regional' },
];

const STARTER_PROMPTS = [
    'Diwali Royal Gold with brass urlis & flickering diyas',
    'Chhath Puja Sunrise Arghya on morning river ghats',
    'Onam Grand Pookkalam floral carpet with bronze lamps',
    'Minimalist Pastel Pinterest aesthetic with festive glow',
    'Holi Organic Gulal powders on raw white marble',
    'Durga Puja Dhunuchi smoke & crimson terracotta',
];

export const FestivalControls: React.FC<FestivalControlsProps> = ({ 
    params, handleParamChange, credits, onDeductCredits 
}) => {
    // Mode Switch: AI Creative Director vs Manual Presets
    const [controlMode, setControlMode] = useState<'ai' | 'manual'>(params.festivalAgentMode || 'ai');

    // Selected Festival Name
    const [selectedFestival, setSelectedFestival] = useState<string>(params.festivalName || 'Diwali');
    const [customFestivalInput, setCustomFestivalInput] = useState<string>('');
    const [isCustomFestival, setIsCustomFestival] = useState<boolean>(false);

    // Pinterest / Aesthetic Reference Preview & File
    const [pinterestPreview, setPinterestPreview] = useState<string | null>(params.festivalReferenceImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Director Chat State
    const [chatInput, setChatInput] = useState<string>('');
    const [isConsulting, setIsConsulting] = useState<boolean>(false);
    const [activePlan, setActivePlan] = useState<FestivalCreativePlan | null>(null);
    const [appliedPlanTitle, setAppliedPlanTitle] = useState<string | null>(
        params.festivalCreativeConcept ? (params.festivalStyle?.split('|')[1] || 'Applied Concept') : null
    );

    const [messages, setMessages] = useState<FestivalChatMessage[]>([
        {
            id: 'init-1',
            sender: 'director',
            text: `Welcome to the Festive Creative Studio! I am your ZeperAI Festive Creative Director. Whether you are creating shoots for major celebrations or regional cultural festivals (Chhath Puja, Onam, Pongal, Baisakhi, etc.), I can design the lighting, props, and composition. If you have an aesthetic reference or moodboard from Pinterest, upload it below and ZeperAI Agent will replicate its aesthetic seamlessly with your product!`,
            timestamp: Date.now()
        }
    ]);

    const chatScrollRef = useRef<HTMLDivElement>(null);

    // Manual Presets State
    const [activeCategory, setActiveCategory] = useState<string>(() => {
        if (params.festivalStyle && params.festivalStyle.includes('|')) {
            return params.festivalStyle.split('|')[0];
        }
        if (params.festivalStylePresets && params.festivalStylePresets.length > 0) {
             const first = params.festivalStylePresets[0];
             if (first.includes('|')) return first.split('|')[0];
        }
        return FESTIVAL_PRESETS[0].category;
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages, isConsulting]);

    const handleModeSwitch = (mode: 'ai' | 'manual') => {
        setControlMode(mode);
        handleParamChange('festivalAgentMode', mode);
    };

    const handleFestivalSelect = (fest: string) => {
        setSelectedFestival(fest);
        setIsCustomFestival(false);
        handleParamChange('festivalName', fest);
    };

    const handleCustomFestivalSubmit = () => {
        if (!customFestivalInput.trim()) return;
        setSelectedFestival(customFestivalInput.trim());
        handleParamChange('festivalName', customFestivalInput.trim());
    };

    // Pinterest Reference Handling
    const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        handleParamChange('festivalReferenceImage', file);
        const objectUrl = URL.createObjectURL(file);
        setPinterestPreview(objectUrl);
        handleParamChange('festivalReferenceImageUrl', objectUrl);
    };

    const handleClearReferenceImage = () => {
        if (pinterestPreview && pinterestPreview.startsWith('blob:')) {
            URL.revokeObjectURL(pinterestPreview);
        }
        setPinterestPreview(null);
        handleParamChange('festivalReferenceImage', undefined);
        handleParamChange('festivalReferenceImageUrl', undefined);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Run Creative Consultation with Credit Deduction
    const handleSendConsultation = async (promptOverride?: string) => {
        const promptToSend = (promptOverride || chatInput).trim();
        if (!promptToSend && !params.frontProductImage && !params.festivalReferenceImage) {
            return;
        }

        // 1. Credit Check & Deduction (1 Credit)
        if (onDeductCredits) {
            const hasCredits = onDeductCredits(1);
            if (!hasCredits) {
                return; // Insufficient credits, modal/toast handled by onDeductCredits
            }
        }

        const userMsgText = promptToSend || `Direct a shoot for ${selectedFestival} highlighting my product.`;
        const newUserMsg: FestivalChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            text: userMsgText,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setChatInput('');
        setIsConsulting(true);

        try {
            const response = await analyzeFestivalCreativeAgent({
                productImage: params.frontProductImage,
                referenceImage: params.festivalReferenceImage,
                referenceImageUrl: params.festivalReferenceImageUrl,
                festivalName: selectedFestival,
                userPrompt: userMsgText,
                chatHistory: messages.map(m => ({ sender: m.sender, text: m.text }))
            });

            const newDirectorMsg: FestivalChatMessage = {
                id: `director-${Date.now()}`,
                sender: 'director',
                text: response.reply,
                timestamp: Date.now(),
                conceptPlan: response.conceptPlan
            };

            setMessages(prev => [...prev, newDirectorMsg]);
            if (response.conceptPlan) {
                setActivePlan(response.conceptPlan);
            }
        } catch (err: any) {
            console.error('Failed to get consultation:', err);
            setMessages(prev => [
                ...prev,
                {
                    id: `director-err-${Date.now()}`,
                    sender: 'director',
                    text: `I ran into a connection issue, but here is a core shoot direction for ${selectedFestival}: Let's feature your product prominently on an elevated brass or stone pedestal surrounded by fresh celebratory accents and warm cinematic candlelight.`,
                    timestamp: Date.now()
                }
            ]);
        } finally {
            setIsConsulting(false);
        }
    };

    // Apply Active Creative Blueprint to Generation Params
    const handleApplyConcept = (plan: FestivalCreativePlan) => {
        setActivePlan(plan);
        handleParamChange('festivalCreativeConcept', plan.finalPrompt);
        handleParamChange('festivalSceneDescription', `${plan.creativeVibe}. ${plan.backdropAndProps}`);
        handleParamChange('festivalPropsPrompt', plan.backdropAndProps);
        handleParamChange('festivalLightingPrompt', plan.lightingSetup);
        handleParamChange('festivalName', plan.festivalName);
        handleParamChange('festivalStyle', `${plan.festivalName}|${plan.themeTitle}`);
        setAppliedPlanTitle(plan.themeTitle);
    };

    // Manual Presets Scrolling
    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const currentPresets = FESTIVAL_PRESETS.find(c => c.category === activeCategory)?.presets || [];
    const styleOptions = currentPresets.map(p => ({
        label: p.name,
        value: `${activeCategory}|${p.name}`,
        thumbnail: p.thumbnail || `https://placehold.co/300x300/fcd34d/b45309?text=${encodeURIComponent(p.name)}`
    }));

    const handlePresetsChange = (newPresets: string[]) => {
        handleParamChange('festivalStylePresets', newPresets);
        const lastSelected = newPresets.length > 0 ? newPresets[newPresets.length - 1] : '';
        handleParamChange('festivalStyle', lastSelected);
    };

    const hasSelection = params.festivalStylePresets && params.festivalStylePresets.length > 0;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <SectionTitle title="FESTIVE SHOOT STUDIO" className="!mt-0 !mb-1" />
                    <BestForLabel text="Cinematic festive campaigns for major national holidays and regional cultural celebrations." />
                </div>
                {credits !== undefined && (
                    <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <Icon name="sparkles" className="w-3 h-3" />
                            {credits} {credits === 1 ? 'Credit' : 'Credits'} Available
                        </span>
                    </div>
                )}
            </div>

            {/* Mode Switcher: AI Creative Director vs Manual Presets */}
            <div className="p-1.5 bg-slate-100 rounded-2xl flex items-center border border-slate-200 shadow-inner">
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
                    <span>AI Creative Director (Chat & Direct)</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase">
                        Vision
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
                    <span>Manual Presets</span>
                </button>
            </div>

            {/* ========================================================= */}
            {/* 1. AI CREATIVE DIRECTOR MODE                              */}
            {/* ========================================================= */}
            {controlMode === 'ai' ? (
                <div className="space-y-4">
                    {/* Creative Director Intro Card - Sleek Black Theme */}
                    <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-md flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon name="sparkles" className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                            <div className="font-bold text-white flex items-center gap-2">
                                ZeperAI Festive Creative Director
                                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    Smart Vision
                                </span>
                            </div>
                            <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                                Curates bespoke shoots for <strong>any major or regional festival</strong> (Diwali, Chhath Puja, Onam, Pongal, Baisakhi, etc.). Upload an optional <strong>Pinterest moodboard</strong> and ZeperAI Agent will replicate its aesthetic seamlessly with your product!
                            </p>
                        </div>
                    </div>

                    {/* Festival Picker (Major & Regional) */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <HelpLabel label="Select Festival" tooltip="Choose from major national celebrations or regional cultural festivals." className="!mb-0 !text-xs" />
                            <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">
                                Current: <span className="text-blue-600 font-bold">{selectedFestival}</span>
                            </span>
                        </div>

                        {/* Quick Festival Buttons - Blue selected accent */}
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                            {POPULAR_FESTIVALS.map(fest => {
                                const isSelected = !isCustomFestival && selectedFestival === fest.name;
                                return (
                                    <button
                                        key={fest.name}
                                        type="button"
                                        onClick={() => handleFestivalSelect(fest.name)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                                            isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-slate-800'
                                        }`}
                                    >
                                        {fest.name}
                                        {fest.type === 'Regional' && (
                                            <span className={`ml-1 text-[9px] px-1 py-0.2 rounded font-normal ${isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'}`}>
                                                Regional
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Festival Option */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Or enter any custom / local festival (e.g. Teej, Losar, Nuakhai)..."
                                value={customFestivalInput}
                                onChange={(e) => {
                                    setCustomFestivalInput(e.target.value);
                                    setIsCustomFestival(true);
                                }}
                                className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={handleCustomFestivalSubmit}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs"
                            >
                                Set Festival
                            </button>
                        </div>
                    </div>

                    {/* Pinterest / Moodboard Reference Vision Upload */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                            <HelpLabel 
                                label="Pinterest / Moodboard Reference (Optional)" 
                                tooltip="Upload an aesthetic photo from Pinterest or Instagram. ZeperAI Agent decodes its lighting, palette, and framing to replicate the style onto your product." 
                                className="!mb-0 !text-xs" 
                            />
                            <span className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                                Aesthetic Match
                            </span>
                        </div>

                        {pinterestPreview ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white p-2 flex items-center gap-3">
                                <img 
                                    src={pinterestPreview} 
                                    alt="Pinterest Inspiration" 
                                    className="w-16 h-16 object-cover rounded-lg border border-slate-200" 
                                />
                                <div className="flex-1 text-xs">
                                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <Icon name="sparkles" className="w-3.5 h-3.5 text-blue-600" />
                                        Aesthetic Reference Attached
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        ZeperAI Agent will extract this photo's lighting, textures, and color tones for {selectedFestival}.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClearReferenceImage}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Remove Reference"
                                >
                                    <Icon name="close" className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-4 border border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-xl text-center cursor-pointer transition-all hover:bg-blue-50/20 group"
                            >
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleReferenceFileChange}
                                    className="hidden" 
                                />
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                                    <Icon name="image" className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-bold text-slate-700">
                                    Drop a Pinterest Inspiration or Moodboard Shot
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    ZeperAI Agent decodes its lighting, textures, and camera framing to apply onto your product.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Active Blueprint Status Banner */}
                    {appliedPlanTitle && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                                <span className="text-xs font-bold text-green-900">
                                    Active Shoot Plan: <span className="underline">{appliedPlanTitle}</span>
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                Ready to Generate
                            </span>
                        </div>
                    )}

                    {/* Creative Director Chat & Concept Workspace */}
                    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs flex flex-col">
                        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-xs font-bold text-slate-800">
                                    Creative Director Consultation
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400">
                                1 Credit per Consultation / Plan
                            </span>
                        </div>

                        {/* Message Stream */}
                        <div 
                            ref={chatScrollRef}
                            className="p-3 space-y-3 max-h-72 overflow-y-auto scrollbar-thin text-xs"
                        >
                            {messages.map((msg) => (
                                <div 
                                    key={msg.id}
                                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${
                                        msg.sender === 'user'
                                            ? 'bg-slate-900 text-white rounded-br-none'
                                            : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                                    }`}>
                                        <div className="font-semibold text-[10px] opacity-70 mb-0.5">
                                            {msg.sender === 'user' ? 'You' : 'ZeperAI Creative Director'}
                                        </div>
                                        <div className="text-xs whitespace-pre-wrap">{msg.text}</div>
                                    </div>

                                    {/* Embedded Concept Blueprint Card */}
                                    {msg.conceptPlan && (
                                        <div className="mt-2.5 w-full bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 space-y-2.5 text-xs animate-fade-in shadow-xs">
                                            <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/80">
                                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                    <Icon name="sparkles" className="w-3.5 h-3.5 text-blue-600" />
                                                    {msg.conceptPlan.themeTitle}
                                                </div>
                                                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                                    {msg.conceptPlan.festivalName}
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-slate-600 italic">
                                                "{msg.conceptPlan.creativeVibe}"
                                            </p>

                                            {msg.conceptPlan.pinterestAestheticMatch && (
                                                <div className="p-2 bg-white/80 rounded-lg border border-blue-100 text-[11px]">
                                                    <span className="font-bold text-blue-800">Pinterest Translation: </span>
                                                    <span className="text-slate-600">{msg.conceptPlan.pinterestAestheticMatch}</span>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                                <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                                                    <span className="font-bold text-slate-700 block mb-0.5">Props & Backdrop</span>
                                                    <span className="text-slate-600 leading-snug">{msg.conceptPlan.backdropAndProps}</span>
                                                </div>
                                                <div className="p-2 bg-white rounded-lg border border-slate-200/60">
                                                    <span className="font-bold text-slate-700 block mb-0.5">Lighting Setup</span>
                                                    <span className="text-slate-600 leading-snug">{msg.conceptPlan.lightingSetup}</span>
                                                </div>
                                            </div>

                                            {/* Color Palette */}
                                            {msg.conceptPlan.colorPalette && msg.conceptPlan.colorPalette.length > 0 && (
                                                <div className="flex items-center gap-1.5 pt-1">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Palette:</span>
                                                    <div className="flex gap-1">
                                                        {msg.conceptPlan.colorPalette.map((col, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700"
                                                            >
                                                                {col}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyConcept(msg.conceptPlan!)}
                                                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5"
                                                >
                                                    <Icon name="check" className="w-3.5 h-3.5" />
                                                    Apply Concept to Shoot
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isConsulting && (
                                <div className="flex items-start gap-2">
                                    <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                        <span className="font-medium animate-pulse">
                                            Creative Director formulating {selectedFestival} concept & lighting...
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Starter Suggestion Chips */}
                        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">Ideas:</span>
                            {STARTER_PROMPTS.map((promptText, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSendConsultation(promptText)}
                                    disabled={isConsulting}
                                    className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-800 border border-slate-200 hover:border-blue-300 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors shrink-0"
                                >
                                    {promptText}
                                </button>
                            ))}
                        </div>

                        {/* Input Box */}
                        <div className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
                            <input
                                type="text"
                                placeholder={`Tell Director your vision for ${selectedFestival} (e.g. Royal brass setting, candlelight, minimal aesthetic)...`}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendConsultation();
                                    }
                                }}
                                disabled={isConsulting}
                                className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => handleSendConsultation()}
                                disabled={isConsulting}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                            >
                                <Icon name="sparkles" className="w-3.5 h-3.5" />
                                <span>Direct Shoot (1 Credit)</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* ========================================================= */
                /* 2. MANUAL PRESETS MODE                                    */
                /* ========================================================= */
                <div className="space-y-4">
                    <div className="relative group mb-4">
                        {/* Left Arrow */}
                        <button 
                            type="button"
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -ml-2 p-1.5 bg-white shadow-lg border border-slate-100 text-slate-500 hover:text-primary rounded-full transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                            aria-label="Scroll Left"
                        >
                            <Icon name="chevron-left" className="w-4 h-4" />
                        </button>

                        {/* Scroll Container */}
                        <div 
                            ref={scrollContainerRef}
                            className="flex overflow-x-auto gap-2 pb-2 px-1 scroll-smooth w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] mask-image-gradient"
                        >
                            {FESTIVAL_PRESETS.map(cat => {
                                const isActive = activeCategory === cat.category;
                                return (
                                    <button 
                                        key={cat.category}
                                        type="button"
                                        onClick={() => setActiveCategory(cat.category)}
                                        className={`
                                            px-4 py-2 whitespace-nowrap text-xs font-bold rounded-full transition-all duration-200 border shrink-0
                                            ${isActive 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 transform scale-105' 
                                                : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200 hover:border-slate-300'}
                                        `}
                                    >
                                        {cat.category}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Arrow */}
                        <button 
                            type="button"
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 -mr-2 p-1.5 bg-white shadow-lg border border-slate-100 text-slate-500 hover:text-primary rounded-full transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Scroll Right"
                        >
                            <Icon name="chevron-left" className="w-4 h-4 rotate-180" />
                        </button>
                    </div>

                    <StyleSelector 
                        options={styleOptions}
                        value={params.festivalStylePresets || []}
                        onChange={handlePresetsChange}
                        className="grid-cols-2 sm:grid-cols-3 gap-4"
                        multiple={true}
                    />

                    {hasSelection && (
                        <div className="flex justify-end pt-2">
                            <button 
                                type="button"
                                onClick={() => {
                                    handleParamChange('festivalStylePresets', []);
                                    handleParamChange('festivalStyle', '');
                                }}
                                className="text-xs text-slate-400 hover:text-red-500 font-medium flex items-center transition-colors px-2 py-1 rounded hover:bg-red-50"
                            >
                                <Icon name="remove" className="w-3 h-3 mr-1" />
                                Clear Preset Selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
