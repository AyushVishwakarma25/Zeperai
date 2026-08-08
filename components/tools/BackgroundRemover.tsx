import React, { useRef, useState, useCallback, useEffect } from "react";
import * as ort from "onnxruntime-web";

// TODO: Replace with actual model URL when provided by user
const MODEL_URL = "/models/rmbg-1.4-int8.onnx"; 
const MODEL_INPUT_SIZE = 1024; 

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function getSession() {
  if (!sessionPromise) {
    ort.env.wasm.numThreads = navigator.hardwareConcurrency
      ? Math.min(4, navigator.hardwareConcurrency)
      : 1;
    ort.env.wasm.simd = true;
    sessionPromise = ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ["webgl", "wasm"],
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

  const resizedMaskCanvas = document.createElement("canvas");
  resizedMaskCanvas.width = origWidth;
  resizedMaskCanvas.height = origHeight;
  const resizedCtx = resizedMaskCanvas.getContext("2d")!;
  resizedCtx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);
  const resizedMask = resizedCtx.getImageData(0, 0, origWidth, origHeight);

  for (let i = 0; i < origWidth * origHeight; i++) {
    outData.data[i * 4 + 3] = resizedMask.data[i * 4];
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
    getSession().catch(() => {});
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Free Background Remover</h2>
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
          Runs on your device
        </span>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) processFile(file);
        }}
        className="border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-primary/5 rounded-2xl min-h-[300px] flex flex-col items-center justify-center cursor-pointer p-6 transition-colors overflow-hidden relative"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          className="hidden"
        />
        {!originalUrl && (
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Click or drag an image here</p>
            <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, WEBP</p>
          </div>
        )}
        {originalUrl && status !== "done" && (
          <img src={originalUrl} alt="preview" className="max-w-full max-h-[400px] rounded-lg object-contain" />
        )}
        {status === "done" && resultUrl && (
          <div className="w-full flex justify-center items-center h-full">
            <CheckerboardImage src={resultUrl} />
          </div>
        )}
      </div>

      {(status === "loading-model" || status === "processing") && (
        <div className="space-y-2">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress || 15}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center font-medium">
            {status === "loading-model" ? "Loading AI model (once per session)..." : "Removing background..."}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {status === "done" && resultUrl && (
        <div className="flex flex-col items-center gap-4">
          <a
            href={resultUrl}
            download="background-removed.png"
            className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors shadow-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            Download Result
          </a>
          <p className="text-xs text-slate-500 text-center max-w-sm">
            Not perfectly clean? Complex edges like hair or fur might need the <button className="text-primary font-medium hover:underline">Pro Tier</button> which uses a larger cloud GPU model.
          </p>
        </div>
      )}
    </div>
  );
}

function CheckerboardImage({ src }: { src: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200"
      style={{
        backgroundImage:
          "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
        backgroundColor: "white",
      }}
    >
      <img src={src} alt="result" className="max-w-full max-h-[400px] object-contain block" />
    </div>
  );
}
