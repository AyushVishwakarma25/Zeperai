import React from 'react';
import { landingAssets } from './landingAssets.js';

const items = [
  { id: 1, src: landingAssets.action1, title: 'Studio Cosmetics' },
  { id: 2, src: landingAssets.action2, title: 'Luxury Skincare' },
  { id: 3, src: landingAssets.action3, title: 'UGC Creator Shoot' },
  { id: 4, src: landingAssets.action4, title: 'Commercial Packshot' },
];

export const ActionCarousel: React.FC = () => {
  return (
    <section className="py-24 sm:py-32 overflow-hidden bg-zinc-950 text-white relative font-manrope border-y border-zinc-900">
      <div className="text-center mb-16 px-4 max-w-3xl mx-auto">
        <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-zinc-300 bg-zinc-900 border border-zinc-800 px-3.5 py-1 rounded-full mb-3">
          Real Studio Results
        </span>
        <h2 className="font-lora text-3xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
          See ZeperAI in Action
        </h2>
        <p className="text-base sm:text-lg text-zinc-400 font-normal">
          From simple raw product snaps to conversion-ready commercial visuals in seconds.
        </p>
      </div>

      <div className="relative w-full h-[420px] sm:h-[480px] flex justify-center items-center [perspective:1200px]">
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
