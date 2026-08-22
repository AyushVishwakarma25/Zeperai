
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Icon } from './ui/Icon.js';
import { Button } from './ui/Button.js';
import { FormInput, FormTextArea } from './ui/Form.js';
import { Select } from './ui/Select.js';
import { ImageDropzone } from './ui/ImageDropzone.js';
import { storageService } from '../services/storageService.js';
import { brandService } from '../services/brandService.js';
import { analyzeBrandLogo, fileToBase64 } from '../services/geminiService.js';
import type { BrandKit } from '../types.js';
import { processImageFile, dataURLtoFile } from '../utils/images.js';
import { useNetworkStatus } from '../hooks/useNetworkStatus.js';

interface BrandKitModalProps {
  onClose: () => void;
  onSave: (kit: BrandKit) => void;
  initialKit: BrandKit | null;
  onDeductCredits: (cost: number) => boolean;
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

// Improved Color Input with local state for smoother typing
const ColorInput: React.FC<{ label: string; id: string; value: string; onChange: (value: string) => void; }> = ({ label, id, value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
      setLocalValue(value);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      setLocalValue(newVal);
      // Only sync if valid hex 6 digits
      if (/^#[0-9A-F]{6}$/i.test(newVal)) {
          onChange(newVal.toUpperCase());
      }
  };

  const handleBlur = () => {
      // On blur, validation
      if (/^#[0-9A-F]{6}$/i.test(localValue)) {
          onChange(localValue.toUpperCase());
      } else if (/^[0-9A-F]{6}$/i.test(localValue)) {
          // Auto-add hash if missing
          const fixed = '#' + localValue.toUpperCase();
          setLocalValue(fixed);
          onChange(fixed);
      } else {
          setLocalValue(value); // Revert to last valid prop value if invalid
      }
  };

  // Safe hex for the color picker input type (must be 7 chars)
  const safeHex = /^#[0-9A-F]{6}$/i.test(localValue) ? localValue : '#FFFFFF';

  return (
    <div className="relative group">
      <div className="flex items-center gap-3 w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
        <div className="relative w-8 h-8 rounded-lg border border-slate-200 shadow-inner flex-shrink-0 overflow-hidden">
            <div style={{ backgroundColor: safeHex }} className="w-full h-full" />
            <input
                type="color"
                id={`${id}-picker`}
                value={safeHex}
                onChange={e => {
                    const v = e.target.value.toUpperCase();
                    setLocalValue(v);
                    onChange(v);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label={`Pick ${label} color`}
            />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
            <label htmlFor={id} className="text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer">{label}</label>
            <input 
                id={id}
                type="text" 
                value={localValue} 
                onChange={handleTextChange}
                onBlur={handleBlur}
                className="text-xs text-slate-900 font-mono truncate outline-none w-full uppercase"
                placeholder="#RRGGBB"
                maxLength={7}
            />
        </div>
      </div>
    </div>
  );
};


const VOICE_OPTIONS = [
  'Professional', 'Friendly', 'Bold', 'Minimal', 'Playful', 'Luxury', 'High-Energy', 'Trustworthy'
];

const ANCHOR_OPTIONS = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'center', label: 'Center' }
];

const STYLE_KEYWORDS = [
    'Minimalist', 'Bold', 'Luxury', 'Playful', 'Vintage', 'Modern', 'Brutalist', 'Organic', 'High-Contrast', 'Soft/Pastel'
];

const GOOGLE_FONTS_LIBRARY = {
    'Popular Sans Serif': ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito', 'Work Sans'],
    'Elegant Serif': ['Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Cinzel', 'Libre Baskerville'],
    'Modern Display': ['Oswald', 'Bebas Neue', 'Raleway', 'Syne', 'Clash Display', 'Abril Fatface'],
    'Handwriting & Script': ['Dancing Script', 'Pacifico', 'Great Vibes', 'Caveat', 'Satisfy', 'Sacramento'],
    'Monospace & Tech': ['Roboto Mono', 'Space Mono', 'Fira Code', 'JetBrains Mono', 'Inconsolata']
};

const DEFAULT_KIT: BrandKit = {
    brandName: '',
    primaryColor: '#6A5AE0',
    secondaryColor: '#FFFFFF',
    accentColor: '#10B981',
    fonts: 'Inter',
    voice: 'Professional',
    description: '',
    negativeConstraints: '',
    primary_hex: '#6A5AE0',
    font_family: 'Inter',
    logo_anchor_point: 'top-right',
    style_keyword: 'Modern'
};

const BrandKitModal: React.FC<BrandKitModalProps> = ({ onClose, onSave, initialKit, onDeductCredits }) => {
  const isOnline = useNetworkStatus();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [kit, setKit] = useState<BrandKit>(initialKit || DEFAULT_KIT);

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

  // Handle dropped generated images
  useEffect(() => {
    const handleKrackxDrop = (e: any) => {
        const { id, image } = e.detail;
        if (id === 'brandkit-logo-upload') {
            const fileName = `internal-${image.id}.png`;
            const file = dataURLtoFile(image.imageUrl, fileName);
            handleLogoFileChange(file);
        }
    };
    window.addEventListener('krackx-internal-image-drop', handleKrackxDrop);
    return () => window.removeEventListener('krackx-internal-image-drop', handleKrackxDrop);
  }, [handleLogoFileChange]);

  const handleAnalyze = async () => {
      if (!logoFile) return;
      
      // CREDIT CHECK
      if (!onDeductCredits(1)) return;

      setAnalyzing(true);
      try {
          const base64 = await fileToBase64(logoFile);
          const analysis = await analyzeBrandLogo(base64, logoFile.type);
          
          setKit(prev => ({
              ...prev,
              primaryColor: analysis.colors[0]?.hex || prev.primaryColor,
              primary_hex: analysis.colors[0]?.hex || prev.primary_hex,
              secondaryColor: analysis.colors[1]?.hex || prev.secondaryColor,
              accentColor: analysis.colors[2]?.hex || prev.accentColor,
              // Map AI result (e.g. "Modern Sans") to closest option or append
              fonts: analysis.typography || prev.fonts, 
              font_family: analysis.typography || prev.font_family,
              voice: analysis.vibe.join(', ') || prev.voice,
              style_keyword: analysis.vibe[0] || prev.style_keyword
          }));
      } catch (e) {
          console.error("Analysis failed", e);
          alert("Could not analyze logo. Please fill details manually.");
      } finally {
          setAnalyzing(false);
      }
  };

  const handleSave = async () => {
    // We allow saving to local state even if offline, but show warning if file upload is involved
    if (!isOnline && logoFile) {
        alert("You are offline. Logo upload will be skipped, but settings will apply to this session.");
    }
    
    setLoading(true);
    try {
      let finalLogoUrl = kit.logoUrl;
      
      // Try uploading logo if online and file exists
      if (isOnline && logoFile) {
        try {
            const fileName = `brand/logo-${Date.now()}.png`;
            finalLogoUrl = await storageService.uploadImage(logoFile, fileName);
        } catch (storageError) {
            console.warn("Storage service failed, using local blob URL for logo temporarily.", storageError);
            finalLogoUrl = logoPreview || undefined;
        }
      } else if (logoFile && logoPreview) {
          // Fallback for offline/local: use the blob URL for the session
          finalLogoUrl = logoPreview;
      }

      const updatedKit = { ...kit, logoUrl: finalLogoUrl };
      
      // Update App State Immediately
      onSave(updatedKit); 

      // Try persisting to DB
      if (isOnline) {
          try {
            await brandService.saveBrandKit(updatedKit);
          } catch (dbError) {
            console.warn("Database save failed (likely guest or permissions), saved to session only.", dbError);
          }
      }
      
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save brand identity.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
      if (confirm("Are you sure you want to reset your Brand Identity to defaults?")) {
          setKit(DEFAULT_KIT);
          setLogoFile(null);
          setLogoPreview(null);
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
                <p className="text-xs text-slate-500">Define your brand DNA for consistent AI generations.</p>
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
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm aspect-square w-full max-w-[260px] mx-auto mb-4 relative group">
              <ImageDropzone 
                id="brandkit-logo-upload"
                prompt="Upload Logo"
                previewUrl={logoPreview}
                onFileChange={handleLogoFileChange}
                className="w-full h-full rounded-xl !border-slate-200"
              />
            </div>
            
            <Button 
                onClick={handleAnalyze} 
                disabled={analyzing || !logoFile} 
                isLoading={analyzing} 
                variant="secondary" 
                className="w-full mb-4 !text-xs"
            >
                {analyzing ? 'Analyzing Vibe...' : 'Auto-Fill from Logo (1 Credit)'}
            </Button>

            <div className="text-center px-2">
                <p className="text-xs font-medium text-slate-600">Logo Guidelines</p>
                <p className="text-[10px] text-slate-400 mt-1">
                    Upload a high-quality PNG or SVG with a transparent background. 
                    <br/>AI uses this to understand your color palette and aesthetic.
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

                        <Select label="Typography & Style" value={kit.fonts} onChange={e => setKit(prev => ({...prev, fonts: e.target.value, font_family: e.target.value}))}>
                            {Object.entries(GOOGLE_FONTS_LIBRARY).map(([category, fonts]) => (
                                <optgroup key={category} label={category}>
                                    {fonts.map(font => (
                                        <option key={font} value={font}>{font}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </Select>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Select 
                                label="Logo Anchor Point" 
                                value={kit.logo_anchor_point || 'top-right'} 
                                onChange={e => setKit(prev => ({...prev, logo_anchor_point: e.target.value as any}))}
                            >
                                {ANCHOR_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>

                            <Select 
                                label="Style Keyword" 
                                value={kit.style_keyword || 'Modern'} 
                                onChange={e => setKit(prev => ({...prev, style_keyword: e.target.value}))}
                            >
                                {STYLE_KEYWORDS.map(kw => (
                                    <option key={kw} value={kw}>{kw}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 my-2"></div>

                {/* Brand Voice Section */}
                <div>
                    <SectionTitle title="Brand Voice & Constraints" />
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-2">Brand Tone</label>
                            <div className="flex flex-wrap gap-2 mb-4">
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

                        <FormTextArea
                            label="Mission & Context"
                            id="brand-description"
                            placeholder="Briefly describe your brand's values and target audience. AI uses this to tailor captions and ad copy."
                            rows={3}
                            value={kit.description}
                            onChange={e => setKit(prev => ({...prev, description: e.target.value}))}
                            className="!mb-0"
                        />
                        
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <FormTextArea
                                label="Brand Don'ts (Negative Constraints)"
                                id="negative-constraints"
                                placeholder="What should the AI strictly avoid? e.g. No dark backgrounds, no cartoon effects, no neon colors."
                                rows={2}
                                value={kit.negativeConstraints || ''}
                                onChange={e => setKit(prev => ({...prev, negativeConstraints: e.target.value}))}
                                className="!mb-0 !bg-white !border-red-100 focus:!ring-red-200"
                            />
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </main>

        <footer className="px-6 py-4 flex-shrink-0 flex justify-between items-center border-t border-slate-100 bg-white">
          <button 
            onClick={handleReset} 
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
          >
            Reset to Default
          </button>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={onClose} className="!text-sm">Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !isValid} isLoading={loading} className="!text-sm shadow-lg shadow-primary/20">
                {loading ? 'Saving...' : 'Save & Apply'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BrandKitModal;
