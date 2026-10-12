import React, { useState } from 'react';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';
import { Icon } from '../../components/ui/Icon.js';
import { SEO } from '../../components/SEO.js';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-stone-50/30 text-zinc-900 font-manrope selection:bg-[#C8CEFE]">
      <SEO
        title="Contact Us | ZeperAi Studio"
        description="Get in touch with the ZeperAi Studio team — we're here to help with questions about our AI creative platform."
        canonicalUrl="https://zeperai.in/contact"
      />
      <LandingHeader />
      
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest font-semibold text-stone-500 mb-2 block">
            Direct Dispatch
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4 font-manrope">
            Get in touch
          </h1>
          <p className="text-lg text-stone-600 max-w-lg mx-auto">
            Have questions about ZeperAI, enterprise volumes, or studio partnerships? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 mb-6 tracking-tight">Direct Contacts</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white border border-stone-200/90 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <Icon name="mail" className="w-5 h-5 text-zinc-700" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">Email</h3>
                  <p className="text-stone-600 text-sm mt-0.5">
                    <a href="mailto:team@Zeperai.in" className="text-[#4452FB] hover:underline font-medium">
                      team@Zeperai.in
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white border border-stone-200/90 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                  <Icon name="map-pin" className="w-5 h-5 text-zinc-700" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-sm">Headquarters</h3>
                  <p className="text-stone-600 text-sm mt-0.5">Lucknow, Uttar Pradesh, India.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-stone-200/90 shadow-sm">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200/60">
                  <Icon name="check" className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Message Dispatched</h3>
                <p className="text-stone-600 text-sm">Thank you. We read every dispatch and reply within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Name</label>
                  <input type="text" required className="w-full px-4 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-zinc-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#4452FB]/30 focus:border-[#4452FB] outline-none transition-all" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" required className="w-full px-4 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-zinc-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#4452FB]/30 focus:border-[#4452FB] outline-none transition-all" placeholder="you@company.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea required rows={4} className="w-full px-4 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl text-zinc-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#4452FB]/30 focus:border-[#4452FB] outline-none transition-all" placeholder="How can we help?"></textarea>
                </div>
                <button type="submit" className="w-full py-3 px-4 bg-[#4452FB] hover:bg-[#3641C9] text-white font-semibold text-sm rounded-xl transition-colors shadow-xs cursor-pointer">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
