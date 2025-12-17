
import React from 'react';
import { Icon } from './ui/Icon';
import { AppMode, GenerateImageParams, GeneratedImage, GenerateCaptionParams } from '../types';
import { MainContent } from './MainContent';
import { FloatingActionBar } from './FloatingActionBar';

interface ToolCardProps {
  iconName: string;
  title: string;
  onClick: () => void;
  isWide?: boolean;
  isLocked?: boolean;
  onUnlock?: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ iconName, title, onClick, isWide, isLocked, onUnlock }) => (
    <button
        onClick={isLocked && onUnlock ? onUnlock : onClick}
        className={`relative p-3 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm transition-all duration-300 cursor-pointer group w-full flex items-center ${isWide ? 'col-span-2 flex-row justify-start pl-4' : 'flex-col justify-center h-32'} ${isLocked ? 'opacity-90 hover:bg-slate-50 hover:ring-2 hover:ring-primary/20' : 'hover:bg-white/80 hover:shadow-md hover:scale-105'}`}
    >
        {isLocked && (
            <div className="absolute top-2 right-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-md z-10">
                <Icon name="lock" className="w-3 h-3 mr-1" />
                PRO
            </div>
        )}
        <div className={`rounded-full bg-white/50 p-3 mb-2 flex items-center justify-center shadow-inner ${isWide ? 'mr-3 mb-0 w-12 h-12' : 'w-14 h-14'} ${isLocked ? 'grayscale opacity-70' : ''}`}>
             <Icon name={iconName} className="w-8 h-8 text-slate-700" />
        </div>
        <h4 className={`font-semibold text-sm ${isWide ? 'text-text-primary text-left' : 'text-text-primary text-center'}`}>{title}</h4>
    </button>
);


const VerticalCategoryCard: React.FC<{ title: string; children: React.ReactNode; className?: string; titleClassName?: string }> = ({ title, children, className, titleClassName = 'text-white' }) => (
    <div className={`p-4 rounded-3xl flex flex-col ${className} shadow-lg border border-white/20`}>
        <h2 className={`text-xl font-bold mb-4 text-center ${titleClassName}`}>{title}</h2>
        <div className="grid grid-cols-2 gap-3">
            {children}
        </div>
    </div>
);


