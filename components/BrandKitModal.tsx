
import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { FormInput, FormTextArea } from './ui/Form';
import { Select } from './ui/Select';
import { ImageDropzone } from './ui/ImageDropzone';
import { storageService } from '../services/storageService';
import { brandService } from '../services/brandService';
import type { BrandKit } from '../types';
import { Spinner } from './ui/Spinner';
import { processImageFile } from '../imageUtils';

interface BrandKitModalProps {
  onClose: () => void;
  onSave: (kit: BrandKit) => void;
  initialKit: BrandKit | null;
}

const SectionTitle: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
    <h3 className={`text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ${className || ''}`}>{title}</h3>
);

const ControlButton: React.FC<{
  onClick: () => void;
  selected: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, selected, children, className }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border ${
      selected
        ? 'bg-primary text-white border-primary shadow-sm'
        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
    } ${className}`}
  >
    {children}
  </button>
);

const ColorInput: React.FC<{ label: string; id: string; value: string; onChange: (value: string) => void; }> = ({ label, id, value, onChange }) => {
  const isValidHex = /^#([0-9A-F]{3,8})$/i.test(value);
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="flex items-center gap-4 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm cursor-pointer transition-colors hover:bg-slate-100"
      >
        <div
          className="w-6 h-6 rounded-md border border-slate-300 flex-shrink-0"
          style={{ backgroundColor: isValidHex ? value : '#FFFFFF' }}
        />
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
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

const BrandKitModal: React.FC<BrandKitModalProps> = ({ onClose, onSave, initialKit }) => {
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<BrandKit>(initialKit || {
    brandName: '',
    primaryColor: '#6A5AE0',
    secondaryColor: '#FFFFFF',
    accentColor: '#10B981',
    fonts: 'Modern Sans',
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
    setLoading(true);
    try {
      let finalLogoUrl = kit.logoUrl;
      if (logoFile) {
        // A user might not have a database set up, so we'll handle storageService errors gracefully for demo purposes
        try {
            const fileName = `brand/logo-${Date.now()}.png`;
            finalLogoUrl = await storageService.uploadImage(logoFile, fileName);
        } catch (storageError) {
            console.warn("Storage service failed, using local blob URL for logo. This won't persist.", storageError);
            finalLogoUrl = logoPreview || undefined;
        }
      }
      const updatedKit = { ...kit, logoUrl: finalLogoUrl };
      
      // Similarly, handle brandService errors gracefully
      try {
        const savedKit = await brandService.saveBrandKit(updatedKit);
        onSave(savedKit);
      } catch (dbError) {
        console.warn("Database service failed, saving to app state only. This won't persist.", dbError);
        onSave(updatedKit); // Save to local state anyway
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 lg:p-12" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-scale-up relative max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 flex-shrink-0 flex items-center justify-between border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Brand Identity</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-800 transition-all rounded-full hover:bg-slate-100">
            <Icon name="close" className="w-5 h-5"/>
          </button>
        </header>

        <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel */}
          <div className="w-full md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col gap-6">
            <SectionTitle title="BRAND ASSETS" />
            <div className="flex-1 flex flex-col">
              <ImageDropzone 
                id="brandkit-logo-upload"
                prompt="Upload Brand Logo"
                previewUrl={logoPreview}
                onFileChange={handleLogoFileChange}
                className="aspect-square !h-auto flex-grow"
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <SectionTitle title="VISUAL IDENTITY" />
            <FormInput 
              label="Brand Name"
              id="brand-name"
              placeholder="e.g., KrackXai"
              value={kit.brandName}
              onChange={e => setKit(prev => ({...prev, brandName: e.target.value}))}
              className="mb-6"
            />
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">Brand Colors</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <ColorInput label="Primary" id="primary-color" value={kit.primaryColor} onChange={value => setKit(prev => ({...prev, primaryColor: value}))} />
                 <ColorInput label="Secondary" id="secondary-color" value={kit.secondaryColor} onChange={value => setKit(prev => ({...prev, secondaryColor: value}))} />
                 <ColorInput label="Accent" id="accent-color" value={kit.accentColor} onChange={value => setKit(prev => ({...prev, accentColor: value}))} />
              </div>
            </div>

            <Select label="Typography Style" value={kit.fonts} onChange={e => setKit(prev => ({...prev, fonts: e.target.value}))} className="mb-8">
              {['Modern Sans', 'Elegant Serif', 'Playful Rounded', 'Bold Mono'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>

            <SectionTitle title="BRAND VOICE" />
            <FormTextArea
              label="Brand Mission & Context"
              id="brand-description"
              placeholder="Describe your brand's core values. This helps AI generate on-brand content."
              rows={4}
              value={kit.description}
              onChange={e => setKit(prev => ({...prev, description: e.target.value}))}
              className="mb-6"
            />
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">Brand Personality</label>
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
        </main>

        <footer className="p-4 flex-shrink-0 flex justify-end items-center border-t border-slate-200 bg-slate-50 space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} isLoading={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default BrandKitModal;
