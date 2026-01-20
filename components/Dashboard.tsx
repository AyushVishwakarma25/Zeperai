
import React from 'react';
import { Icon } from './ui/Icon';
import { AppMode, GeneratedImage } from '../types';
import { FloatingActionBar } from './FloatingActionBar';

interface ColorfulCardProps {
  title: string;
  subtitle: string;
  color: string;
  textColor: string;
  iconName: string;
  onClick: () => void;
  isLocked?: boolean;
  onUnlock?: () => void;
}

const ColorfulCard: React.FC<ColorfulCardProps> = ({ title, subtitle, color, textColor, iconName, onClick, isLocked, onUnlock }) => {
    return (
        <button
            type="button"
            onClick={isLocked && onUnlock ? onUnlock : onClick}
            className={`relative overflow-hidden w-full h-28 sm:h-32 rounded-2xl p-4 sm:p-5 text-left flex items-center justify-between transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md group`}
            style={{ backgroundColor: color }}
        >
            <div className="z-10 flex flex-col justify-center h-full mr-2">
                <h3 className={`font-batangas font-bold text-base sm:text-lg uppercase leading-tight tracking-wide ${textColor}`}>
                    {title}
                </h3>
                <p className={`font-poppins font-normal text-[10px] sm:text-xs mt-1 opacity-90 ${textColor} line-clamp-2`}>
                    {subtitle}
                </p>
            </div>
            
            <div className="h-12 w-12 sm:h-14 sm:w-14 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm z-10 flex-shrink-0 group-hover:rotate-6 transition-transform">
                {isLocked ? (
                    <Icon name="lock" className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                ) : (
                    <Icon name={iconName} className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                )}
            </div>

            {/* Decorative background circle */}
            <div className="absolute -right-4 -bottom-8 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:bg-white/20 transition-colors"></div>
        </button>
    );
};

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
  onFloatingImageDrop: (file: File) => void;
  isLoading: boolean;
  floatingMode?: AppMode;
  onFloatingModeChange?: (mode: AppMode) => void;
}

interface HeaderProps {
    onOpenFeedbackModal: () => void;
    onOpenPricingModal: () => void;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenFeedbackModal, onOpenPricingModal, onToggleSidebar }) => (
    <header className="flex-shrink-0 flex items-center p-4 md:p-6 pb-2">
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

const DashboardHome: React.FC<DashboardProps> = ({ 
    onSelectMode, 
    onStartImageEdit, 
    onOpenContentGenerator,
    floatingPrompt,
    onFloatingPromptChange,
    floatingImagePreview,
    onFloatingGenerate,
    onRemoveFloatingImage,
    onTriggerFloatingUpload,
    onFloatingImageDrop,
    isLoading,
    userTier = 'Free', 
    onOpenPricingModal,
    isAdmin = false,
    userName = 'there',
    floatingMode,
    onFloatingModeChange
}) => {

    const isProLocked = !isAdmin && (userTier === 'Free');

    const tools = [
        {
            title: 'Product Studio',
            subtitle: 'Studio-ready product visuals',
            color: '#5071FF',
            textColor: 'text-white',
            iconName: 'camera',
            onClick: () => onSelectMode(AppMode.Product)
        },
        {
            title: 'AI UGC Influencer',
            subtitle: 'Generate diverse models',
            color: '#8F1EAE',
            textColor: 'text-white',
            iconName: 'user',
            onClick: () => onSelectMode(AppMode.Influencer)
        },
        {
            title: 'Fashion Studio',
            subtitle: 'On-model clothing shoots',
            color: '#010100',
            textColor: 'text-white',
            iconName: 'shirt',
            onClick: () => onSelectMode(AppMode.Fashion)
        },
        {
            title: 'Ad Generator + BI',
            subtitle: 'Predictive creative analytics',
            color: '#C0E957',
            textColor: 'text-slate-900',
            iconName: 'megaphone',
            onClick: () => onSelectMode(AppMode.AdCreative)
        },
        {
            title: 'AI Content Writer',
            subtitle: 'Captions & copy in seconds',
            color: '#816FE6',
            textColor: 'text-white',
            iconName: 'pencil-sparkles',
            onClick: onOpenContentGenerator,
            isLocked: isProLocked,
            onUnlock: onOpenPricingModal
        },
        {
            title: 'Image Restyle',
            subtitle: 'Remix & modify visuals',
            color: '#82F0E1',
            textColor: 'text-slate-900',
            iconName: 'refresh',
            onClick: () => onSelectMode(AppMode.Remix)
        },
        {
            title: 'Background Remover',
            subtitle: 'Instant clean cutouts',
            color: '#F6C796',
            textColor: 'text-slate-900',
            iconName: 'magic-wand',
            onClick: () => onStartImageEdit()
        },
        {
            title: 'Festive Photoshoot',
            subtitle: 'Seasonal themes & props',
            color: '#EBD5AF',
            textColor: 'text-slate-900',
            iconName: 'lamp',
            onClick: () => onSelectMode(AppMode.Festival)
        }
    ];

    return (
      <div className="py-2 pb-8">
        <h1 className="text-2xl md:text-3xl font-batangas font-bold text-text-primary text-center">What are we creating today, {userName}?</h1>
        
        <div className="max-w-3xl mx-auto mt-6 mb-8">
            <FloatingActionBar 
                prompt={floatingPrompt}
                onPromptChange={onFloatingPromptChange}
                imagePreviewUrl={floatingImagePreview}
                onUploadClick={onTriggerFloatingUpload}
                onRemoveImage={onRemoveFloatingImage}
                onGenerate={onFloatingGenerate}
                onImageDrop={onFloatingImageDrop}
                isGenerating={isLoading}
                floatingMode={floatingMode}
                onFloatingModeChange={onFloatingModeChange}
            />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-5 max-w-7xl mx-auto">
            {tools.map((tool) => (
                <ColorfulCard 
                    key={tool.title}
                    {...tool}
                />
            ))}
        </div>
      </div>
    )
};

const DashboardComponent: React.FC<DashboardProps> = (props) => {
    return (
        <main className="relative w-full h-full flex flex-col overflow-hidden bg-main">
            <Header onOpenFeedbackModal={props.onOpenFeedbackModal} onOpenPricingModal={props.onOpenPricingModal} onToggleSidebar={props.onToggleSidebar} />
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
                <div className="px-4 md:px-8 lg:px-8">
                    <DashboardHome {...props} />
                </div>
            </div>
        </main>
    );
};

export const Dashboard = React.memo(DashboardComponent);
