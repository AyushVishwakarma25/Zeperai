
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { GeneratedImage } from '../types.js';
import { Icon } from './ui/Icon.js';
import { AdTextOverlay } from './ui/AdTextOverlay.js';

interface ZoomModalProps {
  image: GeneratedImage;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

const ZoomModal: React.FC<ZoomModalProps> = ({ image, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const startDragPos = useRef({ x: 0, y: 0 });

  const resetTransform = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetTransform(); // Reset when image changes
  }, [image.imageUrl, resetTransform]);
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const newScale = scale - e.deltaY * 0.01;
    const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    setScale(clampedScale);
    if (clampedScale <= MIN_SCALE) {
        setPosition({ x: 0, y: 0 }); // Reset position when zoomed out
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (scale <= MIN_SCALE) return;
    e.preventDefault();
    setIsDragging(true);
    startDragPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
        x: e.clientX - startDragPos.current.x,
        y: e.clientY - startDragPos.current.y
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMouseUp(e);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 z-[80] flex items-center justify-center p-4 cursor-grab"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
        <button 
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 z-[82]"
            onClick={onClose}
            aria-label="Close"
        >
            <Icon name="close" className="w-6 h-6" />
        </button>

        <div 
          className="w-full h-full flex items-center justify-center overflow-hidden relative" 
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
        >
            <div
                className={`relative transition-transform duration-150 ${isDragging ? '' : 'ease-out'}`}
                style={{ 
                  transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                  cursor: scale > MIN_SCALE ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                }}
                onMouseDown={handleMouseDown}
            >
                <img
                    ref={imageRef}
                    src={image.imageUrl}
                    alt="Zoomed view"
                    className="max-w-[95vw] max-h-[95vh] object-contain pointer-events-none"
                />
                {image.params.appMode === 'Ad Creative' && (
                    <AdTextOverlay params={image.params} />
                )}
            </div>
        </div>

         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full z-[81] backdrop-blur-sm">
            Scroll to zoom, drag to pan
        </div>
    </div>
  );
};

export default ZoomModal;
