
export enum AppMode {
  Influencer = 'Influencer',
  Product = 'Product',
  Fashion = 'Fashion',
  AdCreative = 'Ad Creative',
  Banner = 'Banner',
  Youtube = 'Youtube',
  Festival = 'Festival',
  Remix = 'Remix',
  Bulk = 'Bulk',
}

export enum ResolutionQuality {
  Standard = 'Standard',
  High = 'High',
}

export enum ProductCategory {
  Generic = 'Generic',
  Skincare = 'Skincare',
  FoodAndBeverage = 'Food & Bev',
  Perfume = 'Perfume',
  Herbal = 'Herbal',
  Tech = 'Tech',
  Fashion = 'Fashion',
  HomeDecor = 'Home Decor',
  Fitness = 'Fitness',
}

export enum View {
  Dashboard = 'Dashboard',
  MyDesigns = 'MyDesigns',
  Profile = 'Profile',
  Analytics = 'Analytics',
  ShopifyAnalytics = 'ShopifyAnalytics',
  Inspiration = 'Inspiration',
}

export enum AspectRatio {
  Portrait = '9:16',
  PortraitPost = '4:5',
  Square = '1:1',
  Landscape = '16:9',
  FashionShopify = '2:3',
}

export enum OutputFormat {
  JPG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
}

export enum AdLayout {
  TextRightImageLeft = 'Text Right, Image Left',
  TextLeftImageRight = 'Text Left, Image Right',
  TextTopBottomImageCenter = 'Text Top/Bottom, Image Center',
  ProductShowcase = 'Product Showcase (Minimal Text)',
  ComparisonSplit = 'Split Screen Comparison',
  ComparisonOverlay = 'Overlay Comparison',
  ComparisonTable = 'Feature Table Comparison',
}

export enum ModelGender {
  Female = 'Female',
  Male = 'Male',
}

export enum SkinTone {
  Light = 'Light',
  Medium = 'Medium',
  Deep = 'Deep',
}

export enum ClothingType {
  AISuggested = 'AI Suggested',
  Traditional = 'Traditional',
  Casual = 'Casual',
  Formal = 'Formal',
}

export enum OutfitChoice {
  AI = 'AI',
  Custom = 'Custom'
}

export enum StylePreset {
  AISuggested = 'AI Suggested',
  Minimalist = 'Minimalist',
  Studio = 'Studio',
  Lifestyle = 'Lifestyle',
  Nature = 'Nature',
  Urban = 'Urban'
}

export enum MarketplacePreset {
  None = 'None',
  Amazon = 'Amazon',
  Shopify = 'Shopify',
  Flipkart = 'Flipkart',
}

export enum CaptionTone {
  Playful = 'Playful',
  Professional = 'Professional',
  Witty = 'Witty',
  Bold = 'Bold',
  Luxury = 'Luxury',
  Friendly = 'Friendly',
  Inspirational = 'Inspirational',
  Serious = 'Serious',
  Urgent = 'Urgent',
}

export enum FashionGender {
  Women = 'Women',
  Men = 'Men',
  Kids = 'Kids',
  Unisex = 'Unisex',
}

export enum FashionShootType {
  ModelShoot = 'Model Shoot',
  GhostMannequin = 'Ghost Mannequin',
}

export enum FashionBodyType {
  Regular = 'Regular',
  Plus = 'Plus Size',
  Petite = 'Petite',
  Muscular = 'Muscular',
  Slim = 'Slim',
}

export enum FashionAgeBracket {
  Adult = 'Adult',
  Teen = 'Teen',
  Child = 'Child',
  Senior = 'Senior',
}

export enum RegionalStyle {
  None = 'None',
  SouthIndian = 'South Indian',
  Punjabi = 'Punjabi',
  Gujarati = 'Gujarati',
  Bengali = 'Bengali',
  Goan = 'Goan',
}

export enum RewriteAction {
  Shorter = 'Shorter',
  Humor = 'Make it Funny',
  Luxury = 'Make it Luxury',
  Simplify = 'Simplify',
}

export type ModelPersona = string;

