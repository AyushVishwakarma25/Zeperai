import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { useScrollDirection } from '../../hooks/useScrollDirection';

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
      {/* SECTION 1 — FLOATING NAV */}
      <div className={`sticky top-2 md:top-6 z-50 px-4 md:px-[10%] lg:px-[20%] xl:px-[30%] transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-[150%] opacity-0'}`}>
        <nav className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 rounded-full px-4 py-2 md:px-6 md:py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BrandLogo variant="full" color="black" className="w-24 md:w-32 h-auto" />
            </div>
            
            <div className="hidden md:flex space-x-6">
              <a href="#features" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">How It Works</a>
              <Link to="/blog" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Blog</Link>
            </div>

            <button 
              onClick={() => navigate('/login')}
              className="bg-[#4452FB] hover:bg-[#3641C9] text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
            >
              Get Access
            </button>
          </div>
        </nav>
      </div>

      {/* SECTION 2 — HERO */}
      <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#4452FB]/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 bg-[#F3F4FF] border border-[#E6E8FF] text-[#3641C9] px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase mb-8 relative z-10">
          <span className="w-2 h-2 bg-[#4452FB] rounded-full animate-pulse"></span>
          Built for Indian D2C Brands
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight relative z-10">
          Your brand's <em className="not-italic text-[#4452FB] relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-full after:h-1 after:bg-[#4452FB]/30">creative intelligence</em> partner.
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed relative z-10 font-light">
          ZeperAi connects your sales data to generative AI. <strong className="font-bold text-slate-900">Stop guessing what works.</strong> Instantly generate high-converting ad creatives, product visuals, and campaigns that drive real ROAS.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 relative z-10">
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto bg-[#4452FB] hover:bg-[#3641C9] text-white px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-bold transition-all shadow-lg shadow-[#C8CEFE] transform hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            Start Free — No Card Required <Icon name="arrow-right" className="w-5 h-5" />
          </button>
          <a href="#savings" className="w-full sm:w-auto bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-bold transition-all flex items-center justify-center gap-2">
            <Icon name="play" className="w-5 h-5" />
            See the ROI
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16 relative z-10">
          <div className="text-center">
            <div className="text-4xl font-black text-slate-900 tracking-tight">500<span className="text-[#4452FB]">+</span></div>
            <div className="text-sm text-slate-500 font-medium mt-1">Shopify brands</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-slate-200 self-center"></div>
          <div className="text-center">
            <div className="text-4xl font-black text-slate-900 tracking-tight">70<span className="text-[#4452FB]">%</span></div>
            <div className="text-sm text-slate-500 font-medium mt-1">Faster creative output</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-slate-200 self-center"></div>
          <div className="text-center">
            <div className="text-4xl font-black text-slate-900 tracking-tight">90<span className="text-[#4452FB]">%</span></div>
            <div className="text-sm text-slate-500 font-medium mt-1">AI output accuracy</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-slate-200 self-center"></div>
          <div className="text-center">
            <div className="text-4xl font-black text-slate-900 tracking-tight">4.9<span className="text-[#4452FB]">★</span></div>
            <div className="text-sm text-slate-500 font-medium mt-1">Avg. rating</div>
          </div>
        </div>
      </section>

      {/* ACCURACY BANNER */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
        <div className="bg-gradient-to-br from-[#F3F4FF] to-emerald-50 border border-[#E6E8FF] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="text-7xl md:text-8xl font-black text-[#4452FB] tracking-tight leading-none">
            90%
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">AI outputs your team can actually use — first time, every time.</h3>
            <p className="text-slate-600 mb-6 max-w-2xl leading-relaxed">
              ZeperAi achieves <strong className="font-bold text-slate-900">90% output accuracy</strong> across product visuals, ad creatives, and UGC — meaning 9 out of 10 AI-generated assets require zero or minimal edits before approval. Validated across 500+ brands in fashion, skincare, F&B, and home décor.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">Product Intelligence 92%</span>
              <span className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">Ad Generator 89%</span>
              <span className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">AI UGC 88%</span>
              <span className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">Fashion Intelligence 91%</span>
              <span className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">Copy Writer 90%</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — SAVINGS COMPARISON */}
      <section id="savings" className="py-24 bg-slate-50 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[#4452FB] font-bold tracking-widest uppercase text-sm mb-3">The real cost of the old way</div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">How much are you leaving on the table?</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Compare the slow, expensive traditional creative process vs the speed and scale of ZeperAi's creative intelligence.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sector / Use Case</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Traditional Monthly Cost (INR)</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">With ZeperAi</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Efficiency Gained</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time: Before</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time: With ZeperAi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">👗 Fashion / Apparel D2C</div>
                    <div className="text-sm text-slate-500 mt-1">Product shoots, model shoots, catalog images</div>
                  </td>
                  <td className="p-4 text-red-500 font-medium">₹60,000 – ₹1,20,000</td>
                  <td className="p-4 text-[#4452FB] font-bold text-lg">Included</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">Save up to 93%</span></td>
                  <td className="p-4 text-slate-400 line-through">5–10 days/shoot</td>
                  <td className="p-4 font-bold text-slate-900">2 hours</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">💄 Skincare / Beauty D2C</div>
                    <div className="text-sm text-slate-500 mt-1">Product visuals, UGC influencer content, ad creatives</div>
                  </td>
                  <td className="p-4 text-red-500 font-medium">₹40,000 – ₹90,000</td>
                  <td className="p-4 text-[#4452FB] font-bold text-lg">Included</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">Save up to 91%</span></td>
                  <td className="p-4 text-slate-400 line-through">3–7 days</td>
                  <td className="p-4 font-bold text-slate-900">90 mins</td>
                </tr>
                <tr className="bg-[#F3F4FF]/50 hover:bg-[#F3F4FF] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">🏠 Home Décor / Furniture</div>
                    <div className="text-sm text-slate-500 mt-1">Lifestyle staging, background removal, seasonal content</div>
                  </td>
                  <td className="p-4 text-red-500 font-medium">₹35,000 – ₹80,000</td>
                  <td className="p-4 text-[#4452FB] font-bold text-lg">Included</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">Save up to 90%</span></td>
                  <td className="p-4 text-slate-400 line-through">4–8 days</td>
                  <td className="p-4 font-bold text-slate-900">2 hours</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">🍕 F&B / Packaged Foods</div>
                    <div className="text-sm text-slate-500 mt-1">Product photography, festive campaigns, ad copy</div>
                  </td>
                  <td className="p-4 text-red-500 font-medium">₹25,000 – ₹60,000</td>
                  <td className="p-4 text-[#4452FB] font-bold text-lg">Included</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">Save up to 86%</span></td>
                  <td className="p-4 text-slate-400 line-through">2–5 days</td>
                  <td className="p-4 font-bold text-slate-900">60 mins</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">🎒 Accessories / Bags / Footwear</div>
                    <div className="text-sm text-slate-500 mt-1">Catalog shoots, ad creatives, style transfer</div>
                  </td>
                  <td className="p-4 text-red-500 font-medium">₹30,000 – ₹70,000</td>
                  <td className="p-4 text-[#4452FB] font-bold text-lg">Included</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">Save up to 88%</span></td>
                  <td className="p-4 text-slate-400 line-through">3–6 days</td>
                  <td className="p-4 font-bold text-slate-900">90 mins</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">📱 Electronics / Gadgets</div>
                    <div className="text-sm text-slate-500 mt-1">Product visuals, background removal, ad creatives</div>
                  </td>
                  <td className="p-4 text-red-500 font-medium">₹20,000 – ₹50,000</td>
                  <td className="p-4 text-[#4452FB] font-bold text-lg">Included</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">Save up to 83%</span></td>
                  <td className="p-4 text-slate-400 line-through">2–4 days</td>
                  <td className="p-4 font-bold text-slate-900">45 mins</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">🎨 Performance / Ads Agency</div>
                    <div className="text-sm text-slate-500 mt-1">Multi-client ad creative production per month</div>
                  </td>
                  <td className="p-4 text-red-500 font-medium">₹1,50,000 – ₹4,00,000</td>
                  <td className="p-4 text-[#4452FB] font-bold text-lg">Included</td>
                  <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">Save up to 98%</span></td>
                  <td className="p-4 text-slate-400 line-through">Weeks per client</td>
                  <td className="p-4 font-bold text-slate-900">Hours per client</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-slate-500 text-sm mt-6">
            *Traditional costs based on market rates for freelance/studio photography, UGC agencies, and ad design in metro India (Mumbai, Delhi, Bengaluru). Actual savings vary by brand.
          </p>
        </div>
      </section>

      {/* SECTION 4 — HUMAN + AI MANIFESTO */}
      <section className="py-32 bg-slate-900 text-white px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#4452FB] blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 blur-[120px] rounded-full"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-16 leading-tight">
            Stop fighting generic AI. <br className="hidden md:block" />Start scaling your actual brand.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="p-6">
              <div className="text-[#7B86FD] mb-4"><Icon name="lock" className="w-8 h-8 mx-auto" /></div>
              <h3 className="text-2xl font-bold mb-3">Brand-Locked Outputs</h3>
              <p className="text-slate-400">Upload your fonts, colors, and logos once. Every image and ad generated strictly follows your brand guidelines.</p>
            </div>
            <div className="p-6">
              <div className="text-[#7B86FD] mb-4"><Icon name="sliders" className="w-8 h-8 mx-auto" /></div>
              <h3 className="text-2xl font-bold mb-3">Total Creative Control</h3>
              <p className="text-slate-400">You dictate the mood, the lighting, the model ethnicity, and the setting. The AI just executes your vision.</p>
            </div>
            <div className="p-6">
              <div className="text-[#7B86FD] mb-4"><Icon name="zap" className="w-8 h-8 mx-auto" /></div>
              <h3 className="text-2xl font-bold mb-3">Zero Learning Curve</h3>
              <p className="text-slate-400">No complex prompting required. Our interface is built for marketers and founders, not prompt engineers.</p>
            </div>
          </div>
          
          <p className="text-slate-300 font-medium text-xl">
            ZeperAi is the first AI platform built specifically for the workflows of modern D2C brands.
          </p>
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

      {/* SECTION 5.5 — INSPIRATION GALLERY */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">AI Creative Generation for Every Brand Style</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">Generate high-converting product visuals, lifestyle creatives, and ad variations. Just describe your campaign vision — no complex tools needed.</p>
        </div>
        
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
          {[
            { title: "Minimalist Skincare", src: "https://picsum.photos/seed/skincare1/400/600" },
            { title: "Lifestyle Apparel", src: "https://picsum.photos/seed/fashion1/400/300" },
            { title: "Festive Campaign", src: "https://picsum.photos/seed/festive/400/500" },
            { title: "Urban Streetwear", src: "https://picsum.photos/seed/streetwear/400/400" },
            { title: "Home & Living", src: "https://picsum.photos/seed/furniture/400/700" },
            { title: "Food & Beverage", src: "https://picsum.photos/seed/food/400/350" },
            { title: "Cosmetics Campaign", src: "https://picsum.photos/seed/cosmetics/400/650" },
            { title: "Outdoor Gear", src: "https://picsum.photos/seed/outdoor/400/450" },
            { title: "Luxury Watches", src: "https://picsum.photos/seed/watch/400/550" },
            { title: "Fitness & Activewear", src: "https://picsum.photos/seed/fitness/400/300" },
            { title: "Jewelry Close-up", src: "https://picsum.photos/seed/jewelry/400/600" },
            { title: "Footwear Ad", src: "https://picsum.photos/seed/shoes/400/500" },
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
              Shopify Integration
            </div>
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Stop guessing what to promote.</h2>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Connect your Shopify store in one click. ZeperAi analyzes your sales data and tells you exactly which products need new creatives to maximize ROAS.
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
            
            <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 text-lg">
              Connect Shopify <Icon name="arrow-right" className="w-5 h-5" />
            </button>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-5 -left-5 w-12 h-12 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-white shadow-sm">1</div>
            <h3 className="text-xl font-bold mb-3 mt-2">Set your brand rules</h3>
            <p className="text-slate-600">Upload your logo, colors, and fonts once. Every generation automatically follows your brand guidelines.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-5 -left-5 w-12 h-12 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-white shadow-sm">2</div>
            <h3 className="text-xl font-bold mb-3 mt-2">Generate at scale</h3>
            <p className="text-slate-600">Select an objective, upload a raw product image, and let ZeperAi generate dozens of high-converting variations instantly.</p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow">
            <div className="absolute -top-5 -left-5 w-12 h-12 bg-[#4452FB] text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-white shadow-sm">3</div>
            <h3 className="text-xl font-bold mb-3 mt-2">Review and launch</h3>
            <p className="text-slate-600">Pick the winning creatives, generate matching ad copy, and push directly to your ad accounts or Shopify store.</p>
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
                "We used to spend ₹80k a month on creative production and freelance designers. ZeperAi replaced all of that in week one. The ROAS is just ridiculous."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?img=32" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Rahul Sharma</div>
                  <div className="text-sm text-slate-500">Founder, Skincare Brand</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
              <Icon name="quote" className="w-10 h-10 text-[#E6E8FF] absolute top-6 right-6" />
              <div className="flex text-yellow-400 mb-6">
                {[1,2,3,4,5].map(i => <Icon key={i} name="star" className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-lg font-medium text-slate-800 mb-8 leading-relaxed relative z-10">
                "The Shopify integration is a game-changer. It tells me exactly which dead stock needs new creatives to move, and then generates those creatives instantly."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?img=44" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Priya Patel</div>
                  <div className="text-sm text-slate-500">Performance Marketer</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative">
              <Icon name="quote" className="w-10 h-10 text-[#E6E8FF] absolute top-6 right-6" />
              <div className="flex text-yellow-400 mb-6">
                {[1,2,3,4,5].map(i => <Icon key={i} name="star" className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-lg font-medium text-slate-800 mb-8 leading-relaxed relative z-10">
                "We run an agency with 15 D2C clients. ZeperAi allows our small design team to output 10x the volume of ad creatives without sacrificing quality."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                  <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Karan Singh</div>
                  <div className="text-sm text-slate-500">Creative Director, Ad Agency</div>
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
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">Stop guessing what works.<br />Start scaling with intelligence.</h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join 500+ Indian D2C brands using ZeperAi to turn their commerce data into high-converting creative assets instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white text-slate-900 px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-slate-100 transition-colors shadow-xl flex items-center justify-center gap-2"
            >
              Start Free — No Card Required <Icon name="arrow-right" className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto bg-slate-800 text-white px-6 py-3 md:px-8 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-slate-700 transition-colors border border-slate-700 flex items-center justify-center gap-2">
              <Icon name="play-circle" className="w-5 h-5" /> Watch 2-Min Demo
            </button>
          </div>
          <p className="mt-8 text-sm text-slate-400 font-medium">Takes 30 seconds to sign up. Immediate access to all tools.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="mb-6">
              <BrandLogo variant="full" color="white" className="w-32 md:w-40 h-auto" />
            </div>
            <p className="text-sm">Built for creatives, by people who respect your craft.</p>
          </div>
          
          <div className="flex flex-col md:items-center">
            <div className="flex gap-6">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            </div>
          </div>
          
          <div className="flex md:justify-end gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
              <Icon name="twitter" className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
              <Icon name="linkedin" className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div>© 2026 ZeperAi · <Link to="/privacy" className="hover:text-white">Privacy</Link> · <Link to="/terms" className="hover:text-white">Terms</Link></div>
          <div className="font-medium text-slate-500">AI is your partner, not your replacement.</div>
        </div>
      </footer>
    </div>
  );
};
