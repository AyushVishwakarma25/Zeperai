
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './ui/Icon';
import { AppMode, GeneratedImage } from '../types';

interface ColorfulCardProps {
  title: string;
  description: string;
  color: string;
  accentColor: string;
  iconName: string;
  thumbnail?: string;
  onClick: () => void;
  isLocked?: boolean;
  onUnlock?: () => void;
}

const ColorfulCard: React.FC<ColorfulCardProps> = ({ title, description, color, accentColor, iconName, thumbnail, onClick, isLocked, onUnlock }) => {
    return (
        <button
            type="button"
            onClick={isLocked && onUnlock ? onUnlock : onClick}
            className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 h-full text-left min-h-[220px]"
        >
            {/* Header Section (Colored) */}
            <div 
                className="h-28 sm:h-32 relative overflow-hidden flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: color }}
            >
                {thumbnail && !isLocked ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img 
                      src={thumbnail} 
                      alt={title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                  </div>
                ) : (
                  <div className="relative w-14 h-14 bg-white rounded-xl shadow-md transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 flex items-center justify-center">
                      {isLocked ? (
                          <Icon name="lock" className="w-6 h-6 text-slate-400" />
                      ) : (
                          <div style={{ color: accentColor }}>
                              <Icon name={iconName} className="w-7 h-7" />
                          </div>
                      )}
                      {isLocked && (
                          <div className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white">PRO</div>
                      )}
                  </div>
                )}
            </div>

            {/* Body Section (White) */}
            <div className="p-4 flex flex-col flex-grow w-full">
                <h3 className="text-base font-bold mb-1 text-slate-900 group-hover:text-primary transition-colors tracking-tight">
                    {title}
                </h3>
                <p className="text-slate-500 text-xs mb-3 flex-grow leading-relaxed font-medium line-clamp-2">
                    {description}
                </p>
                
                <div className="flex items-center justify-end mt-auto">
                    <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary transition-all duration-300 shadow-sm">
                        <Icon name="arrow-left" className="w-3.5 h-3.5 text-slate-900 group-hover:text-white rotate-180 transition-colors" />
                    </div>
                </div>
            </div>
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
  userTier?: 'Free' | 'PayAsYouGo';
  userName?: string;
  onInternalImageDrop: (image: GeneratedImage, targetMode?: AppMode) => void;
  onFloatingImageDrop: (file: File) => void;
  isLoading: boolean;
  floatingMode?: AppMode;
  onFloatingModeChange?: (mode: AppMode) => void;
  onShowDevMessage?: (feature: string) => void;
}

interface HeaderProps {
    onOpenFeedbackModal: () => void;
    onOpenPricingModal: () => void;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenFeedbackModal, onOpenPricingModal, onToggleSidebar }) => (
    <header className="flex-shrink-0 flex items-center px-4 md:px-6 py-3">
        <button onClick={onToggleSidebar} className="p-2 rounded-md text-text-secondary hover:bg-gray-100 lg:hidden">
            <Icon name="menu" className="w-6 h-6" />
        </button>
        <div className='ml-auto flex items-center space-x-2 md:space-x-4'>
            <button 
                onClick={onOpenFeedbackModal}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-text-secondary bg-white border border-border-light rounded-lg hover:bg-gray-50 transition-colors">
                Feedback
            </button>
            <button 
                onClick={onOpenPricingModal}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-primary to-purple-500 rounded-lg hover:opacity-90 transition-opacity shadow-md">
                Launch Offer — Upgrade Now 🐝
            </button>
        </div>
    </header>
);

