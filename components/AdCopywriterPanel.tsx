import React, { useState, useCallback } from 'react';
import { generateAdCopy } from '../services/adCopyService';
import type { GenerateAdCopyParams, AdCopy } from '../types';
import { FormTextArea } from './ui/Form';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { Icon } from './ui/Icon';

const initialParams: GenerateAdCopyParams = {
  productDescription: '',
  tone: 'Playful',
  platform: 'Instagram',
  count: 3,
};

export const AdCopywriterPanel: React.FC = () => {
  const [params, setParams] = useState<GenerateAdCopyParams>(initialParams);
  const [results, setResults] = useState<AdCopy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParamChange = useCallback((param: keyof GenerateAdCopyParams, value: any) => {
    setParams(prev => ({ ...prev, [param]: value }));
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const adCopies = await generateAdCopy(params);
      setResults(adCopies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
        <div className="flex-grow overflow-y-auto pr-2 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <FormTextArea
                label="Product / Service Description"
                id="copy-description"
                placeholder="e.g., An organic, ayurvedic face cream for sensitive skin"
                rows={5}
                value={params.productDescription}
                onChange={e => handleParamChange('productDescription', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
                 <Select label="Tone" value={params.tone} onChange={e => handleParamChange('tone', e.target.value)}>
                    <option>Playful</option>
                    <option>Professional</option>
                    <option>Witty</option>
                    <option>Bold</option>
                    <option>Luxury</option>
                </Select>
                 <Select label="Platform" value={params.platform} onChange={e => handleParamChange('platform', e.target.value)}>
                    <option>Instagram</option>
                    <option>Facebook</option>
                    <option>LinkedIn</option>
                    <option>Twitter (X)</option>
                </Select>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-8 text-slate-500">
                    <Spinner />
                    <p className="mt-2 text-sm">Generating ad copy...</p>
                </div>
            )}
            {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-lg">{error}</p>}
            
            {results.length > 0 && (
                <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold text-text-primary">Generated Copies</h3>
                    {results.map((copy, index) => (
                        <div key={index} className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                            <h4 className="font-bold text-text-primary">{copy.headline}</h4>
                            <p className="text-sm text-text-secondary my-2">{copy.body}</p>
                            <p className="text-sm font-semibold text-primary">{copy.cta}</p>
                        </div>
                    ))}
                </div>
            )}

        </div>
        <div className="flex-shrink-0 pt-6">
            <Button
                onClick={handleGenerate}
                disabled={isLoading || !params.productDescription.trim()}
                fullWidth
                className="!py-3"
            >
                {isLoading ? 'Generating...' : `Generate ${params.count} Copies`}
            </Button>
        </div>
    </div>
  );
};
