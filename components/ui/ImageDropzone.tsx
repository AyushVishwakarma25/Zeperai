
import React, { useState } from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface ImageDropzoneProps {
  id: string;
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
  onFilesChange?: (files: File[]) => void; // New for bulk
  multiple?: boolean;
  prompt?: string;
  className?: string;
  isLoading?: boolean;
  onRemoveBackground?: () => void; // NEW: Fast-pass background removal
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ 
    id, previewUrl, onFileChange, onFilesChange, multiple, prompt = 'Click to upload or drag & drop', 
    className, isLoading = false, onRemoveBackground 
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple && onFilesChange) {
        onFilesChange(Array.from(e.dataTransfer.files));
      } else {
        onFileChange(e.dataTransfer.files[0]);
      }
      return;
    }

    const internalImageData = e.dataTransfer.getData('application/x-krackx-image');
    if (internalImageData) {
        try {
            const imageObj = JSON.parse(internalImageData);
            const dropEvent = new CustomEvent('krackx-internal-image-drop', {
                detail: { id, image: imageObj },
                bubbles: true
            });
            e.currentTarget.dispatchEvent(dropEvent);
        } catch (err) {
            console.error("Failed to parse dropped image data", err);
        }
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (multiple && onFilesChange) {
        onFilesChange(Array.from(e.target.files));
      } else {
        onFileChange(e.target.files[0]);
      }
    }
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onFileChange(null);
  }

  const baseClasses = 'relative w-full h-full min-h-[10rem] bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-text-secondary transition-colors duration-200';
  const draggingClasses = 'border-primary bg-primary/10 text-primary';
  const hoverClasses = 'hover:border-primary hover:text-primary';

  return (
    <div className={`h-full ${className || ''}`}>
      <input 
        id={id} 
        type="file" 
        className="hidden" 
        accept="image/*" 
        multiple={multiple}
        onChange={handleInputChange} 
      />
      <label
        htmlFor={id}
        className={`${baseClasses} ${isDraggingOver ? draggingClasses : hoverClasses} ${isLoading ? 'cursor-default' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center">
            <Spinner />
            <span className="text-sm font-semibold mt-2">Processing image...</span>
          </div>
        ) : previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-1" />
            <div className="absolute top-1 right-1 flex space-x-1">
                {onRemoveBackground && (
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); onRemoveBackground(); }}
                        className="p-1.5 bg-primary text-white rounded-full hover:bg-primary-hover shadow-sm transition-colors"
                        title="Remove Background"
                    >
                        <Icon name="magic-wand" className="w-4 h-4" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleRemove}
                    className="p-1.5 bg-black bg-opacity-60 text-white rounded-full transition-opacity hover:bg-red-500 shadow-sm"
                    aria-label="Remove image"
                >
                    <Icon name="close" />
                </button>
            </div>
          </>
        ) : (
          <div className="text-center px-4">
            <Icon name={multiple ? "stack" : "upload"} className="mx-auto mb-2 h-8 w-8" />
            <span className="text-xs sm:text-sm font-semibold block">{prompt}</span>
          </div>
        )}
      </label>
    </div>
  );
};
