import React from 'react';
import type { GenerateImageParams } from '../../types';
import { Icon } from './Icon';

interface LivePreviewProps {
  params: GenerateImageParams;
  productImageUrl: string | null;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ params, productImageUrl }) => {
  const { aspectRatio, backgroundStyle, modelGender, adTitle, overlayText } = params;

  const getBackgroundColor = () => {
    if (!backgroundStyle || backgroundStyle === 'AI Suggested') return '#f1f5f9'; // slate-100
    const lowerBG = backgroundStyle.toLowerCase();
    if (lowerBG.includes('white') || lowerBG.includes('light')) return '#ffffff';
    if (lowerBG.includes('black') || lowerBG.includes('dark')) return '#1c1c1e'; // sidebar
    if (lowerBG.includes('grey')) return '#e5e7eb'; // gray-200
    if (lowerBG.includes('pastel') || lowerBG.includes('blush')) return '#fff1f2'; // rose-50
    if (lowerBG.includes('green') || lowerBG.includes('foliage')) return '#ecfdf5'; // emerald-50
    if (lowerBG.includes('blue')) return '#eff6ff'; // blue-50
    if (lowerBG.includes('neon')) return 'linear-gradient(45deg, #f0abfc, #3b82f6)';
    return '#f1f5f9'; // default
  };

  const cssAspectRatio = aspectRatio.replace(':', ' / ');
  const background = getBackgroundColor();

  if (!productImageUrl) {
    return (
        <div className="text-center flex flex-col items-center justify-center h-full text-slate-500 p-6">
            <div className="p-6 bg-slate-200/60 rounded-full mb-6">
                <Icon name="image" className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Creative Preview</h2>
            <p className="max-w-xl">
                Upload a product image to see a live preview of your ad creative as you make changes.
            </p>
        </div>
    );
  }

  const textToDisplay = adTitle || overlayText || '';

  return (
    <div className="flex items-center justify-center w-full h-full p-8">
      <div 
        className="w-full max-w-lg rounded-2xl shadow-lg overflow-hidden flex items-center justify-center relative"
        style={{ aspectRatio: cssAspectRatio, background }}
      >
        <img src={productImageUrl} alt="Product Preview" className="max-h-full max-w-full object-contain" />

        {params.appMode === 'Influencer' && (
          <div className="absolute bottom-4 left-4 bg-black/30 text-white text-xs p-2 rounded-lg backdrop-blur-sm">
            <p><strong>Preview:</strong> {modelGender} model</p>
            <p><strong>Background:</strong> {backgroundStyle}</p>
          </div>
        )}
        
        {textToDisplay && (
             <div className="absolute top-4 w-full text-center px-4">
                <p 
                    className="text-xl font-bold text-black/70 drop-shadow-lg"
                    style={{ fontFamily: 'sans-serif' }}
                >
                    {textToDisplay}
                </p>
             </div>
        )}
      </div>
    </div>
  );
};