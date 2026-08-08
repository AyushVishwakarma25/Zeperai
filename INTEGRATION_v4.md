# Integration Guide v4 — Prompt Library + Editable Layers (combined, final)

This is the full flow: **thumbnail pick → AI generates background/scene only
(no text) → Canva-style layer editor for every text element (drag, font,
color, size)**. Discard everything from the v3 round's "text baked into
image" prompts — replaced by `adCreativePromptLibrary.ts` in this round.

## Files in this round
- `adCreativePromptLibrary.ts` — 8 background-only prompts (no text/logos
  rendered by the AI), each pointing at a `layoutBlueprintId`.
- `layoutBlueprints.ts` — default position/font/color per element per
  template, plus `AdElementKey`/`ElementTransform` types and the
  `ELEMENT_CONTENT_SOURCE` map (which element reads from which existing
  `adTitle`/`adCta`/etc. field by default).
- `googleFonts.ts` — curated font list + `loadGoogleFont()`, which injects a
  `<link>` tag the first time a font is used so it renders immediately.
- `AdLayerOverlay.tsx` — the editing canvas: background image + draggable
  text/badge elements on top.
- `AdElementEditorPanel.tsx` — right-side panel: content, Google Font
  dropdown, color, size, position, rotation, show/hide.
- `AdPromptLibraryPicker.tsx` — thumbnail grid, now also fires
  `onTemplateSelected` so you can kick off background generation the moment
  a template is picked.

## Two new params fields needed in `types.ts`
```ts
export interface ElementTransform { /* import from layoutBlueprints.ts, or duplicate the shape here */ }

// add to GenerateImageParams:
adElementTransforms?: Record<string, ElementTransform>; // position/font/color overrides per element
adElementText?: Record<string, string>;                  // per-element text overrides, independent of adTitle/adCta
adBackgroundImageUrl?: string;                            // the generated background, once you have it
```

`adElementText` matters: it lets a user type different wording directly on
one element without silently rewriting `params.adTitle` (which your Quick
Edit panel and other logic might still depend on elsewhere).

## The wiring, end to end

```tsx
const [selectedElement, setSelectedElement] = useState<AdElementKey | null>(null);
const [isGeneratingBg, setIsGeneratingBg] = useState(false);

const handleTemplateSelected = async (template: AdPromptTemplate) => {
    setIsGeneratingBg(true);
    try {
        const resolvedPrompt = template.prompt
            .replace('[PRODUCT]', params.productDescription || 'the product')
            .replace('[BRAND_COLOR]', brandKit?.primaryColor || 'a bold brand color');
        const imageUrl = await generateAdBackground(resolvedPrompt, template.aspectRatio); // see below
        handleParamChange('adBackgroundImageUrl', imageUrl);
    } finally {
        setIsGeneratingBg(false);
    }
};

// in render:
<AdPromptLibraryPicker params={params} handleParamChange={handleParamChange} onTemplateSelected={handleTemplateSelected} />

<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 mt-6">
    <AdLayerOverlay
        backgroundImageUrl={params.adBackgroundImageUrl || null}
        layoutBlueprintId={AD_CREATIVE_PROMPT_LIBRARY.find(t => t.id === params.adTemplateId)?.layoutBlueprintId || null}
        params={params}
        handleParamChange={handleParamChange}
        selectedElement={selectedElement}
        onSelectElement={setSelectedElement}
    />
    <AdElementEditorPanel
        selectedElement={selectedElement}
        layoutBlueprintId={AD_CREATIVE_PROMPT_LIBRARY.find(t => t.id === params.adTemplateId)?.layoutBlueprintId || null}
        params={params}
        handleParamChange={handleParamChange}
    />
</div>
```

## The one function that still needs to exist: `generateAdBackground`

This is the actual gap — I still don't have visibility into any working
image-generation call in your codebase (you confirmed `GeneratedImage.imageUrl`
doesn't exist). Something like this needs to live in `geminiService.ts`:

```ts
export async function generateAdBackground(prompt: string, aspectRatio: string): Promise<string> {
    // Call whichever image model you're using — ImageModel.NanoBananaPro or
    // Imagen3HighQuality per your types.ts enum — and return a URL or base64
    // string. Shape depends entirely on your actual SDK/API setup, which I
    // haven't seen yet.
}
```

Two things I need from you to finish this properly:
1. **Do you have ANY working image generation call anywhere in the app right
   now** (Influencer mode, Product mode, etc. all need one) — even if it's
   not named `generateAdBackground`? If yes, paste it and I'll adapt it
   directly instead of guessing at the API shape.
2. **Final export** — once layers are positioned, how does the finished ad
   get flattened into a single downloadable image? That likely means
   rendering `AdLayerOverlay`'s DOM to a canvas (e.g. via `html-to-image` or
   `html2canvas`) since the text needs to end up as real pixels in the
   downloaded file. I can wire that export function next once the
   generation piece exists.
