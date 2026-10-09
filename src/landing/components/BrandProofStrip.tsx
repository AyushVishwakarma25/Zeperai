import React from 'react';

const BRAND_LOGOS = [
  'DOT & KEY',
  'Minimalist',
  'Mamaearth',
  'Sugar Cosmetics',
  'Plum Goodness',
  'mCaffeine',
  'Snitch',
  'The Derma Co',
  'Varan Jewellers',
  'Prustlr',
  'Kalyan D2C',
  'Bakehouse',
  'Perfora',
  'Mokobara',
];

export const BrandProofStrip: React.FC = () => {
  return (
    <section id="brands-strip" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Section Header - Poppins, No Eyebrow, No Emojis */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <h2 className="font-poppins text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Powering Creative for Fast-Growing Indian D2C Brands
        </h2>
        <p className="font-inter text-sm sm:text-base text-gray-600 mt-2">
          From breakout apparel labels to top beauty & skincare catalogs across Meta and Amazon.
        </p>
      </div>

      {/* Infinite Scrolling Logo Ticker Band */}
      <div className="relative w-full bg-white border border-gray-200 rounded-2xl py-6 px-4 shadow-sm overflow-hidden">
        {/* Left & Right Edge Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10" />

        {/* Marquee Track */}
        <div className="flex items-center gap-10 sm:gap-14 animate-[marquee_30s_linear_infinite] whitespace-nowrap select-none">
          {/* First loop */}
          {BRAND_LOGOS.map((logo, idx) => (
            <div
              key={`logo-1-${idx}`}
              className="inline-flex items-center gap-2.5 text-sm sm:text-base font-semibold font-poppins text-gray-600 hover:text-gray-900 transition-colors cursor-default tracking-wide"
            >
              <span className="w-2 h-2 rounded-full bg-[#4452FB]" />
              <span>{logo}</span>
            </div>
          ))}

          {/* Seamless duplicate loop */}
          {BRAND_LOGOS.map((logo, idx) => (
            <div
              key={`logo-2-${idx}`}
              className="inline-flex items-center gap-2.5 text-sm sm:text-base font-semibold font-poppins text-gray-600 hover:text-gray-900 transition-colors cursor-default tracking-wide"
            >
              <span className="w-2 h-2 rounded-full bg-[#4452FB]" />
              <span>{logo}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
