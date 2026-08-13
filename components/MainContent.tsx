
import React, { useState, useEffect } from 'react';
import type { GeneratedImage, GenerateCaptionParams, GenerateImageParams, BrandKit } from '../types';
import { AppMode } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { DetailPanel } from './DetailPanel';
import { LivePreview } from './ui/LivePreview';
import { AdTextOverlay } from './ui/AdTextOverlay';
import { useDesigns } from '../contexts/DesignsContext';
import { Toast } from './ui/Toast';
import { Spinner } from './ui/Spinner';
import { inspirationService } from '../services/inspirationService';
import { downloadImage, generateFilename } from '../utils/images';

interface MainContentProps {
  params: GenerateImageParams;
  frontProductImagePreview: string | null;
  generatedImages: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
  onStartEdit: (image: GeneratedImage) => void;
  onSetStoryboardSource: (image: GeneratedImage) => void;
  onSetZoomedImage: (image: GeneratedImage) => void;
  isStoryboardResult: boolean;
  onGenerateCaption: (imageId: string, params: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => void;
  generatingCaptionImageId: string | null;
  onOpenABTestModal: (image: GeneratedImage) => void;
  onReturnToSettings: () => void;
  onSaveModel?: (image: GeneratedImage) => void;
  onRemix?: (item: GeneratedImage) => void;
  brandKit: BrandKit | null;
}

const IconButton: React.FC<{icon: string, label: string, onClick: (e: React.MouseEvent) => void, disabled?: boolean, className?: string, isLoading?: boolean}> = ({icon, label, onClick, disabled, className, isLoading}) => (
    <button
        onClick={onClick}
        disabled={disabled || isLoading}
        title={label}
        className={`w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:text-primary hover:bg-slate-100 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
    >
        {isLoading ? <Spinner /> : <Icon name={icon} className="w-5 h-5" />}
    </button>
);

// --- COMPONENT 1: FASHION REVIEW STUDIO (Dedicated View) ---
const FashionReviewStudio: React.FC<{ 
    images: GeneratedImage[], 
    onSetZoomedImage: (img: GeneratedImage) => void,
    onStartEdit: (img: GeneratedImage) => void,
    onSaveModel?: (img: GeneratedImage) => void,
    onRemix?: (img: GeneratedImage) => void,
    isInfluencerMode: boolean
}> = ({ images, onSetZoomedImage, onStartEdit, onSaveModel, onRemix, isInfluencerMode }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const { addDesign } = useDesigns();
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    useEffect(() => {
      if (activeIndex >= images.length) setActiveIndex(0);
    }, [images, activeIndex]);
    
    const activeImage = images[activeIndex];
    const isCatalogSet = !isInfluencerMode && images.length > 1 && !!images[0]?.params?.catalogMode;

    const handleSave = async (imageToSave: GeneratedImage) => {
        if (isSaving) return;
        setIsSaving(imageToSave.id);
        setToast({ message: "Saving to My Designs...", type: 'success' });
        try {
            await addDesign(imageToSave);
            setToast({ message: "Design Saved!", type: 'success' });
        } catch (e) {
            setToast({ message: "Failed to save design.", type: 'error' });
        } finally {
            setIsSaving(null);
        }
    };

    const handleShare = async (image: GeneratedImage) => {
        if (isSharing) return;
        setIsSharing(image.id);
        setToast({ message: "Sharing to Community...", type: 'success' });
        try {
            await inspirationService.submitToInspiration(image);
            setToast({ message: "Shared to Community Gallery!", type: 'success' });
        } catch (e: any) {
            setToast({ message: "Failed to share design.", type: 'error' });
        } finally {
            setIsSharing(null);
        }
    };

    const handleDownload = async (image: GeneratedImage) => {
        if (isDownloading) return;
        setIsDownloading(image.id);
        try {
            const filename = generateFilename(image, 'fashion-studio');
            await downloadImage(image.imageUrl, filename);
        } catch (e) {
            setToast({ message: "Download failed.", type: 'error' });
        } finally {
            setIsDownloading(null);
        }
    };

    const handleDownloadAll = async () => {
        if (isDownloadingAll || images.length === 0) return;
        setIsDownloadingAll(true);
        setToast({ message: `Downloading ${images.length} images...`, type: 'success' });
        try {
            // Sequential with a small stagger — browsers block/collapse multiple
            // simultaneous auto-downloads triggered in the same tick.
            for (let i = 0; i < images.length; i++) {
                const filename = generateFilename(images[i], 'catalog-set', i + 1);
                await downloadImage(images[i].imageUrl, filename);
                if (i < images.length - 1) await new Promise(r => setTimeout(r, 400));
            }
            setToast({ message: "All images downloaded!", type: 'success' });
        } catch (e) {
            setToast({ message: "Some downloads may have failed.", type: 'error' });
        } finally {
            setIsDownloadingAll(false);
        }
    };
    
    if (images.length === 0 || !activeImage) return null;

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 animate-fade-in overflow-hidden">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {isCatalogSet && (
                <div className="lg:hidden flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-1">
                    <div className="flex items-center text-xs font-semibold text-slate-700">
                        <Icon name="shirt" className="w-3.5 h-3.5 mr-1.5 text-primary" />
                        {images.length}-Image Catalog Set
                    </div>
                    <Button onClick={handleDownloadAll} isLoading={isDownloadingAll} variant="secondary" className="!py-1 !px-2.5 !text-xs">
                        <Icon name="download" className="w-3.5 h-3.5 mr-1" /> Download All
                    </Button>
                </div>
            )}
            <div className="w-full lg:w-20 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-hide flex-shrink-0">
                {isCatalogSet && (
                    <div className="hidden lg:flex flex-col items-center gap-1.5 mb-1 pb-2 border-b border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide text-center">Catalog Set</span>
                        <button
                            onClick={handleDownloadAll}
                            disabled={isDownloadingAll}
                            title="Download All"
                            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:text-primary hover:bg-slate-100 transition-all duration-200 active:scale-95 disabled:opacity-50"
                        >
                            {isDownloadingAll ? <Spinner /> : <Icon name="download" className="w-4 h-4" />}
                        </button>
                    </div>
                )}
                {images.map((img, idx) => ( <button key={img.id} onClick={() => setActiveIndex(idx)} className={`relative flex-shrink-0 w-14 lg:w-16 h-20 lg:h-22 rounded-lg overflow-hidden border-2 transition-all duration-300 ${activeIndex === idx ? 'border-primary ring-2 ring-primary/10 shadow-md scale-105 z-10' : 'border-transparent hover:border-slate-300'}`}> <img src={img.imageUrl} className="w-full h-full object-cover" alt={`Pose ${idx + 1}`} referrerPolicy="no-referrer" /> <div className="absolute top-0.5 left-0.5 bg-black/40 text-[8px] text-white px-1 rounded-sm font-bold">{idx + 1}</div> </button> ))}
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col relative group max-h-[calc(100vh-12rem)]">
                <div className="flex-1 relative bg-slate-50 flex items-center justify-center overflow-hidden min-h-[300px]">
                    {activeImage && <img src={activeImage.imageUrl} className="max-w-full max-h-full object-contain cursor-zoom-in transition-transform duration-1000 group-hover:scale-105" onClick={() => onSetZoomedImage(activeImage)} alt="Active variation" referrerPolicy="no-referrer"/>}
                </div>
                <div className="p-2 border-t border-slate-100 bg-white flex items-center justify-center space-x-2">
                    <IconButton icon="edit" label="Edit" onClick={(e) => { e.stopPropagation(); onStartEdit(activeImage); }} />
                    <IconButton icon="download" label="Download" onClick={(e) => { e.stopPropagation(); handleDownload(activeImage); }} isLoading={isDownloading === activeImage.id} />
                    <IconButton icon="globe" label="Share to Community" onClick={(e) => { e.stopPropagation(); handleShare(activeImage); }} isLoading={isSharing === activeImage.id} />
                    {onRemix && <IconButton icon="swap" label="Remix Style" onClick={(e) => { e.stopPropagation(); onRemix(activeImage); }} />}
                    <IconButton icon="bookmark" label="Save to My Designs" onClick={(e) => { e.stopPropagation(); handleSave(activeImage); }} isLoading={isSaving === activeImage.id} />
                    {isInfluencerMode && onSaveModel && ( <IconButton icon="user" label="Save as Model" onClick={(e) => { e.stopPropagation(); onSaveModel(activeImage); }} className="text-purple-600 hover:bg-purple-50" /> )}
                </div>
            </div>
        </div>
    );
};

const MainContentComponent: React.FC<MainContentProps> = (props) => {
  const [detailPanelImage, setDetailPanelImage] = useState<GeneratedImage | null>(null);
  const { addDesign } = useDesigns();
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  
  const appMode = props.generatedImages.length > 0 ? props.generatedImages[0].params?.appMode : undefined;
  const isFashionOrInfluencer = appMode === AppMode.Fashion || appMode === AppMode.Influencer;
  const isInfluencer = appMode === AppMode.Influencer;
  const isCatalogHeaderSet = appMode === AppMode.Fashion && props.generatedImages.length > 1 && !!props.generatedImages[0]?.params?.catalogMode;

  // Sync details panel image with the updated images from props if it's open
  useEffect(() => {
    if (detailPanelImage) {
        const updated = props.generatedImages.find(img => img.id === detailPanelImage.id);
        if (updated) setDetailPanelImage(updated);
    }
  }, [props.generatedImages]);

  const handleSave = async (imageToSave: GeneratedImage) => {
    if (isSaving) return;
    setIsSaving(imageToSave.id);
    setToast({ message: "Saving design...", type: 'success' });
    try {
        await addDesign(imageToSave);
        setToast({ message: "Design Saved!", type: 'success' });
    } catch (e) {
        setToast({ message: "Failed to save design.", type: 'error' });
    } finally {
        setIsSaving(null);
    }
  };

  const handleShare = async (image: GeneratedImage) => {
      if (isSharing) return;
      setIsSharing(image.id);
      setToast({ message: "Sharing to Community...", type: 'success' });
      try {
          await inspirationService.submitToInspiration(image);
          setToast({ message: "Shared to Community Gallery!", type: 'success' });
      } catch (e: any) {
          setToast({ message: "Failed to share design.", type: 'error' });
      } finally {
          setIsSharing(null);
      }
  };

  const handleDownload = async (image: GeneratedImage) => {
      if (isDownloading) return;
      setIsDownloading(image.id);
      try {
          const filename = generateFilename(image, 'shot');
          await downloadImage(image.imageUrl, filename);
      } catch (e) {
          setToast({ message: "Download failed.", type: 'error' });
      } finally {
          setIsDownloading(null);
      }
  };

  const handleUpdateImage = (updatedImage: GeneratedImage) => {
      setDetailPanelImage(updatedImage);
      // If we had a way to update the parent's generatedImages array, we would call it here.
      // For now, updating the detailPanelImage state is enough to reflect changes in the panel.
  };

  // SKELETON LOADING STATE
  if (props.isLoading) {
    return (
      <div className="w-full h-full bg-white flex flex-col animate-fade-in">
        <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-border-light">
            <div className="flex items-center gap-4">
                <div className="h-8 w-8 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-6 w-32 bg-slate-100 rounded-lg animate-pulse" />
            </div>
        </header>
        <main className="flex-grow p-4 md:p-8">
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="break-inside-avoid bg-slate-50 rounded-xl overflow-hidden border border-slate-100 h-96 animate-pulse relative">
                        <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-200">
                            <Icon name="image" className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-xs font-medium text-slate-300">Generating...</span>
                        </div>
                    </div>
                ))}
            </div>
        </main>
      </div>
    );
  }

  if (props.generatedImages.length === 0) { return <LivePreview params={props.params} productImageUrl={props.frontProductImagePreview} />; }

  return (
    <div className="w-full h-full bg-white flex flex-col">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <header className="flex-shrink-0 flex items-center justify-between p-3.5 sm:p-4 md:p-6 border-b border-border-light bg-white gap-2">
            <div className="flex items-center min-w-0 mr-2">
                <Icon name={isFashionOrInfluencer ? "shirt" : "sparkles"} className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-4 text-primary shrink-0"/>
                <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-batangas text-text-primary truncate">{isFashionOrInfluencer ? "Review Studio" : "Generated Results"}</h2>
                    <p className="text-xs sm:text-sm text-text-secondary truncate">{isFashionOrInfluencer ? (isCatalogHeaderSet ? `${props.generatedImages.length}-image catalog set — consistent model across every shot` : "Select your best shots") : `${props.generatedImages.length} items created`}</p>
                </div>
            </div>
            <Button 
              onClick={props.onReturnToSettings} 
              variant="secondary" 
              className="!px-2.5 !py-1.5 sm:!px-3.5 sm:!py-2 !text-xs sm:!text-sm whitespace-nowrap shrink-0 font-medium"
            >
                <Icon name="settings" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0" />
                <span className="hidden sm:inline">Back to Settings</span>
                <span className="sm:hidden">Settings</span>
            </Button>
        </header>
        <main className="flex-grow flex flex-row overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {isFashionOrInfluencer ? ( <div className="p-4 md:p-6"><FashionReviewStudio images={props.generatedImages} onSetZoomedImage={props.onSetZoomedImage} onStartEdit={props.onStartEdit} onSaveModel={props.onSaveModel} onRemix={props.onRemix} isInfluencerMode={isInfluencer} /></div> ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 p-4 md:p-8">
                        {props.generatedImages.map((image) => (
                            <div key={image.id} className="bg-white rounded-lg overflow-hidden shadow-md border border-slate-200 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group mb-6" style={{ breakInside: 'avoid' }}>
                                <div className="relative w-full bg-slate-50 cursor-zoom-in overflow-hidden" onClick={() => props.onSetZoomedImage(image)}>
                                    <img src={image.imageUrl} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" alt="Result" referrerPolicy="no-referrer" />
                                    {image.params.appMode === AppMode.AdCreative && (
                                        <AdTextOverlay params={image.params} />
                                    )}
                                </div>
                                <div className="p-1 border-t border-slate-200 bg-white mt-auto">
                                    <div className="flex items-center justify-around">
                                        <IconButton icon="download" label="Download" onClick={(e) => { e.stopPropagation(); handleDownload(image); }} isLoading={isDownloading === image.id} />
                                        <IconButton icon="globe" label="Share to Community" onClick={(e) => { e.stopPropagation(); handleShare(image); }} isLoading={isSharing === image.id} />
                                        {props.onRemix && <IconButton icon="swap" label="Remix Style" onClick={(e) => { e.stopPropagation(); props.onRemix!(image); }} />}
                                        <IconButton icon="edit" label="Edit" onClick={(e) => { e.stopPropagation(); props.onStartEdit(image); }} />
                                        <IconButton icon="info" label="Details" onClick={(e) => { e.stopPropagation(); setDetailPanelImage(image); }} />
                                        <IconButton icon="bookmark" label="Save" onClick={(e) => { e.stopPropagation(); handleSave(image); }} isLoading={isSaving === image.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {detailPanelImage && <DetailPanel image={detailPanelImage} onClose={() => setDetailPanelImage(null)} onGenerateCaption={props.onGenerateCaption} generatingCaptionImageId={props.generatingCaptionImageId} onOpenABTestModal={props.onOpenABTestModal} onUpdateImage={handleUpdateImage} brandKit={props.brandKit}/>}
        </main>
    </div>
  );
};

export const MainContent = React.memo(MainContentComponent);
