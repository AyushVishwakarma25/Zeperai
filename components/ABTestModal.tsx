
/**
 * FILE: ABTestModal.tsx
 * 
 * PURPOSE:
 * - Generates and displays A/B testing ideas for an image.
 * 
 * FLOW:
 * Manual Trigger -> Credit Check -> /api/gemini/suggestions -> Display List
 * 
 * INPUT:
 * - image: GeneratedImage
 * 
 * OUTPUT:
 * - List of suggestions (Title, Description, Hypothesis)
 * 
 * NOTES:
 * - Offline protected (skips fetch).
 */

import React, { useState, useCallback } from 'react';
import type { GeneratedImage, ABTestSuggestion } from '../types.js';
import { Button } from './ui/Button.js';
import { Icon } from './ui/Icon.js';
import { Spinner } from './ui/Spinner.js';
import { getABTestSuggestions, editImage } from '../services/geminiService.js';
import { useNetworkStatus } from '../hooks/useNetworkStatus.js';
import { Skeleton } from './ui/Skeleton.js';
import { FeaturePricingTable } from './FeaturePricingTable.js';

interface ABTestModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onGenerate: (params: any) => void;
  onApiError?: () => void;
  onDeductCredits: (cost: number) => boolean;
  onOpenPricingModal?: () => void;
}

const ABTestModal: React.FC<ABTestModalProps> = ({ image, onClose, onGenerate, onApiError, onDeductCredits, onOpenPricingModal }) => {
    const isOnline = useNetworkStatus();
    const [suggestions, setSuggestions] = useState<ABTestSuggestion[]>([]);
    const [showPricingTable, setShowPricingTable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
    const [regeneratedResults, setRegeneratedResults] = useState<Record<number, string>>({});

    const handleGenerateAnalysis = async () => {
        if (!isOnline) return;
        
        // CREDIT CHECK
        if (!onDeductCredits(1)) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await getABTestSuggestions(image);
            setSuggestions(result);
            setHasGenerated(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(msg);
            if (onApiError) onApiError();
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRegenerate = async (suggestion: ABTestSuggestion, index: number) => {
        if (!isOnline) return;
        
        // CREDIT CHECK
        if (!onDeductCredits(1)) return;

        setRegeneratingIndex(index);
        setError(null);
        
        try {
            // Build a precise prompt using original context + suggestion
            const prompt = `
                ORIGINAL CONTEXT: ${image.params.productDescription || 'A product visual'}
                SUGGESTED CHANGE: ${suggestion.description}
                GOAL: Generate a new high-fidelity version of the original creative, but precisely incorporating the suggested change while maintaining the brand's core product identity.
            `.trim();

            const result = await editImage({
                originalImageUrl: image.imageUrl,
                maskDataUrl: '', // Global edit
                prompt: prompt
            });

            setRegeneratedResults(prev => ({
                ...prev,
                [index]: result.imageUrl
            }));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Regeneration failed.';
            setError(msg);
        } finally {
            setRegeneratingIndex(null);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-main w-full max-w-5xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-300"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <Icon name="variants" className="w-6 h-6 mr-3 text-primary" />
                        <h2 className="text-xl font-bold text-slate-800">A/B Testing Variants</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </header>

                {showPricingTable && (
                    <div className="p-4 bg-slate-100 border-b border-slate-200 shrink-0 max-h-[50vh] overflow-y-auto">
                        <FeaturePricingTable
                            onOpenPricingModal={onOpenPricingModal}
                            onClose={() => setShowPricingTable(false)}
                            compact
                        />
                    </div>
                )}

                <div className="flex-grow flex overflow-hidden">
                    <aside className="w-1/3 bg-slate-50 p-4 border-r border-slate-200">
                        <h3 className="font-semibold text-slate-700 mb-2">Original Creative</h3>
                        <img src={image.imageUrl} alt="Original" className="rounded-lg w-full shadow-sm" referrerPolicy="no-referrer" />
                        <p className="text-xs text-slate-500 mt-2 italic">
                            Product: {image.params.productDescription || 'N/A'}
                        </p>
                    </aside>
                    <main className="flex-1 p-6 overflow-y-auto flex flex-col">
                        <h3 className="font-semibold text-slate-800 mb-4">AI-Suggested Variants for Better Engagement</h3>
                        
                        {!isOnline ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                                <Icon name="close" className="w-10 h-10 mb-2 text-slate-300" />
                                <p>Offline Mode: Cannot fetch AI suggestions.</p>
                            </div>
                        ) : !hasGenerated && !isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                    <Icon name="strategy" className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-slate-600 mb-6 max-w-sm">
                                    Generate 3 data-driven variation ideas to improve CTR. 
                                    <br/>Based on visual analysis of your creative.
                                </p>
                                <Button onClick={handleGenerateAnalysis}>
                                    Generate Analysis (1 Credit)
                                </Button>
                            </div>
                        ) : isLoading ? (
                            <div className="flex justify-center items-center h-full"><Spinner /></div>
                        ) : error ? (
                            <p className="text-red-500 text-sm">{error}</p>
                        ) : (
                            <div className="space-y-4">
                                {suggestions.map((suggestion, index) => (
                                    <div key={index} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-lg text-primary">{suggestion.title}</h4>
                                            {!regeneratedResults[index] && (
                                                <Button 
                                                    variant="secondary" 
                                                    onClick={() => handleRegenerate(suggestion, index)}
                                                    disabled={regeneratingIndex !== null}
                                                    className="text-xs h-8 px-3 rounded-lg"
                                                >
                                                    <Icon name="sparkles" className="w-3.5 h-3.5 mr-1.5" />
                                                    Regenerate (1 Credit)
                                                </Button>
                                            )}
                                        </div>
                                        
                                        <p className="text-sm text-slate-700 mb-3 leading-relaxed">
                                            <strong className="text-slate-900">Change:</strong> {suggestion.description}
                                        </p>
                                        
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                                            <p className="text-xs text-slate-500 italic">
                                                <strong className="text-slate-700 not-italic">Hypothesis:</strong> {suggestion.hypothesis}
                                            </p>
                                        </div>

                                        {/* Result Section */}
                                        {regeneratingIndex === index ? (
                                            <div className="space-y-2">
                                                <p className="text-[10px] uppercase font-bold text-primary animate-pulse flex items-center">
                                                    <Spinner className="w-3 h-3 mr-2" />
                                                    AI is applying changes...
                                                </p>
                                                <Skeleton className="w-full aspect-video rounded-lg" />
                                            </div>
                                        ) : regeneratedResults[index] ? (
                                            <div className="space-y-3 animate-fade-in">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] uppercase font-black tracking-wider text-green-600 flex items-center">
                                                        <Icon name="check-circle" className="w-3 h-3 mr-1" />
                                                        Variation Generated
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => window.open(regeneratedResults[index], '_blank')}
                                                            className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors flex items-center"
                                                        >
                                                            <Icon name="external-link" className="w-3 h-3 mr-1" />
                                                            Full View
                                                        </button>
                                                    </div>
                                                </div>
                                                <img 
                                                    src={regeneratedResults[index]} 
                                                    alt={`Variation ${index}`} 
                                                    className="w-full h-auto rounded-lg shadow-inner border border-slate-100 hover:scale-[1.01] transition-transform duration-500"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                                 <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary-hover">
                                    <strong>Next Step:</strong> Use these suggestions to guide your changes in the sidebar and generate new creatives to test!
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ABTestModal;
