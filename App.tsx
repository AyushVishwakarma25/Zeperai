import React, { useState, useCallback, lazy, Suspense, useEffect, useRef, useMemo } from 'react';
import { MainContent } from './components/MainContent';
import type { GenerateImageParams, GeneratedImage, EditImageParams, BrandKit, SavedModel, InspirationItem, ShopifyAnalysisResult, GenerateCaptionParams } from './types';
import { generateImages, editImage, generateCaption, detectProductCategory, fileToBase64, removeBackground } from './services/geminiService';
import { userService, UserProfileData } from './services/userService';
import { designService } from './services/designService'; 
import { brandService } from './services/brandService';
import { Spinner } from './components/ui/Spinner';
import { AppMode, ResolutionQuality, ProductCategory, View, AspectRatio } from './types';
import { LOADING_MESSAGES, INITIAL_GENERATE_PARAMS, FREE_TRIAL_LIMIT } from './constants';
import { processImageFile, dataURLtoFile } from './utils/images';
import { debounce, getActionLabel } from './utils/helpers';
import { getModeDefaults, toggleAspectRatio } from './utils/configLogic'; 
import { calculateGenerationCost } from './utils/costs'; 
import { DashboardSidebar } from './components/DashboardSidebar';
import { Dashboard } from './components/Dashboard';
import { CreativeModal } from './components/CreativeModal';
import { MyDesigns } from './components/MyDesigns';
import { Toast } from './components/ui/Toast';
import { LoginPage } from './components/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useAuth } from './contexts/AuthContext';
import { useDesigns } from './contexts/DesignsContext';
import { AuthSession } from './services/authService';

// Lazy load heavy components
const EditModal = lazy(() => import('./components/EditModal'));
const ZoomModal = lazy(() => import('./components/ZoomModal'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));
const PricingModal = lazy(() => import('./components/PricingModal'));
const SupportModal = lazy(() => import('./components/SupportModal'));
const ContentGenerator = lazy(() => import('./components/ContentGenerator'));
const ProfileEditModal = lazy(() => import('./components/ProfileEditModal'));
const InspirationPage = lazy(() => import('./components/InspirationPage'));
const BrandKitModal = lazy(() => import('./components/BrandKitModal'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));

// Handle Named Exports for Lazy Loading
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })));
const ShopifyDashboard = lazy(() => import('./components/ShopifyDashboard').then(module => ({ default: module.ShopifyDashboard })));

const dataURLToParts = (dataURL: string) => {
    const parts = dataURL.split(',');
    const data = parts[1];
    const mimeType = parts[0].split(':')[1].split(';')[0];
    return { data, mimeType };
};

