
import React, { useState, useCallback } from 'react';
import type { GeneratedImage, GenerateCaptionParams } from '../types';
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

interface DetailPanelProps {
  image: GeneratedImage;
  onClose: () => void;
  onGenerateCaption: (imageId: string, params: Omit<GenerateCaptionParams, 'imageUrl' | 'existingCaption'>) => void;
  generatingCaptionImageId: string | null;
  onOpenABTestModal: (image: GeneratedImage) => void;
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

export const DetailPanel: React.FC<DetailPanelProps> = ({ image, onClose, onGenerateCaption, generatingCaptionImageId, onOpenABTestModal }) => {
    const [isWriterOpen, setIsWriterOpen] = useState(true); 
    const [showOriginal, setShowOriginal] = useState(false);
    
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

    const isGenerating = generatingCaptionImageId === image.id;

    const imageUrl = showOriginal && image.sourceProductImageUrl ? image.sourceProductImageUrl : image.imageUrl;

    const handleDownload = useCallback(async () => {
        setIsDownloading(true);
        const filename = generateFilename(image, 'design');
        await downloadImage(image.imageUrl, filename, downloadFormat);
        setIsDownloading(false);
    }, [image, downloadFormat]);

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
                        <div className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-100">
                            <img src={imageUrl} alt={image.caption} className="w-full h-auto object-cover" />
                            {image.sourceProductImageUrl && (
                                <Button 
                                    variant="ghost" 
                                    className="absolute bottom-3 right-3 !py-1.5 !px-3 backdrop-blur-md bg-white/80 hover:bg-white text-xs shadow-sm"
                                    onClick={() => setShowOriginal(p => !p)}
                                >
                                    <Icon name="swap" className="w-3.5 h-3.5 mr-1.5" />
                                    {showOriginal ? 'Show Generated' : 'Compare Original'}
                                </Button>
                            )}
                        </div>
                    </div>

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
                            </div>
                        )}
                    </div>
                    
                    {/* A/B Test Button */}
                    <Button onClick={() => onOpenABTestModal(image)} fullWidth variant="secondary" className="border-slate-200">
                        <Icon name="variants" className="w-5 h-5 mr-2 text-slate-500" />
                        Generate A/B Test Variants
                    </Button>

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
