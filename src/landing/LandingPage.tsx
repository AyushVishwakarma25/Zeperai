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
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { landingAssets } from './landingAssets';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHeaderVisible = useScrollDirection();
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  useEffect(() => {
    const handleScroll = () => {
        setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      {/* Ticker Section at Top */}
      <div className="bg-black text-white py-2 overflow-hidden whitespace-nowrap relative z-[60]">
        <div className="flex animate-marquee gap-8 items-center">
           {[1, 2].map(i => (
             <div key={i} className="flex gap-8 items-center">
               <span className="text-xs md:text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                 3x Higher CTR <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                 ROAS Optimized Creatives <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                 Zero Prompt Engineering <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                 25 Free Credits on Signup <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                 Trusted by D2C Founders <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                 4.9/5 Average Rating <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                 Scale Your Creative Output <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                 Stop the Guesswork
               </span>
             </div>
           ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 15s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
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
              Claim Your 25 Free Credits <Icon name="arrow-right" className="w-5 h-5" />
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
              <div className="w-44 h-60 md:w-64 md:h-[380px] rounded-2xl bg-slate-100 overflow-hidden shadow-2xl ring-4 ring-white relative group cursor-pointer">
                <img 
                  src="https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/Prustlr%20landing%20page%20image.webp" 
                  alt="Product" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
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
                  <img src="https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/shot-hero-box-reach.png" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs text-slate-500 max-w-[180px] leading-tight">
                  "ZeperAi completely transformed our jewelry cataloging."
                  <div className="font-bold text-slate-900 mt-0.5">— Vansh Rastogi</div>
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
            <div className="text-2xl md:text-3xl font-black text-[#4452FB] tracking-tight leading-tight mb-2">
              Blended ROAS Lift of 1.4x and 3x Hook-Rate Improvement.
            </div>
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

      {/* SECTION 2 — AGITATION (THE PROBLEM) - UPDATED WITH SLIDER */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-950 rounded-[3rem] my-12 text-white overflow-hidden relative border border-slate-800">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Heading & Text */}
          <div className="lg:col-span-4 space-y-8">
             <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
               From Old-School Marketing to AI-Powered Storytelling
             </h2>
             <p className="text-lg text-slate-300 leading-relaxed font-light">
               See how our AI-powered ads transform your brand’s marketing — saving time, cutting costs, and boosting performance.
             </p>
             <div className="pt-4">
                <button onClick={() => navigate('/login')} className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
                  Get Started for Free <Icon name="arrow-right" className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* Middle Column: Draggable Slider */}
          <div className="lg:col-span-4 flex justify-center">
             <div className="w-full max-w-[320px]">
                <BeforeAfterSlider 
                  beforeImage="https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/raw%20product.webp"
                  afterImage="https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/compare%20after.webp"
                />
             </div>
          </div>

          {/* Right Column: Comparison Cards */}
          <div className="lg:col-span-4 space-y-6">
             {/* Before Card */}
             <div className="bg-[#FABE24] p-6 rounded-2xl shadow-2xl -rotate-1 hover:rotate-0 transition-transform duration-500">
                <h4 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter">Before (The Problem)</h4>
                <ul className="space-y-4">
                   <li className="flex items-start gap-3 text-slate-900 text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0"></div>
                      <span><strong>The Cost:</strong> Traditional shoots cost ₹50k–₹2L for just 5 images and a 2-week wait.</span>
                   </li>
                   <li className="flex items-start gap-3 text-slate-900 text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0"></div>
                      <span><strong>The Loop:</strong> Generic AI is a prompt-engineering trap that requires constant, manual tweaking.</span>
                   </li>
                   <li className="flex items-start gap-3 text-slate-900 text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0"></div>
                      <span><strong>The Risk:</strong> Launching ads without performance data is just expensive, unoptimized guesswork.</span>
                   </li>
                </ul>
             </div>

             {/* After Card */}
             <div className="bg-slate-50 p-6 rounded-2xl shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                <h4 className="text-lg font-black text-[#4452FB] mb-4 uppercase tracking-tighter">After (The Solution)</h4>
                <ul className="space-y-4">
                   <li className="flex items-start gap-3 text-slate-800 text-sm font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4452FB] mt-2 shrink-0"></div>
                      <span>Generate high-end, studio-grade product visuals in seconds at a fraction of the cost.</span>
                   </li>
                   <li className="flex items-start gap-3 text-slate-800 text-sm font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4452FB] mt-2 shrink-0"></div>
                      <span>Our e-commerce-tuned engine delivers market-ready assets on the very first click.</span>
                   </li>
                   <li className="flex items-start gap-3 text-slate-800 text-sm font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4452FB] mt-2 shrink-0"></div>
                      <span>Deploy high-converting formats and hooks backed by proven e-commerce metrics.</span>
                   </li>
                </ul>
             </div>
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

      {/* SECTION - FEATURES (BENTO GRID) */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">
            Everything you need to scale your creative output.
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:auto-rows-[240px]">
          {/* 1. AI Creative Workflow (Wide 2x1) */}
          <div className="md:col-span-2 md:row-span-1 bg-[#6366F1] rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-500"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold tracking-widest text-indigo-100 uppercase mb-2">Workflow</div>
                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight max-w-[280px]">AI Creative Workflow.</h3>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-lg border border-white/30">
                  Professional ad creation in minutes
                </div>
              </div>
            </div>
            <div className="absolute right-4 bottom-4 w-32 h-32 opacity-90 group-hover:rotate-12 transition-transform duration-500">
               <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center">
                 <Icon name="sparkles" className="w-16 h-16 text-white" />
               </div>
            </div>
          </div>

          {/* 2. Product Studio (Wide 2x1) */}
          <div className="md:col-span-2 md:row-span-1 bg-[#2DD4BF] rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-48 h-48 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-500"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold tracking-widest text-teal-900 uppercase mb-2">Product</div>
                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight max-w-[280px]">Professional product visuals instantly.</h3>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-lg border border-white/30">
                  Cut shoot costs by 90%
                </div>
              </div>
            </div>
            <div className="absolute right-4 bottom-4 w-32 h-32 opacity-90 group-hover:scale-110 transition-transform duration-500">
               <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80" alt="Product" className="w-full h-full object-cover rounded-full shadow-xl border-4 border-white" />
            </div>
          </div>

          {/* 2. AI UGC Influencer (Tall 1x2) */}
          <div className="md:col-span-1 md:row-span-2 bg-[#6366F1] rounded-3xl p-8 relative overflow-hidden group">
            <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80" alt="Fashion" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4f46e5] via-[#4f46e5]/40 to-transparent"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold tracking-widest text-indigo-100 uppercase mb-2">Influencer</div>
                <h3 className="text-2xl font-bold text-white leading-tight">Realistic UGC content at scale.</h3>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                  No creator fees
                </div>
              </div>
            </div>
          </div>

          {/* 3. Fashion Studio (Tall 1x2) */}
          <div className="md:col-span-1 md:row-span-2 bg-[#FBBF24] rounded-3xl p-8 relative overflow-hidden group">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold tracking-widest text-amber-900 uppercase mb-2">Fashion</div>
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">On-model clothing visuals.</h3>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                  Go live same day
                </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 opacity-90 group-hover:scale-105 transition-transform duration-500">
               <img src="https://images.unsplash.com/photo-1434389678219-16ffb4f63262?auto=format&fit=crop&w=400&q=80" alt="Fashion" className="w-full h-full object-cover rounded-full shadow-2xl" />
            </div>
          </div>

          {/* 4. Ad Generator (Tall 1x2) */}
          <div className="md:col-span-1 md:row-span-2 bg-[#F43F5E] rounded-3xl p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold tracking-widest text-white/80 uppercase mb-2">Intelligence</div>
                <h3 className="text-2xl font-bold text-white leading-tight">Predictive creative analytics.</h3>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                  Stop guessing
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-48 h-48 translate-x-8 translate-y-8">
               <div className="w-full h-full bg-white/20 backdrop-blur-md rounded-2xl rotate-12 border border-white/30 shadow-2xl flex items-center justify-center">
                 <Icon name="bar-chart-2" className="w-16 h-16 text-white" />
               </div>
            </div>
          </div>

          {/* 5. 100+ Templates (Tall 1x2) */}
          <div className="md:col-span-1 md:row-span-2 bg-[#A855F7] rounded-3xl p-8 relative overflow-hidden group">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold tracking-widest text-purple-100 uppercase mb-2">Templates</div>
                <h3 className="text-2xl font-bold text-white leading-tight">100+ High-CTR Presets.</h3>
              </div>
              <div className="mt-4">
                <div className="inline-flex items-center justify-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                  Proven to convert
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-56 h-56">
               <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80" alt="Social" className="w-full h-full object-cover rounded-3xl shadow-2xl -rotate-6 group-hover:rotate-0 transition-transform duration-500 border-4 border-white" />
            </div>
          </div>

          {/* 6. Shopify Analytics (Wide 2x1) */}
          <div className="md:col-span-2 md:row-span-1 bg-[#3B82F6] rounded-3xl p-8 relative overflow-hidden group">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold tracking-widest text-blue-100 uppercase mb-2">Integration</div>
                <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight max-w-[320px]">Upload your Shopify store data.</h3>
              </div>
              <div className="mt-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm hover:scale-105 transition-all"
                >
                  Data Analysis
                </button>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 w-64 h-full hidden sm:block">
               <div className="absolute right-8 top-1/2 -translate-y-1/2 w-40 h-32 bg-white rounded-xl shadow-xl border border-slate-100 p-4 transform group-hover:-translate-y-1/2 group-hover:-translate-x-4 transition-transform duration-500">
                 <div className="w-full h-2 bg-slate-100 rounded-full mb-3"></div>
                 <div className="w-3/4 h-2 bg-slate-100 rounded-full mb-4"></div>
                 <div className="flex items-end gap-2 h-12">
                   <div className="w-1/4 bg-blue-200 h-1/2 rounded-t-sm"></div>
                   <div className="w-1/4 bg-blue-400 h-3/4 rounded-t-sm"></div>
                   <div className="w-1/4 bg-blue-600 h-full rounded-t-sm"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION - MORE FEATURES (HORIZONTAL SCROLL) */}
      <section className="py-24 bg-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            And so much more.
          </h2>
          <p className="text-slate-400 mt-2 text-lg">Everything you need in one powerful platform.</p>
        </div>
        
        <div className="relative w-full overflow-hidden pb-12 pt-4">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-6 px-4">
            {/* Original Set */}
            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#2DD4BF] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Inspiration Feed</h3>
              <p className="text-teal-50 text-sm relative z-10">Curated Pinterest-style feed of top-performing creatives.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                   <Icon name="layout" className="w-12 h-12 text-white" />
                 </div>
              </div>
            </div>

            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#6366F1] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">1-Click Remix</h3>
              <p className="text-indigo-50 text-sm relative z-10">See something you love? Remix it with your product instantly.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-2xl flex items-center justify-center group-hover:rotate-180 transition-transform duration-700">
                   <Icon name="refresh-cw" className="w-12 h-12 text-white" />
                 </div>
              </div>
            </div>

            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#FBBF24] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">Background Remover</h3>
              <p className="text-amber-900 text-sm relative z-10">Pixel-perfect cutouts for any product or lifestyle image.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl flex items-center justify-center group-hover:-translate-y-4 transition-transform duration-500">
                   <Icon name="scissors" className="w-12 h-12 text-slate-900" />
                 </div>
              </div>
            </div>

            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#F43F5E] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Image Restyle</h3>
              <p className="text-rose-50 text-sm relative z-10">AI style transfer to make any raw photo ad-ready in seconds.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 rotate-12">
                   <Icon name="sparkles" className="w-12 h-12 text-white" />
                 </div>
              </div>
            </div>

            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#10B981] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Brand Kit Integration</h3>
              <p className="text-emerald-50 text-sm relative z-10">Automatically apply your brand colors, fonts, and logos.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 -rotate-6">
                   <Icon name="palette" className="w-12 h-12 text-white" />
                 </div>
              </div>
            </div>

            {/* Duplicated Set for Infinite Loop */}
            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#2DD4BF] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Inspiration Feed</h3>
              <p className="text-teal-50 text-sm relative z-10">Curated Pinterest-style feed of top-performing creatives.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                   <Icon name="layout" className="w-12 h-12 text-white" />
                 </div>
              </div>
            </div>

            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#6366F1] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">1-Click Remix</h3>
              <p className="text-indigo-50 text-sm relative z-10">See something you love? Remix it with your product instantly.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-2xl flex items-center justify-center group-hover:rotate-180 transition-transform duration-700">
                   <Icon name="refresh-cw" className="w-12 h-12 text-white" />
                 </div>
              </div>
            </div>

            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#FBBF24] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">Background Remover</h3>
              <p className="text-amber-900 text-sm relative z-10">Pixel-perfect cutouts for any product or lifestyle image.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-2xl flex items-center justify-center group-hover:-translate-y-4 transition-transform duration-500">
                   <Icon name="scissors" className="w-12 h-12 text-slate-900" />
                 </div>
              </div>
            </div>

            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#F43F5E] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Image Restyle</h3>
              <p className="text-rose-50 text-sm relative z-10">AI style transfer to make any raw photo ad-ready in seconds.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 rotate-12">
                   <Icon name="sparkles" className="w-12 h-12 text-white" />
                 </div>
              </div>
            </div>

            <div className="w-[280px] md:w-[320px] h-[400px] bg-[#10B981] rounded-3xl p-8 flex flex-col relative overflow-hidden group shrink-0">
              <h3 className="text-xl font-bold text-white mb-2 relative z-10">Brand Kit Integration</h3>
              <p className="text-emerald-50 text-sm relative z-10">Automatically apply your brand colors, fonts, and logos.</p>
              <div className="mt-auto relative z-10">
                 <div className="w-32 h-32 mx-auto bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 -rotate-6">
                   <Icon name="palette" className="w-12 h-12 text-white" />
                 </div>
              </div>
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
          <div className="bg-[#6366F1] p-8 rounded-3xl relative overflow-hidden group shadow-xl hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Icon name="upload" className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Upload Product</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">Drop your brand assets and product Images.</p>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
          </div>
          
          <div className="bg-[#FBBF24] p-8 rounded-3xl relative overflow-hidden group shadow-xl hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Icon name="magic-wand" className="w-6 h-6 text-slate-900" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900">Select Presets</h3>
            <p className="text-amber-900 text-sm leading-relaxed font-medium">Explore curated presets across 100+ categories.</p>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all"></div>
          </div>
          
          <div className="bg-[#F43F5E] p-8 rounded-3xl relative overflow-hidden group shadow-xl hover:-translate-y-2 transition-all duration-300">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Icon name="image" className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">Configure Settings and generate</h3>
            <p className="text-rose-100 text-sm leading-relaxed">Get high quality product images in minutes.</p>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all"></div>
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
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Join 80+ founders and marketers who have already replaced their expensive creative agencies.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
              <Icon name="quote" className="w-10 h-10 text-[#E6E8FF] absolute top-6 right-6" />
              <div className="flex text-yellow-400 mb-6">
                {[1,2,3,4,5].map(i => <Icon key={i} name="star" className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-lg font-medium text-slate-800 mb-8 leading-relaxed relative z-10">
                "ZeperAi completely transformed our jewelry cataloging. What used to be a week-long photoshoot setup is now a seamless, digital process. The clarity and precision they bring to high-end pieces is a total game-changer for our brand."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/shot-hero-box-reach.png" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Vansh Rastogi</div>
                  <div className="text-sm text-slate-500">Founder of Varan Jewellers</div>
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
                "All my creatives are generated within a few hours using this tool."
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

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-yellow-400 text-slate-900 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[100] animate-bounce"
        >
          <Icon name="arrow-up" className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
