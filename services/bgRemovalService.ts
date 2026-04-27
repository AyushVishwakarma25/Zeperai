import { removeBackground } from '@imgly/background-removal';

/**
 * Removes the background locally in the browser using WebAssembly.
 * This is 100% free and client-side.
 * @param imageUrl The Data URL or Blob URL of the image
 * @returns A Data URL (base64) of the transparent PNG
 */
export const removeBackgroundClientSide = async (imageUrl: string): Promise<string> => {
  // Let the library use its default publicPath (unpkg CDN) which usually avoids CORS issues
  const imageBlob = await removeBackground(imageUrl);
  
  // Convert blob back to a data URL so we can use it in our UI easily
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });
};
