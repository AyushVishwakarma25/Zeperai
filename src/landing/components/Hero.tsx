import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Sparkles, ChevronDown, ArrowRight } from 'lucide-react';
import { landingAssets } from '../landingAssets.js';

interface MediaCard {
  id: string;
  badge: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  rotation: string;
  offsetY: string;
  heightClass: string;
}

const HERO_MEDIA_CARDS: MediaCard[] = [
  {
    id: '01',
    badge: '01',
    title: 'Clean Skincare',
    category: 'Amazon 1:1 Packshot',
    image: landingAssets.skincare,
    alt: 'Clean Skincare Product Shoot',
    rotation: '-rotate-[3deg] sm:-rotate-[4deg]',
    offsetY: 'translate-y-4 sm:translate-y-6',
    heightClass: 'h-48 sm:h-64 md:h-76 lg:h-84',
  },
  {
    id: '02',
    badge: '02',
    title: 'Footwear Commercial',
    category: 'Meta 4:5 Commercial',
    image: landingAssets.shoe,
    alt: 'Footwear Commercial Shoot',
    rotation: 'rotate-[2deg] sm:rotate-[2.5deg]',
    offsetY: '-translate-y-1 sm:-translate-y-2',
    heightClass: 'h-52 sm:h-72 md:h-84 lg:h-92',
  },
  {
    id: '03',
    badge: '03',
    title: 'Product Studio Ad',
    category: 'Meta 9:16 Story Creative',
    image: landingAssets.productStudio,
    alt: 'Studio Product Creative Preview',
    rotation: '-rotate-[1deg]',
    offsetY: '-translate-y-3 sm:-translate-y-5',
    heightClass: 'h-56 sm:h-76 md:h-88 lg:h-96',
  },
  {
    id: '04',
    badge: '04',
    title: 'Luxury Editorial',
    category: 'Chrono Studio Shoot',
    image: landingAssets.watch,
    alt: 'Watch Editorial Shoot',
    rotation: 'rotate-[2deg]',
    offsetY: 'translate-y-0 sm:translate-y-1',
    heightClass: 'h-52 sm:h-70 md:h-82 lg:h-90',
  },
  {
    id: '05',
    badge: '05',
    title: 'Refraction Optics',
    category: 'D2C Hero Packshot',
    image: landingAssets.perfume,
    alt: 'Perfume Studio Shoot',
    rotation: '-rotate-[2.5deg] sm:-rotate-[3deg]',
    offsetY: 'translate-y-3 sm:translate-y-4',
    heightClass: 'h-48 sm:h-66 md:h-78 lg:h-86',
  },
  {
    id: '06',
    badge: '06',
    title: 'Creator UGC Shoot',
    category: 'TikTok 9:16 Hook',
    image: landingAssets.aiInfluencer,
    alt: 'AI Influencer UGC Shoot',
    rotation: 'rotate-[3.5deg]',
    offsetY: 'translate-y-6 sm:translate-y-8',
    heightClass: 'h-44 sm:h-60 md:h-72 lg:h-80',
  },
];

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  // Parallax mouse position
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  // Subtle mouse movement parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleScrollToNext = () => {
    const el = document.getElementById('features') || document.getElementById('stories') || document.getElementById('creativity');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: 600, behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative pt-6 sm:pt-10 md:pt-14 pb-16 sm:pb-24 md:pb-28 px-4 sm:px-6 lg:px-8 w-full max-w-[1440px] mx-auto text-center font-manrope overflow-hidden select-none"
    >
      {/* Subtle Warm Neutral Background Wash */}
      <div
        className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[480px] bg-gradient-to-b from-stone-100/60 via-zinc-50/40 to-transparent blur-[100px] rounded-full pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* ==================================================================== */}
      {/* 01. TRUST BADGE PILL                                                */}
      {/* ==================================================================== */}
      <div className="flex justify-center mb-5 sm:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm hover:border-stone-300 transition-all hover:scale-[1.01]">
          {/* Gold Stars */}
          <div className="flex items-center gap-0.5 text-amber-500" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>

          {/* Badge Label */}
          <span className="text-xs sm:text-[13px] font-semibold text-zinc-900 tracking-tight">
            Trusted by 50+ Indian D2C Brands
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 02. HEADLINE (EDITORIAL LORA SERIF + ACCENTS)                       */}
      {/* ==================================================================== */}
      <div className="max-w-4xl mx-auto relative px-2">
        <h1 className="font-lora text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-bold text-zinc-900 leading-[1.08] tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700">
          <span className="block">Create Studio-Quality</span>
          <span className="relative inline-block mt-1 sm:mt-2">
            <span>Ad Creatives in Minutes</span>
            
            {/* Hand-drawn Underline Doodle below 'in Minutes' */}
            <svg
              className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-3 sm:h-4 overflow-visible text-[#4452FB] pointer-events-none"
              viewBox="0 0 400 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M 5 14 Q 100 4, 200 12 T 395 10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-[drawUnderline_1.4s_ease-out_forwards]"
                style={{
                  strokeDasharray: 420,
                  strokeDashoffset: 0,
                }}
              />
            </svg>
          </span>
        </h1>

        {/* Hand-drawn Sparkle Doodle (Top Right of Headline) */}
        <div className="hidden md:block absolute -top-4 -right-6 lg:-right-10 pointer-events-none text-[#4452FB]">
          <svg className="w-10 h-10 animate-pulse" viewBox="0 0 40 40" fill="none">
            <path
              d="M20 2C20 12 28 20 38 20C28 20 20 28 20 38C20 28 12 20 2 20C12 20 20 12 20 2Z"
              fill="#4452FB"
              fillOpacity="0.15"
              stroke="#4452FB"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 03. SUBHEADLINE (WARM NEUTRAL, 1-2 LINES)                            */}
      {/* ==================================================================== */}
      <div className="max-w-2xl mx-auto mt-5 sm:mt-6 px-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <p className="font-manrope text-base sm:text-lg md:text-[19px] text-zinc-600 leading-relaxed font-normal">
          Turn simple phone photos into high-converting packshots, lifestyle scenes, and Reels for Meta, Amazon, and Blinkit in seconds.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 04. CTAS & HAND-DRAWN DOODLE ANNOTATIONS                            */}
      {/* ==================================================================== */}
      <div className="relative mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-lg mx-auto z-20">
        
        {/* Primary CTA (Signature Brand Blue #4452FB) */}
        <button
          onClick={() => navigate('/login')}
          className="group relative w-full sm:w-auto h-13 sm:h-14 px-8 sm:px-9 rounded-full bg-[#4452FB] hover:bg-[#3442E8] text-white font-manrope font-bold text-base sm:text-[17px] tracking-tight shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <span>Start Creating Free</span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Secondary CTA (Explore Features) */}
        <button
          onClick={handleScrollToNext}
          className="w-full sm:w-auto h-13 sm:h-14 px-7 sm:px-8 rounded-full bg-white hover:bg-stone-50 text-zinc-900 border border-stone-200 hover:border-stone-300 font-manrope font-semibold text-base sm:text-[16px] shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2.5"
        >
          <span>Explore features</span>
        </button>

        {/* Hand-Drawn Doodle Annotation: Arrow pointing at Primary CTA */}
        <div className="hidden md:flex absolute -bottom-11 -left-36 lg:-left-44 items-center gap-2 pointer-events-none text-zinc-900 z-30 select-none">
          {/* Handwritten Text Note */}
          <div className="font-caveat text-xl sm:text-2xl font-bold text-zinc-900 tracking-wide -rotate-6">
            <span>No credit card needed</span>
            <span className="block text-xs font-semibold text-[#4452FB] font-manrope uppercase tracking-widest">Free tier included</span>
          </div>

          {/* Playful Curving SVG Arrow pointing to Primary CTA button */}
          <svg
            className="w-16 h-12 text-[#4452FB] rotate-6"
            viewBox="0 0 64 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M 6 36 C 22 42, 42 32, 54 14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 44 12 L 55 13 L 53 25"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 05. VISUAL CENTERPIECE — THUMBNAIL / MEDIA STRIP (4-6 CARDS)        */}
      {/* ==================================================================== */}
      <div className="relative mt-12 sm:mt-16 md:mt-20 max-w-[1360px] mx-auto">

        {/* Overlapping Horizontal Strip with Staggered Heights and Slight Rotation */}
        <div className="relative pt-4 pb-8 px-2 flex items-center justify-center overflow-x-auto sm:overflow-visible no-scrollbar">
          <div
            className="flex items-center justify-center -space-x-4 sm:-space-x-7 md:-space-x-9 lg:-space-x-11 select-none transition-transform duration-300 ease-out"
            style={{
              transform: `translate3d(${mousePos.x * 12}px, ${mousePos.y * 8}px, 0)`,
            }}
          >
            {HERO_MEDIA_CARDS.map((card, idx) => {
              return (
                <div
                  key={card.id}
                  className={`relative shrink-0 transition-all duration-300 ease-out group ${card.rotation} ${card.offsetY} hover:!rotate-0 hover:!-translate-y-4 hover:!scale-105 hover:!z-40`}
                  style={{
                    zIndex: 10 + (idx < 3 ? idx * 2 : (5 - idx) * 2),
                  }}
                >
                  {/* Card Shell */}
                  <div
                    className={`w-32 sm:w-44 md:w-52 lg:w-58 ${card.heightClass} rounded-2xl sm:rounded-3xl overflow-hidden bg-white border border-stone-200/90 shadow-sm relative transition-all duration-300 group-hover:shadow-lg group-hover:border-stone-300`}
                  >
                    {/* Visual Asset (Pure Image) */}
                    <div className="w-full h-full relative overflow-hidden bg-stone-50">
                      <img
                        src={card.image}
                        alt={card.alt}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="eager"
                      />
                    </div>

                    {/* Top Right Card Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs text-zinc-900 font-manrope text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-stone-200">
                      {card.badge}
                    </div>

                    {/* Top Left Tag Category */}
                    <div className="absolute top-2.5 left-2.5 bg-zinc-900/90 backdrop-blur-xs text-white font-manrope text-[8px] sm:text-[10px] font-medium px-2 py-0.5 rounded-full shadow-xs">
                      {card.title}
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute inset-x-0 bottom-0 p-2 sm:p-2.5 bg-gradient-to-t from-zinc-950/80 to-transparent text-left opacity-90 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] sm:text-[11px] font-semibold text-white font-manrope truncate">
                        {card.category}
                      </p>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 06. SCROLL INDICATOR CHEVRON (BOTTOM OF HERO)                        */}
      {/* ==================================================================== */}
      <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center">
        <button
          onClick={handleScrollToNext}
          className="group inline-flex flex-col items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-zinc-900 transition-colors cursor-pointer"
          title="Scroll to explore"
        >
          <span>Explore platform</span>
          <div className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-xs group-hover:translate-y-0.5 transition-transform">
            <ChevronDown className="w-4 h-4 text-[#4452FB]" />
          </div>
        </button>
      </div>

    </section>
  );
};
