
import React, { useState, useCallback } from 'react';
import type { GeneratedImage } from '../../types';
import { Button } from './Button';
import { Icon } from './Icon';
import { generateFilename } from '../../utils/images';

interface SharePanelProps {
  image: GeneratedImage;
}

const SocialButton: React.FC<{ href: string; icon: string; label: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void; }> = ({ href, icon, label, onClick }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center text-slate-600 hover:text-primary transition-colors group"
      aria-label={`Share to ${label}`}
      onClick={onClick}
    >
        <div className="w-12 h-12 rounded-full bg-slate-200 group-hover:bg-primary/20 flex items-center justify-center mb-1">
             <Icon name={icon} className="w-6 h-6" />
        </div>
        <span className="text-xs font-medium">{label}</span>
    </a>
)

export const SharePanel: React.FC<SharePanelProps> = ({ image }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy Link');

    const handleDownload = useCallback(() => {
        const link = document.createElement('a');
        link.href = image.imageUrl;
        link.download = generateFilename(image, 'studio');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [image]);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(image.imageUrl).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy Link'), 2000);
        });
    }, [image.imageUrl]);

    const encodedCaption = encodeURIComponent(image.caption);
    const encodedUrl = encodeURIComponent(image.imageUrl);

    return (
        <div className="mt-6 p-4 bg-white rounded-2xl shadow-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Share Your Creation</h3>
            <div className="flex justify-center items-center gap-6 sm:gap-8">
                {/* Social Share Buttons */}
                <SocialButton 
                    href="#" 
                    icon="instagram" 
                    label="Instagram"
                    onClick={(e) => { e.preventDefault(); handleDownload(); }} // Instagram requires download
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
                <div className="h-16 border-l border-slate-200"></div>
                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                     <Button onClick={handleCopyLink} variant="secondary" className="w-32">
                        <Icon name="copy" className="w-4 h-4 mr-2" />
                        {copyButtonText}
                    </Button>
                    <Button onClick={handleDownload} variant="secondary" className="w-32">
                        <Icon name="download" className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                </div>
            </div>
        </div>
    );
};
