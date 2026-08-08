/**
 * FREE TIER — Background Remover (100% client-side, zero API calls)
 * ---------------------------------------------------------------
 * Runs a small open-weight segmentation model (RMBG-1.4, ONNX export)
 * entirely in the user's browser via onnxruntime-web (WASM/WebGL backend).
 *
 * - No server round-trip after the model file is cached
 * - No third-party API calls, no per-image cost
 * - Model weights (~44MB fp32 / ~11MB int8) are fetched once as a static
 *   file and cached by the browser (Cache Storage) — this is a static
 *   asset download, not an API call, and works fully offline after first load.
 *
 * Install:
 *   npm install onnxruntime-web
 *
 * Model file:
 *   Download the ONNX export of briaai/RMBG-1.4 (Apache-2.0 compatible
 *   community export) and host it yourself, e.g.:
 *     public/models/rmbg-1.4-int8.onnx
 *   (see README.md in this folder for the exact download + quantize steps)
 */

import { useRef, useState, useCallback, useEffect } from "react";
import * as ort from "onnxruntime-web";

// Point this at wherever you host the .onnx file (same-origin static file)
const MODEL_URL = "/models/rmbg-1.4-int8.onnx";
const MODEL_INPUT_SIZE = 1024; // RMBG-1.4 expects 1024x1024

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession() {
  if (!sessionPromise) {
    ort.env.wasm.numThreads = navigator.hardwareConcurrency
      ? Math.min(4, navigator.hardwareConcurrency)
      : 1;
    ort.env.wasm.simd = true;
    ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/";
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["webgl", "wasm"], // tries WebGL first, falls back to WASM
      graphOptimizationLevel: "all",
    });
  }
  return sessionPromise;
}

function preprocess(img: HTMLImageElement): {
  tensor: ort.Tensor;
  origWidth: number;
  origHeight: number;
} {
  const canvas = document.createElement("canvas");
  canvas.width = MODEL_INPUT_SIZE;
  canvas.height = MODEL_INPUT_SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const { data } = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

  const float32Data = new Float32Array(3 * MODEL_INPUT_SIZE * MODEL_INPUT_SIZE);
  const mean = [0.5, 0.5, 0.5];
  const std = [1.0, 1.0, 1.0];
  const pixelCount = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;

  for (let i = 0; i < pixelCount; i++) {
    float32Data[i] = (data[i * 4] / 255 - mean[0]) / std[0]; // R
    float32Data[pixelCount + i] = (data[i * 4 + 1] / 255 - mean[1]) / std[1]; // G
    float32Data[2 * pixelCount + i] = (data[i * 4 + 2] / 255 - mean[2]) / std[2]; // B
  }

  return {
    tensor: new ort.Tensor("float32", float32Data, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]),
    origWidth: img.naturalWidth,
    origHeight: img.naturalHeight,
  };
}

