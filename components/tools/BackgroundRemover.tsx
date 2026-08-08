import React, { useRef, useState, useCallback } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function BackgroundRemover() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "loading-model" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const processFile = useCallback(async (file: File) => {
    setStatus("loading-model");
    setResultUrl(null);
    setErrorMsg("");
    setProgress(0);
    setProgressText("Initializing AI model...");

    const objUrl = URL.createObjectURL(file);
    setOriginalUrl(objUrl);

    try {
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          if (key.includes("fetch")) {
            setStatus("loading-model");
            setProgressText("Downloading AI model weights...");
          } else {
            setStatus("processing");
            setProgressText("Removing background...");
          }

          if (total > 0) {
            const pct = Math.min(100, Math.round((current / total) * 100));
            setProgress(pct);
          }
        },
      });

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setProgress(100);
      setStatus("done");
    } catch (err) {
      console.error("Background removal error:", err);
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
            {progressText || (status === "loading-model" ? "Loading AI model..." : "Removing background...")}
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
            Need even higher resolution? Switch to the <button className="text-primary font-medium hover:underline">Pro Tier</button> for server-side GPU processing.
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

