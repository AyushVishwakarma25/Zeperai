import React from 'react';
import { Icon } from '../../../components/ui/Icon.js';

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto font-sans">
      {/* Section Header */}
      <div className="max-w-3xl mb-14 sm:mb-20">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
          <span className="font-mono text-[11px] font-bold text-[#6B6B73] uppercase tracking-widest">
            The Production Bottleneck
          </span>
        </div>
        <h2 className="font-satoshi text-3xl sm:text-5xl lg:text-[52px] font-bold text-[#0B0B0F] tracking-[-0.03em] leading-[1.08]">
          Creative production shouldn't be the bottleneck in your growth.
        </h2>
        <p className="font-dmsans text-base sm:text-lg text-[#6B6B73] mt-5 leading-relaxed">
          E-commerce brands are forced to choose between slow, expensive traditional shoots and generic AI tools that hallucinate logos and distort products.
        </p>
      </div>

      {/* Comparative Cards: Old Way vs AI Slop vs ZeperAI System */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Traditional Physical Shoots */}
        <div className="bg-white border border-[#E8E8E5] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded">
                Traditional Shoots
              </span>
              <span className="font-mono text-xs text-[#6B6B73]">Weeks</span>
            </div>
            <h3 className="font-satoshi text-lg sm:text-xl font-bold text-[#0B0B0F] mb-3">
              Slow, rigid, and unscalable
            </h3>
            <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed mb-6">
              Studio rentals, shipping sample inventory, booking creators, and waiting 3 weeks for a photographer to deliver 5 static angles.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E8E8E5] space-y-2.5 text-xs font-mono text-[#6B6B73]">
            <div className="flex items-center gap-2 text-rose-600">
              <span className="text-sm leading-none">✕</span>
              <span>₹20,000+ per studio shoot day</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <span className="text-sm leading-none">✕</span>
              <span>14–21 day revision turnaround</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <span className="text-sm leading-none">✕</span>
              <span>Fixed aspect ratios; zero agility</span>
            </div>
          </div>
        </div>

        {/* Card 2: Generic AI Diffusion Wrappers */}
        <div className="bg-white border border-[#E8E8E5] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded">
                Generic AI Wrappers
              </span>
              <span className="font-mono text-xs text-[#6B6B73]">Unusable</span>
            </div>
            <h3 className="font-satoshi text-lg sm:text-xl font-bold text-[#0B0B0F] mb-3">
              Distorts products and brands
            </h3>
            <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed mb-6">
              Text-to-image models that warp product packaging, hallucinate gibberish typography, and produce low-trust plastic visuals.
            </p>
          </div>

          <div className="pt-4 border-t border-[#E8E8E5] space-y-2.5 text-xs font-mono text-[#6B6B73]">
            <div className="flex items-center gap-2 text-amber-600">
              <span className="text-sm leading-none">✕</span>
              <span>Distorted labels & logos</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600">
              <span className="text-sm leading-none">✕</span>
              <span>Unnatural reflections & floating bottles</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600">
              <span className="text-sm leading-none">✕</span>
              <span>Damages customer purchasing trust</span>
            </div>
          </div>
        </div>

        {/* Card 3: The ZeperAI Operating System */}
        <div className="bg-[#0B0B0F] text-white border border-[#0B0B0F] rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-2.5 py-1 rounded">
                ZeperAI Creative OS
              </span>
              <span className="font-mono text-xs text-white/60">Instant</span>
            </div>
            <h3 className="font-satoshi text-lg sm:text-xl font-bold text-white mb-3">
              Geometry-locked brand scale
            </h3>
            <p className="font-dmsans text-xs sm:text-sm text-white/70 leading-relaxed mb-6">
              Upload once. The engine locks product geometry, labels, and brand identity — generating studio, ad, and UGC assets in parallel in seconds.
            </p>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/15 space-y-2.5 text-xs font-mono text-white/80">
            <div className="flex items-center gap-2 text-emerald-400">
              <Icon name="check" className="w-3.5 h-3.5 shrink-0" />
              <span>100% packaging fidelity guaranteed</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Icon name="check" className="w-3.5 h-3.5 shrink-0" />
              <span>Multi-format export (4:5, 9:16, 1:1)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Icon name="check" className="w-3.5 h-3.5 shrink-0" />
              <span>Sub-5s turnaround for rapid ad testing</span>
            </div>
          </div>

          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        </div>

      </div>
    </section>
  );
};
