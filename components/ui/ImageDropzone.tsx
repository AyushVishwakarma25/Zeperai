
import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface ImageDropzoneProps {
  id: string;
  previewUrl?: string | null;       // Legacy single preview
  previewUrls?: string[];           // New multiple preview
  onFileChange?: (file: File | null) => void; // Legacy single handler
  onFilesChange?: (files: File[]) => void;    // New multiple handler
  onRemoveFile?: (index: number) => void;     // New remove handler
  multiple?: boolean;
  maxFiles?: number;
  prompt?: string;
  className?: string;
  isLoading?: boolean;
  onRemoveBackground?: () => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ 
    id, previewUrl, previewUrls = [], onFileChange, onFilesChange, onRemoveFile, multiple, maxFiles = 3, prompt = 'Click to upload or drag & drop', 
    className, isLoading = false, onRemoveBackground 
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const processFiles = (incomingFiles: File[]) => {
      if (multiple && onFilesChange) {
        // If we already have files (based on previewUrls length), append new ones
        // Note: This logic assumes parent component manages state merging, 
        // but typically Dropzone sends the *new* total state. 
        // Here we just send the incoming files to the parent to handle merging or replacement.
        onFilesChange(incomingFiles);
      } else if (onFileChange) {
        onFileChange(incomingFiles[0]);
      }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement | HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      processFiles(files);
      return;
    }

    // Handle internal DnD
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
      const files = Array.from(e.target.files) as File[];
      processFiles(files);
    }
    // Reset input value to allow selecting same file again
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSingleRemove = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if(onFileChange) onFileChange(null);
  }

  // Combine single previewUrl into array if multiple not explicitly used but previewUrl exists
  const activePreviews = multiple ? previewUrls : (previewUrl ? [previewUrl] : []);
  const hasImages = activePreviews.length > 0;
  const canAddMore = multiple && activePreviews.length < maxFiles;

  const baseClasses = 'relative w-full h-full min-h-[6rem] bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-text-secondary transition-colors duration-200';
  const draggingClasses = 'border-primary bg-primary/5 text-primary';
  const hoverClasses = 'hover:border-primary/50 hover:bg-slate-100';

  const triggerUpload = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent bubbling if nested
      inputRef.current?.click();
  };

  return (
    <div className={`${className || ''} flex flex-col h-full`}>
      <input 
        ref={inputRef}
        id={id} 
        type="file" 
        className="hidden" 
        accept="image/*" 
        multiple={multiple}
        onChange={handleInputChange} 
      />

      {/* CASE 1: Loading State */}
      {isLoading ? (
          <div className={`${baseClasses} cursor-default`}>
            <Spinner />
            <span className="text-sm font-semibold mt-2">Processing...</span>
          </div>
      ) : hasImages ? (
          // CASE 2: Images Exist (Show Grid)
          <div className="w-full h-full flex flex-col gap-2">
              <div className="grid grid-cols-3 gap-2 h-full">
                  {activePreviews.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                          <img src={url} alt={`Upload ${idx+1}`} className="w-full h-full object-cover" />
                          <button
                              type="button"
                              onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (multiple && onRemoveFile) onRemoveFile(idx);
                                  else handleSingleRemove(e);
                              }}
                              className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                              title="Remove"
                          >
                              <Icon name="close" className="w-3 h-3" />
                          </button>
                          
                          {/* Only show BG removal option on the first image for now if single mode */}
                          {!multiple && onRemoveBackground && idx === 0 && (
                              <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); onRemoveBackground(); }}
                                  className="absolute bottom-1 right-1 p-1.5 bg-primary text-white rounded-full shadow-sm hover:bg-primary-hover"
                                  title="Remove Background"
                              >
                                  <Icon name="magic-wand" className="w-3 h-3" />
                              </button>
                          )}
                      </div>
                  ))}

                  {/* Add More Button (if multiple and below limit) */}
                  {canAddMore && (
                      <div 
                        onClick={triggerUpload}
                        className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors text-slate-400 hover:text-primary"
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                          <Icon name="plus" className="w-6 h-6 mb-1" />
                          <span className="text-[10px] font-semibold">Add Image</span>
                      </div>
                  )}
              </div>
              {multiple && (
                  <p className="text-[10px] text-center text-slate-400">
                      {activePreviews.length} / {maxFiles} images uploaded
                  </p>
              )}
          </div>
      ) : (
          // CASE 3: Empty State (Show big dropzone)
          <label
            htmlFor={id}
            className={`${baseClasses} ${isDraggingOver ? draggingClasses : hoverClasses} cursor-pointer`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                <Icon name={multiple ? "stack" : "upload"} className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-semibold text-slate-700">{prompt}</span>
            {multiple && <span className="text-xs text-slate-400 mt-1">Up to {maxFiles} images</span>}
          </label>
      )}
    </div>
  );
};
