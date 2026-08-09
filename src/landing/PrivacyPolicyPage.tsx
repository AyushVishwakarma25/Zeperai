import React, { useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { Footer } from './Footer';

export const PrivacyPolicyPage: React.FC = () => {
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
            Privacy Policy
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
              <span className="text-slate-400">Contact:</span> +91 7307990640
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
          <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
            ZeperAI (&quot;<strong>ZeperAI</strong>&quot;, &quot;<strong>we</strong>&quot;, &quot;<strong>us</strong>&quot;, &quot;<strong>our</strong>&quot;) is operated by Falcon Canvas AI, a sole proprietorship registered in India, with its registered office in Lucknow, Uttar Pradesh, India. ZeperAI provides AI-powered image and creative editing tools, including background removal, product photo generation, ad creative generation, and related services (the &quot;<strong>Services</strong>&quot;), available at zeperai.in and related applications. Contact: +91 7307990640.
          </p>

          <p>
            This Privacy Policy explains what personal data we collect when you use the Services, why we collect it, and the choices you have.
          </p>

          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-slate-800 font-medium text-xs sm:text-sm">
            If you have any questions about this Policy or how we handle your data, contact us at{' '}
            <a href="mailto:growth@zeperai.in" className="text-[#4452FB] font-bold hover:underline">
              growth@zeperai.in
            </a>.
          </div>

          {/* Compliance Badges Banner */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-indigo-50/80 border border-indigo-100 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Global Data Protection & Regulatory Compliance
            </h3>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="px-3 py-1 bg-white border border-indigo-200/80 text-indigo-900 rounded-lg shadow-2xs flex items-center gap-1.5">
                <span className="text-emerald-600 font-extrabold">✓</span> GDPR (EU & UK)
              </span>
              <span className="px-3 py-1 bg-white border border-indigo-200/80 text-indigo-900 rounded-lg shadow-2xs flex items-center gap-1.5">
                <span className="text-emerald-600 font-extrabold">✓</span> CCPA / CPRA (California)
              </span>
              <span className="px-3 py-1 bg-white border border-indigo-200/80 text-indigo-900 rounded-lg shadow-2xs flex items-center gap-1.5">
                <span className="text-emerald-600 font-extrabold">✓</span> LGPD (Brazil)
              </span>
              <span className="px-3 py-1 bg-white border border-indigo-200/80 text-indigo-900 rounded-lg shadow-2xs flex items-center gap-1.5">
                <span className="text-emerald-600 font-extrabold">✓</span> PIPL (China)
              </span>
              <span className="px-3 py-1 bg-white border border-indigo-200/80 text-indigo-900 rounded-lg shadow-2xs flex items-center gap-1.5">
                <span className="text-emerald-600 font-extrabold">✓</span> DPDP Act 2023 (India)
              </span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">1. Who this applies to</h2>
            <p>
              This Policy applies to anyone who visits our website, creates an account, or uses the Services. The Services are not intended for children under 18. If you are under 18, you may only use ZeperAI with the consent and supervision of a parent or guardian.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">2. What personal data we collect</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                  <tr>
                    <th className="p-3.5 sm:p-4 w-1/3">Category</th>
                    <th className="p-3.5 sm:p-4">Examples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-semibold text-slate-900">Account data</td>
                    <td className="p-3.5 sm:p-4">Name, email address, login method (Google/email), password (hashed)</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-semibold text-slate-900">Billing data</td>
                    <td className="p-3.5 sm:p-4">Billing name, GST details (if provided), transaction history. Card/payment details are collected and stored only by our payment processor (Razorpay), never by us.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-semibold text-slate-900">Content you upload</td>
                    <td className="p-3.5 sm:p-4">Images and files you upload to use our editing tools</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-semibold text-slate-900">Usage data</td>
                    <td className="p-3.5 sm:p-4">Pages visited, features used, credits consumed, device/browser type, IP address</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-semibold text-slate-900">Communications</td>
                    <td className="p-3.5 sm:p-4">Messages you send us for support or feedback</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">3. How we use your data</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>Create and manage your account and provide the Services</li>
              <li>Process payments and maintain billing records</li>
              <li>Process the images you upload to deliver the specific edit/output you request</li>
              <li>Respond to support requests</li>
              <li>Maintain the security and proper functioning of the platform</li>
              <li>Send you service-related updates (and marketing emails only if you opt in)</li>
              <li>Comply with legal and tax obligations</li>
            </ul>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 text-xs sm:text-sm font-medium mt-3">
              🛡️ <strong>AI Model Training Guarantee:</strong> We do not use the images you upload to train or improve our AI models. Your uploaded images are processed solely to generate the output you request and are not used for any other purpose.
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">4. How long we keep your data</h2>
            <p>
              We retain account and content data for as long as your account is active. If you delete your account, we delete your uploaded images and generated content within 30 days, except where we are required to retain billing/transaction records for accounting and tax purposes (typically up to 8 years, as required under Indian law).
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">5. Who we share your data with</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>
                <strong>Service providers</strong> who help us operate the platform, such as our cloud hosting provider, database/auth provider (Supabase), and payment processor (Razorpay)
              </li>
              <li>
                <strong>Analytics providers</strong> (e.g. Google Analytics), once enabled — see our <a href="/cookies" className="text-[#4452FB] underline font-semibold">Cookie Policy</a> for details
              </li>
              <li>
                <strong>Legal authorities</strong>, if required by law, court order, or to protect our rights or the safety of our users
              </li>
            </ul>
            <p className="text-xs text-slate-500 italic">
              All third-party providers are only permitted to use your data to provide services to us, not for their own purposes.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">6. Your Rights & Global Compliance Provisions</h2>
            <p>
              ZeperAI complies with major international data privacy regulations. Depending on your jurisdiction, you have specific statutory rights regarding your personal information:
            </p>

            {/* GDPR (EU / UK) */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-[#4452FB] text-xs font-black rounded">GDPR</span>
                European Union (EU) & United Kingdom (UK) Provisions
              </h3>
              <p className="text-xs sm:text-sm text-slate-700">
                Under the General Data Protection Regulation (GDPR), users in the EEA and UK have the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-700">
                <li><strong>Right of Access & Portability:</strong> Request copies of your personal data in a structured, machine-readable format.</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete personal information.</li>
                <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data when no longer needed.</li>
                <li><strong>Right to Restrict or Object:</strong> Limit or object to our processing based on legitimate interests or direct marketing.</li>
                <li><strong>Withdrawal of Consent:</strong> Revoke consent at any time where processing is based on consent.</li>
              </ul>
              <p className="text-xs text-slate-500">
                Legal Basis for Processing: Performance of contract, user consent, compliance with legal obligations, and legitimate operational interests.
              </p>
            </div>

            {/* CCPA / CPRA (California) */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-black rounded">CCPA / CPRA</span>
                California Consumer Privacy Act (California, USA)
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-700">
                <li><strong>Right to Know & Access:</strong> Access categories and specific pieces of personal information collected.</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal information collected from you.</li>
                <li><strong>Right to Correct:</strong> Correct inaccurate personal information.</li>
                <li><strong>No Sale / Sharing of Personal Data:</strong> ZeperAI <strong>does NOT sell or share</strong> your personal data or uploaded images for cross-context behavioral advertising.</li>
                <li><strong>Non-Discrimination:</strong> We will never discriminate or alter service quality for exercising your CCPA rights.</li>
              </ul>
            </div>

            {/* LGPD (Brazil) */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded">LGPD</span>
                Lei Geral de Proteção de Dados (Brazil)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700">
                Brazilian users are guaranteed rights under LGPD, including confirmation of processing, data access, correction of incomplete or outdated data, anonymization/blocking/deletion of unnecessary data, and data portability.
              </p>
            </div>

            {/* PIPL (China) */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-black rounded">PIPL</span>
                Personal Information Protection Law (China)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700">
                For users subject to PIPL, ZeperAI processes personal information on explicit user consent and necessary contract performance. You maintain rights to know, decide, restrict, object, access, copy, and request erasure of your personal information.
              </p>
            </div>

            {/* DPDP Act 2023 (India) */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-900 text-xs font-black rounded">DPDP Act</span>
                Digital Personal Data Protection Act 2023 (India)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700">
                As an entity operating from India, ZeperAI complies with the DPDP Act 2023. Data Principals have rights to access information about processed personal data, seek correction/erasure, register grievances, and nominate another individual in the event of death or incapacity.
              </p>
            </div>

            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-slate-800 font-medium text-xs sm:text-sm">
              <strong>To exercise any privacy rights:</strong> Email our Data Protection team at{' '}
              <a href="mailto:growth@zeperai.in" className="text-[#4452FB] font-bold hover:underline">
                growth@zeperai.in
              </a>. We acknowledge all requests promptly and fulfill statutory obligations within 30 days.
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">7. Data security</h2>
            <p>
              We take reasonable technical and organizational measures to protect your data, including encrypted connections, access controls, and secure third-party infrastructure. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">8. International data transfers</h2>
            <p>
              Some of our service providers (e.g. cloud hosting, AI processing) may store or process data outside India. Where this happens, we take reasonable steps to ensure your data continues to be protected consistent with this Policy.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">9. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you via email or a notice on our website. Continued use of the Services after a change takes effect means you accept the updated Policy.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-2">
            <h2 className="text-lg font-bold text-slate-900">10. Contact us</h2>
            <p className="text-sm text-slate-700 font-semibold">Falcon Canvas AI (operating as ZeperAI)</p>
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

export default PrivacyPolicyPage;
