
import React, { useState, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import { MainContent } from './components/MainContent';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, BrandKit, SavedModel } from './types';
import { generateImages, editImage, generateCaption, generateVariantSuggestions, detectProductCategory, fileToBase64, removeBackground } from './services/gemini';
import { user as userService, UserProfileData } from './services/user';
import { designs as designService } from './services/designs'; 
import { storage as storageService } from './services/storage'; 
import { auth as authService, AuthSession } from './services/auth';
import { brand as brandService } from './services/brand';
import { Spinner } from './components/ui/Spinner';
import { AppMode, AspectRatio, ResolutionQuality, ProductCategory, View } from './types';
import { AI_SUGGESTED, FREE_TRIAL_LIMIT, LOADING_MESSAGES, STORAGE_LIMITS, INITIAL_GENERATE_PARAMS } from './constants';
import { processImageFile, dataURLtoFile, fileToGeneratedImage } from './utils/images';
import { debounce, getActionLabel } from './utils/helpers';
import { getModeConfiguration } from './utils/appModes';
import { DashboardSidebar } from './components/DashboardSidebar';
import { Dashboard } from './components/Dashboard';
import { CreativeModal } from './components/CreativeModal';
import { MyDesigns } from './components/MyDesigns';
import { Icon } from './components/ui/Icon';
import { Toast } from './components/ui/Toast';
import { Button } from './components/ui/Button';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { calculateGenerationCost } from './utils/costs';


