
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { GenerateImageParams, GeneratedImage, EditImageParams, BrandKit, ShopifyAnalysisResult, GenerateCaptionParams } from './types';
import { editImage, generateCaption, removeBackground } from './services/geminiService';
import { userService, UserProfileData } from './services/userService';
import { designService } from './services/designService'; 
import { AppMode, AspectRatio, View } from './types';
import { INITIAL_GENERATE_PARAMS } from './constants';
import { getActionLabel } from './utils/helpers';
import { getModeDefaults } from './utils/configLogic'; 
import { CreativeModal } from './components/CreativeModal';
import { Toast } from './components/ui/Toast';
import { LoginPage } from './components/LoginPage';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useAuth } from './contexts/AuthContext';
import { useDesigns } from './contexts/DesignsContext';
import { useCreativeSession } from './hooks/useCreativeSession';
import { useAppData } from './hooks/useAppData';
import { ModalProvider, useModals } from './contexts/ModalContext';
import { GlobalModals } from './components/GlobalModals';
import { AppMainView } from './components/AppMainView';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui/Spinner';
import { SplashScreen } from './components/SplashScreen';

const dataURLToParts = (dataURL: string) => {
    const parts = dataURL.split(',');
    const data = parts[1];
    const mimeType = parts[0].split(':')[1].split(';')[0];
    return { data, mimeType };
};

