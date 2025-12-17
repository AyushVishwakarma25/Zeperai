
import React, { useState, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import { MainContent } from './components/MainContent';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams } from './types';
import { generateImages, upscaleImage, editImage, generateCaption, generateVariantSuggestions, detectProductCategory, fileToBase64 } from './services/geminiService';
import { userService, UserProfileData } from './services/userService';
import { designService } from './services/designService'; 
import { storageService } from './services/storageService'; 
import { authService, AuthSession } from './services/authService';
import { Spinner } from './components/ui/Spinner';
import { AppMode, AspectRatio, OutputFormat, ModelGender, SkinTone, ClothingType, OutfitChoice, StylePreset, AdLayout, ResolutionQuality, ProductCategory, View } from './types';
import { AI_SUGGESTED } from './constants';
import { processImageFile } from './imageUtils';
import { DashboardSidebar } from './components/DashboardSidebar';
import { Dashboard } from './components/Dashboard';
import { CreativeModal } from './components/CreativeModal';
import { MyDesigns } from './components/MyDesigns';
import { Icon } from './components/ui/Icon';
import { Toast } from './components/ui/Toast';
import { Button } from './components/ui/Button';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';


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

const initialParams: GenerateImageParams = {
  appMode: AppMode.Influencer,
  productDescription: '',
  aspectRatio: AspectRatio.PortraitPost,
  outputFormat: OutputFormat.JPEG,
  resolutionQuality: ResolutionQuality.Standard,
  selectedAngles: ['Front View'],
  productStylePreset: AI_SUGGESTED,
  backdropAndProps: AI_SUGGESTED,
  textPlacementSuggestion: AI_SUGGESTED,
  overlayText: '',
  fontStyle: AI_SUGGESTED,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  productCategory: ProductCategory.Generic,
  modelGender: ModelGender.Female,
  modelPersona: AI_SUGGESTED,
  skinTone: SkinTone.Medium,
  clothingType: ClothingType.AISuggested,
  outfitChoice: OutfitChoice.AI,
  stylePreset: StylePreset.AISuggested,
  poseSuggestion: AI_SUGGESTED,
  backgroundStyle: AI_SUGGESTED,
  adLayout: AdLayout.TextRightImageLeft,
  adTitle: '',
  adSubheading: '',
  adFeatures: '',
  adCta: '',
  adAvailability: '',
  remixReferenceImage: undefined,
  remixProductImage: undefined,
};

// Debounce utility (simple in-file implementation for this app structure)
function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

const fileToGeneratedImage = async (file: File): Promise<GeneratedImage> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const imageUrl = reader.result as string;
            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;
                let standardAspectRatio: AspectRatio = AspectRatio.Square;
                if (ratio > 1.33) standardAspectRatio = AspectRatio.Landscape; // 4:3 and wider
                else if (ratio < 0.8) standardAspectRatio = AspectRatio.Portrait;   // 4:5 and taller
                else if (ratio < 1) standardAspectRatio = AspectRatio.PortraitPost; // e.g. 4:5
                
                resolve({
                    id: `edit-${Date.now()}`,
                    imageUrl,
                    caption: file.name,
                    hashtags: '',
                    aspectRatio: standardAspectRatio,
                    params: initialParams,
                    sourceProductImageUrl: imageUrl,
                    timestamp: Date.now(),
                });
            };
            img.onerror = reject;
            img.src = imageUrl;
        };
        reader.onerror = reject;
    });
};

const getActionLabel = (mode: AppMode): string => {
    switch(mode) {
        case AppMode.Product: return 'Product Photoshoot';
        case AppMode.Influencer: return 'Influencer Campaign';
        case AppMode.AdCreative: return 'Ad Creative';
        case AppMode.Remix: return 'Image Remix';
        case AppMode.Imagen: return 'Image Generation';
        case AppMode.Fashion: return 'Fashion Photoshoot';
        case AppMode.Amazon: return 'Amazon Catalogue';
        case AppMode.Banner: return 'Banner Design';
        case AppMode.Youtube: return 'YouTube Thumbnail';
        case AppMode.Festival: return 'Festival Post';
        default: return 'Generated Image';
    }
};


