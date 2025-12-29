
import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { FormInput, FormTextArea } from './ui/Form';
import { Select } from './ui/Select';
import { ImageDropzone } from './ui/ImageDropzone';
import { storage } from '../services/storage';
import { brand } from '../services/brand';
import type { BrandKit } from '../types';
import { processImageFile } from '../utils/images';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface BrandKitModalProps {
  onClose: () => void;
  onSave: (kit: BrandKit) => void;
  initialKit: BrandKit | null;
}

const SectionTitle: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
    <h3 className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ${className || ''}`}>{title}</h3>
);

const ControlButton: React.FC<{
  onClick: () => void;
  selected: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, selected, children, className }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border transform active:scale-95 ${
      selected
        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
        : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
    } ${className}`}
  >
    {children}
  </button>
);

const ColorInput: React.FC<{ label: string; id: string; value: string; onChange: (value: string) => void; }> = ({ label, id, value, onChange }) => {
  const isValidHex = /^#([0-9A-F]{3,8})$/i.test(value);
  return (
    <div className="relative group">
      <label
        htmlFor={id}
        className="flex items-center gap-3 w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      >
        <div
          className="w-8 h-8 rounded-lg border border-slate-200 shadow-inner flex-shrink-0"
          style={{ backgroundColor: isValidHex ? value : '#FFFFFF' }}
        />
        <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
            <span className="text-xs text-slate-900 font-mono truncate">{value}</span>
        </div>
      </label>
      <input
        type="color"
        id={id}
        value={isValidHex ? value : '#FFFFFF'}
        onChange={e => onChange(e.target.value.toUpperCase())}
        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        aria-label={`Select ${label} color`}
      />
    </div>
  );
};


const VOICE_OPTIONS = [
  'Professional', 'Friendly', 'Bold', 'Minimal', 'Playful', 'Luxury', 'High-Energy', 'Trustworthy'
];

const GOOGLE_FONTS_LIBRARY = {
    'Popular Sans Serif': ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito', 'Work Sans'],
    'Elegant Serif': ['Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Cinzel', 'Libre Baskerville'],
    'Modern Display': ['Oswald', 'Bebas Neue', 'Raleway', 'Syne', 'Clash Display', 'Abril Fatface'],
    'Handwriting & Script': ['Dancing Script', 'Pacifico', 'Great Vibes', 'Caveat', 'Satisfy', 'Sacramento'],
    'Monospace & Tech': ['Roboto Mono', 'Space Mono', 'Fira Code', 'JetBrains Mono', 'Inconsolata']
};

