import React from 'react';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';
import { SEO } from '../../components/SEO.js';
import { OrganizationSchema } from '../../components/StructuredData.js';
import { Icon } from '../../components/ui/Icon.js';

export const AboutUsPage: React.FC = () => {
  return (
    <>
      <SEO
        title="About Us | The ZeperAI Manifesto"
        description="Built solo. The hard way. Read the founder story, engineering manifesto, and design philosophy behind ZeperAI Studio."
        canonicalUrl="https://zeperai.in/about"
      />
      <OrganizationSchema />
      
      <div className="min-h-screen bg-stone-50/30 text-zinc-900 font-manrope selection:bg-[#C8CEFE]">
        <LandingHeader />

        <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          
          {/* Editorial Masthead / Header */}
          <header className="max-w-4xl mx-auto text-left mb-12 sm:mb-16">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500 font-semibold mb-4">
              <span>ZeperAI Monograph</span>
              <span aria-hidden="true">·</span>
              <span>Issue 01</span>
              <span aria-hidden="true">·</span>
              <span>Founder Dispatch</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal font-lora text-zinc-950 tracking-tight leading-[1.1] mb-6">
              Built solo. The hard way.
            </h1>

            <p className="text-lg sm:text-xl text-stone-600 font-light leading-relaxed max-w-2xl mb-8">
              A candid retrospective on engineering an authentic AI creative engine from scratch — without committee bloat, corporate layers, or empty pitch decks.
            </p>

            {/* Author / Curatorial Byline */}
            <div className="pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500">
              <div className="flex items-center gap-3">
                <img
                  src="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/landing-assets/Ayush%20Vishwakarma%20Founder%20ZeperAi.jpeg"
                  alt="Ayush Vishwakarma"
                  className="w-9 h-9 rounded-full object-cover border border-stone-200 shadow-xs"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
                <div>
                  <div className="font-bold text-zinc-900">Ayush Vishwakarma</div>
                  <div>Founder &amp; Lead Systems Engineer</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-stone-400">
                <span>Lucknow, India</span>
                <span aria-hidden="true">·</span>
                <span>6 Min Read</span>
                <span aria-hidden="true">·</span>
                <span>Verified Dispatch</span>
              </div>
            </div>
          </header>

          {/* Asymmetric Magazine Spread: Main Essay (8 cols) + Curatorial Sidebar (4 cols) */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Longform Editorial Narrative */}
            <article className="lg:col-span-8 max-w-prose space-y-8 text-stone-700 text-base sm:text-lg leading-relaxed">
              
              {/* Opening with Drop Cap */}
              <p className="first-letter:text-6xl first-letter:font-lora first-letter:font-normal first-letter:float-left first-letter:mr-3.5 first-letter:mt-1 first-letter:text-zinc-950 leading-relaxed">
                ZeperAI started because I got tired of watching brands spend absurd amounts of capital on creative production that took weeks to crawl across the finish line.
              </p>

              <p>
                I was running creative campaigns for direct-to-consumer (D2C) and e-commerce brands, and the pattern repeated itself relentlessly: exceptional creative was prohibitively expensive, painfully slow, and near impossible to scale when a campaign found traction.
              </p>

              {/* Chapter I */}
              <div className="pt-6 border-t border-stone-200/80">
                <h2 className="text-xl sm:text-2xl font-normal font-lora text-zinc-950 mb-3 tracking-tight">
                  Chapter I. The Friction in Modern Creative Production
                </h2>
                <p>
                  Every commercial product launch demands a relentless volume of visual assets: studio lifestyle shots, multi-angle packshots, clean isolated cutouts, social hooks, variant tests, and seasonal refresh campaigns. 
                </p>
                <p className="mt-4">
                  Traditional agencies solve this with head-count: seven meetings to review a mood board, three weeks to book studio lights, two weeks to retouch shadows, and an invoice with five zeroes before a single ad dollar is spent. Modern brands cannot afford that cadence.
                </p>
              </div>

              {/* Editorial Pull Quote */}
              <figure className="my-10 py-6 border-y border-stone-200">
                <blockquote className="font-lora italic text-2xl sm:text-3xl text-zinc-950 leading-snug">
                  &ldquo;Not a pretty frontend slapped over an off-the-shelf API — but the actual distributed pipelines underneath.&rdquo;
                </blockquote>
              </figure>

              {/* Chapter II */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-normal font-lora text-zinc-950 mb-3 tracking-tight">
                  Chapter II. Built in Code, Not Slides
                </h2>
                <p>
                  So I opened my IDE and started building the real infrastructure underneath. Model integrations, generation pipelines, prompt logic, image processing pipelines, neural background removal, GPU cluster queues, cloud deployment, ledger-backed credit systems, idempotency keys, and the countless obscure edge cases that no one sees when the software functions cleanly.
                </p>
                <p>
                  A lot of the time it was just me staring at logs at 3 AM wondering why a container decided it didn't want to spin up under sudden load.
                </p>
                <p>
                  The initial intention was modest: construct internal leverage for the brands I was personally partnering with. But then the results spoke louder than expected.
                </p>
                <p>
                  Instead of keeping it as a brittle private script on my MacBook, I formalized it into <strong className="text-zinc-950 font-semibold">ZeperAI Studio</strong> — an authentic, credit-based creative engine purpose-built for D2C brands that execute in real time.
                </p>
              </div>

              {/* Chapter III */}
              <div className="pt-6 border-t border-stone-200/80 space-y-4">
                <h2 className="text-xl sm:text-2xl font-normal font-lora text-zinc-950 mb-3 tracking-tight">
                  Chapter III. The Solo Velocity Advantage
                </h2>
                <p>
                  I build and maintain the entire surface myself: product architecture, frontend interfaces, backend APIs, neural workflows, payment gateways, and client support.
                </p>
                <p>
                  In a SaaS landscape dominated by bloated committees and layered management, building solo creates unmistakable advantages for the brands using ZeperAI:
                </p>

                <div className="space-y-4 pt-2">
                  <div className="p-5 bg-white border border-stone-200/90 rounded-2xl shadow-xs">
                    <h3 className="font-bold text-zinc-950 text-base mb-1">01. Direct Access, Zero Corporate Layers</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      You never talk to an outsourced support ticket handler or a middle manager. When you share feedback or request a bespoke model configuration, you speak directly with the engineer who wrote the code.
                    </p>
                  </div>

                  <div className="p-5 bg-white border border-stone-200/90 rounded-2xl shadow-xs">
                    <h3 className="font-bold text-zinc-950 text-base mb-1">02. Velocity Over Bureaucracy</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      If an operational feature is genuinely valuable for brands, I build it and ship it that evening. No quarterly committee prioritization or delayed roadmap roadmaps.
                    </p>
                  </div>

                  <div className="p-5 bg-white border border-stone-200/90 rounded-2xl shadow-xs">
                    <h3 className="font-bold text-zinc-950 text-base mb-1">03. Total Accountability</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      There is no one else to shift blame to. If an edge case breaks, I own it and resolve it immediately.
                    </p>
                  </div>

                  <div className="p-5 bg-white border border-stone-200/90 rounded-2xl shadow-xs">
                    <h3 className="font-bold text-zinc-950 text-base mb-1">04. Deep Engineering Substance</h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      ZeperAI is engineered from first principles with custom prompt compilers, composition logic, and verified generation models — not an empty rebranding of a single generic endpoint.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chapter IV */}
              <div className="pt-6 border-t border-stone-200/80 space-y-4">
                <h2 className="text-xl sm:text-2xl font-normal font-lora text-zinc-950 mb-3 tracking-tight">
                  Chapter IV. Platform Meets Execution Studio
                </h2>
                <p>
                  ZeperAI Studio is the platform. On the services side, I also operate a dedicated design and performance studio for brands that want end-to-end execution rather than another strategy deck.
                </p>
                <p className="italic text-zinc-900">
                  Brand identities. Production web applications. High-converting creative suites. Video assets. Paid campaign architectures.
                </p>
                <p>
                  The combination is deliberate: software built by someone who runs real campaigns, and agency work powered by custom software built for speed.
                </p>
              </div>

              {/* Chapter V */}
              <div className="pt-6 border-t border-stone-200/80 space-y-4">
                <h2 className="text-xl sm:text-2xl font-normal font-lora text-zinc-950 mb-3 tracking-tight">
                  Chapter V. The Realistic Trade-Off
                </h2>
                <p>
                  I refuse to pretend ZeperAI is a 40-person tech company with a glass tower and an armada of account reps.
                </p>
                <p>
                  I am one founder. Occasionally complex custom builds take an extra cup of coffee. But in exchange, you receive total honesty, zero corporate posturing, and an obsessive focus on creative excellence that actually moves your bottom line.
                </p>
              </div>

            </article>

            {/* Right Column: Curatorial Sidebar & Verified Links */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              
              {/* Founder Profile Card */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
                <div className="relative mb-5">
                  <img
                    src="https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/landing-assets/Ayush%20Vishwakarma%20Founder%20ZeperAi.jpeg"
                    alt="Ayush Vishwakarma | Founder | ZeperAI"
                    className="w-full aspect-square object-cover rounded-2xl border border-stone-200 shadow-xs"
                    referrerPolicy="no-referrer"
                    loading="eager"
                  />
                  <div className="absolute bottom-3 left-3 bg-zinc-950/90 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-zinc-800">
                    Solo Founder &amp; Systems Lead
                  </div>
                </div>

                <div className="space-y-1 mb-5">
                  <h3 className="text-xl font-bold text-zinc-950 font-manrope">Ayush Vishwakarma</h3>
                  <p className="text-xs text-stone-500 font-medium">Founder &amp; Systems Architect</p>
                  <p className="text-xs text-stone-600 pt-1 leading-relaxed">
                    Building AI creative intelligence and high-velocity workflows for brands that demand direct execution.
                  </p>
                </div>

                {/* Verified Professional Links: LinkedIn & Email */}
                <div className="space-y-2.5 pt-4 border-t border-stone-200">
                  <a
                    href="https://www.linkedin.com/in/ayush-vishwakarma/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
                        <Icon name="linkedin" className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900">Founder LinkedIn</span>
                    </div>
                    <Icon name="external-link" className="w-3.5 h-3.5 text-stone-400 group-hover:text-zinc-900 transition-colors" />
                  </a>

                  <a
                    href="https://www.linkedin.com/company/zeperai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#4452FB] text-white flex items-center justify-center shrink-0">
                        <Icon name="linkedin" className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900">ZeperAI Company Page</span>
                    </div>
                    <Icon name="external-link" className="w-3.5 h-3.5 text-stone-400 group-hover:text-zinc-900 transition-colors" />
                  </a>

                  <a
                    href="mailto:team@Zeperai.in"
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200/80 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Icon name="mail" className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-zinc-900">team@Zeperai.in</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#4452FB]">Direct</span>
                  </a>
                </div>
              </div>

              {/* Operating Axioms */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-3.5">
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block">
                  Operating Principles
                </span>
                
                <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
                  <div>
                    <span className="font-bold text-zinc-900 block">01. Substance Over Spectacle</span>
                    Real creative pipelines built for commercial conversion, not generic novelty demos.
                  </div>
                  <div className="pt-2 border-t border-stone-100">
                    <span className="font-bold text-zinc-900 block">02. Frictionless Velocity</span>
                    From raw product photo to live ad variant in minutes instead of fortnights.
                  </div>
                  <div className="pt-2 border-t border-stone-100">
                    <span className="font-bold text-zinc-900 block">03. Unvarnished Craft</span>
                    Code crafted with pride, reviewed by human eyes, and refined with constant user contact.
                  </div>
                </div>
              </div>

              {/* Colophon & Status */}
              <div className="p-4 rounded-2xl bg-stone-100/70 border border-stone-200/70 text-xs text-stone-500 space-y-1">
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="font-semibold text-zinc-900">ZeperAI Studio 4.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Headquarters:</span>
                  <span className="font-semibold text-zinc-900">Lucknow, India</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact:</span>
                  <span className="font-semibold text-[#4452FB]">team@Zeperai.in</span>
                </div>
              </div>

            </aside>
          </div>

          {/* Full-Width Dark Contrast Pull Quote Card (15% Dark Contrast Section) */}
          <div className="mt-20 max-w-5xl mx-auto bg-zinc-950 text-white border border-zinc-800 rounded-3xl p-8 sm:p-14 text-center shadow-xl">
            <span className="text-xs uppercase tracking-widest text-[#939BFB] font-bold mb-4 block">
              The Founder Thesis
            </span>
            <blockquote className="font-lora italic text-2xl sm:text-3xl lg:text-4xl text-zinc-100 leading-snug max-w-3xl mx-auto mb-6">
              &ldquo;One person, a ridiculous amount of code, and an unhealthy obsession with making creative production less painful.&rdquo;
            </blockquote>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
              Ayush Vishwakarma — Founder &amp; Lead Systems Engineer, ZeperAI
            </div>
          </div>

          {/* Direct Dispatch Section */}
          <section className="mt-16 max-w-3xl mx-auto text-center p-8 sm:p-10 bg-white border border-stone-200/90 rounded-3xl shadow-xs">
            <span className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2 block">
              Initiate Contact
            </span>
            <h2 className="text-2xl sm:text-3xl font-normal font-lora text-zinc-950 mb-3">
              Direct line to the builder
            </h2>
            <p className="text-sm sm:text-base text-stone-600 max-w-lg mx-auto mb-6 leading-relaxed">
              Whether you are scaling product catalogs on ZeperAI Studio or commissioning bespoke creative campaigns, send your brief directly.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:team@Zeperai.in"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4452FB] hover:bg-[#3641C9] text-white font-semibold text-sm transition-all shadow-xs"
              >
                <Icon name="mail" className="w-4 h-4" />
                <span>team@Zeperai.in</span>
              </a>

              <a
                href="https://www.linkedin.com/in/ayush-vishwakarma/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-xs"
              >
                <Icon name="linkedin" className="w-4 h-4" />
                <span>Founder on LinkedIn</span>
              </a>

              <a
                href="https://www.linkedin.com/company/zeperai/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-zinc-900 font-semibold text-sm border border-stone-200 transition-all"
              >
                <Icon name="linkedin" className="w-4 h-4" />
                <span>ZeperAI Page</span>
              </a>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
};
