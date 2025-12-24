
import type { AspectRatio } from './types';

export const processImageFile = (
  file: File, 
  options: { maxWidth: number; maxHeight: number; format?: 'image/jpeg' | 'image/png' }
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Couldn't read file"));
      }
      const img = new Image();
      img.src = event.target.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize if the image is larger than the max dimensions
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

        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        
        // Default to PNG for transparency, otherwise JPEG. Let caller override.
        const outputFormat = options.format ?? (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
        
        // If converting an image with transparency to JPEG, fill the background with white.
        if (outputFormat === 'image/jpeg' && file.type !== 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas toBlob failed'));
            }
            const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
            // Create a new file name, preserving the original name but changing extension
            const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const newFile = new File([blob], `${fileName}.${extension}`, {
              type: outputFormat,
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          outputFormat,
          0.95 // High quality
        );
      };
      img.onerror = (error) => reject(new Error(`Image loading failed: ${error}`));
    };
    reader.onerror = (error) => reject(new Error(`File reading failed: ${error}`));
  });
};

/**
 * Converts a Data URL (base64) to a File object.
 */
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
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      // If converting a PNG with transparency to JPEG, fill background with white.
      if (format === 'image/jpeg' && dataUrl.startsWith('data:image/png')) {
         ctx.fillStyle = '#FFFFFF';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);

      // Use high quality for JPEG and WebP
      const convertedDataUrl = canvas.toDataURL(format, 0.95);
      resolve(convertedDataUrl);
    };
    img.onerror = (error) => reject(new Error(`Image loading failed: ${error}`));
  });
};

export const cropImageToAspectRatio = (
  dataUrl: string,
  targetAspectRatio: AspectRatio
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const [targetW, targetH] = targetAspectRatio.split(':').map(Number);
      const targetRatio = targetW / targetH;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.naturalWidth;
      let sourceHeight = img.naturalHeight;

      const sourceRatio = sourceWidth / sourceHeight;

      if (sourceRatio > targetRatio) {
        // Source is wider than target, crop the sides
        sourceWidth = sourceHeight * targetRatio;
        sourceX = (img.naturalWidth - sourceWidth) / 2;
      } else if (sourceRatio < targetRatio) {
        // Source is taller than target, crop the top/bottom
        sourceHeight = sourceWidth / targetRatio;
        sourceY = (img.naturalHeight - sourceHeight) / 2;
      }
      
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight
      );

      const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
      const croppedDataUrl = canvas.toDataURL(mimeType, 1.0);
      resolve(croppedDataUrl);
    };
    img.onerror = (error) => reject(new Error(`Image loading for crop failed: ${error}`));
  });
};
