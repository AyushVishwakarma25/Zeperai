import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Icon } from '../../components/ui/Icon';
import { useScrollDirection } from '../../hooks/useScrollDirection';

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const isHeaderVisible = useScrollDirection();

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
      {/* HEADER */}
      <header className={`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo variant="full" className="w-24 md:w-40 h-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <a href="/#features" className="hover:text-[#4452FB] transition-colors">Features</a>
            <a href="/#how-it-works" className="hover:text-[#4452FB] transition-colors">How it Works</a>
            <a href="/blog" className="text-[#4452FB] transition-colors">Blog</a>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hidden md:block text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors">Log in</button>
            <button onClick={() => navigate('/login')} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm">Get Access</button>
          </div>
        </div>
      </header>

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
      <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="mb-6 cursor-pointer" onClick={() => navigate('/')}>
              <BrandLogo variant="full" color="white" className="w-32 md:w-40 h-auto" />
            </div>
            <p className="text-sm">Built for creatives, by people who respect your craft.</p>
          </div>
          
          <div className="flex flex-col md:items-center">
            <div className="flex gap-6">
              <a href="/#features" className="hover:text-white transition-colors">Features</a>
              <a href="/blog" className="hover:text-white transition-colors">Blog</a>
            </div>
          </div>
          
          <div className="flex md:justify-end gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
              <Icon name="twitter" className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors">
              <Icon name="linkedin" className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div>© 2026 ZeperAi · <a href="/privacy" className="hover:text-white">Privacy</a> · <a href="/terms" className="hover:text-white">Terms</a></div>
          <div className="font-medium text-slate-500">AI is your partner, not your replacement.</div>
        </div>
      </footer>
    </div>
  );
};
