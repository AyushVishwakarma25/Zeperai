
import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { View, InspirationItem } from '../types';
import { inspirationService } from '../services/inspirationService';
import { Spinner } from './ui/Spinner';

interface InspirationPageProps {
  onSetView: (view: View) => void;
  onToggleSidebar: () => void;
  onRemix: (item: InspirationItem) => void;
  items: InspirationItem[];
  isLoaded: boolean;
  onItemsLoaded: (items: InspirationItem[]) => void;
}

const InspirationPage: React.FC<InspirationPageProps> = ({ onSetView, onToggleSidebar, onRemix, items, isLoaded, onItemsLoaded }) => {
  const [loading, setLoading] = useState(!isLoaded);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
      if (isLoaded) {
          setLoading(false);
          return;
      }
      
      const loadInspirations = async () => {
          setLoading(true);
          try {
              const data = await inspirationService.getInspirations();
              onItemsLoaded(data);
          } catch (e) {
              console.error("Failed to load inspirations", e);
          } finally {
              setLoading(false);
          }
      };
      loadInspirations();
  }, [isLoaded, onItemsLoaded]);

  const categories = ['All', ...Array.from(new Set(items.map(img => img.category)))];

  const filteredImages = activeCategory === 'All' 
    ? items 
    : items.filter(img => img.category === activeCategory);

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

  const handleRemixClick = () => {
      if (selectedImageIndex !== null) {
          const item = filteredImages[selectedImageIndex];
          onRemix(item);
          setSelectedImageIndex(null); // Close lightbox
      }
  };

  return (
    <div className="w-full h-full bg-main flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between p-3.5 sm:p-4 md:p-6 border-b border-border-light bg-white/50 backdrop-blur-sm z-10">
        <div className="flex items-center min-w-0 mr-2">
            <button onClick={onToggleSidebar} className="p-1.5 mr-1.5 sm:mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden shrink-0">
                <Icon name="menu" className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-xl mr-2 sm:mr-3 text-primary shrink-0">
                <Icon name="lightbulb" className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary truncate">Inspiration Gallery</h1>
                <p className="text-xs sm:text-sm text-text-secondary truncate">Explore styles and remix them with your products.</p>
            </div>
        </div>
        <Button 
          onClick={() => onSetView(View.Dashboard)} 
          variant="secondary" 
          className="!px-2.5 !py-1.5 sm:!px-3.5 sm:!py-2 !text-xs sm:!text-sm whitespace-nowrap shrink-0 font-medium"
        >
            <Icon name="arrow-left" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
        </Button>
      </header>

      <main className="flex-grow overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {loading ? (
            <div className="flex h-full items-center justify-center">
                <Spinner />
            </div>
        ) : (
            <>
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
                {filteredImages.length === 0 ? (
                    <div className="text-center text-slate-500 mt-12">No inspirations found in this category.</div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {filteredImages.map((img, index) => (
                            <div 
                                key={img.id}
                                onClick={() => setSelectedImageIndex(index)}
                                className="break-inside-avoid relative group cursor-pointer rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gray-200"
                            >
                                <img 
                                    src={img.imageUrl} 
                                    alt={img.title} 
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110 block"
                                />
                                {img.badge && (
                                    <span className={`absolute top-3 left-3 px-2 py-1 text-white text-[10px] font-bold uppercase rounded backdrop-blur-md ${img.badge === 'Community' ? 'bg-blue-600/80' : 'bg-black/60'}`}>
                                        {img.badge}
                                    </span>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-white font-bold">{img.title}</p>
                                            <p className="text-white/80 text-xs">{img.category}</p>
                                        </div>
                                        {img.isRemixable && (
                                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                                <Icon name="swap" className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </>
        )}
      </main>

      {/* Lightbox / Slideshow Carousel */}
      {selectedImageIndex !== null && filteredImages[selectedImageIndex] && (
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
                    src={filteredImages[selectedImageIndex].imageUrl} 
                    alt={filteredImages[selectedImageIndex].title}
                    className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl" 
                  />
                  <div className="mt-6 text-center max-w-lg">
                      <h3 className="text-white text-2xl font-bold mb-1">{filteredImages[selectedImageIndex].title}</h3>
                      <p className="text-white/60 text-sm mb-4">
                          Created with {filteredImages[selectedImageIndex].appMode} Mode
                      </p>
                      
                      {filteredImages[selectedImageIndex].isRemixable && (
                          <Button onClick={handleRemixClick} className="mx-auto shadow-glow-primary !text-base !px-8 !py-3">
                              <Icon name="sparkles" className="w-5 h-5 mr-2" />
                              Remix This Style
                          </Button>
                      )}
                  </div>
              </div>

              {/* Navigation Right */}
              <button 
                onClick={handleNext}
                className="absolute right-4 md:right-8 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors z-50 hover:scale-110"
              >
                  <Icon name="chevron-left" className="w-8 h-8 rotate-180" />
              </button>
          </div>
      )}
    </div>
  );
};

export default InspirationPage;
