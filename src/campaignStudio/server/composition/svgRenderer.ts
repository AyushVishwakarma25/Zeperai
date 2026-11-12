/**
 * CAMPAIGN STUDIO V2 - Deterministic SVG Typography & Graphic Renderer.
 *
 * Converts a structured CreativeDocument into high-resolution, standards-compliant,
 * standalone SVG advertising creatives with Google Fonts, realistic shadows,
 * vector badges, and word-wrapped text.
 */

import type { CreativeDocument, CreativeLayer } from '../../types.js';
import {
  measureTextLayout,
  measureTextWidth,
  normalizeFontWeight,
  resolveFontCategory,
  type TextLayoutResult,
} from './textMeasurer.js';

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Splits text into lines that fit within a specified pixel width using calibrated glyph metrics.
 */
export function wrapText(
  text: string,
  maxWidthPx: number,
  fontSizePx: number,
  fontFamily: string = 'Poppins',
  fontWeight: number | string = 700,
): string[] {
  if (!text) return [];
  const layout = measureTextLayout(text, {
    fontFamily,
    fontWeight,
    fontSize: fontSizePx,
    maxWidthPx,
  });
  return layout.lines;
}

/**
 * Renders a CreativeDocument into a complete standalone SVG document.
 */
export function renderCreativeDocumentToSvg(doc: CreativeDocument): string {
  const { width, height } = doc.canvas;

  // Collect Google Fonts used in the layers
  const fonts = new Set<string>();
  fonts.add('Poppins');
  fonts.add('Inter');

  for (const layer of doc.layers) {
    const f = layer.styles?.fontFamily as string | undefined;
    if (f) fonts.add(f);
  }

  const fontFamiliesQuery = Array.from(fonts)
    .map((name) => `family=${encodeURIComponent(name)}:wght@400;500;600;700;800;900`)
    .join('&');

  const sortedLayers = [...doc.layers]
    .filter((l) => l.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  const layerSvgChunks = sortedLayers.map((layer) => renderLayer(layer, width, height));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style><![CDATA[
      @import url('https://fonts.googleapis.com/css2?${fontFamiliesQuery}&display=swap');
      @font-face {
        font-family: 'Poppins';
        src: local('Poppins'), local('Poppins-Regular'), local('Segoe UI'), local('Roboto');
      }
      @font-face {
        font-family: 'Inter';
        src: local('Inter'), local('Inter-Regular'), local('Segoe UI'), local('Helvetica Neue');
      }
      @font-face {
        font-family: 'Playfair Display';
        src: local('Playfair Display'), local('PlayfairDisplay-Regular'), local('Georgia'), local('Times New Roman');
      }
      text {
        user-select: none;
        font-feature-settings: "kern" 1, "liga" 1;
        -webkit-font-smoothing: antialiased;
      }
    ]]></style>
    <!-- Realistic Product Ground Cast Shadow Filter -->
    <filter id="product-ground-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
    </filter>
    <!-- Crisp Typography Contrast Shadow -->
    <filter id="text-glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.65" />
    </filter>
    <!-- Subtle Button Drop Shadow -->
    <filter id="button-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Layers Root -->
  <g id="creative-root">
${layerSvgChunks.join('\n\n')}
  </g>
</svg>`;
}

function renderLayer(layer: CreativeLayer, canvasW: number, canvasH: number): string {
  const x = Math.round(layer.position.x * canvasW);
  const y = Math.round(layer.position.y * canvasH);
  const w = Math.round(layer.position.width * canvasW);
  const h = Math.round(layer.position.height * canvasH);

  switch (layer.type) {
    case 'background':
      return renderBackgroundLayer(layer, canvasW, canvasH);
    case 'product':
      return renderProductLayer(layer, x, y, w, h);
    case 'image':
      return renderImageLayer(layer, x, y, w, h);
    case 'badge':
    case 'cta':
      return renderPillLayer(layer, x, y, w, h);
    case 'shape':
      return renderShapeLayer(layer, x, y, w, h);
    case 'text':
      return renderTextLayer(layer, x, y, w, h);
    case 'divider':
      return renderDividerLayer(layer, x, y, w, h);
    case 'logo':
      return renderLogoLayer(layer, x, y, w, h);
    default:
      return `<!-- Unknown layer type: ${layer.type} -->`;
  }
}

function renderBackgroundLayer(layer: CreativeLayer, canvasW: number, canvasH: number): string {
  const bgImg = (layer.styles.backgroundImage as string) || (layer.content as string) || '';
  const bgColor = (layer.styles.backgroundColor as string) || '#0A0A0A';
  const overlayScrim = (layer.styles.overlayScrim as string) || 'rgba(0,0,0,0.25)';

  if (bgImg) {
    return `    <!-- Layer: Background (Image) -->
    <g id="${escapeXml(layer.id)}">
      <rect width="${canvasW}" height="${canvasH}" fill="${escapeXml(bgColor)}" />
      <image href="${escapeXml(bgImg)}" width="${canvasW}" height="${canvasH}" preserveAspectRatio="xMidYMid slice" />
      <rect width="${canvasW}" height="${canvasH}" fill="${escapeXml(overlayScrim)}" />
    </g>`;
  }

  // Pure gradient / solid background
  const gradient = layer.styles.gradient as { from: string; to: string } | undefined;
  if (gradient) {
    const gradId = `grad-${layer.id}`;
    return `    <!-- Layer: Background (Gradient) -->
    <g id="${escapeXml(layer.id)}">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${escapeXml(gradient.from)}" />
          <stop offset="100%" stop-color="${escapeXml(gradient.to)}" />
        </linearGradient>
      </defs>
      <rect width="${canvasW}" height="${canvasH}" fill="url(#${gradId})" />
    </g>`;
  }

  return `    <!-- Layer: Background (Solid) -->
    <g id="${escapeXml(layer.id)}">
      <rect width="${canvasW}" height="${canvasH}" fill="${escapeXml(bgColor)}" />
    </g>`;
}

function renderProductLayer(layer: CreativeLayer, x: number, y: number, w: number, h: number): string {
  const imgUrl = (layer.content as string) || (layer.styles.imageUrl as string) || '';
  const cx = x + Math.round(w / 2);
  const cy = y + h - Math.round(h * 0.08);
  const rx = Math.round(w * 0.42);
  const ry = Math.round(h * 0.08);

  return `    <!-- Layer: Product Anchor & Ground Shadow -->
    <g id="${escapeXml(layer.id)}">
      <!-- Grounded Contact & Cast Ambient Shadow -->
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,0.48)" filter="url(#product-ground-shadow)" />
      <!-- Product Cutout -->
      <image href="${escapeXml(imgUrl)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" />
    </g>`;
}

function renderImageLayer(layer: CreativeLayer, x: number, y: number, w: number, h: number): string {
  const imgUrl = (layer.content as string) || (layer.styles.imageUrl as string) || '';
  const opacity = (layer.styles.opacity as number) ?? 1;

  return `    <!-- Layer: Image Graphic (${escapeXml(layer.name)}) -->
    <g id="${escapeXml(layer.id)}" opacity="${opacity}">
      <image href="${escapeXml(imgUrl)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" />
    </g>`;
}

function parseNumericStyle(val: unknown, fallback: number): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function renderPillLayer(layer: CreativeLayer, x: number, y: number, w: number, h: number): string {
  const bg = (layer.styles.backgroundColor as string) || '#F59E0B';
  const textColor = (layer.styles.textColor as string) || '#FFFFFF';
  const radius = parseNumericStyle(layer.styles.borderRadius, layer.type === 'badge' ? 999 : 12);
  const borderColor = (layer.styles.borderColor as string) || 'none';
  const borderWidth = borderColor !== 'none' ? parseNumericStyle(layer.styles.borderWidth, 1.5) : 0;
  const text = layer.content || '';
  const fontFamily = (layer.styles.fontFamily as string) || 'Poppins';
  const fontWeight = (layer.styles.fontWeight as number | string) || (layer.type === 'badge' ? 700 : 800);
  const fontSize = Math.max(14, parseNumericStyle(layer.styles.fontSize, Math.round(h * 0.45)));
  const isUppercase = layer.styles.textTransform === 'uppercase' || layer.type === 'cta';

  const strokeAttr = borderColor !== 'none' ? `stroke="${escapeXml(borderColor)}" stroke-width="${borderWidth}"` : '';
  const displayText = isUppercase ? text.toUpperCase() : text;

  // Exact glyph measurement: prevent CTA and badge text truncation
  const measuredWidth = measureTextWidth(displayText, {
    fontFamily,
    fontWeight,
    fontSize,
    letterSpacing: 0.5,
  });

  const minPadding = layer.type === 'badge' ? 24 : 36;
  const neededWidth = Math.round(measuredWidth + minPadding);
  const actualW = Math.max(w, neededWidth);
  const actualX = actualW > w ? Math.max(0, x - Math.round((actualW - w) / 2)) : x;

  const textX = actualX + Math.round(actualW / 2);
  const textY = y + Math.round(h / 2) + Math.round(fontSize * 0.35);

  return `    <!-- Layer: ${layer.type === 'badge' ? 'Badge' : 'CTA Button'} (${escapeXml(layer.name)}) -->
    <g id="${escapeXml(layer.id)}" filter="url(#button-shadow)">
      <rect x="${actualX}" y="${y}" width="${actualW}" height="${h}" rx="${radius}" fill="${escapeXml(bg)}" ${strokeAttr} />
      <text x="${textX}" y="${textY}" text-anchor="middle" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${escapeXml(textColor)}" letter-spacing="0.5">
        ${escapeXml(displayText)}
      </text>
    </g>`;
}

function renderShapeLayer(layer: CreativeLayer, x: number, y: number, w: number, h: number): string {
  const fill = (layer.styles.backgroundColor as string) || 'rgba(255,255,255,0.08)';
  const radius = parseNumericStyle(layer.styles.borderRadius, 16);
  const opacity = parseNumericStyle(layer.styles.opacity, 1);

  return `    <!-- Layer: Accent Shape (${escapeXml(layer.name)}) -->
    <g id="${escapeXml(layer.id)}" opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${escapeXml(fill)}" />
    </g>`;
}

function renderTextLayer(layer: CreativeLayer, x: number, y: number, w: number, h: number): string {
  const text = layer.content || '';
  if (!text) return `<!-- Empty text layer ${layer.id} -->`;

  const fontFamily = (layer.styles.fontFamily as string) || 'Poppins';
  const fontWeight = (layer.styles.fontWeight as number | string) || 700;
  const color = (layer.styles.color as string) || '#FFFFFF';
  const align = (layer.styles.alignment as string) || 'left';
  const fontSize = Math.max(16, parseNumericStyle(layer.styles.fontSize, Math.round(h * 0.35)));
  const isUppercase = layer.styles.textTransform === 'uppercase';
  const letterSpacing = parseNumericStyle(layer.styles.letterSpacing, -0.2);

  const layout = measureTextLayout(text, {
    fontFamily,
    fontWeight,
    fontSize,
    letterSpacing,
    maxWidthPx: w,
    maxHeightPx: h,
    textTransform: isUppercase ? 'uppercase' : 'none',
  });

  const lineHeight = layout.lineHeight;
  const lines = layout.lines;

  let anchor = 'start';
  let textX = x;
  if (align === 'center') {
    anchor = 'middle';
    textX = x + Math.round(w / 2);
  } else if (align === 'right') {
    anchor = 'end';
    textX = x + w;
  }

  const startY = y + fontSize;
  const tspans = lines.map((line, idx) => {
    const dy = idx === 0 ? 0 : lineHeight;
    return `<tspan x="${textX}" dy="${dy}">${escapeXml(line)}</tspan>`;
  });

  const warningComment = layout.warnings.length > 0
    ? `\n      <!-- Typography warnings: ${layout.warnings.map(escapeXml).join('; ')} -->`
    : '';

  return `    <!-- Layer: Text (${escapeXml(layer.name)})${warningComment} -->
    <g id="${escapeXml(layer.id)}" filter="url(#text-glow-shadow)">
      <text x="${textX}" y="${startY}" text-anchor="${anchor}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${escapeXml(color)}" letter-spacing="${letterSpacing}">
        ${tspans.join('\n        ')}
      </text>
    </g>`;
}

function renderDividerLayer(layer: CreativeLayer, x: number, y: number, w: number, h: number): string {
  const color = (layer.styles.color as string) || 'rgba(255,255,255,0.2)';
  const strokeWidth = (layer.styles.strokeWidth as number) || 1;

  return `    <!-- Layer: Divider (${escapeXml(layer.name)}) -->
    <g id="${escapeXml(layer.id)}">
      <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${escapeXml(color)}" stroke-width="${strokeWidth}" />
    </g>`;
}

function renderLogoLayer(layer: CreativeLayer, x: number, y: number, w: number, h: number): string {
  const logoUrl = (layer.styles.imageUrl as string) || '';
  const text = layer.content || 'BRAND';
  const fontFamily = (layer.styles.fontFamily as string) || 'Poppins';
  const color = (layer.styles.color as string) || '#FFFFFF';

  if (logoUrl) {
    return `    <!-- Layer: Logo (Image) -->
    <g id="${escapeXml(layer.id)}">
      <image href="${escapeXml(logoUrl)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" />
    </g>`;
  }

  const fontSize = Math.max(14, Math.round(h * 0.7));
  const textY = y + Math.round(h * 0.75);

  return `    <!-- Layer: Logo (Wordmark) -->
    <g id="${escapeXml(layer.id)}" filter="url(#text-glow-shadow)">
      <text x="${x}" y="${textY}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="900" fill="${escapeXml(color)}" letter-spacing="1">
        ${escapeXml(text.toUpperCase())}
      </text>
    </g>`;
}

/**
 * Converts an SVG string into a valid standalone data URL.
 */
export function svgToDataUri(svg: string): string {
  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Validates text-fit and typography constraints across all layers of a CreativeDocument.
 * Returns structured warnings rather than silently shrinking all elements.
 */
export function validateCreativeDocumentTypography(doc: CreativeDocument): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const { width, height } = doc.canvas;

  for (const layer of doc.layers) {
    if (layer.visible === false) continue;
    const w = Math.round(layer.position.width * width);
    const h = Math.round(layer.position.height * height);

    if (layer.type === 'text') {
      const text = layer.content || '';
      const fontFamily = (layer.styles.fontFamily as string) || 'Poppins';
      const fontWeight = (layer.styles.fontWeight as number | string) || 700;
      const fontSize = Math.max(16, parseNumericStyle(layer.styles.fontSize, Math.round(h * 0.35)));
      const layout = measureTextLayout(text, {
        fontFamily,
        fontWeight,
        fontSize,
        maxWidthPx: w,
        maxHeightPx: h,
        textTransform: layer.styles.textTransform === 'uppercase' ? 'uppercase' : 'none',
      });
      for (const warning of layout.warnings) {
        warnings.push(`Layer "${layer.name || layer.id}": ${warning}`);
      }
    } else if (layer.type === 'cta' || layer.type === 'badge') {
      const text = layer.content || '';
      const fontFamily = (layer.styles.fontFamily as string) || 'Poppins';
      const fontWeight = (layer.styles.fontWeight as number | string) || 800;
      const fontSize = Math.max(14, parseNumericStyle(layer.styles.fontSize, Math.round(h * 0.45)));
      const textWidth = measureTextWidth(text, { fontFamily, fontWeight, fontSize, letterSpacing: 0.5 });
      const minPadding = layer.type === 'badge' ? 24 : 36;
      if (textWidth + minPadding > w * 1.5) {
        warnings.push(`Pill "${layer.name || layer.id}": text width (${Math.round(textWidth)}px) significantly exceeds base container width (${w}px).`);
      }
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

