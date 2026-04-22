
import React, { useState, useCallback } from 'react';
import type { GeneratedImage, GenerateCaptionParams, BrandKit } from '../types';
import { CaptionTone } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { Select } from './ui/Select';
import { 
    CAPTION_TONE_OPTIONS, 
    CAPTION_LENGTH_OPTIONS, 
    CAPTION_PLATFORM_OPTIONS,
    CAPTION_LANGUAGE_OPTIONS
} from '../constants';
import { generateFilename, downloadImage } from '../utils/images';
import { inspirationService } from '../services/inspirationService';
import { Toast } from './ui/Toast';
import { AdTextOverlay } from './ui/AdTextOverlay';
import { useDesigns } from '../contexts/DesignsContext';
import { DirectorCanvas } from './DirectorCanvas';

interface DetailPanelProps {
  image: GeneratedImage;
  onClose: () => void;
  onGenerateCaption: (imageId: string, params: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => void;
  generatingCaptionImageId: string | null;
  onOpenABTestModal: (image: GeneratedImage) => void;
  onUpdateImage?: (image: GeneratedImage) => void;
  brandKit: BrandKit | null;
}

const SocialButton: React.FC<{ href: string; icon: string; label: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; }> = ({ href, icon, label, onClick }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center text-slate-500 hover:text-primary transition-colors group w-16 text-center"
      aria-label={`Share to ${label}`}
      onClick={onClick}
    >
        <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-primary/20 flex items-center justify-center mb-1">
             <Icon name={icon} className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium">{label}</span>
    </a>
)

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ label, enabled, onChange }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
          enabled ? 'bg-primary' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
};