interface DashboardProps {
  onSelectMode: (tool: AppMode) => void;
  generatedImages: GeneratedImage[];
  onClearGeneration: () => void;
  params: GenerateImageParams;
  frontProductImagePreview: string | null;
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
  onStartImageEdit: () => void;
  onStartImageUpscale: () => void;
  onOpenFeedbackModal: () => void;
  onOpenPricingModal: () => void;
  onToggleSidebar: () => void;
  // Floating Action Bar Props
  floatingPrompt: string;
  onFloatingPromptChange: (value: string) => void;
  floatingImagePreview: string | null;
  onFloatingGenerate: () => void;
  onRemoveFloatingImage: () => void;
  onTriggerFloatingUpload: () => void;
  onOpenContentGenerator: () => void;
  userTier?: 'Free' | 'Starter' | 'Standard' | 'Agency';
  isAdmin?: boolean;
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
  onStartImageEdit: () => void;
  onStartImageUpscale: () => void;
  onOpenContentGenerator: () => void;
  // Generation Bar Props
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
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ 
    onSelectMode, 
    onStartImageEdit, 
    onStartImageUpscale,
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
    isAdmin = false
}) => {

    // Feature Locking Logic:
    // If Admin: NO locks.
    // If not Admin: Starter has locks on AI Writer & Upscale. Standard+ has no locks.
    const isProLocked = !isAdmin && (userTier === 'Free' || userTier === 'Starter');

    const ecommerceTools = [
        { id: AppMode.Product, title: 'Product Photoshoot', iconName: 'camera' },
        { id: AppMode.Fashion, title: 'Fashion Photoshoot', iconName: 'shirt' }, 
        { id: AppMode.Amazon, title: 'Amazon Catalogue', iconName: 'shopping-bag', isWide: true },
    ];
    const marketingTools = [
        { id: AppMode.AdCreative, title: 'Ads Generator', iconName: 'megaphone' },
        { id: AppMode.Youtube, title: 'Youtube Thumbnail', iconName: 'youtube-play' },
        { id: AppMode.Banner, title: 'Banner', iconName: 'layout-banner', isWide: true },
    ];
    const otherTools = [
      { id: AppMode.Festival, title: 'Festival Shoot', iconName: 'lamp', isWide: true },
      { id: 'bg-remover', title: 'Background Remover', iconName: 'magic-wand', action: onStartImageEdit },
      // Upscale is now a "Pro" feature in this pricing model example
      { 
          id: 'upscale', 
          title: 'Upscale Image', 
          iconName: 'trending-up', 
          action: onStartImageUpscale, 
          isLocked: isProLocked // Lock upscale for Starter/Free
      },
      { 
          id: 'ai-writer', 
          title: 'AI Writer', 
          iconName: 'pencil-sparkles', 
          action: onOpenContentGenerator, 
          isWide: true,
          isLocked: isProLocked // Lock writer for Starter/Free
      },
    ];

    const handleToolClick = (toolId: string) => {
        if (Object.values(AppMode).includes(toolId as AppMode)) {
            onSelectMode(toolId as AppMode);
        }
    };

    return (
      <div className="py-8">
        <h1 className="text-3xl font-bold text-text-primary text-center">What are we creating today, Ayush?</h1>
        <div className="max-w-3xl mx-auto mt-4 mb-8">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <VerticalCategoryCard title="Ecommerce" className="bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200" titleClassName="text-white">
                     {ecommerceTools.map(tool => (
                        <ToolCard 
                            key={tool.id} 
                            onClick={() => handleToolClick(tool.id)} 
                            {...tool} 
                        />
                     ))}
                </VerticalCategoryCard>
                <VerticalCategoryCard title="Marketing" className="bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-purple-200" titleClassName="text-white">
                    {marketingTools.map(tool => (
                        <ToolCard 
                            key={tool.id} 
                            onClick={() => handleToolClick(tool.id)} 
                            {...tool} 
                        />
                    ))}
                </VerticalCategoryCard>
                 <VerticalCategoryCard title="Other" className="bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-200" titleClassName="text-white">
                    {otherTools.map(tool => (
                        <ToolCard 
                            key={tool.id} 
                            onClick={tool.action ? tool.action : () => handleToolClick(tool.id)} 
                            {...tool} 
                            isLocked={tool.isLocked}
                            onUnlock={onOpenPricingModal} // Pass the unlock handler
                        />
                    ))}
                </VerticalCategoryCard>
            </div>
        </div>
      </div>
    )
};


export const Dashboard: React.FC<DashboardProps> = (props) => {
    
    return (
        <main className="relative w-full h-full overflow-y-auto">
            <Header onOpenFeedbackModal={props.onOpenFeedbackModal} onOpenPricingModal={props.onOpenPricingModal} onToggleSidebar={props.onToggleSidebar} />
             {/* 
                This is the new wrapper for stable centering. 
                It uses a 3-column grid. The outer columns are flexible (1fr) and act as gutters.
                The center column has a max width (64rem = max-w-5xl), ensuring the content within it doesn't shift 
                when the parent container resizes due to the sidebar changing width.
            */}
            <div className="grid grid-cols-[1fr_minmax(0,64rem)_1fr]">
                <div /> {/* Left gutter */}
                
                {/* All content is now placed inside this center column */}
                <div className="px-4 md:px-8 lg:px-12">
                    {props.generatedImages.length > 0 ? (
                        <MainContent 
                            {...props}
                            onStartNew={props.onClearGeneration}
                        />
                    ) : (
                        <DashboardHome 
                            onSelectMode={props.onSelectMode}
                            onStartImageEdit={props.onStartImageEdit}
                            onStartImageUpscale={props.onStartImageUpscale}
                            onOpenContentGenerator={props.onOpenContentGenerator}
                            floatingPrompt={props.floatingPrompt}
                            onFloatingPromptChange={props.onFloatingPromptChange}
                            floatingImagePreview={props.floatingImagePreview}
                            onFloatingGenerate={props.onFloatingGenerate}
                            onRemoveFloatingImage={props.onRemoveFloatingImage}
                            onTriggerFloatingUpload={props.onTriggerFloatingUpload}
                            isLoading={props.isLoading}
                            userTier={props.userTier}
                            onOpenPricingModal={props.onOpenPricingModal}
                            isAdmin={props.isAdmin}
                        />
                    )}
                </div>

                <div /> {/* Right gutter */}
            </div>
        </main>
    );
};
