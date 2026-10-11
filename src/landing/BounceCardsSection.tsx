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
    id: 'stephen',
    bgColor: '#111113', // Black card
    textColor: '#FFFFFF',
    starColor: '#818CF8', // Purple stars
    review: "Within minutes the friendly sales assistant had secured me a spectacular room at The Pullman Hotel. It was right slap bang next to M&S Bank Arena literally a 30 second walk !!!",
    author: "Stephen A.",
    role: "Verified Customer",
    rotation: -9,
    zIndex: 10,
    translateX: '-160px',
    translateY: '40px',
    image: CARD_IMAGE,
  },
  {
    id: 'super-prof',
    bgColor: '#7C8BF5', // Soft purple / periwinkle
    textColor: '#FFFFFF',
    starColor: '#FFFFFF', // White stars
    review: "Super professional, organised and great to work with. These guys were invaluable on our last major project. Can't recommend enough.",
    author: "Elena R.",
    role: "Agency Producer",
    rotation: -4,
    zIndex: 15,
    translateX: '-80px',
    translateY: '-25px',
    image: CARD_IMAGE,
  },
  {
    id: 'barry',
    bgColor: '#FFFFFF', // Crisp white card
    textColor: '#0F172A',
    starColor: '#6366F1', // Purple stars
    review: "Really useful system. We got an amazing service for our company hotel bookings for our up and coming events.",
    author: "Barry W.",
    role: "Operations Director",
    rotation: -1,
    zIndex: 25,
    translateX: '0px',
    translateY: '30px',
    image: CARD_IMAGE,
  },
  {
    id: 'simon',
    bgColor: '#CFE452', // Bright chartreuse/lime
    textColor: '#111111',
    starColor: '#111111', // Black stars
    review: "Sorted accommodation in Scotland for me and were very timely and professional. Excellent rates and more discounted than anywhere else :)",
    author: "Simon F.",
    role: "Founder",
    rotation: 6,
    zIndex: 20,
    translateX: '100px',
    translateY: '15px',
    image: CARD_IMAGE,
  },
  {
    id: 'conference',
    bgColor: '#F8FAFC', // Off-white card
    textColor: '#1E293B',
    starColor: '#6366F1', // Purple stars
    review: "I recently used these guys for our company conference. They were very timely and professional. Outstanding execution and support throughout.",
    author: "Marcus T.",
    role: "Events Lead",
    rotation: 10,
    zIndex: 12,
    translateX: '180px',
    translateY: '-10px',
    image: CARD_IMAGE,
  },
];

export const BounceCardsSection: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section id="stories" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden relative border-t border-slate-100">
      
      {/* Centered Heading Reference */}
      <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
          Rating &amp; Reviews
        </p>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
          Trusted by people
        </h2>
      </div>

      {/* Desktop Fanned Bounce Cards Container */}
      <div className="hidden lg:flex justify-center items-center relative min-h-[460px] max-w-5xl mx-auto select-none">
        {TESTIMONIALS.map((item) => {
          const isHovered = hoveredId === item.id;
          return (
            <motion.div
              key={item.id}
              className="absolute w-[280px] rounded-3xl p-6 shadow-xl cursor-pointer border border-black/5"
              style={{
                backgroundColor: item.bgColor,
                color: item.textColor,
                zIndex: isHovered ? 50 : item.zIndex,
                boxShadow: isHovered 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
                  : '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
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
                scale: isHovered ? 1.08 : 1,
              }}
              whileTap={{ scale: 0.96 }}
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
                  className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-white/40 shadow-xs"
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
      <div className="lg:hidden flex flex-col sm:grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {TESTIMONIALS.map((item, idx) => (
          <motion.div
            key={item.id}
            className="rounded-3xl p-6 shadow-md border border-black/5 flex flex-col justify-between"
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
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/40 shadow-xs">
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
