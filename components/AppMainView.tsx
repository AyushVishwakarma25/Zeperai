
import React, { Suspense, lazy } from 'react';
import { MainContent } from './MainContent';
import { Dashboard } from './Dashboard';
import { MyDesigns } from './MyDesigns';
import { Spinner } from './ui/Spinner';
import type { GenerateImageParams, GeneratedImage, InspirationItem, ShopifyAnalysisResult, GenerateCaptionParams, BrandKit } from '../types';
import type { UserProfileData } from '../services/userService';
import { AppMode, View } from '../types';

// Lazy load larger views
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));
const ShopifyDashboard = lazy(() => import('./ShopifyDashboard'));
const ProfilePage = lazy(() => import('./ProfilePage'));
const InspirationPage = lazy(() => import('./InspirationPage'));

interface AppMainViewProps {
    currentView: View;
    generatedImages: GeneratedImage[];
    isLoading: boolean;
    error: string | null;
    params: GenerateImageParams;
    frontProductImagePreview: string | null;
    
    // Actions
    onSelectMode: (mode: AppMode) => void;
    onStartEdit: (image?: GeneratedImage) => void;
    onReturnToSettings: () => void;
    onSetStoryboardSource: (image: GeneratedImage) => void;
    onSetZoomedImage: (image: GeneratedImage) => void;
    onGenerateCaption: (imageId: string, params: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => void;
    generatingCaptionImageId: string | null;
    onOpenABTestModal: (image: GeneratedImage) => void;
    onSaveModel: (image: GeneratedImage) => void;
    
    // Dashboard Specific
    onOpenFeedbackModal: () => void;
    onOpenPricingModal: () => void;
    onToggleSidebar: () => void;
    user: UserProfileData | null;
    floatingPrompt: string;
    setFloatingPrompt: (val: string) => void;
    floatingImagePreview: string | null;
    onFloatingGenerate: () => void;
    onRemoveFloatingImage: () => void;
    onTriggerFloatingUpload: () => void;
    onOpenContentGenerator: () => void;
    onOpenCreativeWorkflow: () => void;
    userTier: 'Free' | 'Starter' | 'Standard' | 'Agency';
    onInternalImageDrop: (image: GeneratedImage, targetMode?: AppMode) => void;
    onFloatingImageDrop: (file: File) => void;
    floatingMode: AppMode;
    setFloatingMode: (mode: AppMode) => void;
    isStoryBoardResult: boolean;
    onShowDevMessage?: (feature: string) => void;

    // Analytics & Shopify
    onSetView: (view: View) => void;
    shopifyReport: ShopifyAnalysisResult | null;
    isShopifyReportLoaded: boolean;
    onReportUpdate: (report: ShopifyAnalysisResult | null) => void;
    onGenerateAdFromShopify: (productName: string) => void;
    onDeductCredits: (cost: number) => boolean;

    // My Designs & Inspiration
    onRemix: (item: InspirationItem | GeneratedImage) => void;
    inspirationItems: InspirationItem[];
    isInspirationLoaded: boolean;
    onItemsLoaded: (items: InspirationItem[]) => void;

    // Profile
    credits: number;
    onOpenProfileEdit: () => void;
    recentActivity: any[];
    brandKit: BrandKit | null;
    onGenerate: (params: GenerateImageParams) => void;
}

export const AppMainView: React.FC<AppMainViewProps> = (props) => {
    
    // 1. Show MainContent (Results) if active
    if (props.currentView === View.Dashboard && (props.generatedImages.length > 0 || props.isLoading || props.error)) {
        return (
            <MainContent
                params={props.params}
                frontProductImagePreview={props.frontProductImagePreview}
                generatedImages={props.generatedImages}
                isLoading={props.isLoading}
                error={props.error}
                onReturnToSettings={props.onReturnToSettings}
                onStartEdit={props.onStartEdit}
                onSetStoryboardSource={props.onSetStoryboardSource}
                onSetZoomedImage={props.onSetZoomedImage}
                isStoryboardResult={props.isStoryBoardResult}
                onGenerateCaption={props.onGenerateCaption}
                generatingCaptionImageId={props.generatingCaptionImageId}
                onOpenABTestModal={props.onOpenABTestModal}
                onSaveModel={props.onSaveModel}
                onRemix={props.onRemix}
                brandKit={props.brandKit}
            />
        );
    }

    // 2. Show Dashboard Home
    if (props.currentView === View.Dashboard) {
        return (
            <Dashboard
                onSelectMode={props.onSelectMode}
                onStartImageEdit={props.onStartEdit}
                onOpenFeedbackModal={props.onOpenFeedbackModal}
                onOpenPricingModal={props.onOpenPricingModal}
                onToggleSidebar={props.onToggleSidebar}
                userName={props.user?.name?.split(' ')[0]}
                isLoading={props.isLoading}
                floatingPrompt={props.floatingPrompt}
                onFloatingPromptChange={props.setFloatingPrompt}
                floatingImagePreview={props.floatingImagePreview}
                onFloatingGenerate={props.onFloatingGenerate}
                onRemoveFloatingImage={props.onRemoveFloatingImage}
                onTriggerFloatingUpload={props.onTriggerFloatingUpload}
                onOpenContentGenerator={props.onOpenContentGenerator}
                onOpenCreativeWorkflow={props.onOpenCreativeWorkflow}
                userTier={props.userTier}
                onInternalImageDrop={props.onInternalImageDrop}
                onFloatingImageDrop={props.onFloatingImageDrop}
                floatingMode={props.floatingMode}
                onFloatingModeChange={props.setFloatingMode}
                onShowDevMessage={props.onShowDevMessage}
            />
        );
    }

    // 3. Other Views
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner /></div>}>
            {props.currentView === View.Analytics && <AnalyticsDashboard onToggleSidebar={props.onToggleSidebar} onSetView={props.onSetView} />}
            
