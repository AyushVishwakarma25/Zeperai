import React, { useRef, useState, useCallback } from "react";
import { removeBackground } from "@imgly/background-removal";

export default function BackgroundRemover() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "loading-model" | "processing" | "done" | "error">("idle");
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
      const resultObjUrl = URL.createObjectURL(blob);
      setResultUrl(resultObjUrl);
      setStatus("done");
    } catch (e: any) {
      let msg = e?.message || "Failed to process image";
      if (msg.includes("Failed to fetch") || String(e).includes("Failed to fetch")) {
        msg = "Unable to download AI model weights (network error). Please check your connection or try the Pro Tier.";
      }
      setErrorMsg(msg);
      setStatus("error");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/png, image/jpeg, image/webp" 
          onChange={handleFileChange} 
        />
        
        {status === "idle" && (
          <div className="text-slate-500">
            <p className="font-semibold mb-2">Click or drag an image here to remove the background</p>
            <p className="text-sm">Standard quality, processing on your device</p>
          </div>
        )}
        
        {(status === "loading-model" || status === "processing") && (
          <div className="text-slate-500 flex flex-col items-center">
            <div className="w-full max-w-xs bg-slate-200 rounded-full h-2.5 mb-2 dark:bg-gray-700">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm">{progressText} {progress}%</p>
          </div>
        )}

        {status === "done" && resultUrl && (
          <div className="flex flex-col items-center gap-4">
             <img src={resultUrl} alt="Result" className="max-w-xs rounded-lg shadow-sm bg-checkered" />
             <div className="flex gap-2">
                 <button 
                   onClick={(e) => { e.stopPropagation(); setStatus("idle"); setResultUrl(null); setOriginalUrl(null); }}
                   className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                 >
                     Start Over
                 </button>
                 <a 
                   href={resultUrl} 
                   download="background-removed.png"
                   onClick={(e) => e.stopPropagation()}
                   className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary/30"
                 >
                     Download Image
                 </a>
             </div>
          </div>
        )}

        {status === "error" && (
           <div className="text-red-500">
               <p className="font-semibold mb-2">Error processing image</p>
               <p className="text-sm">{errorMsg}</p>
               <button 
                 onClick={(e) => { e.stopPropagation(); setStatus("idle"); setErrorMsg(""); }}
                 className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
               >
                   Try Again
               </button>
           </div>
        )}
      </div>
      <style>{`
        .bg-checkered {
          background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}
