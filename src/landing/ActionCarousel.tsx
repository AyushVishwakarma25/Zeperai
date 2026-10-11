import React from 'react';
import { landingAssets } from './landingAssets.js';

const items = [
  { id: 1, src: landingAssets.action1, title: 'Studio Cosmetics' },
  { id: 2, src: landingAssets.action2, title: 'Luxury Skincare' },
  { id: 3, src: landingAssets.action3, title: 'UGC Creator Shoot' },
  { id: 4, src: landingAssets.action4, title: 'Dramatic Sunlight' },
  { id: 5, src: landingAssets.action5, title: 'Breakfast Table Scene' },
  { id: 6, src: landingAssets.action6, title: 'Commercial Packshot' },
  { id: 7, src: landingAssets.action7, title: 'Editorial Model' },
  { id: 8, src: landingAssets.action8, title: 'Prustlr Apparel' },
  { id: 9, src: landingAssets.action9, title: 'Footwear Commercial' },
  { id: 10, src: landingAssets.action10, title: 'Product Studio Lighting' },
  { id: 11, src: landingAssets.action11, title: 'Luxury Timepiece' },
  { id: 12, src: landingAssets.action12, title: 'Perfume Refraction' },
];

export const ActionCarousel: React.FC = () => {
  return (
    <section className="py-24 sm:py-32 overflow-hidden bg-slate-950 text-white relative">
      <div className="text-center mb-16 px-4 max-w-3xl mx-auto">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#818CF8] bg-[#818CF8]/10 px-3 py-1 rounded-full mb-3">
          Real Studio Results
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
          See ZeperAi in Action
        </h2>
        <p className="text-base sm:text-lg text-slate-400">
          From simple raw product snaps to conversion-ready commercial visuals in seconds.
        </p>
      </div>

      <div className="relative w-full h-[420px] sm:h-[480px] flex justify-center items-center [perspective:1200px]">
        <div className="relative w-[190px] h-[280px] sm:w-[230px] sm:h-[330px] [transform-style:preserve-3d] animate-carousel-spin hover:[animation-play-state:paused]">
          {items.map((item, index) => {
            const rotateY = index * (360 / items.length);
            return (
              <div
                key={item.id}
                className="group absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 transition-transform duration-300 hover:scale-105"
                style={{
                  transform: `rotateY(${rotateY}deg) translateZ(420px)`,
                }}
              >
                <img 
                  src={item.src} 
                  alt={item.title} 
                  className="w-full h-full object-cover select-none" 
                  loading="lazy"
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-xs font-semibold text-white tracking-wide truncate">
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
