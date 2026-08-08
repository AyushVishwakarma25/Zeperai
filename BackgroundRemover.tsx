import { useRef, useState, useCallback } from "react";
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
            {progressText || (status === "loading-model" ? "Loading model…" : "Removing background…")}
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

