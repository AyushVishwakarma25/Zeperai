import React from 'react';
import { Icon } from './ui/Icon';

interface FloatingActionBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  imagePreviewUrl: string | null;
  onUploadClick: () => void;
  onRemoveImage: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  prompt,
  onPromptChange,
  imagePreviewUrl,
  onUploadClick,
  onRemoveImage,
  onGenerate,
  isGenerating,
}) => {
  const canGenerate = prompt.trim() !== '' || imagePreviewUrl;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-2 flex items-center space-x-2 border-2 border-primary/70">
      {imagePreviewUrl && (
        <div className="relative flex-shrink-0">
          <img src={imagePreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
          <button
            onClick={onRemoveImage}
            className="absolute -top-1.5 -right-1.5 p-1 bg-slate-800 text-white rounded-full transition-transform hover:scale-110"
            aria-label="Remove image"
          >
            <Icon name="close" className="w-3 h-3" />
          </button>
        </div>
      )}
      <button
        onClick={onUploadClick}
        className="p-3 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-primary transition-colors flex-shrink-0"
        title="Upload Image"
      >
        <Icon name="image-plus" className="w-6 h-6" />
      </button>
      <input
        type="text"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Describe what you want to create..."
        className="flex-grow bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-500 text-sm"
      />
      <button
        onClick={onGenerate}
        disabled={!canGenerate || isGenerating}
        className="px-4 py-3 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 group"
      >
        <Icon name="sparkles" className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        <span>Generate</span>
      </button>
    </div>
  );
};