
import React, { useState, useEffect } from 'react';
import type { GeneratedImage, GenerateCaptionParams, GenerateImageParams } from '../types';
import { AppMode } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { DetailPanel } from './DetailPanel';
import { Spinner } from './ui/Spinner';
import { LivePreview } from './ui/LivePreview';

interface MainContentProps {
  params: GenerateImageParams;
  frontProductImagePreview: string | null;
  generatedImages: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
  onAddToPosterBoard: (image: GeneratedImage) => void;
  onUpscale: (image: GeneratedImage) => void;
  upscalingImageId: string | null;
  onStartEdit: (image: GeneratedImage) => void;
  onSetStoryboardSource: (image: GeneratedImage) => void;
  onSetZoomedImage: (image: GeneratedImage) => void;
  isStoryboardResult: boolean;
  onGenerateCaption: (imageId: string, params: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => void;
  generatingCaptionImageId: string | null;
  onOpenABTestModal: (image: GeneratedImage) => void;
  onStartNew: () => void;
}

const IconButton: React.FC<{icon: string, label: string, onClick: (e: React.MouseEvent) => void, disabled?: boolean, className?: string}> = ({icon, label, onClick, disabled, className}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={label}
        className={`w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
    >
        <Icon name={icon} className="w-5 h-5" />
    </button>
);

const generateFilenameFromImage = (image: GeneratedImage): string => {
    const extension = image.imageUrl.split(';')[0].split('/')[1] || 'png';
    let namePart = `creative-result-${image.id.substring(4, 10)}`;

    if (image.params.appMode === AppMode.Product && image.params.productStylePreset) {
        if (image.params.productStylePreset.includes('|')) {
            namePart = image.params.productStylePreset.split('|')[1];
        } else {
            namePart = image.params.productStylePreset;
        }
    } else if (image.params.appMode === AppMode.Influencer && image.params.poseSuggestion) {
        namePart = image.params.poseSuggestion;
    } else if (image.params.productDescription) {
        namePart = image.params.productDescription;
    }

    const sanitizedName = namePart
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);

    return `${sanitizedName || 'image'}.${extension}`;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  params, frontProductImagePreview, generatedImages, isLoading, error, onAddToPosterBoard, onUpscale, 
  upscalingImageId, onStartEdit, onSetStoryboardSource, onSetZoomedImage, isStoryboardResult,
  onGenerateCaption, generatingCaptionImageId, onOpenABTestModal, onStartNew
}) => {
  const [detailPanelImage, setDetailPanelImage] = useState<GeneratedImage | null>(null);

  // Update detail panel if the underlying image data changes (e.g. caption generated)
  useEffect(() => {
    if (detailPanelImage) {
      const updatedImageInList = generatedImages.find(img => img.id === detailPanelImage.id);
      if (updatedImageInList && (updatedImageInList.imageUrl !== detailPanelImage.imageUrl || updatedImageInList.caption !== detailPanelImage.caption)) {
        setDetailPanelImage(updatedImageInList);
      }
    }
  }, [generatedImages, detailPanelImage]);

  const handleDownload = (image: GeneratedImage) => {
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = generateFilenameFromImage(image);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const renderContent = () => {
    if (isLoading) return null; // Loading state handled globally

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-red-100 p-4 rounded-full mb-4">
                <Icon name="close" className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Generation Failed</h3>
            <p className="text-slate-600 max-w-md">{error}</p>
        </div>
      );
    }

    if (generatedImages.length === 0) {
      return <LivePreview params={params} productImageUrl={frontProductImagePreview} />;
    }
    
    // Grid Layout
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {generatedImages.map((image, index) => {
                const isUpscaling = upscalingImageId === image.id;
                const styleAspectRatio = image.aspectRatio === '1:1' ? '1/1' : 
                                         image.aspectRatio === '9:16' ? '9/16' : 
                                         image.aspectRatio === '16:9' ? '16/9' : '4/5';

                return (
                    <div key={image.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col h-full">
                        {/* Image Container */}
                        <div 
                            className="relative w-full bg-gray-50 cursor-zoom-in overflow-hidden border-b border-slate-100"
                            onClick={() => !isUpscaling && onSetZoomedImage(image)}
                        >
                            <img 
                                src={image.imageUrl} 
                                alt={image.caption || "Generated result"} 
                                className="w-full h-auto object-contain max-h-[500px]"
                                style={{ aspectRatio: styleAspectRatio }}
                            />
                            
                            {/* Upscaling Overlay */}
                            {isUpscaling && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                                    <Spinner />
                                    <p className="text-white text-xs mt-2 font-medium">Upscaling...</p>
                                </div>
                            )}

                             {/* Storyboard Badge */}
                            {isStoryboardResult && (
                                <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-sm">
                                    Scene {index + 1}
                                </div>
                            )}
                            
                            {/* Floating Info Button */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setDetailPanelImage(image); }}
                                className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm text-slate-500 rounded-full hover:text-primary shadow-sm border border-slate-200/50 transition-colors"
                                title="View Details"
                            >
                                <Icon name="info" className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Action Footer */}
                        <div className="p-2 flex justify-between items-center mt-auto">
                            <IconButton icon="film" label="Storyboard" onClick={() => onSetStoryboardSource(image)} disabled={isUpscaling} />
                            <IconButton icon="edit" label="Edit" onClick={() => onStartEdit(image)} disabled={isUpscaling} />
                            <IconButton icon="sparkles" label="Upscale" onClick={() => onUpscale(image)} disabled={isUpscaling} />
                            <IconButton icon="download" label="Download" onClick={() => handleDownload(image)} disabled={isUpscaling} />
                            <IconButton icon="bookmark" label="Save to Designs" onClick={() => onAddToPosterBoard(image)} className="text-primary hover:bg-primary/10" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-row relative">
        <div className="flex-1 flex flex-col py-6 h-full">
             <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Your Creations</h2>
                    {generatedImages.length > 0 && <p className="text-sm text-text-secondary mt-1">Found {generatedImages.length} result{generatedImages.length !== 1 ? 's' : ''}</p>}
                </div>
                <Button onClick={onStartNew} variant="secondary">
                    <Icon name="plus-circle" className="w-5 h-5 mr-2" />
                    Start New Design
                </Button>
            </header>
            <div className="flex-grow min-h-0 relative">
              {renderContent()}
            </div>
        </div>
        
        {detailPanelImage && (
            <DetailPanel 
              image={detailPanelImage} 
              onClose={() => setDetailPanelImage(null)}
              onGenerateCaption={onGenerateCaption}
              generatingCaptionImageId={generatingCaptionImageId}
              onOpenABTestModal={onOpenABTestModal}
            />
        )}
    </div>
  );
};
