import React from 'react';
import { useNavigate } from 'react-router-dom';
import { landingAssets } from '../landingAssets.js';
import { Icon } from '../../../components/ui/Icon.js';

export const BlueStatementSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto font-sans">
      {/* 
        Container styled to match bottom-left of reference UI,
        using the deep blue shade of the ZeperAI logo (#080E2A / #0C1438 with #3155FF accent)
        instead of maroon.
      */}
      <div className="bg-[#080E2A] text-white border border-[#1C2758] rounded-3xl p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-2xl">
        
        {/* Subtle Brand Blue Ambient Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-[#3155FF]/20 via-[#3155FF]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-[#3155FF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-12 sm:space-y-16">
          
          {/* Top Row: About Us Eyebrow & Bold Manifesto Statement */}
          <div className="max-w-4xl">
            {/* Pill Eyebrow Badge (Matching [ // About Us? // ] from screenshot) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3155FF]/15 border border-[#3155FF]/30 text-[#9BB1FF] font-mono text-[11px] font-bold tracking-wider mb-6">
              <span>// About Us? //</span>
            </div>

            {/* Bold Statement (Matching typography & structure from reference screenshot) */}
            <h3 className="font-editorial text-2xl sm:text-3xl md:text-4xl text-white font-normal leading-[1.3] sm:leading-[1.35] tracking-tight">
              <span className="text-white font-medium">ZeperAI is an AI creative intelligence platform built for modern D2C brands.</span>{' '}
              <span className="text-[#B3C2FF]">
                We turn single product images into high-converting studio photography, multi-angle campaign assets, and UGC video ads—letting customers browse, select, and buy products directly inside ads on Meta, TikTok, and your storefront.
              </span>
            </h3>
          </div>

          {/* Bottom Row: Left Product Thumbnail Showcase & Right 8000+ Brands Metric Block */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end pt-8 border-t border-[#1C2758]/80">
            
            {/* Left Column: Product Thumbnail Card (matching stool/cap card in screenshot) */}
            <div className="md:col-span-5 flex items-center gap-4">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-[#0C1540] border border-[#3155FF]/30 p-2 shrink-0 shadow-lg group">
                <img
                  src={landingAssets.shoe}
                  alt="Commercial Footwear Asset"
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="space-y-1">
                <div className="font-mono text-[10px] text-[#9BB1FF] uppercase tracking-wider font-bold">
                  SKU Digital Twin
                </div>
                <div className="font-satoshi font-bold text-sm sm:text-base text-white">
                  Zero Re-Shoot Overhead
                </div>
                <p className="font-dmsans text-xs text-[#8C9BDB] leading-relaxed">
                  100% geometry lock. Generate thousands of campaign variations on demand.
                </p>
              </div>
            </div>

            {/* Right Column: 8000+ Assets / 200+ Brands + Pill Button (matching screenshot) */}
            <div className="md:col-span-7 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-md">
                <div className="font-editorial text-4xl sm:text-5xl font-normal text-white tracking-tight leading-none mb-3">
                  8000+ Assets
                </div>
                <p className="font-dmsans text-xs sm:text-sm text-[#B3C2FF] leading-relaxed">
                  With fast catalog setup, Shopify sync, and AI-powered optimization, ZeperAI helps brands boost conversions, engagement, and creative velocity.
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="h-11 sm:h-12 px-6 sm:px-7 rounded-full bg-white hover:bg-slate-100 text-[#080E2A] font-satoshi font-semibold text-xs sm:text-sm whitespace-nowrap shadow-md transition-all active:scale-[0.98] cursor-pointer shrink-0"
              >
                Get Started — For Free!
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
