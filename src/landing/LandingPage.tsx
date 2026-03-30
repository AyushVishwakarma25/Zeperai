import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { LandingHeader } from './LandingHeader';
import { FocusScrollSavings } from './FocusScrollSavings';
import { DualTicker } from './DualTicker';
import { Footer } from './Footer';

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
            Generate 100+ Ad Creatives. 10x Faster.
            <Icon name="sparkles" className="absolute -bottom-4 -right-8 w-8 h-8 text-yellow-400 hidden md:block" />
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed relative z-10 font-light">
            Connect your sales data to ZeperAi and instantly generate high-converting product visuals that drive real ROAS.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-[#4452FB] hover:bg-[#3641C9] text-white px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-bold transition-all shadow-lg shadow-[#C8CEFE] transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start Free — No Card Required <Icon name="arrow-right" className="w-5 h-5" />
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
                <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" alt="Placeholder" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-3 md:gap-5 mb-12">
              <div className="w-28 h-36 md:w-40 md:h-48 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80" alt="Placeholder" className="w-full h-full object-cover" />
              </div>
              <div className="w-28 h-36 md:w-40 md:h-48 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src="https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=400&q=80" alt="Placeholder" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Column 3 (Center Large) */}
            <div className="flex flex-col gap-4 z-10">
              <div className="w-44 h-60 md:w-64 md:h-[380px] rounded-2xl bg-[#4452FB] overflow-hidden shadow-2xl ring-4 ring-white relative group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=80" alt="Placeholder" className="w-full h-full object-cover opacity-90 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
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
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" alt="Placeholder" className="w-full h-full object-cover" />
              </div>
              <div className="w-28 h-36 md:w-40 md:h-48 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" alt="Placeholder" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Column 5 */}
            <div className="flex flex-col gap-4 mb-16 hidden md:flex">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-slate-100 overflow-hidden shadow-sm">
                <img src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&q=80" alt="Placeholder" className="w-full h-full object-cover" />
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

      {/* CURIOSITY HOOK */}
      <section className="py-12 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
          You've already seen our ads winning on your feed. <br className="hidden md:block" />
          <span className="text-[#4452FB]">You just didn't know an AI made them.</span>
        </h2>
      </section>

      {/* SECTION 3 — SAVINGS COMPARISON */}
      <FocusScrollSavings />

      {/* SECTION 4 — COMPETITOR REFRAME */}
      <section className="py-32 bg-slate-900 text-white px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4452FB] blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 blur-[120px] rounded-full"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            vs. Traditional Agencies & Studios
          </h2>
          <p className="text-xl text-slate-300 mb-16 max-w-3xl mx-auto">
            They're great for massive brand campaigns. We're purpose-built for rapid, daily performance testing. Get agency-quality output without the ₹1 Lakh+ monthly retainer or the 3-week turnaround time.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="p-6">
              <div className="text-[#7B86FD] mb-4"><Icon name="lock" className="w-8 h-8 mx-auto" /></div>
              <h3 className="text-2xl font-bold mb-3">Stop Guessing, Start Scaling</h3>
              <p className="text-slate-400">ZeperAi analyzes your historical sales data to recommend which products need fresh ad creatives. You stay in control of what gets made.</p>
            </div>
            <div className="p-6">
              <div className="text-[#7B86FD] mb-4"><Icon name="sliders" className="w-8 h-8 mx-auto" /></div>
              <h3 className="text-2xl font-bold mb-3">Studio Quality, Zero Logistics</h3>
              <p className="text-slate-400">Skip the expensive photoshoots. Get photorealistic lifestyle staging for your products in seconds. Works while you focus on strategy.</p>
            </div>
            <div className="p-6">
              <div className="text-[#7B86FD] mb-4"><Icon name="zap" className="w-8 h-8 mx-auto" /></div>
              <h3 className="text-2xl font-bold mb-3">Infinite Variations</h3>
              <p className="text-slate-400">Test different angles, backgrounds, and lighting setups to find the perfect visual for your audience. No prompt engineering needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FEATURE GRID */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Data-driven creatives at scale</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Connect your commerce data to our AI engine and automatically generate the exact assets you need to scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Product Intelligence", desc: "Turn flat product images into high-converting lifestyle creatives in seconds. No production required.", benefit: "Saves ₹40k/campaign", bg: "bg-[#F3F4FF]", icon: "camera", color: "text-[#4452FB]" },
            { title: "AI UGC Influencer", desc: "Generate authentic-looking user generated content with diverse AI models.", benefit: "Zero shipping logistics", bg: "bg-pink-50", icon: "users", color: "text-pink-600" },
            { title: "Fashion Intelligence", desc: "Put your apparel on photorealistic AI models. Choose demographics, styling, and environments.", benefit: "Skip model agency fees", bg: "bg-emerald-50", icon: "shirt", color: "text-emerald-600" },
            { title: "Ad Generator", desc: "Instantly turn your product images into high-converting Facebook and Instagram ad creatives.", benefit: "Launch campaigns faster", bg: "bg-amber-50", icon: "layout-template", color: "text-amber-600" },
            { title: "AI Copywriter", desc: "Write ad copy, product descriptions, and social captions that actually sound like your brand.", benefit: "Never stare at a blank page", bg: "bg-indigo-50", icon: "pen-tool", color: "text-indigo-600" },
            { title: "Magic Eraser", desc: "Remove backgrounds and unwanted objects from your product photos with pixel-perfect accuracy.", benefit: "Perfect for catalog updates", bg: "bg-rose-50", icon: "scissors", color: "text-rose-600" },
            { title: "Image Restyle", desc: "Take an existing photo and completely change the mood, lighting, or season with one click.", benefit: "Reuse old assets", bg: "bg-teal-50", icon: "wand-2", color: "text-teal-600" },
            { title: "Festive Campaigns", desc: "Instantly adapt your product visuals for Diwali, Christmas, or any major sale event.", benefit: "Never miss a trend", bg: "bg-orange-50", icon: "party-popper", color: "text-orange-600" }
          ].map((feature, i) => (
            <div key={i} className={`${feature.bg} p-6 rounded-2xl border border-slate-100/50 hover:shadow-md transition-all flex flex-col h-full`}>
              <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm ${feature.color}`}>
                <Icon name={feature.icon as any} className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-600 text-sm mb-6 flex-grow">{feature.desc}</p>
              <div className="mt-auto pt-4 border-t border-slate-200/60">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Icon name="check-circle-2" className="w-3.5 h-3.5 text-emerald-500" />
                  {feature.benefit}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DUAL TICKER */}
      <DualTicker />

      {/* SECTION 5.5 — INSPIRATION GALLERY */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">AI Creative Generation for Every Brand Style</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">Generate high-converting product visuals, lifestyle creatives, and ad variations. Just describe your campaign vision — no complex tools needed.</p>
        </div>
        
        <div className="columns-1 sm:columns-2 md:columns-3 gap-6">
          {[
            { title: "Sip Herbals Coffee Alternative", src: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&q=80" },
            { title: "Fruit Fusion Canned Drinks", src: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80" },
            { title: "Moon Cheese Snacks", src: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80" },
            { title: "Prustlr Everyday Protein Oats", src: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&q=80" },
            { title: "Holistic Berlin Skincare", src: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80" },
            { title: "Men's Formal Wear", src: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80" },
            { title: "Men's Accessories & Watches", src: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80" },
            { title: "Women's Cosmetics", src: "https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800&q=80" },
            { title: "Biozyme Whey Protein", src: "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800&q=80" },
          ].map((img, i) => (
            <div key={i} className="break-inside-avoid mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <img src={img.src} alt={img.title} className="w-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
              <div className="p-4 text-center bg-white">
                <span className="text-sm font-bold text-slate-800">{img.title}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm">
            Explore More Inspiration
          </button>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-lg border-4 border-white shadow-sm">1</div>
            <h3 className="text-lg font-bold mb-2 mt-2">Connect</h3>
            <p className="text-slate-600 text-sm">Sync your Shopify or product catalog in one click. Up and running in 2 minutes.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-lg border-4 border-white shadow-sm">2</div>
            <h3 className="text-lg font-bold mb-2 mt-2">Analyze</h3>
            <p className="text-slate-600 text-sm">ZeperAi analyzes your sales data to reveal exactly which products need new creatives to scale. You make the call.</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-lg border-4 border-white shadow-sm">3</div>
            <h3 className="text-lg font-bold mb-2 mt-2">Generate</h3>
            <p className="text-slate-600 text-sm">Select a product and generate stunning, on-brand photorealistic lifestyle visuals in batches of 5.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-lg border-4 border-white shadow-sm">4</div>
            <h3 className="text-lg font-bold mb-2 mt-2">Launch</h3>
            <p className="text-slate-600 text-sm">Review your new assets, download the winners, and launch your next high-converting campaign.</p>
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
            (Without hiring a single freelancer or booking a studio).
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
