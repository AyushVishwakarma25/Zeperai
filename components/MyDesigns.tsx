
import React, { useCallback } from 'react';
import type { GeneratedImage } from '../types';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { View } from '../types';
import { generateFilename } from '../imageUtils';

interface MyDesignsProps {
  images: GeneratedImage[];
  onRemove: (imageId: string) => void;
  onDeploy: () => void;
  onSetView: (view: View) => void;
  onStartEdit: (image: GeneratedImage) => void;
  onSetZoomedImage: (image: GeneratedImage) => void;
  onSetStoryboardSource: (image: GeneratedImage) => void;
  onToggleSidebar: () => void;
}

const IconButton: React.FC<{icon: string, label: string, onClick: (e: React.MouseEvent) => void, disabled?: boolean}> = ({icon, label, onClick, disabled}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={label}
        className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-primary disabled:text-slate-300 disabled:bg-transparent disabled:cursor-not-allowed transition-colors"
    >
        <Icon name={icon} className="w-5 h-5" />
    </button>
);

export const MyDesigns: React.FC<MyDesignsProps> = ({ 
    images, onRemove, onDeploy, onSetView, onStartEdit, onSetZoomedImage, onSetStoryboardSource, onToggleSidebar
}) => {

  const handleDownload = useCallback((image: GeneratedImage) => {
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = generateFilename(image, 'design');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }, []);
  
  const handleDragStart = (e: React.DragEvent, image: GeneratedImage) => {
      e.dataTransfer.setData('application/x-krackx-image', JSON.stringify(image));
      e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
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

        {images.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-text-secondary p-6">
                <Icon name="bookmark" className="w-16 h-16 text-slate-300 mb-4"/>
                <h3 className="text-xl font-semibold text-text-primary">Your design board is empty</h3>
                <p className="max-w-md mt-2">
                    Click the bookmark icon on any of your creations from the dashboard to save them here for future use and comparison.
                </p>
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
                                        <IconButton icon="edit" label="Edit" onClick={(e) => { e.stopPropagation(); onStartEdit(image); }} />
                                        <IconButton icon="download" label="Download" onClick={(e) => { e.stopPropagation(); handleDownload(image); }} />
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