const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode | null>(null);
  const [params, setParams] = useState<GenerateImageParams>(initialParams);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [posterBoard, setPosterBoard] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [upscalingImageId, setUpscalingImageId] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [zoomedImage, setZoomedImage] = useState<GeneratedImage | null>(null);
  const [storyboardSourceImage, setStoryboardSourceImage] = useState<GeneratedImage | null>(null);
  const [isStoryboardResult, setIsStoryboardResult] = useState<boolean>(false);
  const [generatingCaptionImageId, setGeneratingCaptionImageId] = useState<string | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isContentGeneratorModalOpen, setIsContentGeneratorModalOpen] = useState(false);
  const [abTestModalImage, setAbTestModalImage] = useState<GeneratedImage | null>(null);
  const [frontProductImagePreview, setFrontProductImagePreview] = useState<string | null>(null);
  const [remixReferenceImagePreview, setRemixReferenceImagePreview] = useState<string | null>(null);
  const [remixProductImagePreview, setRemixProductImagePreview] = useState<string | null>(null);
  const [quickVariantsField, setQuickVariantsField] = useState<'modelPersona' | 'poseSuggestion' | null>(null);
  const [isVariantsLoading, setIsVariantsLoading] = useState(false);
  const [variantSuggestions, setVariantSuggestions] = useState<string[]>([]);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isSavingDesign, setIsSavingDesign] = useState<string | null>(null); 
  
  // ADMIN & CREDITS STATE
  const [isAdmin, setIsAdmin] = useState(true);
  const [credits, setCredits] = useState(0); 
  const [totalCredits, setTotalCredits] = useState(100);
  const [userTier, setUserTier] = useState<'Free' | 'Starter' | 'Standard' | 'Agency'>('Starter');

  // AUTH STATE
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  const frontProductImageRef = useRef<File | undefined>(undefined); 
  const frontProductImageBase64Ref = useRef<string | null>(null); 
  const imageEditInputRef = useRef<HTMLInputElement>(null);
  const imageUpscaleInputRef = useRef<HTMLInputElement>(null);

  // Floating Action Bar State
  const [floatingPrompt, setFloatingPrompt] = useState('');
  const [floatingImageFile, setFloatingImageFile] = useState<File | null>(null);
  const [floatingImagePreview, setFloatingImagePreview] = useState<string | null>(null);
  const floatingImageInputRef = useRef<HTMLInputElement>(null);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            // Check Session
            const session = await authService.getSession();
            
            if (session) {
                setUserProfile(session.user);
                setUserTier(session.user.tier);
                
                // Fetch User Data if logged in
                const [creditData, savedDesigns] = await Promise.all([
                    userService.getCredits(),
                    designService.getSavedDesigns()
                ]);
                setCredits(creditData.current);
                setTotalCredits(creditData.total);
                setPosterBoard(savedDesigns);
            }
        } catch (err) {
            console.error("Failed to fetch initial data", err);
        } finally {
            setIsSessionChecked(true);
        }
    };
    fetchData();
  }, []);

  // Check for Payment Success/Fail params
  useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      const paymentCancelled = urlParams.get('payment_cancelled');

      if (paymentSuccess) {
          setToast({ message: "Payment Successful! Credits updated.", type: 'success' });
          // Refresh credits
          userService.getCredits().then(data => {
              setCredits(data.current);
              setTotalCredits(data.total);
          });
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
      } else if (paymentCancelled) {
          setToast({ message: "Payment cancelled.", type: 'error' });
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  }, []);
  
  const handleLoginSuccess = useCallback(async (session: AuthSession) => {
      setUserProfile(session.user);
      setUserTier(session.user.tier);
      setToast({ message: `Welcome back, ${session.user.name}!`, type: 'success' });
      
      // Reload user data
      try {
          const [creditData, savedDesigns] = await Promise.all([
                userService.getCredits(),
                designService.getSavedDesigns()
          ]);
          setCredits(creditData.current);
          setTotalCredits(creditData.total);
          setPosterBoard(savedDesigns);
      } catch (e) {
          console.error("Failed to load user data after login", e);
      }
  }, []);

  const handleLogout = useCallback(async () => {
      await authService.signOut();
      setUserProfile(null);
      setUserTier('Free');
      setCredits(0); 
      setTotalCredits(0);
      setPosterBoard([]);
      setCurrentView(View.Dashboard);
      setToast({ message: "Logged out successfully", type: 'success' });
  }, []);

  const handleRequireAuth = useCallback(() => {
      if (!userProfile) {
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

  // Calculate recent activity
  const recentActivity = React.useMemo(() => {
    const allImages = [...generatedImages, ...posterBoard];
    const uniqueImages = Array.from(new Map(allImages.map(img => [img.id, img])).values());
    
    return uniqueImages
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 12) 
        .map(img => ({
            id: img.id,
            user: userProfile?.name || 'Guest',
            action: getActionLabel(img.params.appMode),
            imageUrl: img.imageUrl,
            timestamp: img.timestamp
        }));
  }, [generatedImages, posterBoard, userProfile]);

  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const handleOpenProfileEditModal = useCallback(() => setIsProfileEditModalOpen(true), []);
  const handleCloseProfileEditModal = useCallback(() => setIsProfileEditModalOpen(false), []);
  
  const handleUpdateProfile = useCallback(async (newProfileData: Partial<UserProfileData>) => {
      if (!userProfile) return;
      // Optimistic update
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

  const handleOpenPricingModal = useCallback(() => setIsPricingModalOpen(true), []);
  const handleClosePricingModal = useCallback(() => setIsPricingModalOpen(false), []);

  const handleOpenSupportModal = useCallback(() => setIsSupportModalOpen(true), []);
  const handleCloseSupportModal = useCallback(() => setIsSupportModalOpen(false), []);

  const handleOpenContentGeneratorModal = useCallback(() => setIsContentGeneratorModalOpen(true), []);
  const handleCloseContentGeneratorModal = useCallback(() => setIsContentGeneratorModalOpen(false), []);

  // Centralized Error Handler
  const handleApiError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("API Error:", errorMessage);
    
    if (errorMessage.includes('403') || errorMessage.includes('permission')) {
        setToast({ message: "Access denied. Falling back to free model.", type: 'error' });
    } else {
        setError(errorMessage);
    }
  }, []);

  const checkAndDeductCredits = useCallback((cost: number): boolean => {
      if (isAdmin) return true; // Admins bypass credit check
      
      if (credits >= cost) {
          // Optimistic local update
          setCredits(prev => prev - cost);
          // Only sync with backend if user is logged in
          if (userProfile) {
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


  const handleSelectMode = (tool: AppMode) => {
    setParams(prev => {
        const newParams: GenerateImageParams = { ...prev, appMode: tool };
        if (tool === AppMode.Youtube) {
            newParams.aspectRatio = AspectRatio.Landscape; // 16:9 for thumbnails
        }
        if (tool === AppMode.Fashion) {
            newParams.productCategory = ProductCategory.Fashion;
        }
        if (tool === AppMode.Amazon) {
            newParams.productStylePreset = 'E-commerce & Web|Classic White Background'; // Common for e-commerce
        }
        if (tool === AppMode.Banner) {
            newParams.aspectRatio = AspectRatio.Landscape;
        }
        return newParams;
    });
    setActiveMode(tool);
  };
  
  const handleParamChange = useCallback((param: keyof GenerateImageParams, value: any) => {
    setParams(prev => ({ ...prev, [param]: value }));
  }, []);

  const handleGenerate = useCallback(async (currentParams: GenerateImageParams, previewUrlOverride?: string) => {
    // Determine cost: 1 credit per image generated (product mode can generate multiple)
    const imageCount = currentParams.appMode === AppMode.Product ? currentParams.selectedAngles.length : 1;
    const cost = imageCount * 1; 

    if (!checkAndDeductCredits(cost)) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);
    setActiveMode(null); // Close the panel on generation
    setCurrentView(View.Dashboard); // Ensure user sees the results
    setIsStoryboardResult(!!currentParams.storyboardScenes && currentParams.storyboardScenes.length > 0);
    try {
      const results = await generateImages(currentParams, previewUrlOverride ?? frontProductImagePreview ?? undefined);
      setGeneratedImages(results);
      setStoryboardSourceImage(null); // Clear storyboard after generation
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
      // Clear floating bar after generation
      setFloatingPrompt('');
      setFloatingImageFile(null);
    }
  }, [frontProductImagePreview, handleApiError, checkAndDeductCredits]);
  
  const handleUpscale = useCallback(async (imageToUpscale: GeneratedImage) => {
    if (!checkAndDeductCredits(2)) return; // Upscale costs 2 credits

    setUpscalingImageId(imageToUpscale.id);
    setError(null);
    try {
        const upscaledData = await upscaleImage(imageToUpscale.imageUrl);
        const updateImage = (img: GeneratedImage) => 
            img.id === imageToUpscale.id 
            ? { ...img, imageUrl: upscaledData.imageUrl, caption: upscaledData.caption, hashtags: upscaledData.hashtags } 
            : img;
        setGeneratedImages(prev => prev.map(updateImage));
        setPosterBoard(prev => prev.map(updateImage));
    } catch (err) {
        handleApiError(err);
        setUpscalingImageId(null);
    } finally {
        setUpscalingImageId(null);
    }
  }, [handleApiError, checkAndDeductCredits]);

  const handleStartEdit = useCallback((image: GeneratedImage) => {
    setEditingImage(image);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingImage(null);
  }, []);

  const handleApplyEdit = useCallback(async (editParams: EditImageParams) => {
    if (!editingImage) return;
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
      setEditingImage(null); // Close modal on success
    } catch (err) {
      handleApiError(err);
      // Keep the modal open on error so the user can try again
    } finally {
      setIsEditing(false);
    }
  }, [editingImage, handleApiError]);

  const handleImageUpdate = useCallback((imageId: string, newImageUrl: string) => {
      let imageFoundInLists = false;
      const updateImage = (img: GeneratedImage) => {
          if (img.id === imageId) {
              imageFoundInLists = true;
              return { ...img, imageUrl: newImageUrl };
          }
          return img;
      };

      setGeneratedImages(prev => prev.map(updateImage));
      setPosterBoard(prev => prev.map(updateImage));
      
      if (!imageFoundInLists && editingImage && editingImage.id === imageId) {
          // This was a direct-edit image. Add it to the results.
          const newImage = { ...editingImage, imageUrl: newImageUrl, id: `gen-${Date.now()}` };
          setGeneratedImages(prev => [newImage, ...prev]);
      }
      setEditingImage(null); // Close modal
  }, [editingImage]);

  const handleGenerateCaption = useCallback(async (imageId: string, captionParams: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => {
    if (!checkAndDeductCredits(1)) return; // Caption generation costs 1 credit

    const imageToUpdate = [...generatedImages, ...posterBoard].find(img => img.id === imageId);
    if (!imageToUpdate) return;
    
    setGeneratingCaptionImageId(imageId);
    setError(null);
    try {
      const fullCaptionParams: GenerateCaptionParams = {
        ...captionParams,
        imageUrl: imageToUpdate.imageUrl,
        existingCaption: imageToUpdate.caption,
      };
      const result = await generateCaption(fullCaptionParams);

      const updateImage = (img: GeneratedImage) => img.id === imageId ? { ...img, caption: result.caption, hashtags: result.hashtags } : img;
      
      setGeneratedImages(prev => prev.map(updateImage));
      setPosterBoard(prev => prev.map(updateImage));

    } catch (err) {
      handleApiError(err);
    } finally {
      setGeneratingCaptionImageId(null);
    }
  }, [generatedImages, posterBoard, handleApiError, checkAndDeductCredits]);

  // Persist Save to DesignService with Storage Upload
  const addToPosterBoard = useCallback(async (image: GeneratedImage) => {
    // Require Authentication to save
    if (!handleRequireAuth()) return;

    if (!posterBoard.some(item => item.id === image.id)) {
      setIsSavingDesign(image.id);
      try {
          // 1. Upload to Storage
          const fileName = `users/${userProfile?.id}/designs/${image.id}.png`;
          const publicUrl = await storageService.uploadImage(image.imageUrl, fileName);
          
          // 2. Update Image Object with Public URL
          const imageToSave = { ...image, imageUrl: publicUrl };

          // 3. Save Record to Database
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
  }, [posterBoard, userProfile, handleRequireAuth]);

  // Persist Delete to DesignService with Storage Delete
  const removeFromPosterBoard = useCallback(async (imageId: string) => {
    // Optimistic update
    const originalBoard = [...posterBoard];
    setPosterBoard(prev => prev.filter(item => item.id !== imageId));
    
    try {
        await designService.deleteDesign(imageId);
        setToast({ message: 'Design removed.', type: 'success' });
    } catch (e) {
        setPosterBoard(originalBoard); // Revert on failure
        setToast({ message: 'Failed to delete design.', type: 'error' });
    }
  }, [posterBoard]);

  const handleSetStoryboardSource = useCallback((image: GeneratedImage) => {
    setStoryboardSourceImage(image);
    setParams(prev => ({...prev, ...image.params})); // Load params from source image
    setActiveMode(image.params.appMode); // Re-open the panel for storyboard
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
    setQuickVariantsField(field);
    setIsVariantsLoading(true);
    setVariantError(null);
    setVariantSuggestions([]);
    try {
      const suggestions = await generateVariantSuggestions(params.productDescription, field);
      setVariantSuggestions(suggestions);
    } catch (err) {
      setVariantError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsVariantsLoading(false);
    }
  }, [params.productDescription]);

  const handleSelectVariant = useCallback((suggestion: string) => {
    if (quickVariantsField) {
      setParams(prev => ({...prev, [quickVariantsField]: suggestion}));
    }
    setQuickVariantsField(null);
  }, [quickVariantsField]);

  // Debounced category detection
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
      } catch (error) {
          console.error("Error detecting product category:", error);
          setError(error instanceof Error ? error.message : 'Failed to detect product category.');
          setParams(prev => ({ ...prev, productCategory: ProductCategory.Generic, detectedCategory: undefined })); // Fallback
      }
  }, 500), []); // 500ms debounce

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
                frontProductImageRef.current = processedFile; // Store the actual file
                const base64 = await fileToBase64(processedFile);
                frontProductImageBase64Ref.current = base64; // Store base64 for later use
                
                // Trigger debounced detection
                debouncedDetectProductCategory(base64, processedFile.type, params.productDescription);
                
                setParams(prev => ({
                    ...prev,
                    [paramName]: processedFile,
                }));
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

  useEffect(() => {
      if (frontProductImageRef.current && frontProductImageBase64Ref.current) {
          debouncedDetectProductCategory(
              frontProductImageBase64Ref.current,
              frontProductImageRef.current.type,
              params.productDescription
          );
      }
  }, [params.productDescription, debouncedDetectProductCategory]);

  const handleStartImageEdit = useCallback(() => {
    imageEditInputRef.current?.click();
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
      // Reset input value to allow uploading the same file again
      if (imageEditInputRef.current) {
        imageEditInputRef.current.value = '';
      }
    }
  }, []);
  
  const handleStartImageUpscale = useCallback(() => {
    imageUpscaleInputRef.current?.click();
  }, []);

  const handleImageUpscaleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Upscale from file upload is also an action, let's deduct 2 credits
      if (!checkAndDeductCredits(2)) return;

      setIsLoading(true);
      setError(null);
      try {
        const tempImage = await fileToGeneratedImage(file);
        const upscaledData = await upscaleImage(tempImage.imageUrl);
        const newUpscaledImage: GeneratedImage = {
            ...tempImage,
            id: `gen-upscaled-${Date.now()}`,
            imageUrl: upscaledData.imageUrl,
            caption: `Upscaled: ${tempImage.caption}`,
            hashtags: upscaledData.hashtags,
            timestamp: Date.now(), // Update timestamp for new activity
        };
        setGeneratedImages(prev => [newUpscaledImage, ...prev]);
      } catch (err) {
        handleApiError(err);
      } finally {
        setIsLoading(false);
      }
      
      if (imageUpscaleInputRef.current) {
        imageUpscaleInputRef.current.value = '';
      }
    }
  }, [handleApiError, checkAndDeductCredits]);

  // --- Floating Action Bar Logic ---
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
      const generationParams: GenerateImageParams = {
          ...initialParams, // Start with defaults
          appMode: AppMode.Influencer, // Default to a flexible mode
          productDescription: floatingPrompt,
          frontProductImage: floatingImageFile ?? undefined,
          // You might want to carry over some global settings like aspect ratio if needed
          aspectRatio: params.aspectRatio, 
          outputFormat: params.outputFormat,
          resolutionQuality: params.resolutionQuality,
      };
      // Pass the floating image preview as an override so the result has a source image for comparison
      handleGenerate(generationParams, floatingImagePreview ?? undefined);
  }, [floatingPrompt, floatingImageFile, params, handleGenerate, floatingImagePreview]);


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
                        onUpscale={handleUpscale}
                        onSetZoomedImage={handleSetZoomedImage}
                        onSetStoryboardSource={handleSetStoryboardSource}
                        upscalingImageId={upscalingImageId}
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
            return (
                <Dashboard 
                    onSelectMode={handleSelectMode}
                    generatedImages={generatedImages}
                    onClearGeneration={() => setGeneratedImages([])}
                    params={params}
                    frontProductImagePreview={frontProductImagePreview}
                    isLoading={isLoading}
                    error={error}
                    onAddToPosterBoard={addToPosterBoard}
                    onUpscale={handleUpscale}
                    upscalingImageId={upscalingImageId}
                    onStartEdit={handleStartEdit}
                    onSetStoryboardSource={handleSetStoryboardSource}
                    onSetZoomedImage={handleSetZoomedImage}
                    isStoryboardResult={isStoryboardResult}
                    onGenerateCaption={handleGenerateCaption}
                    generatingCaptionImageId={generatingCaptionImageId}
                    onOpenABTestModal={setAbTestModalImage}
                    onStartImageEdit={handleStartImageEdit}
                    onStartImageUpscale={handleStartImageUpscale}
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
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            />
        )}
      {/* Global Modals & Loading Overlays */}
      {(isLoading || upscalingImageId || isEditing || isSavingDesign) && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-[60]">
          <Spinner />
          {isLoading && (
            <>
              <p className="text-white mt-4 text-lg">{isStoryboardResult ? "Generating your storyboard..." : "Generating your studio-quality photoshoot..."}</p>
              <p className="text-muted-text mt-2 text-sm">{isStoryboardResult ? "Creating a cohesive visual story, scene by scene." : "This may take a moment. The AI is getting the lighting just right!"}</p>
            </>
          )}
          {upscalingImageId && (
            <>
              <p className="text-white mt-4 text-lg">Upscaling to 4K...</p>
              <p className="text-muted-text mt-2 text-sm">Enhancing details for a crystal-clear result.</p>
            </>
          )}
           {isEditing && (
            <>
              <p className="text-white mt-4 text-lg">Applying your creative edits...</p>
              <p className="text-muted-text mt-2 text-sm">The AI is blending your changes seamlessly.</p>
            </>
          )}
          {isSavingDesign && (
            <>
              <p className="text-white mt-4 text-lg">Saving Design...</p>
              <p className="text-muted-text mt-2 text-sm">Uploading high-resolution assets to storage.</p>
            </>
          )}
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
        ref={imageUpscaleInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpscaleFileChange}
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
        currentView={currentView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenContentGenerator={handleOpenContentGeneratorModal}
        onOpenSupport={handleOpenSupportModal}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        user={userProfile}
        onLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {renderCurrentView()}
      </main>

      {activeMode && (
        <CreativeModal
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
            onImageUpdate={handleImageUpdate}
            isEditing={isEditing}
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
                onGenerate={() => { /* This might need adjustment if variants auto-generate */ }}
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
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;
