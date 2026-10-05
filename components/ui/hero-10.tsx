import React from 'react';
import { ArrowRight, Sparkles, Star, CheckCircle2 } from 'lucide-react';

export interface CTAProps {
  ctaEnabled?: boolean;
  text: string;
  link?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  onClick?: () => void;
}

export interface Hero10Props {
  title: string;
  titleLine2Prefix?: string;
  titleHighlight?: string;
  description: string;
  socialProof?: string;
  images: [string, string, string] | string[];
  imageAlts?: string[];
  animation?: 'subtle' | 'none' | 'bounce';
  badgeText?: string;
  primaryCTA?: CTAProps;
  secondaryCTA?: CTAProps;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
}

export const Hero10: React.FC<Hero10Props> = ({
  title,
  titleLine2Prefix,
  titleHighlight,
  description,
  socialProof,
  images,
  imageAlts = ['First showcase', 'Center showcase', 'Third showcase'],
  animation = 'subtle',
  badgeText = 'Built for D2C Brands & E-Commerce',
  primaryCTA,
  secondaryCTA,
  onPrimaryClick,
  onSecondaryClick,
}) => {
  const img1 = images[0] || '';
  const img2 = images[1] || images[0] || '';
  const img3 = images[2] || images[0] || '';

  const handlePrimary = () => {
    if (onPrimaryClick) onPrimaryClick();
    else if (primaryCTA?.onClick) primaryCTA.onClick();
    else if (primaryCTA?.link) {
      if (primaryCTA.link.startsWith('#')) {
        const el = document.getElementById(primaryCTA.link.substring(1));
        el?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = primaryCTA.link;
      }
    }
  };

  const handleSecondary = () => {
    if (onSecondaryClick) onSecondaryClick();
    else if (secondaryCTA?.onClick) secondaryCTA.onClick();
    else if (secondaryCTA?.link) {
      if (secondaryCTA.link.startsWith('#')) {
        const el = document.getElementById(secondaryCTA.link.substring(1));
        el?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = secondaryCTA.link;
      }
    }
  };

  return (
    <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[850px] h-[450px] bg-gradient-to-tr from-[#4452FB]/15 via-indigo-500/10 to-purple-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="text-center max-w-4xl mx-auto relative z-10">
        {/* Top Badge */}
        {badgeText && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4452FB]/10 border border-[#4452FB]/20 text-[#3641C9] text-xs md:text-sm font-extrabold tracking-wider uppercase mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#4452FB]" />
            <span>{badgeText}</span>
          </div>
        )}

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6">
          <span>{title}</span>
          {(titleLine2Prefix || titleHighlight) && (
            <span className="block mt-1 sm:mt-2">
              {titleLine2Prefix && <span className="font-light mr-2.5 sm:mr-3.5">{titleLine2Prefix}</span>}
              {titleHighlight && (
                <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#4452FB] via-indigo-600 to-purple-600 underline decoration-indigo-300/60 decoration-wavy decoration-2">
                  {titleHighlight}
                </span>
              )}
            </span>
          )}
        </h1>

        {/* Subtitle / Description */}
        <p className="text-lg md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
          {description}
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          {primaryCTA?.ctaEnabled !== false && (
            <button
              onClick={handlePrimary}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#4452FB] hover:bg-[#3442E8] text-white px-7 py-3.5 md:px-8 md:py-4 rounded-2xl text-base md:text-lg font-bold shadow-xl shadow-[#4452FB]/25 hover:shadow-[#4452FB]/35 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <span>{primaryCTA?.text || 'Get Started'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {secondaryCTA?.ctaEnabled !== false && (
            <button
              onClick={handleSecondary}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 px-6 py-3.5 md:px-7 md:py-4 rounded-2xl text-base md:text-lg font-semibold transition-all cursor-pointer"
            >
              <span>{secondaryCTA?.text || 'How it works'}</span>
            </button>
          )}
        </div>

        {/* Social Proof */}
        {socialProof && (
          <div className="flex items-center justify-center gap-3 text-xs md:text-sm text-slate-500 font-medium">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                alt="User"
              />
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                alt="User"
              />
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&q=80"
                alt="User"
              />
              <img
                className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover"
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80"
                alt="User"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-semibold text-slate-700">{socialProof}</span>
            </div>
          </div>
        )}
      </div>

      {/* Fanned Image Collage (Signature Feature of Hero10) */}
      <div className="mt-14 md:mt-18 relative flex justify-center items-center py-6">
        <div className="relative flex items-center justify-center max-w-4xl w-full mx-auto h-[320px] sm:h-[400px] md:h-[480px]">
          
          {/* Card 1 - Left Fanned Card */}
          <div
            className={`absolute left-1/2 -translate-x-[75%] sm:-translate-x-[70%] md:-translate-x-[65%] top-6 sm:top-8 w-44 sm:w-60 md:w-72 aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white transform -rotate-8 sm:-rotate-10 hover:-rotate-4 hover:-translate-y-2 transition-all duration-500 z-10 group cursor-pointer ${
              animation === 'subtle' ? 'animate-in fade-in slide-in-from-bottom-6 duration-700' : ''
            }`}
          >
            <img
              src={img1}
              alt={imageAlts[0] || 'Showcase detail'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-3 left-3 right-3 text-left">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-0.5 rounded-full shadow-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> UGC Influencer
              </span>
            </div>
          </div>

          {/* Card 3 - Right Fanned Card */}
          <div
            className={`absolute left-1/2 -translate-x-[25%] sm:-translate-x-[30%] md:-translate-x-[35%] top-6 sm:top-8 w-44 sm:w-60 md:w-72 aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-white transform rotate-8 sm:rotate-10 hover:rotate-4 hover:-translate-y-2 transition-all duration-500 z-10 group cursor-pointer ${
              animation === 'subtle' ? 'animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150' : ''
            }`}
          >
            <img
              src={img3}
              alt={imageAlts[2] || 'Showcase layout'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-3 left-3 right-3 text-right">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-white/90 backdrop-blur-sm text-slate-900 px-2 py-0.5 rounded-full shadow-xs">
                Commercial Studio
              </span>
            </div>
          </div>

          {/* Card 2 - Center Highlight Card (Elevated & Prominent) */}
          <div
            className={`relative w-52 sm:w-68 md:w-80 aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white border border-slate-200/60 bg-white z-20 group hover:scale-[1.03] transition-all duration-500 cursor-pointer ${
              animation === 'subtle' ? 'animate-in fade-in zoom-in-95 duration-700 delay-75' : ''
            }`}
          >
            <img
              src={img2}
              alt={imageAlts[1] || 'Featured creative'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/10" />
            
            {/* Top Badge */}
            <div className="absolute top-3.5 left-3.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase bg-[#4452FB] text-white px-2.5 py-1 rounded-full shadow-md shadow-[#4452FB]/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Winning Creative
              </span>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-4 left-4 right-4 text-left">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Autonomous Ad Engine</p>
                  <p className="text-sm sm:text-base font-black text-white leading-tight">3.8x ROAS Optimized</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold text-white border border-white/30">
                  Ready in 45s
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero10;
