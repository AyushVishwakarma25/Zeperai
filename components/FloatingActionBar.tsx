
import React from 'react';
import { Icon } from './ui/Icon';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

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
  const isOnline = useNetworkStatus();
  const canGenerate = (prompt.trim() !== '' || imagePreviewUrl) && isOnline;

  return (
    <div className={`bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-2 border-2 ${isOnline ? 'border-primary/70' : 'border-gray-300 bg-gray-100'} flex flex-col sm:flex-row sm:items-center gap-2 transition-all duration-300`}>
      
      {/* Input Group */}
      <div className="flex items-center flex-grow gap-2 min-w-0 w-full">
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
          placeholder={isOnline ? "Describe what you want to create..." : "Offline mode"}
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
