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

  const getCropCoords = (e: React.MouseEvent) => {
    const container = cropContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getCanvasCoords = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    lastPointRef.current = getCanvasCoords(e);
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
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
  const handleCropMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setDraggingHandle(handle);
    const { x, y } = getCropCoords(e);
    dragStartRef.current = { mouseX: x, mouseY: y, crop };
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!draggingHandle) return;
    e.stopPropagation();
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
  
  const handleCropMouseUp = () => setDraggingHandle(null);

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
        <header className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800">Edit Photoshoot</h2>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
                <Icon name="close" className="w-5 h-5"/>
            </button>
        </header>
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
            <main 
                ref={cropContainerRef}
                className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-100 overflow-auto relative"
                onMouseMove={mode === 'crop' ? handleCropMouseMove : undefined}
                onMouseUp={mode === 'crop' ? handleCropMouseUp : undefined}
                onMouseLeave={mode === 'crop' ? handleCropMouseUp : undefined}
            >
                <div className="relative">
                    <img 
                      ref={imageRef} 
                      src={image.imageUrl} 
                      alt="Editing" 
                      className="max-w-full max-h-[75vh] lg:max-h-[80vh] object-contain select-none"
                      crossOrigin="anonymous"
                    />
                    {mode === 'inpaint' && (
                      <>
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 cursor-none"
                          onMouseDown={startDrawing}
                          onMouseUp={stopDrawing}
                          onMouseLeave={() => {
                            setIsCursorOnCanvas(false);
                            stopDrawing();
                          }}
                          onMouseEnter={() => setIsCursorOnCanvas(true)}
                          onMouseMove={(e) => {
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
                                className="absolute border-2 border-white/80 cursor-move" 
                                style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height, pointerEvents: 'auto' }}
                                onMouseDown={(e) => handleCropMouseDown(e, 'move')}
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
                                     return <div key={handle} onMouseDown={(e) => handleCropMouseDown(e, handle)} className="absolute w-3 h-3 bg-white rounded-full border border-slate-400" style={getHandleStyle()} />;
                                 })}
                             </div>
                        </div>
                    )}
                </div>
            </main>
            <aside className="w-full lg:w-80 bg-white p-6 flex flex-col justify-between overflow-y-auto flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200">
                <div>
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
                                <textarea id="edit-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Change the color to blue" className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm" rows={3} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-2">3. Upload replacement (optional)</label>
                                <ImageDropzone id="replacement-upload" previewUrl={replacementPreview} onFileChange={handleFileSelected} prompt="Upload Object/Style" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                             <Button onClick={resetCrop} fullWidth variant="secondary">Reset Crop</Button>
                        </div>
                    )}
                </div>
                <div className="mt-6">
                    {mode === 'inpaint' ? (
                        <Button onClick={handleApplyInpaint} fullWidth isLoading={isEditing}>
                            Generate Edit
                        </Button>
                    ) : (
                        <Button onClick={handleApplyCrop} fullWidth>
                            Apply Crop
                        </Button>
                    )}
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
};

export default EditModal;