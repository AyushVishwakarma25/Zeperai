import React, { useCallback, useState, useRef } from 'react';
import type { GeneratedImage, GenerateCaptionParams, BrandKit } from '../types';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { View } from '../types';
import { generateFilename, downloadImage } from '../utils/images';
import { useDesigns } from '../contexts/DesignsContext';
import { Toast } from './ui/Toast';
import { DetailPanel } from './DetailPanel';
import { AdTextOverlay } from './ui/AdTextOverlay';
import { inspirationService } from '../services/inspirationService';

interface MyDesignsProps {
  onSetView: (view: View) => void;
  onStartEdit: (image: GeneratedImage) => void;
  onSetZoomedImage: (image: GeneratedImage) => void;
  onSetStoryboardSource: (image: GeneratedImage) => void;
  onToggleSidebar: () => void;
  onRemix: (image: GeneratedImage) => void;
  onGenerateCaption: (imageId: string, params: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => void;
  generatingCaptionImageId: string | null;
  onOpenABTestModal: (image: GeneratedImage) => void;
  brandKit: BrandKit | null;
}

const IconButton: React.FC<{icon: string, label: string, onClick: (e: React.MouseEvent) => void, disabled?: boolean, isLoading?: boolean, className?: string}> = ({icon, label, onClick, disabled, isLoading, className}) => (
    <button
        onClick={onClick}
        disabled={disabled || isLoading}
        title={label}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors disabled:opacity-30 ${className}`}
    >
        {isLoading ? <Spinner /> : <Icon name={icon} className="w-4 h-4" />}
    </button>
);

export const MyDesigns: React.FC<MyDesignsProps> = ({ 
    onSetView, onSetZoomedImage, onToggleSidebar, onRemix, onStartEdit,
    onGenerateCaption, generatingCaptionImageId, onOpenABTestModal, brandKit
}) => {
  const { designs, isLoading, hasMore, fetchDesigns, removeDesign } = useDesigns();
  const observer = useRef<IntersectionObserver | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [detailPanelImage, setDetailPanelImage] = useState<GeneratedImage | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
            fetchDesigns(false);
        }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, fetchDesigns]);

  const handleDownload = async (image: GeneratedImage) => {
      const filename = generateFilename(image, 'design');
      await downloadImage(image.imageUrl, filename, 'png');
  };

  const handleShare = async (image: GeneratedImage) => {
      if (sharingId) return;
      setSharingId(image.id);
      try {
          await inspirationService.submitToInspiration(image);
          setToast({ message: "Shared to Community Gallery!", type: 'success' });
      } catch (e: any) {
          setToast({ message: "Failed to share design.", type: 'error' });
      } finally {
          setSharingId(null);
      }
  };

  const handleUpdateImage = (updatedImage: GeneratedImage) => {
      setDetailPanelImage(updatedImage);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col relative">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-border-light">
            <div className="flex items-center">
                <button onClick={onToggleSidebar} className="p-2 mr-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
                    <Icon name="menu" className="w-6 h-6" />
                </button>
                 <Icon name="folder" className="w-8 h-8 mr-4 text-primary"/>
                 <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text-primary">My Designs</h2>
                    <p className="text-sm text-text-secondary">Your saved creative assets</p>
                 </div>
            </div>
            <Button onClick={() => onSetView(View.Dashboard)} variant="secondary">
                <Icon name="arrow-left" className="w-5 h-5 mr-2" />
                Back to Dashboard
            </Button>
        </header>

        {designs.length === 0 && !isLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
                <Icon name="bookmark" className="w-12 h-12 text-slate-200 mb-4"/>
                <h3 className="text-lg font-bold text-slate-800">No designs yet</h3>
                <p className="text-sm text-slate-500 mb-6">Generated images will appear here when you save them.</p>
                <Button onClick={() => onSetView(View.Dashboard)}>Start Creating</Button>
            </div>
        ) : (
            <main className="flex-grow overflow-y-auto p-4 md:p-8">
                {/* Changed from Grid to Masonry Columns to fix whitespace issues */}
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
                    {designs.map((image, index) => (
                        <div 
                            key={image.id} 
                            ref={index === designs.length - 1 ? lastElementRef : null} 
                            className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col group transition-all hover:shadow-md mb-6"
                        >
                            <div className="relative cursor-zoom-in bg-slate-50 overflow-hidden" onClick={() => onSetZoomedImage(image)}>
                                {/* Removed fixed aspect ratio, using h-auto to respect content size */}
                                <img 
                                    src={image.imageUrl} 
                                    alt="" 
                                    className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-105" 
                                    loading="lazy" 
                                />
                                {image.params.appMode === 'Ad Creative' && (
                                    <AdTextOverlay params={image.params} />
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                            </div>
                            <div className="p-2 border-t border-slate-100 flex items-center justify-between gap-1 bg-white">
                                <IconButton icon="download" label="Download" onClick={(e) => { e.stopPropagation(); handleDownload(image); }} />
                                <IconButton icon="remove" label="Unsave" onClick={(e) => { e.stopPropagation(); removeDesign(image.id); }} />
                                <IconButton icon="globe" label="Share to Community" onClick={(e) => { e.stopPropagation(); handleShare(image); }} isLoading={sharingId === image.id} />
                                <IconButton icon="edit" label="Edit" onClick={(e) => { e.stopPropagation(); onStartEdit(image); }} />
                                <IconButton icon="info" label="Details & A/B Test" onClick={(e) => { e.stopPropagation(); setDetailPanelImage(image); }} className="text-primary bg-primary/5 hover:bg-primary/10" />
                            </div>
                        </div>
                    ))}
                </div>
                {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
            </main>
        )}

        {detailPanelImage && (
            <DetailPanel 
                image={detailPanelImage} 
                onClose={() => setDetailPanelImage(null)}
                onGenerateCaption={onGenerateCaption}
                generatingCaptionImageId={generatingCaptionImageId}
                onOpenABTestModal={onOpenABTestModal}
                onUpdateImage={handleUpdateImage}
                brandKit={brandKit}
            />
        )}
    </div>
  );
};