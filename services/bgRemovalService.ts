import { removeBackground } from "@imgly/background-removal";

export async function removeBackgroundClientSide(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const resultBlob = await removeBackground(blob, {
            progress: (key: string, current: number, total: number) => {
                console.log(`Background removal progress: ${key} ${current}/${total}`);
            }
        });
        
        return URL.createObjectURL(resultBlob);
    } catch (error) {
        console.error("Error removing background on client side:", error);
        throw error;
    }
}
