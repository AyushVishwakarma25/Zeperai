import React from 'react';
import { motion } from 'framer-motion';

const FloatingIcon = ({ children, className, delay, duration, yOffset }: any) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        y: [0, yOffset, 0],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
    >
      {children}
    </motion.div>
  );
};

export const CreativitySection: React.FC = () => {
  return (
    <section className="py-32 bg-white text-center relative overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center justify-center border-y border-slate-200">
      {/* Floating Icons */}
      <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none">
        {/* Left Side */}
        <FloatingIcon className="top-[60%] left-[12%] md:left-[18%]" delay={2} duration={5} yOffset={-15}>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-pink-500/20 opacity-90">
            {/* Instagram */}
            <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </div>
        </FloatingIcon>

        {/* Right Side */}
        <FloatingIcon className="top-[10%] right-[10%] md:right-[15%]" delay={0.2} duration={5.8} yOffset={20}>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#1877F2]/10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-[#1877F2]/20">
            {/* Facebook */}
            <svg className="w-6 h-6 md:w-8 md:h-8 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
        </FloatingIcon>

        <FloatingIcon className="top-[50%] right-[15%] md:right-[22%]" delay={0.8} duration={5.2} yOffset={15}>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#00C4CC]/10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-[#00C4CC]/20">
            {/* Canva */}
            <svg className="w-6 h-6 md:w-8 md:h-8 text-[#00C4CC]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.82 17.82c-.9.9-2.34.9-3.24 0l-2.58-2.58-2.58 2.58c-.9.9-2.34.9-3.24 0-.9-.9-.9-2.34 0-3.24l2.58-2.58-2.58-2.58c-.9-.9-.9-2.34 0-3.24.9-.9 2.34-.9 3.24 0l2.58 2.58 2.58-2.58c.9-.9 2.34-.9 3.24 0 .9.9.9 2.34 0 3.24l-2.58 2.58 2.58 2.58c.9.9.9 2.34 0 3.24z"/></svg>
          </div>
        </FloatingIcon>

        <FloatingIcon className="top-[70%] right-[8%] md:right-[12%]" delay={1.8} duration={6.8} yOffset={-15}>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#0077B5]/10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-[#0077B5]/20">
            {/* LinkedIn */}
            <svg className="w-6 h-6 md:w-8 md:h-8 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </div>
        </FloatingIcon>

        <FloatingIcon className="top-[85%] right-[25%] md:right-[30%]" delay={0.4} duration={5.6} yOffset={25}>
          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#E60023]/10 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm border border-[#E60023]/20">
            {/* Pinterest */}
            <svg className="w-6 h-6 md:w-8 md:h-8 text-[#E60023]" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.168 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.633 0 12.017 0z"/></svg>
          </div>
        </FloatingIcon>
      </div>

      {/* Center Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          We believe creativity shouldn't<br className="hidden md:block" />
          feel like work.
        </h2>
      </div>
    </section>
  );
};
