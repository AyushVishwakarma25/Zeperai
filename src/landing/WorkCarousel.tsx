import React from 'react';
import { motion } from 'framer-motion';
import { landingAssets } from './landingAssets.js';

const items = [
  { id: 1, src: landingAssets.work1 },
  { id: 2, src: landingAssets.work2 },
  { id: 3, src: landingAssets.work3 },
  { id: 4, src: landingAssets.work4 },
  { id: 5, src: landingAssets.work5 },
  { id: 6, src: landingAssets.work6 },
];

export const WorkCarousel: React.FC = () => {
  // Duplicate items for infinite scroll
  const carouselItems = [...items, ...items];

  return (
    <section className="py-24 overflow-hidden bg-white">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12">
        <h2 className="text-4xl md:text-5xl font-medium text-slate-900 leading-tight tracking-tight">
          You've probably seen our work.<br />
          You just didn't know it was AI.
        </h2>
      </div>

      <div className="relative w-full overflow-hidden flex">
        <motion.div
          className="flex gap-4 md:gap-6 px-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 40,
          }}
        >
          {carouselItems.map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              className="w-[280px] h-[400px] md:w-[320px] md:h-[480px] shrink-0 rounded-2xl overflow-hidden shadow-sm border border-slate-200"
            >
              <img src={item.src} alt="Work example" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
