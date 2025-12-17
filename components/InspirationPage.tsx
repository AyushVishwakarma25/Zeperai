
import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { View } from '../types';

interface InspirationImage {
  id: string;
  src: string;
  category: string;
  title: string;
}

// Verified, high-quality Unsplash images
const INSPIRATION_IMAGES: InspirationImage[] = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    category: 'Skincare',
    title: 'Minimalist Serum'
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    category: 'Creative',
    title: 'Abstract Fluid'
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    category: 'Fashion',
    title: 'Urban Chic'
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    category: 'Product',
    title: 'Premium Audio'
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    category: 'Product',
    title: 'Smart Watch'
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
    category: 'Home Decor',
    title: 'Modern Living'
  },
  {
    id: '7',
    src: 'https://images.unsplash.com/photo-1529139574466-a302d20525b2?auto=format&fit=crop&w=800&q=80',
    category: 'Fashion',
    title: 'Editorial'
  },
  {
    id: '8',
    src: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    category: 'Beverage',
    title: 'Refreshment'
  },
  {
    id: '9',
    src: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80',
    category: 'Skincare',
    title: 'Organic Oil'
  },
  {
    id: '10',
    src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    category: 'Product',
    title: 'Sportswear'
  },
  {
    id: '11',
    src: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
    category: 'Creative',
    title: 'Neon Vibes'
  },
  {
    id: '12',
    src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    category: 'Home Decor',
    title: 'Minimal Chair'
  },
];

interface InspirationPageProps {
  onSetView: (view: View) => void;
  onToggleSidebar: () => void;
}

const InspirationPage: React.FC<InspirationPageProps> = ({ onSetView, onToggleSidebar }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(INSPIRATION_IMAGES.map(img => img.category)))];

  const filteredImages = activeCategory === 'All' 
    ? INSPIRATION_IMAGES 
    : INSPIRATION_IMAGES.filter(img => img.category === activeCategory);

  const handleNext = useCallback(() => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0));
  }, [selectedImageIndex, filteredImages.length]);

  const handlePrev = useCallback(() => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1));
  }, [selectedImageIndex, filteredImages.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectedImageIndex === null) return;
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Escape') setSelectedImageIndex(null);
  }, [selectedImageIndex, handleNext, handlePrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full bg-main flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-border-light bg-white/50 backdrop-blur-sm z-10">
        <div className="flex items-center">
            <button onClick={onToggleSidebar} className="p-2 mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
                <Icon name="menu" className="w-6 h-6" />
            </button>
            <div className="p-2 bg-purple-100 rounded-xl mr-3 text-primary">
                <Icon name="lightbulb" className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-text-primary">Inspiration Gallery</h1>
                <p className="text-sm text-text-secondary">Explore trending styles and creative concepts.</p>
            </div>
        </div>
        <Button onClick={() => onSetView(View.Dashboard)} variant="secondary" className="hidden sm:flex">
            <Icon name="arrow-left" className="w-4 h-4 mr-2" />
            Back to Dashboard
        </Button>
      </header>

      <main className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeCategory === cat 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                        : 'bg-white text-text-secondary hover:bg-gray-100 border border-border-light'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Masonry Grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredImages.map((img, index) => (
                <div 
                    key={img.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className="break-inside-avoid relative group cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gray-200"
                >
                    <img 
                        src={img.src} 
                        alt={img.title} 
                        loading="lazy"
                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110 block"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-white font-bold">{img.title}</p>
                        <p className="text-white/80 text-xs">{img.category}</p>
                    </div>
                </div>
            ))}
        </div>
      </main>

      {/* Lightbox / Slideshow Carousel */}
      {selectedImageIndex !== null && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center animate-fade-in-scale-up">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedImageIndex(null)}
                className="absolute top-6 right-6 p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors z-50"
              >
                  <Icon name="close" className="w-8 h-8" />
              </button>

              {/* Navigation Left */}
              <button 
                onClick={handlePrev}
                className="absolute left-4 md:left-8 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors z-50 hover:scale-110"
              >
                  <Icon name="chevron-left" className="w-8 h-8" />
              </button>

              {/* Main Image */}
              <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center">
                  <img 
                    src={filteredImages[selectedImageIndex].src} 
                    alt={filteredImages[selectedImageIndex].title}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
                  />
                  <div className="mt-4 text-center">
                      <h3 className="text-white text-xl font-bold">{filteredImages[selectedImageIndex].title}</h3>
                      <p className="text-white/60 text-sm">{filteredImages[selectedImageIndex].category}</p>
                  </div>
              </div>

              {/* Navigation Right */}
              <button 
                onClick={handleNext}
                className="absolute right-4 md:right-8 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors z-50 hover:scale-110"
              >
                  <Icon name="chevron-left" className="w-8 h-8 rotate-180" />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                  {filteredImages.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === selectedImageIndex ? 'bg-white w-4' : 'bg-white/30 hover:bg-white/60'}`}
                      />
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default InspirationPage;
