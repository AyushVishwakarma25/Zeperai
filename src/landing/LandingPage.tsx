import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon.js';
import { LandingHeader } from './LandingHeader.js';
import { Hero } from './components/Hero.js';
import { BrandProofStrip } from './components/BrandProofStrip.js';
import { DashboardSnapshot } from './components/DashboardSnapshot.js';
import { VideoShowcaseSection } from './components/VideoShowcaseSection.js';
import { StatsBand } from './components/StatsBand.js';
import { WorkflowSection } from './components/WorkflowSection.js';
import { WhyZeperAI } from './components/WhyZeperAI.js';
import { RoleUseCases } from './components/RoleUseCases.js';
import { CustomerProofSection } from './components/CustomerProofSection.js';
import { PortfolioShowcase } from './components/PortfolioShowcase.js';
import { FinalCta } from './components/FinalCta.js';
import { FaqSection } from './components/FaqSection.js';
import { Footer } from './Footer.js';
import { SEO } from '../../components/SEO.js';
import { ProductSchema, OrganizationSchema, SoftwareAppSchema, FAQSchema } from '../../components/StructuredData.js';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = useState(false);

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
        title="ZeperAI Studio | AI Ad & Creative Intelligence for Indian D2C"
        description="Turn raw product photos into studio-grade ad variations, multi-angle campaign assets, and social video reels with human approval at every stage. Built for Indian D2C brands."
        canonicalUrl="https://zeperai.in/"
      />
      <ProductSchema />
      <OrganizationSchema />
      <SoftwareAppSchema />
      <FAQSchema />

      <div className="min-h-screen bg-white text-gray-900 font-inter selection:bg-[#4452FB] selection:text-white transition-colors duration-300">
        {/* Global Transparent Sticky Navigation Header */}
        <LandingHeader />

        <main id="main-content" role="main">
          {/* 01 — HERO (DISPLAY HEADLINE + INTERACTIVE MEDIA STRIP) */}
          <Hero />

          {/* 02 — BRAND LOGO WALL */}
          <BrandProofStrip />

          {/* 03 — ACTUAL DASHBOARD SNAPSHOT */}
          <DashboardSnapshot />

          {/* 04 — VIDEO DEMO SHOWCASE (DROP IN READY) */}
          <VideoShowcaseSection />

          {/* 05 — STATS BAND (COMMERCIAL IMPACT IN INR) */}
          <StatsBand />

          {/* 06 — HOW IT WORKS (6-STEP WORKFLOW DEMO) */}
          <WorkflowSection />

          {/* 07 — WHY ZEPERAI (STRATEGIC DIFFERENTIATORS) */}
          <WhyZeperAI />

          {/* 08 — INDUSTRY & ROLE USE-CASE GRID */}
          <RoleUseCases />

          {/* 09 — TESTIMONIALS & REVENUE IMPACT */}
          <CustomerProofSection />

          {/* 10 — PORTFOLIO OUTPUT SHOWCASE */}
          <PortfolioShowcase />

          {/* 11 — FINAL CALL TO ACTION */}
          <FinalCta />

          {/* 12 — FREQUENTLY ASKED QUESTIONS */}
          <FaqSection />
        </main>

        {/* 13 — FOOTER */}
        <Footer />

        {/* Scroll To Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-11 h-11 bg-white border border-gray-200 text-gray-900 hover:text-[#4452FB] rounded-full shadow-md flex items-center justify-center hover:bg-[#EEF0FF] transition-all z-50 focus:outline-none cursor-pointer"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <Icon name="arrow-up" className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );
};
