
import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';
import { FormInput, FormTextArea } from './ui/Form';
import { storageService } from '../services/storageService';
import { brandService } from '../services/brandService';
import type { BrandKit } from '../types';
import { Spinner } from './ui/Spinner';

interface BrandKitModalProps {
  onClose: () => void;
  onSave: (kit: BrandKit) => void;
  initialKit: BrandKit | null;
}

const VOICE_OPTIONS = [
  'Professional', 'Friendly', 'Bold', 'Minimal', 'Playful', 'Luxury', 'High-Energy', 'Trustworthy'
];

const BrandKitModal: React.FC<BrandKitModalProps> = ({ onClose, onSave, initialKit }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [kit, setKit] = useState<BrandKit>(initialKit || {
    brandName: '',
    primaryColor: '#6A5AE0',
    secondaryColor: '#F8F9FA',
    accentColor: '#10B981',
    fonts: 'Modern Sans-Serif',
    voice: 'Professional',
    description: '',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(kit.logoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalLogoUrl = kit.logoUrl;
      if (logoFile) {
        const fileName = `brand/logo-${Date.now()}.png`;
        finalLogoUrl = await storageService.uploadImage(logoFile, fileName);
      }
      const updatedKit = { ...kit, logoUrl: finalLogoUrl };
      const savedKit = await brandService.saveBrandKit(updatedKit);
      onSave(savedKit);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save brand identity.");
    } finally {
      setLoading(false);
    }
  };

  const activeVoices = useMemo(() => kit.voice.split(',').map(v => v.trim()), [kit.voice]);

  const toggleVoice = (v: string) => {
    let newVoices = [...activeVoices];
    if (newVoices.includes(v)) {
      newVoices = newVoices.filter(item => item !== v);
    } else {
      newVoices.push(v);
    }
    setKit({ ...kit, voice: newVoices.filter(x => x !== '').join(', ') });
  };

  // Live Preview Mockup Component
  const BrandPreview = () => (
    <div className="sticky top-0 bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col items-center justify-center min-h-[400px] overflow-hidden">
      <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Brand Mockup</div>
      
      <div 
        className="w-full max-w-[280px] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 transform hover:scale-[1.02]"
        style={{ fontFamily: kit.fonts.includes('Serif') ? 'serif' : 'sans-serif' }}
      >
        <div className="h-32 flex items-center justify-center p-6 transition-colors duration-500" style={{ backgroundColor: kit.primaryColor }}>
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain filter drop-shadow-md" />
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Icon name="logo" className="text-white w-6 h-6" />
            </div>
          )}
        </div>
        <div className="p-6 space-y-4" style={{ backgroundColor: kit.secondaryColor }}>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-900" style={{ color: kit.primaryColor }}>
              {kit.brandName || 'Your Brand Name'}
            </h4>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{kit.voice || 'Brand Voice'}</p>
          </div>
          <div className="h-px bg-slate-200" />
          <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-3">
            {kit.description || "Your brand's story and vision will manifest here, guided by the tonal identity you define."}
          </p>
          <button 
            className="w-full py-2.5 rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-all"
            style={{ backgroundColor: kit.accentColor }}
          >
            Sample Action
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex space-x-2">
        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: kit.primaryColor }} />
        <div className="w-3 h-3 rounded-full shadow-sm border border-slate-200" style={{ backgroundColor: kit.secondaryColor }} />
        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: kit.accentColor }} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in-scale-up">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Step Header */}
        <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-8">
             <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === 1 ? 'bg-primary text-white' : 'bg-accent-green text-white'}`}>
                  {step > 1 ? <Icon name="check-circle" className="w-5 h-5"/> : '1'}
                </div>
                <span className={`text-sm font-bold uppercase tracking-widest ${step === 1 ? 'text-slate-900' : 'text-slate-400'}`}>Visual Identity</span>
             </div>
             <div className="w-12 h-px bg-slate-100" />
             <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                  2
                </div>
                <span className={`text-sm font-bold uppercase tracking-widest ${step === 2 ? 'text-slate-900' : 'text-slate-400'}`}>Brand Voice</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
            <Icon name="close" className="w-6 h-6"/>
          </button>
        </header>

        <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Form Side */}
          <div className="flex-1 p-10 overflow-y-auto scrollbar-hide">
            {step === 1 ? (
              <div className="space-y-10 animate-fade-in">
                <div>
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 block">Brand Name</label>
                  <input 
                    type="text"
                    placeholder="Enter your brand name"
                    value={kit.brandName}
                    onChange={e => setKit({...kit, brandName: e.target.value})}
                    className="w-full text-2xl font-bold text-slate-800 placeholder:text-slate-200 border-none p-0 focus:ring-0"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Brand Colors</label>
                  <div className="flex flex-col space-y-3">
                    <div className="flex h-16 rounded-2xl overflow-hidden shadow-inner border border-slate-50">
                      <div className="flex-1 transition-colors duration-500" style={{ backgroundColor: kit.primaryColor }} />
                      <div className="flex-1 transition-colors duration-500 border-x border-white/20" style={{ backgroundColor: kit.secondaryColor }} />
                      <div className="flex-1 transition-colors duration-500" style={{ backgroundColor: kit.accentColor }} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <input type="color" value={kit.primaryColor} onChange={e => setKit({...kit, primaryColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                        <span className="text-[11px] font-mono text-slate-500 uppercase">Primary</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <input type="color" value={kit.secondaryColor} onChange={e => setKit({...kit, secondaryColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                        <span className="text-[11px] font-mono text-slate-500 uppercase">Secondary</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <input type="color" value={kit.accentColor} onChange={e => setKit({...kit, accentColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                        <span className="text-[11px] font-mono text-slate-500 uppercase">Accent</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block">Typography Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Modern Sans', 'Elegant Serif', 'Playful Rounded', 'Bold Mono'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setKit({...kit, fonts: f})}
                        className={`p-4 rounded-xl text-sm font-semibold border-2 transition-all ${kit.fonts === f ? 'border-primary bg-primary/5 text-primary scale-[1.02]' : 'border-slate-50 bg-slate-50/50 text-slate-500 hover:border-slate-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Brand Logo</label>
                  <label className="group block relative cursor-pointer">
                    <div className={`w-full h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${logoPreview ? 'bg-white border-primary/20' : 'bg-slate-50 border-slate-100 group-hover:bg-slate-100'}`}>
                      {logoPreview ? (
                        <div className="flex items-center space-x-4 px-6">
                          <img src={logoPreview} className="w-16 h-16 object-contain" alt="Logo preview" />
                          <div>
                            <p className="text-sm font-bold text-slate-900">Logo Uploaded</p>
                            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">Change Logo</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-3 bg-white rounded-2xl shadow-sm mb-3 text-slate-300 group-hover:text-primary transition-colors">
                            <Icon name="upload" className="w-6 h-6"/>
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drop PNG or SVG</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-fade-in">
                <div>
                   <label className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 block">Select Brand Personality</label>
                   <div className="flex flex-wrap gap-3">
                     {VOICE_OPTIONS.map(v => (
                       <button
                         key={v}
                         onClick={() => toggleVoice(v)}
                         className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${activeVoices.includes(v) ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                       >
                         {v}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Fine-tune Your Voice</label>
                  <FormInput 
                    label="" 
                    placeholder="Add keywords like: Non-corporate, Energetic, Empathetic..."
                    value={kit.voice}
                    onChange={e => setKit({...kit, voice: e.target.value})}
                    className="!bg-slate-50 !border-slate-100 !p-4 !rounded-2xl"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Brand Mission & Context</label>
                  <FormTextArea 
                    label=""
                    placeholder="Describe your brand's core values. This helps AI generate on-brand captions and imagery."
                    rows={6}
                    value={kit.description}
                    onChange={e => setKit({...kit, description: e.target.value})}
                    className="!bg-slate-50 !border-slate-100 !p-6 !rounded-3xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Side */}
          <div className="w-full md:w-[400px] p-10 bg-slate-50/50 hidden lg:block border-l border-slate-50">
            <BrandPreview />
          </div>
        </main>

        <footer className="px-10 py-8 border-t border-slate-50 flex justify-between items-center bg-white">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center">
            <Icon name="info" className="w-4 h-4 mr-2" />
            AI will auto-inject this kit into all prompts
          </div>
          <div className="flex space-x-3">
            {step === 1 ? (
              <Button onClick={() => setStep(2)} className="px-10 !rounded-full !py-4 shadow-xl">
                Continue to Voice
                <Icon name="chevron-left" className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setStep(1)} className="px-6 !rounded-full">Back</Button>
                <Button onClick={handleSave} isLoading={loading} className="px-10 !rounded-full !py-4 shadow-xl bg-accent-green hover:bg-emerald-600">
                  {loading ? <Spinner /> : 'Complete Setup'}
                </Button>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BrandKitModal;
