
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { ImageDropzone } from './ui/ImageDropzone';
import { FormTextArea, FormInput } from './ui/Form';
import { Select } from './ui/Select';
import { Toggle } from './ui/Toggle';
import { AppMode, AspectRatio, ResolutionQuality, ProductCategory, OutputFormat } from '../types';
import type { GenerateImageParams, BrandKit, GeneratedImage } from '../types';
import { analyzeProductContext, generateAdCopy } from '../services/geminiService';
import { Spinner } from './ui/Spinner';
import { DirectorCanvas } from './DirectorCanvas';
import { PRODUCT_CATEGORY_OPTIONS, PRO_PRODUCT_STYLE_PRESETS, AI_SUGGESTED } from '../constants';

interface CreativeWorkflowProps {
    brandKit: BrandKit | null;
    onGenerate: (params: GenerateImageParams) => void;
    isLoading: boolean;
    onClose: () => void;
    userTier: string;
}

export const CreativeWorkflow: React.FC<CreativeWorkflowProps> = ({
    brandKit, onGenerate, isLoading, onClose, userTier
}) => {
    const [step, setStep] = useState(1);
    const [activeTab, setActiveTab] = useState<'config' | 'editor'>('config');
    const [params, setParams] = useState<GenerateImageParams>({
        appMode: AppMode.AdCreative,
        productDescription: '',
        aspectRatios: [AspectRatio.Square],
        outputFormat: OutputFormat.PNG,
        resolutionQuality: ResolutionQuality.Standard,
        selectedAngles: [],
        productStylePreset: 'Modern',
        backdropAndProps: '',
        textPlacementSuggestion: '',
        overlayText: '',
        fontStyle: 'Inter',
        isBold: true,
        isItalic: false,
        isUnderlined: false,
        productCategory: ProductCategory.Generic,
        applyBrandIdentity: true,
        adTitle: '',
        adSubheading: '',
        adCta: 'Shop Now',
        adTitleSize: 32,
        adSubheadingSize: 16,
        adImageZoom: 1,
        adLogoSize: 40,
        adTextColor: brandKit?.primary_hex || '#ffffff',
        adCtaBgColor: brandKit?.primary_hex || '#6A5AE0'
    });

    const [productPreview, setProductPreview] = useState<string | null>(null);
    const [suggestedEnvironments, setSuggestedEnvironments] = useState<string[]>([]);
    const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

    const handleParamChange = (field: keyof GenerateImageParams, value: any) => {
        setParams(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = async (file: File | null) => {
        if (!file) {
            setParams(prev => ({ ...prev, frontProductImage: undefined }));
            setProductPreview(null);
            return;
        }
        setParams(prev => ({ ...prev, frontProductImage: file }));
        setProductPreview(URL.createObjectURL(file));

        // Auto-analyze context
        setIsAnalyzing(true);
        try {
            const result = await analyzeProductContext(file);
            setSuggestedEnvironments(result.environments);
            
            if (result.suggestedPreset) {
                setDetectedCategory(result.suggestedPreset);
                // Try to find matching ProductCategory
                const matchedCat = PRODUCT_CATEGORY_OPTIONS.find(opt => 
                    result.suggestedPreset?.toLowerCase().includes(opt.label.toLowerCase())
                );
                if (matchedCat) {
                    handleParamChange('productCategory', matchedCat.value);
                }
            }

            if (!params.productDescription) {
                handleParamChange('productDescription', result.context.join(', '));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateCopy = async () => {
        if (!params.productDescription) return;
        setIsGeneratingCopy(true);
        try {
            const result = await generateAdCopy(params.productDescription, params.adStylePreset || 'Modern');
            setParams(prev => ({
                ...prev,
                adTitle: result.title,
                adSubheading: result.subheading,
                adCta: result.cta
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingCopy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Icon name="sparkles" className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">AI Ad Creative Studio</h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    >
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT SIDEBAR: CONTROLS */}
                    <aside className="w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/30 overflow-y-auto scrollbar-thin relative text-slate-900">
                        <div className="p-6 space-y-8 pb-32">
                            {/* Step 1: Asset */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">1</span>
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">Product Asset</label>
                                </div>
                                <ImageDropzone 
                                    id="workflow-product"
                                    prompt="Drop product photo here"
                                    previewUrl={productPreview}
                                    onFileChange={handleFileChange}
                                    className="h-48 border-2 border-dashed border-slate-200 hover:border-primary/50 transition-colors rounded-2xl bg-white shadow-sm"
                                />
                                {isAnalyzing && (
                                    <div className="flex items-center gap-2 text-primary animate-pulse">
                                        <Icon name="sparkles" className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase">Analyzing...</span>
                                    </div>
                                )}
                                <FormTextArea 
                                    label="Description"
                                    placeholder="Describe your product..."
                                    value={params.productDescription}
                                    onChange={e => handleParamChange('productDescription', e.target.value)}
                                    rows={2}
                                />
                            </section>

                            <hr className="border-slate-100" />

                            {/* Step 2: Content */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">2</span>
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">Ad Content</label>
                                </div>
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon name="magic-wand" className="w-3 h-3 text-primary" />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase">AI Copywriter</span>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            className="!py-0.5 !px-2 !text-[9px] bg-white shadow-sm border border-indigo-100"
                                            onClick={handleGenerateCopy}
                                            isLoading={isGeneratingCopy}
                                        >
                                            Generate
                                        </Button>
                                    </div>
                                    <FormInput 
                                        label="Headline"
                                        value={params.adTitle}
                                        onChange={e => handleParamChange('adTitle', e.target.value)}
                                        className="!py-1.5 !text-xs"
                                    />
                                    <FormTextArea 
                                        label="Subheading"
                                        value={params.adSubheading}
                                        onChange={e => handleParamChange('adSubheading', e.target.value)}
                                        rows={2}
                                        className="!py-1.5 !text-xs"
                                    />
                                    <FormInput 
                                        label="CTA"
                                        value={params.adCta}
                                        onChange={e => handleParamChange('adCta', e.target.value)}
                                        className="!py-1.5 !text-xs"
                                    />
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* Step 3: Scene */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">3</span>
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">Scene & Style</label>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Scene</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {suggestedEnvironments.slice(0, 4).map((env, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => handleParamChange('backdropAndProps', env)}
                                                className={`px-2 py-1 text-[9px] font-bold rounded-full border transition-all ${
                                                    params.backdropAndProps === env 
                                                    ? 'bg-primary text-white border-primary' 
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/20'
                                                }`}
                                            >
                                                {env}
                                            </button>
                                        ))}
                                    </div>
                                    <FormInput 
                                        label=""
                                        placeholder="Scene description..."
                                        value={params.backdropAndProps}
                                        onChange={e => handleParamChange('backdropAndProps', e.target.value)}
                                        className="!py-1.5 !text-xs !mb-0"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Select 
                                        label="Ratio"
                                        value={params.aspectRatios[0]}
                                        onChange={e => handleParamChange('aspectRatios', [e.target.value])}
                                        className="!py-1.5 !text-xs"
                                    >
                                        <option value={AspectRatio.Square}>1:1</option>
                                        <option value={AspectRatio.PortraitPost}>4:5</option>
                                        <option value={AspectRatio.Portrait}>9:16</option>
                                        <option value={AspectRatio.Landscape}>16:9</option>
                                    </Select>
                                    <Select 
                                        label="Category"
                                        value={params.productCategory}
                                        onChange={e => handleParamChange('productCategory', e.target.value)}
                                        className="!py-1.5 !text-xs"
                                    >
                                        {PRODUCT_CATEGORY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Select>
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* Step 4: Visuals */}
                            <section className="space-y-4 pb-8">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">4</span>
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">Layout Editor</label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Text Color</label>
                                        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                                            <input 
                                                type="color" 
                                                value={params.adTextColor} 
                                                onChange={e => handleParamChange('adTextColor', e.target.value)}
                                                className="w-6 h-6 rounded cursor-pointer border-none"
                                            />
                                            <span className="text-[9px] font-mono text-slate-400">{params.adTextColor.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase">Btn Color</label>
                                        <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                                            <input 
                                                type="color" 
                                                value={params.adCtaBgColor} 
                                                onChange={e => handleParamChange('adCtaBgColor', e.target.value)}
                                                className="w-6 h-6 rounded cursor-pointer border-none"
                                            />
                                            <span className="text-[9px] font-mono text-slate-400">{params.adCtaBgColor.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                                            <span>Text Size</span>
                                            <span>{params.adTitleSize}px</span>
                                        </label>
                                        <input 
                                            type="range" min="12" max="100" 
                                            value={params.adTitleSize} 
                                            onChange={e => handleParamChange('adTitleSize', parseInt(e.target.value))}
                                            className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase flex justify-between">
                                            <span>Product Zoom</span>
                                            <span>{params.adImageZoom?.toFixed(1)}x</span>
                                        </label>
                                        <input 
                                            type="range" min="0.5" max="2.5" step="0.1"
                                            value={params.adImageZoom} 
                                            onChange={e => handleParamChange('adImageZoom', parseFloat(e.target.value))}
                                            className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Action Footer for Sidebar */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100">
                            <Button 
                                fullWidth 
                                variant="primary"
                                className="shadow-lg shadow-primary/25 h-14 font-black uppercase tracking-widest text-xs"
                                onClick={() => onGenerate(params)}
                                isLoading={isLoading}
                                disabled={!params.productDescription || !productPreview}
                            >
                                <Icon name="sparkles" className="w-5 h-5 mr-3" />
                                Generate Creative
                            </Button>
                        </div>
                    </aside>

                    {/* MAIN AREA: PREVIEW */}
                    <main className="flex-1 bg-slate-100/50 relative overflow-hidden flex flex-col items-center justify-center p-8 lg:p-16">
                        {/* Checkerboard/Blueprint Pattern */}
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
                        
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            {productPreview ? (
                                <div 
                                    className="w-full h-full max-w-2xl max-h-[70vh] shadow-2xl rounded-3xl overflow-hidden bg-white border-8 border-white ring-1 ring-slate-200"
                                    style={{ aspectRatio: params.aspectRatios[0] === AspectRatio.Landscape ? '16/9' : params.aspectRatios[0] === AspectRatio.Portrait ? '9/16' : params.aspectRatios[0] === AspectRatio.PortraitPost ? '4/5' : '1/1' }}
                                >
                                    <DirectorCanvas 
                                        backgroundImage={productPreview}
                                        brandKit={brandKit}
                                        params={params}
                                        onUpdateParams={(newParams) => setParams(prev => ({ ...prev, ...newParams }))}
                                        aspectRatio={params.aspectRatios[0]}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center max-w-sm">
                                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-slate-100 rotate-3">
                                        <Icon name="image" className="w-12 h-12 text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-3">Live Preview</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">
                                        Upload your product to begin editing the ad layout in real-time.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Status Bar */}
                        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-1 bg-slate-200 rounded-full" />
                                ))}
                            </div>
                            <div className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Workflow Ready</span>
                            </div>
                        </div>
                    </main>
                </div>
            </motion.div>
        </div>
    );
};
