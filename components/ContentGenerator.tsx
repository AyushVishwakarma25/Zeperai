
import React, { useState, useCallback, useEffect } from 'react';
import { generateMarketingCopy, rewriteMarketingCopy } from '../services/contentGeneratorService';
import type { GenerateContentParams, CopyVariation, RewriteCopyParams } from '../types';
import { RewriteAction } from '../types';
import { FormInput, FormTextArea } from './ui/Form';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { Icon } from './ui/Icon';
import { Toggle } from './ui/Toggle';
import { SegmentedControl } from './ui/SegmentedControl';
import { Toast } from './ui/Toast';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { FeaturePricingTable } from './FeaturePricingTable';

const AI_WRITER_FREE_LIMIT = 10;

const initialParams: GenerateContentParams = {
  context: '',
  platform: 'Instagram',
  goal: 'Caption / Post',
  style: 'Storytelling',
  tone: 'Friendly',
  language: 'English',
  length: 'Medium',
  includeHashtags: true,
  includeEmojis: true,
  keywords: '',
};

interface ResultCardProps {
    copy: CopyVariation,
    index: number,
    onRewrite: (index: number, params: RewriteCopyParams) => void,
    isOnline: boolean
}

const RewriteButton: React.FC<{icon: string, label: string, onClick: () => void, disabled?: boolean}> = ({ icon, label, onClick, disabled }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        title={label} 
        className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all shadow-sm border ${
            disabled 
            ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
            : 'text-slate-600 bg-white border-slate-200 hover:bg-primary/5 hover:text-primary hover:border-primary/30'
        }`}
    >
        <Icon name={icon} className="w-3.5 h-3.5" />
        <span>{label}</span>
    </button>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 select-none">
        {children}
    </span>
);

const ResultCard: React.FC<ResultCardProps> = ({ copy, index, onRewrite, isOnline }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        const textToCopy = `${copy.headline}\n\n${copy.body}\n\n${copy.cta}${copy.hashtags ? `\n\n${copy.hashtags}` : ''}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [copy]);

    const createRewriteParams = (action: RewriteAction): RewriteCopyParams => ({
        copy: { headline: copy.headline, body: copy.body, cta: copy.cta, hashtags: copy.hashtags },
        action,
    });

    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group ${copy.isRewriting ? 'opacity-70 pointer-events-none' : ''}`}>
            {copy.isRewriting && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                    <div className="bg-white p-2 rounded-full shadow-lg">
                        <Spinner />
                    </div>
                </div>
            )}
            
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-500 bg-slate-200/50 px-2 py-1 rounded-md">
                    Variation #{index + 1}
                </span>
                <button
                    onClick={handleCopy}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold ${copied ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-white hover:text-primary'}`}
                    title="Copy content"
                >
                    <Icon name={copied ? 'check-circle' : 'copy'} className="w-4 h-4" />
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            <div className="p-6 space-y-5">
                <div>
                    <SectionLabel>Headline</SectionLabel>
                    <h4 className="text-lg font-bold text-slate-800 leading-snug">{copy.headline}</h4>
                </div>
                
                <div>
                    <SectionLabel>Caption Body</SectionLabel>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{copy.body}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <SectionLabel>Call to Action</SectionLabel>
                        <p className="text-sm font-semibold text-primary">{copy.cta}</p>
                    </div>
                    {copy.hashtags && (
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <SectionLabel>Hashtags</SectionLabel>
                            <p className="text-xs text-blue-500 font-medium leading-relaxed">{copy.hashtags}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-start gap-2">
                <RewriteButton disabled={!isOnline} icon="compress" label="Shorter" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Shorter))} />
                <RewriteButton disabled={!isOnline} icon="laugh" label="Humor" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Humor))} />
                <RewriteButton disabled={!isOnline} icon="gem" label="Luxury" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Luxury))} />
                <RewriteButton disabled={!isOnline} icon="feather" label="Simplify" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Simplify))} />
            </div>
        </div>
    );
};

