import React from 'react';
import { useNavigate } from 'react-router-dom';
import { landingAssets } from '../landingAssets.js';

interface BlogPost {
  id: string;
  date: string;
  readTime: string;
  title: string;
  image: string;
  slug: string;
}

const POSTS: BlogPost[] = [
  {
    id: '1',
    date: 'SEP 26, 2024',
    readTime: '3 MIN READ',
    title: 'Why High-Converting D2C Brands Are Retiring Traditional Physical Shoots',
    image: landingAssets.productStudio,
    slug: '/blog',
  },
  {
    id: '2',
    date: 'OCT 02, 2024',
    readTime: '4 MIN READ',
    title: "The Worst Creative Advice Modern E-Commerce Founders Receive",
    image: landingAssets.aiInfluencer,
    slug: '/blog',
  },
  {
    id: '3',
    date: 'OCT 05, 2024',
    readTime: '5 MIN READ',
    title: '5 Principles Of Geometry-Locked Product Photography That Actually Scale',
    image: landingAssets.watch,
    slug: '/blog',
  },
];

export const BlogResourcesSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto border-t border-[#E8E8E5] font-sans">
      
      {/* Centered Header with Pill Eyebrow (matching bottom-right in screenshot) */}
      <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#0B0B0F] text-[#0B0B0F] font-mono text-[10px] font-bold tracking-widest uppercase mb-4">
          OUR BLOGS
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl lg:text-[56px] font-normal text-[#0B0B0F] tracking-tight leading-[1.08]">
          The latest from our blog
        </h2>
      </div>

      {/* 3 Articles Grid (matching screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12 sm:mb-16">
        {POSTS.map((post) => (
          <div
            key={post.id}
            onClick={() => navigate(post.slug)}
            className="group cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Card Image */}
              <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#F7F7F5] border border-[#E8E8E5] mb-5 relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
              </div>

              {/* Date & Read Time */}
              <div className="font-mono text-[11px] font-bold text-[#6B6B73] tracking-wider uppercase mb-2.5">
                {post.date} · {post.readTime}
              </div>

              {/* Article Title */}
              <h3 className="font-satoshi font-bold text-lg sm:text-xl text-[#0B0B0F] group-hover:text-[#3155FF] transition-colors leading-snug">
                {post.title}
              </h3>
            </div>

            {/* Read Story Link */}
            <div className="pt-4 mt-4 flex items-center gap-1.5 text-xs font-satoshi font-bold text-[#0B0B0F] group-hover:text-[#3155FF] transition-colors">
              <span>Read Story</span>
              <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* Centered Pill Button: See All Blogs (matching screenshot) */}
      <div className="text-center">
        <button
          onClick={() => navigate('/blog')}
          className="h-11 px-8 rounded-full bg-[#0B0B0F] hover:bg-[#1A1A22] text-white font-satoshi font-medium text-xs sm:text-sm transition-all active:scale-[0.98] shadow-xs cursor-pointer inline-flex items-center justify-center"
        >
          See All Blogs
        </button>
      </div>

    </section>
  );
};
