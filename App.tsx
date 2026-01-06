
import React, { useState, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import { MainContent } from './components/MainContent';
import type { GenerateImageParams, GeneratedImage, EditImageParams, BrandKit, SavedModel, InspirationItem } from './types';
import { generateImages, editImage, generateCaption, generateVariantSuggestions, detectProductCategory, fileToBase64, removeBackground } from './services/geminiService';
import { userService, UserProfileData } from './services/userService';
import { designService } from './services/designService'; 
import { storageService } from './services/storageService'; 
import { authService, AuthSession } from './services/authService';
import { brandService } from './services/brandService';
import { Spinner } from './components/ui/Spinner';
import { AppMode, ResolutionQuality, ProductCategory, View } from './types';
import { AI_SUGGESTED, FREE_TRIAL_LIMIT, LOADING_MESSAGES, INITIAL_GENERATE_PARAMS } from './constants';
import { processImageFile, dataURLtoFile, fileToGeneratedImage } from './utils/images';
import { debounce, getActionLabel } from './utils/helpers';
import { getModeDefaults } from './utils/configLogic'; 
import { calculateGenerationCost } from './utils/costs'; 
import { DashboardSidebar } from './components/DashboardSidebar';
import { Dashboard } from './components/Dashboard';
import { CreativeModal } from './components/CreativeModal';
import { MyDesigns } from './components/MyDesigns';
import { Toast } from './components/ui/Toast';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { useNetworkStatus } from './hooks/useNetworkStatus';

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
  const [isRemixMode, setIsRemixMode] = useState(false);
  
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
  
  // Single image preview
  const [frontProductImagePreview, setFrontProductImagePreview] = useState<string | null>(null);
  // Bulk image previews
  const [bulkImagePreviews, setBulkImagePreviews] = useState<string[]>([]);

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
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0); 
  const [totalCredits, setTotalCredits] = useState(100);
  const [userTier, setUserTier] = useState<'Free' | 'Starter' | 'Standard' | 'Agency'>('Starter');
  
  // Persistent Free Usage
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(() => {
      const saved = localStorage.getItem('krackx_free_usage');
      return saved ? parseInt(saved, 10) : 0;
  });

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // App Loading State
  const [showSplash, setShowSplash] = useState(true);
  
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
      localStorage.setItem('krackx_free_usage', freeGenerationsUsed.toString());
  }, [freeGenerationsUsed]);

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
    const initApp = async () => {
        const minWait = new Promise(resolve => setTimeout(resolve, 2500)); // Show splash for at least 2.5s
        
        try {
            const session = await authService.getSession();
            if (session) {
                setUserProfile(session.user);
                setUserTier(session.user.tier);
                if (session.user.role === 'Administrator') setIsAdmin(true);
                
                if (session.user.id !== 'guest-user-id') {
                    // Fetch heavy data while splash is showing
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
                    } catch (dataError) {
                        console.error("Partial data load failure", dataError);
                        // Don't block app load for data fetch errors
                    }
                } else {
                    setCredits(25);
                    setTotalCredits(25);
                    setPosterBoard([]);
                    setBrandKit(null);
                    setSavedModels([]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch initial session", err);
        } finally {
            await minWait; // Ensure splash duration
            setShowSplash(false);
        }
    };
    
    initApp();
  }, []);

  const handleLoginSuccess = useCallback(async (session: AuthSession) => {
      setIsSidebarOpen(false); 
      setCurrentView(View.Dashboard); 
      setUserProfile(session.user);
      setUserTier(session.user.tier);
      if (session.user.role === 'Administrator') setIsAdmin(true);
      else setIsAdmin(false);

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
      setIsAdmin(false);
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
    setIsRemixMode(false);
    setParams(prev => {
        const updates = getModeDefaults(tool, prev); // Use new logic
        if (tool !== AppMode.Remix && prev.appMode === AppMode.Remix) {
            setRemixReferenceImagePreview(null);
            setRemixProductImagePreview(null);
        }
        if (![AppMode.Product, AppMode.Influencer, AppMode.Fashion, AppMode.Festival].includes(tool) && frontProductImagePreview) {
            setFrontProductImagePreview(null);
            setBulkImagePreviews([]); 
        }
        return { ...prev, ...updates };
    });
    setActiveMode(tool);
  }, [frontProductImagePreview]);
  
  const handleRemix = useCallback((item: InspirationItem) => {
      setLastActiveMode(item.appMode);
      setIsRemixMode(true);
      setFrontProductImagePreview(null);
      setBulkImagePreviews([]);
      
      setParams(prev => {
          const baseDefaults = getModeDefaults(item.appMode, INITIAL_GENERATE_PARAMS);
          return {
              ...INITIAL_GENERATE_PARAMS,
              ...baseDefaults,
              ...item.remixParams,
              appMode: item.appMode,
              frontProductImage: undefined,
              bulkImages: undefined,
              remixReferenceImage: undefined,
              remixProductImage: undefined
          };
      });
      
      setActiveMode(item.appMode);
      setCurrentView(View.Dashboard);
      setToast({ message: `Remixing style: ${item.title}`, type: 'success' });
  }, []);

  const handleRemixDesign = useCallback(async (image: GeneratedImage) => {
      try {
          let referenceFile: File | undefined = undefined;
          try {
              const response = await fetch(image.imageUrl);
              const blob = await response.blob();
              referenceFile = new File([blob], "remix-reference.png", { type: "image/png" });
          } catch (e) {
              console.warn("Could not fetch blob from URL for remix, defaulting to URL preview only.");
          }

          setActiveMode(AppMode.Remix);
          setRemixReferenceImagePreview(image.imageUrl);
          
          setParams(prev => ({
              ...INITIAL_GENERATE_PARAMS,
              appMode: AppMode.Remix,
              productDescription: image.params?.productDescription || '',
              remixReferenceImage: referenceFile 
          }));
          
          setCurrentView(View.Dashboard);
          setToast({ message: "Design loaded into Remix Studio!", type: 'success' });
      } catch (e) {
          console.error("Failed to load design for remix", e);
          setToast({ message: "Failed to load design.", type: 'error' });
      }
  }, []);
  
  const handleResetParams = useCallback(() => {
    if (!activeMode) return;
    setParams(prev => {
      const modeDefaults = getModeDefaults(activeMode, INITIAL_GENERATE_PARAMS);
      return {
        ...INITIAL_GENERATE_PARAMS,
        ...modeDefaults,
        appMode: activeMode,
        // Preserve assets
        frontProductImage: prev.frontProductImage,
        bulkImages: prev.bulkImages,
        remixReferenceImage: prev.remixReferenceImage,
        remixProductImage: prev.remixProductImage,
        logoImage: prev.logoImage,
        customAvatarImage: prev.customAvatarImage,
        outfitReferenceImage: prev.outfitReferenceImage,
        productCategory: prev.productCategory,
        detectedCategory: prev.detectedCategory
      };
    });
    setToast({ message: "Parameters have been removed.", type: 'success' });
  }, [activeMode]);

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
          setParams(prev => ({ ...prev, productCategory: ProductCategory.Generic, detectedCategory: undefined }));
      }
  }, 500), []); 

  // --- FILE HANDLING ---

  const handleBulkFilesChange = useCallback(async (files: File[]) => {
      const MAX_FILES = 3;
      const currentBulk = params.bulkImages || [];
      const currentPreviews = bulkImagePreviews;

      const availableSlots = MAX_FILES - currentBulk.length;
      if (availableSlots <= 0) {
          setToast({ message: `You can only upload up to ${MAX_FILES} images in total.`, type: 'error' });
          return;
      }
      
      const filesToProcess = files.slice(0, availableSlots);
      if (files.length > availableSlots) {
          setToast({ message: `Limit reached. Only the first ${availableSlots} image(s) were added.`, type: 'success' });
      }
      
      // Create previews immediately
      const newPreviews = filesToProcess.map(f => URL.createObjectURL(f));

      // Process new files
      const processedNewFiles = await Promise.all(filesToProcess.map(f => processImageFile(f, { maxWidth: 2048, maxHeight: 2048, format: 'image/png' })));
      
      const combinedFiles = [...currentBulk, ...processedNewFiles];
      const combinedPreviews = [...currentPreviews, ...newPreviews];

      setBulkImagePreviews(combinedPreviews);
      setParams(prev => ({
          ...prev,
          bulkImages: combinedFiles,
          frontProductImage: combinedFiles[0] 
      }));
      setFrontProductImagePreview(combinedPreviews[0]); // Sync main preview

      // Detect category on the newest/first image added if none detected yet
      if (processedNewFiles.length > 0 && !params.detectedCategory) {
          const base64 = await fileToBase64(processedNewFiles[0]);
          debouncedDetectProductCategory(base64, processedNewFiles[0].type, params.productDescription);
      }

  }, [params.bulkImages, bulkImagePreviews, params.productDescription, params.detectedCategory, debouncedDetectProductCategory]);


  const handleFileChange = useCallback(async (
    file: File | null,
    paramName: keyof GenerateImageParams,
    previewSetter: React.Dispatch<React.SetStateAction<string | null>>,
    options: { maxWidth: number; maxHeight: number; format?: 'image/jpeg' | 'image/png' }
  ) => {
    // Revoke old URL if overwriting
    if (file === null) {
        previewSetter(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    }

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
                
                // Clear bulk if setting single main image explicitly (legacy behavior, but helpful for reset)
                setBulkImagePreviews([previewUrl]); 
                setParams(prev => ({
                    ...prev,
                    [paramName]: processedFile,
                    bulkImages: [processedFile] 
                }));
            } else {
                // Non-main images (logo, remix ref, etc)
                setParams(prev => ({ ...prev, [paramName]: processedFile }));
            }
        } catch (error) {
            console.error(`Error processing ${paramName}:`, error);
            setError(error instanceof Error ? error.message : 'Failed to process image.');
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            previewSetter(null);
        }
    } else {
        setParams(prev => ({ ...prev, [paramName]: undefined }));
        if (paramName === 'frontProductImage') {
             frontProductImageRef.current = undefined;
             frontProductImageBase64Ref.current = null;
             setParams(prev => ({ ...prev, productCategory: ProductCategory.Generic, detectedCategory: undefined }));
             setBulkImagePreviews([]);
             setParams(prev => ({ ...prev, bulkImages: undefined }));
        }
    }
  }, [params.productDescription, debouncedDetectProductCategory]);

  // Remove specific image from bulk
  const handleRemoveBulkImage = useCallback((index: number) => {
      setBulkImagePreviews(prev => {
          const newPreviews = [...prev];
          URL.revokeObjectURL(newPreviews[index]); // Cleanup
          newPreviews.splice(index, 1);
          
          // Sync front preview if we removed the first one
          if (index === 0) {
              setFrontProductImagePreview(newPreviews.length > 0 ? newPreviews[0] : null);
          }
          return newPreviews;
      });

      setParams(prev => {
          const currentBulk = prev.bulkImages ? [...prev.bulkImages] : [];
          currentBulk.splice(index, 1);
          
          return {
              ...prev,
              bulkImages: currentBulk,
              frontProductImage: currentBulk.length > 0 ? currentBulk[0] : undefined
          };
      });
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

      // Auto-save logic...
      if (currentParams.appMode === AppMode.Influencer && currentParams.modelSourceOption === 'new' && results.length > 0) {
          const modelName = `${currentParams.modelGender} Model #${Math.floor(1000 + Math.random() * 9000)}`;
          if (userProfile && userProfile.id !== 'guest-user-id') {
              try {
                  const newModels = await userService.saveModel(modelName, results[0].imageUrl, savedModels);
                  setSavedModels(newModels);
                  setToast({ message: `New Model "${modelName}" has been saved!`, type: 'success' });
              } catch (saveError: any) {
                  // Suppress non-critical errors
              }
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

  const handleFloatingImageDrop = useCallback(async (file: File) => {
      try {
          const processedFile = await processImageFile(file, { maxWidth: 1024, maxHeight: 1024, format: 'image/png' });
          setFloatingImageFile(processedFile);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to process image.');
          console.error(err);
      }
  }, []);

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
  
  // ... (Floating UI handlers remain same) ...
  const handleFloatingImageFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFloatingImageDrop(file);
      if (floatingImageInputRef.current) floatingImageInputRef.current.value = '';
  }, [handleFloatingImageDrop]);

  const handleRemoveFloatingImage = useCallback(() => setFloatingImageFile(null), []);

  const handleFloatingGenerate = useCallback(() => {
      if (isGeneratingRef.current) return;
      if (!isOnline) { setToast({ message: "You are offline.", type: 'error' }); return; }

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

  // -- Missing Handlers Implementation --

  const handleStartEdit = useCallback((image?: GeneratedImage, tab: 'inpaint' | 'crop' | 'background' = 'inpaint') => {
      setEditingImage(image || {
          id: `edit-placeholder-${Date.now()}`,
          imageUrl: '',
          caption: 'New Edit',
          hashtags: '',
          aspectRatio: '1:1',
          timestamp: Date.now(),
          params: INITIAL_GENERATE_PARAMS
      });
      setEditModalInitialTab(tab);
  }, []);

  const handleCloseEdit = useCallback(() => {
      setEditingImage(null);
      setIsEditing(false);
  }, []);

  const handleApplyEdit = useCallback(async (editParams: EditImageParams) => {
      if (!isOnline) { setToast({message: "Offline", type: 'error'}); return; }
      setIsEditing(true); 
      try {
          const result = await editImage(editParams);
          if (editingImage) {
              setEditingImage({ ...editingImage, imageUrl: result.imageUrl });
          }
      } catch (e) {
          setToast({ message: "Edit failed", type: 'error' });
      } finally {
          setIsEditing(false);
      }
  }, [isOnline, editingImage]);

  const handleRemoveBackground = useCallback(async () => {
      if (!editingImage?.imageUrl) return;
      if (!checkAndDeductCredits(1)) return;
      
      setIsEditing(true);
      try {
          const result = await removeBackground(editingImage.imageUrl.split(',')[1], 'image/png'); 
          const newUrl = `data:${result.mimeType};base64,${result.data}`;
          setEditingImage({ ...editingImage, imageUrl: newUrl });
      } catch (e) {
          refundCredits(1);
          setToast({ message: "BG Removal failed", type: 'error' });
      } finally {
          setIsEditing(false);
      }
  }, [editingImage, checkAndDeductCredits, refundCredits]);

  const handleImageUpdate = useCallback((id: string, newUrl: string, sourceUrl?: string) => {
      if (editingImage && editingImage.id === id) {
          setEditingImage({ 
              ...editingImage, 
              imageUrl: newUrl,
              sourceProductImageUrl: sourceUrl || editingImage.sourceProductImageUrl 
          });
      }
  }, [editingImage]);

  const handleClearZoomedImage = useCallback(() => setZoomedImage(null), []);
  const handleCloseDeployModal = useCallback(() => setIsDeployModalOpen(false), []);
  const handleClearStoryboardSource = useCallback(() => setStoryboardSourceImage(null), []);

  const handleOpenVariantsModal = useCallback(async (field: 'modelPersona' | 'poseSuggestion') => {
      setQuickVariantsField(field);
      setIsVariantsLoading(true);
      setVariantError(null);
      try {
          const suggestions = await generateVariantSuggestions(params.productDescription, field);
          setVariantSuggestions(suggestions);
      } catch (err) {
          setVariantError("Failed to load suggestions.");
      } finally {
          setIsVariantsLoading(false);
      }
  }, [params.productDescription]);

  const handleSelectVariant = useCallback((suggestion: string) => {
      if (quickVariantsField) {
          setParams(prev => ({ ...prev, [quickVariantsField]: suggestion }));
          setQuickVariantsField(null);
      }
  }, [quickVariantsField]);

  const renderCurrentView = () => {
      switch (currentView) {
          case View.Dashboard:
              if (generatedImages.length > 0 || isLoading || error) {
                  return (
                      <MainContent
                          params={params}
                          frontProductImagePreview={frontProductImagePreview}
                          generatedImages={generatedImages}
                          isLoading={isLoading}
                          error={error}
                          onAddToPosterBoard={async (img) => {
                              setPosterBoard(prev => [img, ...prev]);
                              setIsSavingDesign(img.id);
                              try {
                                  const saved = await designService.saveDesign(img);
                                  setPosterBoard(prev => prev.map(p => p.id === img.id ? saved : p));
                                  setToast({ message: "Design saved to cloud!", type: 'success' });
                              } catch (e) {
                                  setToast({ message: "Saved locally. Cloud sync failed.", type: 'error' });
                              } finally {
                                  setIsSavingDesign(null);
                              }
                          }}
                          onStartEdit={handleStartEdit}
                          onSetStoryboardSource={(img) => { setStoryboardSourceImage(img); handleSelectMode(AppMode.Influencer); }}
                          onSetZoomedImage={setZoomedImage}
                          isStoryboardResult={isStoryboardResult}
                          onGenerateCaption={async (id, opts) => {
                              const img = generatedImages.find(i => i.id === id) || posterBoard.find(i => i.id === id);
                              if (!img) return;
                              setGeneratingCaptionImageId(id);
                              try {
                                  const result = await generateCaption({ imageUrl: img.imageUrl, ...opts }, brandKit);
                                  const updated = { ...img, caption: result.caption, hashtags: result.hashtags };
                                  // Update local state lists
                                  setGeneratedImages(prev => prev.map(i => i.id === id ? updated : i));
                                  setPosterBoard(prev => prev.map(i => i.id === id ? updated : i));
                              } catch (e) {
                                  console.error(e);
                              } finally {
                                  setGeneratingCaptionImageId(null);
                              }
                          }}
                          generatingCaptionImageId={generatingCaptionImageId}
                          onOpenABTestModal={setAbTestModalImage}
                          onReturnToSettings={handleReturnToSettings}
                      />
                  );
              }
              return (
                  <Dashboard
                      onSelectMode={handleSelectMode}
                      onStartImageEdit={(img) => handleStartEdit(img, 'background')}
                      onOpenFeedbackModal={handleOpenFeedbackModal}
                      onOpenPricingModal={handleOpenPricingModal}
                      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                      floatingPrompt={floatingPrompt}
                      onFloatingPromptChange={setFloatingPrompt}
                      floatingImagePreview={floatingImagePreview}
                      onFloatingGenerate={handleFloatingGenerate}
                      onRemoveFloatingImage={handleRemoveFloatingImage}
                      onTriggerFloatingUpload={() => floatingImageInputRef.current?.click()}
                      onOpenContentGenerator={handleOpenContentGeneratorModal}
                      userTier={userTier}
                      isAdmin={isAdmin}
                      userName={userProfile?.name?.split(' ')[0]}
                      onInternalImageDrop={handleInternalImageDrop}
                      onFloatingImageDrop={handleFloatingImageDrop}
                      isLoading={isLoading || isGeneratingRef.current}
                  />
              );
          case View.MyDesigns:
              return (
                  <MyDesigns
                      images={posterBoard}
                      onRemove={(id) => {
                          setPosterBoard(prev => prev.filter(img => img.id !== id));
                          designService.deleteDesign(id);
                      }}
                      onDeploy={() => setIsDeployModalOpen(true)}
                      onSetView={handleSetView}
                      onStartEdit={handleStartEdit}
                      onSetZoomedImage={setZoomedImage}
                      onSetStoryboardSource={(img) => { setStoryboardSourceImage(img); handleSelectMode(AppMode.Influencer); }}
                      onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                      onRemix={handleRemixDesign}
                  />
              );
          case View.Profile:
              return userProfile ? (
                  <Suspense fallback={<Spinner />}>
                      <ProfilePage
                          user={{
                              name: userProfile.name,
                              role: userProfile.role,
                              bio: userProfile.bio,
                              email: userProfile.email,
                              location: userProfile.location,
                              avatarUrl: userProfile.avatarUrl
                          }}
                          credits={credits}
                          userTier={userTier}
                          onEditProfile={handleOpenProfileEditModal}
                          onUpgradePlan={handleOpenPricingModal}
                          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                          onSetView={handleSetView}
                          onOpenFeedbackModal={handleOpenFeedbackModal}
                          recentActivity={recentActivity}
                      />
                  </Suspense>
              ) : null;
          case View.Inspiration:
              return (
                  <Suspense fallback={<Spinner />}>
                      <InspirationPage
                          onSetView={handleSetView}
                          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                          onRemix={handleRemix}
                      />
                  </Suspense>
              );
          default:
              return (
                  <MainContent
                      params={params}
                      frontProductImagePreview={frontProductImagePreview}
                      generatedImages={generatedImages}
                      isLoading={isLoading}
                      error={error}
                      onAddToPosterBoard={async (img) => {
                          setPosterBoard(prev => [img, ...prev]);
                          setIsSavingDesign(img.id);
                          try {
                              const saved = await designService.saveDesign(img);
                              setPosterBoard(prev => prev.map(p => p.id === img.id ? saved : p));
                              setToast({ message: "Design saved to cloud!", type: 'success' });
                          } catch (e) {
                              setToast({ message: "Saved locally. Cloud sync failed.", type: 'error' });
                          } finally {
                              setIsSavingDesign(null);
                          }
                      }}
                      onStartEdit={handleStartEdit}
                      onSetStoryboardSource={(img) => { setStoryboardSourceImage(img); handleSelectMode(AppMode.Influencer); }}
                      onSetZoomedImage={setZoomedImage}
                      isStoryboardResult={isStoryboardResult}
                      onGenerateCaption={async (id, opts) => {
                          const img = generatedImages.find(i => i.id === id) || posterBoard.find(i => i.id === id);
                          if (!img) return;
                          setGeneratingCaptionImageId(id);
                          try {
                              const result = await generateCaption({ imageUrl: img.imageUrl, ...opts }, brandKit);
                              const updated = { ...img, caption: result.caption, hashtags: result.hashtags };
                              // Update local state lists
                              setGeneratedImages(prev => prev.map(i => i.id === id ? updated : i));
                              setPosterBoard(prev => prev.map(i => i.id === id ? updated : i));
                          } catch (e) {
                              console.error(e);
                          } finally {
                              setGeneratingCaptionImageId(null);
                          }
                      }}
                      generatingCaptionImageId={generatingCaptionImageId}
                      onOpenABTestModal={setAbTestModalImage}
                      onReturnToSettings={handleReturnToSettings}
                  />
              );
      }
  };

  return (
    <ErrorBoundary>
        {!isOnline && (
            <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center py-1 text-sm z-[100] font-medium shadow-md">
                You are offline. Features may be limited.
            </div>
        )}
        
        {showSplash ? (
            <SplashScreen />
        ) : !userProfile ? (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
            <div className="relative w-screen h-screen bg-main font-sans flex overflow-hidden">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />}
            
                <input type="file" ref={imageEditInputRef} className="hidden" accept="image/*" onChange={handleImageEditFileChange} />
                <input type="file" ref={floatingImageInputRef} className="hidden" accept="image/*" onChange={handleFloatingImageFileChange} />
                
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
                    onInternalImageDrop={handleInternalImageDrop}
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
                        
                        // Pass new bulk handlers
                        onFileChange={(file, param, setter, opts) => {
                            if (param === 'frontProductImage') {
                                // Use bulk handler if modifying front image via drag/drop single file
                                // or just fall back to standard if needed
                                if (file) handleBulkFilesChange([file]);
                                else handleFileChange(null, param, setter, opts);
                            } else {
                                handleFileChange(file, param, setter, opts);
                            }
                        }}
                        frontProductImagePreview={frontProductImagePreview}
                        setFrontProductImagePreview={setFrontProductImagePreview}
                        
                        // Pass bulk props specifically for CreativeModal usage
                        bulkImagePreviews={bulkImagePreviews}
                        onBulkFilesChange={handleBulkFilesChange}
                        onRemoveBulkImage={handleRemoveBulkImage}

                        remixReferenceImagePreview={remixReferenceImagePreview}
                        setRemixReferenceImagePreview={setRemixReferenceImagePreview}
                        remixProductImagePreview={remixProductImagePreview}
                        setRemixProductImagePreview={setRemixProductImagePreview}
                        onGenerateVariants={handleOpenVariantsModal}
                        userTier={userTier}
                        onOpenPricingModal={handleOpenPricingModal}
                        freeGenerationsUsed={freeGenerationsUsed}
                        savedModels={savedModels}
                        onReset={handleResetParams}
                    />
                )}
                
                <Suspense fallback={null}>
                    {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
                    {editingImage && <EditModal image={editingImage} onClose={handleCloseEdit} onApplyEdit={handleApplyEdit} onRemoveBackground={handleRemoveBackground} onImageUpdate={handleImageUpdate} isEditing={isEditing} initialTab={editModalInitialTab} />}
                    {zoomedImage && <ZoomModal image={zoomedImage} onClose={handleClearZoomedImage} />}
                    {isDeployModalOpen && <DeployModal images={posterBoard} onClose={handleCloseDeployModal} />}
                    {abTestModalImage && <ABTestModal image={abTestModalImage} onClose={() => setAbTestModalImage(null)} onGenerate={() => { }} onApiError={() => refundCredits(2)} />}
                    {quickVariantsField && <QuickVariantsModal field={quickVariantsField} isLoading={isVariantsLoading} suggestions={variantSuggestions} error={variantError} onClose={() => setQuickVariantsField(null)} onSelect={handleSelectVariant} />}
                    {isFeedbackModalOpen && <FeedbackModal onClose={handleCloseFeedbackModal} />}
                    {isPricingModalOpen && <PricingModal onClose={handleClosePricingModal} />}
                    {isSupportModalOpen && <SupportModal onClose={handleCloseSupportModal} />}
                    {isProfileEditModalOpen && userProfile && <ProfileEditModal user={userProfile} onClose={handleCloseProfileEditModal} onSave={handleUpdateProfile} />}
                    {isContentGeneratorModalOpen && <ContentGenerator onClose={handleCloseContentGeneratorModal} onDeductCredits={checkAndDeductCredits} onRefundCredits={refundCredits} userId={userProfile?.id} />}
                    {isBrandKitModalOpen && <BrandKitModal initialKit={brandKit} onClose={() => setIsBrandKitModalOpen(false)} onSave={(newKit) => { setBrandKit(newKit); setToast({ message: "Brand identity updated and persisted!", type: "success" }); }} />}
                </Suspense>

                {(isLoading || isEditing || isSavingDesign) && (
                    <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-[100]">
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
            </div>
        )}
    </ErrorBoundary>
  );
};

export default App;