// googleFonts.ts
// Curated set spanning the styles these 8 templates need (bold display,
// clean sans for body text, one serif/script for the luxury template).
// Extend freely — any valid Google Fonts family name works with loadGoogleFont().

export interface GoogleFontOption {
    family: string;
    category: 'sans' | 'serif' | 'display' | 'script';
    weights: number[];
}

export const GOOGLE_FONT_LIBRARY: GoogleFontOption[] = [
    // SANS-SERIF
    { family: 'Inter', category: 'sans', weights: [400, 500, 600, 700, 800] },
    { family: 'Poppins', category: 'sans', weights: [400, 500, 600, 700, 800] },
    { family: 'Montserrat', category: 'sans', weights: [400, 500, 700, 800, 900] },
    { family: 'Roboto', category: 'sans', weights: [400, 500, 700, 900] },
    { family: 'Open Sans', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Lato', category: 'sans', weights: [400, 700, 900] },
    { family: 'Oswald', category: 'sans', weights: [400, 600, 700] },
    { family: 'Raleway', category: 'sans', weights: [400, 600, 700, 800, 900] },
    { family: 'Nunito', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Rubik', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Outfit', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Plus Jakarta Sans', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Space Grotesk', category: 'sans', weights: [400, 600, 700] },
    { family: 'DM Sans', category: 'sans', weights: [400, 500, 700] },
    { family: 'Work Sans', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Syne', category: 'sans', weights: [400, 700, 800] },
    { family: 'Quicksand', category: 'sans', weights: [400, 600, 700] },
    { family: 'Urbanist', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Sora', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Manrope', category: 'sans', weights: [400, 600, 800] },
    { family: 'Barlow', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Ubuntu', category: 'sans', weights: [400, 500, 700] },
    { family: 'Noto Sans', category: 'sans', weights: [400, 600, 700] },
    { family: 'Kanit', category: 'sans', weights: [400, 600, 700, 800] },
    { family: 'Fira Sans', category: 'sans', weights: [400, 600, 700, 800] },

    // SERIF
    { family: 'Playfair Display', category: 'serif', weights: [400, 700, 800, 900] },
    { family: 'Merriweather', category: 'serif', weights: [400, 700, 900] },
    { family: 'Lora', category: 'serif', weights: [400, 600, 700] },
    { family: 'PT Serif', category: 'serif', weights: [400, 700] },
    { family: 'Cormorant Garamond', category: 'serif', weights: [400, 600, 700] },
    { family: 'DM Serif Display', category: 'serif', weights: [400] },
    { family: 'Cinzel', category: 'serif', weights: [400, 700, 800, 900] },
    { family: 'Bodoni Moda', category: 'serif', weights: [400, 700, 800, 900] },
    { family: 'Prata', category: 'serif', weights: [400] },
    { family: 'Spectral', category: 'serif', weights: [400, 600, 700] },
    { family: 'Libre Baskerville', category: 'serif', weights: [400, 700] },
    { family: 'EB Garamond', category: 'serif', weights: [400, 600, 700, 800] },

    // DISPLAY
    { family: 'Archivo Black', category: 'display', weights: [400] },
    { family: 'Anton', category: 'display', weights: [400] },
    { family: 'Bebas Neue', category: 'display', weights: [400] },
    { family: 'Baloo 2', category: 'display', weights: [500, 700, 800] },
    { family: 'Fredoka', category: 'display', weights: [400, 600, 700] },
    { family: 'Righteous', category: 'display', weights: [400] },
    { family: 'Lobster', category: 'display', weights: [400] },
    { family: 'Bungee', category: 'display', weights: [400] },
    { family: 'Permanent Marker', category: 'display', weights: [400] },

    // SCRIPT / HANDWRITING
    { family: 'Caveat', category: 'script', weights: [400, 600, 700] },
    { family: 'Great Vibes', category: 'script', weights: [400] },
    { family: 'Sacramento', category: 'script', weights: [400] },
    { family: 'Dancing Script', category: 'script', weights: [400, 600, 700] },
    { family: 'Pacifico', category: 'script', weights: [400] },
    { family: 'Satisfy', category: 'script', weights: [400] },
    { family: 'Yellowtail', category: 'script', weights: [400] },
];

const loadedFonts = new Set<string>();

/**
 * Injects a Google Fonts <link> for the given family the first time it's
 * used, so newly-selected fonts render immediately in the layer overlay.
 */
export function loadGoogleFont(family: string, weights: number[] = [400, 700]) {
    const key = `${family}:${weights.join(',')}`;
    if (loadedFonts.has(key)) return;
    loadedFonts.add(key);

    const formattedFamily = family.replace(/\s+/g, '+');
    const weightParam = weights.join(';');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFamily}:wght@${weightParam}&display=swap`;
    document.head.appendChild(link);
}

/** Preload every font in the library up front (call once, e.g. in AdCreativeControls mount) so the font picker previews render without flicker. */
export function preloadAllTemplateFonts() {
    GOOGLE_FONT_LIBRARY.forEach(f => loadGoogleFont(f.family, f.weights));
}
