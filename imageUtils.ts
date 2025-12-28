
/**
 * FILE: imageUtils.ts
 *
 * PURPOSE:
 * - Client-side image processing (Resizing, Format Conversion, cropping).
 *
 * FLOW:
 * File Input → HTML Canvas Processing → Blob/DataURL Output
 *
 * INPUT:
 * - File object or DataURL string
 *
 * OUTPUT:
 * - Optimized File object or DataURL string
 *
 * NOTES:
 * - Runs entirely in the browser to save bandwidth.
 */

import type { AspectRatio, GeneratedImage } from './types';
import { AppMode } from './types';
import { INITIAL_GENERATE_PARAMS } from './constants';

export const processImageFile = (
  file: File, 
  options: { maxWidth: number; maxHeight: number; format?: 'image/jpeg' | 'image/png' }
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 1. Validate Input
    if (!file) {
        return reject(new Error("No file provided"));
    }

    // 2. Read File
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        return reject(new Error("Couldn't read file"));
      }
      
      // 3. Load Image Object
      const img = new Image();
      img.src = event.target.result as string;

      img.onload = () => {
        // 4. Process on Canvas (Resize)
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

        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        
        // Handle format and transparency
        const outputFormat = options.format ?? (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
        if (outputFormat === 'image/jpeg' && file.type !== 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 5. Output Safe File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas toBlob failed'));
            }
            const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
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

export const dataURLtoFile = (dataurl: string, filename: string): File => {
    // 1. Process Data
    let arr = dataurl.split(','), 
        mime = arr[0].match(/:(.*?);/)![1],
        bstr = atob(arr[1]), 
        n = bstr.length, 
        u8arr = new Uint8Array(n);
    
    // 2. Convert to Bytes
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    // 3. Return File
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

export const cropImageToAspectRatio = (
  dataUrl: string,
  targetAspectRatio: AspectRatio
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. Load Image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    
    img.onload = () => {
      // 2. Calculate Geometry
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
        sourceWidth = sourceHeight * targetRatio;
        sourceX = (img.naturalWidth - sourceWidth) / 2;
      } else if (sourceRatio < targetRatio) {
        sourceHeight = sourceWidth / targetRatio;
        sourceY = (img.naturalHeight - sourceHeight) / 2;
      }
      
      // 3. Draw Crop
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

      // 4. Return Output
      const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
      const croppedDataUrl = canvas.toDataURL(mimeType, 1.0);
      resolve(croppedDataUrl);
    };
    img.onerror = (error) => reject(new Error(`Image loading for crop failed: ${error}`));
  });
};

export const generateFilename = (image: GeneratedImage, prefix?: string, index?: number): string => {
    const extension = image.imageUrl.split(';')[0].split('/')[1] || 'png';
    let namePart = 'design';

    if (image.params?.productDescription) {
        namePart = image.params.productDescription;
    } else if (image.params?.appMode === AppMode.Product && image.params.productStylePreset) {
        namePart = image.params.productStylePreset.includes('|')
            ? image.params.productStylePreset.split('|')[1]
            : image.params.productStylePreset;
    } else if (image.params?.appMode === AppMode.Influencer && image.params.poseSuggestion) {
        namePart = image.params.poseSuggestion;
    }

    const sanitizedName = namePart
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') 
        .replace(/\s+/g, '-') 
        .substring(0, 50);

    const finalPrefix = prefix ? `${prefix}-` : '';
    const finalIndex = index ? `-${index}` : '';

    return `${finalPrefix}${sanitizedName}${finalIndex}.${extension}`;
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
                    id: `edit-${Date.now()}`,
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
