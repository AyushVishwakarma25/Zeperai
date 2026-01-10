
import { ReactNode } from "react";

export enum AppMode {
  Product = 'Product',
  Influencer = 'Influencer',
  Fashion = 'Fashion',
  AdCreative = 'AdCreative',
  Banner = 'Banner',
  Youtube = 'Youtube',
  Remix = 'Remix',
  Festival = 'Festival',
  Bulk = 'Bulk'
}

export enum AspectRatio {
  Square = '1:1',
  Portrait = '9:16',
  Landscape = '16:9',
  PortraitPost = '4:5',
  FashionShopify = '3:4'
}

export enum OutputFormat {
  JPG = 'jpg',
  PNG = 'png',
  WEBP = 'webp'
}

export enum ResolutionQuality {
  Standard = 'Standard',
  High = 'High'
}

export enum ProductCategory {
  Generic = 'Generic',
  Fashion = 'Fashion',
  FoodAndBeverage = 'Food & Beverage',
  Skincare = 'Skincare',
  Perfume = 'Perfume',
  HomeDecor = 'Home Decor',
  Tech = 'Tech',
  Herbal = 'Herbal',
  Fitness = 'Fitness'
}

export enum ModelGender {
  Female = 'Female',
  Male = 'Male'
}

export enum FashionGender {
  Women = 'Women',
  Men = 'Men',
  Kids = 'Kids',
  Unisex = 'Unisex'
}

export enum SkinTone {
  Light = 'Light',
  Medium = 'Medium',
  Dark = 'Dark',
  Deep = 'Deep'
}

export enum ClothingType {
  Casual = 'Casual',
  Formal = 'Formal',
  Athleisure = 'Athleisure',
  Traditional = 'Traditional',
  AISuggested = 'AI Suggested'
}

export enum FashionShootType {
  ModelShoot = 'Model Shoot',
  GhostMannequin = 'Ghost Mannequin',
  FlatLay = 'Flat Lay'
}

export enum FashionBodyType {
  Regular = 'Regular',
  PlusSize = 'Plus Size',
  Petite = 'Petite',
  Athletic = 'Athletic'
}

export enum FashionAgeBracket {
  YoungAdult = 'Young Adult',
  Adult = 'Adult',
  Mature = 'Mature'
}

export enum RegionalStyle {
  None = 'None',
  Indian = 'Indian',
  Western = 'Western',
  EastAsian = 'East Asian',
  MiddleEastern = 'Middle Eastern'
}

export enum MarketplacePreset {
  None = 'None',
  Amazon = 'Amazon',
  Shopify = 'Shopify',
  Flipkart = 'Flipkart'
}

export enum AdLayout {
  TextRightImageLeft = 'Text Right, Image Left',
  TextLeftImageRight = 'Text Left, Image Right',
  TextTopBottomImageCenter = 'Text Top/Bottom, Image Center',
  ProductShowcase = 'Product Showcase',
  // Comparison Layouts
  ComparisonSplit = 'Split Layout (Side-by-Side)',
  ComparisonOverlay = 'Overlay Layout (Better Choice)',
  ComparisonTable = 'Table Layout (Infographic)'
}

export enum CaptionTone {
  Playful = 'Playful',
  Professional = 'Professional',
  Witty = 'Witty',
  Bold = 'Bold',
  Luxury = 'Luxury',
  Friendly = 'Friendly',
  Urgent = 'Urgent',
  Inspirational = 'Inspirational',
  Serious = 'Serious'
}

export enum RewriteAction {
  Shorter = 'Shorter',
  Humor = 'Humor',
  Luxury = 'Luxury',
  Simplify = 'Simplify'
}

export enum View {
  Dashboard = 'Dashboard',
  MyDesigns = 'MyDesigns',
  Profile = 'Profile',
  Inspiration = 'Inspiration',
  Analytics = 'Analytics',
  ShopifyAnalytics = 'ShopifyAnalytics'
}

export type ModelChoice = 'new' | 'existing';

export enum OutfitChoice {
  AI = 'generated',
  Reference = 'reference'
}

export enum StylePreset {
  AISuggested = 'AI Suggested'
}

export type ModelPersona = string;

export interface StoryboardScene {
    description: string;
    cameraAngle: string;
}

export interface GenerateImageParams {
  appMode: AppMode;
  productDescription: string;
  aspectRatios: AspectRatio[];
  outputFormat: OutputFormat;
  resolutionQuality: ResolutionQuality;
  
  // Fashion Studio Extensions
  fashionGender?: FashionGender;
  fashionShootType?: FashionShootType;
  fashionCategory?: string;
  fashionSubCategory?: string;
  fashionBodyType?: FashionBodyType;
  fashionAgeBracket?: FashionAgeBracket;
  regionalStyle?: RegionalStyle;
  modelLockId?: string;

  // Marketplace & Fashion Extensions
  marketplacePreset?: MarketplacePreset;
  batchSize?: number;
  hyperRealism?: boolean;

