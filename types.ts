
export enum AspectRatio {
  Portrait = '9:16', // For Reels/Stories
  PortraitPost = '4:5', // For Portrait Posts
  Square = '1:1', // For Square Posts
  Landscape = '16:9', // For Landscape Posts/Ads
}

export enum AppMode {
  Influencer = 'Influencer',
  Product = 'Product',
  AdCreative = 'AdCreative',
  Remix = 'Remix',
  Imagen = 'Imagen',
  Fashion = 'Fashion',
  Amazon = 'Amazon',
  Banner = 'Banner',
  Youtube = 'Youtube',
  Copywriter = 'Copywriter',
  Festival = 'Festival',
}

export enum View {
  Dashboard = 'Dashboard',
  MyDesigns = 'MyDesigns',
  Profile = 'Profile',
  Inspiration = 'Inspiration',
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
    Traditional = 'Traditional Indian Wear',
    Casual = 'Casual Wear',
    Formal = 'Formal Wear',
}

export enum ModelPersona {
  MinimalistShopper = 'Minimalist Shopper',
  UrbanProfessional = 'Urban Professional',
  CollegeStudent = 'College Student',
  NewMom = 'New Mom',
  YogaEnthusiast = 'Yoga Enthusiast',
  EcoFriendlyAdvocate = 'Eco-Friendly Advocate',
  AyurvedaHerbalBeliever = 'Ayurveda/Herbal Believer',
  FitnessBuff = 'Fitness Buff',
  StreetwearTrendsetter = 'Streetwear Trendsetter',
  BohoChic = 'Boho Chic',
  LuxuryMinimalist = 'Luxury Minimalist',
  FestiveGlam = 'Festive Glam',
  IndianBrideGroomLook = 'Indian Bride/Groom Look',
  WesternCasual = 'Western Casual',
  SeniorCitizen = 'Senior Citizen',
  TeenInfluencer = 'Teen Influencer',
  TravelerExplorer = 'Traveler/Explorer',
  EntrepreneurLeader = 'Entrepreneur/Leader',
  ArtistCreative = 'Artist/Creative',
  HealthConsciousParent = 'Health-Conscious Parent',
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

export interface GenerateImageParams {
  appMode: AppMode;
  productDescription: string;
  aspectRatio: AspectRatio;
  outputFormat: OutputFormat;
  resolutionQuality: ResolutionQuality;
  
  // Product mode
  frontProductImage?: File;
  backProductImage?: File;
  selectedAngles: string[];
  productStylePreset?: string;
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

export interface UserActivity {
  id: string;
  user: string;
  action: string;
  imageUrl: string;
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
    existingCaption: string;
    tone: CaptionTone;
    length: 'Short' | 'Medium' | 'Long';
    platform: 'Instagram' | 'YouTube' | 'TikTok' | 'Ad Copy';
    includeHashtags: boolean;
    includeEmojis: boolean;
    language: 'English' | 'Hindi' | 'Hinglish';
}

export interface ABTestSuggestion {
  title: string;
  description: string;
  hypothesis: string;
}

// FIX: Add missing types for StrategyModal and CreativeBriefPanel
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

export interface CreativeBrief {
  personas: string[];
  marketingAngles: string[];
  sceneIdeas: string[];
}

// FIX: Add types for PRO_PRODUCT_STYLE_PRESETS to ensure type safety.
export interface ProProductStylePreset {
  name: string;
  prompt: string;
}

export interface ProProductStyleCategory {
  category: string;
  presets: ProProductStylePreset[];
}

// Types for Standalone Ad Copywriter
export interface GenerateAdCopyParams {
  productDescription: string;
  brandName?: string;
  targetAudience?: string;
  tone: 'Playful' | 'Professional' | 'Witty' | 'Bold' | 'Luxury';
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'Twitter (X)';
  count: number;
}

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
}

// New Types for Content Generator
export interface GenerateContentParams {
  context: string;
  platform: 'Instagram' | 'Facebook' | 'Google Ads' | 'YouTube' | 'LinkedIn' | 'Website' | 'Email';
  goal: 'Caption / Post' | 'Ad Headline' | 'Product Description' | 'Email Subject' | 'Short Script' | 'Call to Action (CTA)';
  style: 'Storytelling' | 'Informative' | 'Conversational' | 'Persuasive' | 'Minimalist' | 'Luxury' | 'Trendy';
  tone: 'Friendly' | 'Inspirational' | 'Humorous' | 'Serious' | 'Urgent' | 'Playful' | 'Professional';
  language: 'English' | 'Hindi' | 'Spanish' | 'French';
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
  Shorter = "Make it Shorter",
  Humor = "Add Humor",
  Luxury = "Make it Sound Luxury",
  Simplify = "Simplify Tone",
  AddHashtags = "Add Hashtags",
  Translate = "Translate",
}

export interface RewriteCopyParams {
  copy: Omit<CopyVariation, 'isRewriting'>;
  action: RewriteAction;
  language?: string; // For translation
}
