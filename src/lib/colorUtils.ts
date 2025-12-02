
/**
 * Extracts dominant colors from an image URL using the Canvas API.
 * @param imageUrl The URL of the image to analyze
 * @param maxColors The maximum number of colors to return (default: 5)
 * @returns Array of hex color strings
 */
export async function extractDominantColors(imageUrl: string, maxColors: number = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Resize for faster processing
            const width = 100;
            const height = (img.height / img.width) * width;
            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);

            try {
                const imageData = ctx.getImageData(0, 0, width, height).data;
                const colorCounts: Record<string, number> = {};
                const quantization = 5; // Group similar colors

                for (let i = 0; i < imageData.length; i += 4) {
                    const r = Math.floor(imageData[i] / quantization) * quantization;
                    const g = Math.floor(imageData[i + 1] / quantization) * quantization;
                    const b = Math.floor(imageData[i + 2] / quantization) * quantization;
                    const a = imageData[i + 3];

                    // Skip transparent or very white/black pixels if desired
                    if (a < 128) continue;

                    // Filter out very white and very black for better "theme" colors
                    if (r > 240 && g > 240 && b > 240) continue;
                    if (r < 15 && g < 15 && b < 15) continue;

                    const hex = rgbToHex(r, g, b);
                    colorCounts[hex] = (colorCounts[hex] || 0) + 1;
                }

                const sortedColors = Object.entries(colorCounts)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .map(([color]) => color)
                    .slice(0, maxColors);

                resolve(sortedColors);
            } catch (e) {
                reject(e);
            }
        };

        img.onerror = (e) => reject(e);
    });
}

/**
 * Converts RGB components to Hex string
 */
function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calculates the relative luminance of a color
 */
function getLuminance(hex: string): number {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determines if text should be black or white based on background color
 */
export function getContrastColor(hex: string): 'black' | 'white' {
    return getLuminance(hex) > 0.5 ? 'black' : 'white';
}

/**
 * Lightens or darkens a color
 * @param hex The hex color
 * @param percent Positive to lighten, negative to darken (e.g., 20 for 20%)
 */
export function adjustColorBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * Converts hex color to RGB string "r, g, b" for CSS variables
 */
export function hexToRgbString(hex: string): string {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}
