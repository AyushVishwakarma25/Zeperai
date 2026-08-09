import React, { useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { Footer } from './Footer';

export const CookiePolicyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#4452FB] selection:text-white flex flex-col">
      <LandingHeader />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full">
        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#4452FB] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-4 inline-block">
            Legal Document
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Cookie Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4">
            <div>
              <span className="text-slate-400">Last Updated:</span> August 2026
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400">Entity:</span> Falcon Canvas AI (operating as ZeperAI)
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400">Website:</span> zeperai.in
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
            This Cookie Policy explains how ZeperAI (operated by Falcon Canvas AI, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;) uses cookies and similar technologies on zeperai.in and related applications.
          </p>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">1. What are cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit a website. They help the website function properly, remember your preferences, and — where enabled — understand how visitors use the site.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">2. Cookies we use</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                  <tr>
                    <th className="p-3.5 sm:p-4 w-1/4">Type</th>
                    <th className="p-3.5 sm:p-4 w-1/2">Purpose</th>
                    <th className="p-3.5 sm:p-4">Examples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-semibold text-slate-900">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">
                        Essential
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4">
                      Required for the site and your account to work (login sessions, security, credit balance). These cannot be disabled.
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-500 font-mono text-xs">
                      Supabase auth session cookies
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-semibold text-slate-900">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                        Analytics <span className="text-[10px] text-slate-500 font-normal italic">(coming soon)</span>
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4">
                      Help us understand how visitors use the site so we can improve user experience.
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-500 font-mono text-xs">
                      Google Analytics
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              We currently use only essential cookies. We plan to add analytics cookies (such as Google Analytics) shortly to help us understand site usage — this page will be updated when that happens, and where required by law we will ask for your consent via a cookie banner before any non-essential cookies are set.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">3. Managing cookies</h2>
            <p>
              You can control or delete cookies through your browser settings. Blocking essential cookies may prevent parts of the Services (like staying logged in) from working properly.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">4. Third-party cookies</h2>
            <p>
              Where we use third-party tools like Google Analytics, those providers may set their own cookies subject to their own privacy policies. We do not control these third-party cookies directly.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">5. Changes to this Policy</h2>
            <p>
              We may update this Cookie Policy as we add new tools or as regulations change. Material changes will be reflected on this page.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">6. Contact us</h2>
            <p className="text-sm text-slate-700">
              Questions about our use of cookies? Email us at{' '}
              <a href="mailto:growth@zeperai.in" className="text-[#4452FB] font-bold hover:underline">
                growth@zeperai.in
              </a>.
            </p>
            <p className="text-xs text-slate-500 pt-1">
              Falcon Canvas AI (operating as ZeperAI) &bull; Lucknow, Uttar Pradesh, India
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicyPage;
