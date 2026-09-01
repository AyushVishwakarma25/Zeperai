import React, { useState } from 'react';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';
import { SEO } from '../../components/SEO.js';
import { LocalSeoAuditProductSchema } from '../../components/StructuredData.js';
import { LocalSeoAuditTool } from '../../components/tools/LocalSeoAuditTool.js';
import { 
  Sparkles, 
  MapPin, 
  Search, 
  Code, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  TrendingUp,
  ShieldCheck,
  Target,
  ArrowRight,
  Zap,
  Star,
  Users
} from 'lucide-react';

interface Props {
  user?: any;
}

export const LocalSeoAuditLandingPage: React.FC<Props> = ({ user }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToTool = () => {
    const el = document.getElementById('local-seo-audit-app');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "How does this tool help my local business rank higher on Google?",
      a: "Google looks for 4 key things to rank a business locally: an optimized Google Business Profile, accurate contact details across the web, high-intent local search keywords, and clean website code (structured schema). Our audit generates all of these for your exact location in under 30 seconds."
    },
    {
      q: "Do I need any coding knowledge to use the results?",
      a: "Not at all! Everything is ready to copy and paste. You can paste the 750-character bio directly into your Google Business Profile, use the keywords on your website, and hand the generated website code (JSON-LD) to your web designer or paste it directly into WordPress, Shopify, or Wix."
    },
    {
      q: "How does the pricing and free trial work?",
      a: "You get 1 full audit report completely free! If you want to run more audits for other locations, client businesses, or track optimization progress over time, you can unlock a 10-report pack for just ₹50 (only ₹5 per report) via secure Razorpay checkout."
    },
    {
      q: "Can marketing agencies use this for client audits?",
      a: "Yes! Agencies and freelancers use this tool to deliver professional local SEO audits and actionable roadmaps to local business clients in minutes. You can export the results directly to clean Markdown or JSON deliverables."
    },
    {
      q: "How quickly will I see ranking results?",
      a: "Most local businesses see measurable ranking and call volume improvements within 2 to 4 weeks after updating their Google Business Profile description, uploading the recommended photos, and adding the website code snippet."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C8CEFE] flex flex-col">
      <SEO 
        title="Local SEO Audit & Google 3-Pack Growth Plan | ZeperAi"
        description="Audit your local business, optimize your Google Business Profile, find high-intent local keywords, and generate ready-to-use website code in seconds."
        canonicalUrl="https://zeperai.in/tools/local-seo-audit"
      />
      <LocalSeoAuditProductSchema />
      <LandingHeader />

      {/* Hero Section with Interactive Tool */}
      <section id="local-seo-tool-section" className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Glow Accent */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#4452FB]/5 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4452FB] text-xs font-bold uppercase tracking-wider mb-5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try 1 Free Audit • 10 Reports for ₹50</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
            Get Found on Google Maps.<br />
            <span className="bg-gradient-to-r from-[#3641C9] via-[#4452FB] to-indigo-500 bg-clip-text text-transparent">
              Turn Nearby Searchers into Customers.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
            Enter your business info to instantly get an optimized Google Profile bio, top 5 local search keywords, ready-to-paste website code, and a 4-week step-by-step ranking roadmap.
          </p>

          {/* Embedded Interactive Tool */}
          <LocalSeoAuditTool user={user} />
        </div>
      </section>

      {/* 3 Core Value Pillars (User Friendly) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-100">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4452FB] mb-2">
            Everything You Need To Rank #1 Locally
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Stop Guessing. Get A Proven Plan for Google Maps.
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Built for local business owners, service professionals, doctors, clinics, and digital marketing agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4452FB] flex items-center justify-center font-black text-base border border-indigo-100 mb-4">
              <Sparkles className="w-5 h-5 text-[#4452FB]" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Google Business Profile Optimization
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Get a compelling, keyword-rich 750-character bio crafted specifically for your services, plus a checklist of photos that boost customer inquiries.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Ready-to-paste 750-char Google bio</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3 high-impact photo suggestions</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Contact info consistency audit</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4452FB] flex items-center justify-center font-black text-base border border-indigo-100 mb-4">
              <Search className="w-5 h-5 text-[#4452FB]" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Top 5 High-Intent Local Keywords
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Uncover the exact search queries nearby customers use when they are ready to book or buy, paired with top local directories to list your business.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>5 geo-targeted buyer keywords</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Top 3 authoritative local directories</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Neighborhood relevance topics</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4452FB] flex items-center justify-center font-black text-base border border-indigo-100 mb-4">
              <Code className="w-5 h-5 text-[#4452FB]" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Ready Website Code & 4-Week Plan
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Copy-paste Google Schema structured code for your website, plus a week-by-week content plan to maintain consistent ranking dominance.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>LocalBusiness website schema code</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>4-week social & blog posting calendar</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3-step immediate action checklist</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Callout Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white text-left relative overflow-hidden shadow-xl border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Transparent Pricing • No Subscriptions</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              1 Free Audit. Then 10 Full Reports for just ₹50.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              No hidden fees, no recurring commitments. Audit any local business or client location for only ₹5 per report.
            </p>
          </div>

          <button
            onClick={scrollToTool}
            className="bg-[#4452FB] hover:bg-[#3641C9] text-white px-6 py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-[#4452FB]/30 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Start Your Free Audit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-left">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4452FB] mb-2">
            Frequently Asked Questions
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Simple Answers to Common Questions
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="border border-slate-200 rounded-xl overflow-hidden transition-all bg-white"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 flex justify-between items-center text-left font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};
