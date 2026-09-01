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
  ArrowRight
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
      q: "What does the ZeperAi Local SEO Audit Engine do?",
      a: "The Local SEO Audit Engine analyzes raw, unstructured business details to extract your primary Google Business Profile (GBP) category, verify NAP (Name, Address, Phone) consistency, uncover 5 geo-modified high-intent keywords, craft an optimized 750-character GBP description, suggest high-value photo uploads, recommend industry directories, and output valid LocalBusiness JSON-LD schema with a 4-week execution calendar."
    },
    {
      q: "How does LocalBusiness JSON-LD schema help my rankings?",
      a: "Google's search crawlers use structured data (JSON-LD) to unambiguously understand your business's physical address, operational coordinates, opening hours, accepted currencies, and service area. Having clean, error-free schema makes your entity eligible for Google Maps rich snippets and localized knowledge panels."
    },
    {
      q: "What is NAP consistency and why is it critical?",
      a: "NAP stands for Name, Address, and Phone number. Search engines compare your NAP across your website, Google Business Profile, Apple Maps, and industry directories. Even slight variations (like 'St.' vs 'Street' or missing phone digits) create entity ambiguity and lower your Google Local 3-Pack rankings."
    },
    {
      q: "Can I use this tool for multiple client locations or agency audits?",
      a: "Yes! ZeperAi's Local SEO Audit micro-SaaS is designed for both local business owners and digital marketing agencies. You can run unlimited audits for any city, neighborhood, or industry niche and export both interactive dashboards and strict Markdown deliverables."
    },
    {
      q: "How fast will I see results in Google Maps / Local Pack?",
      a: "Implementing the technical deliverables (adding the JSON-LD schema to your site header, claiming the recommended citations, and optimizing your GBP description) typically produces measurable ranking and impression improvements within 14 to 30 days as Google re-crawls and recalculates entity confidence."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C8CEFE] flex flex-col">
      <SEO 
        title="Free Local SEO Audit & Strategy Generator | ZeperAi"
        description="Extract local entities, audit NAP consistency, generate 750-char Google Business Profile descriptions, find geo-modified keywords, and build valid LocalBusiness JSON-LD schema."
        canonicalUrl="https://zeperai.in/tools/local-seo-audit"
      />
      <LocalSeoAuditProductSchema />
      <LandingHeader />

      {/* Hero Section with Tool */}
      <section id="local-seo-tool-section" className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Glow Accent */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#4452FB]/5 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4452FB] text-xs font-bold uppercase tracking-wider mb-5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ZeperAi Local SEO Micro-SaaS Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
            Raw Business Info in.<br />
            <span className="bg-gradient-to-r from-[#3641C9] via-[#4452FB] to-indigo-500 bg-clip-text text-transparent">
              Local Pack Dominance out.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
            Extract Google Business Profile entities, verify NAP consistency, uncover high-intent geo keywords, and generate valid <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono text-indigo-700">LocalBusiness</code> JSON-LD schema in seconds.
          </p>

          {/* Embedded Interactive Tool */}
          <LocalSeoAuditTool user={user} />
        </div>
      </section>

      {/* 3-Phase Execution Workflow Breakdown */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-100">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4452FB] mb-2">
            Automated 3-Phase Engine
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How ZeperAi Audits & Optimizes Local Entities
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Built on Google Knowledge Graph entity mapping and modern local search ranking factors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phase 1 */}
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4452FB] flex items-center justify-center font-black text-base border border-indigo-100 mb-4">
              1
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Entity Extraction & Keyword Mapping
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Parses unstructured business text to isolate primary GBP categories, diagnostic NAP data with MISSING alerts, and 5 high-intent geo-modified long-tail keywords.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Primary Category Identification</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>NAP Integrity & Gap Flags</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>5 Geo-Modified Keywords</span>
              </li>
            </ul>
          </div>

          {/* Phase 2 */}
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4452FB] flex items-center justify-center font-black text-base border border-indigo-100 mb-4">
              2
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Tactical Local Audit Engine
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Synthesizes entity signals into a conversion-ready 750-character GBP bio, strategic photo upload checklists, directory citations, and hyper-local neighborhood topics.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>750-Char Keyword-Rich Description</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3 Essential Photo Angles</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Top 3 Industry Directory Citations</span>
              </li>
            </ul>
          </div>

          {/* Phase 3 */}
          <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4452FB] flex items-center justify-center font-black text-base border border-indigo-100 mb-4">
              3
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              Technical Deliverables & Schema
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Generates production-grade assets: valid JSON-LD schema for search crawlers, a 4-week local content calendar, and a 3-step immediate triage fix.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Valid LocalBusiness JSON-LD</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>4-Week Content Execution Table</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3-Step Critical Gap Checklist</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Highlights Bento Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white text-left relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#4452FB]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block mb-2">
              Built For Maximum Local Visibility
            </span>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Rank in the Local 3-Pack and Turn Searchers into Walk-In Clients
            </h3>
            <p className="text-sm text-slate-400 mt-3">
              Over 46% of all Google searches have local intent. Our automated engine generates the technical assets and content roadmap required to outrank competitors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
              <Compass className="w-6 h-6 text-[#4452FB] mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Hyper-Local Relevance</h4>
              <p className="text-xs text-slate-400">Target neighborhoods, sub-localities, and landmark-specific queries.</p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
              <Code className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Rich Schema Markup</h4>
              <p className="text-xs text-slate-400">LocalBusiness JSON-LD ready to embed directly in WordPress, Shopify, or Webflow.</p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
              <ShieldCheck className="w-6 h-6 text-indigo-400 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Citation Integrity</h4>
              <p className="text-xs text-slate-400">Discover top directories to build authoritative, consistent local backlinks.</p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/80">
              <TrendingUp className="w-6 h-6 text-amber-400 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">Actionable Roadmap</h4>
              <p className="text-xs text-slate-400">4-week calendar and immediate 3-step fixes eliminate analysis paralysis.</p>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Ready to generate your personalized Local SEO audit?
            </div>
            <button
              onClick={scrollToTool}
              className="bg-[#4452FB] hover:bg-[#3641C9] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
            >
              <span>Run Free Local Audit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-left">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4452FB] mb-2">
            Frequently Asked Questions
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Everything You Need to Know About Local SEO Audits
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
                className="w-full p-4 sm:p-5 flex justify-between items-center text-left font-bold text-sm text-slate-900 hover:bg-slate-50 transition-colors"
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
