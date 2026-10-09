import React from 'react';
import { Icon } from '../../../components/ui/Icon.js';

export const VerifiedCaseStudies: React.FC = () => {
  return (
    <section id="case-studies" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto border-t border-[#E8E8E5] font-sans">
      {/* Header */}
      <div className="max-w-3xl mb-14 sm:mb-20">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
          <span className="font-mono text-[11px] font-bold text-[#6B6B73] uppercase tracking-widest">
            In-Production Case Studies
          </span>
        </div>
        <h2 className="font-satoshi text-3xl sm:text-5xl lg:text-[52px] font-bold text-[#0B0B0F] tracking-[-0.03em] leading-[1.08]">
          Real brands. Proven creative velocity.
        </h2>
        <p className="font-dmsans text-base sm:text-lg text-[#6B6B73] mt-5 leading-relaxed">
          How modern e-commerce leaders replaced traditional shoot bottlenecks and agency delays with ZeperAI's creative pipeline.
        </p>
      </div>

      {/* 2 Verified Case Studies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Case Study 1: Prustlr */}
        <div className="bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#0B0B0F]/30 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-6">
              <div>
                <span className="font-satoshi text-xl font-bold text-[#0B0B0F] tracking-tight">
                  Prustlr
                </span>
                <span className="text-xs font-mono text-[#6B6B73] block mt-0.5">
                  Apparel & Lifestyle D2C
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded">
                Verified Deploy
              </span>
            </div>

            {/* Campaign Output Image */}
            <div className="aspect-[16/10] bg-[#F7F7F5] rounded-xl overflow-hidden mb-6 border border-[#E8E8E5] relative">
              <img
                src="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/Prustlr%20landing%20page%20image.webp"
                alt="Prustlr Campaign Output"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-[#0B0B0F]/90 text-white font-mono text-[10px] px-2.5 py-1 rounded">
                Meta Feed Campaign Asset
              </div>
            </div>

            <h3 className="font-satoshi text-lg sm:text-xl font-bold text-[#0B0B0F] mb-3">
              Continuous multi-hook variant testing across Meta feeds
            </h3>
            <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed mb-6">
              "ZeperAI allowed us to test fresh hooks and ad formats continuously without waiting on graphic designers or creator turnarounds. It completely removed our creative bandwidth bottleneck."
            </p>
          </div>

          <div className="pt-4 border-t border-[#E8E8E5] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="font-semibold text-[#0B0B0F]">Brand Manager, Prustlr</span>
            <div className="flex items-center gap-3 text-[#6B6B73]">
              <span className="font-bold text-[#0B0B0F]">200+ Assets</span>
              <span>•</span>
              <span className="font-bold text-[#0B0B0F]">50+ Ads Tested</span>
            </div>
          </div>
        </div>

        {/* Case Study 2: Varan Jewellers */}
        <div className="bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#0B0B0F]/30 transition-colors">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-6">
              <div>
                <span className="font-satoshi text-xl font-bold text-[#0B0B0F] tracking-tight">
                  Varan Jewellers
                </span>
                <span className="text-xs font-mono text-[#6B6B73] block mt-0.5">
                  Fine Jewelry & Luxury
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded">
                Verified Deploy
              </span>
            </div>

            {/* Campaign Output Image */}
            <div className="aspect-[16/10] bg-[#F7F7F5] rounded-xl overflow-hidden mb-6 border border-[#E8E8E5] relative">
              <img
                src="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/shot-hero-box-reach.png"
                alt="Varan Jewellers Fine Jewelry Creative"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-[#0B0B0F]/90 text-white font-mono text-[10px] px-2.5 py-1 rounded">
                Luxury Macro Staging
              </div>
            </div>

            <h3 className="font-satoshi text-lg sm:text-xl font-bold text-[#0B0B0F] mb-3">
              Digitized 200+ luxury SKUs with zero physical studio rebuilds
            </h3>
            <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed mb-6">
              "ZeperAI completely transformed our jewelry cataloging. What used to be a week-long photoshoot setup is now a seamless, digital process. The clarity and precision they bring to high-end pieces is a total game-changer for our brand."
            </p>
          </div>

          <div className="pt-4 border-t border-[#E8E8E5] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <span className="font-semibold text-[#0B0B0F]">Vansh Rastogi, Founder</span>
            <div className="flex items-center gap-3 text-[#6B6B73]">
              <span className="font-bold text-[#0B0B0F]">200+ SKUs</span>
              <span>•</span>
              <span className="font-bold text-emerald-600">90% Time Saved</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
