import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingAssets } from '../landingAssets.js';
import { Icon } from '../../../components/ui/Icon.js';

interface TagItem {
  id: string;
  label: string;
  activeImage: string;
  format: string;
}

const TAGS: TagItem[] = [
  {
    id: 'studio',
    label: '+ Studio Lighting',
    activeImage: landingAssets.perfume,
    format: '1:1 Square PDP',
  },
  {
    id: 'feed',
    label: '+ Meta Feed 4:5',
    activeImage: landingAssets.productStudio,
    format: '4:5 High CTR Feed',
  },
  {
    id: 'creator',
    label: '+ UGC Influencer',
    activeImage: landingAssets.aiInfluencer,
    format: '9:16 Social Story',
  },
  {
    id: 'luxury',
    label: '+ Macro Editorial',
    activeImage: landingAssets.watch,
    format: '4:5 Brand Campaign',
  },
];

export const CreativeShowcaseWithTags: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTagId, setSelectedTagId] = useState<string>('feed');
  const activeTag = TAGS.find((t) => t.id === selectedTagId) || TAGS[1];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto border-t border-[#E8E8E5] font-sans">
      
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-18">
        <span className="font-mono text-[11px] font-bold text-[#6B6B73] uppercase tracking-widest block mb-2">
          INTERACTIVE STUDIO ENGINE
        </span>
        <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[56px] font-normal text-[#0B0B0F] tracking-tight leading-[1.08]">
          Boost conversions instantly
          <span className="block mt-1">AI Driven 4x</span>
        </h2>
        <p className="font-dmsans text-base sm:text-lg text-[#6B6B73] mt-5 leading-relaxed max-w-xl mx-auto">
          From concept to conversion — generate studio photography, high-converting ad variations, and campaign assets from your product images seamlessly.
        </p>
      </div>

      {/* Main Interactive Card Showcase (Matching middle-left layout in reference) */}
      <div className="bg-white border border-[#E8E8E5] rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xs relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Visual with Floating Interactive Tag Pills */}
          <div className="lg:col-span-7 relative">
            
            {/* Visual Frame */}
            <div className="aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden bg-[#F7F7F5] border border-[#E8E8E5] relative shadow-lg group">
              <img
                src={activeTag.activeImage}
                alt={activeTag.label}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-102"
              />

              {/* Floating Star Rating Badge (Top Left of image, matching screenshot) */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-md border border-[#E8E8E5] flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#0B0B0F] text-xs">★</span>
                ))}
              </div>

              {/* Floating Pill: 20X Jump In Velocity (Center Right of image, matching screenshot) */}
              <div className="absolute top-1/3 right-4 bg-emerald-600 text-white font-mono p-3 rounded-2xl shadow-xl flex flex-col items-start gap-0.5 border border-white/20">
                <span className="text-[10px] text-emerald-200 uppercase font-bold">UP TO</span>
                <span className="text-xl sm:text-2xl font-bold font-satoshi leading-tight">20X</span>
                <span className="text-[9px] text-emerald-100 font-sans">creative velocity</span>
              </div>

              {/* Floating Mini Product Pill (Bottom Left of image, matching screenshot) */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-white/95 backdrop-blur-xs p-3 rounded-2xl border border-[#E8E8E5] shadow-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-[#F7F7F5] overflow-hidden shrink-0 border border-[#E8E8E5]">
                    <img
                      src={landingAssets.skincare}
                      alt="Source SKU"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div>
                    <div className="font-satoshi font-bold text-xs text-[#0B0B0F]">
                      Catalog SKU #204
                    </div>
                    <div className="font-mono text-[10px] text-[#6B6B73]">
                      {activeTag.format}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 rounded-full bg-[#0B0B0F] hover:bg-[#1A1A22] text-white font-satoshi font-medium text-xs whitespace-nowrap cursor-pointer transition-colors"
                >
                  Generate Now
                </button>
              </div>

            </div>

            {/* Bottom Floating Interactive Tag Selector (Matching screenshot tags) */}
            <div className="mt-4 pt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#6B6B73] mr-1">
                Tags to your creative:
              </span>
              {TAGS.map((tag) => {
                const isSelected = tag.id === selectedTagId;
                return (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTagId(tag.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-satoshi font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B0B0F] text-white shadow-xs'
                        : 'bg-[#F7F7F5] text-[#0B0B0F] border border-[#E8E8E5] hover:border-[#0B0B0F]'
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right Column: Editorial Value Pillars */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div>
              <span className="font-mono text-[10px] font-bold text-[#0B0B0F] bg-[#F7F7F5] border border-[#E8E8E5] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Production Speed
              </span>
              <h3 className="font-editorial text-3xl sm:text-4xl font-normal text-[#0B0B0F] tracking-tight mt-3 leading-snug">
                One image. Countless high-converting angles.
              </h3>
              <p className="font-dmsans text-sm sm:text-base text-[#6B6B73] mt-3 leading-relaxed">
                Stop waiting on 3-week studio turnaround times. Switch formats, background aesthetics, and lighting signatures in one click.
              </p>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-[#E8E8E5]">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="check" className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <div className="font-satoshi font-bold text-sm text-[#0B0B0F]">
                    Preserves Real Physical Geometry
                  </div>
                  <div className="font-dmsans text-xs text-[#6B6B73] mt-0.5">
                    100% fidelity on packaging, labels, and bottle silhouettes.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="check" className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <div className="font-satoshi font-bold text-sm text-[#0B0B0F]">
                    Aspect Ratio Native Output
                  </div>
                  <div className="font-dmsans text-xs text-[#6B6B73] mt-0.5">
                    True 4:5 Meta Feed, 9:16 vertical TikTok, and 1:1 PDPs without cropping.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="check" className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <div className="font-satoshi font-bold text-sm text-[#0B0B0F]">
                    Commercial IP Clearance
                  </div>
                  <div className="font-dmsans text-xs text-[#6B6B73] mt-0.5">
                    Full digital rights for paid advertising campaigns and store galleries.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/login')}
                className="h-11 px-7 rounded-full bg-[#0B0B0F] hover:bg-[#1A1A22] text-white font-satoshi font-medium text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Try With Your Product</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
};
