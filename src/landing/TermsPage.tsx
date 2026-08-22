import React, { useEffect } from 'react';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';

export const TermsPage: React.FC = () => {
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
            Terms and Conditions
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4">
            <div>
              <span className="text-slate-400">Effective Date:</span> August 2026
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400">Entity:</span> Falcon Canvas AI (operating as ZeperAI)
            </div>
            <div className="h-3 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400">Contact:</span> +91 7307990640
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
            These Terms and Conditions (&quot;<strong>Terms</strong>&quot;) govern your access to and use of ZeperAI (zeperai.in and related applications), operated by Falcon Canvas AI, a sole proprietorship registered in India, with its registered office in Lucknow, Uttar Pradesh, India (&quot;<strong>ZeperAI</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;, &quot;<strong>our</strong>&quot;). Contact: +91 7307990640.
          </p>

          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-slate-800 font-medium text-xs sm:text-sm">
            By creating an account or using the Services, you agree to these Terms. If you do not agree, please do not use the Services.
          </div>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">1. The Services</h2>
            <p>
              ZeperAI provides AI-powered tools for creating and editing images, including background removal, product photo generation, ad creative generation, and related creative tools (the &quot;<strong>Services</strong>&quot;). Some features are free; others require purchasing credits or a paid plan.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">2. Your Account</h2>
            <p>
              You must provide accurate information when creating an account and are responsible for keeping your login credentials confidential. You are responsible for all activity that happens under your account. You must be at least 18 years old, or have permission from a parent/guardian, to use the Services.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">3. Credits and Payments</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>Certain features consume credits, which are purchased in advance at the prices shown on our Pricing page.</li>
              <li>Payments are processed securely through Razorpay. We do not store your card or payment details.</li>
              <li>Prices are inclusive/exclusive of applicable GST as indicated at checkout.</li>
              <li className="font-semibold text-slate-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60 list-none font-sans text-xs sm:text-sm">
                ⚠️ <strong>Non-Refundable Notice:</strong> All credit purchases are final and non-refundable once credits are added to your account, except where required by applicable law, or where we determine, at our discretion, that a technical error on our part prevented delivery of the output you paid for.
              </li>
              <li>We may change pricing at any time. Changes will not affect credits you have already purchased.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">4. Your Content</h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>You retain ownership of the images and content you upload (&quot;<strong>Your Content</strong>&quot;).</li>
              <li>By uploading Your Content, you grant us a limited license to process it solely to provide you the output you request (e.g. background removal, generated creative).</li>
              <li><strong>We do not use Your Content to train or improve our AI models</strong>, and do not claim ownership over it.</li>
              <li>You are responsible for ensuring you have the necessary rights to upload and use any content you submit, and that it does not infringe any third party&apos;s rights or violate any law.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>Use the Services for any unlawful purpose, or to create content that is illegal, infringing, defamatory, obscene, or harmful</li>
              <li>Upload content depicting or exploiting minors in any inappropriate way</li>
              <li>Attempt to reverse-engineer, scrape, or interfere with the Services or their underlying systems</li>
              <li>Circumvent credit limits, rate limits, or security measures</li>
              <li>Resell or redistribute the Services without our written permission</li>
            </ul>
            <p className="text-xs text-slate-500 italic pt-1">
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">6. Intellectual Property</h2>
            <p>
              The ZeperAI platform, branding, software, and underlying technology are owned by us and protected by applicable intellectual property laws. Nothing in these Terms grants you rights to our trademarks, code, or platform beyond what&apos;s needed to use the Services as intended.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">7. Third-Party Services</h2>
            <p>
              The Services may integrate with or rely on third-party providers (e.g. Google, Razorpay, cloud infrastructure providers). We are not responsible for the availability or performance of these third-party services.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">8. Disclaimers</h2>
            <p>
              The Services are provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee that outputs will be error-free, uninterrupted, or meet your specific expectations. AI-generated outputs may occasionally contain inaccuracies or artifacts.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, our total liability to you for any claim arising from your use of the Services will not exceed the amount you paid us in the 3 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">10. Termination</h2>
            <p>
              You may stop using the Services or delete your account at any time. We may suspend or terminate your access if you violate these Terms, or discontinue the Services (or parts of them) at our discretion, with reasonable notice where practical.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">11. Governing Law and Disputes</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising out of or relating to these Terms will be subject to the exclusive jurisdiction of the courts at Lucknow, Uttar Pradesh, India. We encourage you to first contact us at <a href="mailto:growth@zeperai.in" className="text-[#4452FB] underline font-semibold">growth@zeperai.in</a> to resolve any issue informally.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">12. Changes to these Terms</h2>
            <p>
              We may update these Terms from time to time. If we make material changes, we&apos;ll notify you via email or a notice on the website. Continuing to use the Services after changes take effect means you accept the updated Terms.
            </p>
          </section>

          {/* Section 13 */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">13. Contact Us</h2>
            <p className="font-semibold text-slate-800">Falcon Canvas AI (operating as ZeperAI)</p>
            <p className="text-sm text-slate-600">
              Email:{' '}
              <a href="mailto:growth@zeperai.in" className="text-[#4452FB] font-bold hover:underline">
                growth@zeperai.in
              </a>
            </p>
            <p className="text-sm text-slate-600">
              Registered address: Lucknow, Uttar Pradesh, India
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
