import React from 'react';
import { Icon } from '../../../components/ui/Icon.js';

interface Pillar {
  number: string;
  title: string;
  highlight: string;
  description: string;
  badge: string;
}

const PILLARS: Pillar[] = [
  {
    number: '01',
    title: 'Geometric Fidelity Locking',
    highlight: 'Zero product distortion',
    description: 'Proprietary packaging preservation ensures brand labels, typography, and physical bottle proportions remain 100% faithful to the real SKU.',
    badge: 'ANTI-HALLUCINATION',
  },
  {
    number: '02',
    title: 'Brand Identity Governance',
    highlight: 'Enforced palette & typography',
    description: 'Lock your brand kit guidelines. The creative engine enforces approved color spaces, camera elevations, and lighting signatures across every run.',
    badge: 'BRAND LOCKED',
  },
  {
    number: '03',
    title: 'Channel-Native Composition',
    highlight: 'Native 4:5, 9:16 & 1:1 ratios',
    description: 'We do not center-crop a single square image. The engine recomposes the full environmental scene to match the exact visual pacing of each channel.',
    badge: 'HIGH CTR FORMATS',
  },
  {
    number: '04',
    title: 'Commercial IP Rights',
    highlight: '100% business ownership',
    description: 'Every generated visual belongs entirely to your brand for digital ad campaigns, billboards, and e-commerce stores with full commercial clearance.',
    badge: 'COMMERCIAL READY',
  },
];

export const StrategicDifferentiation: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto border-t border-[#E8E8E5] font-sans">
      {/* Provocative, Serious Header */}
      <div className="max-w-3xl mb-14 sm:mb-20">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
          <span className="font-mono text-[11px] font-bold text-[#6B6B73] uppercase tracking-widest">
            The Strategic Difference
          </span>
        </div>
        <h2 className="font-satoshi text-3xl sm:text-5xl lg:text-[52px] font-bold text-[#0B0B0F] tracking-[-0.03em] leading-[1.08]">
          AI generation is the easy part. Production rigor is the hard part.
        </h2>
        <p className="font-dmsans text-base sm:text-lg text-[#6B6B73] mt-5 leading-relaxed">
          Anyone with an API key can generate a generic fantasy picture. ZeperAI is engineered for the reality of e-commerce: brand compliance, physical geometry fidelity, and ad-platform performance.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.number}
            className="bg-white border border-[#E8E8E5] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#0B0B0F]/30 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-5">
                <span className="font-mono text-xs font-bold text-[#0B0B0F] bg-[#F7F7F5] border border-[#E8E8E5] px-2 py-0.5 rounded">
                  PILLAR {pillar.number}
                </span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  {pillar.badge}
                </span>
              </div>

              <h3 className="font-satoshi text-xl sm:text-2xl font-bold text-[#0B0B0F] mb-1.5">
                {pillar.title}
              </h3>
              <p className="font-mono text-xs font-semibold text-[#0B0B0F] mb-3">
                {pillar.highlight}
              </p>
              <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
                {pillar.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8E8E5] flex items-center justify-between text-[11px] font-mono text-[#6B6B73]">
              <span className="flex items-center gap-1.5 text-[#0B0B0F]">
                <Icon name="check" className="w-3.5 h-3.5 text-emerald-600" />
                In-engine guarantee
              </span>
              <span>100% Invariant</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
