
export enum AspectRatio {
  Portrait = '9:16', 
  PortraitPost = '4:5', 
  Square = '1:1', 
  Landscape = '16:9', 
  FashionShopify = '2:3', 
}

export enum MarketplacePreset {
  Amazon = 'Amazon',
  Shopify = 'Shopify',
  Flipkart = 'Flipkart',
  None = 'None'
}

export enum AppMode {
  Influencer = 'Influencer',
  Product = 'Product',
  AdCreative = 'AdCreative',
  Remix = 'Remix',
  Fashion = 'Fashion',
  Banner = 'Banner',
  Youtube = 'Youtube',
  Copywriter = 'Copywriter',
  Festival = 'Festival',
  Bulk = 'Bulk',
}

export enum FashionGender {
  Women = 'Women',
  Men = 'Men',
  Kids = 'Kids'
}

export enum FashionBodyType {
  Regular = 'Regular',
  Petite = 'Petite',
  PlusSize = 'Plus Size',
  Tall = 'Tall'
}

export enum FashionAgeBracket {
  Toddler = 'Toddler (2-4 yrs)',
  Child = 'Child (5-10 yrs)',
  Teen = 'Teen (11-16 yrs)'
}

export enum RegionalStyle {
  None = 'Standard/Modern',
  SouthIndian = 'South Indian (Temple/Silk)',
  Punjabi = 'Punjabi (Patiala/Vibrant)',
  Bengali = 'Bengali (Artistic/Traditional)',
  Maharashtrian = 'Maharashtrian (Nauvari Style)',
  Rajasthani = 'Rajasthani (Royal/Bandhani)'
}

export enum FashionShootType {
  FabricOnly = 'Fabric Only (AI Draping)',
  FullProduct = 'Full Product (Refine Scene)',
  ModelShoot = 'Model Shoot (Wear Product)',
  GhostMannequin = 'Ghost Mannequin (Apparel Only)',
  LifestyleScene = 'Lifestyle Scene (Contextual)',
}

export enum View {
  Dashboard = 'Dashboard',
  MyDesigns = 'MyDesigns',
  Profile = 'Profile',
  Inspiration = 'Inspiration',
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

export enum AdLayout {
  TextLeftImageRight = 'Text on Left, Image on Right',
  TextRightImageLeft = 'Text on Right, Image on Left',
  TextTopBottomImageCenter = 'Text on Top/Bottom, Image in Center',
  ProductShowcase = 'Product Showcase with Features',
  LifestyleAdShot = 'Lifestyle Ad Shot',
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
  AI = 'AI-Suggested',
  Reference = 'Upload Reference',
}

export enum ModelChoice {
  AI = 'AI-Generated Model',
  Custom = 'Use Custom Avatar',
}

export enum StylePreset {
  AISuggested = 'AI Suggested',
  Minimal = 'Minimal',
  Luxury = 'Luxury',
  Bold = 'Bold',
  Playful = 'Playful',
  Techy = 'Techy',
  Editorial = 'Editorial',
  Lifestyle = 'Lifestyle',
}

export enum OutputFormat {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp',
}

export enum CaptionTone {
    Playful = 'Playful',
    Catchy = 'Catchy',
    Persuasive = 'Persuasive',
    Funny = 'Funny',
    Hinglish = 'Hinglish',
    Emotional = 'Emotional',
    Inspirational = 'Inspirational',
    Luxury = 'Luxury',
    Minimal = 'Minimal',
    Edgy = 'Edgy',
    Informative = 'Informative',
}

export enum ResolutionQuality {
  Standard = 'Standard',
  High = 'High',
}

export enum ProductCategory {
  Generic = 'Generic',
  Skincare = 'Skincare',
  FoodAndBeverage = 'Food & Beverage',
  Perfume = 'Perfume',
  Herbal = 'Herbal',
  Tech = 'Tech & Gadgets',
  Fashion = 'Fashion & Apparel',
  HomeDecor = 'Home & Decor',
  Fitness = 'Fitness & Nutrition',
}

export interface StoryboardScene {
  description: string;
  focusOnProduct: boolean;
}

export interface SavedModel {
  id: string;
  user_id: string;
  name: string;
  thumbnail_url: string;
  created_at: string;
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

  // Remix mode
  remixReferenceImage?: File;
  remixProductImage?: File;
}

export interface InspirationItem {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  appMode: AppMode;
  remixParams: Partial<GenerateImageParams>;
  isRemixable: boolean;
  badge?: string;
}

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  caption: string;
  hashtags: string;
  aspectRatio: AspectRatio;
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

export interface GenerateCaptionParams {
  imageUrl: string;
  existingCaption?: string;
  tone: CaptionTone | string;
  length: 'Short' | 'Medium' | 'Long';
  platform: string;
  language: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
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

export type BrandGuidelines = BrandAnalysis;

export interface ABTestSuggestion {
  title: string;
  description: string;
  hypothesis: string;
}

export interface ProProductStylePreset {
  name: string;
  prompt: string;
}

export interface ProProductStyleCategory {
  category: string;
  presets: ProProductStylePreset[];
}

export enum ModelPersona {
  AISuggested = 'AI Suggested',
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

export enum RewriteAction {
  Shorter = 'Shorter',
  Humor = 'Humor',
  Luxury = 'Luxury',
  Simplify = 'Simplify',
  AddHashtags = 'AddHashtags',
  // Translate removed
}

export interface RewriteCopyParams {
  copy: Omit<CopyVariation, 'isRewriting'>;
  action: RewriteAction;
  language?: string;
}

export interface UserActivity {
  id: string;
  user: string;
  action: string;
  imageUrl: string;
  timestamp: number;
}