const App: React.FC = () => {
  const isOnline = useNetworkStatus();
  const { user, signOut, isLoading: isAuthLoading, setUser: setUserProfile } = useAuth();
  const { designs, addDesign, updateDesign } = useDesigns();
  
  const [activeMode, setActiveMode] = useState<AppMode | null>(null);
  const [lastActiveMode, setLastActiveMode] = useState<AppMode | null>(null);
  
  const [floatingMode, setFloatingMode] = useState<AppMode>(AppMode.Influencer);
  
  const [params, setParams] = useState<GenerateImageParams>(() => {
      try {
          const saved = localStorage.getItem('krackx_last_params');
          return saved ? { ...INITIAL_GENERATE_PARAMS, ...JSON.parse(saved) } : INITIAL_GENERATE_PARAMS;
      } catch (e) {
          return INITIAL_GENERATE_PARAMS;
      }
  });

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [editModalInitialTab, setEditModalInitialTab] = useState<'inpaint' | 'crop' | 'background'>('inpaint');
  const [zoomedImage, setZoomedImage] = useState<GeneratedImage | null>(null);
  const [storyboardSourceImage, setStoryboardSourceImage] = useState<GeneratedImage | null>(null);
  const [isStoryboardResult, setIsStoryboardResult] = useState<boolean>(false);
  const [generatingCaptionImageId, setGeneratingCaptionImageId] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isContentGeneratorModalOpen, setIsContentGeneratorModalOpen] = useState(false);
  const [isBrandKitModalOpen, setIsBrandKitModalOpen] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [abTestModalImage, setAbTestModalImage] = useState<GeneratedImage | null>(null);
  
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [isInspirationLoaded, setIsInspirationLoaded] = useState(false);

  const [frontProductImagePreview, setFrontProductImagePreview] = useState<string | null>(null);
  const [bulkImagePreviews, setBulkImagePreviews] = useState<string[]>([]);

  const [remixReferenceImagePreview, setRemixReferenceImagePreview] = useState<string | null>(null);
  const [remixProductImagePreview, setRemixProductImagePreview] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0); 
  const [totalCredits, setTotalCredits] = useState(100);
  
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(() => {
      const saved = localStorage.getItem('krackx_free_usage');
      return saved ? parseInt(saved, 10) : 0;
  });

  const [loadingMessages, setLoadingMessages] = useState<{title: string, subtext: string}>({ title: '', subtext: '' });
  const generationModeRef = useRef<AppMode | null>(null);
  const isGeneratingRef = useRef(false);

  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [floatingImageFile, setFloatingImageFile] = useState<File | null>(null);
  const [floatingImagePreview, setFloatingImagePreview] = useState<string | null>(null);
  const floatingImageInputRef = useRef<HTMLInputElement>(null);

  const userTier = user?.tier || 'Free';

  useEffect(() => {
      const { frontProductImage, bulkImages, customAvatarImage, outfitReferenceImage, logoImage, remixReferenceImage, remixProductImage, ...safeParams } = params;
      localStorage.setItem('krackx_last_params', JSON.stringify(safeParams));
  }, [params]);

  useEffect(() => {
      localStorage.setItem('krackx_free_usage', freeGenerationsUsed.toString());
  }, [freeGenerationsUsed]);

  useEffect(() => {
    if (isLoading || isEditing) {
      const mode = generationModeRef.current;
      const isAdMode = mode === AppMode.AdCreative || mode === AppMode.Banner || mode === AppMode.Youtube;
      const messageSetKey = isAdMode ? AppMode.AdCreative : (mode && LOADING_MESSAGES[mode] ? mode : 'default');
      const messages = LOADING_MESSAGES[messageSetKey];
      const progress = batchProgress ? (batchProgress.current / batchProgress.total) * 100 : -1;
      let subtextPool;
      if (progress === -1) {
          subtextPool = messages.subtext.mid;
      } else if (progress <= 30) {
          subtextPool = messages.subtext.low;
      } else if (progress <= 70) {
          subtextPool = messages.subtext.mid;
      } else {
          subtextPool = messages.subtext.high;
      }
      const subtext = subtextPool[Math.floor(Math.random() * subtextPool.length)];

      setLoadingMessages(prev => {
        const isNewLoadingState = !prev.title && (isLoading || isEditing);
        const title = isNewLoadingState
            ? messages.title[Math.floor(Math.random() * messages.title.length)]
            : prev.title;

        return { title: title || 'Generating...', subtext };
      });

    } else {
      setLoadingMessages({ title: '', subtext: '' });
    }
  }, [isLoading, isEditing, batchProgress]);

  useEffect(() => {
      const loadData = async () => {
          if (user && user.id !== 'guest-user-id') {
              setIsAdmin(user.role === 'Administrator');
              try {
                  const [creditData, userBrandKit, models] = await Promise.all([
                      userService.getCredits(),
                      brandService.getBrandKit(),
                      userService.getSavedModels()
                  ]);
                  setCredits(creditData.current);
                  setTotalCredits(creditData.total);
                  setBrandKit(userBrandKit);
                  setSavedModels(models);
              } catch (dataError) {
                  console.error("Partial data load failure", dataError);
              }
          } else if (user) {
              setCredits(25);
              setTotalCredits(25);
              setBrandKit(null);
              setSavedModels([]);
          }
      };
      loadData();
  }, [user]);

  const handleLogout = useCallback(async () => {
      setIsSidebarOpen(false);
      await signOut();
      setCurrentView(View.Dashboard);
      setToast({ message: "Logged out successfully", type: 'success' });
  }, [signOut]);

  const handleRequireAuth = useCallback(() => {
      if (!user || user.id === 'guest-user-id') {
          return false;
      }
      return true;
  }, [user]);

  const handleSetView = useCallback((view: View) => {
      setCurrentView(view);
  }, []);

  const recentActivity = useMemo(() => {
    return designs
        .slice(0, 12) 
        .map(img => ({
            id: img.id,
            user: user?.name || 'Guest',
            action: getActionLabel(img.params?.appMode || AppMode.Product), 
            imageUrl: img.thumbnailUrl || img.imageUrl,
            timestamp: img.timestamp
        }));
  }, [designs, user]);
  
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const handleOpenProfileEditModal = useCallback(() => setIsProfileEditModalOpen(true), []);
  const handleCloseProfileEditModal = useCallback(() => setIsProfileEditModalOpen(false), []);
  
  const handleUpdateProfile = useCallback(async (newProfileData: Partial<UserProfileData>) => {
      if (!user) return;
      setUserProfile(prev => prev ? ({ ...prev, ...newProfileData }) : null);
      setIsProfileEditModalOpen(false);
      try {
          await userService.updateUserProfile(newProfileData);
          setToast({ message: "Profile updated successfully", type: 'success' });
      } catch (e) {
          setToast({ message: "Failed to save profile changes", type: 'error' });
      }
  }, [user, setUserProfile]);

  const handleOpenFeedbackModal = useCallback(() => setIsFeedbackModalOpen(true), []);
  const handleCloseFeedbackModal = useCallback(() => setIsFeedbackModalOpen(false), []);

  const handleOpenPricingModal = useCallback(() => setIsPricingModalOpen(true), []);
  const handleClosePricingModal = useCallback(() => setIsPricingModalOpen(false), []);
  const handleOpenSupportModal = useCallback(() => setIsSupportModalOpen(true), []);
  const handleCloseSupportModal = useCallback(() => setIsSupportModalOpen(false), []);
  const handleOpenContentGeneratorModal = useCallback(() => setIsContentGeneratorModalOpen(true), []);
  const handleCloseContentGeneratorModal = useCallback(() => setIsContentGeneratorModalOpen(false), []);
  const handleOpenBrandKitModal = useCallback(() => setIsBrandKitModalOpen(true), []);

  const handleApiError = useCallback((err: unknown) => {
    let errorMessage = 'An unexpected error occurred.';
    if (err instanceof Error) errorMessage = err.message;
    setError(errorMessage);
  }, []);

  const checkAndDeductCredits = useCallback((cost: number): boolean => {
      if (isAdmin) return true; 
      if (credits >= cost) {
          setCredits(prev => prev - cost);
          if (user && user.id !== 'guest-user-id') {
              userService.deductCredits(cost).catch(e => console.error("Credit sync failed", e));
          }
          return true;
      }
      setToast({ message: `Insufficient credits! Required: ${cost}, Balance: ${credits}`, type: 'error' });
      setIsPricingModalOpen(true);
      return false;
  }, [credits, isAdmin, user]);

  const refundCredits = useCallback((amount: number) => {
      if (isAdmin) return;
      setCredits(prev => prev + amount);
      if (user && user.id !== 'guest-user-id') {
          userService.deductCredits(-amount).catch(e => console.error("Refund failed", e));
      }
  }, [isAdmin, user]);

  const handleSelectMode = useCallback((tool: AppMode) => {
    setLastActiveMode(tool);
    setParams(prev => ({ ...prev, ...getModeDefaults(tool, prev) }));
    setActiveMode(tool);
  }, []);
  
  const handleRemix = useCallback((item: InspirationItem) => {
      setLastActiveMode(item.appMode);
      setParams(prev => ({ ...INITIAL_GENERATE_PARAMS, ...getModeDefaults(item.appMode, INITIAL_GENERATE_PARAMS), ...item.remixParams, appMode: item.appMode }));
      setActiveMode(item.appMode);
      setCurrentView(View.Dashboard);
  }, []);

  const handleRemixDesign = useCallback(async (image: GeneratedImage) => {
      let fullImage = image;
      if (Object.keys(image.params).length === 0) {
          const detailed = await designService.getDesignDetails(image.id);
          if (!detailed) { setToast({ message: "Could not load design details for remix.", type: 'error' }); return; }
          fullImage = detailed;
          updateDesign(detailed);
      }
      try {
          const response = await fetch(fullImage.imageUrl);
          const blob = await response.blob();
          const referenceFile = new File([blob], "remix-reference.png", { type: "image/png" });
          setActiveMode(AppMode.Remix);
          setRemixReferenceImagePreview(fullImage.imageUrl);
          setParams(prev => ({ ...INITIAL_GENERATE_PARAMS, appMode: AppMode.Remix, productDescription: fullImage.params?.productDescription || '', remixReferenceImage: referenceFile }));
          setCurrentView(View.Dashboard);
      } catch (e) {
          setToast({ message: "Failed to load design.", type: 'error' });
      }
  }, [updateDesign]);
  
  const handleResetParams = useCallback(() => {
    if (!activeMode) return;
    setParams(prev => ({ ...INITIAL_GENERATE_PARAMS, ...getModeDefaults(activeMode, INITIAL_GENERATE_PARAMS) }));
  }, [activeMode]);

  const debouncedDetectProductCategory = useCallback(debounce(async (base64: string, mimeType: string, description: string) => {
      try {
          const detectedCategory = await detectProductCategory(base64, mimeType, description);
          setParams(prev => ({ ...prev, productCategory: detectedCategory, detectedCategory: detectedCategory }));
      } catch (error) {
          setParams(prev => ({ ...prev, productCategory: ProductCategory.Generic, detectedCategory: undefined }));
      }
  }, 500), []); 

  const handleBulkFilesChange = useCallback(async (files: File[]) => {
      const MAX_FILES = 3;
      const currentPreviews = bulkImagePreviews;
      const filesToProcess = files.slice(0, MAX_FILES - currentPreviews.length);
      const newPreviews = filesToProcess.map(f => URL.createObjectURL(f));
      const processedNewFiles = await Promise.all(filesToProcess.map(f => processImageFile(f, { maxWidth: 2048, maxHeight: 2048, format: 'image/png' })));
      setBulkImagePreviews(prev => [...prev, ...newPreviews]);
      setParams(prev => ({ ...prev, bulkImages: [...(prev.bulkImages || []), ...processedNewFiles], frontProductImage: [...(prev.bulkImages || []), ...processedNewFiles][0] }));
      setFrontProductImagePreview([...currentPreviews, ...newPreviews][0]);
  }, [bulkImagePreviews]);

  const handleFileChange = useCallback(async (file: File | null, paramName: keyof GenerateImageParams, previewSetter: React.Dispatch<React.SetStateAction<string | null>>, options: any) => {
    if (file === null) previewSetter(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    if (file) {
        const processedFile = await processImageFile(file, options);
        previewSetter(URL.createObjectURL(processedFile));
        setParams(prev => ({ ...prev, [paramName]: processedFile }));
    } else {
        setParams(prev => ({ ...prev, [paramName]: undefined }));
    }
  }, []);

  const handleRemoveBulkImage = useCallback((index: number) => {
      setBulkImagePreviews(prev => {
          const newPreviews = [...prev];
          URL.revokeObjectURL(newPreviews[index]);
          newPreviews.splice(index, 1);
          if (index === 0) setFrontProductImagePreview(newPreviews.length > 0 ? newPreviews[0] : null);
          return newPreviews;
      });
      setParams(prev => {
          const currentBulk = prev.bulkImages ? [...prev.bulkImages] : [];
          currentBulk.splice(index, 1);
          return { ...prev, bulkImages: currentBulk, frontProductImage: currentBulk.length > 0 ? currentBulk[0] : undefined };
      });
  }, []);

  const handleSaveModel = useCallback(async (image: GeneratedImage) => {
      if (!handleRequireAuth()) return;
      const modelName = `Model #${Math.floor(1000 + Math.random() * 9000)}`;
      try {
          const newModels = await userService.saveModel(modelName, image.imageUrl, savedModels);
          setSavedModels(newModels);
          setToast({ message: `Saved as "${modelName}"!`, type: 'success' });
      } catch (err: any) {
          setToast({ message: "Failed to save model.", type: 'error' });
      }
  }, [savedModels, handleRequireAuth]);

  const handleGenerate = useCallback(async (currentParams: GenerateImageParams, previewUrlOverride?: string) => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    const cost = calculateGenerationCost(currentParams, userTier);
    const isFreeTrialGeneration = userTier === 'Free' && currentParams.resolutionQuality === ResolutionQuality.Standard && cost > 0 && cost <= (FREE_TRIAL_LIMIT - freeGenerationsUsed);
    if (!isFreeTrialGeneration && !checkAndDeductCredits(cost)) { isGeneratingRef.current = false; return; }
    
    generationModeRef.current = currentParams.appMode;
    setIsLoading(true);
    setError(null);
    setActiveMode(null); 
    setCurrentView(View.Dashboard); 
    setIsStoryboardResult(!!currentParams.storyboardScenes && currentParams.storyboardScenes.length > 0);
    
    try {
      const results = await generateImages(currentParams, userTier, brandKit, previewUrlOverride ?? frontProductImagePreview ?? undefined, (current, total) => setBatchProgress({ current, total }));
      setGeneratedImages(results);
      if (isFreeTrialGeneration) {
          setFreeGenerationsUsed(prev => prev + cost);
      }
    } catch (err) {
      if (!isFreeTrialGeneration) refundCredits(cost);
      handleApiError(err);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false; 
    }
  }, [userTier, freeGenerationsUsed, frontProductImagePreview, brandKit, handleApiError, checkAndDeductCredits, refundCredits]);

  const handleReturnToSettings = useCallback(() => { setGeneratedImages([]); setActiveMode(lastActiveMode); }, [lastActiveMode]);
  
  const handleStartEdit = useCallback(async (image?: GeneratedImage, tab: 'inpaint' | 'crop' | 'background' = 'inpaint') => {
      if (image && Object.keys(image.params).length === 0) {
          const detailed = await designService.getDesignDetails(image.id);
          if (!detailed) { setToast({ message: "Could not load design details.", type: 'error' }); return; }
          updateDesign(detailed);
          setEditingImage(detailed);
      } else {
          setEditingImage(image || { id: `edit-placeholder-${Date.now()}`, imageUrl: '', caption: '', hashtags: '', aspectRatio: '1:1', timestamp: Date.now(), params: INITIAL_GENERATE_PARAMS });
      }
      setEditModalInitialTab(tab);
  }, [updateDesign]);

  const handleApplyEdit = useCallback(async (editParams: EditImageParams) => {
      if (!checkAndDeductCredits(1)) return;
      setIsEditing(true); 
      try {
          const result = await editImage(editParams);
          if (editingImage) setEditingImage({ ...editingImage, imageUrl: result.imageUrl });
      } catch (e) {
          refundCredits(1); 
          setToast({ message: "Edit failed", type: 'error' });
      } finally {
          setIsEditing(false);
      }
  }, [editingImage, checkAndDeductCredits, refundCredits]);

  const handleImageUpdate = useCallback((id: string, newUrl: string) => {
      if (editingImage && editingImage.id === id) {
          setEditingImage({ ...editingImage, imageUrl: newUrl });
      }
  }, [editingImage]);

  const handleLoginSuccess = (session: AuthSession) => {
    setUserProfile(session.user);
  };
    
  const handleGenerateCaption = useCallback(async (imageId: string, captionParams: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => {
    const imageToCaption = generatedImages.find(img => img.id === imageId) || designs.find(d => d.id === imageId);
    if (!imageToCaption) return;
    
    setGeneratingCaptionImageId(imageId);
    try {
      const result = await generateCaption({
        imageUrl: imageToCaption.imageUrl,
        ...captionParams,
      }, brandKit);
      
      setGeneratedImages(prev => prev.map(img => 
        img.id === imageId 
        ? { ...img, caption: result.caption, hashtags: result.hashtags || '' } 
        : img
      ));
      
      updateDesign({ ...imageToCaption, caption: result.caption, hashtags: result.hashtags || '' });
    } catch(err: any) {
      setToast({ message: `Caption generation failed: ${err.message}`, type: 'error' });
    } finally {
      setGeneratingCaptionImageId(null);
    }
  }, [generatedImages, brandKit, updateDesign, designs]);

  const handleOpenABTestModal = useCallback((image: GeneratedImage) => {
    setAbTestModalImage(image);
  }, []);

  const handleFloatingGenerate = useCallback(() => {
    const floatingParams: GenerateImageParams = {
        ...INITIAL_GENERATE_PARAMS,
        appMode: floatingMode,
        productDescription: floatingPrompt,
        frontProductImage: floatingImageFile || undefined,
        aspectRatios: [AspectRatio.PortraitPost]
    };
    handleGenerate(floatingParams, floatingImagePreview || undefined);
    setFloatingPrompt('');
    setFloatingImageFile(null);
    setFloatingImagePreview(null);
  }, [floatingMode, floatingPrompt, floatingImageFile, handleGenerate, floatingImagePreview]);

  const handleFloatingImageFileChange = useCallback(async (file: File | null) => {
    setFloatingImageFile(file);
    if (file) setFloatingImagePreview(URL.createObjectURL(file));
    else setFloatingImagePreview(null);
  }, []);
  
  const handleRemoveFloatingImage = useCallback(() => handleFloatingImageFileChange(null), [handleFloatingImageFileChange]);

  const handleTriggerFloatingUpload = useCallback(() => floatingImageInputRef.current?.click(), []);

  const handleInternalImageDrop = useCallback((image: GeneratedImage, targetMode?: AppMode) => {
      if (targetMode) {
        setActiveMode(targetMode);
        fetch(image.imageUrl).then(res => res.blob()).then(blob => {
            const file = new File([blob], "dropped-image.png", { type: blob.type });
            handleFileChange(file, 'frontProductImage', setFrontProductImagePreview, { maxWidth: 1024, maxHeight: 1024 });
        });
      }
  }, [handleFileChange]);

  const handleRemoveBackgroundAction = useCallback(async () => {
    if (!editingImage) return;
    if (!checkAndDeductCredits(1)) return;
    
    setIsEditing(true);
    try {
        const { data, mimeType } = dataURLToParts(editingImage.imageUrl);
        const result = await removeBackground(data, mimeType);
        const newUrl = `data:${result.mimeType};base64,${result.data}`;
        setEditingImage(prev => prev ? ({ ...prev, imageUrl: newUrl }) : null);
    } catch (e) {
        refundCredits(1);
        setToast({ message: "Background removal failed", type: 'error' });
    } finally {
        setIsEditing(false);
    }
  }, [editingImage, checkAndDeductCredits, refundCredits]);

  if (isAuthLoading) {
      return (
          <div className="w-screen h-screen flex items-center justify-center bg-main">
              <Spinner />
          </div>
      );
  }

  if (!user) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ErrorBoundary>
        {!isOnline && <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-1 text-sm z-[100] font-medium shadow-md">You are offline. Features may be limited.</div>}
        
        <div className="relative w-screen h-screen bg-main font-sans flex overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <DashboardSidebar 
                onSelectMode={handleSelectMode} 
                onSetView={handleSetView}
                onStartImageEdit={() => handleStartEdit(undefined, 'background')}
                currentView={currentView}
                isOpen={isSidebarOpen}
                onOpen={() => setIsSidebarOpen(true)}
                onClose={() => setIsSidebarOpen(false)}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                onOpenContentGenerator={handleOpenContentGeneratorModal}
                onOpenSupport={handleOpenSupportModal}
                onOpenBrandKit={handleOpenBrandKitModal}
                isAdmin={isAdmin}
                onToggleAdmin={() => setIsAdmin(!isAdmin)}
                user={user}
                onLogin={() => {}}
                onLogout={handleLogout}
                onInternalImageDrop={handleInternalImageDrop}
            />

            <main className="flex-1 flex flex-col overflow-hidden lg:ml-[92px]">
                 {currentView === View.Dashboard && (
                    generatedImages.length > 0 || isLoading || error ? (
                        <MainContent
                            params={params}
                            frontProductImagePreview={frontProductImagePreview}
                            generatedImages={generatedImages}
                            isLoading={isLoading}
                            error={error}
                            onReturnToSettings={handleReturnToSettings}
                            onStartEdit={handleStartEdit}
                            onSetStoryboardSource={setStoryboardSourceImage}
                            onSetZoomedImage={setZoomedImage}
                            isStoryboardResult={isStoryboardResult}
                            onGenerateCaption={handleGenerateCaption}
                            generatingCaptionImageId={generatingCaptionImageId}
                            onOpenABTestModal={handleOpenABTestModal}
                            onSaveModel={handleSaveModel}
                        />
                    ) : (
                        <Dashboard
                            onSelectMode={handleSelectMode}
                            onStartImageEdit={(img) => handleStartEdit(img, 'background')}
                            onOpenFeedbackModal={handleOpenFeedbackModal}
                            onOpenPricingModal={handleOpenPricingModal}
                            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                            userName={user?.name?.split(' ')[0]}
                            isLoading={isLoading}
                            floatingPrompt={floatingPrompt}
                            onFloatingPromptChange={setFloatingPrompt}
                            floatingImagePreview={floatingImagePreview}
                            onFloatingGenerate={handleFloatingGenerate}
                            onRemoveFloatingImage={handleRemoveFloatingImage}
                            onTriggerFloatingUpload={handleTriggerFloatingUpload}
                            onOpenContentGenerator={handleOpenContentGeneratorModal}
                            userTier={userTier}
                            isAdmin={isAdmin}
                            onInternalImageDrop={handleInternalImageDrop}
                            onFloatingImageDrop={handleFloatingImageFileChange}
                            floatingMode={floatingMode}
                            onFloatingModeChange={setFloatingMode}
                        />
                    )
                )}
                {currentView === View.Analytics && <Suspense fallback={<Spinner />}><AnalyticsDashboard onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onSetView={handleSetView} /></Suspense>}
                {currentView === View.MyDesigns && <MyDesigns onSetView={handleSetView} onStartEdit={handleStartEdit} onSetZoomedImage={setZoomedImage} onSetStoryboardSource={() => {}} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onRemix={handleRemixDesign} />}
                {currentView === View.Profile && user && <Suspense fallback={<Spinner />}><ProfilePage user={user} credits={credits} userTier={userTier} onEditProfile={handleOpenProfileEditModal} onUpgradePlan={handleOpenPricingModal} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onSetView={handleSetView} onOpenFeedbackModal={handleOpenFeedbackModal} recentActivity={recentActivity} /></Suspense>}
                {currentView === View.Inspiration && <Suspense fallback={<Spinner />}><InspirationPage onSetView={handleSetView} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onRemix={handleRemix} items={inspirationItems} isLoaded={isInspirationLoaded} onItemsLoaded={setInspirationItems} /></Suspense>}
            </main>

            {activeMode && (
                <CreativeModal
                    key={activeMode} 
                    mode={activeMode}
                    onClose={() => setActiveMode(null)}
                    params={params}
                    onParamsChange={setParams}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                    onFileChange={handleFileChange}
                    frontProductImagePreview={frontProductImagePreview}
                    setFrontProductImagePreview={setFrontProductImagePreview}
                    bulkImagePreviews={bulkImagePreviews}
                    onBulkFilesChange={handleBulkFilesChange}
                    onRemoveBulkImage={handleRemoveBulkImage}
                    remixReferenceImagePreview={remixReferenceImagePreview}
                    setRemixReferenceImagePreview={setRemixReferenceImagePreview}
                    remixProductImagePreview={remixProductImagePreview}
                    setRemixProductImagePreview={setRemixProductImagePreview}
                    onGenerateVariants={() => {}}
                    storyboardSourceImage={storyboardSourceImage}
                    onClearStoryboardSource={() => setStoryboardSourceImage(null)}
                    userTier={userTier}
                    onOpenPricingModal={handleOpenPricingModal}
                    freeGenerationsUsed={freeGenerationsUsed}
                    savedModels={savedModels}
                    onReset={handleResetParams}
                />
            )}
            
            <Suspense fallback={null}>
                {editingImage && <EditModal image={editingImage} onClose={() => setEditingImage(null)} onApplyEdit={handleApplyEdit} onRemoveBackground={handleRemoveBackgroundAction} onImageUpdate={handleImageUpdate} isEditing={isEditing} initialTab={editModalInitialTab} />}
                {zoomedImage && <ZoomModal image={zoomedImage} onClose={() => setZoomedImage(null)} />}
            </Suspense>

            {(isLoading || isEditing) && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-[100]">
                    <Spinner />
                    <p className="text-white mt-4 text-lg">{loadingMessages.title}</p>
                </div>
            )}
        </div>
    </ErrorBoundary>
  );
};

export default App;
