// Frontend component for the PRO tier — sends image to your own
// /api/remove-background-pro route, which proxies to your Cloud Run GPU service.

import { useRef, useState } from "react";

export default function BackgroundRemoverPro() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFile = async (file: File) => {
    setStatus("processing");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/remove-background-pro", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Processing failed");
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {status === "processing" && <p>Processing with Pro model…</p>}
      {status === "error" && <p style={{ color: "red" }}>{errorMsg}</p>}
      {status === "done" && resultUrl && (
        <>
          <img src={resultUrl} alt="result" style={{ maxWidth: "100%" }} />
          <a href={resultUrl} download="bg-removed-pro.png">
            Download
          </a>
        </>
      )}
    </div>
  );
}
