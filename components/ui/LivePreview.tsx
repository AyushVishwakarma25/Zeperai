
import React from 'react';
import type { GenerateImageParams } from '../../types';
import { AspectRatio } from '../../types';
import { Icon } from './Icon';
import { INITIAL_GENERATE_PARAMS } from '../../constants';

interface LivePreviewProps {
  params: GenerateImageParams;
  productImageUrl: string | null;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ params, productImageUrl }) => {
  // Defensive fallback to prevent "Cannot convert undefined or null to object"
  const safeParams = params || INITIAL_GENERATE_PARAMS;
  const { aspectRatios, backgroundStyle, modelGender, adTitle, overlayText } = safeParams;
  const aspectRatio = (aspectRatios && aspectRatios.length > 0) ? aspectRatios[0] : AspectRatio.PortraitPost;

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
        <div className="text-center flex flex-col items-center justify-center h-full text-slate-500 p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 m-8">
            <div className="p-6 bg-white rounded-full mb-6 shadow-sm">
                <Icon name="image" className="w-16 h-16 text-primary/40" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Create?</h2>
            <p className="max-w-md text-sm text-slate-500 mb-6 leading-relaxed">
                Select a mode from the dashboard to start.
                <br/>
                <span className="font-semibold text-primary">Tip:</span> Upload a high-quality product image for the best results.
            </p>
            <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center"><Icon name="check-circle" className="w-4 h-4 mr-1 text-slate-300" /> No Professional Camera Needed</span>
                <span className="flex items-center"><Icon name="check-circle" className="w-4 h-4 mr-1 text-slate-300" /> Commercial Usage Rights</span>
            </div>
        </div>
    );
  }

  const textToDisplay = adTitle || overlayText || '';

  return (
    <div className="flex items-center justify-center w-full h-full p-8">
      <div 
        className="w-full max-w-lg rounded-2xl shadow-lg overflow-hidden flex items-center justify-center relative transition-all duration-500 ease-spring"
        style={{ aspectRatio: cssAspectRatio, background }}
      >
        <img src={productImageUrl} alt="Product Preview" className="max-h-full max-w-full object-contain shadow-2xl" />

        {safeParams.appMode === 'Influencer' && (
          <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs p-3 rounded-lg backdrop-blur-md border border-white/10">
            <p className="mb-1"><strong className="text-primary-300">Model:</strong> {modelGender} persona</p>
            <p><strong className="text-primary-300">Scene:</strong> {backgroundStyle}</p>
          </div>
        )}
        
        {textToDisplay && (
             <div className="absolute top-8 w-full text-center px-8">
                <p 
                    className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    style={{ fontFamily: 'sans-serif', letterSpacing: '-0.02em' }}
                >
                    {textToDisplay}
                </p>
             </div>
        )}
      </div>
    </div>
  );
};
