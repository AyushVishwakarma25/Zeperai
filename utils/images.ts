
import type { AspectRatio, GeneratedImage, GenerateImageParams } from '../types.js';
import { AppMode } from '../types.js';
import { INITIAL_GENERATE_PARAMS } from '../constants.js';
import * as htmlToImage from 'html-to-image';

export const downloadCompositeImage = async (
    element: HTMLElement, 
    filename: string, 
    format: 'png' | 'jpeg' | 'webp' = 'png'
) => {
    try {
        let dataUrl: string;
        const options = {
            quality: 0.95,
            pixelRatio: 2, // High resolution
        };

        if (format === 'jpeg') {
            dataUrl = await htmlToImage.toJpeg(element, { ...options, backgroundColor: '#FFFFFF' });
        } else if (format === 'webp') {
            // html-to-image doesn't have direct webp, but we can convert the canvas
            const canvas = await htmlToImage.toCanvas(element, options);
            dataUrl = canvas.toDataURL('image/webp', 0.95);
        } else {
            dataUrl = await htmlToImage.toPng(element, options);
        }

        const link = document.createElement('a');
        link.href = dataUrl;
        
        const cleanFilename = filename.replace(/\.(png|jpe?g|webp)$/i, "");
        const extension = format === 'jpeg' ? 'jpg' : format;
        link.download = `${cleanFilename}.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Composite download failed", e);
        throw e;
    }
};

export const processImageFile = (
  file: File, 
  options: { maxWidth: number; maxHeight: number; format?: 'image/jpeg' | 'image/png' }
): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) return reject(new Error("Couldn't read file"));
      
      const img = new Image();
      img.src = event.target.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > options.maxWidth || height > options.maxHeight) {
          const ratio = Math.min(options.maxWidth / width, options.maxHeight / height);
          width *= ratio;
          height *= ratio;
          width = Math.round(width);
          height = Math.round(height);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return reject(new Error('Could not get canvas context'));
        
        const outputFormat = options.format ?? (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
        if (outputFormat === 'image/jpeg' && file.type !== 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas toBlob failed'));
            const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
            const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFile = new File([blob], `${fileName}.${extension}`, {
              type: outputFormat,
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          outputFormat,
          0.95 
        );
      };
      img.onerror = (error) => reject(new Error(`Image loading failed: ${error}`));
    };
    reader.onerror = (error) => reject(new Error(`File reading failed: ${error}`));
  });
};

export const createThumbnail = async (base64: string, maxWidth: number = 400): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = base64;
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if(!ctx) { reject(new Error('No context')); return; }
      
      ctx.drawImage(img, 0, 0, w, h);
      
      canvas.toBlob(blob => {
          if(blob) resolve(blob);
          else reject(new Error('Thumbnail failed'));
      }, 'image/webp', 0.7); // Low quality WebP for speed
    };
    img.onerror = (e) => reject(new Error('Failed to load image for thumbnail'));
  });
};

export const compressImage = (
  source: string | Blob, 
  options: { quality?: number; type?: 'image/jpeg' | 'image/png' | 'image/webp' } = {}
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const { quality = 0.85, type = 'image/webp' } = options;
    
    const img = new Image();
    let objectUrl: string | null = null;

    if (typeof source === 'string') {
        img.src = source;
        img.crossOrigin = 'Anonymous';
    } else {
        objectUrl = URL.createObjectURL(source);
        img.src = objectUrl;
    }

    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            reject(new Error('Canvas context unavailable'));
            return;
        }
        
        // Handle transparency for JPEG (fill white)
        if (type === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
        }, type, quality);
    };
    
    img.onerror = (e) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(e);
    };
  });
};

export const dataURLtoFile = (dataurl: string, filename: string): File => {
    let arr = dataurl.split(','), 
        mime = arr[0].match(/:(.*?);/)![1],
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
    
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
};

export const convertDataURLToFormat = (
  dataUrl: string,
  format: 'image/png' | 'image/jpeg' | 'image/webp'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));

      if (format === 'image/jpeg' && dataUrl.startsWith('data:image/png')) {
         ctx.fillStyle = '#FFFFFF';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      const convertedDataUrl = canvas.toDataURL(format, 0.95);
      resolve(convertedDataUrl);
    };
    img.onerror = (error) => reject(new Error(`Image loading failed: ${error}`));
  });
};

export const cropImageToAspectRatio = (dataUrl: string, targetAspectRatio: AspectRatio): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));

      const [targetW, targetH] = targetAspectRatio.split(':').map(Number);
      const targetRatio = targetW / targetH;

      let sourceX = 0, sourceY = 0;
      let sourceWidth = img.naturalWidth;
      let sourceHeight = img.naturalHeight;
      const sourceRatio = sourceWidth / sourceHeight;

      if (sourceRatio > targetRatio) {
        sourceWidth = sourceHeight * targetRatio;
        sourceX = (img.naturalWidth - sourceWidth) / 2;
      } else if (sourceRatio < targetRatio) {
        sourceHeight = sourceWidth / targetRatio;
        sourceY = (img.naturalHeight - sourceHeight) / 2;
      }
      
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

      const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
      resolve(canvas.toDataURL(mimeType, 1.0));
    };
    img.onerror = (error) => reject(new Error(`Image loading for crop failed: ${error}`));
  });
};

export const generateFilename = (image: GeneratedImage, prefix?: string, index?: number): string => {
    const params = (image.params || {}) as Partial<GenerateImageParams>;
    const parts: string[] = [];

    // 1. Prefix (e.g. 'campaign')
    if (prefix) parts.push(prefix);

    // 2. Identify Preset Name (High Priority for Thumbnails/Asset Management)
    let presetName = '';
    
    if (params.appMode === AppMode.Festival && params.festivalStyle) {
        presetName = params.festivalStyle;
    } else if (params.appMode === AppMode.Product && params.productStylePreset && params.productStylePreset !== 'AI Suggested') {
        presetName = params.productStylePreset;
    } else if (params.appMode === AppMode.Influencer && params.ugcStyle) {
        presetName = params.ugcStyle;
    } else if (params.appMode === AppMode.AdCreative && params.adStylePreset && params.adStylePreset !== '✨ AI Suggested') {
        presetName = params.adStylePreset;
    }

    // Clean preset name (remove Category| prefix)
    if (presetName) {
        const cleanPreset = presetName.includes('|') ? presetName.split('|')[1] : presetName;
        parts.push(cleanPreset);
    }

    // 3. Product Description (Context)
    if (params.productDescription) {
        // Truncate to keep filename manageable
        parts.push(params.productDescription.substring(0, 30));
    } else if (params.appMode === AppMode.Influencer && params.poseSuggestion) {
        parts.push(params.poseSuggestion.substring(0, 30));
    } else if (parts.length === 0) {
        // Fallback if totally empty
        parts.push('design');
    }

    // 4. Index
    if (index !== undefined) parts.push(String(index));

    // Join and Sanitize
    const rawString = parts.join('-');
    const sanitizedName = rawString
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove symbols
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Remove double hyphens

    const extension = image.imageUrl.split(';')[0].split('/')[1] || 'png';
    return `${sanitizedName}.${extension}`;
}

export const isImageBlurry = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(false);

                // Analyze a small patch to save processing
                const size = 120;
                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(img, 0, 0, size, size);
                const data = ctx.getImageData(0, 0, size, size).data;

                let totalDiff = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i+1] + data[i+2]) / 3;
                    if (i > 4) {
                        const prevAvg = (data[i-4] + data[i-3] + data[i-2]) / 3;
                        totalDiff += Math.abs(avg - prevAvg);
                    }
                }

                const variance = totalDiff / (size * size);
                // Threshold for "too blurry" - empirical value
                resolve(variance < 3.5);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export const downloadImage = async (url: string, filename: string, format: 'png' | 'jpeg' | 'webp' = 'png') => {
    try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        
        const mimeType = `image/${format}`;
        
        // Use a canvas to convert if needed
        const img = new Image();
        const blobUrl = URL.createObjectURL(blob);
        img.crossOrigin = 'anonymous';
        img.src = blobUrl;
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');
        
        // Handle transparency for JPEG
        if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        const convertedDataUrl = canvas.toDataURL(mimeType, 0.95);
        const link = document.createElement('a');
        link.href = convertedDataUrl;
        
        // Strip any existing extension and append the correct one for the requested format
        const cleanFilename = filename.replace(/\.(png|jpe?g|webp)$/i, "");
        const extension = format === 'jpeg' ? 'jpg' : format;
        link.download = `${cleanFilename}.${extension}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(blobUrl);

    } catch (e) {
        console.error("Download failed", e);
        // Fallback to direct download
        const link = document.createElement('a');
        link.href = url;
        
        // Even in fallback, try to fix extension if we can, though content type might mismatch if conversion failed
        const cleanFilename = filename.replace(/\.(png|jpe?g|webp)$/i, "");
        // If conversion failed, we might be downloading a PNG as .jpg, which is not ideal but better than failing
        // However, better to just fallback to original extension if we can't convert
        const extension = filename.includes('.') ? filename.split('.').pop() : 'png';
        link.download = `${cleanFilename}.${extension}`;
        
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const fileToGeneratedImage = async (file: File): Promise<GeneratedImage> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const imageUrl = reader.result as string;
            const img = new Image();
            img.onload = () => {
                const ratio = img.width / img.height;
                let standardAspectRatio: any = '1:1'; 
                if (ratio > 1.33) standardAspectRatio = '16:9'; 
                else if (ratio < 0.8) standardAspectRatio = '9:16';   
                else if (ratio < 1) standardAspectRatio = '4:5'; 
                
                resolve({
                    id: `local-edit-${Date.now()}`, // Temporary ID
                    imageUrl,
                    caption: file.name,
                    hashtags: '',
                    aspectRatio: standardAspectRatio,
                    params: INITIAL_GENERATE_PARAMS,
                    sourceProductImageUrl: imageUrl,
                    timestamp: Date.now(),
                });
            };
            img.onerror = reject;
            img.src = imageUrl;
        };
        reader.onerror = reject;
    });
};
