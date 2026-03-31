import React from 'react';
import { motion } from 'motion/react';

const strip1Base = [
  "AI IS YOUR PARTNER, NOT YOUR REPLACEMENT",
  "HUMAN CREATIVITY. SYNTHETIC SPEED.",
  "THE NEW STANDARD FOR VISUAL INTELLIGENCE.",
  "DON'T JUST AUTOMATE. ELEVATE."
];

const strip2Base = [
  "BUILT FOR MARKETING AGENCIES",
  "ZERO STUDIO COSTS. INFINITE RENDERS.",
  "BUILT FOR D2C BRANDS",
  "FROM PROMPT TO PRODUCT IN 60 SECONDS.",
  "BUILT FOR AI DIRECTORS",
  "YOUR 24/7 VIRTUAL FASHION STUDIO."
];

// Repeat base arrays to ensure they are wider than any screen
const strip1Repeated = [...strip1Base, ...strip1Base];
const strip2Repeated = [...strip2Base, ...strip2Base];

// Duplicate for seamless infinite scroll (0% to -50%)
const strip1Content = [...strip1Repeated, ...strip1Repeated];
const strip2Content = [...strip2Repeated, ...strip2Repeated];

const StarSeparator = ({ className }: { className?: string }) => (
  <span className={`mx-4 md:mx-8 inline-block text-xl md:text-3xl opacity-70 ${className}`}>✦</span>
);

export const DualTicker: React.FC = () => {
  return (
    <div className="relative overflow-hidden py-20 min-h-[350px] bg-white flex flex-col items-center justify-center">
      {/* Strip 1: White bg, Black text, -3deg, Right to Left */}
      <div className="absolute w-[110vw] left-1/2 -translate-x-1/2 rotate-[-3deg] bg-white border-y-2 border-slate-900 shadow-sm z-10 flex overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap py-4 md:py-6 items-center will-change-transform"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 80,
          }}
        >
          {strip1Content.map((phrase, i) => (
            <React.Fragment key={i}>
              <span className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-slate-900">
                {phrase}
              </span>
              <StarSeparator className="text-slate-900" />
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Strip 2: Blue bg, White text, 2deg, Left to Right */}
      <div className="absolute w-[110vw] left-1/2 -translate-x-1/2 rotate-[2deg] bg-[#4452FB] border-y-2 border-[#3641C9] shadow-2xl z-20 flex overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap py-4 md:py-6 items-center will-change-transform"
          animate={{ x: ["-50%", "0%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 70,
          }}
        >
          {strip2Content.map((phrase, i) => (
            <React.Fragment key={i}>
              <span className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-white">
                {phrase}
              </span>
              <StarSeparator className="text-white" />
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
