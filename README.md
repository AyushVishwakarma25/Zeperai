# Free Tier — Client-Side Background Remover

100% in-browser. No API, no server cost, scales infinitely for free because
the user's own device does the compute.

## How it works

1. A small segmentation model (RMBG-1.4, open weights) runs via
   `onnxruntime-web` using WebGL (falls back to WASM on older devices).
2. The model file is a **static asset** — downloaded once from your own
   CDN/public folder and cached by the browser. This is not a third-party
   API call; it's the same as loading a font or a large JS bundle.
3. Everything — decode, inference, masking, PNG export — happens in the
   `<canvas>` in the user's browser.

## 1. Install the JS dependency

```bash
npm install onnxruntime-web
```

## 2. Get the model file (one-time, done by you, not per-user)

You need `rmbg-1.4-int8.onnx` (quantized, ~11MB — much faster to download
and run than the 44MB fp32 version).

```bash
pip install optimum[exporters] onnx onnxruntime --break-system-packages

python -c "
from optimum.exporters.onnx import main_export
main_export(
    model_name_or_path='briaai/RMBG-1.4',
    output='rmbg-onnx',
    task='semantic-segmentation'
)
"

# Quantize to int8 to shrink size + speed up browser inference
python -c "
from onnxruntime.quantization import quantize_dynamic, QuantType
quantize_dynamic('rmbg-onnx/model.onnx', 'rmbg-1.4-int8.onnx', weight_type=QuantType.QInt8)
"
```

Note: RMBG-1.4 is released under a **non-commercial** license by BRIA — fine
to prototype with, but for the free tier of a commercial product, swap it
for a fully permissive alternative such as:
- `briaai/RMBG-2.0` base variant under BRIA's commercial license (paid), or
- **U2Net (u2netp, Apache-2.0)** — smaller, slightly lower quality, but
  fully free for commercial use. Same export steps, just point
  `model_name_or_path` at a U2Net ONNX export instead.

I'd recommend U2Net (u2netp) for the actually-free tier given your Pro tier
already exists to upsell quality — keeps you license-clean.

## 3. Host the model file

Drop the `.onnx` file into your Next.js `public/models/` folder:

```
public/models/rmbg-1.4-int8.onnx   (or u2netp-int8.onnx)
```

It'll be served as a static file at `/models/rmbg-1.4-int8.onnx` — update
`MODEL_URL` in `BackgroundRemover.tsx` to match.

## 4. Serve required CORS/COOP headers (for WASM threading)

In `next.config.js`:

```js
module.exports = {
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};
```

## 5. Drop the component in

```tsx
import BackgroundRemover from "@/components/BackgroundRemover";

export default function ToolPage() {
  return <BackgroundRemover />;
}
```

## Expected quality/speed

- Clean product-on-plain-background shots: very good, close to Pro tier.
- Complex edges (flyaway hair, fur, semi-transparent objects): noticeably
  behind Pro tier — this is your natural upsell moment.
- Speed: ~1-3s on a modern laptop/phone (WebGL), ~4-8s on WASM fallback.
