import React, { useState, useCallback } from 'react';
import type { MoodBoard, BrandAnalysis, BrandGuidelines } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Spinner } from './ui/Spinner';
import { generateMoodBoard, analyzeBrandLogo, fileToBase64 } from '../services/geminiService';
import { processImageFile } from '../imageUtils';
import { ImageDropzone } from './ui/ImageDropzone';

interface StrategyModalProps {
  onClose: () => void;
  onApplyGuidelines: (guidelines: BrandGuidelines) => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-200'
        }`}
    >
        {children}
    </button>
);

const ColorPalette: React.FC<{ colors: { name?: string; hex: string }[] }> = ({ colors }) => (
    <div className="flex flex-wrap gap-2">
        {colors.map(({ name, hex }) => (
            <div key={hex} className="text-center">
                <div
                    className="w-12 h-12 rounded-lg border border-slate-200"
                    style={{ backgroundColor: hex }}
                    title={`${name || 'Color'}: ${hex}`}
                />
                <p className="text-xs text-slate-500 mt-1">{hex}</p>
            </div>
        ))}
    </div>
);

const TagList: React.FC<{ title: string; tags: string[] }> = ({ title, tags }) => (
    <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-sm font-medium">
                    {tag}
                </span>
            ))}
        </div>
    </div>
);

const StrategyModal: React.FC<StrategyModalProps> = ({ onClose, onApplyGuidelines }) => {
    const [activeTab, setActiveTab] = useState<'moodboard' | 'brand'>('moodboard');
    
    // Moodboard state
    const [moodboardInput, setMoodboardInput] = useState('');
    const [moodboardResult, setMoodboardResult] = useState<MoodBoard | null>(null);
    const [isGeneratingMoodboard, setIsGeneratingMoodboard] = useState(false);
    const [moodboardError, setMoodboardError] = useState<string | null>(null);

    // Brand analysis state
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [brandAnalysisResult, setBrandAnalysisResult] = useState<BrandAnalysis | null>(null);
    const [isAnalyzingLogo, setIsAnalyzingLogo] = useState(false);
    const [brandError, setBrandError] = useState<string | null>(null);

    const handleGenerateMoodboard = useCallback(async () => {
        if (!moodboardInput.trim()) return;
        setIsGeneratingMoodboard(true);
        setMoodboardError(null);
        setMoodboardResult(null);
        try {
            const result = await generateMoodBoard(moodboardInput);
            setMoodboardResult(result);
        } catch (err) {
            setMoodboardError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsGeneratingMoodboard(false);
        }
    }, [moodboardInput]);

    const handleAnalyzeLogo = useCallback(async () => {
        if (!logoFile) return;
        setIsAnalyzingLogo(true);
        setBrandError(null);
        setBrandAnalysisResult(null);
        try {
            const base64 = await fileToBase64(logoFile); // Convert to base64 here
            const result = await analyzeBrandLogo(base64, logoFile.type); // Pass base64 and mimeType
            setBrandAnalysisResult(result);
        } catch (err) {
            setBrandError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsAnalyzingLogo(false);
        }
    }, [logoFile]);

    const handleLogoFileChange = useCallback(async (file: File | null) => {
        setBrandAnalysisResult(null);
        if (file) {
            const processedFile = await processImageFile(file, { maxWidth: 512, maxHeight: 512, format: 'image/png' });
            setLogoFile(processedFile);
            setLogoPreview(URL.createObjectURL(processedFile));
        } else {
            setLogoFile(null);
            setLogoPreview(null);
        }
    }, []);

    const handleApply = () => {
        if (brandAnalysisResult) {
            onApplyGuidelines(brandAnalysisResult);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-main w-full max-w-2xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
                <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <Icon name="strategy" className="w-6 h-6 mr-3 text-primary" />
                        <h2 className="text-xl font-bold text-slate-800">Creative Strategy Hub</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </header>

                <div className="p-4 flex-shrink-0">
                    <div className="flex justify-center items-center p-1 bg-slate-200/80 rounded-lg space-x-1">
                        <TabButton active={activeTab === 'moodboard'} onClick={() => setActiveTab('moodboard')}>AI Mood Board</TabButton>
                        <TabButton active={activeTab === 'brand'} onClick={() => setActiveTab('brand')}>Brand Alignment</TabButton>
                    </div>
                </div>

                <main className="flex-grow overflow-y-auto p-6">
                    {activeTab === 'moodboard' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Mood Board Generator</h3>
                                <p className="text-sm text-slate-500">Describe your product or campaign idea to get instant creative direction.</p>
                            </div>
                            <textarea
                                value={moodboardInput}
                                onChange={(e) => setMoodboardInput(e.target.value)}
                                placeholder="e.g., An organic, ayurvedic face cream for sensitive skin"
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-800"
                                rows={3}
                            />
                            <Button onClick={handleGenerateMoodboard} disabled={isGeneratingMoodboard || !moodboardInput.trim()}>
                                {isGeneratingMoodboard ? 'Generating...' : 'Generate Mood Board'}
                            </Button>

                            {isGeneratingMoodboard && <div className="flex justify-center p-8"><Spinner /></div>}
                            {moodboardError && <p className="text-red-500 text-sm">{moodboardError}</p>}
                            {moodboardResult && (
                                <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200 space-y-4 animate-fade-in">
                                    <h3 className="font-semibold text-slate-800">Creative Concept</h3>
                                    <p className="text-sm text-slate-600 italic">"{moodboardResult.concept}"</p>
                                    <ColorPalette colors={moodboardResult.colors} />
                                    <TagList title="Recommended Styles" tags={moodboardResult.styles} />
                                    <TagList title="Brand Tone" tags={moodboardResult.tones} />
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'brand' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Auto Brand Alignment</h3>
                                <p className="text-sm text-slate-500">Upload your logo to extract brand guidelines and apply them to your workspace.</p>
                            </div>
                            <ImageDropzone 
                                id="logo-upload-strategy"
                                previewUrl={logoPreview}
                                onFileChange={handleLogoFileChange}
                                prompt="Upload Your Logo"
                            />
                            <Button onClick={handleAnalyzeLogo} disabled={isAnalyzingLogo || !logoFile}>
                                {isAnalyzingLogo ? 'Analyzing...' : 'Analyze Brand Logo'}
                            </Button>

                             {isAnalyzingLogo && <div className="flex justify-center p-8"><Spinner /></div>}
                            {brandError && <p className="text-red-500 text-sm">{brandError}</p>}
                            {brandAnalysisResult && (
                                <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200 space-y-4 animate-fade-in">
                                    <ColorPalette colors={brandAnalysisResult.colors} />
                                    <TagList title="Typography" tags={[brandAnalysisResult.typography]} />
                                    <TagList title="Brand Vibe" tags={brandAnalysisResult.vibe} />
                                    <div className="pt-4">
                                        <Button onClick={handleApply} fullWidth>
                                            <Icon name="sparkles" className="w-4 h-4 mr-2" />
                                            Apply Brand Style to Workspace
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default StrategyModal;
