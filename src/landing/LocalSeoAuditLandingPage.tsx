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
  ArrowRight, 
  Zap,
  Bookmark,
  ShieldCheck
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
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 font-sans selection:bg-zinc-200 flex flex-col">
      <SEO 
        title="Local SEO Audit & Google 3-Pack Growth Plan | ZeperAi"
        description="Audit your local business, optimize your Google Business Profile, find high-intent local keywords, and generate ready-to-use website code in seconds."
        canonicalUrl="https://zeperai.in/tools/local-seo-audit"
      />
      <LocalSeoAuditProductSchema />
      <LandingHeader />

      {/* Hero Section with Interactive Tool */}
      <section id="local-seo-tool-section" className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative z-10 text-center max-w-4xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-zinc-800 text-xs font-semibold uppercase tracking-wider mb-5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>1 Free Audit • 10 Reports for ₹50</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-950 tracking-tight leading-[1.1] mb-5">
            Rank in Google’s Local 3-Pack.<br />
            Turn Nearby Searches into Paying Clients.
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Audit your local business footprint. Instantly get an optimized Google Profile bio, top 5 local search keywords, ready-to-paste website code, and a 4-week step-by-step ranking roadmap.
          </p>

          {/* Embedded Interactive Tool */}
          <LocalSeoAuditTool user={user} />
        </div>
      </section>

      {/* 3 Core Value Pillars (Using the exact reference card design archetype) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-zinc-200/60">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">
            Proven Local Ranking Framework
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            The Exact Signals Google Evaluates for Local Maps
          </h2>
          <p className="text-sm text-zinc-500 mt-2">
            Built for local service businesses, clinics, retail stores, and digital marketing agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Pillar 1 */}
          <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-950 text-lg shadow-2xs">
                  <Sparkles className="w-5 h-5 text-zinc-900" />
                </div>
                <div className="px-3 py-1 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 bg-white">
                  Pillar 01
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-zinc-900">Google Business</span>
                <span className="text-zinc-400 font-normal">Profile Trust</span>
              </div>

              <h3 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                Google Business Profile Bio & Photos
              </h3>

              <div className="flex flex-wrap gap-1.5 mb-5">
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                  750-Char Copy
                </span>
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                  Photo Angles
                </span>
              </div>

              <ul className="space-y-2 text-xs text-zinc-700 font-medium mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Ready-to-paste 750-character Google description</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>3 high-impact customer photo angle suggestions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>NAP (Name, Address, Phone) consistency checklist</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-950">100% Ready</span>
                <span className="text-2xs text-zinc-400">Copy & Paste</span>
              </div>

              <button
                type="button"
                onClick={scrollToTool}
                className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Audit now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-950 text-lg shadow-2xs">
                  <Search className="w-5 h-5 text-zinc-900" />
                </div>
                <div className="px-3 py-1 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 bg-white">
                  Pillar 02
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-zinc-900">Buyer Queries</span>
                <span className="text-zinc-400 font-normal">Conversion Focus</span>
              </div>

              <h3 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                Top 5 High-Intent Local Keywords
              </h3>

              <div className="flex flex-wrap gap-1.5 mb-5">
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                  5 Target Terms
                </span>
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                  Top Directories
                </span>
              </div>

              <ul className="space-y-2 text-xs text-zinc-700 font-medium mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>5 geo-modified buyer keywords for website & bio</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Top 3 authoritative directories for local backlinks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Specific neighborhood geographic relevance triggers</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-950">5 Keywords</span>
                <span className="text-2xs text-zinc-400">High-Intent Traffic</span>
              </div>

              <button
                type="button"
                onClick={scrollToTool}
                className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Audit now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-[26px] p-6 sm:p-7 border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between text-left">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center font-bold text-zinc-950 text-lg shadow-2xs">
                  <Code className="w-5 h-5 text-zinc-900" />
                </div>
                <div className="px-3 py-1 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 bg-white">
                  Pillar 03
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-zinc-900">Technical SEO</span>
                <span className="text-zinc-400 font-normal">Rich Snippets</span>
              </div>

              <h3 className="text-xl font-bold tracking-tight text-zinc-950 mt-1 mb-3 leading-snug">
                Structured Schema Code & Calendar
              </h3>

              <div className="flex flex-wrap gap-1.5 mb-5">
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                  Valid JSON-LD
                </span>
                <span className="px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                  4-Week Roadmap
                </span>
              </div>

              <ul className="space-y-2 text-xs text-zinc-700 font-medium mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Copy-paste LocalBusiness JSON-LD schema snippet</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>4-week Google update & local posting calendar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>3-step immediate action checklist for fast gains</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-950">Clean Code</span>
                <span className="text-2xs text-zinc-400">Google Verified</span>
              </div>

              <button
                type="button"
                onClick={scrollToTool}
                className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Audit now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Callout Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-zinc-950 rounded-[28px] p-8 sm:p-10 text-white text-left relative overflow-hidden shadow-xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5 fill-current text-zinc-200" />
              <span>Transparent Pricing • No Subscriptions</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              1 Free Audit. Then 10 Full Reports for just ₹50.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
              No hidden fees, no recurring commitments. Audit any local business or client location for only ₹5 per report.
            </p>
          </div>

          <button
            onClick={scrollToTool}
            className="bg-white hover:bg-zinc-100 text-zinc-950 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Start Your Free Audit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-left">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">
            Help & Guidance
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="border border-zinc-200/90 rounded-2xl overflow-hidden transition-all bg-white shadow-2xs"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 flex justify-between items-center text-left font-bold text-sm text-zinc-950 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
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