  // Product mode
  frontProductImage?: File;
  bulkImages?: File[]; 
  backProductImage?: File;
  selectedAngles: string[];
  productStylePreset?: string;
  productStylePresets?: string[]; // Multi-select presets
  festivalStyle?: string;
  backdropAndProps?: string;
  textPlacementSuggestion?: string;
  overlayText?: string;
  fontStyle?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderlined?: boolean;

  // Influencer mode
  productCategory: ProductCategory;
  detectedCategory?: ProductCategory;
  modelChoice?: ModelChoice;
  customAvatarImage?: File;
  modelGender?: ModelGender;
  modelPersona?: string;
  skinTone?: SkinTone;
  clothingType?: ClothingType;
  outfitChoice?: OutfitChoice;
  outfitReferenceImage?: File;
  stylePreset?: StylePreset;
  customStyleConcept?: string;
  poseSuggestion?: string;
  backgroundStyle?: string;
  ugcStyle?: string; // NEW: UGC Style Preset
  storyboardSourceImageUrl?: string;
  storyboardScenes?: StoryboardScene[];
  modelSourceOption?: 'new' | 'existing';
  modelSeedId?: string;

  // Ad Creative mode
  logoImage?: File;
  adTitle?: string;
  adSubheading?: string;
  adFeatures?: string;
  adCta?: string;
  adAvailability?: string;
  adLayout?: AdLayout;
  adStylePreset?: string;
  
  // Comparison Ad Extensions
  isComparisonMode?: boolean;
  competitorImage?: File;
  productAFeatures?: string;
  productBFeatures?: string;

  // Remix mode
  remixReferenceImage?: File;
  remixReferenceImageUrl?: string; // Fallback URL if File creation fails (CORS)
  remixProductImage?: File;
}

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  caption: string;
  hashtags: string;
  aspectRatio: string;
  params?: GenerateImageParams;
  sourceProductImageUrl?: string;
  timestamp: number;
}

export interface SavedModel {
  id: string;
  name: string;
  thumbnail_url: string;
  user_id: string;
  created_at?: string;
}

export interface BrandKit {
  id?: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fonts: string;
  voice: string;
  description: string;
  negativeConstraints?: string;
  logoUrl?: string;
  updatedAt?: number;
}

export interface EditImageParams {
  originalImageUrl: string;
  maskDataUrl: string;
  prompt: string;
  replacementImage?: File | null;
}

export interface GenerateCaptionParams {
  imageUrl: string;
  existingCaption?: string;
  tone?: CaptionTone | string;
  length?: 'Short' | 'Medium' | 'Long';
  platform?: string;
  language?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
}

export interface InspirationItem {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  appMode: AppMode;
  isRemixable?: boolean;
  badge?: string;
  remixParams: Partial<GenerateImageParams>;
}

export interface UserActivity {
    id: string;
    user: string;
    action: string;
    imageUrl: string;
    timestamp: number;
}

export interface AdCopy {
    headline: string;
    body: string;
    cta: string;
    hashtags?: string;
}

export interface GenerateAdCopyParams {
    productDescription: string;
    tone: string;
    platform: string;
    count: number;
}

export interface CopyVariation {
    headline: string;
    body: string;
    cta: string;
    hashtags?: string;
    isRewriting?: boolean;
}

export interface GenerateContentParams {
    context: string;
    platform: string;
    goal: string;
    style: string;
    tone: string;
    language: string;
    length: 'Short' | 'Medium' | 'Long';
    includeHashtags: boolean;
    includeEmojis: boolean;
    keywords: string;
}

export interface RewriteCopyParams {
    copy: {
        headline: string;
        body: string;
        cta: string;
        hashtags?: string;
    };
    action: RewriteAction;
}

export interface MoodBoard {
    concept: string;
    colors: { name?: string; hex: string }[];
    styles: string[];
    tones: string[];
}

export interface BrandAnalysis {
    colors: { name?: string; hex: string }[];
    typography: string;
    vibe: string[];
}

export interface BrandGuidelines extends BrandAnalysis {}

export interface ABTestSuggestion {
    title: string;
    description: string;
    hypothesis: string;
}

export interface ProProductStyleCategory {
    category: string;
    presets: { name: string; prompt: string }[];
}

export interface ShopifyAnalysisResult {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    // FIX: Allow revenue to be a string to match potential AI output before sanitization.
    topProducts: { name: string; revenue: number | string; quantity: number }[];
    salesTrend: { date: string; revenue: number | string }[];
    productZones: {
        green: ProductZoneItem[];
        yellow: ProductZoneItem[];
        red: ProductZoneItem[];
    };
    aiInsights: string[];
}

export interface ProductZoneItem {
    name: string;
    sku?: string;
    // FIX: Allow revenue to be a string to match potential AI output before sanitization.
    revenue: number | string;
    quantity: number;
    margin?: number;
}
