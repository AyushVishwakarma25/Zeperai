import React from 'react';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';

export const AboutUsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C8CEFE]">
      <LandingHeader />
      
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 mb-8">
          About ZeperAi
        </h1>
        
        <div className="prose prose-lg prose-slate max-w-none">
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            We are building the creative engine for the next generation of commerce.
          </p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Our Mission</h2>
          <p>
            At ZeperAi, we believe that high-quality creative assets shouldn't be a bottleneck for growth. 
            For too long, brands have struggled with expensive photoshoots, slow agency turnarounds, and 
            inconsistent brand messaging. We're here to change that.
          </p>
          <p>
            Our mission is to democratize enterprise-grade creative production, giving every brand the power 
            to generate stunning, on-brand assets at the speed of thought.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">The Team</h2>
          <p>
            We are a team of AI researchers, designers, and e-commerce veterans who understand the pain points 
            of modern digital marketing. We've built ZeperAi from the ground up to solve the real problems 
            faced by marketers and founders every day.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Our Technology</h2>
          <p>
            ZeperAi leverages state-of-the-art generative AI models, fine-tuned specifically for commercial 
            photography and marketing copy. Our proprietary Brand Kit technology ensures that every asset 
            generated perfectly aligns with your unique visual identity.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
