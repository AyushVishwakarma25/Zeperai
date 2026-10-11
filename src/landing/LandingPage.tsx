import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  Star, 
  Quote 
} from 'lucide-react';
import { Icon } from '../../components/ui/Icon.js';
import { LandingHeader } from './LandingHeader.js';
import { ActionCarousel } from './ActionCarousel.js';
import { CreativitySection } from './CreativitySection.js';
import { BounceCardsSection } from './BounceCardsSection.js';
import { Footer } from './Footer.js';
import { Hero } from './components/Hero.js';
import { SEO } from '../../components/SEO.js';
import { ProductSchema, OrganizationSchema, SoftwareAppSchema, FAQSchema } from '../../components/StructuredData.js';

interface FeatureCardProps {
  title: string;
  description: string;
  color: string;
  accentColor: string;
  iconName: string;
  thumbnail?: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, color, accentColor, iconName, thumbnail, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 cursor-pointer text-left"
    >
      <div 
        className="h-44 sm:h-48 relative overflow-hidden flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: color }}
      >
        {thumbnail ? (
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={thumbnail} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
          </div>
        ) : (
          <div className="relative w-14 h-14 bg-white rounded-xl shadow-md transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 flex items-center justify-center">
            <div style={{ color: accentColor }}>
              <Icon name={iconName} className="w-7 h-7" />
            </div>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-base font-bold mb-1.5 text-slate-900 group-hover:text-[#4452FB] transition-colors">
          {title}
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-4 flex-grow">
          {description}
        </p>
        <div className="flex items-center justify-end mt-auto pt-2">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#4452FB] transition-all duration-300 shadow-sm">
            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

  const studioFeatures = [
    {
      title: 'Product Studio',
      description: 'Generate clean, high-end product photoshoots with natural lighting and shadows.',
      color: '#EAE3FD',
      accentColor: '#6366F1',
      iconName: 'camera',
      thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/designs/Dashboard%20Thumbnails/Product%20Ad%20Studio%20zeperai.webp',
      onClick: () => navigate('/login')
    },
    {
      title: 'AI UGC Influencer',
      description: 'Create realistic creator and influencer photos showcasing your product.',
      color: '#FCD8FC',
      accentColor: '#EC4899',
      iconName: 'user',
      thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/designs/Dashboard%20Thumbnails/Ai%20UGC%20Influencer%20Zeperai.webp',
      onClick: () => navigate('/login')
    },
    {
      title: 'Fashion Studio',
      description: 'On-model clothing shoots powered by AI. Scale your apparel catalog without agency delays.',
      color: '#B8CF8A',
      accentColor: '#166534',
      iconName: 'shirt',
      thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/designs/Dashboard%20Thumbnails/Fashion%20studio%20Zeperai.webp',
      onClick: () => navigate('/login')
    },
    {
      title: 'Campaign Studio',
      description: 'Full multi-agent creative campaign generator with brand analysis, hooks, and approved steps.',
      color: '#EAE3FD',
      accentColor: '#6A5AE0',
      iconName: 'strategy',
      thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/designs/Dashboard%20Thumbnails/Campaing%20Studio%20Zeperai.webp',
      onClick: () => navigate('/login')
    },
    {
      title: 'Background Remover',
      description: 'Instant, 100% in-browser transparent PNG cutouts for products and models.',
      color: '#FCD8FC',
      accentColor: '#BE185D',
      iconName: 'magic-wand',
      thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/designs/Dashboard%20Thumbnails/background%20remover%20zeperai.webp',
      onClick: () => navigate('/tools/background-remover')
    },
    {
      title: 'Festive Photoshoot',
      description: 'Seasonal props and cultural celebrations. Refresh your product for any holiday.',
      color: '#E1D9CC',
      accentColor: '#B45309',
      iconName: 'lamp',
      thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/designs/Dashboard%20Thumbnails/festive%20shoot%20Zeperai.webp',
      onClick: () => navigate('/login')
    }
  ];

  const faqs = [
    {
      q: 'Will my creatives look like cheap or generic AI?',
      a: 'No. ZeperAi is tuned specifically for commercial product photography and branding. It maintains physical lighting accuracy, surface textures, and real packaging without plastic artifacts.'
    },
    {
      q: 'How does ZeperAi prevent my actual product label and logo from distorting?',
      a: 'Our pipeline isolates your uploaded product and keeps its original packaging, typography, and logos preserved while placing it seamlessly into high-converting scenes.'
    },
    {
      q: 'Do I own commercial rights to the generated creatives?',
      a: 'Yes, you own full commercial rights to all images and creatives you generate on ZeperAi for your store, ads, catalogs, and marketing campaigns.'
    },
    {
      q: 'How do credits work?',
      a: 'You get 10 free credits when you sign up to test out the platform. You can purchase additional credit bundles or subscription tiers anytime with zero lock-in.'
    },
    {
      q: 'Can I remove backgrounds for free?',
      a: 'Yes! Our built-in Background Remover runs right in your browser with unlimited transparent exports for standard resolutions.'
    }
  ];

  return (
    <>
      <SEO
        title="ZeperAi Studio | AI Creative Platform for D2C & E-commerce Brands"
        description="Generate on-brand product photos, ads, and social content in seconds with ZeperAi Studio — the AI creative platform built for D2C and e-commerce brands."
        canonicalUrl="https://zeperai.in/"
      />
      <ProductSchema />
      <OrganizationSchema />
      <SoftwareAppSchema />
      <FAQSchema />

      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#4452FB] selection:text-white">
        
        {/* Floating Header */}
        <LandingHeader />

        <main id="main-content" role="main">
          
          {/* Hero Section */}
          <Hero />

          {/* Value Prop Marquee Ticker directly below Hero */}
          <div className="bg-black text-white py-3 overflow-hidden whitespace-nowrap relative z-20 border-y border-zinc-800">
            <div className="flex animate-marquee gap-8 items-center text-xs md:text-sm font-medium">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-8 items-center">
                  <span className="text-[#818CF8] font-bold">✨ 10 Free Credits on Signup</span>
                  <span className="text-zinc-600">•</span>
                  <span>Transform Phone Photos into High-Converting Studio Ads</span>
                  <span className="text-zinc-600">•</span>
                  <span>No Cameras or Studios Needed</span>
                  <span className="text-zinc-600">•</span>
                  <span>Built for D2C Brands &amp; E-commerce Founders</span>
                  <span className="text-zinc-600">•</span>
                  <span>Commercial Rights Included</span>
                  <span className="text-zinc-600">•</span>
                  <span>Instant 1-Click Background Removal</span>
                  <span className="text-zinc-600">•</span>
                  <span>Studio Quality 4K Ultra-HD Output</span>
                  <span className="text-zinc-600">•</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-100">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4452FB]/10 text-[#4452FB] text-xs font-bold uppercase tracking-widest mb-3">
                <span>Features</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                Everything You Need to Create High-Converting Visuals
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600">
                From standalone packshots to full multi-channel ad campaigns, ZeperAi brings professional creative tools straight to your browser.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {studioFeatures.map((tool) => (
                <FeatureCard 
                  key={tool.title}
                  {...tool}
                />
              ))}
            </div>
          </section>

          {/* Action Carousel with Supabase Landing Page Storage Images */}
          <ActionCarousel />

          {/* Creativity Section */}
          <CreativitySection />

          {/* Bounce Cards Testimonial Section with Interactive Spring Animation */}
          <BounceCardsSection />

          {/* FAQ Accordion */}
          <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-100">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4452FB]/10 text-[#4452FB] text-xs font-bold uppercase tracking-widest mb-3">
                <span>FAQ</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-slate-900 focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200 transition-transform duration-200 shrink-0 ${openFaqIndex === idx ? 'rotate-180 bg-[#4452FB]/10 border-[#4452FB]/30' : ''}`}>
                      <ChevronDown className="w-4 h-4 text-slate-700" />
                    </div>
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-slate-600 leading-relaxed text-sm sm:text-base border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="py-24 bg-slate-950 text-white text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                Ready to Upgrade Your Product Creative?
              </h2>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
                Start generating studio-grade product photos and ads in seconds. 10 free credits included with zero setup.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto bg-[#4452FB] hover:bg-[#3641C9] text-white px-8 py-4 rounded-full font-bold text-base transition-all shadow-lg shadow-[#4452FB]/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Free with 10 Credits</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('features');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border border-white/20 px-7 py-4 rounded-full font-semibold text-base transition-all cursor-pointer"
                >
                  <span>Explore Features</span>
                </button>
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <Footer />

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button 
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-11 h-11 bg-[#4452FB] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] cursor-pointer"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <Icon name="arrow-up" className="w-5 h-5" />
          </button>
        )}
      </div>
    </>
  );
};
