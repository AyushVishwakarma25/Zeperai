import React, { useRef, useState } from "react";

interface BackgroundRemoverProProps {
  onDeductCredits: (cost: number) => boolean;
  onRefundCredits: (cost: number) => void;
}

export default function BackgroundRemoverPro({ onDeductCredits, onRefundCredits }: BackgroundRemoverProProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFile = async (file: File) => {
    // Check credits before uploading
    if (!onDeductCredits(2)) return;

    setStatus("processing");
    setErrorMsg("");
    const objUrl = URL.createObjectURL(file);
    setOriginalUrl(objUrl);

    try {
      const formData = new FormData();
      formData.append("image", file);

      // Using the Express backend route
      const res = await fetch("/api/background-remover-pro", {
        method: "POST",
        body: formData,
        // Authentication token is handled by the browser cookie/session if any, 
        // or we might need to add Bearer token. I will fetch the session using Supabase.
      });

      if (!res.ok) {
        let errStr = "Processing failed";
        try {
            const data = await res.json();
            errStr = data.error || errStr;
        } catch {
            errStr = await res.text();
        }
        throw new Error(errStr);
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (err) {
      onRefundCredits(2);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Pro Background Remover</h2>
          <p className="text-sm text-slate-500">Uses BiRefNet for flawless edges, hair, and fur.</p>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
            Cloud GPU
            </span>
            <span className="text-xs font-semibold text-slate-400 mt-1">2 Credits</span>
        </div>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
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
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Click or drag an image for Pro removal</p>
            <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, WEBP (Max 15MB)</p>
          </div>
        )}
        {originalUrl && status !== "done" && (
          <img src={originalUrl} alt="preview" className={`max-w-full max-h-[400px] rounded-lg object-contain transition-opacity ${status === 'processing' ? 'opacity-50 blur-sm' : ''}`} />
        )}
        {status === "done" && resultUrl && (
          <div className="w-full flex justify-center items-center h-full">
            <CheckerboardImage src={resultUrl} />
          </div>
        )}
      </div>

      {status === "processing" && (
        <div className="space-y-2">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 text-center font-medium">
            Processing with Pro model on Cloud GPU...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {status === "done" && resultUrl && (
        <div className="flex justify-center">
          <a
            href={resultUrl}
            download="bg-removed-pro.png"
            className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors shadow-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            Download HD Result
          </a>
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