const BrandKitModal: React.FC<BrandKitModalProps> = ({ onClose, onSave, initialKit }) => {
  const isOnline = useNetworkStatus();
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<BrandKit>(initialKit || {
    brandName: '',
    primaryColor: '#6A5AE0',
    secondaryColor: '#FFFFFF',
    accentColor: '#10B981',
    fonts: 'Inter',
    voice: 'Professional',
    description: '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(kit.logoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoFileChange = useCallback(async (file: File | null) => {
    if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    
    if (file) {
      try {
        const processedFile = await processImageFile(file, { maxWidth: 512, maxHeight: 512, format: 'image/png' });
        setLogoFile(processedFile);
        setLogoPreview(URL.createObjectURL(processedFile));
      } catch (error) {
        console.error("Error processing logo:", error);
        setLogoFile(null);
        setLogoPreview(null);
      }
    } else {
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [logoPreview]);


  const handleSave = async () => {
    if (!isOnline) {
        alert("You must be online to save your Brand Kit.");
        return;
    }
    setLoading(true);
    try {
      let finalLogoUrl = kit.logoUrl;
      if (logoFile) {
        try {
            const fileName = `brand/logo-${Date.now()}.png`;
            finalLogoUrl = await storage.uploadImage(logoFile, fileName);
        } catch (storageError) {
            console.warn("Storage service failed, using local blob URL for logo.", storageError);
            finalLogoUrl = logoPreview || undefined;
        }
      }
      const updatedKit = { ...kit, logoUrl: finalLogoUrl };
      
      try {
        const savedKit = await brand.saveBrandKit(updatedKit);
        onSave(savedKit);
      } catch (dbError) {
        console.warn("Database service failed, saving to app state only.", dbError);
        onSave(updatedKit);
      }
      
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save brand identity.");
    } finally {
      setLoading(false);
    }
  };

  const activeVoices = useMemo(() => kit.voice.split(',').map(v => v.trim()).filter(Boolean), [kit.voice]);

  const toggleVoice = (v: string) => {
    let newVoices = [...activeVoices];
    if (newVoices.includes(v)) {
      newVoices = newVoices.filter(item => item !== v);
    } else {
      newVoices.push(v);
    }
    setKit({ ...kit, voice: newVoices.join(', ') });
  };

  const isValid = kit.brandName.trim() !== '';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] flex items-center justify-center p-4 lg:p-8" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-scale-up"
        onClick={e => e.stopPropagation()}
      >
        <header className="px-6 py-4 flex-shrink-0 flex items-center justify-between border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/10 rounded-lg">
                <Icon name="magic-wand" className="w-5 h-5 text-primary" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">Brand Identity</h2>
                <p className="text-xs text-slate-500">Consistent styling across all your creatives</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 transition-all rounded-full hover:bg-slate-100">
            <Icon name="close" className="w-5 h-5"/>
          </button>
        </header>

        <main className="flex-grow flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-slate-50/50 scrollbar-thin scrollbar-thumb-gray-300 md:scrollbar-none">
          {/* Left Panel - Logo */}
          <div className="w-full md:w-1/3 bg-slate-50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col flex-shrink-0">
            <SectionTitle title="Brand Assets" />
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm aspect-square w-full max-w-[260px] mx-auto mb-4">
              <ImageDropzone 
                id="brandkit-logo-upload"
                prompt="Upload Logo"
                previewUrl={logoPreview}
                onFileChange={handleLogoFileChange}
                className="w-full h-full rounded-xl !border-slate-200"
              />
            </div>
            <div className="text-center px-2">
                <p className="text-xs font-medium text-slate-600">Logo Upload</p>
                <p className="text-[10px] text-slate-400 mt-1">
                    Upload a high-quality PNG or SVG with a transparent background for best results.
                </p>
            </div>
          </div>

          {/* Right Panel - Settings */}
          <div className="flex-1 p-6 md:p-8 md:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent bg-white">
            <div className="space-y-8">
                
                {/* Visual Identity Section */}
                <div>
                    <SectionTitle title="Visual Identity" />
                    <div className="space-y-5">
                        <FormInput 
                            label="Brand Name"
                            id="brand-name"
                            placeholder="e.g., ZeperAi"
                            value={kit.brandName}
                            onChange={e => setKit(prev => ({...prev, brandName: e.target.value}))}
                            className="!mb-0"
                        />
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-2">Brand Palette</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <ColorInput label="Primary" id="primary-color" value={kit.primaryColor} onChange={value => setKit(prev => ({...prev, primaryColor: value}))} />
                                <ColorInput label="Secondary" id="secondary-color" value={kit.secondaryColor} onChange={value => setKit(prev => ({...prev, secondaryColor: value}))} />
                                <ColorInput label="Accent" id="accent-color" value={kit.accentColor} onChange={value => setKit(prev => ({...prev, accentColor: value}))} />
                            </div>
                        </div>

                        <Select label="Typography Style" value={kit.fonts} onChange={e => setKit(prev => ({...prev, fonts: e.target.value}))}>
                            {Object.entries(GOOGLE_FONTS_LIBRARY).map(([category, fonts]) => (
                                <optgroup key={category} label={category}>
                                    {fonts.map(font => (
                                        <option key={font} value={font}>{font}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="border-t border-slate-100 my-2"></div>

                {/* Brand Voice Section */}
                <div>
                    <SectionTitle title="Brand Voice" />
                    <div className="space-y-5">
                        <FormTextArea
                            label="Mission & Context"
                            id="brand-description"
                            placeholder="Briefly describe your brand's values and target audience. AI uses this to tailor captions and ad copy."
                            rows={3}
                            value={kit.description}
                            onChange={e => setKit(prev => ({...prev, description: e.target.value}))}
                            className="!mb-0"
                        />
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-2">Personality Attributes</label>
                            <div className="flex flex-wrap gap-2">
                                {VOICE_OPTIONS.map(v => (
                                <ControlButton
                                    key={v}
                                    selected={activeVoices.includes(v)}
                                    onClick={() => toggleVoice(v)}
                                >
                                    {v}
                                </ControlButton>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </main>

        <footer className="px-6 py-4 flex-shrink-0 flex justify-end items-center border-t border-slate-100 bg-white space-x-3">
          <Button variant="secondary" onClick={onClose} className="!text-sm">Cancel</Button>
          <Button onClick={handleSave} disabled={!isOnline || loading || !isValid} isLoading={loading} className="!text-sm shadow-lg shadow-primary/20">
            {isOnline ? (loading ? 'Saving...' : 'Save Brand Identity') : 'Offline'}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default BrandKitModal;