interface ContentGeneratorProps {
    onClose: () => void;
    onDeductCredits?: (cost: number) => boolean;
    onRefundCredits?: (cost: number) => void;
    userId?: string;
    userTier?: string;
    onOpenPricingModal?: () => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ onClose, onDeductCredits, onRefundCredits, userId, userTier, onOpenPricingModal }) => {
  const isOnline = useNetworkStatus();
  const [params, setParams] = useState<GenerateContentParams>(initialParams);
  const [results, setResults] = useState<CopyVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberStyle, setRememberStyle] = useState(false);
  const [freeUsageCount, setFreeUsageCount] = useState(0);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showPricingTable, setShowPricingTable] = useState(false);
  
  const languages = [
      {label: 'English', value: 'English'},
      {label: 'Hindi', value: 'Hindi'},
      {label: 'Bengali', value: 'Bengali'},
      {label: 'Marathi', value: 'Marathi'},
      {label: 'Telugu', value: 'Telugu'},
      {label: 'Tamil', value: 'Tamil'},
      {label: 'Spanish', value: 'Spanish'},
      {label: 'French', value: 'French'},
      {label: 'German', value: 'German'},
  ];

  useEffect(() => {
      if (userId) {
          const key = `ai_writer_usage_${userId}`;
          const savedCount = localStorage.getItem(key);
          if (savedCount) {
              setFreeUsageCount(parseInt(savedCount, 10));
          }
      }
  }, [userId]);

  const incrementFreeUsage = () => {
      if (userId) {
          const newCount = freeUsageCount + 1;
          setFreeUsageCount(newCount);
          localStorage.setItem(`ai_writer_usage_${userId}`, newCount.toString());
      }
  };

  const handleParamChange = useCallback((param: keyof GenerateContentParams, value: any) => {
    setParams(prev => ({ ...prev, [param]: value }));
  }, []);

  const handleGenerate = async () => {
    if (userTier === 'Free') {
        onOpenPricingModal?.();
        return;
    }
    if (!isOnline) {
        setToast({ message: "You are offline.", type: 'error' });
        return;
    }
    const isFree = freeUsageCount < AI_WRITER_FREE_LIMIT;
    
    if (!isFree) {
        if (onDeductCredits && !onDeductCredits(2)) return; 
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const adCopies = await generateMarketingCopy(params);
      setResults(adCopies);
      
      if (isFree) {
          incrementFreeUsage();
          setToast({ message: `Free Trial Used (${freeUsageCount + 1}/${AI_WRITER_FREE_LIMIT})`, type: 'success' });
      }
    } catch (err) {
      if (!isFree && onRefundCredits) onRefundCredits(2);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = useCallback(async (index: number, rewriteParams: RewriteCopyParams) => {
      if (userTier === 'Free') {
          onOpenPricingModal?.();
          return;
      }
      if (!isOnline) {
          setToast({ message: "You are offline.", type: 'error' });
          return;
      }
      
      const isFree = freeUsageCount < AI_WRITER_FREE_LIMIT;

      if (!isFree) {
          if (onDeductCredits && !onDeductCredits(1)) return;
      }

      setResults(prev => prev.map((copy, i) => i === index ? { ...copy, isRewriting: true } : copy));
      try {
          const rewrittenCopy = await rewriteMarketingCopy(rewriteParams);
          setResults(prev => prev.map((copy, i) => i === index ? { ...rewrittenCopy, isRewriting: false } : copy));
          
          if (isFree) {
              incrementFreeUsage();
              setToast({ message: `Free Trial Used (${freeUsageCount + 1}/${AI_WRITER_FREE_LIMIT})`, type: 'success' });
          }
      } catch (err) {
          if (!isFree && onRefundCredits) onRefundCredits(1);
          setError(err instanceof Error ? `Rewrite failed: ${err.message}` : 'An unknown error occurred during rewrite.');
          setResults(prev => prev.map((copy, i) => i === index ? { ...copy, isRewriting: false } : copy));
      }
  }, [onDeductCredits, onRefundCredits, freeUsageCount, userId, isOnline]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
        {toast && (
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast(null)} 
            />
        )}
        <div 
            className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            <header className="p-4 flex-shrink-0 flex items-center justify-between border-b border-border-light">
                <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg mr-3">
                        <Icon name="edit" className="w-5 h-5 text-primary"/>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">AI Content Writer</h2>
                        <p className="text-xs text-text-secondary">Generate converting copy in seconds</p>
                    </div>
                    {freeUsageCount < AI_WRITER_FREE_LIMIT && (
                        <span className="ml-4 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                            {AI_WRITER_FREE_LIMIT - freeUsageCount} Free Credits Left
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors shrink-0">
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </div>
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

            <div className="flex-grow flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <aside className="w-full lg:w-[26rem] flex-shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-border-light lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-slate-50/50">
                    
                    <div className="space-y-6">
                        <FormTextArea
                            label="Product / Campaign Context"
                            id="copy-context"
                            placeholder="e.g., Organic skincare brand launching a new Vitamin C serum for summer."
                            rows={4}
                            value={params.context}
                            onChange={e => handleParamChange('context', e.target.value)}
                            className="bg-white"
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Target Platform" value={params.platform} onChange={e => handleParamChange('platform', e.target.value)}>
                                <option>Instagram</option>
                                <option>Facebook</option>
                                <option>LinkedIn</option>
                                <option>Twitter (X)</option>
                                <option>YouTube</option>
                                <option>Website</option>
                                <option>Email</option>
                            </Select>
                            <Select label="Content Goal" value={params.goal} onChange={e => handleParamChange('goal', e.target.value)}>
                                <option>Caption / Post</option>
                                <option>Ad Headline</option>
                                <option>Product Description</option>
                                <option>Email Subject</option>
                                <option>Short Script</option>
                                <option>Call to Action (CTA)</option>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Writing Style" value={params.style} onChange={e => handleParamChange('style', e.target.value)}>
                                <option>Storytelling</option>
                                <option>Informative</option>
                                <option>Conversational</option>
                                <option>Persuasive</option>
                                <option>Minimalist</option>
                                <option>Luxury</option>
                                <option>Trendy</option>
                            </Select>
                            <Select label="Tone of Voice" value={params.tone} onChange={e => handleParamChange('tone', e.target.value)}>
                                <option>Friendly</option>
                                <option>Inspirational</option>
                                <option>Humorous</option>
                                <option>Serious</option>
                                <option>Urgent</option>
                                <option>Playful</option>
                                <option>Professional</option>
                            </Select>
                        </div>

                        <Select label="Output Language" value={params.language} onChange={e => handleParamChange('language', e.target.value)}>
                            {languages.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                        </Select>

                        <SegmentedControl
                            label="Length Control"
                            options={[{label: 'Short', value: 'Short'}, {label: 'Medium', value: 'Medium'}, {label: 'Long', value: 'Long'}]}
                            value={params.length}
                            onChange={val => handleParamChange('length', val as any)}
                        />
                        
                        <FormInput
                            label="Keywords (Optional)"
                            id="copy-keywords"
                            placeholder="e.g., glowing skin, natural, discount"
                            value={params.keywords}
                            onChange={e => handleParamChange('keywords', e.target.value)}
                            className="bg-white"
                        />

                        <div className="space-y-3">
                            <div className="p-4 bg-white rounded-xl space-y-3 border border-border-light shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Smart Options</h4>
                                <Toggle label="Remember Brand Voice" enabled={rememberStyle} onChange={setRememberStyle} />
                                <Toggle label="Generate Hashtags" enabled={params.includeHashtags} onChange={val => handleParamChange('includeHashtags', val)} />
                                <Toggle label="Suggest Emojis" enabled={params.includeEmojis} onChange={val => handleParamChange('includeEmojis', val)} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-200">
                        <Button
                            onClick={handleGenerate}
                            disabled={userTier !== 'Free' && (!isOnline || isLoading)}
                            isLoading={isLoading}
                            fullWidth
                            className="!py-3 !text-base shadow-lg shadow-primary/20"
                        >
                            {userTier === 'Free' ? 'Upgrade to Pro' : (isOnline ? (freeUsageCount < AI_WRITER_FREE_LIMIT ? 'Generate Content (Free)' : 'Generate Content (2 Credits)') : 'Offline')}
                        </Button>
                    </div>
                </aside>

                <main className="flex-1 p-6 lg:p-10 lg:overflow-y-auto bg-slate-50/30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-pulse">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Spinner />
                            </div>
                            <p className="mt-2 text-lg font-medium text-slate-800">Writing your copy...</p>
                            <p className="text-sm">Optimizing for {params.platform} with {params.tone} tone.</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 p-8 rounded-2xl border border-red-100">
                            <div className="bg-red-100 p-3 rounded-full mb-3">
                                <Icon name="close" className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-red-700">Generation Failed</h3>
                            <p className="text-center max-w-md">{error}</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-700">Generated Results</h3>
                                <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                                    {results.length} Variations
                                </span>
                            </div>
                            {results.map((copy, index) => (
                                <ResultCard 
                                    key={index} 
                                    copy={copy} 
                                    index={index} 
                                    onRewrite={handleRewrite} 
                                    isOnline={isOnline}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <Icon name="edit" className="w-10 h-10 text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Write?</h2>
                            <p className="max-w-md text-slate-500 leading-relaxed">
                                Enter your product details on the left sidebar. Our AI will generate high-conversion marketing copy tailored to your brand.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    </div>
  );
};

export default ContentGenerator;
