import React, { useState } from 'react';
import { landingAssets } from '../landingAssets.js';
import { Icon } from '../../../components/ui/Icon.js';

export const ComparisonSlider: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto border-t border-[#E8E8E5] font-sans">
      {/* Section Header */}
      <div className="max-w-3xl mb-14 sm:mb-20">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
          <span className="font-mono text-[11px] font-bold text-[#6B6B73] uppercase tracking-widest">
            Fidelity Benchmark
          </span>
        </div>
        <h2 className="font-satoshi text-3xl sm:text-5xl lg:text-[52px] font-bold text-[#0B0B0F] tracking-[-0.03em] leading-[1.08]">
          Compare the fidelity.
        </h2>
        <p className="font-dmsans text-base sm:text-lg text-[#6B6B73] mt-5 leading-relaxed">
          Drag the slider to see how raw, flat catalog packshots are transformed into commercial studio photography while preserving exact product geometry.
        </p>
      </div>

      {/* Interactive Slider Container */}
      <div className="bg-white border border-[#E8E8E5] rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xs">
        
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E8E8E5] text-xs font-mono">
          <div className="flex items-center gap-2 text-[#6B6B73]">
            <span className="w-2 h-2 rounded-full bg-[#0B0B0F]" />
            <span className="font-bold text-[#0B0B0F]">Interactive Proof Engine</span>
          </div>
          <div className="flex items-center gap-4 text-[#6B6B73]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Left: Raw Packshot
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Right: Studio Output
            </span>
          </div>
        </div>

        {/* Comparison Viewport */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] md:aspect-[2/1] w-full max-h-[560px] rounded-xl overflow-hidden select-none bg-[#F7F7F5] border border-[#E8E8E5]">
          
          {/* AFTER (Full Background Image) */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={landingAssets.watch}
              alt="After: Studio Lighting Transformation"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 bg-[#0B0B0F]/90 text-white font-mono text-[10px] px-3 py-1 rounded tracking-wide z-10">
              AFTER / STUDIO LIGHTING
            </div>
          </div>

          {/* BEFORE (Clipped Overlay Image) */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="relative w-full h-full">
              <img
                src={landingAssets.skincare}
                alt="Before: Raw Packshot"
                className="w-full h-full object-cover"
                style={{
                  width: `${(100 / sliderPosition) * 100}%`,
                  maxWidth: 'none',
                }}
              />
              <div className="absolute top-4 left-4 bg-white/95 text-[#0B0B0F] border border-[#E8E8E5] font-mono text-[10px] px-3 py-1 rounded tracking-wide z-10 shadow-xs">
                BEFORE / RAW SKU
              </div>
            </div>
          </div>

          {/* Vertical Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-[#E8E8E5] shadow-md flex items-center justify-center text-[#0B0B0F]">
              <span className="text-xs font-bold font-mono tracking-tighter">↔</span>
            </div>
          </div>

          {/* Range Input Controller (Invisible Overlay) */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={handleSliderChange}
            aria-label="Image comparison slider"
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />
        </div>

        {/* Bottom Metadata Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-[#E8E8E5] text-xs font-mono text-[#6B6B73]">
          <div className="flex items-center gap-2">
            <Icon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Labels & packaging geometry 100% preserved</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Subsurface shadows and reflection physics</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Zero physical camera or lighting crew needed</span>
          </div>
        </div>

      </div>
    </section>
  );
};
