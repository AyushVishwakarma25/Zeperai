
import type { AspectRatio, GeneratedImage } from '../types';
import { AppMode } from '../types';
import { INITIAL_GENERATE_PARAMS } from '../constants';

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
    // Basic filename without extension
    let namePart = 'design';

    if (image.params?.productDescription) {
        namePart = image.params.productDescription;
    } else if (image.params?.appMode === AppMode.Product && image.params.productStylePreset) {
        namePart = image.params.productStylePreset.includes('|') ? image.params.productStylePreset.split('|')[1] : image.params.productStylePreset;
    } else if (image.params?.appMode === AppMode.Influencer && image.params.poseSuggestion) {
        namePart = image.params.poseSuggestion;
    }

    const sanitizedName = namePart.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
    const finalPrefix = prefix ? `${prefix}-` : '';
    const finalIndex = index ? `-${index}` : '';

    return `${finalPrefix}${sanitizedName}${finalIndex}`;
}

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
        link.download = `${filename}.${format === 'jpeg' ? 'jpg' : format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(blobUrl);

    } catch (e) {
        console.error("Download failed", e);
        // Fallback to direct download
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.png`; 
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
