import React from 'react';
import { landingAssets } from './landingAssets.js';
import { Icon } from '../../components/ui/Icon.js';

export const ActionCarousel: React.FC = () => {
  return (
    <section id="demo" className="py-24 md:py-32 bg-white border-b border-[#E5E7EB] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center text-[#3155FF] text-xs font-satoshi font-medium uppercase tracking-widest mb-3 bg-blue-50 px-3 py-1 rounded-full">
            Product Experience
          </div>
          <h2 className="font-satoshi text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-[#080B12] leading-[1.15] mb-4">
            See ZeperAI in action.
          </h2>
          <p className="font-dmsans font-normal text-base sm:text-lg text-[#5F6673] leading-[1.55]">
            From raw packshot to campaign-ready creative systems in a single cohesive workspace.
          </p>
        </div>

        {/* Large Browser-Style Product Screenshot / Mockup */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="bg-[#080B12] rounded-2xl p-2 sm:p-3 shadow-2xl border border-slate-800">
            {/* Browser Chrome Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-4 py-1 rounded-md font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>zeperai.in/studio/campaign</span>
              </div>
              <div className="text-xs text-slate-500 font-mono hidden sm:block">
                Nano Banana 2.0 Engine
              </div>
            </div>

            {/* Inner Studio Interface */}
            <div className="bg-[#F8F9FB] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[480px] md:min-h-[560px]">
              {/* Studio Left Control Bar */}
              <div className="lg:col-span-3 bg-white border-r border-[#E5E7EB] p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#080B12] font-satoshi">
                      Source Product
                    </span>
                    <span className="text-[10px] font-bold bg-blue-50 text-[#3155FF] px-2 py-0.5 rounded">
                      Linked
                    </span>
                  </div>

                  {/* Thumbnail & Product Meta */}
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F8F9FB] border border-[#E5E7EB] mb-5">
                    <img
                      src={landingAssets.hero3}
                      alt="Active Product"
                      className="w-12 h-12 rounded object-cover border border-[#E5E7EB]"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#080B12] truncate">Botanical Elixir 50ml</div>
                      <div className="text-[11px] text-[#5F6673]">Shopify SKU #8812</div>
                    </div>
                  </div>

                  {/* Direction Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#5F6673] uppercase tracking-wider block mb-1.5">
                        Creative Direction
                      </label>
                      <div className="p-2.5 bg-[#F8F9FB] border border-[#3155FF]/40 rounded-lg text-xs font-semibold text-[#080B12] flex items-center justify-between">
                        <span>Sunlit Editorial Studio</span>
                        <Icon name="sparkles" className="w-3.5 h-3.5 text-[#3155FF]" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#5F6673] uppercase tracking-wider block mb-1.5">
                        Brand Identity
                      </label>
                      <div className="p-2.5 bg-[#F8F9FB] border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#5F6673] flex items-center justify-between">
                        <span>Minimal Modern / #3155FF</span>
                        <span className="w-3 h-3 rounded-full bg-[#3155FF]" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#5F6673] uppercase tracking-wider block mb-1.5">
                        Aspect Ratios
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-center py-1.5 text-xs font-bold bg-[#3155FF] text-white rounded">
                          4:5 Meta
                        </span>
                        <span className="text-center py-1.5 text-xs font-medium bg-[#F8F9FB] border border-[#E5E7EB] text-[#080B12] rounded">
                          9:16 Story
                        </span>
                        <span className="text-center py-1.5 text-xs font-medium bg-[#F8F9FB] border border-[#E5E7EB] text-[#080B12] rounded">
                          1:1 PDP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] mt-4">
                  <button className="w-full bg-[#3155FF] hover:bg-[#2643E0] text-white py-2.5 rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5">
                    <Icon name="sparkles" className="w-3.5 h-3.5" />
                    <span>Generate Variations (4)</span>
                  </button>
                </div>
              </div>

              {/* Studio Canvas / Center Stage */}
              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between items-center relative bg-radial from-slate-100 to-[#F8F9FB]">
                <div className="w-full flex justify-between items-center text-xs text-[#5F6673] font-mono mb-4">
                  <span>CANVAS PREVIEW • 1080 x 1350</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">● High Fidelity</span>
                </div>

                {/* Primary High-Resolution Creative Output */}
                <div className="relative max-w-sm w-full aspect-[4/5] rounded-xl overflow-hidden shadow-xl border border-[#E5E7EB] bg-white group">
                  <img
                    src={landingAssets.hero6}
                    alt="ZeperAI Studio Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080B12]/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#FFC928] mb-1">
                      Campaign Output • Ready to Deploy
                    </div>
                    <div className="font-satoshi text-lg font-bold">
                      Sunlight Shadow Editorial Series
                    </div>
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-xs text-[#5F6673] mt-4 pt-3 border-t border-[#E5E7EB]">
                  <span>Product identity: Locked</span>
                  <span>Lighting: Direct Natural Sunlight</span>
                  <span>Resolution: 4K Crisp</span>
                </div>
              </div>

              {/* Studio Right Outputs Panel */}
              <div className="lg:col-span-3 bg-white border-l border-[#E5E7EB] p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#080B12] font-satoshi">
                      Batch Variations
                    </span>
                    <span className="text-xs font-mono text-[#5F6673]">4 generated</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-[4/5] rounded-lg overflow-hidden border-2 border-[#3155FF] relative shadow-xs">
                      <img src={landingAssets.hero6} alt="Variation 1" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-[#3155FF] text-white px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <div className="aspect-[4/5] rounded-lg overflow-hidden border border-[#E5E7EB] relative">
                      <img src={landingAssets.hero4} alt="Variation 2" className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-[4/5] rounded-lg overflow-hidden border border-[#E5E7EB] relative">
                      <img src={landingAssets.hero2} alt="Variation 3" className="w-full h-full object-cover" />
                    </div>
                    <div className="aspect-[4/5] rounded-lg overflow-hidden border border-[#E5E7EB] relative">
                      <img src={landingAssets.hero7} alt="Variation 4" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] mt-4 space-y-2">
                  <button className="w-full bg-[#080B12] hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Icon name="download" className="w-3.5 h-3.5" />
                    <span>Export All Formats</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 16: "From blank screen to live campaign in minutes" — 3 Large Blocks */}
        <div className="max-w-5xl mx-auto pt-8">
          <div className="text-center mb-12">
            <h3 className="font-satoshi text-2xl sm:text-3xl font-bold tracking-tight text-[#080B12]">
              From blank screen to live campaign in minutes.
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Step 01 */}
            <div className="bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl p-8 flex flex-col justify-between">
              <div>
                <span className="font-satoshi text-4xl sm:text-5xl font-bold text-[#080B12] tracking-tight block mb-4">
                  01
                </span>
                <h4 className="font-satoshi text-xl font-bold text-[#080B12] mb-2">
                  Upload Product
                </h4>
                <p className="font-inter text-sm text-[#5F6673] leading-relaxed">
                  Drop your raw product photography, catalog shots, or sync straight from Shopify.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#E5E7EB] text-xs font-mono text-[#5F6673]">
                Zero prompt engineering needed
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl p-8 flex flex-col justify-between">
              <div>
                <span className="font-satoshi text-4xl sm:text-5xl font-bold text-[#3155FF] tracking-tight block mb-4">
                  02
                </span>
                <h4 className="font-satoshi text-xl font-bold text-[#080B12] mb-2">
                  Select Direction
                </h4>
                <p className="font-inter text-sm text-[#5F6673] leading-relaxed">
                  Choose proven visual aesthetics from 100+ categories: lifestyle, macro, studio, or UGC.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#E5E7EB] text-xs font-mono text-[#5F6673]">
                Brand identity preserved automatically
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-[#F8F9FB] border border-[#E5E7EB] rounded-xl p-8 flex flex-col justify-between">
              <div>
                <span className="font-satoshi text-4xl sm:text-5xl font-bold text-[#080B12] tracking-tight block mb-4">
                  03
                </span>
                <h4 className="font-satoshi text-xl font-bold text-[#080B12] mb-2">
                  Generate Campaign
                </h4>
                <p className="font-inter text-sm text-[#5F6673] leading-relaxed">
                  Export multi-aspect ratio creatives formatted for Meta, Amazon, Instagram, and web.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#E5E7EB] text-xs font-mono text-[#5F6673]">
                Production-ready in seconds
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
