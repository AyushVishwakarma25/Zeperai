import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { landingAssets } from './landingAssets.js';

const items = [
  { id: 1, src: landingAssets.action1, title: 'Studio Cosmetics', tag: 'High-Gloss Packshot' },
  { id: 2, src: landingAssets.action2, title: 'Luxury Skincare', tag: 'Editorial Lighting' },
  { id: 3, src: landingAssets.action3, title: 'UGC Creator Shoot', tag: 'TikTok & Meta Hook' },
  { id: 4, src: landingAssets.action4, title: 'Commercial Packshot', tag: 'Amazon 1:1 Listing' },
];

export const ActionCarousel: React.FC = () => {
  const navigate = useNavigate();
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play on mobile when not interacting
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % items.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handlePrev = () => {
    setMobileIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setMobileIndex((prev) => (prev + 1) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="py-16 sm:py-28 lg:py-32 overflow-hidden bg-zinc-950 text-white relative font-manrope border-y border-zinc-900 select-none">
      
      {/* Header */}
      <div className="text-center mb-10 sm:mb-16 px-4 max-w-3xl mx-auto">
        <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-zinc-300 bg-zinc-900 border border-zinc-800 px-3.5 py-1 rounded-full mb-3">
          Real Studio Results
        </span>
        <h2 className="font-lora text-3xl sm:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight leading-tight">
          See ZeperAI in Action
        </h2>
        <p className="text-sm sm:text-lg text-zinc-400 font-normal max-w-xl mx-auto">
          From simple raw product snaps to conversion-ready commercial visuals in seconds.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 01. MOBILE VIEW (<640px): TOUCH SWIPEABLE SHOWCASE CARD CONTAINER   */}
      {/* ==================================================================== */}
      <div className="sm:hidden px-4 max-w-sm mx-auto">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full max-w-[320px] mx-auto h-[410px] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl transition-all"
        >
          {items.map((item, idx) => {
            const isActive = idx === mobileIndex;
            return (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-500 ease-out ${
                  isActive ? 'opacity-100 scale-100 z-20 pointer-events-auto' : 'opacity-0 scale-95 z-10 pointer-events-none'
                }`}
              >
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover select-none"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  referrerPolicy="no-referrer"
                />

                {/* Top Badge Overlay */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-30">
                  <span className="bg-zinc-950/85 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-zinc-800">
                    {item.tag}
                  </span>
                  <span className="bg-black/75 backdrop-blur-md text-zinc-300 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border border-zinc-800">
                    0{idx + 1} / 0{items.length}
                  </span>
                </div>

                {/* Bottom Metadata & Tap Action */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-12 flex flex-col gap-2 z-30">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {item.title}
                  </h3>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#4452FB]" />
                    <span>Create Like This Free</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Left Arrow Touch Control */}
          <button
            onClick={handlePrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-zinc-700/80 text-white flex items-center justify-center z-30 shadow-md active:scale-90 transition-transform cursor-pointer"
            aria-label="Previous showcase image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow Touch Control */}
          <button
            onClick={handleNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-zinc-700/80 text-white flex items-center justify-center z-30 shadow-md active:scale-90 transition-transform cursor-pointer"
            aria-label="Next showcase image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Indicator Dots */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setMobileIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                mobileIndex === idx ? 'w-6 bg-[#4452FB]' : 'w-2 bg-zinc-700 hover:bg-zinc-600'
              }`}
              aria-label={`Jump to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 02. TABLET & DESKTOP (>=640px): 3D PERSPECTIVE ROTATING CAROUSEL     */}
      {/* ==================================================================== */}
      <div className="hidden sm:flex relative w-full h-[420px] sm:h-[480px] justify-center items-center [perspective:1200px]">
        <div className="relative w-[210px] h-[300px] sm:w-[260px] sm:h-[360px] [transform-style:preserve-3d] animate-carousel-spin hover:[animation-play-state:paused]">
          {items.map((item, index) => {
            const rotateY = index * (360 / items.length);
            return (
              <div
                key={item.id}
                className="group absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-zinc-800 bg-zinc-900 transition-transform duration-300 hover:scale-105"
                style={{
                  transform: `rotateY(${rotateY}deg) translateZ(280px)`,
                }}
              >
                <img 
                  src={item.src} 
                  alt={item.title} 
                  className="w-full h-full object-cover select-none" 
                  loading="lazy"
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end p-3.5">
                  <span className="text-xs font-semibold text-white tracking-wide truncate font-manrope">
                    {item.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
};