export interface GenerateImageParams {
  appMode: AppMode;
  productDescription: string;
  aspectRatios: AspectRatio[];
  outputFormat: OutputFormat;
  resolutionQuality: ResolutionQuality;
  selectedAngles: string[];
  productStylePreset: string;
  productStylePresets?: string[];
  backdropAndProps: string;
  textPlacementSuggestion: string;
  overlayText: string;
  fontStyle: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
  productCategory: ProductCategory;
  modelGender?: ModelGender;
  modelPersona?: string;
  skinTone?: SkinTone;
  clothingType?: ClothingType;
  outfitChoice?: OutfitChoice;
  stylePreset?: StylePreset;
  poseSuggestion?: string;
  backgroundStyle?: string;
  ugcStyle?: string;
  adLayout?: AdLayout;
  adTitle?: string;
  adSubheading?: string;
  adFeatures?: string;
  adCta?: string;
  adAvailability?: string;
  remixReferenceImage?: File;
  remixProductImage?: File;
  remixReferenceImageUrl?: string;
  modelSourceOption?: 'new' | 'existing';
  isComparisonMode?: boolean;
  productAFeatures?: string;
  productBFeatures?: string;
  frontProductImage?: File;
  bulkImages?: File[];
  logoImage?: File;
  customAvatarImage?: File;
  outfitReferenceImage?: File;
  detectedCategory?: ProductCategory;
  batchSize?: number;
  modelSeedId?: string;
  fashionGender?: FashionGender;
  fashionShootType?: FashionShootType;
  fashionCategory?: string;
  fashionSubCategory?: string;
  fashionBodyType?: FashionBodyType;
  fashionAgeBracket?: string;
  regionalStyle?: RegionalStyle;
  modelLockId?: string;
  hyperRealism?: boolean;
  festivalStyle?: string;
  festivalStylePresets?: string[];
  adStylePreset?: string;
  competitorImage?: File;
  marketplacePreset?: MarketplacePreset;
  storyboardScenes?: string[];
  fashionPose?: string[];
}

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string; // Optimized image for grid view
  caption: string;
  hashtags: string;
  aspectRatio: string;
  params: GenerateImageParams;
  sourceProductImageUrl?: string;
  timestamp: number;
}

export interface EditImageParams {
  originalImageUrl: string;
  maskDataUrl: string;
  prompt: string;
  replacementImage?: File | null;
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
  negativeConstraints: string;
  logoUrl?: string;
  updatedAt?: number;
}

export interface SavedModel {
  id: string;
  name: string;
  thumbnail_url: string;
  user_id?: string;
  created_at?: string;
}

export interface InspirationItem {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  appMode: AppMode;
  isRemixable: boolean;
  badge?: string;
  remixParams: Partial<GenerateImageParams>;
}

export interface GenerateCaptionParams {
  imageUrl: string;
  tone: CaptionTone;
  length: 'Short' | 'Medium' | 'Long';
  platform: 'Instagram' | 'YouTube' | 'TikTok' | 'Ad Copy';
  language: 'English' | 'Hindi' | 'Hinglish';
  includeHashtags: boolean;
  includeEmojis: boolean;
  existingCaption?: string;
}

export interface UserActivity {
  id: string;
  user: string;
  action: string;
  imageUrl: string;
  timestamp: number;
}

export interface GenerateAdCopyParams {
  productDescription: string;
  tone: string;
  platform: string;
  count: number;
}

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
  hashtags?: string;
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

export interface CopyVariation {
  headline: string;
  body: string;
  cta: string;
  hashtags?: string;
  isRewriting?: boolean;
}

export interface RewriteCopyParams {
  copy: { headline: string; body: string; cta: string; hashtags?: string };
  action: RewriteAction;
}

export interface ABTestSuggestion {
  title: string;
  description: string;
  hypothesis: string;
}

export interface BrandAnalysis {
  colors: { name?: string; hex: string }[];
  typography: string;
  vibe: string[];
}

export interface MoodBoard {
  concept: string;
  colors: { name?: string; hex: string }[];
  styles: string[];
  tones: string[];
}

export interface BrandGuidelines extends BrandAnalysis {}

export interface ProProductStyleCategory {
    category: string;
    presets: { name: string; prompt: string; thumbnail?: string }[];
}

export interface ShopifyAnalysisResult {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
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
    revenue: number | string;
    quantity: number;
    margin?: number;
}