export const DetailPanel: React.FC<DetailPanelProps> = ({ image, onClose, onGenerateCaption, generatingCaptionImageId, onOpenABTestModal, onUpdateImage, brandKit }) => {
    const [isWriterOpen, setIsWriterOpen] = useState(true); 
    const [showOriginal, setShowOriginal] = useState(false);
    const [isDirectorMode, setIsDirectorMode] = useState(false);
    
    const [tone, setTone] = useState<CaptionTone>(CaptionTone.Playful);
    const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
    const [platform, setPlatform] = useState<'Instagram' | 'YouTube' | 'TikTok' | 'Ad Copy'>('Instagram');
    const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
    const [includeHashtags, setIncludeHashtags] = useState(true);
    const [includeEmojis, setIncludeEmojis] = useState(true);
    
    const [isSharing, setIsSharing] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
    const [isDownloading, setIsDownloading] = useState(false);
    const imageContainerRef = React.useRef<HTMLDivElement>(null);

    // Local state for Ad Copy editing
    const [adTitle, setAdTitle] = useState(image.params.adTitle || '');
    const [adSubheading, setAdSubheading] = useState(image.params.adSubheading || '');
    const [adCta, setAdCta] = useState(image.params.adCta || '');
    const [isAdCopyOpen, setIsAdCopyOpen] = useState(true);
    const [isGeneratingAdCopy, setIsGeneratingAdCopy] = useState(false);
    const { updateDesign } = useDesigns();

    React.useEffect(() => {
        setAdTitle(image.params.adTitle || '');
        setAdSubheading(image.params.adSubheading || '');
        setAdCta(image.params.adCta || '');
    }, [image.id, image.params.adTitle, image.params.adSubheading, image.params.adCta]);

    const isGenerating = generatingCaptionImageId === image.id;

    const hasAdCopyChanged = adTitle !== (image.params.adTitle || '') || 
                             adSubheading !== (image.params.adSubheading || '') || 
                             adCta !== (image.params.adCta || '');

    const handleGenerateAdCopy = async () => {
        setIsGeneratingAdCopy(true);
        try {
            const { generateAdCopy } = await import('../services/geminiService');
            const { AD_TEMPLATES } = await import('../constants');
            
            let vibe = undefined;
            if (image.params.adTemplateId) {
                const template = AD_TEMPLATES.find(t => t.id === image.params.adTemplateId);
                if (template) vibe = template.copywritingVibe;
            }

            const result = await generateAdCopy(
                image.params.productDescription || 'A product', 
                image.params.adStylePreset || 'Modern',
                vibe
            );
            setAdTitle(result.title);
            setAdSubheading(result.subheading);
            setAdCta(result.cta);
            setToast({ message: "Ad copy generated!", type: 'success' });
        } catch (e) {
            console.error("Failed to generate ad copy", e);
            setToast({ message: "Failed to generate ad copy.", type: 'error' });
        } finally {
            setIsGeneratingAdCopy(false);
        }
    };

    const handleSaveAdCopy = async () => {
        const updatedImage = {
            ...image,
            params: {
                ...image.params,
                adTitle,
                adSubheading,
                adCta
            }
        };
        
        // Update in DesignsContext if it's a saved design
        updateDesign(updatedImage);
        
        // Also update via prop if provided (for newly generated images)
        if (onUpdateImage) {
            onUpdateImage(updatedImage);
        }

        // If it's a saved design, we should ideally persist it to the backend here
        // For now, we'll just update local state
        try {
            const { designService } = await import('../services/designService');
            if (image.id && !image.id.startsWith('local-')) {
                await designService.updateDesignParams(image.id, updatedImage.params);
            }
        } catch (e) {
            console.error("Failed to persist ad copy changes", e);
        }

        setToast({ message: "Ad copy saved!", type: 'success' });
    };

    const imageUrl = showOriginal && image.sourceProductImageUrl ? image.sourceProductImageUrl : image.imageUrl;

    const handleDownload = useCallback(async () => {
        setIsDownloading(true);
        const filename = generateFilename(image, 'design');
        try {
            if (image.params.appMode === 'Ad Creative' && imageContainerRef.current && !showOriginal) {
                // Download the composite image (image + text overlay)
                const { downloadCompositeImage } = await import('../utils/images');
                await downloadCompositeImage(imageContainerRef.current, filename, downloadFormat);
            } else {
                await downloadImage(image.imageUrl, filename, downloadFormat);
            }
        } catch (e) {
            console.error("Download failed", e);
            setToast({ message: "Download failed. Try again.", type: 'error' });
        }
        setIsDownloading(false);
    }, [image, downloadFormat, showOriginal]);

    const handleGenerateContent = useCallback(() => {
        onGenerateCaption(image.id, {
            tone, length, platform, language, includeHashtags, includeEmojis
        });
    }, [onGenerateCaption, image.id, tone, length, platform, language, includeHashtags, includeEmojis]);

    const handleShareToInspiration = async () => {
        setIsSharing(true);
        try {
            await inspirationService.submitToInspiration(image);
            setToast({ message: "Shared to Global Gallery!", type: 'success' });
        } catch (e: any) {
            setToast({ message: e.message || "Failed to share.", type: 'error' });
        } finally {
            setIsSharing(false);
        }
    };

    const encodedCaption = encodeURIComponent(image.caption);
    const encodedUrl = encodeURIComponent(image.imageUrl);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Sidebar Drawer */}
            <aside className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col z-[100] animate-slide-in-right transform">
                {toast && (
                    <Toast 
                        message={toast.message} 
                        type={toast.type} 
                        onClose={() => setToast(null)} 
                    />
                )}
                
                {/* Header */}
                <div className="flex-shrink-0 p-4 border-b border-slate-200 flex justify-between items-center bg-white z-10">
                    <h3 className="font-bold text-lg text-slate-800">Content Details</h3>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label="Close details"
                    >
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-grow overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-300">
                    
                    {/* Image Preview */}
                    <div>
                        <div ref={imageContainerRef} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-100 aspect-square bg-slate-50">
                            {isDirectorMode ? (
                                <DirectorCanvas 
                                    backgroundImage={image.imageUrl}
                                    brandKit={brandKit}
                                    params={{
                                        ...image.params,
                                        adTitle,
                                        adSubheading,
                                        adCta
                                    }}
                                    onUpdateParams={(newParams) => {
                                        if (newParams.adTitle !== undefined) setAdTitle(newParams.adTitle);
                                        if (newParams.adSubheading !== undefined) setAdSubheading(newParams.adSubheading);
                                        if (newParams.adCta !== undefined) setAdCta(newParams.adCta);
                                    }}
                                    aspectRatio={image.aspectRatio}
                                />
                            ) : (
                                <>
                                    <img src={imageUrl} alt={image.caption} className="w-full h-auto object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                                    {image.params.appMode === 'Ad Creative' && (
                                        <AdTextOverlay params={image.params} overrides={{ adTitle, adSubheading, adCta }} />
                                    )}
                                </>
                            )}

                            {image.params.appMode === 'Ad Creative' && (
                                <Button 
                                    variant="ghost" 
                                    className={`absolute top-3 left-3 !py-1.5 !px-3 backdrop-blur-md shadow-sm text-xs z-30 transition-all ${
                                        isDirectorMode 
                                        ? 'bg-primary text-white hover:bg-primary/90' 
                                        : 'bg-white/80 text-slate-700 hover:bg-white'
                                    }`}
                                    onClick={() => setIsDirectorMode(!isDirectorMode)}
                                >
                                    <Icon name="sparkles" className="w-3.5 h-3.5 mr-1.5" />
                                    {isDirectorMode ? 'Exit Director Mode' : 'Enter Director Mode'}
                                </Button>
                            )}

                            {image.sourceProductImageUrl && (
                                <Button 
                                    variant="ghost" 
                                    className="absolute bottom-3 right-3 !py-1.5 !px-3 backdrop-blur-md bg-white/80 hover:bg-white text-xs text-black font-bold shadow-sm z-30"
                                    onClick={() => setShowOriginal(p => !p)}
                                >
                                    <Icon name="swap" className="w-3.5 h-3.5 mr-1.5" />
                                    {showOriginal ? 'Show Generated' : 'Compare Original'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Ad Copy Editor Section */}
                    {image.params.appMode === 'Ad Creative' && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <button 
                                onClick={() => setIsAdCopyOpen(!isAdCopyOpen)} 
                                className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors font-semibold text-slate-700"
                            >
                                <span className="flex items-center">
                                    <Icon name="edit" className="w-4 h-4 mr-2 text-primary" />
                                    Edit Ad Copy
                                </span>
                                <Icon name="chevron-down" className={`w-4 h-4 transition-transform duration-300 ${isAdCopyOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isAdCopyOpen && (
                                <div className="p-4 bg-white border-t border-slate-100 space-y-4 animate-fade-in">
                                    <Button 
                                        onClick={handleGenerateAdCopy} 
                                        isLoading={isGeneratingAdCopy} 
                                        variant="secondary" 
                                        fullWidth 
                                        className="mb-2 !bg-blue-50 !text-blue-600 hover:!bg-blue-100 border border-blue-100"
                                    >
                                        <Icon name="sparkles" className="w-4 h-4 mr-2" />
                                        ✨ Auto-Generate Copy
                                    </Button>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
                                        <input 
                                            type="text" 
                                            value={adTitle} 
                                            onChange={(e) => setAdTitle(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                            placeholder="e.g., Summer Sale"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Subheading</label>
                                        <textarea 
                                            value={adSubheading} 
                                            onChange={(e) => setAdSubheading(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                            placeholder="e.g., Get 50% off on all items"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Call to Action</label>
                                        <input 
                                            type="text" 
                                            value={adCta} 
                                            onChange={(e) => setAdCta(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary focus:border-primary"
                                            placeholder="e.g., Shop Now"
                                        />
                                    </div>
                                    {hasAdCopyChanged && (
                                        <Button onClick={handleSaveAdCopy} fullWidth variant="primary" className="mt-2">
                                            Save Changes
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Content Writer Section */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button 
                            onClick={() => setIsWriterOpen(!isWriterOpen)} 
                            className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors font-semibold text-slate-700"
                        >
                            <span className="flex items-center">
                                <Icon name="edit" className="w-4 h-4 mr-2 text-primary" />
                                AI Content Writer
                            </span>
                            <Icon name="chevron-down" className={`w-4 h-4 transition-transform duration-300 ${isWriterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isWriterOpen && (
                            <div className="p-4 bg-white border-t border-slate-100 space-y-4 animate-fade-in">
                                <Select label="Tone" value={tone} onChange={e => setTone(e.target.value as CaptionTone)}>
                                    {CAPTION_TONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                </Select>
                                <div className="grid grid-cols-2 gap-3">
                                    <Select label="Length" value={length} onChange={e => setLength(e.target.value as any)}>
                                        {CAPTION_LENGTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </Select>
                                    <Select label="Platform" value={platform} onChange={e => setPlatform(e.target.value as any)}>
                                        {CAPTION_PLATFORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </Select>
                                </div>
                                <Select label="Language" value={language} onChange={e => setLanguage(e.target.value as any)}>
                                    {CAPTION_LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </Select>
                                <div className="space-y-3 pt-2">
                                    <Toggle label="Include Hashtags" enabled={includeHashtags} onChange={setIncludeHashtags} />
                                    <Toggle label="Include Emojis" enabled={includeEmojis} onChange={setIncludeEmojis} />
                                </div>
                                <Button onClick={handleGenerateContent} isLoading={isGenerating} fullWidth variant="primary" className="mt-2 shadow-lg shadow-primary/20">
                                    Generate Copy
                                </Button>
                                
                                {(image.caption || image.hashtags) && (
                                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 animate-fade-in">
                                        {image.caption && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Generated Caption</p>
                                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{image.caption}</p>
                                            </div>
                                        )}
                                        {image.hashtags && (
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hashtags</p>
                                                <p className="text-xs text-primary font-medium">{image.hashtags}</p>
                                            </div>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                            <Button 
                                                variant="ghost" 
                                                className="!py-1 !px-2 !text-[10px] bg-white border border-slate-200"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${image.caption}\n\n${image.hashtags}`);
                                                    setToast({ message: "Copied to clipboard!", type: 'success' });
                                                }}
                                            >
                                                <Icon name="copy" className="w-3 h-3 mr-1" />
                                                Copy All
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        <Button onClick={handleDownload} fullWidth variant="primary" isLoading={isDownloading} className="shadow-lg shadow-primary/20 h-12">
                            <Icon name="download" className="w-5 h-5 mr-2" />
                            Download High-Res shot
                        </Button>
                        <Button onClick={() => onOpenABTestModal(image)} fullWidth variant="secondary" className="border-slate-200">
                            <Icon name="variants" className="w-5 h-5 mr-2 text-slate-500" />
                            Generate A/B Test Variants
                        </Button>
                    </div>

                    {/* Share & Download Section */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Share & Download</h4>
                        
                        <div className="flex justify-center flex-wrap gap-x-2 gap-y-4 mb-6">
                            <SocialButton 
                                href="#" 
                                icon="instagram" 
                                label="Instagram"
                                onClick={(e) => { e.preventDefault(); handleDownload(); }}
                            />
                            <SocialButton 
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                                icon="facebook" 
                                label="Facebook" 
                            />
                            <SocialButton 
                                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedCaption}`}
                                icon="twitter" 
                                label="Twitter" 
                            />
                            <SocialButton 
                                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}`}
                                icon="linkedin" 
                                label="LinkedIn" 
                            />
                            <SocialButton 
                                href={`https://api.whatsapp.com/send?text=${encodedCaption}%20${encodedUrl}`}
                                icon="whatsapp" 
                                label="WhatsApp" 
                            />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex gap-2 mb-3">
                                <Button 
                                    onClick={() => setDownloadFormat('png')} 
                                    variant={downloadFormat === 'png' ? 'primary' : 'ghost'} 
                                    className={`flex-1 !text-xs !py-1.5 ${downloadFormat === 'png' ? '' : '!bg-white !text-slate-600 border border-slate-200'}`}
                                >
                                    PNG
                                </Button>
                                <Button 
                                    onClick={() => setDownloadFormat('jpeg')} 
                                    variant={downloadFormat === 'jpeg' ? 'primary' : 'ghost'} 
                                    className={`flex-1 !text-xs !py-1.5 ${downloadFormat === 'jpeg' ? '' : '!bg-white !text-slate-600 border border-slate-200'}`}
                                >
                                    JPG
                                </Button>
                                <Button 
                                    onClick={() => setDownloadFormat('webp')} 
                                    variant={downloadFormat === 'webp' ? 'primary' : 'ghost'} 
                                    className={`flex-1 !text-xs !py-1.5 ${downloadFormat === 'webp' ? '' : '!bg-white !text-slate-600 border border-slate-200'}`}
                                >
                                    WEBP
                                </Button>
                            </div>
                            <Button onClick={handleDownload} isLoading={isDownloading} variant="secondary" className="w-full !text-xs">
                                <Icon name="download" className="w-4 h-4 mr-2" />
                                Download as {downloadFormat.toUpperCase()}
                            </Button>
                        </div>

                        <Button onClick={handleShareToInspiration} disabled={isSharing} isLoading={isSharing} variant="ghost" fullWidth className="mt-4 !bg-purple-50 !text-primary hover:!bg-purple-100 !text-xs border border-purple-100">
                            <Icon name="globe" className="w-4 h-4 mr-2" />
                            Share to Community Gallery
                        </Button>
                    </div>
                </div>
            </aside>

            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </>
    )
};
