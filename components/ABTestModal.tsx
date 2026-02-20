
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
import type { GeneratedImage, ABTestSuggestion } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Spinner } from './ui/Spinner';
import { getABTestSuggestions } from '../services/geminiService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface ABTestModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onGenerate: (params: any) => void;
  onApiError?: () => void;
  onDeductCredits: (cost: number) => boolean;
}

const ABTestModal: React.FC<ABTestModalProps> = ({ image, onClose, onGenerate, onApiError, onDeductCredits }) => {
    const isOnline = useNetworkStatus();
    const [suggestions, setSuggestions] = useState<ABTestSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

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
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-main w-full max-w-3xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <Icon name="variants" className="w-6 h-6 mr-3 text-primary" />
                        <h2 className="text-xl font-bold text-slate-800">A/B Testing Variants</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </header>

                <div className="flex-grow flex overflow-hidden">
                    <aside className="w-1/3 bg-slate-50 p-4 border-r border-slate-200">
                        <h3 className="font-semibold text-slate-700 mb-2">Original Creative</h3>
                        <img src={image.imageUrl} alt="Original" className="rounded-lg w-full shadow-sm" />
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
                                    <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg">
                                        <h4 className="font-bold text-md text-primary mb-1">{suggestion.title}</h4>
                                        <p className="text-sm text-slate-700 mb-2">
                                            <strong>Change:</strong> {suggestion.description}
                                        </p>
                                        <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                                            <strong>Hypothesis:</strong> {suggestion.hypothesis}
                                        </p>
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
