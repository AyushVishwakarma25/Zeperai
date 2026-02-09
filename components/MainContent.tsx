
import React, { useState, useEffect } from 'react';
import type { GeneratedImage, GenerateCaptionParams, GenerateImageParams } from '../types';
import { AppMode } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { DetailPanel } from './DetailPanel';
import { LivePreview } from './ui/LivePreview';
import { useDesigns } from '../contexts/DesignsContext';
import { Toast } from './ui/Toast';
import { Spinner } from './ui/Spinner';
import { inspirationService } from '../services/inspirationService';

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

    useEffect(() => {
      if (activeIndex >= images.length) setActiveIndex(0);
    }, [images, activeIndex]);
    
    const activeImage = images[activeIndex];

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
    
    if (images.length === 0 || !activeImage) return null;

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 animate-fade-in overflow-hidden">
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="w-full lg:w-20 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-hide flex-shrink-0">
                {images.map((img, idx) => ( <button key={img.id} onClick={() => setActiveIndex(idx)} className={`relative flex-shrink-0 w-14 lg:w-16 h-20 lg:h-22 rounded-lg overflow-hidden border-2 transition-all duration-300 ${activeIndex === idx ? 'border-primary ring-2 ring-primary/10 shadow-md scale-105 z-10' : 'border-transparent hover:border-slate-300'}`}> <img src={img.imageUrl} className="w-full h-full object-cover" alt={`Pose ${idx + 1}`} /> <div className="absolute top-0.5 left-0.5 bg-black/40 text-[8px] text-white px-1 rounded-sm font-bold">{idx + 1}</div> </button> ))}
            </div>
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col relative group max-h-[calc(100vh-12rem)]">
                <div className="flex-1 relative bg-slate-50 flex items-center justify-center overflow-hidden min-h-[300px]">
                    {activeImage && <img src={activeImage.imageUrl} className="max-w-full max-h-full object-contain cursor-zoom-in transition-transform duration-1000 group-hover:scale-105" onClick={() => onSetZoomedImage(activeImage)} alt="Active variation"/>}
                </div>
                <div className="p-2 border-t border-slate-100 bg-white flex items-center justify-center space-x-2">
                    <IconButton icon="edit" label="Edit" onClick={(e) => { e.stopPropagation(); onStartEdit(activeImage); }} />
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
  
  const appMode = props.generatedImages.length > 0 ? props.generatedImages[0].params?.appMode : undefined;
  const isFashionOrInfluencer = appMode === AppMode.Fashion || appMode === AppMode.Influencer;
  const isInfluencer = appMode === AppMode.Influencer;

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

  if (props.error) { return ( <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100"> <div className="bg-red-50 p-4 rounded-full mb-4"><Icon name="close" className="w-6 h-6 text-red-500" /></div> <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">Shoot Failed</h3> <p className="text-slate-500 max-w-sm text-[10px]">{props.error}</p> <Button onClick={props.onReturnToSettings} variant="secondary" className="mt-4 !rounded-lg !px-6 !py-2 !text-xs">Retry Shoot</Button> </div> ); }
  
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
        <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-6 border-b border-border-light gap-4">
            <div className="flex items-center w-full sm:w-auto">
                <Icon name={isFashionOrInfluencer ? "shirt" : "sparkles"} className="w-8 h-8 mr-4 text-primary flex-shrink-0"/>
                <div><h2 className="text-xl md:text-2xl font-bold font-batangas text-text-primary">{isFashionOrInfluencer ? "Review Studio" : "Generated Results"}</h2><p className="text-sm text-text-secondary">{isFashionOrInfluencer ? "Select your best shots" : `${props.generatedImages.length} items created`}</p></div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <Button onClick={props.onReturnToSettings} variant="secondary" fullWidth><Icon name="settings" className="w-5 h-5 mr-2" />Back to Settings</Button>
            </div>
        </header>
        <main className="flex-grow flex flex-row overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {isFashionOrInfluencer ? ( <div className="p-4 md:p-6"><FashionReviewStudio images={props.generatedImages} onSetZoomedImage={props.onSetZoomedImage} onStartEdit={props.onStartEdit} onSaveModel={props.onSaveModel} onRemix={props.onRemix} isInfluencerMode={isInfluencer} /></div> ) : (
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6 p-4 md:p-8">
                        {props.generatedImages.map((image) => (
                            <div key={image.id} className="bg-white rounded-lg overflow-hidden shadow-md border border-slate-200 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group mb-6" style={{ breakInside: 'avoid' }}>
                                <div className="relative w-full bg-slate-50 cursor-zoom-in overflow-hidden" onClick={() => props.onSetZoomedImage(image)}><img src={image.imageUrl} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" alt="Result" /></div>
                                <div className="p-1 border-t border-slate-200 bg-white mt-auto">
                                    <div className="flex items-center justify-around">
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
            {detailPanelImage && <DetailPanel image={detailPanelImage} onClose={() => setDetailPanelImage(null)} onGenerateCaption={props.onGenerateCaption} generatingCaptionImageId={props.generatingCaptionImageId} onOpenABTestModal={props.onOpenABTestModal}/>}
        </main>
    </div>
  );
};

export const MainContent = React.memo(MainContentComponent);