const EditModal = lazy(() => import('./components/EditModal'));
const ZoomModal = lazy(() => import('./components/ZoomModal'));
const DeployModal = lazy(() => import('./components/DeployModal'));
const ABTestModal = lazy(() => import('./components/ABTestModal'));
const QuickVariantsModal = lazy(() => import('./components/QuickVariantsModal'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal'));
const PricingModal = lazy(() => import('./components/PricingModal'));
const SupportModal = lazy(() => import('./components/SupportModal'));
const ContentGenerator = lazy(() => import('./components/ContentGenerator'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const ProfileEditModal = lazy(() => import('./components/ProfileEditModal'));
const InspirationPage = lazy(() => import('./components/InspirationPage'));
const BrandKitModal = lazy(() => import('./components/BrandKitModal'));

const App: React.FC = () => {
  const isOnline = useNetworkStatus();
  
  const [activeMode, setActiveMode] = useState<AppMode | null>(null);
  const [lastActiveMode, setLastActiveMode] = useState<AppMode | null>(null);
  
  const [params, setParams] = useState<GenerateImageParams>(() => {
      const saved = localStorage.getItem('krackx_last_params');
      return saved ? { ...INITIAL_GENERATE_PARAMS, ...JSON.parse(saved) } : INITIAL_GENERATE_PARAMS;
  });

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [posterBoard, setPosterBoard] = useState<GeneratedImage[]>([]);
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
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isContentGeneratorModalOpen, setIsContentGeneratorModalOpen] = useState(false);
  const [isBrandKitModalOpen, setIsBrandKitModalOpen] = useState(false);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [abTestModalImage, setAbTestModalImage] = useState<GeneratedImage | null>(null);
  const [frontProductImagePreview, setFrontProductImagePreview] = useState<string | null>(null);
  const [remixReferenceImagePreview, setRemixReferenceImagePreview] = useState<string | null>(null);
  const [remixProductImagePreview, setRemixProductImagePreview] = useState<string | null>(null);
  const [quickVariantsField, setQuickVariantsField] = useState<'modelPersona' | 'poseSuggestion' | null>(null);
  const [isVariantsLoading, setIsVariantsLoading] = useState(false);
  const [variantSuggestions, setVariantSuggestions] = useState<string[]>([]);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSavingDesign, setIsSavingDesign] = useState<string | null>(null); 
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  
  const [isAdmin, setIsAdmin] = useState(true);
  const [credits, setCredits] = useState(0); 
  const [totalCredits, setTotalCredits] = useState(100);
  const [userTier, setUserTier] = useState<'Free' | 'Starter' | 'Standard' | 'Agency'>('Starter');
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(0);

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  
  const [loadingMessages, setLoadingMessages] = useState<{title: string, subtext: string}>({ title: '', subtext: '' });
  const generationModeRef = useRef<AppMode | null>(null);
  
  const isGeneratingRef = useRef(false);

  const frontProductImageRef = useRef<File | undefined>(undefined); 
  const frontProductImageBase64Ref = useRef<string | null>(null); 
  const imageEditInputRef = useRef<HTMLInputElement>(null);

  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [floatingImageFile, setFloatingImageFile] = useState<File | null>(null);
  const [floatingImagePreview, setFloatingImagePreview] = useState<string | null>(null);
  const floatingImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const { frontProductImage, bulkImages, backProductImage, customAvatarImage, outfitReferenceImage, logoImage, remixReferenceImage, remixProductImage, ...safeParams } = params;
      localStorage.setItem('krackx_last_params', JSON.stringify(safeParams));
  }, [params]);

  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (generatedImages.length > 0 && !isSavingDesign) {
              e.preventDefault();
              e.returnValue = ''; 
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [generatedImages.length, isSavingDesign]);

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
    const fetchData = async () => {
        try {
            const session = await authService.getSession();
            if (session) {
                setUserProfile(session.user);
                setUserTier(session.user.tier);
                if (session.user.id !== 'guest-user-id') {
                    const [creditData, savedDesigns, userBrandKit, models] = await Promise.all([
                        userService.getCredits(),
                        designService.getSavedDesigns(),
                        brandService.getBrandKit(),
                        userService.getSavedModels()
                    ]);
                    setCredits(creditData.current);
                    setTotalCredits(creditData.total);
                    setPosterBoard(savedDesigns);
                    setBrandKit(userBrandKit);
                    setSavedModels(models);
                } else {
                    setCredits(25);
                    setTotalCredits(25);
                    setPosterBoard([]);
                    setBrandKit(null);
                    setSavedModels([]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch initial data", err);
            setToast({ message: "Network error: Could not load user data.", type: 'error' });
        } finally {
            setIsSessionChecked(true);
        }
    };
    fetchData();
  }, []);

  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      const paymentCancelled = urlParams.get('payment_cancelled');

      if (paymentSuccess) {
          setToast({ message: "Payment Successful! Credits updated.", type: 'success' });
          userService.getCredits().then(data => {
              setCredits(data.current);
              setTotalCredits(data.total);
          });
          window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentCancelled) {
          setToast({ message: "Payment cancelled.", type: 'error' });
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, []);
  
  const handleLoginSuccess = useCallback(async (session: AuthSession) => {
      setIsSidebarOpen(false); 
      setCurrentView(View.Dashboard); 
      setUserProfile(session.user);
      setUserTier(session.user.tier);
      setToast({ message: `Welcome back, ${session.user.name}!`, type: 'success' });
      
      if (session.user.id !== 'guest-user-id') {
          try {
              const [creditData, savedDesigns, userBrandKit, models] = await Promise.all([
                    userService.getCredits(),
                    designService.getSavedDesigns(),
                    brandService.getBrandKit(),
                    userService.getSavedModels()
              ]);
              setCredits(creditData.current);
              setTotalCredits(creditData.total);
              setPosterBoard(savedDesigns);
              setBrandKit(userBrandKit);
              setSavedModels(models);
          } catch (e) {
              console.error("Failed to load user data after login", e);
              setToast({ message: "Failed to sync account data. Please refresh.", type: 'error' });
          }
      } else {
          setCredits(25);
          setTotalCredits(25);
          setPosterBoard([]);
          setBrandKit(null);
          setSavedModels([]);
      }
  }, []);

  const handleLogout = useCallback(async () => {
      await authService.signOut();
      setUserProfile(null);
      setUserTier('Free');
      setCredits(0); 
      setTotalCredits(0);
      setPosterBoard([]);
      setBrandKit(null);
      setSavedModels([]);
      setCurrentView(View.Dashboard);
      setToast({ message: "Logged out successfully", type: 'success' });
  }, []);

  const handleRequireAuth = useCallback(() => {
      if (!userProfile || userProfile.id === 'guest-user-id') {
          setIsAuthModalOpen(true);
          return false;
      }
      return true;
  }, [userProfile]);

  const handleSetView = useCallback((view: View) => {
      if ((view === View.MyDesigns || view === View.Profile) && !userProfile) {
          setIsAuthModalOpen(true);
          return;
      }
      setCurrentView(view);
  }, [userProfile]);

  const recentActivity = React.useMemo(() => {
    const allImages = [...generatedImages, ...posterBoard];
    const uniqueImages = Array.from(new Map(allImages.map(img => [img.id, img])).values());
    
    return uniqueImages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 12) 
        .map(img => ({
            id: img.id,
            user: userProfile?.name || 'Guest',
            action: getActionLabel(img.params?.appMode || AppMode.Product), 
            imageUrl: img.imageUrl,
            timestamp: img.timestamp
        }));
  }, [generatedImages, posterBoard, userProfile]);

  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const handleOpenProfileEditModal = useCallback(() => setIsProfileEditModalOpen(true), []);
  const handleCloseProfileEditModal = useCallback(() => setIsProfileEditModalOpen(false), []);
  
  const handleUpdateProfile = useCallback(async (newProfileData: Partial<UserProfileData>) => {
      if (!userProfile) return;
      setUserProfile(prev => prev ? ({ ...prev, ...newProfileData }) : null);
      setIsProfileEditModalOpen(false);
      try {
          await userService.updateUserProfile(newProfileData);
          setToast({ message: "Profile updated successfully", type: 'success' });
      } catch (e) {
          setToast({ message: "Failed to save profile changes", type: 'error' });
      }
  }, [userProfile]);


  const handleOpenFeedbackModal = useCallback(() => setIsFeedbackModalOpen(true), []);
  const handleCloseFeedbackModal = useCallback(() => setIsFeedbackModalOpen(false), []);

  const handleOpenPricingModal = useCallback(() => {
    if (handleRequireAuth()) {
        setIsPricingModalOpen(true);
    }
  }, [handleRequireAuth]);

  const handleClosePricingModal = useCallback(() => setIsPricingModalOpen(false), []);

  const handleOpenSupportModal = useCallback(() => setIsSupportModalOpen(true), []);
  const handleCloseSupportModal = useCallback(() => setIsSupportModalOpen(false), []);

  const handleOpenContentGeneratorModal = useCallback(() => setIsContentGeneratorModalOpen(true), []);
  const handleCloseContentGeneratorModal = useCallback(() => setIsContentGeneratorModalOpen(false), []);

  const handleOpenBrandKitModal = useCallback(() => {
      if (!handleRequireAuth()) return;
      setIsBrandKitModalOpen(true);
  }, [handleRequireAuth]);

  const handleApiError = useCallback((err: unknown) => {
    let errorMessage = 'An unexpected error occurred.';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'object' && err !== null) {
      errorMessage = (err as any).message || (err as any).error_description || (err as any).error || JSON.stringify(err);
    } else if (typeof err === 'string') {
      errorMessage = err;
    }

    console.error("API Error Detail:", err);
    
    if (errorMessage.includes('deploy') || errorMessage.includes('invoke')) {
        setToast({ message: "System initializing. Please ensure functions are deployed.", type: 'error' });
        setError(errorMessage);
    } else if (errorMessage.includes('403') || errorMessage.includes('permission') || errorMessage.includes('API key')) {
        setToast({ message: "Access denied. Check API Key.", type: 'error' });
        setError(errorMessage);
    } else {
        setError(errorMessage);
    }
  }, []);

  const checkAndDeductCredits = useCallback((cost: number): boolean => {
      if (isAdmin) return true; 
      
      if (credits >= cost) {
          setCredits(prev => prev - cost);
          if (userProfile && userProfile.id !== 'guest-user-id') {
              userService.deductCredits(cost).catch(e => {
                  console.error("Credit sync failed", e);
              });
          }
          return true;
      }
      setToast({ message: `Insufficient credits! Required: ${cost}, Balance: ${credits}`, type: 'error' });
      setIsPricingModalOpen(true);
      return false;
  }, [credits, isAdmin, userProfile]);

  const refundCredits = useCallback((amount: number) => {
      if (isAdmin) return;
      setCredits(prev => prev + amount);
      if (userProfile && userProfile.id !== 'guest-user-id') {
          userService.deductCredits(-amount).catch(e => console.error("Refund failed", e));
      }
  }, [isAdmin, userProfile]);


  const handleSelectMode = useCallback((tool: AppMode) => {
    setLastActiveMode(tool);
    setParams(prev => {
        const updates = getModeConfiguration(tool, prev);
        if (tool !== AppMode.Remix && prev.appMode === AppMode.Remix) {
            setRemixReferenceImagePreview(null);
            setRemixProductImagePreview(null);
        }
        if (![AppMode.Product, AppMode.Influencer, AppMode.Fashion, AppMode.Festival].includes(tool) && frontProductImagePreview) {
            setFrontProductImagePreview(null);
        }
        return { ...prev, ...updates };
    });
    setActiveMode(tool);
  }, [frontProductImagePreview]);
  
  const handleParamChange = useCallback((param: keyof GenerateImageParams, value: any) => {
    setParams(prev => ({ ...prev, [param]: value }));
  }, []);

  const handleGenerate = useCallback(async (currentParams: GenerateImageParams, previewUrlOverride?: string) => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    if (!navigator.onLine) {
        setToast({ message: "You are offline. Please check your internet connection.", type: 'error' });
        setIsLoading(false);
        isGeneratingRef.current = false;
        return;
    }

    const cost = calculateGenerationCost(currentParams, userTier);
    const isFreeTier = userTier === 'Free';
    const isStandardGeneration = currentParams.resolutionQuality === ResolutionQuality.Standard;
    const remainingFree = FREE_TRIAL_LIMIT - freeGenerationsUsed;
    const isFreeTrialGeneration = isFreeTier && isStandardGeneration && cost > 0 && cost <= remainingFree;

    if (!isFreeTrialGeneration) {
        if (!checkAndDeductCredits(cost)) {
            isGeneratingRef.current = false; 
            return;
        }
    }
    
    generationModeRef.current = currentParams.appMode;
    setIsLoading(true);
    setBatchProgress(null);
    setError(null);
    
    setActiveMode(null); 
    setCurrentView(View.Dashboard); 
    setIsStoryboardResult(!!currentParams.storyboardScenes && currentParams.storyboardScenes.length > 0);
    
    let modelSeedUrl: string | undefined = undefined;
    if (currentParams.appMode === AppMode.Influencer && currentParams.modelSourceOption === 'existing' && currentParams.modelSeedId) {
        modelSeedUrl = savedModels.find(m => m.id === currentParams.modelSeedId)?.thumbnail_url;
    }

    try {
      const results = await generateImages(
          currentParams, 
          userTier,
          brandKit,
          previewUrlOverride ?? frontProductImagePreview ?? undefined,
          (current, total) => setBatchProgress({ current, total }),
          modelSeedUrl
      );
      setGeneratedImages(results);

      if (currentParams.appMode === AppMode.Influencer && currentParams.modelSourceOption === 'new' && results.length > 0) {
          const modelName = `${currentParams.modelGender} Model #${Math.floor(1000 + Math.random() * 9000)}`;
          if (userProfile && userProfile.id !== 'guest-user-id') {
              const newModels = await userService.saveModel(modelName, results[0].imageUrl, savedModels);
              setSavedModels(newModels);
              setToast({ message: `New Model "${modelName}" has been saved!`, type: 'success' });
          }
      }

      if (isFreeTrialGeneration) {
          setFreeGenerationsUsed(prev => prev + cost);
          setToast({ message: `${cost} free generation(s) used. ${remainingFree - cost} remaining.`, type: 'success' });
      }

      setStoryboardSourceImage(null); 
      setFloatingPrompt('');
      setFloatingImageFile(null);
    } catch (err) {
      if (!isFreeTrialGeneration && !isAdmin) {
          refundCredits(cost);
          setToast({ message: "Generation failed. Credits refunded.", type: 'success' });
      }
      handleApiError(err);
    } finally {
      setIsLoading(false);
      setBatchProgress(null);
      isGeneratingRef.current = false; 
    }
  }, [userTier, freeGenerationsUsed, frontProductImagePreview, brandKit, handleApiError, checkAndDeductCredits, savedModels, isAdmin, refundCredits, userProfile]);
  
  const handleStartEdit = useCallback((image?: GeneratedImage, initialMode: 'inpaint' | 'crop' | 'background' = 'inpaint') => {
    if (image) {
      setEditingImage(image);
      setEditModalInitialTab(initialMode);
    } else {
      if (initialMode === 'background') {
          const dummyImage: GeneratedImage = {
              id: 'new-bg-removal',
              imageUrl: '', 
              caption: 'Background Removal',
              hashtags: '',
              aspectRatio: AspectRatio.Square,
              params: INITIAL_GENERATE_PARAMS,
              timestamp: Date.now()
          };
          setEditingImage(dummyImage);
          setEditModalInitialTab(initialMode);
      } else {
          setEditModalInitialTab(initialMode);
          imageEditInputRef.current?.click();
      }
    }
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingImage(null);
  }, []);

  const handleApplyEdit = useCallback(async (editParams: EditImageParams) => {
    if (!editingImage) return;
    
    if (!checkAndDeductCredits(1)) return;

    generationModeRef.current = editingImage.params?.appMode || AppMode.Product;
    setIsEditing(true);
    setError(null);
    try {
      const editedImageData = await editImage(editParams);
      const updateImage = (img: GeneratedImage) => 
        img.id === editingImage.id 
          ? { ...img, imageUrl: editedImageData.imageUrl }
          : img;
      setGeneratedImages(prev => prev.map(updateImage));
      setPosterBoard(prev => prev.map(updateImage));
      setEditingImage(null); 
    } catch (err) {
      refundCredits(1); 
      handleApiError(err);
    } finally {
      setIsEditing(false);
    }
  }, [editingImage, handleApiError, checkAndDeductCredits, refundCredits]);

  const handleImageUpdate = useCallback((imageId: string, newImageUrl: string, sourceImageUrl?: string) => {
      setGeneratedImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, imageUrl: newImageUrl } : img
      ));
      setPosterBoard(prev => prev.map(img => 
          img.id === imageId ? { ...img, imageUrl: newImageUrl } : img
      ));
      
      setEditingImage(prev => {
          if (prev && prev.id === imageId) {
               return { ...prev, imageUrl: newImageUrl, sourceProductImageUrl: sourceImageUrl || prev.sourceProductImageUrl };
          }
          if (prev && imageId === 'new-bg-removal' && prev.id === 'new-bg-removal') {
               const newId = `gen-${Date.now()}`;
               const newImage = { 
                   ...prev, 
                   id: newId, 
                   imageUrl: newImageUrl,
                   sourceProductImageUrl: sourceImageUrl 
               };
               setGeneratedImages(g => [newImage, ...g]);
               return newImage;
          }
          return prev;
      });
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!editingImage) return;
    
    if (!checkAndDeductCredits(1)) return;

    generationModeRef.current = editingImage.params?.appMode || AppMode.Product;
    setIsEditing(true);
    try {
        const parts = editingImage.imageUrl.split(',');
        let base64 = parts[1];
        let mimeType = 'image/png';
        if (parts[0].includes(';')) {
            mimeType = parts[0].split(':')[1].split(';')[0];
        }
        
        const originalSource = editingImage.imageUrl;
        const result = await removeBackground(base64, mimeType);
        
        if (!result.data) throw new Error("Failed to generate background removal result.");

        const newImageUrl = `data:${result.mimeType};base64,${result.data}`;
        
        handleImageUpdate(editingImage.id, newImageUrl, originalSource);
        setToast({ message: "Background removed successfully", type: 'success' });
    } catch (err) {
        refundCredits(1); 
        handleApiError(err);
    } finally {
        setIsEditing(false);
    }
  }, [editingImage, checkAndDeductCredits, refundCredits, handleApiError, handleImageUpdate]);

  const handleGenerateCaption = useCallback(async (imageId: string, captionParams: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => {
    if (!checkAndDeductCredits(1)) return; 

    const imageToUpscale = [...generatedImages, ...posterBoard].find(img => img.id === imageId);
    if (!imageToUpscale) return;
    
    setGeneratingCaptionImageId(imageId);
    setError(null);
    try {
      const fullCaptionParams: GenerateCaptionParams = {
        ...captionParams,
        imageUrl: imageToUpscale.imageUrl,
        existingCaption: imageToUpscale.caption,
      };
      const result = await generateCaption(fullCaptionParams, brandKit);
      const updateImage = (img: GeneratedImage) => img.id === imageId ? { ...img, caption: result.caption, hashtags: result.hashtags } : img;
      setGeneratedImages(prev => prev.map(updateImage));
      setPosterBoard(prev => prev.map(updateImage));
    } catch (err) {
      refundCredits(1);
      handleApiError(err);
    } finally {
      setGeneratingCaptionImageId(null);
    }
  }, [generatedImages, posterBoard, brandKit, handleApiError, checkAndDeductCredits, refundCredits]);

  const addToPosterBoard = useCallback(async (image: GeneratedImage) => {
    if (!handleRequireAuth()) return;

    const limit = STORAGE_LIMITS[userTier] || 10;
    if (posterBoard.length >= limit) {
        setToast({ message: `Storage full! Free plan is limited to ${limit} designs. Upgrade to save more.`, type: 'error' });
        setIsPricingModalOpen(true);
        return;
    }

    if (!posterBoard.some(item => item.id === image.id)) {
      setIsSavingDesign(image.id);
      try {
          if (userProfile?.id === 'guest-user-id') {
              setPosterBoard(prev => [image, ...prev]);
              setToast({ message: 'Design saved locally (Guest Mode)', type: 'success' });
              return;
          }

          const fileName = `users/${userProfile?.id}/designs/${image.id}.png`;
          const publicUrl = await storageService.uploadImage(image.imageUrl, fileName);
          const imageToSave = { ...image, imageUrl: publicUrl };
          const savedImage = await designService.saveDesign(imageToSave);
          setPosterBoard(prev => [savedImage, ...prev]);
          setToast({ message: 'Design saved to My Designs!', type: 'success' });
      } catch (e: any) {
          console.error("Save failed:", e);
          setToast({ message: e.message || 'Failed to save design.', type: 'error' });
      } finally {
          setIsSavingDesign(null);
      }
    } else {
      setToast({ message: 'Design already saved.', type: 'success' });
    }
  }, [posterBoard, userProfile, handleRequireAuth, userTier]);

  const removeFromPosterBoard = useCallback(async (imageId: string) => {
    const originalBoard = [...posterBoard];
    setPosterBoard(prev => prev.filter(item => item.id !== imageId));
    
    if (userProfile?.id === 'guest-user-id') {
        setToast({ message: 'Design removed.', type: 'success' });
        return;
    }

    try {
        await designService.deleteDesign(imageId);
        setToast({ message: 'Design removed.', type: 'success' });
    } catch (e) {
        setPosterBoard(originalBoard); 
        setToast({ message: 'Failed to delete design.', type: 'error' });
    }
  }, [posterBoard, userProfile]);

  const handleSetStoryboardSource = useCallback((image: GeneratedImage) => {
    setStoryboardSourceImage(image);
    const mergedParams = { ...INITIAL_GENERATE_PARAMS, ...(image.params || {}) };
    setParams(prev => ({...prev, ...mergedParams})); 
    setActiveMode(image.params?.appMode || AppMode.Product); 
  }, []);

  const handleClearStoryboardSource = useCallback(() => {
    setStoryboardSourceImage(null);
  }, []);

  const handleSetZoomedImage = useCallback((image: GeneratedImage) => {
    setZoomedImage(image);
  }, []);

  const handleClearZoomedImage = useCallback(() => {
    setZoomedImage(null);
  }, []);

  const handleOpenDeployModal = useCallback(() => {
    if (posterBoard.length > 0) {
      setIsDeployModalOpen(true);
    }
  }, [posterBoard.length]);

  const handleCloseDeployModal = useCallback(() => {
    setIsDeployModalOpen(false);
  }, []);

  const handleOpenVariantsModal = useCallback(async (field: 'modelPersona' | 'poseSuggestion') => {
    if (!checkAndDeductCredits(1)) return; 

    setQuickVariantsField(field);
    setIsVariantsLoading(true);
    setVariantError(null);
    setVariantSuggestions([]);
    try {
      const suggestions = await generateVariantSuggestions(params.productDescription, field);
      setVariantSuggestions(suggestions);
    } catch (err) {
      refundCredits(1); 
      setVariantError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsVariantsLoading(false);
    }
  }, [params.productDescription, checkAndDeductCredits, refundCredits]);

  const handleSelectVariant = useCallback((suggestion: string) => {
    if (quickVariantsField) {
      setParams(prev => ({...prev, [quickVariantsField]: suggestion}));
    }
    setQuickVariantsField(null);
  }, [quickVariantsField]);

  const debouncedDetectProductCategory = useCallback(debounce(async (
      base64: string,
      mimeType: string,
      description: string
  ) => {
      try {
          const detectedCategory = await detectProductCategory(base64, mimeType, description);
          setParams(prev => ({
              ...prev,
              productCategory: detectedCategory,
              detectedCategory: detectedCategory,
          }));
      } catch (error: any) {
          console.error("Error detecting product category:", error);
          const msg = error.message || 'Unknown error';
          if (msg.includes('403') || msg.includes('401') || msg.includes('API key')) {
              setToast({ message: "API Error: Please check your API key configuration.", type: 'error' });
          } else if (msg.includes('429')) {
              setToast({ message: "Rate limit reached. Please wait a moment.", type: 'error' });
          }
          setParams(prev => ({ ...prev, productCategory: ProductCategory.Generic, detectedCategory: undefined }));
      }
  }, 500), []); 

  const handleFileChange = useCallback(async (
    file: File | null,
    paramName: keyof GenerateImageParams,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>,
    options: { maxWidth: number; maxHeight: number; format?: 'image/jpeg' | 'image/png' }
  ) => {
    previewSetter(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
    });
    setError(null);

    if (file) {
        let previewUrl: string | null = null;
        try {
            const processedFile = await processImageFile(file, options);
            
            previewUrl = URL.createObjectURL(processedFile);
            previewSetter(previewUrl);

            if (paramName === 'frontProductImage') {
                frontProductImageRef.current = processedFile; 
                const base64 = await fileToBase64(processedFile);
                frontProductImageBase64Ref.current = base64; 
                debouncedDetectProductCategory(base64, processedFile.type, params.productDescription);
                
                setParams(prev => ({
                    ...prev,
                    [paramName]: processedFile,
                }));
            } else if (paramName === 'remixReferenceImage') {
                setParams(prev => ({ ...prev, [paramName]: processedFile }));
            } else if (paramName === 'remixProductImage') {
                setParams(prev => ({ ...prev, [paramName]: processedFile }));
            } else {
                setParams(prev => ({ ...prev, [paramName]: processedFile, detectedCategory: undefined }));
            }
        } catch (error) {
            console.error(`Error processing ${paramName}:`, error);
            setError(error instanceof Error ? error.message : 'Failed to process image.');
            setParams(prev => ({ ...prev, [paramName]: undefined }));
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewSetter(null);
            if (paramName === 'frontProductImage') {
                frontProductImageRef.current = undefined;
                frontProductImageBase64Ref.current = null;
                setParams(prev => ({ ...prev, productCategory: ProductCategory.Generic, detectedCategory: undefined }));
            }
        }
    } else {
        setParams(prev => ({ ...prev, [paramName]: undefined }));
        if (paramName === 'frontProductImage') {
             frontProductImageRef.current = undefined;
             frontProductImageBase64Ref.current = null;
             setParams(prev => ({ ...prev, productCategory: ProductCategory.Generic, detectedCategory: undefined }));
        }
    }
  }, [params.productDescription, debouncedDetectProductCategory]);

  const handleInternalImageDrop = useCallback(async (image: GeneratedImage, targetMode?: AppMode) => {
      const finalMode = targetMode || AppMode.Remix;
      handleSelectMode(finalMode);
      try {
          const fileName = `internal-${image.id}.png`;
          const file = dataURLtoFile(image.imageUrl, fileName);
          if (finalMode === AppMode.Remix) {
              handleFileChange(file, 'remixReferenceImage', setRemixReferenceImagePreview, { maxWidth: 1024, maxHeight: 1024 });
          } else {
              handleFileChange(file, 'frontProductImage', setFrontProductImagePreview, { maxWidth: 1024, maxHeight: 1024 });
          }
          setToast({ message: `Image loaded into ${finalMode} mode!`, type: 'success' });
      } catch (err) {
          console.error("Internal drop processing failed", err);
          setToast({ message: "Failed to load dropped image.", type: 'error' });
      }
  }, [handleFileChange, handleSelectMode]);

  useEffect(() => {
    const handleKrackxDrop = (e: any) => {
        const { id, image } = e.detail;
        const fileName = `internal-${image.id}.png`;
        const file = dataURLtoFile(image.imageUrl, fileName);
        if (id === 'front-product-image-upload') {
            handleFileChange(file, 'frontProductImage', setFrontProductImagePreview, { maxWidth: 1024, maxHeight: 1024 });
        } else if (id === 'remix-reference-image-upload') {
            handleFileChange(file, 'remixReferenceImage', setRemixReferenceImagePreview, { maxWidth: 1024, maxHeight: 1024 });
        } else if (id === 'remix-product-image-upload') {
            handleFileChange(file, 'remixProductImage', setRemixProductImagePreview, { maxWidth: 1024, maxHeight: 1024, format: 'image/png' });
        }
    };
    window.addEventListener('krackx-internal-image-drop', handleKrackxDrop);
    return () => window.removeEventListener('krackx-internal-image-drop', handleKrackxDrop);
  }, [handleFileChange, params.appMode]);

  useEffect(() => {
      if (frontProductImageRef.current && frontProductImageBase64Ref.current) {
          debouncedDetectProductCategory(
              frontProductImageBase64Ref.current,
              frontProductImageRef.current.type,
              params.productDescription
          );
      }
  }, [params.productDescription, debouncedDetectProductCategory]);

  const handleImageEditFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const generatedImage = await fileToGeneratedImage(file);
        setEditingImage(generatedImage);
      } catch (error) {
        console.error("Error processing image for editing:", error);
        setError(error instanceof Error ? error.message : 'Failed to process image.');
      }
      if (imageEditInputRef.current) {
        imageEditInputRef.current.value = '';
      }
    }
  }, []);
  
  useEffect(() => {
      if (!floatingImageFile) {
        if (floatingImagePreview) URL.revokeObjectURL(floatingImagePreview);
        setFloatingImagePreview(null);
        return;
      }
      const objectUrl = URL.createObjectURL(floatingImageFile);
      setFloatingImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
  }, [floatingImageFile]);

  const handleFloatingImageFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const processedFile = await processImageFile(file, { maxWidth: 1024, maxHeight: 1024, format: 'image/png' });
              setFloatingImageFile(processedFile);
          } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to process image.');
              console.error(err);
          }
      }
      if (floatingImageInputRef.current) {
          floatingImageInputRef.current.value = '';
      }
  }, []);

  const handleRemoveFloatingImage = useCallback(() => {
      setFloatingImageFile(null);
  }, []);

  const handleFloatingGenerate = useCallback(() => {
      if (isGeneratingRef.current) return;
      
      if (!isOnline) {
          setToast({ message: "You are offline. Please check your internet connection.", type: 'error' });
          return;
      }

      const generationParams: GenerateImageParams = {
          ...INITIAL_GENERATE_PARAMS,
          appMode: AppMode.Influencer,
          productDescription: floatingPrompt,
          frontProductImage: floatingImageFile ?? undefined,
          aspectRatios: params.aspectRatios, 
          outputFormat: params.outputFormat,
          resolutionQuality: params.resolutionQuality,
      };
      handleGenerate(generationParams, floatingImagePreview ?? undefined);
  }, [floatingPrompt, floatingImageFile, params, handleGenerate, floatingImagePreview, isOnline]);

  const handleReturnToSettings = useCallback(() => {
    setGeneratedImages([]);
    setActiveMode(lastActiveMode);
  }, [lastActiveMode]);


  const renderCurrentView = () => {
    const onToggleSidebar = () => setIsSidebarOpen(p => !p);
    switch (currentView) {
        case View.MyDesigns:
            return <MyDesigns 
                        images={posterBoard} 
                        onRemove={removeFromPosterBoard} 
                        onDeploy={handleOpenDeployModal}
                        onSetView={handleSetView}
                        onStartEdit={handleStartEdit}
                        onSetZoomedImage={handleSetZoomedImage}
                        onSetStoryboardSource={handleSetStoryboardSource}
                        onToggleSidebar={onToggleSidebar}
                   />;
        case View.Profile:
            return (
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Spinner /></div>}>
                {userProfile ? (
                    <ProfilePage 
                      user={userProfile}
                      credits={credits}
                      userTier={userTier}
                      onEditProfile={handleOpenProfileEditModal}
                      onUpgradePlan={handleOpenPricingModal}
                      onToggleSidebar={onToggleSidebar}
                      onSetView={handleSetView}
                      onOpenFeedbackModal={handleOpenFeedbackModal}
                      recentActivity={recentActivity}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500 mb-4">Please log in to view your profile.</p>
                        <Button onClick={() => setIsAuthModalOpen(true)}>Sign In</Button>
                    </div>
                )}
              </Suspense>
            );
        case View.Inspiration:
            return (
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Spinner /></div>}>
                <InspirationPage 
                  onSetView={handleSetView}
                  onToggleSidebar={onToggleSidebar}
                />
              </Suspense>
            );
        case View.Dashboard:
        default:
             if (generatedImages.length > 0 || isLoading || error) {
              return (
                <MainContent
                  params={params}
                  frontProductImagePreview={frontProductImagePreview}
                  generatedImages={generatedImages}
                  isLoading={isLoading}
                  error={error}
                  onAddToPosterBoard={addToPosterBoard}
                  onStartEdit={handleStartEdit}
                  onSetStoryboardSource={handleSetStoryboardSource}
                  onSetZoomedImage={handleSetZoomedImage}
                  isStoryboardResult={isStoryboardResult}
                  onGenerateCaption={handleGenerateCaption}
                  generatingCaptionImageId={generatingCaptionImageId}
                  onOpenABTestModal={(image) => {
                      if (checkAndDeductCredits(2)) {
                          setAbTestModalImage(image);
                      }
                  }}
                  onReturnToSettings={handleReturnToSettings}
                />
              );
            }
            return (
                <Dashboard 
                    onSelectMode={handleSelectMode}
                    onStartImageEdit={(img) => handleStartEdit(img, img ? undefined : 'background')}
                    onOpenFeedbackModal={handleOpenFeedbackModal}
                    onOpenPricingModal={handleOpenPricingModal}
                    onToggleSidebar={onToggleSidebar}
                    floatingPrompt={floatingPrompt}
                    onFloatingPromptChange={setFloatingPrompt}
                    floatingImagePreview={floatingImagePreview}
                    onFloatingGenerate={handleFloatingGenerate}
                    onRemoveFloatingImage={handleRemoveFloatingImage}
                    onTriggerFloatingUpload={() => floatingImageInputRef.current?.click()}
                    onOpenContentGenerator={handleOpenContentGeneratorModal}
                    isAdmin={isAdmin}
                    userTier={userTier}
                    userName={userProfile?.name || 'there'}
                    onInternalImageDrop={handleInternalImageDrop}
                    isLoading={isLoading}
                />
            );
    }
  };

  if (!isSessionChecked) {
      return (
          <div className="w-screen h-screen flex items-center justify-center bg-main">
              <Spinner />
          </div>
      );
  }

  if (!userProfile) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ErrorBoundary>
        {!isOnline && (
            <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-1 text-sm z-[100] font-medium shadow-md">
                You are offline. Features may be limited.
            </div>
        )}
        
        <div className="relative w-screen h-screen bg-main font-sans flex overflow-hidden">
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
            
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
        {(isLoading || isEditing || isSavingDesign) && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-60">
            <Spinner />
            <p className="text-white mt-4 text-lg text-center px-4">
                { isSavingDesign
                    ? 'Saving Design...'
                    : (batchProgress ? `${loadingMessages.title} (${batchProgress.current}/${batchProgress.total})` : loadingMessages.title)
                }
            </p>
            {batchProgress && !isSavingDesign && !isEditing && (
                <div className="w-64 h-2 bg-slate-700 rounded-full mt-4 overflow-hidden">
                    <div 
                        className="h-full transition-all duration-300 bg-gradient-to-r from-cyan-400 to-primary relative overflow-hidden"
                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    >
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"></div>
                    </div>
                </div>
            )}
            <p className="text-slate-400 mt-2 text-sm text-center px-4">
                { isSavingDesign
                ? 'Uploading high-resolution assets to storage.'
                : loadingMessages.subtext
                }
            </p>
            </div>
        )}
        
        <input
            type="file"
            ref={imageEditInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageEditFileChange}
        />
        <input
            type="file"
            ref={floatingImageInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFloatingImageFileChange}
        />
        
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
            user={userProfile}
            onLogin={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
        />

        <main className="flex-1 flex flex-col overflow-hidden lg:ml-[92px]">
            {renderCurrentView()}
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
            storyboardSourceImage={storyboardSourceImage}
            onClearStoryboardSource={handleClearStoryboardSource}
            onFileChange={handleFileChange}
            frontProductImagePreview={frontProductImagePreview}
            setFrontProductImagePreview={setFrontProductImagePreview}
            remixReferenceImagePreview={remixReferenceImagePreview}
            setRemixReferenceImagePreview={setRemixReferenceImagePreview}
            remixProductImagePreview={remixProductImagePreview}
            setRemixProductImagePreview={setRemixProductImagePreview}
            onGenerateVariants={handleOpenVariantsModal}
            userTier={userTier}
            onOpenPricingModal={handleOpenPricingModal}
            freeGenerationsUsed={freeGenerationsUsed}
            savedModels={savedModels}
            />
        )}
        
        <Suspense fallback={null}>
            {isAuthModalOpen && (
                <AuthModal 
                    onClose={() => setIsAuthModalOpen(false)} 
                    onLoginSuccess={handleLoginSuccess}
                />
            )}

            {editingImage && (
            <EditModal 
                image={editingImage}
                onClose={handleCloseEdit}
                onApplyEdit={handleApplyEdit}
                onRemoveBackground={handleRemoveBackground}
                onImageUpdate={handleImageUpdate}
                isEditing={isEditing}
                initialTab={editModalInitialTab}
            />
            )}

            {zoomedImage && (
            <ZoomModal 
                image={zoomedImage}
                onClose={handleClearZoomedImage}
            />
            )}

            {isDeployModalOpen && (
            <DeployModal 
                images={posterBoard}
                onClose={handleCloseDeployModal}
            />
            )}

            {abTestModalImage && (
                <ABTestModal
                    image={abTestModalImage}
                    onClose={() => setAbTestModalImage(null)}
                    onGenerate={() => { }}
                    onApiError={() => refundCredits(2)}
                />
            )}

            {quickVariantsField && (
            <QuickVariantsModal
                field={quickVariantsField}
                isLoading={isVariantsLoading}
                suggestions={variantSuggestions}
                error={variantError}
                onClose={() => setQuickVariantsField(null)}
                onSelect={handleSelectVariant}
            />
            )}

            {isFeedbackModalOpen && (
            <FeedbackModal onClose={handleCloseFeedbackModal} />
            )}

            {isPricingModalOpen && (
            <PricingModal onClose={handleClosePricingModal} />
            )}
            
            {isSupportModalOpen && (
            <SupportModal onClose={handleCloseSupportModal} />
            )}
            
            {isProfileEditModalOpen && userProfile && (
            <ProfileEditModal
                user={userProfile}
                onClose={handleCloseProfileEditModal}
                onSave={handleUpdateProfile}
            />
            )}

            {isContentGeneratorModalOpen && (
            <ContentGenerator 
                onClose={handleCloseContentGeneratorModal} 
                onDeductCredits={checkAndDeductCredits}
                onRefundCredits={refundCredits}
                userId={userProfile?.id}
            />
            )}

            {isBrandKitModalOpen && (
            <BrandKitModal 
                initialKit={brandKit}
                onClose={() => setIsBrandKitModalOpen(false)}
                onSave={(newKit) => {
                setBrandKit(newKit);
                setToast({ message: "Brand identity updated and persisted!", type: "success" });
                }}
            />
            )}
        </Suspense>
        </div>
    </ErrorBoundary>
  );
};

export default App;
