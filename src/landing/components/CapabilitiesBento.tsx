import React from 'react';
import { landingAssets } from '../landingAssets.js';
import { Icon } from '../../../components/ui/Icon.js';

export const CapabilitiesBento: React.FC = () => {
  return (
    <section id="capabilities" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto border-t border-[#E8E8E5] font-sans">
      {/* Header */}
      <div className="max-w-3xl mb-14 sm:mb-20">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
          <span className="font-mono text-[11px] font-bold text-[#6B6B73] uppercase tracking-widest">
            Platform Capabilities
          </span>
        </div>
        <h2 className="font-satoshi text-3xl sm:text-5xl lg:text-[52px] font-bold text-[#0B0B0F] tracking-[-0.03em] leading-[1.08]">
          Engineered for commercial creative output.
        </h2>
        <p className="font-dmsans text-base sm:text-lg text-[#6B6B73] mt-5 leading-relaxed">
          Not generic prompt diffusion. ZeperAI is purpose-built for e-commerce visual standards, ad platform CTR requirements, and strict brand guidelines.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Bento 1: Studio Photography Engine (Large Feature: 7 cols) */}
        <div className="md:col-span-7 bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-5">
              <span className="font-mono text-[11px] font-bold text-[#0B0B0F] uppercase tracking-wider bg-[#F7F7F5] border border-[#E8E8E5] px-2.5 py-1 rounded">
                01 / Commercial Studio Engine
              </span>
              <span className="font-mono text-xs text-[#6B6B73]">1:1 Square & PDP</span>
            </div>
            <h3 className="font-satoshi text-xl sm:text-2xl font-bold text-[#0B0B0F] mb-3">
              Precision studio lighting and refraction
            </h3>
            <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed max-w-xl">
              Simulates real softboxes, Fresnel rim lights, surface reflections, and realistic ground contact shadows. Eliminates the artificial floating look of basic AI tools.
            </p>
          </div>

          <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-[#F7F7F5] overflow-hidden border-t border-[#E8E8E5] mx-4 sm:mx-6 mb-4 sm:mb-6 rounded-xl">
            <img
              src={landingAssets.perfume}
              alt="Commercial Studio Lighting Demonstration"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-[#0B0B0F]/90 text-white font-mono text-[10px] px-2.5 py-1 rounded">
              Subsurface Refraction Locked
            </div>
          </div>
        </div>

        {/* Bento 2: Meta & TikTok Performance Ad Creative (5 cols) */}
        <div className="md:col-span-5 bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-5">
              <span className="font-mono text-[11px] font-bold text-[#0B0B0F] uppercase tracking-wider bg-[#F7F7F5] border border-[#E8E8E5] px-2.5 py-1 rounded">
                02 / Ad Performance
              </span>
              <span className="font-mono text-xs text-blue-600 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded font-bold">
                High CTR
              </span>
            </div>
            <h3 className="font-satoshi text-xl sm:text-2xl font-bold text-[#0B0B0F] mb-3">
              Multi-variant feed ad systems
            </h3>
            <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
              Generates high-contrast visual hooks formatted for Meta 4:5 feeds and TikTok 9:16 vertical storytelling.
            </p>
          </div>

          <div className="relative aspect-[4/3] bg-[#F7F7F5] overflow-hidden border-t border-[#E8E8E5] mx-4 sm:mx-6 mb-4 sm:mb-6 rounded-xl">
            <img
              src={landingAssets.productStudio}
              alt="Meta Ad Creative System"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-[#0B0B0F]/90 text-white font-mono text-[10px] px-2.5 py-1 rounded">
              Multi-Angle Feed Grid (4:5)
            </div>
          </div>
        </div>

        {/* Bento 3: Contextual UGC Lifestyle Creator Shoot (4 cols) */}
        <div className="md:col-span-4 bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-5">
              <span className="font-mono text-[11px] font-bold text-[#0B0B0F] uppercase tracking-wider bg-[#F7F7F5] border border-[#E8E8E5] px-2.5 py-1 rounded">
                03 / Lifestyle UGC
              </span>
              <span className="font-mono text-xs text-[#6B6B73]">9:16 Stories</span>
            </div>
            <h3 className="font-satoshi text-lg sm:text-xl font-bold text-[#0B0B0F] mb-2.5">
              Authentic creator environments
            </h3>
            <p className="font-dmsans text-xs text-[#6B6B73] leading-relaxed">
              Natural daylight and believable consumer hand-holds without booking external agency creators.
            </p>
          </div>

          <div className="relative aspect-[4/3] bg-[#F7F7F5] overflow-hidden border-t border-[#E8E8E5] mx-4 sm:mx-6 mb-4 sm:mb-6 rounded-xl">
            <img
              src={landingAssets.aiInfluencer}
              alt="UGC Influencer Scene"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-[#0B0B0F]/90 text-white font-mono text-[10px] px-2 py-0.5 rounded">
              Organic Creator Daylight
            </div>
          </div>
        </div>

        {/* Bento 4: Commercial Footwear & Hard Goods (4 cols) */}
        <div className="md:col-span-4 bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-5">
              <span className="font-mono text-[11px] font-bold text-[#0B0B0F] uppercase tracking-wider bg-[#F7F7F5] border border-[#E8E8E5] px-2.5 py-1 rounded">
                04 / Footwear & Goods
              </span>
              <span className="font-mono text-xs text-[#6B6B73]">4:5 Editorial</span>
            </div>
            <h3 className="font-satoshi text-lg sm:text-xl font-bold text-[#0B0B0F] mb-2.5">
              Dynamic physical elevation
            </h3>
            <p className="font-dmsans text-xs text-[#6B6B73] leading-relaxed">
              Crisp sole textures, dynamic levitation staging, and precision directional highlights.
            </p>
          </div>

          <div className="relative aspect-[4/3] bg-[#F7F7F5] overflow-hidden border-t border-[#E8E8E5] mx-4 sm:mx-6 mb-4 sm:mb-6 rounded-xl">
            <img
              src={landingAssets.shoe}
              alt="Commercial Footwear Demonstration"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-[#0B0B0F]/90 text-white font-mono text-[10px] px-2 py-0.5 rounded">
              Zero Motion Blur Distortion
            </div>
          </div>
        </div>

        {/* Bento 5: Luxury Macro & Geometry Locking (4 cols) */}
        <div className="md:col-span-4 bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs">
          <div className="p-6 sm:p-7">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-5">
              <span className="font-mono text-[11px] font-bold text-[#0B0B0F] uppercase tracking-wider bg-[#F7F7F5] border border-[#E8E8E5] px-2.5 py-1 rounded">
                05 / Luxury Macro
              </span>
              <span className="font-mono text-xs text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded font-bold">
                100% Fidelity
              </span>
            </div>
            <h3 className="font-satoshi text-lg sm:text-xl font-bold text-[#0B0B0F] mb-2.5">
              Geometry & packaging lock
            </h3>
            <p className="font-dmsans text-xs text-[#6B6B73] leading-relaxed">
              Every crown engraving, bevel edge, and typography stroke remains 100% true to the real product.
            </p>
          </div>

          <div className="relative aspect-[4/3] bg-[#F7F7F5] overflow-hidden border-t border-[#E8E8E5] mx-4 sm:mx-6 mb-4 sm:mb-6 rounded-xl">
            <img
              src={landingAssets.watch}
              alt="Luxury Macro Product Shoot"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-[#0B0B0F]/90 text-white font-mono text-[10px] px-2 py-0.5 rounded">
              Dial Markings Verified
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
