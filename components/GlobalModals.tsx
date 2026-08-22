
import React, { Suspense, lazy } from 'react';
import type { GeneratedImage, EditImageParams, BrandKit, SavedModel, GenerateImageParams } from '../types.js';
import type { UserProfileData } from '../services/userService.js';
import { Spinner } from './ui/Spinner.js';

// Lazy load heavy components
const EditModal = lazy(() => import('./EditModal.js'));
const ZoomModal = lazy(() => import('./ZoomModal.js'));
const FeedbackModal = lazy(() => import('./FeedbackModal.js'));
const PricingModal = lazy(() => import('./PricingModal.js'));
const SupportModal = lazy(() => import('./SupportModal.js'));
const ContentGenerator = lazy(() => import('./ContentGenerator.js'));
const ProfileEditModal = lazy(() => import('./ProfileEditModal.js'));
const BrandKitModal = lazy(() => import('./BrandKitModal.js'));
const ABTestModal = lazy(() => import('./ABTestModal.js'));

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
    onGenerate: (params: any) => void;
    isGenerating: boolean;
    userTier: string;
    onOpenPricingModal: () => void;
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
                    userTier={props.userTier}
                    onOpenPricingModal={props.onOpenPricingModal}
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
                    onOpenPricingModal={props.onOpenPricingModal}
                />
            )}
        </Suspense>
    );
};
