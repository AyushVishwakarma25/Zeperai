import React from 'react';
import { Star, TrendingUp, Quote } from 'lucide-react';
import { landingAssets } from '../landingAssets.js';

interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarText: string;
  metric: string;
  metricLabel: string;
}

const TESTIMONIALS: TestimonialItem[] = [
  {
    quote: "ZeperAI eliminated our physical photoshoot setup completely. We digitized 200+ fine jewelry SKUs in 48 hours with accurate metal reflections. Our catalog launched 3 weeks early without hiring a photo studio.",
    author: "Vansh Rastogi",
    role: "Founder",
    company: "Varan Jewellers (Jaipur)",
    avatarText: "VR",
    metric: "200+ SKUs",
    metricLabel: "Digitized in 48 hours",
  },
  {
    quote: "Our Meta ad fatigue was killing acquisition margins. ZeperAI allowed us to test 30+ creative variations every single week. We saw an immediate 3.8x lift in ROAS and saved over ₹65,000 in agency production costs.",
    author: "Growth Marketing Lead",
    role: "Head of Acquisition",
    company: "Prustlr Apparel (Bengaluru)",
    avatarText: "PA",
    metric: "3.8x ROAS",
    metricLabel: "Across scaled Meta campaigns",
  },
  {
    quote: "The approval step gives us complete confidence. Other AI tools warped our serum bottles and typography, but ZeperAI locked our packaging geometry 100% while providing dozens of luxury lighting angles.",
    author: "Rohan Singhal",
    role: "Brand Director",
    company: "Aura Skincare (Mumbai)",
    avatarText: "RS",
    metric: "+34% CTR",
    metricLabel: "On Instagram feed & Reels ads",
  },
];

export const CustomerProofSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Header - Poppins, No Eyebrow, No Emojis */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <h2 className="font-poppins text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Loved by Indian D2C Founders
        </h2>
        <p className="font-inter text-base sm:text-lg text-gray-600 mt-3 leading-relaxed">
          See how leading brands eliminate creative fatigue and scale Meta and Amazon revenue with ZeperAI Studio.
        </p>
      </div>

      {/* Featured Testimonials Grid (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-[#4452FB]/40 transition-all duration-300 relative group"
          >
            <div>
              {/* Star Rating & Quote Icon */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-[#4452FB]/20 group-hover:text-[#4452FB] transition-colors" />
              </div>

              {/* Quote Text */}
              <p className="font-inter text-sm sm:text-[15px] text-gray-700 leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>
            </div>

            <div>
              {/* Metric Pill */}
              <div className="bg-[#EEF0FF] border border-[#D4D9FF] rounded-2xl p-3.5 mb-5 flex items-center justify-between">
                <div>
                  <div className="font-poppins font-bold text-lg text-[#4452FB]">
                    {t.metric}
                  </div>
                  <div className="text-[11px] font-medium text-gray-600">
                    {t.metricLabel}
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-[#4452FB]" />
              </div>

              {/* Author Row */}
              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-800 font-poppins font-bold text-xs flex items-center justify-center shrink-0">
                  {t.avatarText}
                </div>
                <div className="min-w-0">
                  <p className="font-inter font-bold text-sm text-gray-900 truncate">
                    {t.author}
                  </p>
                  <p className="font-inter text-xs text-gray-500 truncate">
                    {t.role} · <strong className="font-semibold text-gray-800">{t.company}</strong>
                  </p>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Featured Big Metric Band: ₹14.2 Lakhs Revenue Impact */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="text-left space-y-2 max-w-xl">
          <h3 className="font-poppins text-2xl sm:text-3xl font-bold text-gray-900">
            ₹14.2 Lakhs Average Incremental Revenue
          </h3>
          <p className="font-inter text-sm text-gray-600 leading-relaxed">
            Across live D2C brand stores measuring ROAS and conversion lift over 60 days. Continuous creative variation testing consistently lowers blended customer acquisition costs.
          </p>
        </div>

        <div className="lg:border-l lg:border-gray-200 lg:pl-10 text-center lg:text-left shrink-0">
          <div className="font-poppins text-4xl sm:text-6xl font-bold text-[#4452FB] leading-none">
            ₹14.2L
          </div>
          <div className="font-mono text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
            Average Brand Revenue Uplift
          </div>
        </div>
      </div>

    </section>
  );
};
