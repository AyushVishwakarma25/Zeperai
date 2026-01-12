
import React, { useCallback, useState } from 'react';
import type { GeneratedImage } from '../types';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { View } from '../types';
import { generateFilename } from '../utils/images';
import { inspirationService } from '../services/inspirationService';
import { Toast } from './ui/Toast';

interface MyDesignsProps {
  images: GeneratedImage[];
  onRemove: (imageId: string) => void;
  onDeploy: () => void;
  onSetView: (view: View) => void;
  onStartEdit: (image: GeneratedImage) => void;
  onSetZoomedImage: (image: GeneratedImage) => void;
  onSetStoryboardSource: (image: GeneratedImage) => void;
  onToggleSidebar: () => void;
  onRemix?: (image: GeneratedImage) => void;
  isLoading?: boolean;
}

const IconButton: React.FC<{icon: string, label: string, onClick: (e: React.MouseEvent) => void, disabled?: boolean, isLoading?: boolean}> = ({icon, label, onClick, disabled, isLoading}) => (
    <button
        onClick={onClick}
        disabled={disabled || isLoading}
        title={label}
        className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-primary disabled:text-slate-300 disabled:bg-transparent disabled:cursor-not-allowed transition-colors relative"
    >
        {isLoading ? (
             <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ) : (
            <Icon name={icon} className="w-5 h-5" />
        )}
    </button>
);

export const MyDesigns: React.FC<MyDesignsProps> = ({ 
    images, onRemove, onDeploy, onSetView, onStartEdit, onSetZoomedImage, onSetStoryboardSource, onToggleSidebar, onRemix, isLoading
}) => {
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const handleDownload = useCallback(async (image: GeneratedImage) => {
      setDownloadingId(image.id);
      try {
          const response = await fetch(image.imageUrl, { mode: 'cors' });
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = generateFilename(image, 'design');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (e) {
          console.error("Download failed, attempting fallback", e);
          const link = document.createElement('a');
          link.href = image.imageUrl;
          link.download = generateFilename(image, 'design');
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } finally {
          setDownloadingId(null);
      }
  }, []);
  
  const handleDragStart = (e: React.DragEvent, image: GeneratedImage) => {
      e.dataTransfer.setData('application/x-krackx-image', JSON.stringify(image));
      e.dataTransfer.effectAllowed = 'copy';
  };

  const handleShareToInspiration = async (image: GeneratedImage) => {
      setSharingId(image.id);
      try {
          await inspirationService.submitToInspiration(image);
          setToast({ message: "Shared to Inspiration Gallery!", type: 'success' });
      } catch (e: any) {
          setToast({ message: e.message || "Failed to share.", type: 'error' });
      } finally {
          setSharingId(null);
      }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
        {toast && (
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast(null)} 
            />
        )}
        <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-6 border-b border-border-light gap-4">
            <div className="flex items-center w-full sm:w-auto">
                <button onClick={onToggleSidebar} className="p-2 mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
                    <Icon name="menu" className="w-6 h-6" />
                </button>
                 <Icon name="folder" className="w-8 h-8 mr-4 text-primary flex-shrink-0"/>
                 <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text-primary">My Saved Designs</h2>
                    <p className="text-sm text-text-secondary">Your collection of saved creatives.</p>
                 </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <Button onClick={() => onSetView(View.Dashboard)} variant="secondary" fullWidth>
                    <Icon name="arrow-left" className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </Button>
                <Button onClick={onDeploy} disabled={images.length === 0} fullWidth>
                    <Icon name="deploy" className="w-5 h-5 mr-2" />
                    Deploy Campaign
                </Button>
            </div>
        </header>

        {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
                <Spinner />
                <p className="ml-3 text-slate-500 font-medium">Loading your designs...</p>
            </div>
        ) : images.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-text-secondary p-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Icon name="bookmark" className="w-10 h-10 text-slate-400"/>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">No designs saved yet</h3>
                <p className="max-w-md text-sm text-slate-500 mb-8">
                    When you generate an image you love, click the <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium text-xs"><Icon name="bookmark" className="w-3 h-3 mr-1" /> Save</span> button to keep it here safe.
                </p>
                <Button onClick={() => onSetView(View.Dashboard)} className="shadow-lg shadow-primary/20">
                    Create Your First Design
                </Button>
            </div>
        ) : (
            <main className="flex-grow overflow-y-auto p-4 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {images.map(image => {
                        return (
                            <div 
                                key={image.id} 
                                className="bg-white rounded-lg overflow-hidden shadow-md border border-slate-200 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                                draggable="true"
                                onDragStart={(e) => handleDragStart(e, image)}
                            >
                                <div 
                                    className="relative cursor-zoom-in"
                                    onClick={() => onSetZoomedImage(image)}
                                    style={{ aspectRatio: '4 / 5' }}
                                >
                                    <img src={image.imageUrl} alt="Saved generation" className="w-full h-full object-cover" />
                                </div>
                                <div className="p-1 border-t border-slate-200 mt-auto">
                                    <div className="flex items-center justify-around">
                                        <IconButton icon="film" label="Create Storyboard" onClick={(e) => { e.stopPropagation(); onSetStoryboardSource(image); }} />
                                        <IconButton icon="globe" label="Share to Inspiration" isLoading={sharingId === image.id} onClick={(e) => { e.stopPropagation(); handleShareToInspiration(image); }} />
                                        <IconButton icon="edit" label="Edit" onClick={(e) => { e.stopPropagation(); onStartEdit(image); }} />
                                        <IconButton 
                                            icon="download" 
                                            label="Download" 
                                            isLoading={downloadingId === image.id}
                                            onClick={(e) => { e.stopPropagation(); handleDownload(image); }} 
                                        />
                                        <IconButton icon="remove" label="Remove" onClick={(e) => { e.stopPropagation(); onRemove(image.id); }} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>
        )}
    </div>
  );
};
