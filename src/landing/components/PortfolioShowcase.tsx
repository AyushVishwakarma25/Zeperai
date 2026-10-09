import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Film } from 'lucide-react';
import { landingAssets } from '../landingAssets.js';

interface ShowcaseItem {
  id: string;
  title: string;
  category: 'all' | 'ecommerce' | 'video' | 'luxury';
  categoryLabel: string;
  format: string;
  image: string;
  aspectClass: string;
  badge: string;
  isVideo?: boolean;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'item-1',
    title: 'Clean Skincare Pure Essence',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce PDP',
    format: '1:1 Square Packshot',
    image: landingAssets.skincare,
    aspectClass: 'aspect-[4/5] sm:aspect-[3/4]',
    badge: 'Amazon 1:1 Ready',
  },
  {
    id: 'item-2',
    title: 'Streetwear Footwear Commercial',
    category: 'video',
    categoryLabel: 'Social Video & Feed',
    format: '9:16 Motion Reel',
    image: landingAssets.shoe,
    aspectClass: 'aspect-[3/4] sm:aspect-[9/16]',
    badge: 'Motion Ad Loop',
    isVideo: true,
  },
  {
    id: 'item-3',
    title: 'Royal Chronograph Watch',
    category: 'luxury',
    categoryLabel: 'Luxury Editorial',
    format: '4:5 Macro Lighting',
    image: landingAssets.watch,
    aspectClass: 'aspect-[4/5]',
    badge: '4K Macro Detail',
  },
  {
    id: 'item-4',
    title: 'Refraction Optics Perfume Bottle',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce PDP',
    format: '1:1 Refraction Lighting',
    image: landingAssets.perfume,
    aspectClass: 'aspect-[1/1]',
    badge: 'Optical Caustics',
  },
  {
    id: 'item-5',
    title: 'D2C Active Lifestyle Campaign',
    category: 'video',
    categoryLabel: 'Social Video & Feed',
    format: 'Meta 4:5 Feed Creative',
    image: landingAssets.productStudio,
    aspectClass: 'aspect-[4/5]',
    badge: 'Meta 4:5 Ad Set',
  },
  {
    id: 'item-6',
    title: 'Creator UGC Organic Review',
    category: 'luxury',
    categoryLabel: 'Creator UGC',
    format: '9:16 Social Story',
    image: landingAssets.aiInfluencer,
    aspectClass: 'aspect-[3/4] sm:aspect-[9/16]',
    badge: 'Instagram Hook',
  },
];

export const PortfolioShowcase: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'ecommerce' | 'video' | 'luxury'>('all');

  const filteredItems = activeFilter === 'all'
    ? SHOWCASE_ITEMS
    : SHOWCASE_ITEMS.filter((item) => item.category === activeFilter);

  return (
    <section id="portfolio" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Header - Poppins, No Eyebrow, No Emojis */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Studio-Quality Output, Zero Reshoots
        </h2>
        <p className="font-inter text-base sm:text-lg text-gray-600 mt-3 leading-relaxed">
          Explore actual creative outputs generated directly from raw smartphone photos using ZeperAI Studio.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12 sm:mb-14">
        {[
          { key: 'all', label: 'All Creatives' },
          { key: 'ecommerce', label: 'E-Commerce Packshots' },
          { key: 'video', label: 'Social & Motion Ads' },
          { key: 'luxury', label: 'Editorial & Luxury' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key as any)}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-[#4452FB] text-white shadow-sm'
                : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Masonry-Style Responsive Output Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 sm:gap-8 space-y-6 sm:space-y-8">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group break-inside-avoid bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#4452FB]/40 transition-all duration-300"
          >
            {/* Visual Container */}
            <div className={`relative w-full ${item.aspectClass} overflow-hidden bg-gray-50`}>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Top Badges */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                <span className="bg-white/95 text-gray-900 font-bold text-[10px] px-2.5 py-1 rounded-full shadow-2xs border border-gray-200">
                  {item.categoryLabel}
                </span>

                <span className="bg-gray-900/85 text-white font-mono text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                  {item.isVideo && <Film className="w-3 h-3 text-[#4452FB]" />}
                  <span>{item.badge}</span>
                </span>
              </div>

              {/* Bottom Info in Card */}
              <div className="absolute bottom-4 left-4 right-4 text-left text-white">
                <span className="font-mono text-[10px] text-white/80 uppercase">
                  {item.format}
                </span>
                <h3 className="font-poppins font-bold text-base sm:text-lg text-white mt-0.5">
                  {item.title}
                </h3>
              </div>
            </div>

            {/* Bottom Row on Card */}
            <div className="p-4 sm:p-5 flex items-center justify-between bg-white text-xs text-gray-600">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Commercial IP Clearance</span>
              </span>
              <button
                onClick={() => navigate('/login')}
                className="font-semibold text-[#4452FB] hover:text-[#3442E8] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Generate similar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>
    </section>
  );
};
