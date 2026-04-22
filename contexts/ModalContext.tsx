
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
    isFeedbackOpen: boolean;
    openFeedback: () => void;
    closeFeedback: () => void;

    isPricingOpen: boolean;
    openPricing: () => void;
    closePricing: () => void;

    isSupportOpen: boolean;
    openSupport: () => void;
    closeSupport: () => void;

    isContentGeneratorOpen: boolean;
    openContentGenerator: () => void;
    closeContentGenerator: () => void;

    isBrandKitOpen: boolean;
    openBrandKit: () => void;
    closeBrandKit: () => void;

    isProfileEditOpen: boolean;
    openProfileEdit: () => void;
    closeProfileEdit: () => void;

    isCreativeWorkflowOpen: boolean;
    openCreativeWorkflow: () => void;
    closeCreativeWorkflow: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [isContentGeneratorOpen, setIsContentGeneratorOpen] = useState(false);
    const [isBrandKitOpen, setIsBrandKitOpen] = useState(false);
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [isCreativeWorkflowOpen, setIsCreativeWorkflowOpen] = useState(false);

    return (
        <ModalContext.Provider value={{
            isFeedbackOpen, openFeedback: () => setIsFeedbackOpen(true), closeFeedback: () => setIsFeedbackOpen(false),
            isPricingOpen, openPricing: () => setIsPricingOpen(true), closePricing: () => setIsPricingOpen(false),
            isSupportOpen, openSupport: () => setIsSupportOpen(true), closeSupport: () => setIsSupportOpen(false),
            isContentGeneratorOpen, openContentGenerator: () => setIsContentGeneratorOpen(true), closeContentGenerator: () => setIsContentGeneratorOpen(false),
            isBrandKitOpen, openBrandKit: () => setIsBrandKitOpen(true), closeBrandKit: () => setIsBrandKitOpen(false),
            isProfileEditOpen, openProfileEdit: () => setIsProfileEditOpen(true), closeProfileEdit: () => setIsProfileEditOpen(false),
            isCreativeWorkflowOpen, openCreativeWorkflow: () => setIsCreativeWorkflowOpen(true), closeCreativeWorkflow: () => setIsCreativeWorkflowOpen(false),
        }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModals = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModals must be used within a ModalProvider');
    }
    return context;
};
