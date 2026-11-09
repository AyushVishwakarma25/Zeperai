import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BACKGROUND_REMOVER_NICHES, 
  ALL_NICHE_SLUGS,
  BackgroundRemoverNiche 
} from '../data/backgroundRemoverNiches.js';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';
import { SEO } from '../../components/SEO.js';
import { NicheBackgroundRemoverTool } from './components/NicheBackgroundRemoverTool.js';
import { 
  CheckCircle2, 
  ChevronDown, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  HelpCircle,
  FileCheck2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

interface Props {
  user?: any;
  onDeductCredits?: (cost: number) => boolean;
  onRefundCredits?: (cost: number) => void;
  // Optional pre-selected slug for SSR prerendering without useParams hook
  forcedSlug?: string;
}

export const NicheBackgroundRemoverPage: React.FC<Props> = ({ 
  user,
  onDeductCredits, 
  onRefundCredits,
  forcedSlug 
}) => {
  const params = useParams<{ slug: string }>();
  const navigate = useNavigate();
  let rawSlug = forcedSlug || params.slug || 'amazon-india-products';
  if (rawSlug.startsWith('remove-background-for-')) {
    rawSlug = rawSlug.replace(/^remove-background-for-/, '');
  }
  const niche: BackgroundRemoverNiche = BACKGROUND_REMOVER_NICHES[rawSlug] || BACKGROUND_REMOVER_NICHES['amazon-india-products'];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const canonicalUrl = `https://www.zeperai.in/tools/remove-background-for-${niche.slug}`;

  // JSON-LD Schemas
  const softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': `${niche.shortTitle} - ZeperAI`,
    'url': canonicalUrl,
    'description': niche.metaDescription,
    'applicationCategory': 'MultimediaApplication',
    'operatingSystem': 'All (Web Browser, WebAssembly)',
    'browserRequirements': 'Requires JavaScript and WebAssembly support',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'INR',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'ratingCount': '1420',
      'bestRating': '5',
      'worstRating': '1',
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://www.zeperai.in/',
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Background Remover',
        'item': 'https://www.zeperai.in/tools/background-remover',
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': niche.shortTitle,
        'item': canonicalUrl,
      },
    ],
  };

  const faqPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': niche.faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  };

  // Curate related niches
  const relatedNiches = (niche.relatedSlugs || [])
    .map(s => BACKGROUND_REMOVER_NICHES[s])
    .filter(Boolean)
    .slice(0, 4);

  // If less than 4, fill with top categories
  const fallbackSlugs = ['amazon-india-products', 'blinkit-zepto-products', 'flipkart-meesho-sellers', 'jewellery-and-diamonds'];
  const displayRelated = relatedNiches.length >= 3 
    ? relatedNiches 
    : fallbackSlugs
        .filter(s => s !== niche.slug)
        .map(s => BACKGROUND_REMOVER_NICHES[s])
        .filter(Boolean)
        .slice(0, 4);

  return (
    <>
      <SEO
        title={niche.metaTitle}
        description={niche.metaDescription}
        canonicalUrl={canonicalUrl}
        schema={[softwareAppSchema, breadcrumbSchema, faqPageSchema]}
      />

      <div className="min-h-screen bg-white text-zinc-900 font-manrope selection:bg-zinc-900 selection:text-white">
        <LandingHeader />

        <main className="w-full">
          
          {/* HERO SECTION WITH WEBASSEMBLY TOOL */}
          <section className="pt-28 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            
            {/* Breadcrumb nav */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                <li>
                  <Link to="/" className="hover:text-zinc-900 transition-colors">Home</Link>
                </li>
                <li>/</li>
                <li>
                  <Link to="/tools/background-remover" className="hover:text-zinc-900 transition-colors">Tools</Link>
                </li>
                <li>/</li>
                <li className="text-zinc-900 font-semibold truncate max-w-[200px] sm:max-w-none">
                  {niche.shortTitle}
                </li>
              </ol>
            </nav>

            {/* Header copy */}
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-zinc-900 border border-stone-200 text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{niche.badge}</span>
              </div>

              <h1 className="font-lora text-3xl sm:text-5xl lg:text-6xl font-bold text-zinc-950 tracking-tight leading-[1.15] mb-4">
                {niche.heroHeadline}
              </h1>

              <p className="text-base sm:text-xl text-stone-600 font-normal leading-relaxed">
                {niche.heroSubheadline}
              </p>
            </div>

            {/* The Free In-Browser WebAssembly Tool */}
            <NicheBackgroundRemoverTool
              nicheName={niche.name}
              marketplaceBadge={niche.badge}
              user={user}
              onDeductCredits={onDeductCredits}
              onRefundCredits={onRefundCredits}
            />

          </section>


          {/* TECHNICAL SPECIFICATIONS MATRIX */}
          <section className="py-12 sm:py-16 bg-stone-50/60 border-y border-stone-200 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
                <span className="text-xs uppercase font-extrabold tracking-widest text-stone-500">2026 Standards</span>
                <h2 className="text-2xl sm:text-3xl font-bold font-lora text-zinc-950 mt-1">
                  {niche.marketplace} Image Specifications
                </h2>
                <p className="text-sm text-stone-600 mt-2">
                  Official catalog compliance requirements to prevent automated listing suppression.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Resolution</span>
                  <div className="text-base font-bold text-zinc-900 mt-1">{niche.specs.recommendedResolution}</div>
                  <p className="text-xs text-stone-500 mt-1.5">Enables automated 3x hover zoom on desktop</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Aspect Ratio</span>
                  <div className="text-base font-bold text-zinc-900 mt-1">{niche.specs.aspectRatio}</div>
                  <p className="text-xs text-stone-500 mt-1.5">Standardized catalog grid layout</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Background Standard</span>
                  <div className="text-base font-bold text-emerald-700 mt-1">RGB (255, 255, 255) / Hex #FFFFFF</div>
                  <p className="text-xs text-stone-500 mt-1.5">True 100% pure white perimeter mandatory</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Frame Occupancy</span>
                  <div className="text-base font-bold text-zinc-900 mt-1">{niche.specs.frameOccupancy}</div>
                  <p className="text-xs text-stone-500 mt-1.5">Prevents small product display on mobile</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Accepted Formats</span>
                  <div className="text-base font-bold text-zinc-900 mt-1">{niche.specs.allowedFormats}</div>
                  <p className="text-xs text-stone-500 mt-1.5">sRGB / 8-bit color depth</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Max File Size</span>
                  <div className="text-base font-bold text-zinc-900 mt-1">{niche.specs.maxFileSize}</div>
                  <p className="text-xs text-stone-500 mt-1.5">Fast CDN loading on mobile apps</p>
                </div>
              </div>
            </div>
          </section>


          {/* 600-WORD SELLER COMPLIANCE GUIDE */}
          <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-10 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-xs font-bold uppercase tracking-wider mb-3">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Seller Masterclass</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-lora text-zinc-950 tracking-tight">
                {niche.name}: 2026 Image Guidelines &amp; Compliance Guide
              </h2>
              <p className="text-stone-600 mt-3 text-base sm:text-lg font-light leading-relaxed">
                {niche.guideOverview}
              </p>
            </div>

            {/* Guide Body */}
            <div className="space-y-10 text-stone-700 leading-relaxed text-sm sm:text-base">
              {niche.guideSections.map((sec, idx) => (
                <div key={idx} className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold font-lora text-zinc-900">
                    {sec.heading}
                  </h3>
                  <p className="leading-relaxed">
                    {sec.content}
                  </p>

                  {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                    <ul className="space-y-2.5 pt-2">
                      {sec.bulletPoints.map((bp, bidx) => (
                        <li key={bidx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                          <span className="text-stone-800">{bp}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {/* Rejection Checklist Callout Box */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2.5 text-rose-900 font-bold text-base sm:text-lg font-lora">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Top 5 Reasons {niche.marketplace} Rejects Product Photos</span>
                </div>
                <p className="text-xs sm:text-sm text-rose-800">
                  Avoid these common mistakes to prevent automated catalog deactivation and listing suppression:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {niche.rejectionChecklist.map((item, cidx) => (
                    <div key={cidx} className="flex items-start gap-2 text-xs sm:text-sm text-rose-900 font-medium">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>


          {/* 1-CLICK STUDIO UPSELL INTERSTITIAL BANNER */}
          <section className="py-14 sm:py-16 bg-zinc-950 text-white px-4 sm:px-6 lg:px-8 border-t border-zinc-900">
            <div className="max-w-4xl mx-auto text-center space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Level Creative Platform</span>
              </div>
              <h2 className="font-lora text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Turn your clean {niche.name.toLowerCase()} cutout into a luxury commercial ad
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-normal">
                Don't settle for flat white packshots for your social media ads, banners, and secondary gallery photos. Place your cutout onto marble pedestals, festive Diwali sets, or professional model hands in 1 click.
              </p>
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/login?returnTo=/dashboard')}
                  className="w-full sm:w-auto bg-[#4452FB] hover:bg-[#3641C9] active:scale-98 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Free with 10 Credits</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('faq');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer"
                >
                  <span>View Guidelines FAQ</span>
                </button>
              </div>
            </div>
          </section>


          {/* FREQUENTLY ASKED QUESTIONS */}
          <section id="faq" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-stone-200">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-zinc-900 border border-stone-200 text-xs font-bold uppercase tracking-wider mb-3">
                <HelpCircle className="w-3.5 h-3.5 text-stone-700" />
                <span>FAQ</span>
              </div>
              <h2 className="font-lora text-2xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
                Frequently Asked Questions about {niche.shortTitle}
              </h2>
            </div>

            <div className="space-y-3.5">
              {niche.faqs.map((faq, idx) => (
                <div 
                  key={idx}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-sm sm:text-base text-zinc-900 focus:outline-none cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-stone-50 border border-stone-200 transition-transform duration-200 shrink-0 ${openFaqIndex === idx ? 'rotate-180 bg-stone-100' : ''}`}>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-700" />
                    </div>
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-stone-100 font-normal">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>


          {/* CROSS-NICHE DISCOVERY HUB (Internal SEO Link Equity) */}
          <section className="py-14 sm:py-16 bg-stone-50/70 border-t border-stone-200 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-stone-500">Explore Catalog Hubs</span>
                  <h3 className="text-xl sm:text-2xl font-bold font-lora text-zinc-950 mt-1">
                    Related Indian E-Commerce Background Cutout Tools
                  </h3>
                </div>
                <Link 
                  to="/tools/background-remover"
                  className="text-xs font-bold text-[#4452FB] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>View All Tools Hub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayRelated.map((rn) => (
                  <Link
                    key={rn.slug}
                    to={`/tools/remove-background-for-${rn.slug}`}
                    className="group bg-white p-5 rounded-2xl border border-stone-200 hover:border-zinc-900 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        {rn.category}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 group-hover:text-zinc-950 transition-colors mt-2 mb-1.5 font-manrope">
                        {rn.shortTitle}
                      </h4>
                      <p className="text-xs text-stone-500 line-clamp-2">
                        {rn.metaDescription}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-zinc-900 group-hover:text-[#4452FB]">
                      <span>Clean Photos →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
};

export default NicheBackgroundRemoverPage;
