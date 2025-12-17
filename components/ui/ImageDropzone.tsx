import React, { useState } from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface ImageDropzoneProps {
  id: string;
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
  prompt?: string;
  className?: string;
  isLoading?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ id, previewUrl, onFileChange, prompt = 'Click to upload or drag & drop', className, isLoading = false }) => {
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onFileChange(null);
  }

  const baseClasses = 'relative w-full h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-text-secondary transition-colors duration-200';
  const draggingClasses = 'border-primary bg-primary/10 text-primary';
  const hoverClasses = 'hover:border-primary hover:text-primary';

  return (
    <div className={className}>
      <input id={id} type="file" className="hidden" accept="image/*" onChange={handleInputChange} />
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
            <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1.5 bg-black bg-opacity-60 text-white rounded-full transition-opacity hover:bg-red-500"
                aria-label="Remove image"
            >
                <Icon name="close" />
            </button>
          </>
        ) : (
          <div className="text-center">
            <Icon name="upload" className="mx-auto mb-2 h-8 w-8" />
            <span className="text-sm font-semibold">{prompt}</span>
          </div>
        )}
      </label>
    </div>
  );
};