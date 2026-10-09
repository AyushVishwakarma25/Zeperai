import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowRight, Zap, Eye, Sliders, ShieldCheck } from 'lucide-react';
import { landingAssets } from '../landingAssets.js';

interface FeatureBlock {
  number: string;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  badge: string;
  metricsPill: string;
  reversed?: boolean;
}

const FEATURE_BLOCKS: FeatureBlock[] = [
  {
    number: '01',
    tag: 'INTELLIGENT BRAND EXTRACTION',
    title: 'Instant Brand DNA & Competitor Ad Analysis',
    description: 'Simply paste your store URL. ZeperAI Studio automatically ingests your visual palette, typography, product geometries, and high-CTR competitor angles in seconds.',
    bullets: [
      'Automatic color palette & font token extraction',
      'AI competitor hook & creative format mining',
      'Zero setup required — syncs straight from your website',
    ],
    image: landingAssets.productStudio,
    imageAlt: 'ZeperAI Studio Brand Analysis & Extraction',
    badge: 'Step 1 · Automated Ingestion',
    metricsPill: '⚡ 30s Setup',
    reversed: false,
  },
  {
    number: '02',
    tag: 'MULTI-AGENT ORCHESTRATION',
    title: 'Autonomous Creative Director with Human Approval',
    description: 'Specialized AI agents research angles, write hooks, and draft multi-scene shot lists. You review and approve every creative direction with a single click before rendering.',
    bullets: [
      'Multi-agent role division (Strategist, Copywriter, Art Director)',
      'Human-in-the-loop approval gate at every milestone',
      '100% geometry fidelity guarantees real product accuracy',
    ],
    image: landingAssets.skincare,
    imageAlt: 'Multi-Agent Strategy and Approval Gate',
    badge: 'Step 2 · Strategy & Direction',
    metricsPill: '✓ 100% Approval Control',
    reversed: true,
  },
  {
    number: '03',
    tag: 'BULK CREATIVE GENERATION',
    title: 'Hundreds of Studio Variations in Minutes',
    description: 'Turn a single raw product photo into hundreds of high-converting 4K packshots, lifestyle scenes, and 9:16 motion video ads tailored for Meta, TikTok, and Amazon.',
    bullets: [
      'One-click multi-format export (1:1 PDP, 4:5 Feed, 9:16 Stories/Reels)',
      'Infinite lighting styles, props, and realistic cast models',
      'Instant bulk variations for continuous A/B testing',
    ],
    image: landingAssets.shoe,
    imageAlt: 'Bulk Studio Creative Generation',
    badge: 'Step 3 · Studio Rendering',
    metricsPill: '🔥 50+ Variations / Batch',
    reversed: false,
  },
];

export const FeatureBlocks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="capabilities" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#EFE3D3] shadow-warm-sm text-xs font-semibold text-[#FF6B35] uppercase tracking-wider mb-3.5">
          <Zap className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span>Core Capabilities</span>
        </div>

        <h2 className="font-fraunces text-3xl sm:text-5xl md:text-6xl font-bold text-[#1A1A1A] tracking-tight leading-[1.08]">
          Your Entire Creative Workflow, <br className="hidden sm:inline" />
          <span className="text-[#FF6B35]">Automated End-to-End</span>
        </h2>
        
        <p className="font-inter text-base sm:text-lg text-[#5C5650] mt-4 max-w-2xl mx-auto leading-relaxed">
          From the moment you connect your website to your final ad launch — ZeperAI Studio handles research, strategy, and bulk generation while keeping you in complete creative control.
        </p>
      </div>

      {/* 3 Alternating Image + Text Feature Blocks */}
      <div className="space-y-20 sm:space-y-28">
        {FEATURE_BLOCKS.map((block, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center ${
              block.reversed ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Visual Column */}
            <div className={`lg:col-span-7 ${block.reversed ? 'lg:order-2' : 'lg:order-1'}`}>
              <div className="relative group">
                {/* Glow backdrop */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#FF6B35]/15 via-[#FFA826]/10 to-transparent rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

                {/* Card container */}
                <div className="relative bg-white border border-[#EFE3D3] rounded-3xl overflow-hidden shadow-warm-md group-hover:shadow-warm-lg transition-all duration-300">
                  <div className="aspect-[16/11] sm:aspect-[16/10] overflow-hidden bg-[#FDF6EC] relative">
                    <img
                      src={block.image}
                      alt={block.imageAlt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Top Left Badge */}
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs border border-[#EFE3D3] px-3 py-1 rounded-full shadow-warm-sm flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
                      <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                      <span>{block.badge}</span>
                    </div>

                    {/* Bottom Right Metrics Pill */}
                    <div className="absolute bottom-4 right-4 bg-[#1A1A1A]/90 backdrop-blur-xs text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-mono font-medium border border-white/10">
                      {block.metricsPill}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className={`lg:col-span-5 ${block.reversed ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="max-w-xl">
                {/* Number & Tag Pill */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-8 h-8 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] font-fraunces font-bold text-sm flex items-center justify-center">
                    {block.number}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
                    {block.tag}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="font-fraunces text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1A1A] tracking-tight leading-[1.15] mb-4">
                  {block.title}
                </h3>

                {/* 2-line Description */}
                <p className="font-inter text-base text-[#5C5650] leading-relaxed mb-6">
                  {block.description}
                </p>

                {/* Bullets */}
                <ul className="space-y-3 mb-8">
                  {block.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-3 text-sm text-[#1A1A1A]">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-[#FFF0E6] text-[#FF6B35] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Link */}
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B35] hover:text-[#F05A24] transition-colors group cursor-pointer"
                >
                  <span>Explore this capability</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </section>
  );
};
