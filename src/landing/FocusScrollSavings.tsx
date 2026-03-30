import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Icon } from '../../components/ui/Icon';

const savingsData = [
  {
    id: 1,
    category: "High-End Fashion",
    oldWay: "Stop spending ₹1.2L on studio shoots.",
    newWay: "Included (93% Savings)",
    icon: "shirt"
  },
  {
    id: 2,
    category: "Skincare/Beauty",
    oldWay: "UGC & Model visuals in 90 mins, not 7 days.",
    newWay: "Included (91% Savings)",
    icon: "sparkles"
  },
  {
    id: 3,
    category: "Home/Furniture",
    oldWay: "Lifestyle staging without the heavy lifting.",
    newWay: "Included (90% Savings)",
    icon: "home"
  },
  {
    id: 4,
    category: "Gadgets/Accessories",
    oldWay: "Catalog-ready renders at scale.",
    newWay: "Included (88% Savings)",
    icon: "smartphone"
  },
  {
    id: 5,
    category: "The Agency Power-House",
    oldWay: "Scale 10+ clients with one platform (Save ₹4L/mo).",
    newWay: "Included (98% Savings)",
    icon: "briefcase"
  }
];

const Card = ({ data, index, progress, totalCards }: { data: any, index: number, progress: any, totalCards: number }) => {
  // Each card gets a specific range of the scroll progress
  // Card 0: 0 to 0.2
  // Card 1: 0.2 to 0.4
  // Card 2: 0.4 to 0.6
  // Card 3: 0.6 to 0.8
  // Card 4: 0.8 to 1.0
  const range = 1 / totalCards;
  const start = index * range;
  const end = start + range;

  // We want the card to fade in quickly at 'start', stay fully visible until 'end', then fade out quickly
  const opacity = useTransform(
    progress,
    [start - 0.05, start, end, end + 0.05],
    [0, 1, 1, 0]
  );

  // Scale up slightly as it comes in
  const scale = useTransform(
    progress,
    [start - 0.05, start, end, end + 0.05],
    [0.9, 1, 1, 0.9]
  );

  // Move up from bottom, stay centered, then move up and out
  const yOffset = useTransform(
    progress,
    [start - 0.05, start, end, end + 0.05],
    [100, 0, 0, -100]
  );
  
  const y = useTransform(yOffset, (val) => `calc(-50% + ${val}px)`);

  // For the very first card, it should already be visible at scroll 0
  const finalOpacity = index === 0 ? useTransform(progress, [0, end, end + 0.05], [1, 1, 0]) : opacity;
  const finalScale = index === 0 ? useTransform(progress, [0, end, end + 0.05], [1, 1, 0.9]) : scale;
  const finalYOffset = index === 0 ? useTransform(progress, [0, end, end + 0.05], [0, 0, -100]) : yOffset;
  const finalY = index === 0 ? useTransform(finalYOffset, (val) => `calc(-50% + ${val}px)`) : y;

  // For the very last card, it should stay visible until the end of the scroll
  const lastOpacity = index === totalCards - 1 ? useTransform(progress, [start - 0.05, start, 1], [0, 1, 1]) : finalOpacity;
  const lastScale = index === totalCards - 1 ? useTransform(progress, [start - 0.05, start, 1], [0.9, 1, 1]) : finalScale;
  const lastYOffset = index === totalCards - 1 ? useTransform(progress, [start - 0.05, start, 1], [100, 0, 0]) : finalYOffset;
  const lastY = index === totalCards - 1 ? useTransform(lastYOffset, (val) => `calc(-50% + ${val}px)`) : finalY;

  return (
    <motion.div
      style={{
        opacity: lastOpacity,
        scale: lastScale,
        x: "-50%",
        y: lastY,
        zIndex: data.id,
      }}
      className="absolute top-1/2 left-1/2 w-full max-w-xl bg-white rounded-[2rem] p-10 md:p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col items-center text-center"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 font-semibold text-sm mb-8">
        <Icon name={data.icon as any} className="w-4 h-4" />
        {data.category}
      </div>
      
      <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-[1.15] tracking-tight">
        {data.oldWay}
      </h3>
      
      <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-5 py-2.5 rounded-full font-bold text-sm md:text-base border border-emerald-200 shadow-sm">
        <Icon name="trending-up" className="w-5 h-5" />
        {data.newWay}
      </div>
    </motion.div>
  );
};

export const FocusScrollSavings = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="relative h-[500vh] bg-[#F8F9FA]" id="savings">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4452FB]/5 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full"></div>
        </div>

        {/* Header */}
        <div className="absolute top-24 left-0 w-full text-center z-20 px-4">
          <div className="text-[#4452FB] font-bold tracking-widest uppercase text-sm mb-3">The real cost of the old way</div>
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">How much are you leaving on the table?</h2>
        </div>

        {/* Cards Container */}
        <div className="relative w-full h-full max-w-7xl mx-auto z-10">
          {savingsData.map((data, index) => (
            <Card key={data.id} data={data} index={index} progress={scrollYProgress} totalCards={savingsData.length} />
          ))}
        </div>

      </div>
    </div>
  );
};
