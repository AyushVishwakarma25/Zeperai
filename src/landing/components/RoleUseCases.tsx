import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Layers, Store, Users, CheckCircle2, ArrowRight } from 'lucide-react';

interface UseCaseCard {
  number: string;
  vertical: string;
  headline: string;
  description: string;
  metricsPill: string;
  icon: React.ReactNode;
  tags: string[];
}

const USE_CASES: UseCaseCard[] = [
  {
    number: '01',
    vertical: 'Indian D2C Founders',
    headline: 'Launch New SKUs Without Studio Overhead',
    description: 'Eliminate ₹50,000+ upfront studio costs and weeks of delay. Generate complete multi-angle visual packs from raw phone photos on day one.',
    metricsPill: 'Same-Day Launch Pack',
    icon: <ShoppingBag className="w-5 h-5 text-[#4452FB]" />,
    tags: ['Go-to-Market', 'Zero Studio CapEx', 'PDP Hero Banners'],
  },
  {
    number: '02',
    vertical: 'Performance Marketers',
    headline: 'Beat Ad Fatigue with 30+ Weekly Variations',
    description: 'Creative fatigue drives customer acquisition costs up. Produce fresh visual hooks across Meta 4:5 and Instagram 9:16 reels in minutes.',
    metricsPill: '3.8x ROAS Sustained',
    icon: <TrendingUp className="w-5 h-5 text-[#4452FB]" />,
    tags: ['Meta Ads', 'A/B Testing', 'Multi-Channel'],
  },
  {
    number: '03',
    vertical: 'Growth & Creative Agencies',
    headline: '10x Client Creative Velocity with Existing Team',
    description: 'Automate tedious resizing, model staging, and lighting compositions. Free art directors to focus on strategy while scaling client volume.',
    metricsPill: '85% Production Time Saved',
    icon: <Layers className="w-5 h-5 text-[#4452FB]" />,
    tags: ['Agency Portfolios', 'Brand Guidelines', 'Fast Turnaround'],
  },
  {
    number: '04',
    vertical: 'Amazon & Quick-Commerce Brands',
    headline: 'Transform Flat Supplier Photos into 4K PDPs',
    description: 'Upgrade low-contrast manufacturer images into high-converting lifestyle destinations optimized for Amazon, Blinkit, and Zepto.',
    metricsPill: '+28% PDP Conversion',
    icon: <Store className="w-5 h-5 text-[#4452FB]" />,
    tags: ['Amazon A+ Content', 'Quick Commerce', 'Multi-Angle Assets'],
  },
  {
    number: '05',
    vertical: 'Beauty & Skincare Labels',
    headline: 'Texture Close-Ups & Aesthetic Staging',
    description: 'Showcase formula textures, droplet reflections, and bathroom vanity backdrops that build customer trust and drive impulse purchases.',
    metricsPill: 'Clean Texture Accuracy',
    icon: <Users className="w-5 h-5 text-[#4452FB]" />,
    tags: ['Skincare & Makeup', 'Lifestyle Vanity', 'High CTR'],
  },
  {
    number: '06',
    vertical: 'Fashion & Apparel Brands',
    headline: 'Model Poses & Lookbooks in Machine Speed',
    description: 'Stage garments on diverse models in realistic outdoor and studio environments without organizing expensive model casting calls.',
    metricsPill: 'Zero Casting Overhead',
    icon: <CheckCircle2 className="w-5 h-5 text-[#4452FB]" />,
    tags: ['Apparel Catalog', 'Fit & Drape Accuracy', 'Commercial Rights'],
  },
];

export const RoleUseCases: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="use-cases" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Header - Poppins, No Eyebrow, No Emojis */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Built for Fast-Paced D2C Teams
        </h2>
        <p className="font-inter text-base sm:text-lg text-gray-600 mt-3 leading-relaxed">
          Whether you are launching your first SKU or scaling performance ad spend on Meta and Amazon.
        </p>
      </div>

      {/* 6 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {USE_CASES.map((item) => (
          <div
            key={item.number}
            className="group bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#4452FB]/40 transition-all duration-300 hover:-translate-y-1 text-left relative overflow-hidden"
          >
            <div>
              {/* Card Top: Number & Metric Pill */}
              <div className="flex items-center justify-between mb-5">
                <span className="w-8 h-8 rounded-full bg-[#EEF0FF] text-[#4452FB] font-poppins font-bold text-xs flex items-center justify-center">
                  {item.number}
                </span>
                <span className="text-[11px] font-semibold text-[#4452FB] bg-[#EEF0FF] px-2.5 py-1 rounded-full border border-[#D4D9FF]">
                  {item.metricsPill}
                </span>
              </div>

              {/* Vertical Role Title */}
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                {item.vertical}
              </p>

              {/* Headline */}
              <h3 className="font-poppins text-lg sm:text-xl font-bold text-gray-900 mb-3 tracking-tight leading-snug">
                {item.headline}
              </h3>

              {/* Description */}
              <p className="font-inter text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                {item.description}
              </p>
            </div>

            {/* Bottom Tags */}
            <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
              {item.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[11px] font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-12">
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4452FB] hover:text-[#3442E8] transition-colors group cursor-pointer"
        >
          <span>Explore all use cases for your brand</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
};
