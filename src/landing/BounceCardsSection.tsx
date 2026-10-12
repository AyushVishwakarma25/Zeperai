import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

/**
 * Image for cards - easily changeable by user
 */
const CARD_IMAGE = "https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/shot-hero-box-reach.png";

interface TestimonialCardData {
  id: string;
  bgColor: string;
  textColor: string;
  starColor: string;
  review: string;
  author: string;
  role?: string;
  rotation: number;
  zIndex: number;
  translateX: string;
  translateY: string;
  image: string;
}

const TESTIMONIALS: TestimonialCardData[] = [
  {
    id: 'rohan',
    bgColor: '#18181b', // Dark contrast surface (15%)
    textColor: '#FFFFFF',
    starColor: '#F59E0B', // Amber
    review: "We scaled our ROAS from 1.8x to 3.4x on Meta by generating 40+ fresh creative variations weekly with ZeperAI. Total game-changer for our apparel drops.",
    author: "Rohan M.",
    role: "Founder, Kasa Living",
    rotation: -9,
    zIndex: 10,
    translateX: '-360px',
    translateY: '40px',
    image: CARD_IMAGE,
  },
  {
    id: 'priya',
    bgColor: '#FFFFFF', // Crisp white neutral (80%)
    textColor: '#18181b',
    starColor: '#F59E0B',
    review: "The studio packshots saved us over ₹3,50,000 in monthly studio rental and photographer fees. Every render looks like an international editorial shoot.",
    author: "Priya S.",
    role: "Creative Director, PureBotanics",
    rotation: -4,
    zIndex: 15,
    translateX: '-180px',
    translateY: '-25px',
    image: CARD_IMAGE,
  },
  {
    id: 'arjun',
    bgColor: '#FAFAF9', // Warm stone-50 neutral (80%)
    textColor: '#1C1917',
    starColor: '#F59E0B',
    review: "Uploading our store data export and instantly getting winning creative angles based on top-selling SKUs cut our campaign launch cycle from 2 weeks to 20 minutes.",
    author: "Arjun K.",
    role: "Growth Lead, Veloz D2C",
    rotation: -1,
    zIndex: 25,
    translateX: '0px',
    translateY: '30px',
    image: CARD_IMAGE,
  },
  {
    id: 'neha',
    bgColor: '#FFFFFF', // Crisp white neutral (80%)
    textColor: '#18181b',
    starColor: '#F59E0B',
    review: "Our Amazon click-through rate jumped 42% after replacing plain white-background product shots with ZeperAI lifestyle studio scenes.",
    author: "Neha V.",
    role: "Co-Founder, Aura Organics",
    rotation: 6,
    zIndex: 20,
    translateX: '180px',
    translateY: '15px',
    image: CARD_IMAGE,
  },
  {
    id: 'tanmay',
    bgColor: '#F5F5F4', // Light stone neutral (80%)
    textColor: '#1C1917',
    starColor: '#F59E0B',
    review: "The AI UGC creator visuals look remarkably authentic. Our Instagram Reels and meta ads feel completely native and drive exceptional conversion.",
    author: "Tanmay D.",
    role: "Head of Performance, BoldBite",
    rotation: 10,
    zIndex: 12,
    translateX: '360px',
    translateY: '-10px',
    image: CARD_IMAGE,
  },
];

export const BounceCardsSection: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section id="stories" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-stone-50/50 overflow-hidden relative border-t border-stone-200 font-manrope">
      
      {/* Centered Heading */}
      <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
          Ratings &amp; Reviews
        </p>
        <h2 className="font-lora text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 tracking-tight">
          Trusted by Indian D2C Founders
        </h2>
        <p className="mt-3 text-base text-stone-600 font-normal">
          Real performance gains from founders, creative directors, and growth leads.
        </p>
      </div>

      {/* Desktop Fanned Bounce Cards Container */}
      <div className="hidden lg:flex justify-center items-center relative min-h-[500px] max-w-6xl mx-auto select-none">
        {TESTIMONIALS.map((item) => {
          const isHovered = hoveredId === item.id;
          return (
            <motion.div
              key={item.id}
              className="absolute w-[280px] rounded-3xl p-6 cursor-pointer border border-stone-200/90"
              style={{
                backgroundColor: item.bgColor,
                color: item.textColor,
                zIndex: isHovered ? 50 : item.zIndex,
                boxShadow: isHovered 
                  ? '0 20px 30px -10px rgba(0, 0, 0, 0.15)' 
                  : '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
              }}
              initial={{
                x: item.translateX,
                y: item.translateY,
                rotate: item.rotation,
                scale: 1,
              }}
              animate={{
                x: item.translateX,
                y: isHovered ? '-20px' : item.translateY,
                rotate: isHovered ? 0 : item.rotation,
                scale: isHovered ? 1.05 : 1,
              }}
              whileTap={{ scale: 0.97 }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 22,
                mass: 0.8,
              }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-4 h-4 fill-current" 
                    style={{ color: item.starColor }} 
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-[13px] leading-relaxed font-medium mb-6 line-clamp-5">
                {item.review}
              </p>

              {/* Author & Attached Image */}
              <div className="flex items-center justify-between pt-3 border-t border-current/15 mt-auto">
                <div>
                  <h4 className="font-bold text-sm leading-tight">
                    {item.author}
                  </h4>
                  {item.role && (
                    <span className="text-[11px] opacity-75 font-normal">
                      {item.role}
                    </span>
                  )}
                </div>

                {/* Image slot requested by user - replaceable */}
                <div 
                  className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-stone-300 shadow-xs"
                  title="Card Image Asset"
                >
                  <img 
                    src={item.image} 
                    alt={item.author} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile & Tablet Interactive Responsive Grid/Scroll */}
      <div className="lg:hidden flex flex-col sm:grid sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {TESTIMONIALS.map((item, idx) => (
          <motion.div
            key={item.id}
            className="rounded-3xl p-6 shadow-sm border border-stone-200/90 flex flex-col justify-between"
            style={{
              backgroundColor: item.bgColor,
              color: item.textColor,
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
            whileHover={{ scale: 1.02 }}
          >
            <div>
              {/* 5 Stars */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className="w-4 h-4 fill-current" 
                    style={{ color: item.starColor }} 
                  />
                ))}
              </div>

              {/* Review */}
              <p className="text-xs sm:text-sm leading-relaxed font-medium mb-6">
                {item.review}
              </p>
            </div>

            {/* Author + Image */}
            <div className="flex items-center justify-between pt-3 border-t border-current/15">
              <div>
                <h4 className="font-bold text-sm">
                  {item.author}
                </h4>
                {item.role && (
                  <span className="text-[11px] opacity-75">
                    {item.role}
                  </span>
                )}
              </div>
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-stone-300 shadow-xs">
                <img 
                  src={item.image} 
                  alt={item.author} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

    </section>
  );
};