// Internal App Component that uses the ModalContext
const AppInternal: React.FC = () => {
  const isOnline = useNetworkStatus();
  const { user, signOut, isLoading: isAuthLoading, setUser: setUserProfile } = useAuth();
  const { designs, updateDesign } = useDesigns();
  const modals = useModals();
  const appData = useAppData();
  
  // UI State
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Dashboard Floating Input State
  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [floatingImageFile, setFloatingImageFile] = useState<File | null>(null);
  const [floatingImagePreview, setFloatingImagePreview] = useState<string | null>(null);
  const [floatingMode, setFloatingMode] = useState<AppMode>(AppMode.Influencer);
  const floatingImageInputRef = useRef<HTMLInputElement>(null);

  // Creative Workflow State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [editModalInitialTab, setEditModalInitialTab] = useState<'inpaint' | 'crop' | 'background'>('inpaint');
  const [zoomedImage, setZoomedImage] = useState<GeneratedImage | null>(null);
  const [abTestModalImage, setAbTestModalImage] = useState<GeneratedImage | null>(null);
  const [generatingCaptionImageId, setGeneratingCaptionImageId] = useState<string | null>(null);
  const [storyboardSourceImage, setStoryboardSourceImage] = useState<GeneratedImage | null>(null);

  // Free Usage Tracking
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(() => {
      const saved = localStorage.getItem('krackx_free_usage');
      return saved ? parseInt(saved, 10) : 0;
  });

  // Other Data State
  const [inspirationItems, setInspirationItems] = useState<any[]>([]);
  const [isInspirationLoaded, setIsInspirationLoaded] = useState(false);
  const [shopifyReport, setShopifyReport] = useState<ShopifyAnalysisResult | null>(null);
  const [isShopifyReportLoaded, setIsShopifyReportLoaded] = useState(false);

  const userTier = user?.tier || 'Free';

  // Admin Check
  React.useEffect(() => {
      if (user && user.role === 'Administrator') setIsAdmin(true);
  }, [user]);

  // Credit Logic Wrapper
  const handleCheckCredits = useCallback((cost: number) => {
      const success = appData.checkAndDeductCredits(cost, isAdmin);
      if (!success) {
          setToast({ message: `Insufficient credits! Required: ${cost}`, type: 'error' });
          modals.openPricing();
      }
      return success;
  }, [appData, isAdmin, modals]);

  const handleRefundCredits = useCallback((amount: number) => {
      appData.refundCredits(amount, isAdmin);
  }, [appData, isAdmin]);

  // --- USE CREATIVE SESSION ---
  const creative = useCreativeSession(userTier, freeGenerationsUsed, setFreeGenerationsUsed, handleCheckCredits, handleRefundCredits);

  const handleGenerateWrapper = useCallback((currentParams: GenerateImageParams) => {
      setCurrentView(View.Dashboard); 
      creative.handleGenerate(currentParams, appData.brandKit);
  }, [creative, appData.brandKit]);

  // --- HANDLERS ---

  const handleLogout = useCallback(async () => {
      setIsSidebarOpen(false);
      await signOut();
      setCurrentView(View.Dashboard);
      setToast({ message: "Logged out successfully", type: 'success' });
  }, [signOut]);

  const handleUpdateProfile = useCallback(async (newProfileData: Partial<UserProfileData>) => {
      if (!user) return;
      setUserProfile(prev => prev ? ({ ...prev, ...newProfileData }) : null);
      modals.closeProfileEdit();
      try {
          await userService.updateUserProfile(newProfileData);
          setToast({ message: "Profile updated successfully", type: 'success' });
      } catch (e) {
          setToast({ message: "Failed to save profile changes", type: 'error' });
      }
  }, [user, setUserProfile, modals]);

  const handleSaveBrandKit = useCallback((kit: BrandKit) => {
      appData.setBrandKit(kit);
      modals.closeBrandKit();
      setToast({ message: "Brand identity saved!", type: 'success' });
  }, [appData, modals]);

  const handleRemix = useCallback((item: any) => {
      let remixParams: Partial<GenerateImageParams> = {};
      if ('remixParams' in item) {
          creative.setLastActiveMode(item.appMode);
          remixParams = item.remixParams;
          creative.setParams(prev => ({ 
              ...INITIAL_GENERATE_PARAMS, 
              ...getModeDefaults(item.appMode, INITIAL_GENERATE_PARAMS), 
              ...remixParams, 
              appMode: item.appMode 
          }));
          creative.setActiveMode(item.appMode);
          setToast({ message: "Style settings applied! Upload your product to continue.", type: 'success' });
      } else {
          handleRemixDesign(item);
          return;
      }
      setCurrentView(View.Dashboard);
  }, [creative]);

  const handleRemixDesign = useCallback(async (image: GeneratedImage) => {
      let fullImage = image;
      // Defensive check: Ensure params exists before accessing keys
      if (!image.params || Object.keys(image.params).length === 0) {
          const detailed = await designService.getDesignDetails(image.id);
          if (!detailed) { setToast({ message: "Could not load design details.", type: 'error' }); return; }
          fullImage = detailed;
      }
      try {
          const response = await fetch(fullImage.imageUrl);
          const blob = await response.blob();
          const referenceFile = new File([blob], "remix-reference.png", { type: "image/png" });
          creative.setActiveMode(AppMode.Remix);
          creative.setRemixReferenceImagePreview(fullImage.imageUrl);
          creative.setParams(prev => ({ ...INITIAL_GENERATE_PARAMS, appMode: AppMode.Remix, productDescription: fullImage.params?.productDescription || '', remixReferenceImage: referenceFile }));
          setCurrentView(View.Dashboard);
      } catch (e) {
          setToast({ message: "Failed to load design.", type: 'error' });
      }
  }, [creative]);

  const handleStartEdit = useCallback(async (image?: GeneratedImage, tab: 'inpaint' | 'crop' | 'background' = 'inpaint') => {
      // Defensive check: Ensure image exists and params are valid
      if (image && (!image.params || Object.keys(image.params).length === 0)) {
          const detailed = await designService.getDesignDetails(image.id);
          if (!detailed) { setToast({ message: "Could not load details.", type: 'error' }); return; }
          updateDesign(detailed);
          setEditingImage(detailed);
      } else {
          setEditingImage(image || { id: `edit-placeholder-${Date.now()}`, imageUrl: '', caption: '', hashtags: '', aspectRatio: '1:1', timestamp: Date.now(), params: INITIAL_GENERATE_PARAMS });
      }
      setEditModalInitialTab(tab);
  }, [updateDesign]);

  const handleApplyEdit = useCallback(async (editParams: EditImageParams) => {
      if (!handleCheckCredits(1)) return;
      setIsEditing(true); 
      try {
          const result = await editImage(editParams);
          if (editingImage) setEditingImage({ ...editingImage, imageUrl: result.imageUrl });
      } catch (e) {
          handleRefundCredits(1); 
          setToast({ message: "Edit failed", type: 'error' });
      } finally {
          setIsEditing(false);
      }
  }, [editingImage, handleCheckCredits, handleRefundCredits]);

  const handleImageUpdate = useCallback((id: string, newUrl: string) => {
      if (editingImage && editingImage.id === id) {
          setEditingImage({ ...editingImage, imageUrl: newUrl });
      }
  }, [editingImage]);

  const handleRemoveBackgroundAction = useCallback(async () => {
    if (!editingImage) return;
    if (!handleCheckCredits(1)) return;
    setIsEditing(true);
    try {
        const { data, mimeType } = dataURLToParts(editingImage.imageUrl);
        const result = await removeBackground(data, mimeType);
        const newUrl = `data:${result.mimeType};base64,${result.data}`;
        setEditingImage(prev => prev ? ({ ...prev, imageUrl: newUrl }) : null);
    } catch (e) {
        handleRefundCredits(1);
        setToast({ message: "Background removal failed", type: 'error' });
    } finally {
        setIsEditing(false);
    }
  }, [editingImage, handleCheckCredits, handleRefundCredits]);

  const handleGenerateCaption = useCallback(async (imageId: string, captionParams: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => {
    const imageToCaption = creative.generatedImages.find(img => img.id === imageId) || designs.find(d => d.id === imageId);
    if (!imageToCaption) return;
    
    // Credit Check for Caption
    if (!handleCheckCredits(1)) return;

    setGeneratingCaptionImageId(imageId);
    try {
      const result = await generateCaption({ imageUrl: imageToCaption.imageUrl, ...captionParams }, appData.brandKit);
      creative.setGeneratedImages(prev => prev.map(img => img.id === imageId ? { ...img, caption: result.caption, hashtags: result.hashtags || '' } : img));
      updateDesign({ ...imageToCaption, caption: result.caption, hashtags: result.hashtags || '' });
    } catch(err: any) {
      handleRefundCredits(1);
      setToast({ message: `Caption generation failed`, type: 'error' });
    } finally {
      setGeneratingCaptionImageId(null);
    }
  }, [creative.generatedImages, designs, appData.brandKit, updateDesign, creative.setGeneratedImages, handleCheckCredits, handleRefundCredits]);

  // Floating Bar Handlers
  const handleFloatingGenerate = useCallback(() => {
    const floatingParams: GenerateImageParams = {
        ...INITIAL_GENERATE_PARAMS,
        appMode: floatingMode,
        productDescription: floatingPrompt,
        frontProductImage: floatingImageFile || undefined,
        aspectRatios: [AspectRatio.PortraitPost]
    };
    creative.handleGenerate(floatingParams, appData.brandKit, floatingImagePreview || undefined);
    setFloatingPrompt('');
    setFloatingImageFile(null);
    setFloatingImagePreview(null);
  }, [floatingMode, floatingPrompt, floatingImageFile, creative.handleGenerate, floatingImagePreview, appData.brandKit]);

  const handleFloatingImageFileChange = useCallback(async (file: File | null) => {
    setFloatingImageFile(file);
    if (file) setFloatingImagePreview(URL.createObjectURL(file));
    else setFloatingImagePreview(null);
  }, []);
  
  const handleTriggerFloatingUpload = useCallback(() => floatingImageInputRef.current?.click(), []);

  const handleInternalImageDrop = useCallback((image: GeneratedImage, targetMode?: AppMode) => {
      if (targetMode) {
        creative.setActiveMode(targetMode);
        fetch(image.imageUrl).then(res => res.blob()).then(blob => {
            const file = new File([blob], "dropped-image.png", { type: blob.type });
            creative.handleFileChange(file, 'frontProductImage', creative.setFrontProductImagePreview, { maxWidth: 1024, maxHeight: 1024 });
        });
      }
  }, [creative]);

  const handleGenerateAdFromShopify = useCallback((productName: string) => {
      creative.setLastActiveMode(AppMode.AdCreative);
      creative.setParams(prev => ({
          ...prev,
          ...getModeDefaults(AppMode.AdCreative, prev),
          appMode: AppMode.AdCreative,
          adTitle: `Special Offer: ${productName}`,
          productDescription: productName
      }));
      creative.setActiveMode(AppMode.AdCreative);
      setCurrentView(View.Dashboard);
  }, [creative]);

  const handleSaveModel = useCallback(async (image: GeneratedImage) => {
      const modelName = `Model #${Math.floor(1000 + Math.random() * 9000)}`;
      try {
          const newModels = await userService.saveModel(modelName, image.imageUrl, appData.savedModels);
          appData.setSavedModels(newModels);
          setToast({ message: `Saved as "${modelName}"!`, type: 'success' });
      } catch (err: any) {
          setToast({ message: "Failed to save model.", type: 'error' });
      }
  }, [appData.savedModels]);

  const recentActivity = useMemo(() => {
    return designs.slice(0, 12).map(img => ({
        id: img.id,
        user: user?.name || 'Guest',
        action: getActionLabel(img.params?.appMode || AppMode.Product), 
        imageUrl: img.thumbnailUrl || img.imageUrl,
        timestamp: img.timestamp
    }));
  }, [designs, user]);

  useEffect(() => {
      if (creative.error) {
          setToast({ message: creative.error, type: 'error' });
          creative.setError(null);
      }
  }, [creative.error, creative.setError]);

  if (isAuthLoading) {
      return <SplashScreen />;
  }

  if (!user) {
      return <LoginPage onLoginSuccess={(session) => setUserProfile(session.user)} />;
  }

  const isStoryboardResult = !!creative.params.storyboardScenes && creative.params.storyboardScenes.length > 0;

  return (
    <>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        <Layout
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            currentView={currentView}
            onSetView={setCurrentView}
            onSelectMode={creative.handleSelectMode}
            onStartImageEdit={() => handleStartEdit(undefined, 'background')}
            onOpenContentGenerator={modals.openContentGenerator}
            onOpenSupport={modals.openSupport}
            onOpenBrandKit={modals.openBrandKit}
            isAdmin={isAdmin}
            onToggleAdmin={() => setIsAdmin(!isAdmin)}
            user={user}
            onLogout={handleLogout}
            onInternalImageDrop={handleInternalImageDrop}
        >
            <AppMainView 
                currentView={currentView}
                generatedImages={creative.generatedImages}
                isLoading={creative.isLoading}
                error={creative.error}
                params={creative.params}
                frontProductImagePreview={creative.frontProductImagePreview}
                
                onSelectMode={creative.handleSelectMode}
                onStartEdit={handleStartEdit}
                onReturnToSettings={() => { creative.setGeneratedImages([]); creative.setActiveMode(creative.lastActiveMode); }}
                onSetStoryboardSource={setStoryboardSourceImage}
                onSetZoomedImage={setZoomedImage}
                onGenerateCaption={handleGenerateCaption}
                generatingCaptionImageId={generatingCaptionImageId}
                onOpenABTestModal={(img) => setAbTestModalImage(img)}
                onSaveModel={handleSaveModel}
                
                onOpenFeedbackModal={modals.openFeedback}
                onOpenPricingModal={modals.openPricing}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                user={user}
                floatingPrompt={floatingPrompt}
                setFloatingPrompt={setFloatingPrompt}
                floatingImagePreview={floatingImagePreview}
                onFloatingGenerate={handleFloatingGenerate}
                onRemoveFloatingImage={() => handleFloatingImageFileChange(null)}
                onTriggerFloatingUpload={handleTriggerFloatingUpload}
                onOpenContentGenerator={modals.openContentGenerator}
                userTier={userTier}
                isAdmin={isAdmin}
                onInternalImageDrop={handleInternalImageDrop}
                onFloatingImageDrop={handleFloatingImageFileChange}
                floatingMode={floatingMode}
                setFloatingMode={setFloatingMode}
                isStoryBoardResult={isStoryboardResult}

                onSetView={setCurrentView}
                shopifyReport={shopifyReport}
                isShopifyReportLoaded={isShopifyReportLoaded}
                onReportUpdate={(r) => { setShopifyReport(r); if(r) setIsShopifyReportLoaded(true); }}
                onGenerateAdFromShopify={handleGenerateAdFromShopify}
                onDeductCredits={handleCheckCredits} // Pass credit handler

                onRemix={handleRemix}
                inspirationItems={inspirationItems}
                isInspirationLoaded={isInspirationLoaded}
                onItemsLoaded={setInspirationItems}

                credits={appData.credits}
                onOpenProfileEdit={modals.openProfileEdit}
                recentActivity={recentActivity}
            />
        </Layout>

        {creative.activeMode && (
            <CreativeModal
                key={creative.activeMode} 
                mode={creative.activeMode}
                onClose={() => creative.setActiveMode(null)}
                params={creative.params}
                onParamsChange={creative.setParams}
                onGenerate={handleGenerateWrapper}
                isLoading={creative.isLoading}
                onFileChange={creative.handleFileChange}
                frontProductImagePreview={creative.frontProductImagePreview}
                setFrontProductImagePreview={creative.setFrontProductImagePreview}
                bulkImagePreviews={creative.bulkImagePreviews}
                onBulkFilesChange={creative.handleBulkFilesChange}
                onRemoveBulkImage={creative.handleRemoveBulkImage}
                remixReferenceImagePreview={creative.remixReferenceImagePreview}
                setRemixReferenceImagePreview={creative.setRemixReferenceImagePreview}
                remixProductImagePreview={creative.remixProductImagePreview}
                setRemixProductImagePreview={creative.setRemixProductImagePreview}
                onGenerateVariants={() => {}}
                storyboardSourceImage={storyboardSourceImage}
                onClearStoryboardSource={() => setStoryboardSourceImage(null)}
                userTier={userTier}
                onOpenPricingModal={modals.openPricing}
                freeGenerationsUsed={freeGenerationsUsed}
                savedModels={appData.savedModels}
                onReset={creative.handleResetParams}
                brandKit={appData.brandKit}
            />
        )}
        
        <GlobalModals 
            editingImage={editingImage}
            isEditing={isEditing}
            editModalInitialTab={editModalInitialTab}
            onCloseEdit={() => setEditingImage(null)}
            onApplyEdit={handleApplyEdit}
            onRemoveBackground={handleRemoveBackgroundAction}
            onImageUpdate={handleImageUpdate}

            zoomedImage={zoomedImage}
            onCloseZoom={() => setZoomedImage(null)}

            isContentGeneratorModalOpen={modals.isContentGeneratorOpen}
            onCloseContentGenerator={modals.closeContentGenerator}
            onDeductCredits={handleCheckCredits}
            onRefundCredits={handleRefundCredits}
            userId={user.id}

            isBrandKitModalOpen={modals.isBrandKitOpen}
            onCloseBrandKit={modals.closeBrandKit}
            onSaveBrandKit={handleSaveBrandKit}
            brandKit={appData.brandKit}

            isFeedbackModalOpen={modals.isFeedbackOpen}
            onCloseFeedback={modals.closeFeedback}

            isPricingModalOpen={modals.isPricingOpen}
            onClosePricing={modals.closePricing}

            isSupportModalOpen={modals.isSupportOpen}
            onCloseSupport={modals.closeSupport}

            isProfileEditModalOpen={modals.isProfileEditOpen}
            onCloseProfileEdit={modals.closeProfileEdit}
            user={user}
            onUpdateProfile={handleUpdateProfile}

            abTestModalImage={abTestModalImage}
            onCloseABTest={() => setAbTestModalImage(null)}
        />
    </>
  );
};

const App: React.FC = () => {
    return (
        <ModalProvider>
            <AppInternal />
        </ModalProvider>
    );
};

export default App;
