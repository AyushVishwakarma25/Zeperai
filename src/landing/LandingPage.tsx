import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon.js';
import { BrandLogo } from '../../components/ui/BrandLogo.js';
import { useScrollDirection } from '../../hooks/useScrollDirection.js';
import { LandingHeader } from './LandingHeader.js';
import { ActionCarousel } from './ActionCarousel.js';
import { CreativitySection } from './CreativitySection.js';
import { Footer } from './Footer.js';
import { BeforeAfterSlider } from './BeforeAfterSlider.js';
import { landingAssets } from './landingAssets.js';
import { SEO } from '../../components/SEO.js';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHeaderVisible = useScrollDirection();
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

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
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else if (location.state && (location.state as any).scrollTo) {
      const targetId = (location.state as any).scrollTo;
      const element = document.getElementById(targetId);
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
    <>
    <SEO
        title="ZeperAi Studio | AI Creative Platform for D2C & E-commerce Brands"
        description="Generate on-brand product photos, ads, and social content in seconds with ZeperAi Studio — the AI creative platform built for D2C and e-commerce brands."
        canonicalUrl="https://zeperai.in/"
      />
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
                 10 Credits On Signup <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                 Trusted by D2C Founders <span className="w-1 h-1 bg-white/50 rounded-full"></span>
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
          <div className="inline-flex items-center text-[#3641C9] text-sm font-extrabold tracking-widest uppercase mb-6">
            Built for Indian D2C Brands
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mx-auto leading-[1.1] max-w-5xl relative mb-6">
            <Icon name="sparkles" className="absolute -top-6 -left-8 w-10 h-10 text-yellow-400 hidden md:block" />
            Stop Prompting<br />
            Start Launching
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
              Get Free Credits <Icon name="arrow-right" className="w-5 h-5" />
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
                  src="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/Prustlr%20landing%20page%20image.webp" 
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


      </section>

      {/* STATS CARD BELOW HERO */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
        <div className="bg-gradient-to-br from-[#F3F4FF] via-white to-emerald-50 border border-[#E6E8FF] rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
            
            <div className="text-center md:text-left pt-4 sm:pt-0 sm:px-4 flex flex-col justify-center">
              <div className="text-3xl md:text-4xl font-black text-[#4452FB] tracking-tight leading-none mb-2">
                100+
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide">
                Creatives Generated All Together
              </p>
            </div>

            <div className="text-center md:text-left pt-4 sm:pt-0 sm:px-4 flex flex-col justify-center">
              <div className="text-2xl md:text-3xl font-black text-[#4452FB] tracking-tight leading-none mb-2">
                Nano Banana Pro
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide">
                Powered by Enterprise-Grade AI
              </p>
            </div>

            <div className="text-center md:text-left pt-4 sm:pt-0 sm:px-4 flex flex-col justify-center">
              <div className="text-3xl md:text-4xl font-black text-[#4452FB] tracking-tight leading-none mb-2">
                1.4x ROAS
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide">
                Blended ROAS Lift & 3x Hook-Rate
              </p>
            </div>

            <div className="text-center md:text-left pt-4 sm:pt-0 sm:px-4 flex flex-col justify-center">
              <div className="text-2xl md:text-3xl font-black text-[#4452FB] tracking-tight leading-none mb-2">
                High CTR
              </div>
              <p className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wide">
                Proven Templates Updated Monthly
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 1 — WORKFLOW DEMO */}
      <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center text-[#3641C9] text-xs font-extrabold tracking-widest uppercase mb-4 bg-[#4452FB]/10 px-3 py-1.5 rounded-full">
            How ZeperAI Works
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-slate-900">
            5 steps from product image to live ad
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Zero complex prompting. Just a workflow engineered for e-commerce speed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                  01
                </span>
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon name="upload" className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Upload your product
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Drop images or connect your Shopify store.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                  02
                </span>
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon name="layout" className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Pick your output
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ad creative, product shoot, UGC, fashion, or marketplace listing.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                  03
                </span>
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon name="sparkles" className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Generate & customize
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pick a proven template, brand kit applied automatically.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                  04
                </span>
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon name="edit" className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Edit inline
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Click any element to adjust text, color, or layout.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                  05
                </span>
                <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon name="download" className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                Download & launch
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Export in every size Meta, Instagram, and Amazon need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — CASE STUDIES */}
      <section id="case-studies" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-50/70 rounded-3xl border border-slate-200/70 mb-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center text-[#3641C9] text-xs font-extrabold tracking-widest uppercase mb-4 bg-[#4452FB]/10 px-3 py-1.5 rounded-full">
            Client Success Stories
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-slate-900">
            Real brands. Real creative scale.
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            See how Indian D2C leaders replace agency delays with instant AI generation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          {/* Case Study 1: Varan Jewellers */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between relative">
            <Icon name="quote" className="w-8 h-8 text-[#E6E8FF] absolute top-6 right-6" />
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-[#4452FB] mb-3">
                Varan Jewellers
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-snug mb-4">
                Cataloged 200+ Luxury Pieces with Zero Physical Studio Cost
              </h3>
              
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-[#4452FB]">90% Time Saved</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Time Saved</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-[#4452FB]">200+ SKUs</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Output Metric</div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                "ZeperAi completely transformed our jewelry cataloging. What used to be a week-long photoshoot setup is now a seamless, digital process. The clarity and precision they bring to high-end pieces is a total game-changer for our brand."
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden shrink-0">
                  <img src="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/shot-hero-box-reach.png" alt="Varan Jewellers" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Vansh Rastogi</div>
                  <div className="text-xs text-slate-500">Founder, Varan Jewellers</div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Study 2: Prustlr */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between relative">
            <Icon name="quote" className="w-8 h-8 text-[#E6E8FF] absolute top-6 right-6" />
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-[#4452FB] mb-3">
                Prustlr
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-snug mb-4">
                Generated 50+ High-Converting Ad Variations in a Single Afternoon
              </h3>
              
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-[#4452FB]">85% Faster</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Time Saved</div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-[#4452FB]">50+ Ads</div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Output Metric</div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                "ZeperAI allowed us to test fresh hooks and ad formats continuously without waiting on graphic designers or creator turnarounds. It completely removed our creative bandwidth bottleneck."
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden shrink-0">
                  <img src="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/Prustlr%20landing%20page%20image.webp" alt="Prustlr" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Brand Manager</div>
                  <div className="text-xs text-slate-500">Prustlr</div>
                </div>
              </div>
            </div>
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
                  beforeImage="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/raw%20product.webp"
                  afterImage="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/compare%20after.webp"
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

      {/* SECTION 4 — CREATIVITY SECTION */}
      <CreativitySection />

      {/* SECTION 5.5 — ACTION CAROUSEL */}
      <ActionCarousel />

      {/* SECTION - FEATURES (BENTO GRID) */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">
            Everything you need to scale your creative output.
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. AD STUDIO */}
          <div className="bg-[#6366F1] rounded-3xl p-8 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-bold tracking-widest text-indigo-100 uppercase mb-3">Ad Studio</div>
              <h3 className="text-2xl font-bold text-white leading-tight">AI Ad Creative Studio.</h3>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-bold rounded-lg border border-white/30">
                Professional ad creation in minutes
              </span>
            </div>
          </div>

          {/* 2. PRODUCT */}
          <div className="bg-[#2DD4BF] rounded-3xl p-8 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-bold tracking-widest text-teal-900 uppercase mb-3">Product</div>
              <h3 className="text-2xl font-bold text-teal-950 leading-tight">Professional product visuals instantly.</h3>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-white/30 backdrop-blur-sm text-teal-950 text-sm font-bold rounded-lg border border-white/40">
                Cut shoot costs by 90%
              </span>
            </div>
          </div>

          {/* 3. INFLUENCER */}
          <div className="bg-[#4F46E5] rounded-3xl p-8 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-bold tracking-widest text-indigo-100 uppercase mb-3">Influencer</div>
              <h3 className="text-2xl font-bold text-white leading-tight">Realistic UGC content at scale.</h3>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                No creator fees
              </span>
            </div>
          </div>

          {/* 4. FASHION */}
          <div className="bg-[#FBBF24] rounded-3xl p-8 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-bold tracking-widest text-amber-900 uppercase mb-3">Fashion</div>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">On-model clothing visuals.</h3>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                Go live same day
              </span>
            </div>
          </div>

          {/* 5. INTELLIGENCE */}
          <div className="bg-[#F43F5E] rounded-3xl p-8 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-bold tracking-widest text-rose-100 uppercase mb-3">Intelligence</div>
              <h3 className="text-2xl font-bold text-white leading-tight">Predictive creative analytics.</h3>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                Stop guessing
              </span>
            </div>
          </div>

          {/* 6. TEMPLATES */}
          <div className="bg-[#A855F7] rounded-3xl p-8 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-bold tracking-widest text-purple-100 uppercase mb-3">Templates</div>
              <h3 className="text-2xl font-bold text-white leading-tight">100+ High-CTR Presets.</h3>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                Proven to convert
              </span>
            </div>
          </div>

          {/* 7. INTEGRATION */}
          <div className="bg-[#3B82F6] rounded-3xl p-8 flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="text-xs font-bold tracking-widest text-blue-100 uppercase mb-3">Integration</div>
              <h3 className="text-2xl font-bold text-white leading-tight">Upload your Shopify store data.</h3>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg shadow-sm">
                Data Analysis
              </span>
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
                  <img src="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Landing%20Pgae%20Assets/shot-hero-box-reach.png" alt="User" className="w-full h-full object-cover" />
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

      {/* SECTION 9 — OBJECTION FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center text-[#3641C9] text-xs font-extrabold tracking-widest uppercase mb-4 bg-[#4452FB]/10 px-3 py-1.5 rounded-full">
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight text-slate-900">
            Got questions? We've got answers.
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about scaling your brand with ZeperAI.
          </p>
        </div>

        <div className="space-y-4">
          {/* FAQ 1 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#4452FB]/40">
            <button
              onClick={() => toggleFaq(0)}
              className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-lg md:text-xl text-slate-900 focus:outline-none"
            >
              <span>Will my creatives look AI-generated?</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 transition-transform duration-200 shrink-0 ${openFaqIndex === 0 ? 'rotate-180 bg-[#4452FB]/10 border-[#4452FB]/20' : ''}`}>
                <Icon name="chevron-down" className="w-4 h-4 text-slate-700" />
              </div>
            </button>
            {openFaqIndex === 0 && (
              <div className="px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-base border-t border-slate-200/60 mt-1">
                Brand Kit and curated templates keep output consistent and on-brand, not generic AI-looking.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#4452FB]/40">
            <button
              onClick={() => toggleFaq(1)}
              className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-lg md:text-xl text-slate-900 focus:outline-none"
            >
              <span>Is this just another prompting tool?</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 transition-transform duration-200 shrink-0 ${openFaqIndex === 1 ? 'rotate-180 bg-[#4452FB]/10 border-[#4452FB]/20' : ''}`}>
                <Icon name="chevron-down" className="w-4 h-4 text-slate-700" />
              </div>
            </button>
            {openFaqIndex === 1 && (
              <div className="px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-base border-t border-slate-200/60 mt-1">
                No prompting — pick a template, upload a product, get output.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#4452FB]/40">
            <button
              onClick={() => toggleFaq(2)}
              className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-lg md:text-xl text-slate-900 focus:outline-none"
            >
              <span>Can it use my actual product, not a lookalike?</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 transition-transform duration-200 shrink-0 ${openFaqIndex === 2 ? 'rotate-180 bg-[#4452FB]/10 border-[#4452FB]/20' : ''}`}>
                <Icon name="chevron-down" className="w-4 h-4 text-slate-700" />
              </div>
            </button>
            {openFaqIndex === 2 && (
              <div className="px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-base border-t border-slate-200/60 mt-1">
                Yes — identity-lock keeps the real product and label intact across every frame.
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#4452FB]/40">
            <button
              onClick={() => toggleFaq(3)}
              className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-lg md:text-xl text-slate-900 focus:outline-none"
            >
              <span>Who is this for?</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 transition-transform duration-200 shrink-0 ${openFaqIndex === 3 ? 'rotate-180 bg-[#4452FB]/10 border-[#4452FB]/20' : ''}`}>
                <Icon name="chevron-down" className="w-4 h-4 text-slate-700" />
              </div>
            </button>
            {openFaqIndex === 3 && (
              <div className="px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-base border-t border-slate-200/60 mt-1">
                D2C founders, Shopify stores, and agencies who need volume without a studio.
              </div>
            )}
          </div>

          {/* FAQ 5 */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#4452FB]/40">
            <button
              onClick={() => toggleFaq(4)}
              className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-lg md:text-xl text-slate-900 focus:outline-none"
            >
              <span>How do credits work?</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 transition-transform duration-200 shrink-0 ${openFaqIndex === 4 ? 'rotate-180 bg-[#4452FB]/10 border-[#4452FB]/20' : ''}`}>
                <Icon name="chevron-down" className="w-4 h-4 text-slate-700" />
              </div>
            </button>
            {openFaqIndex === 4 && (
              <div className="px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-base border-t border-slate-200/60 mt-1">
                You get 10 free credits for 7 days on signup to explore our studios. When you're ready to scale, choose Pay As You Go (₹999 for 120 credits that never expire) or Pro Subscriptions (300 credits/mo for ₹1,999) with full commercial usage rights. Credits are spent per generated output image based on the model selected (1 credit for Standard Nano Banana models, 2 credits for flagship Pro photorealism).
              </div>
            )}
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
    </>
  );
};
