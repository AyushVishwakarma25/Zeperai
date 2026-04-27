
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './ui/Icon';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { GeneratedImage, AppMode } from '../types';
import { dataURLtoFile } from '../utils/images';

interface FloatingActionBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  imagePreviewUrl: string | null;
  onUploadClick: () => void;
  onRemoveImage: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onImageDrop?: (file: File) => void;
  floatingMode?: AppMode;
  onFloatingModeChange?: (mode: AppMode) => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  prompt,
  onPromptChange,
  imagePreviewUrl,
  onUploadClick,
  onRemoveImage,
  onGenerate,
  isGenerating,
  onImageDrop,
  floatingMode = AppMode.Influencer,
  onFloatingModeChange
}) => {
  const isOnline = useNetworkStatus();
  const [isDragging, setIsDragging] = useState(false);
  
  // Custom Dropdown State
  const [isModeOpen, setIsModeOpen] = useState(false);
  const modeBtnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const canGenerate = (prompt.trim() !== '' || imagePreviewUrl) && isOnline;

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      // Handle file drop
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          if (onImageDrop) onImageDrop(e.dataTransfer.files[0]);
          return;
      }

      // Handle internal GeneratedImage drop
      const data = e.dataTransfer.getData('application/x-krackx-image');
      if (data && onImageDrop) {
          try {
              const image: GeneratedImage = JSON.parse(data);
              const file = dataURLtoFile(image.imageUrl, `ref-${image.id}.png`);
              onImageDrop(file);
          } catch (err) {
              console.error("Failed to process dropped image", err);
          }
      }
  };

  // --- Dropdown Logic ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            isModeOpen &&
            modeBtnRef.current &&
            !modeBtnRef.current.contains(event.target as Node) &&
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
        ) {
            setIsModeOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isModeOpen]);

  const updatePosition = () => {
      if (modeBtnRef.current) {
          const rect = modeBtnRef.current.getBoundingClientRect();
          setDropdownStyle({
              position: 'fixed',
              top: `${rect.bottom + 8}px`,
              left: `${rect.left}px`,
              minWidth: '160px',
              maxWidth: '220px'
          });
      }
  };

  useEffect(() => {
      if (isModeOpen) {
          updatePosition();
          window.addEventListener('scroll', updatePosition, true);
          window.addEventListener('resize', updatePosition);
      }
      return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
      }
  }, [isModeOpen]);

  const getModeLabel = (mode: AppMode) => {
      switch (mode) {
          case AppMode.AdCreative: return 'Ad Creative';
          case AppMode.Product: return 'Product';
          case AppMode.Fashion: return 'Fashion';
          case AppMode.Influencer: return 'AI UGC Influencer';
          default: return mode;
      }
  };

  const ModeDropdown = () => createPortal(
      <div 
        ref={dropdownRef}
        className="fixed z-[120] bg-white/95 border border-slate-200 rounded-xl shadow-xl backdrop-blur-md p-1.5 flex flex-col gap-1 animate-fade-in-scale-up origin-top-left"
        style={dropdownStyle}
      >
          {[
              { value: AppMode.Influencer, label: 'AI UGC Influencer' },
              { value: AppMode.Product, label: 'Product' },
              { value: AppMode.Fashion, label: 'Fashion' },
              { value: AppMode.AdCreative, label: 'Ad Creative' }
          ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                    if (onFloatingModeChange) onFloatingModeChange(opt.value);
                    setIsModeOpen(false);
                }}
                className={`px-3 py-2 text-sm text-left rounded-lg transition-all flex items-center justify-between ${
                    floatingMode === opt.value 
                    ? 'bg-primary text-white font-semibold shadow-md' 
                    : 'text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                  <span>{opt.label}</span>
                  {floatingMode === opt.value && <Icon name="check-circle" className="w-3.5 h-3.5" />}
              </button>
          ))}
      </div>,
      document.body
  );

  return (
    <div 
        className={`rounded-2xl shadow-2xl p-2 border-2 flex flex-col sm:flex-row sm:items-center gap-2 transition-all duration-300 ${
            isOnline 
            ? (isDragging ? 'border-primary bg-primary/10' : 'border-primary/70 bg-white/80 backdrop-blur-md') 
            : 'border-gray-300 bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      
      {/* Input Group */}
      <div className="flex items-center flex-grow gap-2 min-w-0 w-full">
        {onFloatingModeChange && (
            <div className="relative">
                <button
                    ref={modeBtnRef}
                    onClick={() => setIsModeOpen(!isModeOpen)}
                    disabled={!isOnline}
                    className={`flex items-center pl-3 pr-2 py-2 text-xs font-bold uppercase cursor-pointer rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        isModeOpen ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5 text-primary'
                    }`}
                >
                    <span className="mr-1">{getModeLabel(floatingMode || AppMode.Influencer)}</span>
                    <Icon name="chevron-down" className={`w-3 h-3 transition-transform duration-200 ${isModeOpen ? 'rotate-180' : ''}`} />
                </button>
                {isModeOpen && <ModeDropdown />}
            </div>
        )}

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {imagePreviewUrl && (
          <div className="relative flex-shrink-0">
            <img src={imagePreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
            <button
              onClick={onRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-slate-800 text-white rounded-full transition-transform hover:scale-110 border border-white shadow-sm"
              aria-label="Remove image"
            >
              <Icon name="close" className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <button
          onClick={isOnline ? onUploadClick : undefined}
          disabled={!isOnline}
          className={`p-3 rounded-lg text-slate-500 transition-colors flex-shrink-0 ${isOnline ? 'hover:bg-slate-100 hover:text-primary' : 'opacity-50 cursor-not-allowed'}`}
          title="Upload Image"
        >
          <Icon name="image-plus" className="w-6 h-6" />
        </button>
        
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={isOnline ? (isDragging ? "Drop image to start..." : "Describe what you want to create...") : "Offline mode"}
          disabled={!isOnline}
          className="flex-grow bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-500 text-sm min-w-0 w-full disabled:cursor-not-allowed"
        />
      </div>

      {/* Action Button */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 flex-shrink-0 group w-full sm:w-auto shadow-md ${
            !isOnline 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : 'bg-gradient-to-r from-primary to-purple-500 text-white focus:ring-primary hover:shadow-lg disabled:opacity-50'
        }`}
      >
        <Icon name="sparkles" className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        <span>{isOnline ? 'Generate' : 'Offline'}</span>
      </button>
    </div>
  );
};
