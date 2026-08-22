import React from 'react';
import type { GenerateImageParams, ElementTransform } from '../../types.js';
import {
    LAYOUT_BLUEPRINTS, ELEMENT_CONTENT_SOURCE, ELEMENT_LABELS,
    type AdElementKey
} from './layoutBlueprints.js';
import { GOOGLE_FONT_LIBRARY, loadGoogleFont } from './googleFonts.js';
import { FormInput, FormTextArea } from '../ui/Form.js';
import { Button } from '../ui/Button.js';

interface Props {
    selectedElement: AdElementKey | null;
    layoutBlueprintId: string | null;
    params: GenerateImageParams;
    handleParamChange: (param: keyof GenerateImageParams, value: any) => void;
}

export const AdElementEditorPanel: React.FC<Props> = ({
    selectedElement, layoutBlueprintId, params, handleParamChange,
}) => {
    if (!selectedElement || !layoutBlueprintId) {
        return (
            <div className="p-6 text-sm text-slate-400 text-center border border-dashed border-slate-200 rounded-xl">
                Click any element on the ad — title, badge, logo, CTA — to reposition, recolor, or change its font.
            </div>
        );
    }

    const blueprint = LAYOUT_BLUEPRINTS[layoutBlueprintId]?.[selectedElement];
    const overrides = (params.adElementTransforms as Record<string, ElementTransform> | undefined)?.[selectedElement];
    const current: ElementTransform = { ...blueprint, ...overrides };

    const textOverrides = params.adElementText as Record<string, string> | undefined;
    const sourceParam = ELEMENT_CONTENT_SOURCE[selectedElement];
    const content = textOverrides?.[selectedElement]
        ?? (sourceParam ? (params as any)[sourceParam] : '')
        ?? '';

    const patchTransform = (p: Partial<ElementTransform>) => {
        handleParamChange('adElementTransforms' as keyof GenerateImageParams, {
            ...(params.adElementTransforms || {}),
            [selectedElement]: { ...current, ...p },
        });
    };

    const patchContent = (value: string) => {
        handleParamChange('adElementText' as keyof GenerateImageParams, {
            ...(params.adElementText || {}),
            [selectedElement]: value,
        });
    };

    const isTextElement = !!sourceParam || ['badge', 'contactBlock', 'stickers'].includes(selectedElement);

    return (
        <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-white">
            <div className="text-sm font-semibold text-slate-800 pb-2 border-b border-slate-100">
                {ELEMENT_LABELS[selectedElement]}
            </div>

            {isTextElement && (
                <FormTextArea
                    label="Content"
                    id={`el-content-${selectedElement}`}
                    value={content}
                    onChange={e => patchContent(e.target.value)}
                    rows={2}
                />
            )}

            {isTextElement && (
                <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Font</label>
                    <select
                        className="w-full text-sm border border-slate-200 rounded-md py-1.5 px-2"
                        value={current.fontFamily || ''}
                        onChange={e => {
                            const font = GOOGLE_FONT_LIBRARY.find(f => f.family === e.target.value);
                            if (font) loadGoogleFont(font.family, font.weights);
                            patchTransform({ fontFamily: e.target.value });
                        }}
                        style={{ fontFamily: current.fontFamily ? `'${current.fontFamily}', sans-serif` : undefined }}
                    >
                        {GOOGLE_FONT_LIBRARY.map(f => (
                            <option key={f.family} value={f.family} style={{ fontFamily: `'${f.family}', sans-serif` }}>
                                {f.family}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <FormInput label="Font size" id="el-fontsize" type="number"
                    value={String(current.fontSize ?? '')}
                    onChange={e => patchTransform({ fontSize: Number(e.target.value) })} />
                <FormInput label="Color" id="el-color" placeholder="#FFFFFF"
                    value={current.color || ''}
                    onChange={e => patchTransform({ color: e.target.value })} />
            </div>

            <FormInput label="Background (badges/pills only)" id="el-bg" placeholder="#6A5AE0"
                value={current.backgroundColor || ''}
                onChange={e => patchTransform({ backgroundColor: e.target.value })} />

            <div className="grid grid-cols-3 gap-3">
                <FormInput label="X %" id="el-x" type="number" value={String(current.x)}
                    onChange={e => patchTransform({ x: Number(e.target.value) })} />
                <FormInput label="Y %" id="el-y" type="number" value={String(current.y)}
                    onChange={e => patchTransform({ y: Number(e.target.value) })} />
                <FormInput label="Rotate °" id="el-rot" type="number" value={String(current.rotation ?? 0)}
                    onChange={e => patchTransform({ rotation: Number(e.target.value) })} />
            </div>

            <Button variant="secondary" fullWidth onClick={() => patchTransform({ visible: current.visible === false })}>
                {current.visible === false ? 'Show element' : 'Hide element'}
            </Button>
        </div>
    );
};
