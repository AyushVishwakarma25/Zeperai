import React from 'react';
import { Icon } from '../../../components/ui/Icon.js';

export const TrustStrip: React.FC = () => {
  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto pb-16 sm:pb-20 font-sans">
      <div className="bg-white border border-[#E8E8E5] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xs">
        {/* Category Authority Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <p className="font-mono text-[11px] font-bold text-[#6B6B73] uppercase tracking-widest">
            Built for teams who ship products at scale
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-3 text-xs sm:text-sm font-satoshi font-semibold text-[#0B0B0F]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
              D2C Brands
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
              Shopify Merchants
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
              Performance Growth Teams
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0F]" />
              Creative Studios
            </span>
          </div>
        </div>

        {/* Verified In-Production Deployments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-[#E8E8E5]">
          {/* Prustlr Verified Badge */}
          <div className="bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-satoshi text-base font-bold text-[#0B0B0F] tracking-tight">
                  Prustlr
                </span>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                  Verified In Production
                </span>
              </div>
              <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
                Scaled multi-variant ad testing across Meta feeds from single product stills.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#E8E8E5] font-mono text-xs">
              <span className="text-[#0B0B0F] font-bold">200+ Assets</span>
              <span className="text-[#6B6B73]">•</span>
              <span className="text-[#0B0B0F] font-bold">50+ Tested Variations</span>
            </div>
          </div>

          {/* Varan Jewellers Verified Badge */}
          <div className="bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-satoshi text-base font-bold text-[#0B0B0F] tracking-tight">
                  Varan Jewellers
                </span>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                  Verified In Production
                </span>
              </div>
              <p className="font-dmsans text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
                Digitized luxury catalog items into macro studio lighting scenes without physical set rebuilds.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#E8E8E5] font-mono text-xs">
              <span className="text-[#0B0B0F] font-bold">200+ SKUs</span>
              <span className="text-[#6B6B73]">•</span>
              <span className="text-[#0B0B0F] font-bold">Studio Lighting Staging</span>
            </div>
          </div>
        </div>

        {/* System Invariant Guarantees */}
        <div className="mt-6 pt-5 border-t border-[#E8E8E5] grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left text-xs font-mono text-[#6B6B73]">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Icon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Product geometry locked (zero distortion)</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Icon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Full commercial IP ownership</span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Icon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Instant ~4s generative pipeline</span>
          </div>
        </div>
      </div>
    </section>
  );
};
