
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GeneratedImage, EditImageParams } from '../types';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { ImageDropzone } from './ui/ImageDropzone';
import { processImageFile } from '../imageUtils';

interface EditModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onApplyEdit: (params: EditImageParams) => Promise<void>;
  onImageUpdate: (imageId: string, newImageUrl: string) => void;
  isEditing: boolean;
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

const MIN_CROP_SIZE = 20; // Minimum crop dimension in pixels

const EditModal: React.FC<EditModalProps> = ({ image, onClose, onApplyEdit, onImageUpdate, isEditing }) => {
  const [mode, setMode] = useState<'inpaint' | 'crop'>('inpaint');

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
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const setupCanvasAndCrop = () => {
      const { width, height } = img.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      clearCanvas();
      resetCrop();
    };

    img.onload = setupCanvasAndCrop;
    if (img.complete) {
      setupCanvasAndCrop();
    }
    
    window.addEventListener('resize', setupCanvasAndCrop);
    return () => window.removeEventListener('resize', setupCanvasAndCrop);
  }, [image.imageUrl, clearCanvas, resetCrop]);
  
  // BUG FIX: Cleanup blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (replacementPreview) {
        URL.revokeObjectURL(replacementPreview);
      }
    };
  }, [replacementPreview]);

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
    // Prevent default touch actions like scrolling when drawing
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

  // --- CROP LOGIC ---
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
    e.preventDefault(); // Prevent scrolling while cropping
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
        // ... more cases for each handle
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

    // Aspect ratio lock
    if (parsedRatio && draggingHandle !== 'move') {
        if (['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'right', 'left'].includes(draggingHandle)) {
            newCrop.height = newCrop.width / parsedRatio;
        } else {
            newCrop.width = newCrop.height * parsedRatio;
        }
    }
    
    // Clamp dimensions
    newCrop.width = Math.max(MIN_CROP_SIZE, newCrop.width);
    newCrop.height = Math.max(MIN_CROP_SIZE, newCrop.height);

    // Clamp position within image boundaries
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

  const cropHandles = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'top', 'bottom', 'left', 'right'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-main w-full max-w-5xl h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0 bg-white z-20">
            <h2 className="text-xl font-bold text-slate-800">Edit Photoshoot</h2>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                <Icon name="close" className="w-5 h-5"/>
            </button>
        </header>
        
        {/* Main Content Area - Scrollable on mobile, fixed layout on desktop */}
        <div className="flex-grow flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
            {/* Image Canvas Area - Added extra padding on mobile to allow scrolling around the canvas */}
            <main 
                ref={cropContainerRef}
                className="relative flex-shrink-0 min-h-[40vh] lg:flex-1 lg:h-full bg-slate-100 flex flex-col items-center justify-center py-8 lg:py-4 px-4 lg:overflow-auto"
                onPointerMove={mode === 'crop' ? handleCropPointerMove : undefined}
                onPointerUp={mode === 'crop' ? handleCropPointerUp : undefined}
                onPointerLeave={mode === 'crop' ? handleCropPointerUp : undefined}
            >
                <div className="relative shadow-lg touch-none">
                    <img 
                      ref={imageRef} 
                      src={image.imageUrl} 
                      alt="Editing" 
                      className="max-w-full max-h-[60vh] lg:max-h-[80vh] object-contain select-none pointer-events-none"
                      crossOrigin="anonymous"
                    />
                    {mode === 'inpaint' && (
                      <>
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 cursor-crosshair touch-none"
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
                                left: cursorPos.x,
                                top: cursorPos.y,
                                width: brushSize,
                                height: brushSize,
                            }}
                          />
                        )}
                      </>
                    )}
                    {mode === 'crop' && (
                        <div className="absolute inset-0" style={{ pointerEvents: draggingHandle ? 'auto' : 'none' }}>
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
                <p className="text-xs text-slate-400 mt-2 lg:hidden">Scroll outside image to move page</p>
            </main>

            {/* Sidebar Controls Area */}
            <aside className="flex-shrink-0 w-full lg:w-80 bg-white flex flex-col border-t lg:border-t-0 lg:border-l border-slate-200 lg:h-full z-10">
                <div className="p-6 flex-grow lg:overflow-y-auto">
                    <div className="p-1 bg-slate-200 rounded-lg flex space-x-1 mb-6">
                        <TabButton active={mode === 'inpaint'} onClick={() => setMode('inpaint')}>Inpaint</TabButton>
                        <TabButton active={mode === 'crop'} onClick={() => setMode('crop')}>Crop & Resize</TabButton>
                    </div>

                    {mode === 'inpaint' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">1. Brush the area to change</label>
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
                                <label htmlFor="edit-prompt" className="block text-sm font-medium text-slate-600 mb-2">2. Describe your edit</label>
                                <textarea id="edit-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Change the color to blue" className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm" rows={4} />
                            </div>

                            <Button onClick={handleApplyInpaint} fullWidth isLoading={isEditing}>
                                Generate Edit
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
                                            <label className="block text-sm font-medium text-slate-600">3. Upload replacement</label>
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
                    ) : (
                        <div className="space-y-6">
                             <Button onClick={resetCrop} fullWidth variant="secondary">Reset Crop</Button>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">Aspect Ratio</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => handleSetAspectRatio('free')} className={`p-2 text-xs font-semibold rounded-lg border transition-colors ${cropAspectRatio === 'free' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>Free</button>
                                    <button onClick={() => handleSetAspectRatio('1:1')} className={`p-2 text-xs font-semibold rounded-lg border transition-colors ${cropAspectRatio === '1:1' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>1:1 Square</button>
                                    <button onClick={() => handleSetAspectRatio('4:5')} className={`p-2 text-xs font-semibold rounded-lg border transition-colors ${cropAspectRatio === '4:5' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>4:5 Portrait</button>
                                    <button onClick={() => handleSetAspectRatio('16:9')} className={`p-2 text-xs font-semibold rounded-lg border transition-colors ${cropAspectRatio === '16:9' ? 'bg-primary text-white border-primary shadow-md' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}>16:9 Wide</button>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
                
                {/* Footer Action Button */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 lg:sticky lg:bottom-0 z-20">
                    {mode === 'crop' ? (
                        <Button onClick={handleApplyCrop} fullWidth>
                            Apply Crop
                        </Button>
                    ) : null}
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
