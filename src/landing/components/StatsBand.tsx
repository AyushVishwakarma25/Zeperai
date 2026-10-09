import React from 'react';
import { TrendingUp, Clock, IndianRupee, Layers } from 'lucide-react';

interface StatItem {
  value: string;
  label: string;
  subtext: string;
  icon: React.ReactNode;
}

const STATS: StatItem[] = [
  {
    value: '₹50,000+',
    label: 'Saved Per Catalog Shoot',
    subtext: 'Eliminate studio rentals, physical reshoots, and costly photographer day-rates.',
    icon: <IndianRupee className="w-5 h-5 text-[#4452FB]" />,
  },
  {
    value: '10 Mins',
    label: 'Campaign Turnaround',
    subtext: 'From raw phone capture to ready-to-scale ad bundles across 1:1, 4:5, and 9:16.',
    icon: <Clock className="w-5 h-5 text-[#4452FB]" />,
  },
  {
    value: '3.8x',
    label: 'Average ROAS Lift',
    subtext: 'Eliminate ad creative fatigue with fresh angles tested weekly on Meta and Amazon.',
    icon: <TrendingUp className="w-5 h-5 text-[#4452FB]" />,
  },
  {
    value: '₹14.2 Lakhs',
    label: 'Average D2C Revenue Impact',
    subtext: 'Generated through rapid variant deployment and improved click-through rates.',
    icon: <Layers className="w-5 h-5 text-[#4452FB]" />,
  },
];

export const StatsBand: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      {/* Contrasting Dark Band */}
      <div className="relative bg-gray-950 text-white rounded-3xl sm:rounded-[36px] p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl border border-gray-800">
        
        {/* Logo Blue Ambient Radial Glow */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 bg-[#4452FB]/25 blur-[100px] rounded-full pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#3442E8]/20 blur-[100px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Band Top Header - Poppins, No Eyebrow, No Emojis */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 relative z-10">
          <h2 className="font-poppins text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Measurable Commercial Impact for Indian D2C
          </h2>
          <p className="font-inter text-sm sm:text-base text-gray-400 mt-2.5">
            Real performance numbers across fast-growing apparel, beauty, and consumer brands.
          </p>
        </div>

        {/* 4 Large Stats in a Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
          {STATS.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#4452FB]/15 border border-[#4452FB]/30 flex items-center justify-center mb-4">
                  {stat.icon}
                </div>
                <div className="font-poppins text-3xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-none mb-2">
                  {stat.value}
                </div>
                <h3 className="font-poppins text-sm sm:text-base font-semibold text-gray-200 mb-2">
                  {stat.label}
                </h3>
              </div>
              <p className="font-inter text-xs text-gray-400 leading-relaxed mt-2">
                {stat.subtext}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
