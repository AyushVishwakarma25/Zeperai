import React, { useRef, useState, useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Download, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Layers,
  X
} from 'lucide-react';

interface Props {
  nicheName: string;
  marketplaceBadge: string;
  onDeductCredits?: (cost: number) => boolean;
  onRefundCredits?: (cost: number) => void;
  user?: any;
}

export const NicheBackgroundRemoverTool: React.FC<Props> = ({
  nicheName,
  marketplaceBadge,
  user,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<'idle' | 'loading-model' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [bgMode, setBgMode] = useState<'transparent' | 'white' | 'neutral'>('white');
  const [showUpsell, setShowUpsell] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const processFile = useCallback(async (file: File) => {
    setStatus('loading-model');
    setResultUrl(null);
    setErrorMsg('');
    setProgress(0);
    setProgressText('Loading AI model into browser memory...');
    setShowUpsell(false);

    const objUrl = URL.createObjectURL(file);
    setOriginalUrl(objUrl);

    // Get original dimensions
    const img = new Image();
    img.src = objUrl;
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };

    try {
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          if (key.includes('fetch')) {
            setStatus('loading-model');
            setProgressText('Downloading AI neural model weights...');
          } else {
            setStatus('processing');
            setProgressText('Erasing background & refining edges...');
          }

          if (total > 0) {
            const pct = Math.min(100, Math.round((current / total) * 100));
            setProgress(pct);
          }
        },
      });

      const resultObjUrl = URL.createObjectURL(blob);
      setResultUrl(resultObjUrl);
      setStatus('done');
    } catch (e: any) {
      let msg = e?.message || 'Failed to process image';
      if (msg.includes('Failed to fetch') || String(e).includes('Failed to fetch')) {
        msg = 'Network timeout downloading AI weights. Please check your internet connection and retry.';
      }
      setErrorMsg(msg);
      setStatus('error');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const [canvasPreset, setCanvasPreset] = useState<'amazon-square' | 'quickcommerce-square' | 'original'>('amazon-square');

  const handleDownloadTransparent = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${nicheName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-transparent.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setShowUpsell(true);
  };

  const handleDownloadPureWhite = () => {
    if (!resultUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = resultUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvasPreset === 'original') {
        canvas.width = img.naturalWidth || 2000;
        canvas.height = img.naturalHeight || 2000;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        const targetDim = canvasPreset === 'amazon-square' ? 2000 : 1000;
        canvas.width = targetDim;
        canvas.height = targetDim;

        // 100% Pure White (RGB 255, 255, 255)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetDim, targetDim);

        // Scale product so longest dimension adheres to marketplace 85% frame rule
        const occupancy = canvasPreset === 'amazon-square' ? 0.85 : 0.88;
        const maxImgDim = Math.max(img.naturalWidth, img.naturalHeight);
        const scale = (targetDim * occupancy) / maxImgDim;
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        const drawX = (targetDim - drawW) / 2;
        const drawY = (targetDim - drawH) / 2;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }

      const whiteDataUrl = canvas.toDataURL('image/jpeg', 0.96);
      const a = document.createElement('a');
      a.href = whiteDataUrl;
      const presetSuffix = canvasPreset === 'amazon-square' ? 'amazon-2000px' : canvasPreset === 'quickcommerce-square' ? 'blinkit-1000px' : 'rgb255';
      a.download = `${nicheName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${presetSuffix}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setShowUpsell(true);
    };
  };

  const resetAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStatus('idle');
    setResultUrl(null);
    setOriginalUrl(null);
    setErrorMsg('');
    setShowUpsell(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tool Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-xl shadow-stone-200/50">
        
        {/* Top Controls bar when processed */}
        {status === 'done' && resultUrl && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Preview Canvas:</span>
              <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
                <button
                  type="button"
                  onClick={() => setBgMode('white')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    bgMode === 'white' 
                      ? 'bg-white text-zinc-950 shadow-xs border border-stone-200' 
                      : 'text-stone-600 hover:text-zinc-900'
                  }`}
                >
                  Pure White (RGB 255)
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode('transparent')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    bgMode === 'transparent' 
                      ? 'bg-white text-zinc-950 shadow-xs border border-stone-200' 
                      : 'text-stone-600 hover:text-zinc-900'
                  }`}
                >
                  Transparent PNG
                </button>
                <button
                  type="button"
                  onClick={() => setBgMode('neutral')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    bgMode === 'neutral' 
                      ? 'bg-white text-zinc-950 shadow-xs border border-stone-200' 
                      : 'text-stone-600 hover:text-zinc-900'
                  }`}
                >
                  Soft Studio Gray
                </button>
              </div>
            </div>

            <button
              onClick={resetAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-zinc-900 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Upload Another Photo</span>
            </button>
          </div>
        )}

        {/* Dropzone / Canvas Area */}
        <div 
          className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center min-h-[320px] sm:min-h-[400px] ${
            status === 'idle' 
              ? 'border-stone-300 hover:border-zinc-900 bg-stone-50/50 hover:bg-stone-50 cursor-pointer p-8' 
              : 'border-stone-200 bg-stone-50/20 p-4'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={status === 'idle' ? () => fileInputRef.current?.click() : undefined}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleFileChange} 
          />

          {/* IDLE STATE */}
          {status === 'idle' && (
            <div className="text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center mx-auto text-zinc-800 transition-transform group-hover:scale-105">
                <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-900" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-1 font-manrope">
                  Click or drag your {nicheName.toLowerCase()} photo here
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 font-normal">
                  Supports JPG, PNG, WEBP up to 25MB. Processed directly in your browser with WebAssembly for 100% privacy.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold border border-stone-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exports Pure RGB 255 White &amp; Transparent PNG</span>
              </div>
            </div>
          )}

          {/* LOADING & PROCESSING STATE */}
          {(status === 'loading-model' || status === 'processing') && (
            <div className="text-center max-w-sm mx-auto p-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 mb-1">{progressText}</p>
                <p className="text-xs text-stone-500">Sub-pixel edge detection running locally on your CPU/GPU</p>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-zinc-950 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-extrabold text-zinc-900">{progress}%</span>
            </div>
          )}

          {/* DONE STATE */}
          {status === 'done' && resultUrl && (
            <div className="w-full flex flex-col items-center gap-6">
              <div 
                className={`relative w-full max-w-lg aspect-square rounded-xl overflow-hidden shadow-sm flex items-center justify-center border border-stone-200 transition-colors ${
                  bgMode === 'transparent' ? 'bg-checkered' : bgMode === 'white' ? 'bg-white' : 'bg-stone-100'
                }`}
              >
                <img 
                  src={resultUrl} 
                  alt={`${nicheName} background removed`}
                  className="max-h-[85%] max-w-[85%] object-contain drop-shadow-sm select-none" 
                />

                {/* Badge overlay on preview */}
                <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-zinc-700">
                  {bgMode === 'white' ? 'RGB (255, 255, 255)' : bgMode === 'transparent' ? 'Alpha Cutout' : 'Studio Neutral'}
                </div>
              </div>

              {/* Marketplace Aspect Ratio & Frame Preset */}
              <div className="w-full max-w-lg bg-stone-100 p-2 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">Canvas Format &amp; 85% Frame Preset</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Auto-Centered</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCanvasPreset('amazon-square')}
                    className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                      canvasPreset === 'amazon-square'
                        ? 'bg-white text-zinc-950 font-bold shadow-2xs border border-stone-200'
                        : 'text-stone-600 hover:text-zinc-900'
                    }`}
                  >
                    Amazon (2000px 1:1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasPreset('quickcommerce-square')}
                    className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                      canvasPreset === 'quickcommerce-square'
                        ? 'bg-white text-zinc-950 font-bold shadow-2xs border border-stone-200'
                        : 'text-stone-600 hover:text-zinc-900'
                    }`}
                  >
                    Blinkit (1000px 1:1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasPreset('original')}
                    className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                      canvasPreset === 'original'
                        ? 'bg-white text-zinc-950 font-bold shadow-2xs border border-stone-200'
                        : 'text-stone-600 hover:text-zinc-900'
                    }`}
                  >
                    Original Ratio
                  </button>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="w-full max-w-lg flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPureWhite}
                  className="w-full sm:flex-1 bg-zinc-950 hover:bg-zinc-800 active:scale-98 text-white px-5 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download Pure White (RGB 255)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTransparent}
                  className="w-full sm:flex-1 bg-white hover:bg-stone-50 active:scale-98 text-zinc-900 border border-stone-300 hover:border-zinc-900 px-5 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-stone-600" />
                  <span>Download Transparent PNG</span>
                </button>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <div className="text-center max-w-md mx-auto p-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-zinc-900 mb-1">Processing Error</h4>
                <p className="text-xs text-stone-600">{errorMsg}</p>
              </div>
              <button
                type="button"
                onClick={resetAll}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                Try Another Photo
              </button>
            </div>
          )}

        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-6 pt-5 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs text-stone-600 font-medium">
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Free &amp; Unlimited</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Private &amp; On-Device</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exact RGB 255 White</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Full Resolution Retained</span>
          </div>
        </div>

      </div>

      {/* POST-DOWNLOAD LUXURY STUDIO BACKGROUND UPSELL DRAWER / MODAL */}
      {showUpsell && (
        <div className="mt-6 p-5 sm:p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => setShowUpsell(false)}
            className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors"
            aria-label="Dismiss upsell"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-1.5 text-left max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Next-Level Creative Upgrade</span>
              </div>
              <h4 className="text-lg sm:text-xl font-bold font-lora text-white">
                Want a luxury studio background instead of plain white?
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 font-normal leading-relaxed">
                Plain white gets your product listed on marketplaces. High-converting 3D marble pedestals, lifestyle scenes, and festive backdrops get you 3x higher CTR.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto shrink-0">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login?returnTo=/dashboard')}
                className="w-full sm:w-auto bg-[#4452FB] hover:bg-[#3641C9] active:scale-98 text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Generate in 1 Click (10 Free Credits)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowUpsell(false)}
                className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Keep Plain White
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkered pattern CSS */}
      <style>{`
        .bg-checkered {
          background-image: linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
};