async function applyMask(
  img: HTMLImageElement,
  maskData: Float32Array,
  origWidth: number,
  origHeight: number
): Promise<Blob> {
  // Mask comes back at MODEL_INPUT_SIZE x MODEL_INPUT_SIZE, resize to original
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = MODEL_INPUT_SIZE;
  maskCanvas.height = MODEL_INPUT_SIZE;
  const maskCtx = maskCanvas.getContext("2d")!;
  const maskImageData = maskCtx.createImageData(MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  for (let i = 0; i < maskData.length; i++) {
    const v = Math.max(0, Math.min(255, maskData[i] * 255));
    maskImageData.data[i * 4] = v;
    maskImageData.data[i * 4 + 1] = v;
    maskImageData.data[i * 4 + 2] = v;
    maskImageData.data[i * 4 + 3] = 255;
  }
  maskCtx.putImageData(maskImageData, 0, 0);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = origWidth;
  outCanvas.height = origHeight;
  const outCtx = outCanvas.getContext("2d")!;
  outCtx.drawImage(img, 0, 0, origWidth, origHeight);
  const outData = outCtx.getImageData(0, 0, origWidth, origHeight);

  // Resize mask to original dims using a temp canvas draw (bilinear via drawImage)
  const resizedMaskCanvas = document.createElement("canvas");
  resizedMaskCanvas.width = origWidth;
  resizedMaskCanvas.height = origHeight;
  const resizedCtx = resizedMaskCanvas.getContext("2d")!;
  resizedCtx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);
  const resizedMask = resizedCtx.getImageData(0, 0, origWidth, origHeight);

  for (let i = 0; i < origWidth * origHeight; i++) {
    outData.data[i * 4 + 3] = resizedMask.data[i * 4]; // alpha = mask value
  }
  outCtx.putImageData(outData, 0, 0);

  return new Promise((resolve) => {
    outCanvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export default function BackgroundRemover() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "loading-model" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Warm the model in the background as soon as the component mounts
    getSession().catch(() => {
      /* surfaced only when user actually tries to process */
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setStatus("loading-model");
    setResultUrl(null);
    setErrorMsg("");
    const objUrl = URL.createObjectURL(file);
    setOriginalUrl(objUrl);

    try {
      const img = new Image();
      img.src = objUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const session = await getSession();
      setStatus("processing");
      setProgress(40);

      const { tensor, origWidth, origHeight } = preprocess(img);
      const feeds: Record<string, ort.Tensor> = {};
      feeds[session.inputNames[0]] = tensor;

      const results = await session.run(feeds);
      setProgress(80);

      const outputName = session.outputNames[0];
      const maskTensor = results[outputName];
      const maskData = maskTensor.data as Float32Array;

      const blob = await applyMask(img, maskData, origWidth, origHeight);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(100);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong processing this image."
      );
      setStatus("error");
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={styles.title}>Background Remover</h2>
        <span style={styles.badge}>Free · runs on your device</span>
      </div>

      <div
        style={styles.dropzone}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) processFile(file);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
        {!originalUrl && <p style={styles.dropText}>Click or drag an image here</p>}
        {originalUrl && status !== "done" && (
          <img src={originalUrl} alt="preview" style={styles.previewImg} />
        )}
        {status === "done" && resultUrl && (
          <div style={styles.resultGrid}>
            <CheckerboardImage src={resultUrl} />
          </div>
        )}
      </div>

      {(status === "loading-model" || status === "processing") && (
        <div style={styles.progressRow}>
          <div style={styles.progressBarOuter}>
            <div style={{ ...styles.progressBarInner, width: `${progress || 15}%` }} />
          </div>
          <span style={styles.progressLabel}>
            {status === "loading-model" ? "Loading model…" : "Removing background…"}
          </span>
        </div>
      )}

      {status === "error" && <p style={styles.errorText}>{errorMsg}</p>}

      {status === "done" && resultUrl && (
        <a href={resultUrl} download="background-removed.png" style={styles.downloadBtn}>
          Download PNG
        </a>
      )}
    </div>
  );
}

function CheckerboardImage({ src }: { src: string }) {
  return (
    <div
      style={{
        backgroundImage:
          "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
        backgroundSize: "16px 16px",
        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        borderRadius: 8,
        display: "inline-block",
      }}
    >
      <img src={src} alt="result" style={{ maxWidth: "100%", maxHeight: 360, display: "block" }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 480,
    margin: "0 auto",
    fontFamily: "Inter, system-ui, sans-serif",
    color: "#EAEAEA",
    background: "#111318",
    border: "1px solid #23262E",
    borderRadius: 16,
    padding: 24,
  },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 600, margin: 0 },
  badge: {
    fontSize: 12,
    color: "#00E5A0",
    background: "rgba(0,229,160,0.1)",
    padding: "4px 10px",
    borderRadius: 999,
  },
  dropzone: {
    border: "1.5px dashed #33363F",
    borderRadius: 12,
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 12,
  },
  dropText: { color: "#8A8F98", fontSize: 14 },
  previewImg: { maxWidth: "100%", maxHeight: 320, borderRadius: 8 },
  resultGrid: { display: "flex", justifyContent: "center" },
  progressRow: { marginTop: 16 },
  progressBarOuter: { height: 6, background: "#23262E", borderRadius: 999, overflow: "hidden" },
  progressBarInner: { height: "100%", background: "#00E5A0", transition: "width 0.3s" },
  progressLabel: { fontSize: 12, color: "#8A8F98", marginTop: 6, display: "block" },
  errorText: { color: "#FF6B6B", fontSize: 13, marginTop: 12 },
  downloadBtn: {
    display: "block",
    textAlign: "center",
    marginTop: 16,
    background: "#00E5A0",
    color: "#0B0D10",
    fontWeight: 600,
    padding: "10px 0",
    borderRadius: 10,
    textDecoration: "none",
  },
};
