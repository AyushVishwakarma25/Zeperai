import React from 'react';

export const CreativitySection: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-[#F8F9FB] border-y border-[#E5E7EB] text-[#080B12]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center font-dmsans">
        {/* Core Statement (Primary Heading: Satoshi Bold with -0.02em tracking) */}
        <h2 className="font-satoshi text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-[#080B12] leading-[1.15] max-w-3xl mx-auto mb-16">
          AI shouldn't replace the creative team.
          <span className="block text-[#5F6673] font-normal mt-2">
            It should make the team faster.
          </span>
        </h2>

        {/* Minimal Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch text-left">
          {/* Column 1: Human */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="text-xs font-bold font-satoshi uppercase tracking-widest text-[#5F6673] mb-4">
                01 / Human
              </div>
              <h3 className="font-satoshi text-xl font-bold text-[#080B12] mb-6">
                Creative Direction
              </h3>
              <ul className="space-y-3 font-inter text-sm text-[#5F6673]">
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#080B12]" />
                  <span>Strategy & positioning</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#080B12]" />
                  <span>Brand taste & aesthetics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#080B12]" />
                  <span>Creative direction</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#080B12]" />
                  <span>Final decision & sign-off</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E5E7EB] text-xs font-semibold text-[#080B12]">
              The Vision & Judgment
            </div>
          </div>

          {/* Column 2: ZeperAI */}
          <div className="bg-white border border-[#3155FF]/40 rounded-xl p-8 flex flex-col justify-between shadow-xs relative">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#3155FF] px-2 py-0.5 rounded">
                The Engine
              </span>
            </div>
            <div>
              <div className="text-xs font-bold font-satoshi uppercase tracking-widest text-[#3155FF] mb-4">
                02 / ZeperAI
              </div>
              <h3 className="font-satoshi text-xl font-bold text-[#080B12] mb-6">
                Autonomous Production
              </h3>
              <ul className="space-y-3 font-inter text-sm text-[#5F6673]">
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3155FF]" />
                  <span>Visual research & synthesis</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3155FF]" />
                  <span>Heavy production & rendering</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3155FF]" />
                  <span>Parallel variations in seconds</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3155FF]" />
                  <span>Multi-channel format scaling</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-[#E5E7EB] text-xs font-semibold text-[#3155FF]">
              Speed & Execution
            </div>
          </div>

          {/* Column 3: Result */}
          <div className="bg-[#070B20] text-white rounded-xl p-8 flex flex-col justify-between shadow-md">
            <div>
              <div className="text-xs font-bold font-satoshi uppercase tracking-widest text-slate-400 mb-4">
                03 / Result
              </div>
              <h3 className="font-satoshi text-xl font-bold text-white mb-6">
                Creative Advantage
              </h3>
              <ul className="space-y-3 font-inter text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928]" />
                  <span>Better, distinctive creative</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928]" />
                  <span>10x faster campaign turnaround</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928]" />
                  <span>Zero creative bottleneck</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC928]" />
                  <span>Human standards at scale</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-800 text-xs font-semibold text-[#FFC928]">
              High-Velocity Output
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
