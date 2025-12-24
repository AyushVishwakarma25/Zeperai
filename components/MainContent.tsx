
import React, { useState, useEffect, useMemo } from 'react';
import type { GeneratedImage, GenerateCaptionParams, GenerateImageParams } from '../types';
import { AppMode, MarketplacePreset } from '../types';
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
        className={`w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
    >
        <Icon name={icon} className="w-3.5 h-3.5" />
    </button>
);

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
    const activeImage = images[activeIndex];
    
    if (images.length === 0) return null;

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 animate-fade-in px-2 overflow-hidden">
            {/* Sidebar Thumbnails - More compact */}
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

            {/* Stage View (Large Center View) - Capped height to prevent scrolling */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col relative group max-h-[580px]">
                <div className="flex-1 relative bg-slate-50 flex items-center justify-center overflow-hidden min-h-[300px]">
                    {activeImage && (
                        <img 
                            src={activeImage.imageUrl} 
                            className="max-w-full max-h-full object-contain cursor-zoom-in transition-transform duration-1000 group-hover:scale-105" 
                            onClick={() => onSetZoomedImage(activeImage)}
                            alt="Active variation"
                        />
                    )}
                    
                    {upscalingImageId === activeImage?.id && (
                         <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
                            <Spinner />
                            <p className="mt-2 text-slate-600 font-bold uppercase tracking-widest text-[9px]">Scaling 4K...</p>
                         </div>
                    )}

                    {/* Status Badges - Smaller and cleaner */}
                    <div className="absolute top-4 left-4 flex flex-col space-y-1.5">
                        <div className="bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center shadow-md">
                            <Icon name="check-circle" className="w-2.5 h-2.5 mr-1.5 text-accent-green" />
                            SEED: #{params.fashionGender}-STUDIO
                        </div>
                        {params.marketplacePreset !== MarketplacePreset.None && (
                             <div className="bg-primary/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-md flex items-center">
                                <Icon name="shopping-bag" className="w-2.5 h-2.5 mr-1.5" />
                                {params.marketplacePreset} READY
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action Bar - Compact */}
                <div className="p-3 sm:p-4 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between bg-white gap-3">
                    <div className="flex items-center space-x-4">
                        <div className="text-left">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Engine Quality</p>
                            <div className="flex items-center text-accent-green font-black text-[9px]">
                                <Icon name="magic-wand" className="w-2.5 h-2.5 mr-1" />
                                Photorealistic AI
                            </div>
                        </div>
                        <div className="h-6 w-px bg-slate-100 hidden sm:block" />
                        <div className="text-left hidden sm:block">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Progress</p>
                            <p className="font-black text-slate-900 text-[10px]">{activeIndex + 1} / {images.length}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <Button variant="secondary" onClick={() => onStartEdit(activeImage)} className="!rounded-lg !px-3 !py-1.5 !text-[9px] flex-1 sm:flex-none uppercase font-black tracking-wider">
                            <Icon name="edit" className="w-3 h-3 mr-1" />
                            Edit
                        </Button>
                        <Button variant="secondary" onClick={() => onUpscale(activeImage)} disabled={!!upscalingImageId} className="!rounded-lg shadow-sm !px-3 !py-1.5 !text-[9px] flex-1 sm:flex-none uppercase font-black tracking-wider">
                            <Icon name="sparkles" className="w-3 h-3 mr-1" />
                            Upscale
                        </Button>
                        <Button onClick={() => onAddToPosterBoard(activeImage)} className="!rounded-lg shadow-md !px-5 !py-1.5 !bg-primary hover:!bg-primary-hover !text-[9px] flex-1 sm:flex-none uppercase font-black tracking-wider">
                            <Icon name="bookmark" className="w-3 h-3 mr-1" />
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MainContent: React.FC<MainContentProps> = (props) => {
  const [detailPanelImage, setDetailPanelImage] = useState<GeneratedImage | null>(null);
  const isFashion = props.params.appMode === AppMode.Fashion;

  useEffect(() => {
    if (detailPanelImage) {
      const updatedImageInList = props.generatedImages.find(img => img.id === detailPanelImage.id);
      if (updatedImageInList && (updatedImageInList.imageUrl !== detailPanelImage.imageUrl || updatedImageInList.caption !== detailPanelImage.caption)) {
        setDetailPanelImage(updatedImageInList);
      }
    }
  }, [props.generatedImages, detailPanelImage]);

  const renderContent = () => {
    if (props.isLoading) return null;

    if (props.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <Icon name="close" className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">Shoot Failed</h3>
            <p className="text-slate-500 max-w-sm text-[10px]">{props.error}</p>
            <Button onClick={props.onStartNew} variant="secondary" className="mt-4 !rounded-lg !px-6 !py-2 !text-xs">Retry Shoot</Button>
        </div>
      );
    }

    if (props.generatedImages.length === 0) {
      return <LivePreview params={props.params} productImageUrl={props.frontProductImagePreview} />;
    }
    
    if (isFashion) {
        return <FashionReviewStudio 
            images={props.generatedImages} 
            params={props.params} 
            onSetZoomedImage={props.onSetZoomedImage}
            onAddToPosterBoard={props.onAddToPosterBoard}
            onUpscale={props.onUpscale}
            upscalingImageId={props.upscalingImageId}
            onStartEdit={props.onStartEdit}
        />;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
            {props.generatedImages.map((image, index) => {
                const isUpscaling = props.upscalingImageId === image.id;
                return (
                    <div 
                        key={image.id} 
                        className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col h-full group/card"
                    >
                        <div 
                            className="relative w-full bg-slate-50 cursor-zoom-in overflow-hidden"
                            onClick={() => !isUpscaling && props.onSetZoomedImage(image)}
                            style={{ aspectRatio: '4/5' }}
                        >
                            <img src={image.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" alt="Result" />
                            {isUpscaling && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-md">
                                    <Spinner />
                                    <p className="text-white text-[8px] font-black uppercase tracking-widest mt-1">Scaling...</p>
                                </div>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setDetailPanelImage(image); }}
                                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-slate-500 rounded-full hover:text-primary shadow-sm border border-white/50 transition-all opacity-0 group-hover/card:opacity-100"
                            >
                                <Icon name="info" className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="p-2 flex justify-between items-center bg-white border-t border-slate-50">
                            <IconButton icon="edit" label="Edit" onClick={() => props.onStartEdit(image)} />
                            <IconButton icon="sparkles" label="Upscale" onClick={() => props.onUpscale(image)} />
                            <IconButton icon="bookmark" label="Save" onClick={() => props.onAddToPosterBoard(image)} className="!text-primary !bg-primary/5" />
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-row relative">
        <div className="flex-1 flex flex-col py-2 h-full overflow-hidden">
             <header className="flex-shrink-0 flex justify-between items-center mb-4 px-2">
                <div>
                    <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase">Review Studio</h2>
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-3.5">Output Pipeline Active</p>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={props.onStartNew} variant="secondary" className="!px-4 !py-1.5 !rounded-full shadow-sm !text-[9px] !font-black uppercase tracking-widest border border-slate-200">
                        <Icon name="plus-circle" className="w-3.5 h-3.5 mr-1.5" />
                        New Shoot
                    </Button>
                </div>
            </header>
            <div className="flex-grow min-h-0 relative overflow-hidden">
              {renderContent()}
            </div>
        </div>
        
        {detailPanelImage && (
            <DetailPanel 
              image={detailPanelImage} 
              onClose={() => setDetailPanelImage(null)}
              onGenerateCaption={props.onGenerateCaption}
              generatingCaptionImageId={props.generatingCaptionImageId}
              onOpenABTestModal={props.onOpenABTestModal}
            />
        )}
    </div>
  );
};
