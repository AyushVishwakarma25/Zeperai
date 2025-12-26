
import React, { useState, useEffect } from 'react';
import type { GeneratedImage, GenerateCaptionParams, GenerateImageParams } from '../types';
import { AppMode } from '../types';
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
        className={`w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:text-primary hover:bg-slate-100 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
    >
        <Icon name={icon} className="w-5 h-5" />
    </button>
);

// --- COMPONENT 1: FASHION REVIEW STUDIO (Dedicated View) ---
const FashionReviewStudio: React.FC<{ 
    images: GeneratedImage[], 
    params: GenerateImageParams, 
    onSetZoomedImage: (img: GeneratedImage) => void,
    onAddToPosterBoard: (img: GeneratedImage) => void,
    onUpscale: (img: GeneratedImage) => void,
    upscalingImageId: string | null,
    onStartEdit: (img: GeneratedImage) => void,
}> = ({ images, params, onSetZoomedImage, onAddToPosterBoard, onUpscale, upscalingImageId, onStartEdit }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    // BUG FIX: Reset index if it's out of bounds after images array changes.
    useEffect(() => {
      if (activeIndex >= images.length) {
        setActiveIndex(0);
      }
    }, [images, activeIndex]);
    
    const activeImage = images[activeIndex];
    
    if (images.length === 0 || !activeImage) return null;

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 animate-fade-in overflow-hidden">
            {/* Sidebar Thumbnails */}
            <div className="w-full lg:w-20 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 scrollbar-hide flex-shrink-0">
                {images.map((img, idx) => (
                    <button 
                        key={img.id}
                        onClick={() => setActiveIndex(idx)}
                        className={`relative flex-shrink-0 w-14 lg:w-16 h-20 lg:h-22 rounded-lg overflow-hidden border-2 transition-all duration-300 ${activeIndex === idx ? 'border-primary ring-2 ring-primary/10 shadow-md scale-105 z-10' : 'border-transparent hover:border-slate-300'}`}
                    >
                        <img src={img.imageUrl} className="w-full h-full object-cover" alt={`Pose ${idx + 1}`} />
                        <div className="absolute top-0.5 left-0.5 bg-black/40 text-[8px] text-white px-1 rounded-sm font-bold">
                            {idx + 1}
                        </div>
                    </button>
                ))}
            </div>

            {/* Stage View */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col relative group max-h-[calc(100vh-12rem)]">
                <div className="flex-1 relative bg-slate-50 flex items-center justify-center overflow-hidden min-h-[300px]">
                    {activeImage && <img src={activeImage.imageUrl} className="max-w-full max-h-full object-contain cursor-zoom-in transition-transform duration-1000 group-hover:scale-105" onClick={() => onSetZoomedImage(activeImage)} alt="Active variation"/>}
                    {upscalingImageId === activeImage?.id && <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-10"><Spinner /><p className="mt-2 text-slate-600 font-bold uppercase tracking-widest text-[9px]">Scaling 4K...</p></div>}
                    <div className="absolute top-4 left-4 flex flex-col space-y-1.5"><div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center shadow-md"><Icon name="check-circle" className="w-2.5 h-2.5 mr-1.5 text-accent-green" />SEED: #{params.fashionGender}-STUDIO</div></div>
                </div>
                <div className="p-3 sm:p-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between bg-white gap-3">
                    <div className="flex items-center space-x-4"><div className="text-left"><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Engine Quality</p><div className="flex items-center text-accent-green font-black text-[9px]"><Icon name="magic-wand" className="w-2.5 h-2.5 mr-1" />Photorealistic AI</div></div></div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <Button variant="secondary" onClick={() => onStartEdit(activeImage)} className="!rounded-lg !px-3 !py-1.5 !text-[9px] flex-1 sm:flex-none uppercase font-black tracking-wider"><Icon name="edit" className="w-3 h-3 mr-1" />Edit</Button>
                        <Button onClick={() => onAddToPosterBoard(activeImage)} className="!rounded-lg shadow-md !px-5 !py-1.5 !bg-primary hover:!bg-primary-hover !text-[9px] flex-1 sm:flex-none uppercase font-black tracking-wider"><Icon name="bookmark" className="w-3 h-3 mr-1" />Save</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MainContent: React.FC<MainContentProps> = (props) => {
  const [detailPanelImage, setDetailPanelImage] = useState<GeneratedImage | null>(null);
  
  const isFashion = props.generatedImages.length > 0 && props.generatedImages[0].params.appMode === AppMode.Fashion;

  useEffect(() => {
    if (detailPanelImage) {
      const updatedImageInList = props.generatedImages.find(img => img.id === detailPanelImage.id);
      if (updatedImageInList && (updatedImageInList.imageUrl !== detailPanelImage.imageUrl || updatedImageInList.caption !== detailPanelImage.caption)) {
        setDetailPanelImage(updatedImageInList);
      }
    }
  }, [props.generatedImages, detailPanelImage]);

  if (props.isLoading) return null;

  if (props.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="bg-red-50 p-4 rounded-full mb-4"><Icon name="close" className="w-6 h-6 text-red-500" /></div>
          <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">Shoot Failed</h3>
          <p className="text-slate-500 max-w-sm text-[10px]">{props.error}</p>
          <Button onClick={props.onStartNew} variant="secondary" className="mt-4 !rounded-lg !px-6 !py-2 !text-xs">Retry Shoot</Button>
      </div>
    );
  }

  if (props.generatedImages.length === 0) {
    return <LivePreview params={props.params} productImageUrl={props.frontProductImagePreview} />;
  }

  // --- RENDER FASHION OR STANDARD DASHBOARD ---
  return (
    <div className="w-full h-full bg-white flex flex-col">
        {/* HEADER - Consistent across both views */}
        <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 md:p-6 border-b border-border-light gap-4">
            <div className="flex items-center w-full sm:w-auto">
                <Icon name={isFashion ? "shirt" : "sparkles"} className="w-8 h-8 mr-4 text-primary flex-shrink-0"/>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-text-primary">
                        {isFashion ? "Fashion Review Studio" : "Generated Results"}
                    </h2>
                    <p className="text-sm text-text-secondary">
                        {isFashion ? "Select your best shots" : `${props.generatedImages.length} items created`}
                    </p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <Button onClick={props.onStartNew} variant="secondary" fullWidth>
                    <Icon name="settings" className="w-5 h-5 mr-2" />
                    Back to Settings
                </Button>
            </div>
        </header>

        {/* MAIN CONTENT - Conditionally render grid or studio */}
        <main className="flex-grow flex flex-row overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {isFashion ? (
                    <div className="p-4 md:p-6">
                        <FashionReviewStudio 
                            images={props.generatedImages} 
                            params={props.params}
                            onSetZoomedImage={props.onSetZoomedImage}
                            onAddToPosterBoard={props.onAddToPosterBoard}
                            onUpscale={props.onUpscale}
                            upscalingImageId={props.upscalingImageId}
                            onStartEdit={props.onStartEdit}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4 md:p-8">
                        {props.generatedImages.map((image) => {
                            const isUpscaling = props.upscalingImageId === image.id;
                            return (
                                <div key={image.id} className="bg-white rounded-lg overflow-hidden shadow-md border border-slate-200 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                                    <div className="relative w-full bg-slate-50 cursor-zoom-in overflow-hidden" onClick={() => !isUpscaling && props.onSetZoomedImage(image)} style={{ aspectRatio: '4/5' }}>
                                        <img src={image.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Result" />
                                        {isUpscaling && (
                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-md">
                                                <Spinner />
                                                <p className="text-white text-[10px] font-black uppercase tracking-widest mt-2">Scaling...</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-1 border-t border-slate-200 bg-white mt-auto">
                                        <div className="flex items-center justify-around">
                                            <IconButton icon="board" label="Storyboard" onClick={(e) => { e.stopPropagation(); props.onSetStoryboardSource(image); }} />
                                            <IconButton icon="edit" label="Edit" onClick={(e) => { e.stopPropagation(); props.onStartEdit(image); }} />
                                            <IconButton icon="sparkles" label="Upscale" onClick={(e) => { e.stopPropagation(); props.onUpscale(image); }} disabled={!!props.upscalingImageId} />
                                            <IconButton icon="info" label="Details" onClick={(e) => { e.stopPropagation(); setDetailPanelImage(image); }} />
                                            <IconButton icon="bookmark" label="Save" onClick={(e) => { e.stopPropagation(); props.onAddToPosterBoard(image); }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {detailPanelImage && <DetailPanel image={detailPanelImage} onClose={() => setDetailPanelImage(null)} onGenerateCaption={props.onGenerateCaption} generatingCaptionImageId={props.generatingCaptionImageId} onOpenABTestModal={props.onOpenABTestModal}/>}
        </main>
    </div>
  );
};
