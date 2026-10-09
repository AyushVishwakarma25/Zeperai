import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'What is ZeperAI Studio and how is it different from generic AI tools?',
    a: 'ZeperAI Studio is designed specifically for e-commerce and D2C brands. Unlike generic image tools that hallucinate logos and warp packaging, ZeperAI preserves 100% of your real product geometry and label typography, while rendering high-converting studio lighting presets in seconds.',
  },
  {
    q: 'How does the human-approval gate workflow work?',
    a: 'Before rendering final high-resolution assets, you review drafted visual angles, creative hooks, and scene compositions. You can approve or adjust any concept with a single click, ensuring zero brand drift or wasted credits.',
  },
  {
    q: 'How does ZeperAI guarantee 100% geometry and label accuracy?',
    a: 'Our packaging preservation locks the physical silhouette, text, and details of your source photo. When applying studio softbox lighting, real shadows, and lifestyle environments, your actual product is never distorted.',
  },
  {
    q: 'Do I own full commercial rights to all generated creatives?',
    a: 'Yes, completely. Every image, video loop, and campaign asset generated belongs 100% to your brand with unrestricted commercial rights for Meta ads, Instagram, Amazon A+ pages, and website catalogs.',
  },
  {
    q: 'How do credits work and do they expire?',
    a: 'One credit renders one high-resolution commercial asset variation. On Pay As You Go packs, your credits never expire. On Pro and Agency plans, fresh credits are added each billing cycle, and additional packs can be topped up anytime in Indian Rupees (INR).',
  },
  {
    q: 'Can I connect my Shopify store URL directly?',
    a: 'Yes. Simply input your store URL, and our system will ingest your visual palette, product geometries, and high-CTR competitor angles with zero manual configuration required.',
  },
  {
    q: 'What aspect ratios and export formats are supported?',
    a: 'ZeperAI Studio exports production-ready Ultra HD files formatted natively for e-commerce: 1:1 square packshots (Amazon/PDP), 4:5 vertical feed creatives (Meta/Instagram), and 9:16 full-screen mobile stories and reels.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-[1360px] mx-auto font-inter">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* Left Column: Heading - Poppins, No Eyebrow */}
        <div className="lg:col-span-5 text-left">
          <h2 className="font-poppins text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1]">
            Frequently Asked <br />
            <span className="text-[#4452FB]">Questions</span>
          </h2>

          <p className="font-inter text-base text-gray-600 mt-4 leading-relaxed max-w-md">
            Everything you need to know about geometry protection, commercial rights, multi-format export, and billing in INR.
          </p>

          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
            <p className="font-poppins font-bold text-base text-gray-900">
              Need a custom or agency volume plan?
            </p>
            <p className="font-inter text-xs text-gray-600 mt-1 mb-4">
              We work directly with fast-scaling Indian D2C brands and performance marketing agencies.
            </p>
            <a
              href="mailto:support@zeperai.in"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#4452FB] hover:text-[#3442E8] transition-colors"
            >
              <span>Talk to our team →</span>
            </a>
          </div>
        </div>

        {/* Right Column: Accordion */}
        <div className="lg:col-span-7 space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className={`bg-white border rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-200 ${
                  isOpen
                    ? 'border-[#4452FB] shadow-sm bg-[#EEF0FF]/20'
                    : 'border-gray-200 hover:border-gray-300 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-poppins font-bold text-base sm:text-lg text-gray-900 hover:text-[#4452FB] transition-colors cursor-pointer"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-[#4452FB] text-white rotate-180'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-gray-600 font-inter text-sm sm:text-[15px] leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
