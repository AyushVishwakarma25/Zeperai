import React from 'react';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';
import { SEO } from '../../components/SEO.js';

export const AboutUsPage: React.FC = () => {
  return (
    <>
      <SEO
        title="About Us | Zeper AI"
        description="Built solo. The hard way. Read the founder note behind ZeperAI Studio and our design + marketing services."
        canonicalUrl="https://zeperai.in/about"
      />
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C8CEFE]">
        <LandingHeader />
        
        <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
              About Zeper AI
            </h1>
            <p className="text-2xl font-bold text-[#4452FB] tracking-tight">
              Built solo. The hard way.
            </p>
          </div>

          <div className="bg-slate-50/70 p-8 sm:p-12 rounded-3xl border border-slate-200/80 space-y-6 text-slate-700 text-base sm:text-lg leading-relaxed shadow-sm">
            <p>
              ZeperAI started because I got tired of watching brands spend stupid amounts of money on creative that took forever to produce.
            </p>
            <p>
              I was running creative campaigns for D2C and e-commerce brands, and the problem was obvious: good creative was expensive, slow, and painfully hard to scale.
            </p>
            <p className="font-semibold text-slate-900">
              So I started building.
            </p>
            <p>
              Not just a pretty frontend with an AI API slapped behind it — the actual shit underneath. Model integrations, generation pipelines, prompt logic, image processing, background removal, GPU infrastructure, cloud deployment, credit systems, queues, APIs, failure handling, and all the weird edge cases that nobody sees when the product works.
            </p>
            <p>
              A lot of the time it was just me staring at logs at 3 AM wondering why some fucking container decided it didn't want to start.
            </p>
            <p>
              The original plan was simple: build internal tooling for the brands I was already working with.
            </p>
            <p className="font-semibold text-slate-900">
              Then it started working.
            </p>
            <p>
              So instead of keeping it as some Frankenstein stack sitting on my laptop, I turned it into ZeperAI Studio — a credit-based AI creative platform built specifically for D2C and e-commerce brands.
            </p>
            <p className="text-slate-800 italic">
              Generate product photography. Build ad creatives. Create social content. Remix ideas. Iterate.
            </p>
            <p className="font-bold text-[#4452FB]">
              Minutes instead of days.
            </p>
            <p>
              And yeah, I'm building the whole thing myself — product, frontend, backend, infrastructure, AI workflows, UX, deployment, debugging, all of it.
            </p>
            <p className="font-semibold text-slate-900">Which means:</p>
            <ul className="list-disc list-inside space-y-2 text-slate-800 pl-2">
              <li><strong className="text-slate-900">No corporate bullshit.</strong> You talk to the person actually building the product.</li>
              <li><strong className="text-slate-900">Fast shipping.</strong> If I think something is useful, I can build it and ship it.</li>
              <li><strong className="text-slate-900">Actual ownership.</strong> If something breaks, there's nobody to blame. It's literally me.</li>
              <li><strong className="text-slate-900">I know what's underneath.</strong> I'm not just prompting an AI and calling it a SaaS.</li>
            </ul>

            <hr className="border-slate-200 my-8" />

            <h2 className="text-2xl font-bold text-slate-900 pt-2">Beyond ZeperAI</h2>
            <p>ZeperAI is the product I'm building.</p>
            <p>
              On the services side, I also run a design + marketing studio for brands that want someone who can actually execute, not just make a strategy deck and disappear.
            </p>
            <p className="text-slate-800 italic">
              Branding. Websites. Graphics. Video. Paid ads. AI creatives. Whatever the campaign needs.
            </p>
            <p>Basically, jack of all trades, but with enough technical knowledge to actually build the shit too.</p>

            <p className="font-semibold text-slate-900">And yeah, there's one obvious downside:</p>
            <p className="text-[#4452FB] font-semibold">I'm one person.</p>
            <p>I'm not going to pretend I'm a 40-person startup with a fancy office and a customer-success department.</p>
            <p>Sometimes things take longer.</p>
            <p>But when you send feedback, it goes straight to me.</p>
            <p>When something breaks, I see it.</p>
            <p>When something is worth building, I build it.</p>

            <div className="p-6 bg-blue-50/80 border border-blue-200 rounded-2xl my-6">
              <p className="font-bold text-[#4452FB] text-lg sm:text-xl">
                That's ZeperAI.
              </p>
              <p className="text-slate-800 mt-1 font-medium">
                One person, a ridiculous amount of code, and an unhealthy obsession with making creative production less painful.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Get in touch</h3>
              <p>
                Whether it's ZeperAI the platform or a studio project — a new brand identity, a website, or a campaign — reach out directly:
              </p>
              <div className="mt-4 space-y-2 font-semibold text-[#4452FB]">
                <p>📧 <a href="mailto:growth@zeperai.com" className="hover:underline">growth@zeperai.com</a></p>
                <p>📷 Instagram: <a href="https://instagram.com/sup_madman" target="_blank" rel="noopener noreferrer" className="hover:underline">@sup_madman</a></p>
              </div>
              <p className="text-slate-500 text-sm mt-4 italic">
                You'll hear back from me, personally.
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};
