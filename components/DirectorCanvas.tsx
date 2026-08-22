
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './ui/Icon.js';
import type { BrandKit, GenerateImageParams } from '../types.js';

interface DirectorCanvasProps {
  backgroundImage: string;
  brandKit: BrandKit | null;
  params: Partial<GenerateImageParams>;
  onUpdateParams?: (newParams: Partial<GenerateImageParams>) => void;
  aspectRatio: string;
}

export const DirectorCanvas: React.FC<DirectorCanvasProps> = ({
  backgroundImage, brandKit, params, onUpdateParams, aspectRatio
}) => {
    const {
        adTitle = 'Your Headline Here',
        adSubheading = 'Your compelling subheading goes here.',
        adCta = 'Shop Now',
        adTextColor = brandKit?.primary_hex || '#ffffff',
        adCtaBgColor = brandKit?.primary_hex || '#6A5AE0',
        adTitleSize = 32,
        adSubheadingSize = 16,
        adImageZoom = 1,
        adImageX = 0,
        adImageY = 0,
        adLogoSize = 40,
        adFontFamily = brandKit?.font_family || 'Inter'
    } = params;

    const getInitialLogoPos = () => {
        switch(brandKit?.logo_anchor_point) {
            case 'top-left': return { top: '5%', left: '5%' };
            case 'top-right': return { top: '5%', right: '5%' };
            case 'bottom-left': return { bottom: '5%', left: '5%' };
            case 'bottom-right': return { bottom: '5%', right: '5%' };
            case 'center': return { top: '50%', left: '50%', x: '-50%', y: '-50%' };
            default: return { top: '5%', right: '5%' };
        }
    };

    return (
        <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center rounded-xl group/canvas">
            {/* Background AI Image with Zoom/Pan */}
            <div className="relative shadow-2xl overflow-hidden bg-black" style={{ 
                aspectRatio: aspectRatio === '9:16' ? '9/16' : (aspectRatio === '16:9' ? '16/9' : (aspectRatio === '4:5' ? '4/5' : '1/1')), 
                maxHeight: '100%', 
                maxWidth: '100%' 
            }}>
                <motion.div
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    animate={{ 
                        scale: adImageZoom,
                        x: adImageX,
                        y: adImageY
                    }}
                    drag
                    dragMomentum={false}
                    onDragEnd={(_, info) => {
                        onUpdateParams?.({
                            adImageX: (adImageX || 0) + info.offset.x,
                            adImageY: (adImageY || 0) + info.offset.y
                        });
                    }}
                >
                    <img src={backgroundImage} className="w-full h-full object-cover select-none pointer-events-none" alt="AI Background" />
                </motion.div>
                
                {/* Layered Overlays */}
                
                {/* Logo Overlay */}
                {brandKit?.logoUrl && (
                    <motion.div 
                        drag
                        dragMomentum={false}
                        className="absolute cursor-move z-20 p-2 hover:ring-2 hover:ring-primary/50 rounded-lg transition-shadow"
                        initial={getInitialLogoPos()}
                        onDragEnd={(_, info) => {
                            // In a real app we'd calculate % based on container
                        }}
                    >
                        <img 
                            src={brandKit.logoUrl} 
                            style={{ height: adLogoSize }}
                            className="w-auto object-contain drop-shadow-2xl" 
                            alt="Logo" 
                        />
                    </motion.div>
                )}

                {/* Title & Subheading Overlay */}
                <motion.div 
                    drag
                    dragMomentum={false}
                    className="absolute cursor-move z-20 p-4 text-center hover:ring-2 hover:ring-primary/50 rounded-lg transition-shadow"
                    initial={{ bottom: '25%', left: '5%', right: '5%' }}
                >
                    <h2 
                        className="font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight" 
                        style={{ 
                            fontFamily: adFontFamily, 
                            color: adTextColor,
                            fontSize: adTitleSize
                        }}
                    >
                        {adTitle}
                    </h2>
                    <p 
                        className="font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] mt-2"
                        style={{ 
                            color: adTextColor,
                            fontSize: adSubheadingSize,
                            opacity: 0.9
                        }}
                    >
                        {adSubheading}
                    </p>
                </motion.div>

                {/* CTA Overlay */}
                <motion.div 
                    drag
                    dragMomentum={false}
                    className="absolute cursor-move z-20 hover:ring-2 hover:ring-primary/50 rounded-full transition-shadow"
                    initial={{ bottom: '10%', left: '50%', x: '-50%' }}
                >
                    <button 
                        className="px-8 py-3 rounded-full font-black text-white shadow-2xl transition-transform active:scale-95 uppercase tracking-wider text-sm md:text-base"
                        style={{ backgroundColor: adCtaBgColor }}
                    >
                        {adCta}
                    </button>
                </motion.div>
            </div>

            {/* Director Controls HUD */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none group-hover/canvas:opacity-100 opacity-0 transition-opacity">
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon name="sparkles" className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Director Mode</span>
                    </div>
                    <p className="text-[9px] text-white/60 max-w-[120px]">
                        Drag elements to reposition. Use sidebar to edit styles.
                    </p>
                </div>
            </div>
        </div>
    );
};
