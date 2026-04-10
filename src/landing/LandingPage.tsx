import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { LandingHeader } from './LandingHeader';
import { WorkCarousel } from './WorkCarousel';
import { ActionCarousel } from './ActionCarousel';
import { CreativitySection } from './CreativitySection';
import { Footer } from './Footer';


import { landingAssets } from './landingAssets';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHeaderVisible = useScrollDirection();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C8CEFE]">
      <LandingHeader />

      {/* SECTION 2 — HERO (Revamped) */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#4452FB]/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        {/* Top Headline */}
        <div className="text-center mb-12 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#F3F4FF] border border-[#E6E8FF] text-[#3641C9] px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase mb-6">
            <span className="w-2 h-2 bg-[#4452FB] rounded-full animate-pulse"></span>
            Built for Indian D2C Brands
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mx-auto leading-[1.1] max-w-5xl relative mb-6">
            <Icon name="sparkles" className="absolute -top-6 -left-8 w-10 h-10 text-yellow-400 hidden md:block" />
            Stop Prompting. Start Launching.
            <Icon name="sparkles" className="absolute -bottom-4 -right-8 w-8 h-8 text-yellow-400 hidden md:block" />
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed relative z-10 font-light">
            ZeperAI gives D2C brands, Shopify stores, and marketing agencies 100+ battle-tested, high-CTR creative templates — plus AI tools to generate product visuals, UGC content, and fashion shoots in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-[#4452FB] hover:bg-[#3641C9] text-white px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-bold transition-all shadow-lg shadow-[#C8CEFE] transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Get 25 Credits for free <Icon name="arrow-right" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collage Area */}
        <div className="relative flex flex-col items-center justify-center mb-16 z-10">
          
          {/* Desktop Floating Elements */}
          <div className="hidden lg:flex absolute left-0 top-1/4 flex-col items-start w-48">
             <div className="flex items-center gap-2 mb-2">
               <span className="text-lg font-black uppercase tracking-wider transform -rotate-12">NEW!</span>
               <Icon name="arrow-down-right" className="w-5 h-5" />
             </div>
             <p className="text-sm text-slate-500 font-medium leading-relaxed">Stop guessing what works. Instantly generate high-converting ad creatives.</p>
          </div>

          <div className="hidden lg:flex absolute right-0 top-1/4 flex-col items-end w-48 text-right">
             <h3 className="text-sm font-black uppercase tracking-widest mb-2 border-b-2 border-slate-900 pb-1">THE CREATIVE INTELLIGENCE</h3>
             <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">YOU NEED TO DRIVE REAL ROAS</p>
          </div>

          {/* Image Collage */}
          <div className="flex items-center justify-center gap-3 md:gap-5 h-[350px] md:h-[450px]">
            {/* Column 1 */}
            <div className="flex flex-col gap-4 mt-16 hidden md:flex">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src={landingAssets.hero1} alt="Placeholder" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-3 md:gap-5 mb-12">
              <div className="w-28 h-36 md:w-40 md:h-48 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src={landingAssets.hero2} alt="Placeholder" className="w-full h-full object-cover" />
              </div>
              <div className="w-28 h-36 md:w-40 md:h-48 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src={landingAssets.hero3} alt="Placeholder" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Column 3 (Center Large) */}
            <div className="flex flex-col gap-4 z-10">
              <div className="w-44 h-60 md:w-64 md:h-[380px] rounded-2xl bg-[#4452FB] overflow-hidden shadow-2xl ring-4 ring-white relative group cursor-pointer">
                <img src={landingAssets.hero4} alt="Placeholder" className="w-full h-full object-cover opacity-90 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/50 transition-colors">
                     <Icon name="play" className="w-6 h-6 text-white ml-1" />
                   </div>
                </div>
              </div>
            </div>

            {/* Column 4 */}
            <div className="flex flex-col gap-3 md:gap-5 mt-12">
              <div className="w-28 h-36 md:w-40 md:h-48 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src={landingAssets.hero5} alt="Placeholder" className="w-full h-full object-cover" />
              </div>
              <div className="w-28 h-36 md:w-40 md:h-48 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src={landingAssets.hero6} alt="Placeholder" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Column 5 */}
            <div className="flex flex-col gap-4 mb-16 hidden md:flex">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src={landingAssets.hero7} alt="Placeholder" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-t-2 border-slate-900 pt-6 relative z-10">
          <div className="flex items-center gap-3 w-full md:w-1/3">
            <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center font-black text-slate-900 text-xs">1</div>
            <span className="font-bold text-slate-900 text-sm uppercase tracking-wide">Always be updated in Creative AI</span>
          </div>

          <div className="flex items-center justify-center gap-4 w-full md:w-1/3">
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-slate-200 font-bold text-sm hover:bg-slate-50 transition-colors">
              <Icon name="mouse" className="w-4 h-4" /> Scroll for More
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-1/3 justify-start md:justify-end">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                  <img src="https://i.pravatar.cc/150?img=32" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-slate-500 max-w-[180px] leading-tight">
                  "ZeperAi completely transformed our ad creatives. 3x ROAS."
                  <div className="font-bold text-slate-900 mt-0.5">— Sarah Jenkins</div>
                </div>
             </div>
             <button onClick={() => navigate('/login')} className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors ml-2 shrink-0">
               <Icon name="arrow-right" className="w-4 h-4" />
             </button>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
        <div className="bg-gradient-to-br from-[#F3F4FF] to-emerald-50 border border-[#E6E8FF] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 justify-between">
          <div className="text-center md:text-left">
            <div className="text-4xl md:text-5xl font-black text-[#4452FB] tracking-tight leading-none mb-2">
              4.9/5
            </div>
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Average ROAS Lift & 3x CTR Increase</p>
          </div>
          <div className="h-px w-full md:h-16 md:w-px bg-slate-200"></div>
          <div className="text-center md:text-left">
            <div className="text-4xl md:text-5xl font-black text-[#4452FB] tracking-tight leading-none mb-2">
              Nano Banana Pro
            </div>
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Powered by Enterprise-Grade AI</p>
          </div>
          <div className="h-px w-full md:h-16 md:w-px bg-slate-200"></div>
          <div className="text-center md:text-left">
            <div className="text-4xl md:text-5xl font-black text-[#4452FB] tracking-tight leading-none mb-2">
              100+
            </div>
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Creatives Generated Across Categories</p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — AGITATION (THE PROBLEM) */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">
            Building creative that converts is expensive, slow, and broken.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6">
              <Icon name="currency-rupee" className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Agencies cost a fortune.</h3>
            <p className="text-slate-600">A single ad shoot costs ₹50,000–₹2L. You wait 2 weeks, get 5 images, and hope they perform.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
              <Icon name="robot" className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Generic AI tools don't understand e-commerce.</h3>
            <p className="text-slate-600">Midjourney is great for art. Canva is great for presentations. Neither knows what drives ROAS.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Icon name="eye-off" className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">You're flying blind on what actually works.</h3>
            <p className="text-slate-600">Posting creatives without knowing which format, style, or hook converts — is just expensive guesswork.</p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WORK CAROUSEL */}
      <WorkCarousel />

      {/* SECTION 4 — CREATIVITY SECTION */}
      <CreativitySection />

      {/* SECTION 5.5 — ACTION CAROUSEL */}
      <ActionCarousel />

      {/* SECTION - TEMPLATES PROVEN TO CONVERT */}
      <section className="py-24 bg-slate-900 text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4452FB] blur-[120px] rounded-full opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 blur-[120px] rounded-full opacity-20 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
            Not just AI generation. Templates that are already proven to convert.
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Every other AI tool gives you a blank canvas and a prayer. ZeperAI gives you 100+ creative templates hand-picked from real campaigns — optimised for CTR, built for e-commerce, and ready to customise with your brand in seconds. The result isn't just beautiful creative. It's creative that performs.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 border-t border-white/10 pt-12">
            <div>
              <div className="text-4xl font-black text-[#C8CEFE] mb-2">100+</div>
              <div className="text-sm font-bold uppercase tracking-wider text-slate-400">proven templates</div>
            </div>
            <div className="hidden md:block w-px h-12 bg-white/10"></div>
            <div>
              <div className="text-4xl font-black text-[#C8CEFE] mb-2">High CTR</div>
              <div className="text-sm font-bold uppercase tracking-wider text-slate-400">Built for performance</div>
            </div>
            <div className="hidden md:block w-px h-12 bg-white/10"></div>
            <div>
              <div className="text-4xl font-black text-[#C8CEFE] mb-2">Monthly</div>
              <div className="text-sm font-bold uppercase tracking-wider text-slate-400">Updated with new top-performers</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION - FEATURES */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">
            Everything you need to scale your creative output.
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 1. Product Studio */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Icon name="camera" className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">Product Studio</h3>
            <p className="text-slate-600 mb-4 font-medium">Professional product visuals without a studio or photographer.</p>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-900 font-bold"><span className="uppercase tracking-wider text-blue-600 text-xs block mb-1">Benefit</span> Cut product shoot costs by 90%. Generate 50 SKU images in the time it used to take to book a single shoot.</p>
            </div>
          </div>

          {/* 2. AI UGC Influencer */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Icon name="users" className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">AI UGC Influencer</h3>
            <p className="text-slate-600 mb-4 font-medium">Realistic influencer-style content — no casting, no contracts, no overhead.</p>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <p className="text-sm text-purple-900 font-bold"><span className="uppercase tracking-wider text-purple-600 text-xs block mb-1">Benefit</span> Scale your UGC library 10x without paying a single creator fee.</p>
            </div>
          </div>

          {/* 3. Fashion Studio */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
              <Icon name="sparkles" className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">Fashion Studio</h3>
            <p className="text-slate-600 mb-4 font-medium">On-model clothing visuals powered by generative AI.</p>
            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
              <p className="text-sm text-pink-900 font-bold"><span className="uppercase tracking-wider text-pink-600 text-xs block mb-1">Benefit</span> List new inventory instantly. No model booking, no photoshoot delays — go live the same day.</p>
            </div>
          </div>

          {/* 4. Ad Generator + Brand Intelligence */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <Icon name="zap" className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">Ad Generator + Brand Intelligence</h3>
            <p className="text-slate-600 mb-4 font-medium">Predictive creative analytics paired with automated, high-converting ad layouts.</p>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <p className="text-sm text-orange-900 font-bold"><span className="uppercase tracking-wider text-orange-600 text-xs block mb-1">Benefit</span> Stop guessing. Know which creatives will perform before you spend a rupee on ads.</p>
            </div>
          </div>

          {/* 5. 100+ High-CTR Templates */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow md:col-span-2">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
              <Icon name="layout" className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">100+ High-CTR Templates — Your unfair advantage</h3>
            <p className="text-slate-600 mb-4 font-medium">Every template in ZeperAI is curated from proven, high-performing creatives across real ad campaigns.</p>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-sm text-emerald-900 font-bold"><span className="uppercase tracking-wider text-emerald-600 text-xs block mb-1">Benefit</span> Stop starting from a blank canvas. Start from a template that already converts — and make it yours in seconds.</p>
            </div>
          </div>

          {/* 6. Shopify Analytics (Hero Differentiator) */}
          <div className="bg-[#4452FB] p-8 rounded-3xl border border-[#3641C9] hover:shadow-xl transition-shadow md:col-span-2 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
              <Icon name="bar-chart-3" className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl font-black mb-2">Shopify Analytics</h3>
            <p className="text-blue-100 mb-6 font-medium text-lg">Connect your Shopify store and see exactly which creatives drive sales — not just clicks.</p>
            <div className="bg-white/10 p-5 rounded-xl border border-white/20 backdrop-blur-sm">
              <p className="text-base text-white font-bold"><span className="uppercase tracking-wider text-blue-200 text-xs block mb-1">Benefit</span> Close the loop between creative and revenue. The only AI creative tool that knows your actual store data.</p>
            </div>
          </div>

          {/* 7. Inspiration Feed + 1-Click Remix */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
              <Icon name="refresh-cw" className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">Inspiration Feed + 1-Click Remix</h3>
            <p className="text-slate-600 mb-4 font-medium">Scroll a curated Pinterest-style feed of top-performing creatives. See something you love? Remix it with your product in one click.</p>
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
              <p className="text-sm text-yellow-900 font-bold"><span className="uppercase tracking-wider text-yellow-600 text-xs block mb-1">Benefit</span> Never run out of creative ideas. Turn competitor inspiration into your own original content instantly.</p>
            </div>
          </div>

          {/* 8. Background Remover + Image Restyle */}
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <Icon name="scissors" className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-slate-900">Background Remover + Image Restyle</h3>
            <p className="text-slate-600 mb-4 font-medium">Pixel-perfect cutouts and AI style transfer for any product or lifestyle image.</p>
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
              <p className="text-sm text-teal-900 font-bold"><span className="uppercase tracking-wider text-teal-600 text-xs block mb-1">Benefit</span> Take any raw product photo and make it ad-ready in under 30 seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — COMMERCE INTELLIGENCE */}
      <section className="py-24 bg-slate-50 px-4 sm:px-6 lg:px-8 overflow-hidden border-y border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-sm mb-6">
              <Icon name="bar-chart-3" className="w-4 h-4" />
              Shopify Data Analytics
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Stop guessing what to promote.</h2>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              ZeperAi analyzes your data and tells you exactly which products need new creatives to maximize ROAS. It doesn't create them automatically—you stay in control and make the final human decision on what to push.
            </p>
            
            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-1">
                  <Icon name="trending-up" className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-900">Scale the Winners</h4>
                  <p className="text-slate-600 mt-1">Identify your top 20% revenue drivers and instantly generate fresh ad variations to prevent ad fatigue.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shrink-0 mt-1">
                  <Icon name="refresh-cw" className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-900">Revive the Middle</h4>
                  <p className="text-slate-600 mt-1">Find products with high traffic but low conversion. Generate new lifestyle angles to test and optimize.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-1">
                  <Icon name="tag" className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-900">Clear the Dead Stock</h4>
                  <p className="text-slate-600 mt-1">Automatically generate "Clearance" and "Last Chance" creatives for your bottom 20% inventory.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#C8CEFE] to-blue-200 rounded-3xl transform rotate-3 scale-105 opacity-50 blur-lg"></div>
            <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#95BF47] rounded-lg flex items-center justify-center">
                    <Icon name="shopping-bag" className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800">Store Analysis</h3>
                </div>
                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500">Last 30 Days</span>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-green-100 bg-green-50/50 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center">
                      <Icon name="image" className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Classic White Sneaker</div>
                      <div className="text-xs text-green-600 font-bold mt-0.5 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        High ROAS • Scale Spend
                      </div>
                    </div>
                  </div>
                  <button className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors text-slate-700">Generate Ads</button>
                </div>
                
                <div className="p-4 border border-yellow-100 bg-yellow-50/50 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center">
                      <Icon name="image" className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Summer Linen Shirt</div>
                      <div className="text-xs text-yellow-600 font-bold mt-0.5 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                        High Traffic, Low Conv.
                      </div>
                    </div>
                  </div>
                  <button className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors text-slate-700">Test New Angles</button>
                </div>
                
                <div className="p-4 border border-red-100 bg-red-50/50 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center">
                      <Icon name="image" className="w-6 h-6 text-slate-300" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">Winter Beanie</div>
                      <div className="text-xs text-red-600 font-bold mt-0.5 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        Dead Stock
                      </div>
                    </div>
                  </div>
                  <button className="text-xs bg-white border border-slate-200 px-3 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-colors text-slate-700">Clearance Ads</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">From blank screen to live campaign in minutes</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">No complex prompting. No steep learning curve. Just a workflow designed for speed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-white shadow-sm">1</div>
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Icon name="upload" className="w-7 h-7 text-[#4452FB]" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Feed the Beast</h3>
            <p className="text-slate-600 text-base">Drop your brand assets and product Images.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-white shadow-sm">2</div>
            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
              <Icon name="magic-wand" className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Magic in the Middle</h3>
            <p className="text-slate-600 text-base">Explore curated presets across 100+ categories.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-white shadow-sm">3</div>
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
              <Icon name="image" className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Generate</h3>
            <p className="text-slate-600 text-base">Get high quality product images in minutes.</p>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
          <Icon name="shield-check" className="w-6 h-6 text-emerald-600" />
          <p className="text-slate-700 font-medium">
            <strong className="text-slate-900">Your data is safe.</strong> We never use your brand assets or product images to train public AI models.
          </p>
        </div>
      </section>

      {/* SECTION 8 — SOCIAL PROOF */}
      <section className="py-24 bg-slate-50 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Trusted by India's fastest-growing D2C brands</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Join 500+ founders and marketers who have already replaced their expensive creative agencies.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
              <Icon name="quote" className="w-10 h-10 text-[#E6E8FF] absolute top-6 right-6" />
              <div className="flex text-yellow-400 mb-6">
                {[1,2,3,4,5].map(i => <Icon key={i} name="star" className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-lg font-medium text-slate-800 mb-8 leading-relaxed relative z-10">
                "We used to wait weeks for new ad assets. Now I generate them while drinking my morning chai. ROAS is up 40%."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?img=32" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Priya S.</div>
                  <div className="text-sm text-slate-500">Bengaluru</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
              <Icon name="quote" className="w-10 h-10 text-[#E6E8FF] absolute top-6 right-6" />
              <div className="flex text-yellow-400 mb-6">
                {[1,2,3,4,5].map(i => <Icon key={i} name="star" className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-lg font-medium text-slate-800 mb-8 leading-relaxed relative z-10">
                "I have zero design skills. ZeperAi made me look like I have a full in-house creative team."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?img=44" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Rahul M.</div>
                  <div className="text-sm text-slate-500">Mumbai</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
              <Icon name="quote" className="w-10 h-10 text-[#E6E8FF] absolute top-6 right-6" />
              <div className="flex text-yellow-400 mb-6">
                {[1,2,3,4,5].map(i => <Icon key={i} name="star" className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-lg font-medium text-slate-800 mb-8 leading-relaxed relative z-10">
                "Fired my expensive agency last month. ZeperAi does the exact same job in 5 minutes for a fraction of the cost."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Vikram K.</div>
                  <div className="text-sm text-slate-500">Pune</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10 — FINAL CTA */}
      <section className="py-32 bg-slate-900 text-white text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4452FB] blur-[150px] rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Generate your first winning creative today.</h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Your team needs an AI upgrade addon.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white text-slate-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-slate-100 transition-colors shadow-xl flex items-center justify-center gap-2"
            >
              Start Free — No Card Required <Icon name="arrow-right" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};