            {props.currentView === View.ShopifyAnalytics && (
                <ShopifyDashboard 
                    onToggleSidebar={props.onToggleSidebar} 
                    onGenerateAd={props.onGenerateAdFromShopify} 
                    report={props.shopifyReport} 
                    isLoaded={props.isShopifyReportLoaded} 
                    onReportUpdate={props.onReportUpdate}
                    onDeductCredits={props.onDeductCredits}
                />
            )}
            
            {props.currentView === View.MyDesigns && (
                <MyDesigns 
                    onSetView={props.onSetView} 
                    onStartEdit={props.onStartEdit} 
                    onSetZoomedImage={props.onSetZoomedImage} 
                    onSetStoryboardSource={props.onSetStoryboardSource} 
                    onToggleSidebar={props.onToggleSidebar} 
                    onRemix={props.onRemix} 
                    onGenerateCaption={props.onGenerateCaption}
                    generatingCaptionImageId={props.generatingCaptionImageId}
                    onOpenABTestModal={props.onOpenABTestModal}
                    brandKit={props.brandKit}
                />
            )}
            
            {props.currentView === View.Profile && props.user && (
                <ProfilePage 
                    user={props.user} 
                    credits={props.credits} 
                    userTier={props.userTier} 
                    onEditProfile={props.onOpenProfileEdit} 
                    onUpgradePlan={props.onOpenPricingModal} 
                    onToggleSidebar={props.onToggleSidebar} 
                    onSetView={props.onSetView} 
                    onOpenFeedbackModal={props.onOpenFeedbackModal} 
                    recentActivity={props.recentActivity} 
                />
            )}
            
            {props.currentView === View.Inspiration && (
                <InspirationPage 
                    onSetView={props.onSetView} 
                    onToggleSidebar={props.onToggleSidebar} 
                    onRemix={props.onRemix} 
                    items={props.inspirationItems} 
                    isLoaded={props.isInspirationLoaded} 
                    onItemsLoaded={props.onItemsLoaded} 
                />
            )}
        </Suspense>
    );
};
