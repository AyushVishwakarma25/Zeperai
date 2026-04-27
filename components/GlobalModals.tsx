
import React, { Suspense, lazy } from 'react';
import type { GeneratedImage, EditImageParams, BrandKit, SavedModel, GenerateImageParams } from '../types';
import type { UserProfileData } from '../services/userService';
import { Spinner } from './ui/Spinner';

// Lazy load heavy components
const EditModal = lazy(() => import('./EditModal'));
const ZoomModal = lazy(() => import('./ZoomModal'));
const FeedbackModal = lazy(() => import('./FeedbackModal'));
const PricingModal = lazy(() => import('./PricingModal'));
const SupportModal = lazy(() => import('./SupportModal'));
const ContentGenerator = lazy(() => import('./ContentGenerator'));
const ProfileEditModal = lazy(() => import('./ProfileEditModal'));
const BrandKitModal = lazy(() => import('./BrandKitModal'));
const ABTestModal = lazy(() => import('./ABTestModal'));
const CreativeWorkflow = lazy(() => import('./CreativeWorkflow').then(m => ({ default: m.CreativeWorkflow })));

interface GlobalModalsProps {
    editingImage: GeneratedImage | null;
    isEditing: boolean;
    editModalInitialTab: 'inpaint' | 'crop' | 'background' | 'element';
    onCloseEdit: () => void;
    onApplyEdit: (editParams: EditImageParams) => Promise<void>;
    onRemoveBackground: () => Promise<void>;
    onRemoveBackgroundPro?: () => Promise<void>;
    onImageUpdate: (id: string, newUrl: string) => void;
    onUpdateParams?: (imageId: string, params: Partial<GenerateImageParams>) => void;

    zoomedImage: GeneratedImage | null;
    onCloseZoom: () => void;

    isContentGeneratorModalOpen: boolean;
    onCloseContentGenerator: () => void;
    onDeductCredits: (cost: number) => boolean;
    onRefundCredits: (amount: number) => void;
    userId?: string;

    isBrandKitModalOpen: boolean;
    onCloseBrandKit: () => void;
    onSaveBrandKit: (kit: BrandKit) => void;
    brandKit: BrandKit | null;

    isFeedbackModalOpen: boolean;
    onCloseFeedback: () => void;

    isPricingModalOpen: boolean;
    onClosePricing: () => void;

    isSupportModalOpen: boolean;
    onCloseSupport: () => void;

    isProfileEditModalOpen: boolean;
    onCloseProfileEdit: () => void;
    user: UserProfileData | null;
    onUpdateProfile: (newProfileData: Partial<UserProfileData>) => void;

    abTestModalImage: GeneratedImage | null;
    onCloseABTest: () => void;

    isCreativeWorkflowModalOpen: boolean;
    onCloseCreativeWorkflow: () => void;
    onGenerate: (params: any) => void;
    isGenerating: boolean;
    userTier: string;
}

export const GlobalModals: React.FC<GlobalModalsProps> = (props) => {
    return (
        <Suspense fallback={<div className="fixed bottom-4 right-4"><Spinner /></div>}>
            {props.editingImage && (
                <EditModal 
                    image={props.editingImage} 
                    onClose={props.onCloseEdit} 
                    onApplyEdit={props.onApplyEdit} 
                    onRemoveBackground={props.onRemoveBackground} 
                    onRemoveBackgroundPro={props.onRemoveBackgroundPro}
                    onImageUpdate={props.onImageUpdate} 
                    onUpdateParams={props.onUpdateParams}
                    isEditing={props.isEditing} 
                    initialTab={props.editModalInitialTab} 
                    brandKit={props.brandKit}
                />
            )}
            {props.zoomedImage && <ZoomModal image={props.zoomedImage} onClose={props.onCloseZoom} />}
            
            {props.isContentGeneratorModalOpen && (
                <ContentGenerator 
                    onClose={props.onCloseContentGenerator} 
                    onDeductCredits={props.onDeductCredits} 
                    onRefundCredits={props.onRefundCredits} 
                    userId={props.userId} 
                />
            )}
            
            {props.isBrandKitModalOpen && (
                <BrandKitModal 
                    onClose={props.onCloseBrandKit} 
                    onSave={props.onSaveBrandKit} 
                    initialKit={props.brandKit}
                    onDeductCredits={props.onDeductCredits}
                />
            )}
            
            {props.isFeedbackModalOpen && <FeedbackModal onClose={props.onCloseFeedback} />}
            
            {props.isPricingModalOpen && <PricingModal onClose={props.onClosePricing} />}
            
            {props.isSupportModalOpen && <SupportModal onClose={props.onCloseSupport} />}
            
            {props.isProfileEditModalOpen && props.user && (
                <ProfileEditModal 
                    user={props.user} 
                    onClose={props.onCloseProfileEdit} 
                    onSave={props.onUpdateProfile} 
                />
            )}
            
            {props.abTestModalImage && (
                <ABTestModal 
                    image={props.abTestModalImage} 
                    onClose={props.onCloseABTest} 
                    onGenerate={() => {}} 
                    onDeductCredits={props.onDeductCredits}
                />
            )}

            {props.isCreativeWorkflowModalOpen && (
                <CreativeWorkflow 
                    brandKit={props.brandKit}
                    onGenerate={props.onGenerate}
                    isLoading={props.isGenerating}
                    onClose={props.onCloseCreativeWorkflow}
                    userTier={props.userTier}
                />
            )}
        </Suspense>
    );
};
