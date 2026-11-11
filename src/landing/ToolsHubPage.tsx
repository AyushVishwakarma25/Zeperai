import React from 'react';
import { Link } from 'react-router-dom';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';
import { SEO } from '../../components/SEO.js';
import {
  Calculator,
  Layers,
  ArrowRight,
  TrendingUp,
  Store,
  Sparkles,
  Zap,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { BACKGROUND_REMOVER_NICHES } from '../data/backgroundRemoverNiches.js';

export const ToolsHubPage: React.FC = () => {
  const featuredNiches = Object.values(BACKGROUND_REMOVER_NICHES).slice(0, 8);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free E-Commerce Growth Calculators & Studio Tools | ZeperAI',
    description:
      'Explore free interactive business calculators and image processing tools for Indian D2C brands, performance media buyers, and marketplace sellers on Amazon, Blinkit, and Flipkart.',
    url: 'https://www.zeperai.in/tools',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <SEO
        title="Free Indian D2C Calculators & E-Commerce Tools (2026) | ZeperAI"
        description="Free interactive business calculators and studio image tools for Indian D2C founders, performance marketers, and Blinkit, Zepto & Amazon sellers."
        canonicalUrl="/tools"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <LandingHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>ZeperAI Growth & Profitability Hub</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-4 leading-tight">
            Free E-Commerce Tools & Business Calculators
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            High-precision financial calculators, ad velocity simulators, and marketplace studio tools tailored specifically for the Indian e-commerce and D2C ecosystem.
          </p>
        </div>

        {/* Section 1: Business & Profitability Calculators */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>Financial Modeling</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Interactive Profitability Calculators
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              100% Free • Client-Side • No Sign-Up
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tool 1 */}
            <Link
              to="/tools/roas-rto-calculator"
              className="group relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500 hover:shadow-lg transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mb-5 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>

                <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">
                  D2C & Shopify Brands
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition">
                  Indian D2C Break-Even ROAS & RTO Calculator
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Calculate real advertising profitability factoring in COD share (50–75%), return shipping freight bleed, courier fees, and damage loss.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 pt-4 border-t border-slate-100 group-hover:translate-x-1 transition-transform">
                <span>Launch Calculator</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Tool 2 */}
            <Link
              to="/tools/meta-creative-fatigue"
              className="group relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between hover:border-indigo-500 hover:shadow-lg transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mb-5 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>

                <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-2">
                  Media Buyers & Agencies
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-700 transition">
                  Meta Ad Creative Fatigue Simulator
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Simulate audience saturation, CPM inflation, and CTR decay. Model how many weekly ad variants you need to sustain sub-₹450 CACs.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 pt-4 border-t border-slate-100 group-hover:translate-x-1 transition-transform">
                <span>Simulate Ad Velocity</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Tool 3 */}
            <Link
              to="/tools/quick-commerce-margin-calculator"
              className="group relative rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between hover:border-amber-500 hover:shadow-lg transition-all duration-300"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-5 group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6" />
                </div>

                <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                  FMCG & Quick Commerce
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-amber-700 transition">
                  Quick-Commerce Margin Calculator
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Pre-configured contracts for Blinkit, Zepto, and Swiggy Instamart. Calculate dark-store handling, trade margins, CM1, and net CM2 profit.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 pt-4 border-t border-slate-100 group-hover:translate-x-1 transition-transform">
                <span>Calculate Margins</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </section>

        {/* Section 2: Product Image & Background Removal Tools */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                <ImageIcon className="w-4 h-4" />
                <span>Marketplace Studio Tools</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Free E-Commerce Background Removers
              </h2>
            </div>
            <Link
              to="/tools/background-remover"
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Main Background Remover</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredNiches.map((niche) => (
              <Link
                key={niche.slug}
                to={`/tools/${niche.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-emerald-700 transition">
                    {niche.marketplace} • {niche.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 mb-2 line-clamp-2">
                    {niche.name}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {niche.metaDescription}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-emerald-700 font-bold">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3: ZeperAI Studio Callout */}
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-slate-50 p-8 sm:p-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Ready to Upgrade from Free Tools to AI Studio Automation?
            </h3>
            <p className="text-sm text-slate-600 font-normal">
              Create photo-realistic product shoots, AI model visuals, and viral ad variations in seconds. No studio booking, no photographers, no delays.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600 font-semibold justify-center sm:justify-start">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                10 Free Credits on Sign-up
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Export 4K Ultra-HD
              </span>
            </div>
          </div>

          <Link
            to="/login?returnTo=%2Fdashboard"
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 hover:scale-105"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Try ZeperAI Studio Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ToolsHubPage;
