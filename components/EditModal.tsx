
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GeneratedImage, EditImageParams } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { ImageDropzone } from './ui/ImageDropzone';
import { processImageFile, dataURLtoFile, downloadImage } from '../utils/images';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface EditModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onApplyEdit: (params: EditImageParams) => Promise<void>;
  onRemoveBackground: () => Promise<void>;
  onImageUpdate: (imageId: string, newImageUrl: string, sourceImageUrl?: string) => void;
  isEditing: boolean;
  initialTab?: 'inpaint' | 'crop' | 'background';
}

const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            active ? 'bg-primary text-white shadow-md' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
    >
        {children}
    </button>
);

const MIN_CROP_SIZE = 20;

const EditModal: React.FC<EditModalProps> = ({ 
    image, 
    onClose, 
    onApplyEdit, 
    onRemoveBackground,
    onImageUpdate, 
    isEditing,
    initialTab = 'inpaint'
}) => {
  const isOnline = useNetworkStatus();
  const [mode, setMode] = useState<'inpaint' | 'crop' | 'background'>(initialTab);
  const [showOriginalBg, setShowOriginalBg] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [isDownloading, setIsDownloading] = useState(false);

  // Inpaint state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [prompt, setPrompt] = useState('');
  const [replacementImage, setReplacementImage] = useState<File | null>(null);
  const [replacementPreview, setReplacementPreview] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isCursorOnCanvas, setIsCursorOnCanvas] = useState(false);
  const [showReplacement, setShowReplacement] = useState(false);
  
  // Crop state
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cropAspectRatio, setCropAspectRatio] = useState<string>('free');
  const [draggingHandle, setDraggingHandle] = useState<string | null>(null);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, crop: { x: 0, y: 0, width: 0, height: 0 } });

  useEffect(() => {
      if (image.imageUrl) {
          setPrompt('');
          setReplacementImage(null);
          if (replacementPreview) URL.revokeObjectURL(replacementPreview);
          setReplacementPreview(null);
          setShowReplacement(false);
          setShowOriginalBg(false);
      }
  }, [image.imageUrl]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const resetCrop = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const { width, height } = img.getBoundingClientRect();
    setCrop({ x: width * 0.1, y: height * 0.1, width: width * 0.8, height: height * 0.8 });
  }, []);

  useEffect(() => {
    if (mode !== 'inpaint' || !image.imageUrl) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const setupCanvas = () => {
      const { width, height } = img.getBoundingClientRect();
      if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
          clearCanvas();
      }
    };

    if (img.complete) {
        setupCanvas();
    } else {
        img.onload = setupCanvas;
    }
    
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [mode, image.imageUrl, clearCanvas]);

  useEffect(() => {
      if (mode !== 'crop' || !image.imageUrl) return;
      const img = imageRef.current;
      if (!img) return;
      if (img.complete) resetCrop();
      else img.onload = resetCrop;
  }, [mode, image.imageUrl, resetCrop]);
  
  useEffect(() => {
    return () => {
      if (replacementPreview) URL.revokeObjectURL(replacementPreview);
    };
  }, [replacementPreview]);

  const handleMainFileUpload = useCallback(async (file: File | null) => {
      if (file) {
          try {
              const processedFile = await processImageFile(file, { maxWidth: 2048, maxHeight: 2048 });
              const reader = new FileReader();
              reader.readAsDataURL(processedFile);
              reader.onload = () => {
                  const result = reader.result as string;
                  onImageUpdate(image.id, result, result);
              };
          } catch (e) {
              console.error("Upload failed", e);
          }
      }
  }, [image.id, onImageUpdate]);

  const handleFileSelected = useCallback(async (file: File | null) => {
    setReplacementPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (file) {
      try {
        const processedFile = await processImageFile(file, { maxWidth: 1024, maxHeight: 1024 });
        setReplacementImage(processedFile);
        setReplacementPreview(URL.createObjectURL(processedFile));
      } catch (error) {
        console.error("Replacement failed", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleKrackxDrop = (e: any) => {
        const { id, image: droppedImg } = e.detail;
        const file = dataURLtoFile(droppedImg.imageUrl, `internal-${droppedImg.id}.png`);
        if (id === 'editor-upload') handleMainFileUpload(file);
        else if (id === 'replacement-upload') handleFileSelected(file);
    };
    window.addEventListener('krackx-internal-image-drop', handleKrackxDrop);
    return () => window.removeEventListener('krackx-internal-image-drop', handleKrackxDrop);
  }, [handleMainFileUpload, handleFileSelected]);

  const getCoords = (e: React.MouseEvent | React.PointerEvent, ref: React.RefObject<HTMLElement>) => {
    if (!ref.current) return { x: 0, y: 0 };
    const rect = ref.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    lastPointRef.current = getCoords(e, canvasRef);
  };
  
  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !lastPointRef.current) return;
    const currentPoint = getCoords(e, canvasRef);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPointRef.current = currentPoint;
  };

  const handleApplyInpaint = () => {
    if (!isOnline) return;
    if (!image.imageUrl) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    try {
        const hasDrawing = new Uint32Array(ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height).data.buffer).some(c => c !== 0);
        if (!hasDrawing) { alert("Brush over an area first."); return; }
        if (!prompt.trim()) { alert("Enter instructions."); return; }
        onApplyEdit({ originalImageUrl: image.imageUrl, maskDataUrl: canvasRef.current!.toDataURL('image/png'), prompt, replacementImage });
    } catch (e) {
        alert("Security Error: Try re-uploading from device.");
    }
  }

  const handleCropPointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingHandle(handle);
    const { x, y } = getCoords(e, cropContainerRef);
    dragStartRef.current = { mouseX: x, mouseY: y, crop };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    if (!draggingHandle) return;
    const { x: mouseX, y: mouseY } = getCoords(e, cropContainerRef);
    const { mouseX: startX, mouseY: startY, crop: startCrop } = dragStartRef.current;
    let newCrop = { ...startCrop };
    const dx = mouseX - startX;
    const dy = mouseY - startY;
    const imgBounds = imageRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
    const parsedRatio = cropAspectRatio !== 'free' ? parseFloat(cropAspectRatio.split(':')[0]) / parseFloat(cropAspectRatio.split(':')[1]) : null;

    switch (draggingHandle) {
        case 'move': newCrop.x += dx; newCrop.y += dy; break;
        case 'topLeft': newCrop.width -= dx; newCrop.x += dx; newCrop.height -= dy; newCrop.y += dy; break;
        case 'topRight': newCrop.width += dx; newCrop.height -= dy; newCrop.y += dy; break;
        case 'bottomLeft': newCrop.width -= dx; newCrop.x += dx; newCrop.height += dy; break;
        case 'bottomRight': newCrop.width += dx; newCrop.height += dy; break;
        case 'top': newCrop.height -= dy; newCrop.y += dy; break;
        case 'bottom': newCrop.height += dy; break;
        case 'left': newCrop.width -= dx; newCrop.x += dx; break;
        case 'right': newCrop.width += dx; break;
    }

    if (parsedRatio && draggingHandle !== 'move') {
        if (['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'right', 'left'].includes(draggingHandle)) newCrop.height = newCrop.width / parsedRatio;
        else newCrop.width = newCrop.height * parsedRatio;
    }
    
    newCrop.width = Math.max(MIN_CROP_SIZE, newCrop.width);
    newCrop.height = Math.max(MIN_CROP_SIZE, newCrop.height);
    newCrop.x = Math.max(0, Math.min(newCrop.x, imgBounds.width - newCrop.width));
    newCrop.y = Math.max(0, Math.min(newCrop.y, imgBounds.height - newCrop.height));
    setCrop(newCrop);
  };
  
  const handleCropPointerUp = (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setDraggingHandle(null);
  };

  const handleSetAspectRatio = (ratio: string) => {
    setCropAspectRatio(ratio);
    if (!imageRef.current || ratio === 'free') return;
    const { width: viewW, height: viewH } = imageRef.current.getBoundingClientRect();
    const [w, h] = ratio.split(':').map(Number);
    const ratioVal = w / h;
    let nWidth = viewW * 0.8;
    let nHeight = nWidth / ratioVal;
    if (nHeight > viewH * 0.8) { nHeight = viewH * 0.8; nWidth = nHeight * ratioVal; }
    setCrop({ x: (viewW - nWidth) / 2, y: (viewH - nHeight) / 2, width: nWidth, height: nHeight });
  };
  
  const handleApplyCrop = () => {
    if (!image.imageUrl || !imageRef.current) return;
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = crop.width * scaleX;
    cropCanvas.height = crop.height * scaleY;
    cropCanvas.getContext('2d')?.drawImage(imageRef.current, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, cropCanvas.width, cropCanvas.height);
    onImageUpdate(image.id, cropCanvas.toDataURL(image.imageUrl.split(';')[0].split('/')[1] || 'image/jpeg'));
  };

  const handleDownload = async () => {
      if (!image.imageUrl || isDownloading) return;
      setIsDownloading(true);
      try {
          await downloadImage(image.imageUrl, `edited-${Date.now()}`, downloadFormat);
      } finally {
          setIsDownloading(false);
      }
  };

  const getModalTitle = () => {
      switch(mode) {
          case 'background': return 'Background Remover';
          case 'crop': return 'Crop & Resize';
          case 'inpaint': return 'Magic Editor';
          default: return 'Edit Photoshoot';
      }
  }

  const displayImage = (mode === 'background' && showOriginalBg && image.sourceProductImageUrl) 
      ? image.sourceProductImageUrl 
      : image.imageUrl;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={() => (prompt.trim() || replacementImage) ? window.confirm("Discard edits?") && onClose() : onClose()}>
      <div className="bg-main w-full max-w-5xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-slate-200 flex justify-between items-center bg-white z-20">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800">{getModalTitle()}</h2>
                {image.imageUrl && (
                    <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-bold transition-all"
                    >
                        <Icon name="download" className="w-4 h-4" />
                        {isDownloading ? 'Downloading...' : 'Download Result'}
                    </button>
                )}
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                <Icon name="close" className="w-5 h-5"/>
            </button>
        </header>
        
        <div className="flex-grow flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            <main 
                ref={cropContainerRef}
                className={`relative flex-shrink-0 min-h-[40vh] lg:flex-1 lg:h-full bg-slate-100 flex flex-col items-center justify-center lg:overflow-auto ${mode === 'background' ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]' : ''}`}
                onPointerMove={mode === 'crop' ? handleCropPointerMove : undefined}
                onPointerUp={mode === 'crop' ? handleCropPointerUp : undefined}
            >
                {displayImage ? (
                    <div className="relative shadow-lg touch-none py-8 px-4">
                        <img 
                          ref={imageRef} src={displayImage} alt="Editing" 
                          className="max-w-full max-h-[60vh] lg:max-h-[80vh] object-contain select-none pointer-events-none"
                          crossOrigin="anonymous"
                        />
                        {mode === 'inpaint' && (
                          <>
                            <canvas
                              ref={canvasRef} className="absolute top-0 left-0 cursor-crosshair touch-none"
                              style={{ top: 32, left: 16 }}
                              onPointerDown={startDrawing} onPointerUp={stopDrawing}
                              onPointerLeave={stopDrawing} onPointerEnter={() => setIsCursorOnCanvas(true)} onPointerOut={() => setIsCursorOnCanvas(false)}
                              onPointerMove={(e) => { setCursorPos(getCoords(e, canvasRef)); draw(e); }}
                            />
                            {isCursorOnCanvas && (
                              <div className="absolute rounded-full border-2 border-white bg-black/30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                                style={{ left: cursorPos.x + 16, top: cursorPos.y + 32, width: brushSize, height: brushSize }}
                              />
                            )}
                          </>
                        )}
                        {mode === 'crop' && (
                            <div className="absolute inset-0" style={{ top: 32, bottom: 32, pointerEvents: draggingHandle ? 'auto' : 'none' }}>
                                 <div className="absolute inset-0 bg-black/50" style={{ clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${crop.x}px ${crop.y}px, ${crop.x}px ${crop.y + crop.height}px, ${crop.x + crop.width}px ${crop.y + crop.height}px, ${crop.x + crop.width}px ${crop.y}px, ${crop.x}px ${crop.y}px)` }} />
                                 <div 
                                    className="absolute border-2 border-white/80 cursor-move touch-none" 
                                    style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height, pointerEvents: 'auto' }}
                                    onPointerDown={(e) => handleCropPointerDown(e, 'move')}
                                 >
                                     {['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'top', 'bottom', 'left', 'right'].map(handle => (
                                         <div key={handle} onPointerDown={(e) => handleCropPointerDown(e, handle)} 
                                            className="absolute w-4 h-4 bg-white rounded-full border border-slate-400 touch-none" 
                                            style={handle === 'topLeft' ? { top: -6, left: -6, cursor: 'nwse-resize' } : handle === 'topRight' ? { top: -6, right: -6, cursor: 'nesw-resize' } : handle === 'bottomLeft' ? { bottom: -6, left: -6, cursor: 'nesw-resize' } : handle === 'bottomRight' ? { bottom: -6, right: -6, cursor: 'nwse-resize' } : handle === 'top' ? { top: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' } : handle === 'bottom' ? { bottom: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' } : handle === 'left' ? { top: '50%', left: -6, transform: 'translateY(-50%)', cursor: 'ew-resize' } : { top: '50%', right: -6, transform: 'translateY(-50%)', cursor: 'ew-resize' }} 
                                         />
                                     ))}
                                 </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full p-8 flex items-center justify-center">
                        <div className="w-full max-w-md aspect-square bg-white rounded-xl shadow-sm">
                            <ImageDropzone id="editor-upload" prompt="Upload to edit" previewUrl={null} onFileChange={handleMainFileUpload} className="w-full h-full" />
                        </div>
                    </div>
                )}
            </main>

            <aside className="flex-shrink-0 w-full lg:w-80 bg-white flex flex-col border-t lg:border-t-0 lg:border-l border-slate-200 lg:h-full z-10">
                <div className="p-6 flex-grow lg:overflow-y-auto">
                    <div className="p-1 bg-slate-100 rounded-lg flex space-x-1 mb-6">
                        <TabButton active={mode === 'inpaint'} onClick={() => setMode('inpaint')}>Inpaint</TabButton>
                        <TabButton active={mode === 'crop'} onClick={() => setMode('crop')}>Crop</TabButton>
                        <TabButton active={mode === 'background'} onClick={() => setMode('background')}>Remove BG</TabButton>
                    </div>

                    {image.imageUrl && (
                        <div className="space-y-6">
                            {mode === 'inpaint' && (
                                <>
                                    <label className="block text-sm font-semibold text-black">1. Brush area | 2. Describe</label>
                                    <div className="flex items-center gap-3">
                                        <input type="range" min="5" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="flex-grow h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                        <Button onClick={clearCanvas} variant="secondary" className="!py-1 !px-2 !text-xs">Clear</Button>
                                    </div>
                                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Change color to gold" className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm" rows={4} />
                                    <Button onClick={handleApplyInpaint} disabled={!isOnline || isEditing} fullWidth isLoading={isEditing}>Generate Edit</Button>
                                    <div className="border-t border-slate-200 pt-4">
                                        <button onClick={() => setShowReplacement(!showReplacement)} className="text-xs text-primary font-bold hover:underline mb-2">
                                            {showReplacement ? 'Hide Replacement' : '+ Add Replacement Asset'}
                                        </button>
                                        {showReplacement && <ImageDropzone id="replacement-upload" previewUrl={replacementPreview} onFileChange={handleFileSelected} prompt="Upload Object" className="aspect-[3/2]" />}
                                    </div>
                                </>
                            )}
                            
                            {mode === 'crop' && (
                                <div className="space-y-4">
                                    <Button onClick={resetCrop} fullWidth variant="secondary">Reset Crop</Button>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['free', '1:1', '4:5', '16:9'].map(r => (
                                            <button key={r} onClick={() => handleSetAspectRatio(r)} className={`p-2 text-xs font-bold rounded-lg border ${cropAspectRatio === r ? 'bg-primary text-white border-primary' : 'bg-slate-100 text-slate-700'}`}>{r.toUpperCase()}</button>
                                        ))}
                                    </div>
                                    <Button onClick={handleApplyCrop} fullWidth>Apply Crop</Button>
                                </div>
                            )}

                            {mode === 'background' && (
                                <div className="space-y-4 text-center">
                                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"><Icon name="magic-wand" className="w-8 h-8 text-primary" /></div>
                                    <h3 className="font-bold text-slate-800">Auto BG Remover</h3>
                                    <Button onClick={onRemoveBackground} disabled={!isOnline || isEditing} fullWidth isLoading={isEditing}>Process (1 Credit)</Button>
                                    {image.sourceProductImageUrl && <Button onClick={() => setShowOriginalBg(!showOriginalBg)} fullWidth variant="secondary">{showOriginalBg ? 'Show Result' : 'Show Original'}</Button>}
                                    
                                    <div className="pt-4 border-t border-slate-200">
                                        <p className="text-[10px] text-slate-400 mb-2 uppercase font-bold">Download Format</p>
                                        <div className="flex gap-2 mb-4">
                                            {['png', 'jpeg', 'webp'].map(f => (
                                                <button key={f} onClick={() => setDownloadFormat(f as any)} className={`flex-1 py-1 text-xs font-bold rounded-lg border ${downloadFormat === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>{f.toUpperCase()}</button>
                                            ))}
                                        </div>
                                        <Button onClick={handleDownload} fullWidth variant="secondary" isLoading={isDownloading}>
                                            <Icon name="download" className="w-4 h-4 mr-2" />
                                            Download Now
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
