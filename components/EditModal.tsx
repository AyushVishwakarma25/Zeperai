
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GeneratedImage, EditImageParams } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { ImageDropzone } from './ui/ImageDropzone';
import { processImageFile } from '../utils/images';
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
  }, [image.imageUrl, replacementPreview]);

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

      if (img.complete) {
          resetCrop();
      } else {
          img.onload = resetCrop;
      }
  }, [mode, image.imageUrl, resetCrop]);
  
  useEffect(() => {
    return () => {
      if (replacementPreview) {
        URL.revokeObjectURL(replacementPreview);
      }
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
              console.error("Failed to process uploaded image", e);
          }
      }
  }, [image.id, onImageUpdate]);

  const getCropCoords = (e: React.MouseEvent | React.PointerEvent) => {
    const container = cropContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getCanvasCoords = (e: React.MouseEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    lastPointRef.current = getCanvasCoords(e);
  };
  
  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault(); 
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPointRef.current) return;

    const currentPoint = getCanvasCoords(e);
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
        console.error("Error processing replacement image:", error);
        setReplacementImage(null);
      }
    } else {
      setReplacementImage(null);
    }
  }, []);

  const handleApplyInpaint = () => {
    if (!isOnline) {
        alert("You are offline. Inpainting requires an internet connection.");
        return;
    }
    if (!image.imageUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const pixelBuffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const hasDrawing = pixelBuffer.some(color => color !== 0);

    if (!hasDrawing) {
        alert("Please brush over the area you want to edit.");
        return;
    }
    if (!prompt.trim()) {
        alert("Please provide instructions for the edit.");
        return;
    }
    const maskDataUrl = canvas.toDataURL('image/png');
    onApplyEdit({
      originalImageUrl: image.imageUrl,
      maskDataUrl,
      prompt,
      replacementImage
    });
  }

  const handleCropPointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingHandle(handle);
    const { x, y } = getCropCoords(e);
    dragStartRef.current = { mouseX: x, mouseY: y, crop };
  };

  const handleCropPointerMove = (e: React.PointerEvent) => {
    if (!draggingHandle) return;
    e.stopPropagation();
    e.preventDefault(); 
    const { x: mouseX, y: mouseY } = getCropCoords(e);
    const { mouseX: startX, mouseY: startY, crop: startCrop } = dragStartRef.current;
    let newCrop = { ...startCrop };
    const dx = mouseX - startX;
    const dy = mouseY - startY;

    const imgBounds = imageRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
    const parsedRatio = cropAspectRatio !== 'free' ? parseFloat(cropAspectRatio.split(':')[0]) / parseFloat(cropAspectRatio.split(':')[1]) : null;

    switch (draggingHandle) {
        case 'move':
            newCrop.x += dx;
            newCrop.y += dy;
            break;
        case 'topLeft':
            newCrop.width -= dx; newCrop.x += dx;
            newCrop.height -= dy; newCrop.y += dy;
            break;
        case 'topRight':
            newCrop.width += dx;
            newCrop.height -= dy; newCrop.y += dy;
            break;
        case 'bottomLeft':
            newCrop.width -= dx; newCrop.x += dx;
            newCrop.height += dy;
            break;
        case 'bottomRight':
            newCrop.width += dx;
            newCrop.height += dy;
            break;
        case 'top':
            newCrop.height -= dy; newCrop.y += dy;
            break;
        case 'bottom':
            newCrop.height += dy;
            break;
        case 'left':
            newCrop.width -= dx; newCrop.x += dx;
            break;
        case 'right':
            newCrop.width += dx;
            break;
    }

    if (parsedRatio && draggingHandle !== 'move') {
        if (['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'right', 'left'].includes(draggingHandle)) {
            newCrop.height = newCrop.width / parsedRatio;
        } else {
            newCrop.width = newCrop.height * parsedRatio;
        }
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
    const img = imageRef.current;
    if (!img) return;
    const { width: viewW, height: viewH } = img.getBoundingClientRect();
    
    if (ratio === 'free') return;

    const [w, h] = ratio.split(':').map(Number);
    const ratioVal = w / h;
    
    let newWidth = viewW * 0.8;
    let newHeight = newWidth / ratioVal;

    if (newHeight > viewH * 0.8) {
        newHeight = viewH * 0.8;
        newWidth = newHeight * ratioVal;
    }
    
    const newX = (viewW - newWidth) / 2;
    const newY = (viewH - newHeight) / 2;
    
    setCrop({ x: newX, y: newY, width: newWidth, height: newHeight });
  };
  
  const handleApplyCrop = () => {
    if (!image.imageUrl) return;
    const img = imageRef.current;
    if (!img) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const sourceX = crop.x * scaleX;
    const sourceY = crop.y * scaleY;
    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sourceWidth;
    cropCanvas.height = sourceHeight;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, sourceWidth, sourceHeight
    );
    
    const dataUrl = cropCanvas.toDataURL(image.imageUrl.split(';')[0].split('/')[1] || 'image/jpeg');
    onImageUpdate(image.id, dataUrl);
  };

  const handleDownload = () => {
      if (!image.imageUrl) return;
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = `edited-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const cropHandles = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'top', 'bottom', 'left', 'right'];

  const handleOverlayClick = () => {
      if (prompt.trim() || replacementImage) {
          if (window.confirm("You have unsaved edits. Are you sure you want to close?")) {
              onClose();
          }
      } else {
          onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={handleOverlayClick}>
      <div 
        className="bg-main w-full max-w-5xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-white z-20">
            <h2 className="text-xl font-bold text-slate-800">{getModalTitle()}</h2>
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
                onPointerLeave={mode === 'crop' ? handleCropPointerUp : undefined}
            >
                {displayImage ? (
                    <div className="relative shadow-lg touch-none py-8 px-4">
                        <img 
                          ref={imageRef} 
                          src={displayImage} 
                          alt="Editing" 
                          className="max-w-full max-h-[60vh] lg:max-h-[80vh] object-contain select-none pointer-events-none"
                          crossOrigin="anonymous"
                        />
                        {mode === 'background' && image.sourceProductImageUrl && (
                            <div className="absolute top-2 right-6 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                                {showOriginalBg ? 'Original' : 'Result'}
                            </div>
                        )}
                        {mode === 'inpaint' && (
                          <>
                            <canvas
                              ref={canvasRef}
                              className="absolute top-0 left-0 cursor-crosshair touch-none"
                              style={{ top: 32, left: 16 }} 
                              onPointerDown={startDrawing}
                              onPointerUp={stopDrawing}
                              onPointerLeave={stopDrawing}
                              onPointerEnter={() => setIsCursorOnCanvas(true)}
                              onPointerOut={() => setIsCursorOnCanvas(false)}
                              onPointerMove={(e) => {
                                setCursorPos(getCanvasCoords(e));
                                draw(e);
                              }}
                            />
                            {isCursorOnCanvas && (
                              <div
                                className="absolute rounded-full border-2 border-white bg-black/30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: cursorPos.x + 16,
                                    top: cursorPos.y + 32,
                                    width: brushSize,
                                    height: brushSize,
                                }}
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
                                     {cropHandles.map(handle => {
                                         const getHandleStyle = () => {
                                             switch (handle) {
                                                 case 'topLeft': return { top: -6, left: -6, cursor: 'nwse-resize' };
                                                 case 'topRight': return { top: -6, right: -6, cursor: 'nesw-resize' };
                                                 case 'bottomLeft': return { bottom: -6, left: -6, cursor: 'nesw-resize' };
                                                 case 'bottomRight': return { bottom: -6, right: -6, cursor: 'nwse-resize' };
                                                 case 'top': return { top: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
                                                 case 'bottom': return { bottom: -6, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' };
                                                 case 'left': return { top: '50%', left: -6, transform: 'translateY(-50%)', cursor: 'ew-resize' };
                                                 case 'right': return { top: '50%', right: -6, transform: 'translateY(-50%)', cursor: 'ew-resize' };
                                                 default: return {};
                                             }
                                         };
                                         return <div key={handle} onPointerDown={(e) => handleCropPointerDown(e, handle)} className="absolute w-4 h-4 bg-white rounded-full border border-slate-400 touch-none" style={getHandleStyle()} />;
                                     })}
                                 </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full p-8 flex items-center justify-center">
                        <div className="w-full max-w-md aspect-square bg-white rounded-xl shadow-sm">
                            <ImageDropzone 
                                id="editor-upload" 
                                prompt="Upload an image to edit" 
                                previewUrl={null} 
                                onFileChange={handleMainFileUpload} 
                                className="w-full h-full border-2 border-dashed border-slate-300 rounded-xl hover:border-primary/50 transition-colors"
                            />
                        </div>
                    </div>
                )}
                {image.imageUrl && <p className="text-xs text-slate-400 mt-2 lg:hidden text-center pb-4">Scroll outside image to move page</p>}
            </main>

            <aside className="flex-shrink-0 w-full lg:w-80 bg-white flex flex-col border-t lg:border-t-0 lg:border-l border-slate-200 lg:h-full z-10">
                <div className="p-6 flex-grow lg:overflow-y-auto">
                    <div className="p-1 bg-slate-100 rounded-lg flex space-x-1 mb-6 overflow-x-auto">
                        <TabButton active={mode === 'inpaint'} onClick={() => setMode('inpaint')}>Inpaint</TabButton>
                        <TabButton active={mode === 'crop'} onClick={() => setMode('crop')}>Crop</TabButton>
                        <TabButton active={mode === 'background'} onClick={() => setMode('background')}>Remove BG</TabButton>
                    </div>

                    {!image.imageUrl && (
                        <div className="text-center p-4 bg-slate-50 rounded-lg text-slate-500 text-sm">
                            Upload an image on the left to start editing.
                        </div>
                    )}

                    {image.imageUrl && mode === 'inpaint' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">1. Brush the area to change</label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-500">Brush Size</label>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <div className="flex-grow">
                                                <input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                                            </div>
                                            <span className="text-sm font-semibold w-8 text-center">{brushSize}</span>
                                        </div>
                                    </div>
                                    <Button onClick={clearCanvas} fullWidth variant="secondary">Clear Mask</Button>
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="edit-prompt" className="block text-sm font-semibold text-black mb-2">2. Describe your edit</label>
                                <textarea id="edit-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Change the color to blue" className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-slate-900" rows={4} />
                            </div>

                            <Button onClick={handleApplyInpaint} disabled={!isOnline || isEditing} fullWidth isLoading={isEditing}>
                                {isOnline ? 'Generate Edit' : 'Offline'}
                            </Button>

                            <div className="border-t border-slate-200 pt-5">
                                {!showReplacement ? (
                                    <Button variant="secondary" fullWidth onClick={() => setShowReplacement(true)}>
                                        <Icon name="swap" className="w-4 h-4 mr-2" />
                                        Replace Object (Optional)
                                    </Button>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-semibold text-black">3. Upload replacement</label>
                                            <button onClick={() => setShowReplacement(false)} className="text-xs text-slate-500 hover:text-red-500 font-semibold">
                                                Cancel
                                            </button>
                                        </div>
                                        <ImageDropzone 
                                            id="replacement-upload" 
                                            previewUrl={replacementPreview} 
                                            onFileChange={handleFileSelected} 
                                            prompt="Upload Object/Style" 
                                            className="aspect-[4/1] lg:aspect-[3/2]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {image.imageUrl && mode === 'crop' && (
                        <div className="space-y-6">
                             <Button onClick={resetCrop} fullWidth variant="secondary">Reset Crop</Button>
                             <div>
                                <label className="block text-sm font-semibold text-black mb-2">Aspect Ratio</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleSetAspectRatio('free')} className={`p-2 text-xs font-semibold rounded-lg border transition-colors ${cropAspectRatio === 'free' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>Free</button>
                                    <button onClick={() => handleSetAspectRatio('1:1')} className={`p-2 text-xs font-semibold rounded-lg border transition-colors ${cropAspectRatio === '1:1' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>1:1 Square</button>
                                    <button onClick={() => handleSetAspectRatio('4:5')} className={`p-2 text-xs font-semibold rounded-lg border transition-colors ${cropAspectRatio === '4:5' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>4:5 Portrait</button>
                                    <button onClick={() => handleSetAspectRatio('16:9')} className={`p-2 text-xs font-semibold rounded-lg border transition-colors ${cropAspectRatio === '16:9' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>16:9 Wide</button>
                                </div>
                             </div>
                        </div>
                    )}

                    {image.imageUrl && mode === 'background' && (
                        <div className="space-y-6 flex flex-col justify-start pt-2">
                            <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon name="magic-wand" className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Instant Removal</h3>
                                <p className="text-sm text-slate-500 mb-6">
                                    Automatically detect and isolate the main subject. This action costs 1 Credit.
                                </p>
                                <Button onClick={isOnline ? onRemoveBackground : undefined} disabled={!isOnline || isEditing} fullWidth isLoading={isEditing}>
                                    {isOnline ? 'Remove Background (1 Credit)' : 'Offline'}
                                </Button>
                                
                                {image.sourceProductImageUrl && (
                                    <div className="mt-4">
                                        <Button 
                                            onClick={() => setShowOriginalBg(!showOriginalBg)} 
                                            fullWidth 
                                            variant="secondary"
                                            className="mb-2"
                                        >
                                            <Icon name="swap" className="w-4 h-4 mr-2" />
                                            {showOriginalBg ? 'Show Result' : 'Compare Original'}
                                        </Button>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <Button onClick={handleDownload} fullWidth variant="secondary">
                                        <Icon name="download" className="w-4 h-4 mr-2" />
                                        Download Image
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {image.imageUrl && mode === 'crop' && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 lg:sticky lg:bottom-0 z-20">
                        <Button onClick={handleApplyCrop} fullWidth>
                            Apply Crop
                        </Button>
                    </div>
                )}
            </aside>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
