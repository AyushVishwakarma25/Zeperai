import React, { useState, useCallback } from 'react';
import type { GeneratedImage, GenerateCaptionParams } from '../types';
import { CaptionTone, AppMode } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { 
    CAPTION_TONE_OPTIONS, 
    CAPTION_LENGTH_OPTIONS, 
    CAPTION_PLATFORM_OPTIONS,
    CAPTION_LANGUAGE_OPTIONS
} from '../constants';

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

const CopyButton: React.FC<{ textToCopy: string, label: string }> = ({ textToCopy, label }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [textToCopy]);

    return (
        <button 
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 hover:text-slate-900 transition-colors"
            aria-label={label}
        >
            <Icon name={copied ? 'trust' : 'copy'} className="w-4 h-4" />
        </button>
    )
}

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

const SimpleSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string}> = ({ label, children, ...props }) => (
    <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <select 
            className="w-full px-2 py-1.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            {...props}
        >
            {children}
        </select>
    </div>
);

const generateFilenameFromImage = (image: GeneratedImage): string => {
    const extension = image.imageUrl.split(';')[0].split('/')[1] || 'png';
    let namePart = `creative-workspace-${image.id.substring(4, 10)}`;

    if (image.params.appMode === AppMode.Product && image.params.productStylePreset) {
        if (image.params.productStylePreset.includes('|')) {
            namePart = image.params.productStylePreset.split('|')[1];
        } else {
            namePart = image.params.productStylePreset;
        }
    } else if (image.params.appMode === AppMode.Influencer && image.params.poseSuggestion) {
        namePart = image.params.poseSuggestion;
    } else if (image.params.productDescription) {
        namePart = image.params.productDescription;
    }

    const sanitizedName = namePart
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);

    return `${sanitizedName || 'image'}.${extension}`;
}


export const DetailPanel: React.FC<DetailPanelProps> = ({ image, onClose, onGenerateCaption, generatingCaptionImageId, onOpenABTestModal }) => {
    const [isWriterOpen, setIsWriterOpen] = useState(true); // Default to open
    const [showOriginal, setShowOriginal] = useState(false);
    
    // AI Content Writer State
    const [tone, setTone] = useState<CaptionTone>(CaptionTone.Playful);
    const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>('Medium');
    const [platform, setPlatform] = useState<'Instagram' | 'YouTube' | 'TikTok' | 'Ad Copy'>('Instagram');
    const [language, setLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
    const [includeHashtags, setIncludeHashtags] = useState(true);
    const [includeEmojis, setIncludeEmojis] = useState(true);

    const isGenerating = generatingCaptionImageId === image.id;

    const imageUrl = showOriginal && image.sourceProductImageUrl ? image.sourceProductImageUrl : image.imageUrl;

    const handleDownload = useCallback(() => {
        const link = document.createElement('a');
        link.href = image.imageUrl;
        link.download = generateFilenameFromImage(image);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [image]);

    const handleGenerateContent = useCallback(() => {
        onGenerateCaption(image.id, {
            tone, length, platform, language, includeHashtags, includeEmojis
        });
    }, [onGenerateCaption, image.id, tone, length, platform, language, includeHashtags, includeEmojis]);

    const encodedCaption = encodeURIComponent(image.caption);
    const encodedUrl = encodeURIComponent(image.imageUrl);

    const PanelContent = (
      <>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Content Details</h3>
            <button 
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Close details"
            >
                <Icon name="close" className="w-5 h-5"/>
            </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
            <div>
                <div className="relative">
                    <img src={imageUrl} alt={image.caption} className="w-full rounded-lg shadow-sm" />
                    {image.sourceProductImageUrl && (
                        <Button 
                            variant="ghost" 
                            className="absolute bottom-2 right-2 !py-1 !px-2 backdrop-blur-sm"
                            onClick={() => setShowOriginal(p => !p)}
                        >
                            <Icon name="swap" className="w-4 h-4 mr-1" />
                            {showOriginal ? 'Show Generated' : 'Compare'}
                        </Button>
                    )}
                </div>
            </div>

             <div className="border-t border-slate-200 pt-4">
                <button onClick={() => setIsWriterOpen(!isWriterOpen)} className="w-full flex justify-between items-center font-semibold text-slate-700 hover:text-primary transition-colors">
                    <span>AI Content Writer</span>
                    <Icon name={isWriterOpen ? 'remove' : 'plus'} className={`w-5 h-5 transition-transform ${isWriterOpen ? 'rotate-0' : 'rotate-45'}`} />
                </button>
                {isWriterOpen && (
                    <div className="mt-4 p-4 bg-slate-100 border border-slate-200 rounded-lg space-y-4">
                         <SimpleSelect label="Tone" value={tone} onChange={e => setTone(e.target.value as CaptionTone)}>
                            {CAPTION_TONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </SimpleSelect>
                        <div className="grid grid-cols-2 gap-4">
                            <SimpleSelect label="Length" value={length} onChange={e => setLength(e.target.value as any)}>
                                {CAPTION_LENGTH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </SimpleSelect>
                             <SimpleSelect label="Platform" value={platform} onChange={e => setPlatform(e.target.value as any)}>
                                {CAPTION_PLATFORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </SimpleSelect>
                        </div>
                        <SimpleSelect label="Language" value={language} onChange={e => setLanguage(e.target.value as any)}>
                            {CAPTION_LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </SimpleSelect>
                        <div className="pt-2 space-y-3">
                            <Toggle label="Include Hashtags" enabled={includeHashtags} onChange={setIncludeHashtags} />
                            <Toggle label="Include Emojis" enabled={includeEmojis} onChange={setIncludeEmojis} />
                        </div>
                        <div className="pt-2">
                            <Button onClick={handleGenerateContent} isLoading={isGenerating} fullWidth variant="secondary">
                                Write for me
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            
             <div className="border-t border-slate-200 pt-4 space-y-3">
                 <Button onClick={() => onOpenABTestModal(image)} fullWidth variant="secondary">
                    <Icon name="variants" className="w-5 h-5 mr-2" />
                    Generate A/B Test Variants
                </Button>
             </div>

            <div>
                 <h4 className="text-sm font-semibold text-slate-600 mb-3 text-center">Share & Download</h4>
                 <div className="flex justify-center flex-wrap gap-x-2 gap-y-4">
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
                        label="Twitter (X)" 
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
                  <div className="mt-4">
                      <Button onClick={handleDownload} variant="secondary" fullWidth>
                          <Icon name="download" className="w-4 h-4 mr-2" />
                          Download Image
                      </Button>
                  </div>
            </div>
        </div>
      </>
    )

    return (
        <>
            {/* Backdrop for mobile/tablet */}
            <div
                className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                onClick={onClose}
                aria-hidden="true"
            />
             {/* The panel itself */}
            <aside className="fixed top-0 right-0 h-full w-full max-w-sm bg-white border-l border-slate-200 flex flex-col z-40 animate-slide-in-from-right-mobile lg:static lg:w-96 lg:max-w-none lg:h-auto lg:animate-slide-in">
                {PanelContent}
            </aside>

            <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(10%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slide-in-from-right-mobile {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out forwards;
                }
                .animate-slide-in-from-right-mobile {
                    animation: slide-in-from-right-mobile 0.3s ease-out forwards;
                }
            `}</style>
        </>
    )
};