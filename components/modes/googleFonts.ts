export interface GoogleFont {
    family: string;
    weights: number[];
}

export const GOOGLE_FONT_LIBRARY: GoogleFont[] = [
    { family: 'Inter', weights: [400, 500, 600, 700] },
    { family: 'Montserrat', weights: [400, 600, 700, 800] },
    { family: 'Playfair Display', weights: [400, 600, 700] },
    { family: 'Plus Jakarta Sans', weights: [400, 600, 700, 800] },
    { family: 'Outfit', weights: [400, 600, 700] },
    { family: 'Space Grotesk', weights: [400, 600, 700] },
    { family: 'Cinzel', weights: [400, 600, 700] },
    { family: 'Fredoka', weights: [400, 600, 700] },
];

const loadedFonts = new Set<string>();

export function loadGoogleFont(family: string, weights: number[] = [400, 700]) {
    if (!family || loadedFonts.has(family)) return;
    
    try {
        const fontName = family.replace(/ /g, '+');
        const weightsStr = weights.join(';');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weightsStr}&display=swap`;
        document.head.appendChild(link);
        loadedFonts.add(family);
    } catch (e) {
        console.warn('Failed to load Google Font:', family, e);
    }
}
