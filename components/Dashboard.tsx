
import React, { useState } from 'react';
import { Icon } from './ui/Icon';
import { AppMode, GeneratedImage } from '../types';
import { FloatingActionBar } from './FloatingActionBar';

interface ToolCardProps {
  iconName: string;
  title: string;
  onClick: () => void;
  isWide?: boolean;
  isLocked?: boolean;
  onUnlock?: () => void;
  onDrop?: (image: GeneratedImage) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ iconName, title, onClick, isWide, isLocked, onUnlock, onDrop }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        if (isLocked) return;
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (isLocked) return;
        e.preventDefault();
        setIsDraggingOver(false);
        const internalImageData = e.dataTransfer.getData('application/x-krackx-image');
        if (internalImageData && onDrop) {
            try {
                const image = JSON.parse(internalImageData);
                onDrop(image);
            } catch (err) {
                console.error("Failed to parse dropped image", err);
            }
        }
    };

    // Grid layout logic:
    // Wide cards: col-span-2
    // Regular cards: standard grid cell
    const spanClass = isWide ? 'col-span-2' : '';
    
    return (
        <button
            type="button"
            onClick={isLocked && onUnlock ? onUnlock : onClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative p-4 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm transition-all duration-300 cursor-pointer group flex w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${spanClass} ${isLocked ? 'opacity-90 hover:bg-slate-50 hover:ring-2 hover:ring-primary/20' : 'hover:bg-white/80 hover:shadow-md hover:scale-[1.02]'} ${isDraggingOver ? 'ring-2 ring-primary bg-primary/5 scale-105 z-10' : ''} ${isWide ? 'flex-row items-center h-auto min-h-[6rem]' : 'flex-col items-center text-center h-auto min-h-[8rem] justify-center'}`}
            aria-label={isLocked ? `${title} (Locked)` : title}
        >
            {isLocked && (
                <div className="absolute top-2 right-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-md z-10">
                    <Icon name="lock" className="w-3 h-3 mr-1" />
                    PRO
                </div>
            )}
            
            <div className={`rounded-full bg-white/50 p-3 flex-shrink-0 flex items-center justify-center shadow-inner transition-all ${isWide ? 'mr-4 w-12 h-12' : 'mb-3 w-14 h-14'} ${isLocked ? 'grayscale opacity-70' : ''} ${isDraggingOver ? 'bg-primary text-white' : ''}`}>
                 <Icon name={iconName} className={`w-8 h-8 transition-colors ${isDraggingOver ? 'text-white' : 'text-slate-700'}`} />
            </div>
            
            <div className={`flex flex-col ${isWide ? 'items-start text-left' : 'items-center text-center'}`}>
                <h4 className={`font-bold text-sm text-text-primary ${isDraggingOver ? 'text-primary' : ''}`}>{title}</h4>
            </div>
            
            {isDraggingOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="animate-ping absolute h-8 w-8 rounded-full bg-primary/20 opacity-75"></div>
                </div>
            )}
        </button>
    );
};


const VerticalCategoryCard: React.FC<{ title: string; children: React.ReactNode; className?: string; titleClassName?: string }> = ({ title, children, className, titleClassName = 'text-white' }) => (
    <div className={`p-4 rounded-3xl flex flex-col ${className} shadow-lg border border-white/20 h-full`}>
        <h2 className={`text-xl font-bold mb-4 text-center ${titleClassName}`}>{title}</h2>
        <div className="grid grid-cols-2 gap-3 h-full content-start">
            {children}
        </div>
    </div>
);


interface DashboardProps {
  onSelectMode: (tool: AppMode) => void;
  onStartImageEdit: (image?: GeneratedImage) => void;
  onOpenFeedbackModal: () => void;
  onOpenPricingModal: () => void;
  onToggleSidebar: () => void;
  floatingPrompt: string;
  onFloatingPromptChange: (value: string) => void;
  floatingImagePreview: string | null;
  onFloatingGenerate: () => void;
  onRemoveFloatingImage: () => void;
  onTriggerFloatingUpload: () => void;
  onOpenContentGenerator: () => void;
  userTier?: 'Free' | 'Starter' | 'Standard' | 'Agency';
  isAdmin?: boolean;
  userName?: string;
  onInternalImageDrop: (image: GeneratedImage, targetMode?: AppMode) => void;
  isLoading: boolean;
}

interface HeaderProps {
    onOpenFeedbackModal: () => void;
    onOpenPricingModal: () => void;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenFeedbackModal, onOpenPricingModal, onToggleSidebar }) => (
    <header className="flex-shrink-0 flex items-center p-4 md:p-6">
        <button onClick={onToggleSidebar} className="p-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
            <Icon name="menu" className="w-6 h-6" />
        </button>
        <div className='ml-auto flex items-center space-x-2 md:space-x-4'>
            <button 
                onClick={onOpenFeedbackModal}
                className="px-3 py-2 text-xs sm:text-sm font-semibold text-text-secondary bg-white border border-border-light rounded-lg hover:bg-gray-50 transition-colors">
                Feedback
            </button>
            <button 
                onClick={onOpenPricingModal}
                className="px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-primary to-purple-500 rounded-lg hover:opacity-90 transition-opacity shadow-md">
                Launch Offer — Upgrade Now 🐝
            </button>
        </div>
    </header>
);

interface DashboardHomeProps {
  onSelectMode: (tool: AppMode) => void;
  onStartImageEdit: (image?: GeneratedImage) => void;
  onOpenContentGenerator: () => void;
  floatingPrompt: string;
  onFloatingPromptChange: (value: string) => void;
  floatingImagePreview: string | null;
  onFloatingGenerate: () => void;
  onRemoveFloatingImage: () => void;
  onTriggerFloatingUpload: () => void;
  isLoading: boolean;
  userTier?: 'Free' | 'Starter' | 'Standard' | 'Agency';
  onOpenPricingModal: () => void;
  isAdmin?: boolean;
  userName?: string;
  onInternalImageDrop: (image: GeneratedImage, targetMode?: AppMode) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ 
    onSelectMode, 
    onStartImageEdit, 
    onOpenContentGenerator,
    floatingPrompt,
    onFloatingPromptChange,
    floatingImagePreview,
    onFloatingGenerate,
    onRemoveFloatingImage,
    onTriggerFloatingUpload,
    isLoading,
    userTier = 'Free', 
    onOpenPricingModal,
    isAdmin = false,
    userName = 'there',
    onInternalImageDrop,
}) => {

    const isProLocked = !isAdmin && (userTier === 'Free' || userTier === 'Starter');

    const ecommerceTools = [
        { id: AppMode.Product, title: 'Product Photoshoot', iconName: 'camera' },
        { id: AppMode.Fashion, title: 'Fashion Photoshoot', iconName: 'shirt' },
    ];
    const marketingTools = [
        { id: AppMode.AdCreative, title: 'Ads Generator', iconName: 'megaphone' },
        { id: AppMode.Influencer, title: 'Influencer Campaign', iconName: 'user' },
        { id: AppMode.Festival, title: 'Festival Shoot', iconName: 'lamp' },
        { id: AppMode.Remix, title: 'Image Remix', iconName: 'swap' },
    ];
    const otherTools = [
      { id: 'bg-remover', title: 'Background Remover', iconName: 'magic-wand', action: onStartImageEdit },
      { 
          id: 'ai-writer', 
          title: 'AI Writer', 
          iconName: 'pencil-sparkles', 
          action: onOpenContentGenerator, 
          isLocked: isProLocked
      },
    ];

    const handleToolClick = (toolId: string) => {
        if (Object.values(AppMode).includes(toolId as AppMode)) {
            onSelectMode(toolId as AppMode);
        }
    };

    const handleInternalDrop = (image: GeneratedImage, toolId: string) => {
        if (Object.values(AppMode).includes(toolId as AppMode)) {
            onInternalImageDrop(image, toolId as AppMode);
        } else if (toolId === 'bg-remover') {
            onStartImageEdit(image);
        }
    };

    return (
      <div className="py-2">
        <h1 className="text-3xl font-bold text-text-primary text-center">What are we creating today, {userName}?</h1>
        <div className="max-w-3xl mx-auto mt-4 mb-4">
            <FloatingActionBar 
                prompt={floatingPrompt}
                onPromptChange={onFloatingPromptChange}
                imagePreviewUrl={floatingImagePreview}
                onUploadClick={onTriggerFloatingUpload}
                onRemoveImage={onRemoveFloatingImage}
                onGenerate={onFloatingGenerate}
                isGenerating={isLoading}
            />
        </div>

        <div className="p-4 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
                <VerticalCategoryCard title="Ecommerce" className="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200" titleClassName="text-white">
                     {ecommerceTools.map(tool => (
                        <ToolCard 
                            key={tool.id} 
                            onClick={() => handleToolClick(tool.id)} 
                            onDrop={(img) => handleInternalDrop(img, tool.id)}
                            {...tool} 
                        />
                     ))}
                </VerticalCategoryCard>
                <VerticalCategoryCard title="Marketing" className="bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-purple-200" titleClassName="text-white">
                    {marketingTools.map(tool => (
                        <ToolCard 
                            key={tool.id} 
                            onClick={() => handleToolClick(tool.id)} 
                            onDrop={(img) => handleInternalDrop(img, tool.id)}
                            {...tool} 
                        />
                    ))}
                </VerticalCategoryCard>
                 <VerticalCategoryCard title="Other" className="bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-200" titleClassName="text-white">
                    {otherTools.map(tool => (
                        <ToolCard 
                            key={tool.id} 
                            onClick={tool.action ? tool.action : () => handleToolClick(tool.id)} 
                            onDrop={(img) => handleInternalDrop(img, tool.id)}
                            {...tool} 
                            isLocked={tool.isLocked}
                            onUnlock={onOpenPricingModal}
                        />
                    ))}
                </VerticalCategoryCard>
            </div>
        </div>
      </div>
    )
};


const DashboardComponent: React.FC<DashboardProps> = (props) => {
    return (
        <main className="relative w-full h-full flex flex-col overflow-hidden">
            <Header onOpenFeedbackModal={props.onOpenFeedbackModal} onOpenPricingModal={props.onOpenPricingModal} onToggleSidebar={props.onToggleSidebar} />
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-[1fr_minmax(0,64rem)_1fr]">
                    <div />
                    <div className="px-4 md:px-8 lg:px-12">
                        <DashboardHome {...props} />
                    </div>
                    <div />
                </div>
            </div>
        </main>
    );
};

export const Dashboard = React.memo(DashboardComponent);
