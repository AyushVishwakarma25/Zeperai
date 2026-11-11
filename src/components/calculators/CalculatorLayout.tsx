import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calculator, HelpCircle, ShieldCheck } from 'lucide-react';
import { LandingHeader } from '../../landing/LandingHeader.js';
import { Footer } from '../../landing/Footer.js';
import { SEO } from '../../../components/SEO.js';
import { StudioHandoffCard } from './StudioHandoffCard.js';

export interface FAQItem {
  question: string;
  answer: string;
}

interface CalculatorLayoutProps {
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  toolName: string;
  badgeText: string;
  headline: string;
  subtitle: string;
  children: React.ReactNode;
  studioHandoff: {
    title: string;
    description: string;
    ctaText: string;
    studioMode: 'product' | 'influencer' | 'ugc' | 'batch';
  };
  faqs?: FAQItem[];
  guideContent?: React.ReactNode;
}

export const CalculatorLayout: React.FC<CalculatorLayoutProps> = ({
  seoTitle,
  seoDescription,
  canonicalPath,
  toolName,
  badgeText,
  headline,
  subtitle,
  children,
  studioHandoff,
  faqs,
  guideContent,
}) => {
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: toolName,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
        },
        description: seoDescription,
      },
      ...(faqs && faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonicalPath}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <LandingHeader />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 flex-wrap font-medium">
          <Link to="/" className="hover:text-emerald-700 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link to="/tools" className="hover:text-emerald-700 transition">
            Free E-Commerce Tools
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">{toolName}</span>
        </nav>

        {/* Page Header */}
        <header className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
            <Calculator className="w-3.5 h-3.5 text-emerald-700" />
            <span>{badgeText}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
            {headline}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Free Client-Side Calculator</span>
            </div>
            <div className="hidden sm:inline-block text-slate-300">•</div>
            <div>Updated for 2026 Indian GST & Marketplace Norms</div>
            <div className="hidden sm:inline-block text-slate-300">•</div>
            <div>Zero Registration Required</div>
          </div>
        </header>

        {/* Interactive Calculator Body (Inputs + Outputs) */}
        <div className="mb-16">{children}</div>

        {/* Conversion Layer: ZeperAI Studio Contextual CTA */}
        <div className="mb-16">
          <StudioHandoffCard
            title={studioHandoff.title}
            description={studioHandoff.description}
            ctaText={studioHandoff.ctaText}
            studioMode={studioHandoff.studioMode}
          />
        </div>

        {/* Educational Guide */}
        {guideContent && (
          <section className="mb-16 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">
              Complete Seller & Marketer Blueprint
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
              {guideContent}
            </div>
          </section>
        )}

        {/* FAQ Accordion Section */}
        {faqs && faqs.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-2xl font-extrabold text-slate-900">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-100/60 transition"
                    >
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {faq.question}
                      </span>
                      <span
                        className={`text-emerald-700 text-lg transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      >
                        ↓
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
