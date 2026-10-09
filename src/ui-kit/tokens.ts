/**
 * Universal Design System & UI Kit Tokens (ZeperAI)
 * Single source of truth for all typography, colors, radii, and component variants.
 * Edit values here to update the entire application.
 */

export const typography = {
  fonts: {
    /** Primary Headings (H1, H2): Satoshi Bold / Black, tight letter-spacing (-0.02em) */
    heading: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
    /** Subheadings & Buttons: Satoshi Medium / Medium Italic */
    subheading: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
    button: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
    action: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
    nav: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
    /** App UI & Data Tables: DM Sans Regular / Medium */
    ui: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    data: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    table: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    /** Long-form Body Text: DM Sans Regular, standard line-height (1.5 - 1.6) */
    body: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  classes: {
    h1: "font-satoshi font-bold md:font-black tracking-[-0.02em] leading-[1.08]",
    h2: "font-satoshi font-bold md:font-black tracking-[-0.02em] leading-[1.15]",
    h3: "font-satoshi font-bold tracking-[-0.02em] leading-snug",
    subheading: "font-satoshi font-medium text-[#5F6673] tracking-normal",
    button: "font-satoshi font-medium tracking-normal",
    action: "font-satoshi font-medium tracking-normal",
    navLink: "font-satoshi font-medium tracking-normal text-[#5F6673] hover:text-[#080B12] transition-colors",
    body: "font-dmsans font-normal text-[#5F6673] leading-[1.55]",
    bodyLarge: "font-dmsans font-normal text-[#5F6673] text-lg leading-[1.55]",
    ui: "font-dmsans font-normal md:font-medium text-[#080B12]",
    data: "font-dmsans font-medium text-[#080B12] tabular-nums",
    tableHead: "font-dmsans font-medium text-xs uppercase tracking-wider text-[#5F6673]",
    tableCell: "font-dmsans font-normal text-sm text-[#080B12]",
  },
  letterSpacing: {
    heading: "-0.02em",
    normal: "0em",
    wide: "0.05em",
  },
  lineHeight: {
    heading: "1.08",
    body: "1.55",
    bodyRelaxed: "1.6",
  },
} as const;

export const colors = {
  primary: {
    DEFAULT: "#3155FF",
    hover: "#2643E0",
    light: "#EEF2FF",
    glow: "rgba(49, 85, 255, 0.15)",
  },
  // Master Redesign Sophisticated Neutral-First Palette
  theme: {
    bg: "#F7F7F5",
    surface: "#FFFFFF",
    dark: "#0B0B0F",
    border: "#E8E8E5",
    textPrimary: "#0B0B0F",
    textSecondary: "#6B6B73",
    textMuted: "#8F96A3",
    accent: "#3155FF",
    accentHover: "#2643E0",
  },
  navy: {
    dark: "#0B0B0F",
    surface: "#14141A",
    border: "#1E2749",
  },
  text: {
    primary: "#0B0B0F",
    secondary: "#6B6B73",
    muted: "#8F96A3",
    white: "#FFFFFF",
  },
  border: {
    light: "#E8E8E5",
    subtle: "#F1F2F4",
    dark: "#1E2749",
  },
  background: {
    main: "#F7F7F5",
    card: "#FFFFFF",
    dark: "#0B0B0F",
  },
  accent: {
    yellow: "#FFC928",
    green: "#10B981",
    red: "#EF4444",
  },
} as const;

export const radii = {
  button: "rounded-xl",
  card: "rounded-2xl",
  badge: "rounded-full",
  input: "rounded-xl",
} as const;

export const shadows = {
  card: "shadow-xs border border-[#E5E7EB]",
  elevated: "shadow-md hover:shadow-xl transition-all duration-300",
  primaryGlow: "0 0 16px 2px rgba(49, 85, 255, 0.35)",
} as const;
