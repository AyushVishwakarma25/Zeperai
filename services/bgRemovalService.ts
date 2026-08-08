import { removeBackground } from "@imgly/background-removal";

async function loadImageAsBlob(url: string): Promise<Blob> {
    if (url.startsWith('data:')) {
        const res = await fetch(url);
        return await res.blob();
    }
    
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.blob();
    } catch (fetchErr) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width || 500;
                    canvas.height = img.naturalHeight || img.height || 500;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Canvas context unavailable'));
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((b) => {
                        if (b) resolve(b);
                        else reject(new Error('Failed to create image blob'));
                    }, 'image/png');
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image for background removal'));
            img.src = url;
        });
    }
}

export async function removeBackgroundClientSide(imageUrl: string): Promise<string> {
    try {
        const blob = await loadImageAsBlob(imageUrl);
        
        const resultBlob = await removeBackground(blob, {
            progress: (key: string, current: number, total: number) => {
                console.log(`Background removal progress: ${key} ${current}/${total}`);
            }
        });
        
        return URL.createObjectURL(resultBlob);
    } catch (error: any) {
        console.error("Error removing background on client side:", error);
        if (error?.message?.includes("Failed to fetch") || error?.toString()?.includes("Failed to fetch")) {
            throw new Error("Network error downloading AI model weights or image. Please check your connection or try the Pro engine.");
        }
        throw error;
    }
}

