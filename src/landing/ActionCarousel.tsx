import React from 'react';
import { landingAssets } from './landingAssets';

const items = [
  { id: 1, src: landingAssets.action1 },
  { id: 2, src: landingAssets.action2 },
  { id: 3, src: landingAssets.action3 },
  { id: 4, src: landingAssets.action4 },
  { id: 5, src: landingAssets.action5 },
  { id: 6, src: landingAssets.action6 },
  { id: 7, src: landingAssets.action7 },
  { id: 8, src: landingAssets.action8 },
];

export const ActionCarousel: React.FC = () => {
  return (
    <section className="py-24 overflow-hidden bg-white">
      <div className="text-center mb-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">See ZeperAi in Action</h2>
        <p className="text-xl text-slate-600 leading-relaxed">
          From high-converting product visuals that feel like they belong in the feed, to bold ad creatives designed to catch the eye.
        </p>
      </div>

      <div className="relative w-full h-[350px] md:h-[450px] flex justify-center items-center [perspective:1200px]">
        <div className="relative w-[180px] h-[260px] md:w-[240px] md:h-[340px] [transform-style:preserve-3d] animate-carousel-spin">
          {items.map((item, index) => {
            const rotateY = index * (360 / items.length);
            return (
              <div
                key={item.id}
                className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white"
                style={{
                  transform: `rotateY(${rotateY}deg) translateZ(clamp(220px, 30vw, 350px))`,
                }}
              >
                <img src={item.src} alt="Creative" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
