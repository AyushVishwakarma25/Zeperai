import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo.js';
import { Icon } from '../../components/ui/Icon.js';
import { useScrollDirection } from '../../hooks/useScrollDirection.js';
import { LandingHeader } from './LandingHeader.js';
import { Footer } from './Footer.js';

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const isHeaderVisible = useScrollDirection();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const posts = [
    {
      title: "How D2C Brands Are Scaling Content with AI",
      excerpt: "Discover how top direct-to-consumer brands are leveraging creative intelligence to produce 10x more assets without increasing their agency budgets.",
      date: "March 15, 2026",
      category: "Case Study",
      image: "https://picsum.photos/seed/blog1/800/400"
    },
    {
      title: "The Future of Product Photography is Generative",
      excerpt: "Why traditional photoshoots are becoming obsolete for e-commerce catalogs, and how generative AI is taking their place.",
      date: "March 2, 2026",
      category: "Industry Trends",
      image: "https://picsum.photos/seed/blog2/800/400"
    },
    {
      title: "Maximizing ROAS with Data-Driven Ad Creatives",
      excerpt: "Stop guessing what works. Learn how to connect your commerce data to your creative process for higher converting Facebook and Instagram ads.",
      date: "February 18, 2026",
      category: "Performance Marketing",
      image: "https://picsum.photos/seed/blog3/800/400"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#4452FB] selection:text-white flex flex-col">
      <LandingHeader />

      {/* CONTENT */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">ZeperAi Blog</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Insights, strategies, and stories about the future of creative intelligence and performance marketing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <article key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col cursor-pointer">
              <div className="h-48 overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4452FB]">{post.category}</span>
                  <span className="text-sm text-slate-500">{post.date}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{post.title}</h2>
                <p className="text-slate-600 mb-6 flex-grow">{post.excerpt}</p>
                <div className="flex items-center text-[#4452FB] font-bold text-sm mt-auto">
                  Read Article <Icon name="arrow-right" className="w-4 h-4 ml-1" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};
