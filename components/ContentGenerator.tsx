
import React, { useState, useCallback } from 'react';
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
    supportedLanguages: {label: string, value: string}[],
}

const RewriteButton: React.FC<{icon: string, label: string, onClick: () => void}> = ({ icon, label, onClick }) => (
    <button onClick={onClick} title={label} className="flex items-center space-x-1.5 px-2 py-1 text-xs text-slate-500 rounded-md hover:bg-slate-200 hover:text-primary transition-colors">
        <Icon name={icon} className="w-3.5 h-3.5" />
        <span>{label}</span>
    </button>
);


const ResultCard: React.FC<ResultCardProps> = ({ copy, index, onRewrite, supportedLanguages }) => {
    const [copied, setCopied] = useState(false);
    const [translateLang, setTranslateLang] = useState('Hindi');

    const handleCopy = useCallback(() => {
        const textToCopy = `Headline: ${copy.headline}\n\nBody: ${copy.body}\n\nCTA: ${copy.cta}${copy.hashtags ? `\n\nHashtags: ${copy.hashtags}` : ''}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [copy]);

    const createRewriteParams = (action: RewriteAction): RewriteCopyParams => ({
        copy: { headline: copy.headline, body: copy.body, cta: copy.cta, hashtags: copy.hashtags },
        action,
        language: action === RewriteAction.Translate ? translateLang : undefined,
    });

    return (
        <div className={`bg-white p-4 rounded-xl border border-border-light relative transition-shadow hover:shadow-md ${copy.isRewriting ? 'opacity-50' : ''}`}>
            {copy.isRewriting && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
                    <Spinner />
                </div>
            )}
            <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 hover:text-primary transition-colors"
                title="Copy content"
            >
                <Icon name={copied ? 'check-circle' : 'copy'} className="w-4 h-4" />
            </button>
            <h4 className="font-bold text-text-primary pr-8">{copy.headline}</h4>
            <p className="text-sm text-text-secondary my-2">{copy.body}</p>
            <p className="text-sm font-semibold text-primary">{copy.cta}</p>
            {copy.hashtags && <p className="text-xs text-slate-400 mt-3">{copy.hashtags}</p>}

            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <RewriteButton icon="compress" label="Shorter" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Shorter))} />
                <RewriteButton icon="laugh" label="Humor" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Humor))} />
                <RewriteButton icon="gem" label="Luxury" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Luxury))} />
                <RewriteButton icon="feather" label="Simplify" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Simplify))} />
                {!copy.hashtags && <RewriteButton icon="hashtag" label="Hashtags" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.AddHashtags))} />}
                <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                    <RewriteButton icon="translate" label="Translate" onClick={() => onRewrite(index, createRewriteParams(RewriteAction.Translate))} />
                    <select value={translateLang} onChange={e => setTranslateLang(e.target.value)} className="bg-slate-100 text-xs rounded p-0.5 border-none focus:ring-0">
                        {supportedLanguages.filter(l => l.value !== 'English').map(lang => (
                             <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

interface ContentGeneratorProps {
    onClose: () => void;
    onDeductCredits?: (cost: number) => boolean;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ onClose, onDeductCredits }) => {
  const [params, setParams] = useState<GenerateContentParams>(initialParams);
  const [results, setResults] = useState<CopyVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberStyle, setRememberStyle] = useState(false);
  
  const languages = [
      {label: 'English', value: 'English'},
      {label: 'Hindi', value: 'Hindi'},
      {label: 'Spanish', value: 'Spanish'},
      {label: 'French', value: 'French'},
  ];

  const handleParamChange = useCallback((param: keyof GenerateContentParams, value: any) => {
    setParams(prev => ({ ...prev, [param]: value }));
  }, []);

  const handleGenerate = async () => {
    if (onDeductCredits && !onDeductCredits(2)) return; // Cost 2 credits

    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const adCopies = await generateMarketingCopy(params);
      setResults(adCopies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = useCallback(async (index: number, rewriteParams: RewriteCopyParams) => {
      // Rewrites might be free or cheaper, let's assume free for now to encourage refinement
      setResults(prev => prev.map((copy, i) => i === index ? { ...copy, isRewriting: true } : copy));
      try {
          const rewrittenCopy = await rewriteMarketingCopy(rewriteParams);
          setResults(prev => prev.map((copy, i) => i === index ? { ...rewrittenCopy, isRewriting: false } : copy));
      } catch (err) {
          setError(err instanceof Error ? `Rewrite failed: ${err.message}` : 'An unknown error occurred during rewrite.');
          // Reset loading state on error
          setResults(prev => prev.map((copy, i) => i === index ? { ...copy, isRewriting: false } : copy));
      }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in-scale-up" onClick={onClose}>
        <div 
            className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            <header className="p-4 flex-shrink-0 flex items-center justify-between border-b border-border-light">
                <div className="flex items-center">
                    <Icon name="edit" className="w-6 h-6 mr-3 text-primary"/>
                    <h2 className="text-lg font-bold text-text-primary">AI Content Generator</h2>
                </div>
                <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                    <Icon name="close" className="w-5 h-5"/>
                </button>
            </header>

            <div className="flex-grow flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {/* Left Panel: Controls */}
                <aside className="w-full lg:w-[26rem] flex-shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-border-light lg:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-slate-50/50">
                    <p className="text-sm text-text-secondary mb-6">Instantly write marketing copy, captions, and more for your campaigns.</p>
                    
                    <div className="space-y-5">
                        <FormTextArea
                            label="Product / Campaign Context"
                            id="copy-context"
                            placeholder="e.g., Organic skincare brand launching a new Vitamin C serum."
                            rows={4}
                            value={params.context}
                            onChange={e => handleParamChange('context', e.target.value)}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Target Platform" value={params.platform} onChange={e => handleParamChange('platform', e.target.value)}>
                                <option>Instagram</option>
                                <option>Facebook</option>
                                <option>Google Ads</option>
                                <option>YouTube</option>
                                <option>LinkedIn</option>
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

                        <Select label="Writing Style" value={params.style} onChange={e => handleParamChange('style', e.target.value)}>
                            <option>Storytelling</option>
                            <option>Informative</option>
                            <option>Conversational</option>
                            <option>Persuasive</option>
                            <option>Minimalist</option>
                            <option>Luxury</option>
                            <option>Trendy</option>
                        </Select>

                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Tone of Voice" value={params.tone} onChange={e => handleParamChange('tone', e.target.value)}>
                                <option>Friendly</option>
                                <option>Inspirational</option>
                                <option>Humorous</option>
                                <option>Serious</option>
                                <option>Urgent</option>
                                <option>Playful</option>
                                <option>Professional</option>
                            </Select>
                            <Select label="Language" value={params.language} onChange={e => handleParamChange('language', e.target.value)}>
                                {languages.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                            </Select>
                        </div>

                        <SegmentedControl
                            label="Length Control"
                            options={[{label: 'Short', value: 'Short'}, {label: 'Medium', value: 'Medium'}, {label: 'Long', value: 'Long'}]}
                            value={params.length}
                            onChange={val => handleParamChange('length', val as any)}
                        />
                        
                        <FormInput
                            label="Keywords (Optional)"
                            id="copy-keywords"
                            placeholder="e.g., glowing skin, natural"
                            value={params.keywords}
                            onChange={e => handleParamChange('keywords', e.target.value)}
                        />

                        <div className="p-4 bg-white rounded-lg space-y-3 border border-border-light">
                            <h4 className="text-sm font-semibold text-text-primary">Smart Personalization</h4>
                            <Toggle label="Remember Brand Voice" enabled={rememberStyle} onChange={setRememberStyle} />
                        </div>

                        <div className="p-4 bg-white rounded-lg space-y-3 border border-border-light">
                            <Toggle label="Generate Hashtags" enabled={params.includeHashtags} onChange={val => handleParamChange('includeHashtags', val)} />
                            <Toggle label="Suggest Emojis" enabled={params.includeEmojis} onChange={val => handleParamChange('includeEmojis', val)} />
                        </div>
                    </div>

                    <div className="mt-6">
                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            isLoading={isLoading}
                            fullWidth
                            className="!py-3 !text-base"
                        >
                            <Icon name="sparkles" className="w-5 h-5 mr-2" />
                            Generate Content (2 Credits)
                        </Button>
                    </div>
                </aside>

                {/* Right Panel: Results */}
                <main className="flex-1 p-8 lg:overflow-y-auto bg-main">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Spinner />
                            <p className="mt-4 text-lg">Brewing up some fresh copy...</p>
                            <p className="text-sm">The AI is putting on its creative hat!</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold mb-2">Generation Failed</h3>
                            <p>{error}</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((copy, index) => (
                            <ResultCard key={index} copy={copy} index={index} onRewrite={handleRewrite} supportedLanguages={languages} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-6">
                            <div className="p-6 bg-slate-200/60 rounded-full mb-6">
                                <Icon name="lightbulb" className="w-16 h-16 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Content Awaits</h2>
                            <p className="max-w-xl">
                                Fill in the details on the left, and let our AI generate compelling marketing copy for you in seconds.
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
