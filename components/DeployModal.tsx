import React, { useCallback } from 'react';
import type { GeneratedImage } from '../types';
import { AppMode } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface DeployModalProps {
  images: GeneratedImage[];
  onClose: () => void;
}

const generateFilenameFromImage = (image: GeneratedImage, index?: number): string => {
    const extension = image.imageUrl.split(';')[0].split('/')[1] || 'png';
    let namePart = `campaign-image-${index ?? image.id.substring(4, 10)}`;

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

const DeployModal: React.FC<DeployModalProps> = ({ images, onClose }) => {
    const handleDownloadCsv = useCallback(() => {
        const headers = ['ID', 'Caption', 'Hashtags', 'AspectRatio'];
        
        const sanitizeCsvField = (field: string) => {
            let sanitized = field.replace(/"/g, '""'); // Escape double quotes
            if (sanitized.includes(',') || sanitized.includes('\n') || sanitized.includes('"')) {
                sanitized = `"${sanitized}"`; // Enclose in double quotes if it contains a comma, newline, or quotes
            }
            return sanitized;
        };

        const rows = images.map(img => [
            img.id,
            sanitizeCsvField(img.caption),
            sanitizeCsvField(img.hashtags),
            img.aspectRatio
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "product_ad_studio_campaign.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [images]);

    const handleDownloadAllImages = useCallback(() => {
        images.forEach((image, index) => {
            const link = document.createElement('a');
            link.href = image.imageUrl;
            link.download = generateFilenameFromImage(image, index + 1);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }, [images]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-main w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden">
                <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <Icon name="deploy" className="w-6 h-6 mr-3 text-primary" />
                        <h2 className="text-xl font-bold text-slate-800">Deploy to Airtable</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </header>
                <main className="p-6 text-slate-600 space-y-4">
                    <p className="text-sm">
                        Export your campaign assets for a seamless import into Airtable. This two-step process ensures your API keys remain secure.
                    </p>
                    <div className="bg-slate-100 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-slate-800">Your Deployment Workflow:</h3>
                        <ol className="list-none text-sm space-y-3">
                            <li className="flex items-start">
                                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0">1</span>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-700 mb-1">Download your assets</p>
                                    <p className="text-xs mb-2">This will download all {images.length} images to your computer.</p>
                                    <Button onClick={handleDownloadAllImages} variant="secondary" className="!text-xs !py-1.5 w-full mt-2">
                                        <Icon name="download" className="w-4 h-4 mr-2" />
                                        Download All Images
                                    </Button>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0">2</span>
                                <div className="flex-1">
                                    <p className="font-medium text-slate-700 mb-1">Download campaign data</p>
                                     <p className="text-xs mb-2">Get a CSV file with all captions and metadata.</p>
                                    <Button onClick={handleDownloadCsv} variant="secondary" className="!text-xs !py-1.5 w-full mt-2">
                                        <Icon name="download" className="w-4 h-4 mr-2" />
                                        Download Campaign CSV
                                    </Button>
                                </div>
                            </li>
                             <li className="flex items-start">
                                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs mr-3 flex-shrink-0">3</span>
                                <div className="flex-1">
                                     <p className="font-medium text-slate-700 mb-1">Import into Airtable</p>
                                     <p className="text-xs">
                                        In your base, use the <strong>CSV Import</strong> app to upload your data, then add the downloaded images to the attachment field.
                                    </p>
                                </div>
                            </li>
                        </ol>
                    </div>
                </main>
                <footer className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <Button onClick={onClose} variant="secondary">
                        Done
                    </Button>
                </footer>
            </div>
        </div>
    );
};

export default DeployModal;