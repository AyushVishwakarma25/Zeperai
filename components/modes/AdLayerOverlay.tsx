import React, { useRef, useCallback } from 'react';
import type { GenerateImageParams, ElementTransform } from '../../types.js';
import {
    LAYOUT_BLUEPRINTS, ELEMENT_CONTENT_SOURCE, type AdElementKey
} from './layoutBlueprints.js';
import { loadGoogleFont } from './googleFonts.js';

interface AdLayerOverlayProps {
    backgroundImageUrl: string | null;
    layoutBlueprintId: string | null;
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
    selectedElement: AdElementKey | null;
    onSelectElement: (key: AdElementKey | null) => void;
    onGenerateBackground?: () => void;
    isGeneratingBg?: boolean;
}

export const AdLayerOverlay: React.FC<AdLayerOverlayProps> = ({
    backgroundImageUrl, layoutBlueprintId, params, handleParamChange,
    selectedElement, onSelectElement, onGenerateBackground, isGeneratingBg,
}) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{ key: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

    const blueprint = layoutBlueprintId ? LAYOUT_BLUEPRINTS[layoutBlueprintId] : undefined;
    const overrides = params.adElementTransforms as Record<string, ElementTransform> | undefined;
    const textOverrides = params.adElementText as Record<string, string> | undefined;

    const getTransform = (key: AdElementKey): ElementTransform => ({
        ...(blueprint?.[key]),
        ...(overrides?.[key]),
    } as ElementTransform);

    const getContent = (key: AdElementKey): string => {
        if (textOverrides?.[key] !== undefined) return textOverrides[key];
        const sourceParam = ELEMENT_CONTENT_SOURCE[key];
        return sourceParam ? ((params as any)[sourceParam] as string) || '' : '';
    };

    const patchTransform = useCallback((key: AdElementKey, patch: Partial<ElementTransform>) => {
        const t = getTransform(key);
        handleParamChange('adElementTransforms' as keyof GenerateImageParams, {
            ...(overrides || {}),
            [key]: { ...t, ...patch },
        });
    }, [overrides, handleParamChange, blueprint]);

    const handlePointerDown = (e: React.PointerEvent, key: AdElementKey) => {
        e.stopPropagation();
        onSelectElement(key);
        const t = getTransform(key);
        dragState.current = { key, startX: e.clientX, startY: e.clientY, origX: t.x, origY: t.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragState.current || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dxPct = ((e.clientX - dragState.current.startX) / rect.width) * 100;
        const dyPct = ((e.clientY - dragState.current.startY) / rect.height) * 100;
        patchTransform(dragState.current.key as AdElementKey, {
            x: Math.max(0, Math.min(95, dragState.current.origX + dxPct)),
            y: Math.max(0, Math.min(95, dragState.current.origY + dyPct)),
        });
    };

    const handlePointerUp = () => { dragState.current = null; };

    if (!blueprint) {
        return (
            <div className="aspect-[4/5] w-full flex items-center justify-center bg-slate-100 rounded-xl text-sm text-slate-400">
                Pick a template thumbnail to start editing.
            </div>
        );
    }

    return (
        <div
            ref={canvasRef}
            className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-lg bg-slate-900 select-none"
            onClick={() => onSelectElement(null)}
        >
            {backgroundImageUrl ? (
                <img src={backgroundImageUrl} className="absolute inset-0 w-full h-full object-cover" draggable={false} referrerPolicy="no-referrer" alt="Ad background" />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 text-sm p-6 text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-slate-200 font-semibold text-xs">
                        {isGeneratingBg ? 'Generating AI Background Scene...' : 'Blueprint Layout Preview'}
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                        {isGeneratingBg 
                            ? 'Creating custom scene based on template prompt...' 
                            : 'Text layers are positioned. Click below when you are ready to generate the background scene.'}
                    </p>
                    {!isGeneratingBg && onGenerateBackground && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onGenerateBackground(); }}
                            className="mt-2 text-xs font-semibold px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover shadow-sm transition-all flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate Background Scene
                        </button>
                    )}
                </div>
            )}

            {(Object.keys(blueprint) as AdElementKey[]).map((key) => {
                const t = getTransform(key);
                if (t.visible === false) return null;
                if (t.fontFamily) loadGoogleFont(t.fontFamily, [Number(t.fontWeight) || 400, 700]);
                const isSelected = selectedElement === key;
                const content = getContent(key);
                if (!content && !['stickers', 'platformIcons'].includes(key)) return null;

                return (
                    <div
                        key={key}
                        onPointerDown={(e) => handlePointerDown(e, key)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        style={{
                            position: 'absolute',
                            left: `${t.x}%`,
                            top: `${t.y}%`,
                            width: t.width ? `${t.width}%` : undefined,
                            fontSize: t.fontSize,
                            fontFamily: t.fontFamily ? `'${t.fontFamily}', sans-serif` : undefined,
                            fontWeight: t.fontWeight ?? 700,
                            color: t.color,
                            backgroundColor: t.backgroundColor,
                            borderRadius: t.borderRadius,
                            transform: t.rotation ? `rotate(${t.rotation}deg)` : undefined,
                            cursor: 'grab',
                            outline: isSelected ? '2px solid #6A5AE0' : 'none',
                            outlineOffset: 2,
                            padding: t.backgroundColor ? '4px 10px' : undefined,
                            whiteSpace: 'pre-line',
                            textAlign: 'center',
                            lineHeight: 1.1,
                        }}
                    >
                        {content}
                    </div>
                );
            })}
        </div>
    );
};