const DashboardHome: React.FC<DashboardProps> = ({ 
    onSelectMode, 
    onStartImageEdit, 
    onOpenContentGenerator,
    userTier = 'Free', 
    onOpenPricingModal,
    userName = 'there',
    onShowDevMessage
}) => {
    const navigate = useNavigate();
    const isProLocked = (userTier === 'Free');

    // Updated colors using the requested palette:
    // card-purple: #EAE3FD
    // card-pink: #FCD8FC
    // card-sage: #B8CF8A
    // card-tan: #E1D9CC
    // card-teal: #3BC1A8

    const tools = [
        {
            title: 'Product Studio',
            description: 'Generate professional-grade product visuals for your e-commerce store in seconds.',
            color: '#EAE3FD', // card-purple
            accentColor: '#6366F1', // indigo-500
            iconName: 'camera',
            thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Dashboard%20thumbnails/Product%20shoot%20dashboard.webp',
            onClick: () => onSelectMode(AppMode.Product)
        },
        {
            title: 'AI UGC Influencer',
            description: 'Create diverse, realistic influencer content without the logistical overhead.',
            color: '#FCD8FC', // card-pink
            accentColor: '#EC4899', // pink-500
            iconName: 'user',
            thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Dashboard%20thumbnails/Ai%20ugc%20influencer.webp',
            onClick: () => onSelectMode(AppMode.Influencer)
        },
        {
            title: 'Fashion Studio',
            description: 'On-model clothing shoots powered by generative AI. Scale your catalog instantly.',
            color: '#B8CF8A', // card-sage
            accentColor: '#166534', // green-700
            iconName: 'shirt',
            thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Dashboard%20thumbnails/Fashion%20Studio.webp',
            onClick: () => onSelectMode(AppMode.Fashion)
        },
        {
            title: 'Ad Creative Generator',
            description: 'Predictive creative analytics paired with automated high-converting ad layouts.',
            color: '#E1D9CC', // card-tan
            accentColor: '#C2410C', // orange-700
            iconName: 'megaphone',
            onClick: () => onSelectMode(AppMode.AdCreative)
        },
        {
            title: 'AI Content Writer',
            description: 'High-converting captions, ad copies, and blog posts generated in seconds.',
            color: '#EAE3FD', // card-purple (Reusing for content/creative vibe)
            accentColor: '#7C3AED', // violet-600
            iconName: 'pencil-sparkles',
            onClick: onOpenContentGenerator,
            isLocked: isProLocked,
            onUnlock: onOpenPricingModal
        },
        {
            title: 'Background Remover',
            description: 'Instant pixel-perfect clean cutouts for any product or lifestyle image.',
            color: '#FCD8FC', // card-pink (Reusing for edit/utility)
            accentColor: '#BE185D', // pink-700
            iconName: 'magic-wand',
            onClick: () => navigate('/tools/background-remover')
        },
        {
            title: 'Image Restyle',
            description: 'Remix and modify visuals using advanced AI style transfer techniques.',
            color: '#3BC1A8', // card-teal
            accentColor: '#0F766E', // teal-700
            iconName: 'image-plus', 
            onClick: () => onSelectMode(AppMode.Remix)
        },
        {
            title: 'Festive Photoshoot',
            description: 'Seasonal themes and props. Transform your products for any holiday instantly.',
            color: '#E1D9CC', // card-tan
            accentColor: '#B45309', // amber-700
            iconName: 'lamp',
            thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/Dashboard%20thumbnails/festive%20shot.webp',
            onClick: () => onSelectMode(AppMode.Festival)
        }
    ];

    return (
      <div className="py-1 pb-8">
        <h1 className="text-xl md:text-2xl font-batangas font-bold text-text-primary text-center mb-5">What are we creating today, {userName}?</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-[1600px] mx-auto mb-10 px-2 sm:px-4">
            {tools.map((tool) => (
                <ColorfulCard 
                    key={tool.title}
                    {...tool}
                />
            ))}
        </div>

        {/* Brand Boost CTA Banner */}
        <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-slate-900 text-white relative overflow-hidden text-center max-w-[1600px] mx-auto shadow-xl mx-4">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary blur-[120px]"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400 blur-[120px]"></div>
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Ready to boost your brand?</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={onOpenPricingModal}
                        className="w-full sm:w-auto px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-full transition-all backdrop-blur-sm transform hover:-translate-y-0.5"
                    >
                        View Pricing
                    </button>
                </div>
            </div>
        </div>
      </div>
    )
};

const DashboardComponent: React.FC<DashboardProps> = (props) => {
    return (
        <main className="relative w-full h-full flex flex-col overflow-hidden bg-white">
            <Header onOpenFeedbackModal={props.onOpenFeedbackModal} onOpenPricingModal={props.onOpenPricingModal} onToggleSidebar={props.onToggleSidebar} />
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 bg-white">
                <div className="px-4 md:px-6 lg:px-8 pt-2">
                    <DashboardHome {...props} />
                </div>
            </div>
        </main>
    );
};

export const Dashboard = React.memo(DashboardComponent);
