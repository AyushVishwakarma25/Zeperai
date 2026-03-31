import React from 'react';
import { motion } from 'motion/react';

const items = [
  { id: 1, src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80" },
  { id: 2, src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80" },
  { id: 3, src: "https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=600&q=80" },
  { id: 4, src: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=80" },
  { id: 5, src: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80" },
  { id: 6, src: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80" },
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
