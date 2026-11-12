/**
 * CAMPAIGN STUDIO - shared types (client + server safe, no runtime deps).
 *
 * Mirrors supabase_campaign_studio_migration.sql. Keep the two in sync.
 */

import type { GenerationQuality } from '../config/modelConfig.js';

// ---------------------------------------------------------------------------
// Agents & review gates
// ---------------------------------------------------------------------------

export const CAMPAIGN_AGENTS = [
  'brand_analysis',
  'market_research',
  'competitor_research',
  'strategy',
  'creative_direction',
  'master_prompts',
  'creatives',
] as const;

export type CampaignAgent = (typeof CAMPAIGN_AGENTS)[number];

/**
 * Human review gates, in order. Every gate must be approved before the next
 * one starts. Market + competitor research run in parallel and share ONE gate
 * so the user reviews them together instead of clicking approve twice.
 */
export const REVIEW_GATES: readonly (readonly CampaignAgent[])[] = [
  ['brand_analysis'],
  ['market_research', 'competitor_research'],
  ['strategy'],
  ['creative_direction'],
  ['master_prompts'],
  ['creatives'],
] as const;

export const AGENT_LABELS: Record<CampaignAgent, string> = {
  brand_analysis: 'Brand Analysis',
  market_research: 'Market Research',
  competitor_research: 'Competitor Research',
  strategy: 'Strategy',
  creative_direction: 'Creative Direction',
  master_prompts: 'Master Prompts',
  creatives: 'Creatives',
};

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

export type StepStatus =
  | 'queued'
  | 'running'
  | 'awaiting_review'
  | 'approved'
  | 'superseded' // replaced by a newer version, or invalidated by an upstream redo
  | 'failed';

export type RunStatus = 'active' | 'completed' | 'cancelled';

export type AssetStatus = 'queued' | 'generating' | 'ready' | 'failed' | 'superseded';

// ---------------------------------------------------------------------------
// Run input & settings
// ---------------------------------------------------------------------------

export type CampaignGoal =
  | 'sales'
  | 'awareness'
  | 'engagement'
  | 'leads'
  | 'launch'
  | 'retention'
  | 'custom';

export type CampaignInputType = 'website' | 'details';

export type CampaignPlatform =
  | 'meta_ads'
  | 'instagram_organic'
  | 'google_display'
  | 'amazon'
  | 'flipkart'
  | 'blinkit'
  | 'zepto'
  | 'swiggy_instamart'
  | 'whatsapp'
  | 'other';

export interface CampaignSettings {
  /** Number of creatives to generate in the final step. Default 5, max 10. */
  creativeCount: number;
  /** Maps to Nano Banana 2 (Standard) / Nano Banana Pro (Pro) via modelConfig for paid users. */
  quality: GenerationQuality | 'Standard' | 'Pro';
  /** e.g. '1:1', '4:5', '9:16'. */
  aspectRatio: string;
  /** Target platforms for the campaign creatives. Default ['meta_ads']. */
  platforms: CampaignPlatform[];
}

export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  creativeCount: 5,
  quality: 'Standard',
  aspectRatio: '1:1',
  platforms: ['meta_ads'],
};

export const MAX_CREATIVES_PER_RUN = 10;

/** AI-generated redos allowed per step (manual edits do not count). Enforced by the server, shown by the UI. */
export const MAX_REGENERATIONS_PER_STEP = 5;

// ---------------------------------------------------------------------------
// DB rows (snake_case, as returned by Supabase)
// ---------------------------------------------------------------------------

export interface CampaignRun {
  id: string;
  user_id: string;
  title: string | null;
  input_type: CampaignInputType;
  website_url: string | null;
  brand_details: string | null;
  known_facts: string | null;
  goal: CampaignGoal | string;
  goal_notes: string | null;
  status: RunStatus;
  current_step: CampaignAgent;
  brand_context: Partial<BrandContext>;
  settings: CampaignSettings;
  credits_spent: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignStep<TOutput = unknown> {
  id: string;
  run_id: string;
  user_id: string;
  agent: CampaignAgent;
  version: number;
  status: StepStatus;
  input_snapshot: Record<string, unknown>;
  output: TOutput | null;
  user_feedback: string | null;
  model: string | null;
  usage: Record<string, unknown>;
  error: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
}

export interface CampaignAsset {
  id: string;
  run_id: string;
  user_id: string;
  creative_index: number;
  version: number;
  status: AssetStatus;
  prompt: string | null;
  aspect_ratio: string | null;
  model: string | null;
  image_url: string | null;
  storage_path: string | null;
  overlay: CreativeOverlay | Record<string, never>;
  credits_charged: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignProductImage {
  id: string;
  run_id: string;
  user_id: string;
  storage_path: string;
  image_url: string;
  label: string | null;
  created_at: string;
}

export const MAX_PRODUCT_IMAGES_PER_RUN = 8;

// ---------------------------------------------------------------------------
// Advertising References & Format Intelligence (Phase 2)
// ---------------------------------------------------------------------------

export type ReferenceMode = 'inspiration' | 'layout' | 'style_transfer';
export type ReferenceRole = 'layout' | 'typography' | 'color' | 'photography' | 'general';
export type ReferenceAnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export interface ReferenceDesignDNA {
  layoutType: string;
  composition: string;
  visualHierarchy: string[];
  colorRelationships: string[];
  typography: {
    style: string;
    weight: string;
    scale: string;
    positioning: string;
  };
  productPlacement: string;
  photographyStyle: string;
  graphicElements: string[];
  backgroundTreatment: string;
  visualDensity: string;
  readingOrder: string[];
  designCharacteristics: string[];
}

export interface CampaignReference {
  id: string;
  user_id: string;
  run_id?: string | null;
  concept_id?: string | null;
  image_url: string;
  storage_path?: string | null;
  reference_mode: ReferenceMode;
  reference_role: ReferenceRole;
  analysis_status: ReferenceAnalysisStatus;
  design_dna: ReferenceDesignDNA | Record<string, never>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AdvertisingFormatDefinition {
  id: string;
  name: string;
  description: string;
  suitableObjectives: CampaignGoal[];
  suitableIndustries: string[];
  recommendedVisualHierarchy: string[];
  compositionCharacteristics: string;
  typographyRecommendations: string;
  productPlacementGuidance: string;
  suitableGraphicElements: string[];
  commonMistakesToAvoid: string[];
  defaultLayoutElements?: NormalizedBoundingBox[];
  visualStructure?: string;
}

export interface FormatAssignment {
  conceptId: string;
  pillar: string;
  format: AdvertisingFormatDefinition;
  formatId?: string;
  formatName?: string;
  rationale: string;
  score?: number;
  isPreselected?: boolean;
  isLocked?: boolean;
  wasReassigned?: boolean;
  reassignmentReason?: string;
}

export interface CampaignFormatDiversityReport {
  totalConcepts: number;
  uniqueFormatsCount: number;
  formatDistribution: Record<string, number>;
  structuralDistribution: Record<string, number>;
  repeatedFormats: Array<{
    formatId: string;
    formatName: string;
    count: number;
    assignedConceptIds: string[];
    reasonForRepeat: string;
    structuralArchetype?: FormatVisualStructure;
  }>;
  diversityScore: number;
  exceptions: Array<{
    conceptId: string;
    type: 'locked_format' | 'duplicate_allowed' | 'fallback_applied' | 'structural_compromise';
    description: string;
  }>;
}

export interface CampaignFormatAllocationResult {
  assignments: FormatAssignment[];
  diversityReport: CampaignFormatDiversityReport;
}

export type CreativeLayerType =
  | 'background'
  | 'image'
  | 'product'
  | 'text'
  | 'shape'
  | 'badge'
  | 'logo'
  | 'cta'
  | 'divider';

export interface CreativeLayerPosition {
  /** 0.0 to 1.0 relative to canvas width */
  x: number;
  /** 0.0 to 1.0 relative to canvas height */
  y: number;
  /** 0.0 to 1.0 relative to canvas width */
  width: number;
  /** 0.0 to 1.0 relative to canvas height */
  height: number;
  rotation?: number;
}

export interface CreativeLayer {
  id: string;
  name: string;
  type: CreativeLayerType;
  zIndex: number;
  position: CreativeLayerPosition;
  assetId?: string;
  content?: string;
  styles: Record<string, unknown>;
  locked?: boolean;
  visible?: boolean;
}

export interface CreativeDocument {
  id: string;
  blueprintId?: string;
  conceptId: string;
  campaignId?: string;
  version: number;
  advertisingFormat: string;
  designIntensity: DesignIntensity;
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  layers: CreativeLayer[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EvaluationStatus = 'ready_for_review' | 'needs_improvement' | 'rejected';

export interface CreativeQualityScores {
  /** Visual hierarchy, reading order, and composition (0 to 20) */
  visualHierarchy: number;
  /** Product fidelity, label clarity, and packaging accuracy (0 to 20) */
  productAccuracy: number;
  /** Adherence to brand colors, tone, and visual guidelines (0 to 15) */
  brandConsistency: number;
  /** Typography readability, font pairing, and kerning (0 to 15) */
  typography: number;
  /** Lighting, shadow realism, textures, and aesthetic polish (0 to 15) */
  visualQuality: number;
  /** Clarity of hook, offer, and CTA actionability (0 to 10) */
  messageClarity: number;
  /** Dimension correctness, safe zones, and aspect ratio compliance (0 to 5) */
  technicalCompliance: number;
}

export interface QualityIssue {
  category: string;
  severity: IssueSeverity;
  description: string;
  affectedLayerId?: string;
  suggestedFix: string;
}

export interface CreativeEvaluation {
  creativeId: string;
  totalScore: number;
  status: EvaluationStatus;
  scores: CreativeQualityScores;
  issues: QualityIssue[];
  hardRuleFailures: string[];
  passed: boolean;
  evaluatedAt: string;
}

/** Text/logo layer composited on top of a generated image. */
export interface CreativeOverlay {
  headline?: string;
  subheading?: string;
  cta?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  textPlacement?: 'top' | 'bottom' | 'center' | 'clean_overlay';
  /** How many uploaded product reference photos were actually attached when this image was generated. */
  referenceImageCount?: number;
  /** V2 editable multi-layer advertising document */
  document?: CreativeDocument;
  /** Standalone rendered advertisement image URL (SVG data URI or PNG) */
  renderedCompositeUrl?: string;
  /** V2 Quality Evaluation score & issue diagnostics */
  evaluation?: CreativeEvaluation;
  /** V2 Phase 5 adapted creative documents across placements (1:1, 4:5, 9:16, 1.91:1) */
  adaptations?: Record<string, { document: CreativeDocument; compositeUrl: string }>;
}

// ---------------------------------------------------------------------------
// Phase 5: Multi-Aspect Ratio Adaptation & Meta Export Types
// ---------------------------------------------------------------------------

export type StandardAspectRatio = '1:1' | '4:5' | '9:16' | '1.91:1';

export type MetaCtaType =
  | 'SHOP_NOW'
  | 'LEARN_MORE'
  | 'ORDER_NOW'
  | 'GET_OFFER'
  | 'SIGN_UP'
  | 'BOOK_TRAVEL'
  | 'CONTACT_US';

export interface MetaCopyPackage {
  /** 3 variations: hook-driven, benefit-driven, question-driven (max 250 chars) */
  primaryText: string[];
  /** 3 variations: punchy benefit / value proposition (max 40 chars) */
  headlines: string[];
  /** High-intent sub-copy variations (max 30 chars) */
  descriptions: string[];
  callToAction: MetaCtaType;
}

export interface MetaPlacementMapping {
  aspectRatio: StandardAspectRatio;
  placements: string[];
  dimensions: { width: number; height: number };
  safeZones: {
    topBufferPx: number;
    bottomBufferPx: number;
    sideBufferPx: number;
  };
}

export interface AdaptedCreativeVariation {
  aspectRatio: StandardAspectRatio;
  document: CreativeDocument;
  compositeUrl: string;
}

export interface MetaConceptAdPackage {
  conceptId: string;
  creativeIndex: number;
  title: string;
  marketingAngle: string;
  advertisingFormat: string;
  copy: MetaCopyPackage;
  variations: Record<StandardAspectRatio, AdaptedCreativeVariation>;
  evaluation?: CreativeEvaluation;
}

export interface MetaCampaignPackage {
  runId: string;
  brandName: string;
  campaignObjective: 'Sales' | 'Leads' | 'Traffic' | 'Awareness';
  concepts: MetaConceptAdPackage[];
  placementMapping: MetaPlacementMapping[];
  suggestedTargetingHooks: string[];
  claimsAudit?: ClaimSafetyAuditResult;
  unverifiedClaimsGaps?: string[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Verified Claims System & Advertising Safety
// ---------------------------------------------------------------------------

export type ClaimCategory =
  | 'product_feature'
  | 'product_benefit'
  | 'certification'
  | 'rating_and_review'
  | 'shipping_and_delivery'
  | 'discount_and_pricing'
  | 'scarcity_and_urgency'
  | 'performance_and_metric';

export type ClaimEvidenceSource =
  | 'user_provided'
  | 'product_catalog'
  | 'shopify'
  | 'approved_offer'
  | 'confirmed_testimonial';

export type ClaimVerificationStatus = 'verified' | 'unverified' | 'rejected';
export type ClaimApprovalStatus = 'approved' | 'pending_approval' | 'rejected';
export type ClaimTier = 'verified_fact' | 'brand_approved_marketing' | 'ai_suggestion_requiring_approval';

export interface VerifiedClaim {
  id: string;
  claimText: string;
  category: ClaimCategory;
  source: ClaimEvidenceSource;
  verificationStatus: ClaimVerificationStatus;
  approvalStatus: ClaimApprovalStatus;
  tier: ClaimTier;
  confidenceScore?: number;
  expiryDate?: string;
  evidenceRef?: string;
}

export interface ClaimSafetyViolation {
  claimText: string;
  category: ClaimCategory;
  reason: string;
  location: string;
}

export interface ClaimSafetyAuditResult {
  passed: boolean;
  violations: ClaimSafetyViolation[];
  unverifiedClaimsOmitted: string[];
  missingEvidenceGaps: string[];
  verifiedClaimsUsed: VerifiedClaim[];
}

// ---------------------------------------------------------------------------
// Agent 1 output: Brand Context (the single source of truth every later agent reads)
// ---------------------------------------------------------------------------

export interface BrandContext {
  brandName: string;
  website?: string;
  category: string;
  summary: string;
  positioning: string;
  usps: string[];
  products: {
    name: string;
    description?: string;
    priceHint?: string;
    imageUrls?: string[];
  }[];
  audience: {
    primary: string;
    secondary?: string;
    painPoints: string[];
    desires: string[];
  };
  voice: {
    tone: string[];
    doSay: string[];
    dontSay: string[];
  };
  visualIdentity: {
    colors: { name?: string; hex: string }[];
    typography: string;
    logoUrl?: string;
    styleKeywords: string[];
  };
  /** Geographies the brand sells/advertises in, e.g. ['India']. */
  markets: string[];
  /** URLs actually read while building this context. Set by the server, never by the model. */
  sources: string[];
  /** Things the analyst could not determine. Shown at review so the user can fill them in. */
  gaps?: string[];
  /** Structured, verified claims registry (features, benefits, ratings, shipping, certifications). */
  verifiedClaims?: VerifiedClaim[];
}

// ---------------------------------------------------------------------------
// Agents 2-4 output: research and strategy
// ---------------------------------------------------------------------------

export interface SourceLink {
  title: string;
  url: string;
}

/** Agent 2 (market_research). Sources are set by the server from Google Search grounding, never by the model. */
export interface MarketResearch {
  category: string;
  marketSummary: string;
  trends: { trend: string; whyItMatters: string }[];
  customerInsights: { insight: string; evidence?: string }[];
  seasonalMoments: { moment: string; timing?: string; angle: string }[];
  channelInsights: { channel: string; insight: string }[];
  opportunities: string[];
  risks: string[];
  /** Facts worth searching again for that search didn't verify this time. */
  searchGaps: string[];
  /** Private business data no search will ever find (CAC, ROAS, internal metrics, unpublished changes) that only the brand owner can supply. */
  askUserGaps: string[];
  sources: SourceLink[];
  /** False when Google Search returned no sources for this answer (treat with extra caution). */
  grounded: boolean;
}

export interface CompetitorProfile {
  name: string;
  website?: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  pricePoint?: string;
  adAngles: string[];
  audienceFocus?: string;
}

/** Agent 3 (competitor_research). */
export interface CompetitorResearch {
  competitors: CompetitorProfile[];
  /** Positioning gaps the brand can own. */
  whiteSpace: string[];
  differentiators: string[];
  messagingToAvoid: string[];
  adPatterns: string[];
  /** Facts worth searching again for that search didn't verify this time. */
  searchGaps: string[];
  /** Private business data no search will ever find (CAC, ROAS, internal metrics, unpublished changes) that only the brand owner can supply. */
  askUserGaps: string[];
  sources: SourceLink[];
  grounded: boolean;
}

export type FunnelStage = 'awareness' | 'consideration' | 'conversion' | 'retention';

/** Agent 4 (strategy). `creativeMix` counts add up to the run's creativeCount. */
export interface CampaignStrategy {
  objective: string;
  bigIdea: string;
  positioningStatement: string;
  audience: { primary: string; insight: string; mindset: string };
  keyMessages: { message: string; proof: string }[];
  funnelStage: FunnelStage;
  offer?: string;
  cta: string;
  tone: string[];
  contentPillars: { name: string; description: string; exampleAd: string }[];
  creativeMix: { pillar: string; count: number }[];
  creativeFormats: { format: string; why: string }[];
  successMetrics: string[];
  guardrails: string[];
  rationale: string;
}

// ---------------------------------------------------------------------------
// Agents 5-6 output: creative direction, creative blueprints and master prompts
// ---------------------------------------------------------------------------

export type DesignIntensity = 'minimal' | 'balanced' | 'bold' | 'experimental';

export interface NormalizedBoundingBox {
  element: string;
  /** 0.0 to 1.0 (from left edge) */
  x: number;
  /** 0.0 to 1.0 (from top edge) */
  y: number;
  /** 0.0 to 1.0 */
  width: number;
  /** 0.0 to 1.0 */
  height: number;
  alignment?: 'left' | 'center' | 'right';
  layer?: number;
}

export interface BlueprintGraphicElement {
  type: string;
  description: string;
  position: NormalizedBoundingBox;
  style: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: number;
    opacity?: number;
  };
}

/** Strongly typed Creative Blueprint (V2 Advertising Design Specification). */
export interface CreativeBlueprint {
  id: string;
  campaignId?: string;
  conceptId: string;
  version: number;
  status: 'draft' | 'approved' | 'superseded';

  marketingAngle: string;
  advertisingFormat: string;
  designIntensity: DesignIntensity;

  designConcept: string;
  visualNarrative: string;

  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
  };

  artDirection: {
    visualStyle: string;
    mood: string;
    background: string;
    colorPalette: string[];
    photographyStyle: string;
    lighting: string;
  };

  layout: {
    composition: string;
    readingOrder: string[];
    productPlacement: string;
    productScale: number;
    safeZones: NormalizedBoundingBox[];
    elements: NormalizedBoundingBox[];
  };

  typography: {
    headlineStyle: {
      fontFamily: string;
      fontWeight: string | number;
      fontSizeHint: string;
      color: string;
      letterSpacing?: string;
      lineHeight?: string;
      textTransform?: 'uppercase' | 'none' | 'capitalize';
    };
    subheadlineStyle?: {
      fontFamily: string;
      fontWeight: string | number;
      fontSizeHint?: string;
      color: string;
    };
    bodyStyle?: {
      fontFamily: string;
      fontWeight: string | number;
      color: string;
    };
    hierarchy: Array<{ level: string; priority: number; role: string }>;
  };

  copy: {
    headline: string;
    subheadline?: string;
    body?: string;
    offer?: string;
    price?: string;
    cta?: string;
    disclaimer?: string;
  };

  graphicElements: BlueprintGraphicElement[];

  assets: {
    productAssetIds: string[];
    referenceIds: string[];
    logoAssetId?: string;
  };

  constraints: {
    preserveProductPackaging: boolean;
    preserveLogo: boolean;
    exactCopyRequired: boolean;
    prohibitInventedClaims: boolean;
  };
}

/** One creative concept within a content pillar. */
export interface CreativeConcept {
  /** Stable slug used to link this concept to its master prompts, e.g. "speed-1". */
  id: string;
  pillar: string;
  headline: string;
  subheadline?: string;
  visualIdea: string;
  storyline: string;
  cta: string;
  composition: string;
  /** V2 Creative Blueprint advertising design specification. */
  blueprint?: CreativeBlueprint;
  /** When true, format allocation will strictly preserve the chosen advertising format */
  isLocked?: boolean;
  formatLocked?: boolean;
}

/** Agent 5 (creative_direction / AI Art Director). Concepts must cover the strategy's creativeMix exactly (validated). */
export interface CreativeDirection {
  visualTheme: string;
  moodKeywords: string[];
  colorGuidance: string;
  typographyGuidance: string;
  photographyStyle: string;
  concepts: CreativeConcept[];
  thingsToAvoid: string[];
  /** V2 structured blueprints for every concept in the creative direction. */
  blueprints?: CreativeBlueprint[];
  /** Campaign-wide advertising format diversity report */
  diversityReport?: CampaignFormatDiversityReport;
}

/** Agent 6 (master_prompts). One prompt per concept, ready for the image model. */
export interface MasterPrompt {
  /** Matches a CreativeConcept.id. */
  conceptId: string;
  pillar: string;
  headline: string;
  subheadline?: string;
  cta: string;
  /** Full image-generation prompt: subject, composition, lighting, style, colours; no text-in-image instructions. */
  imagePrompt: string;
  /** Short negative cues (e.g. "no clutter, no extra text"). */
  negativePrompt?: string;
  aspectRatio: string;
  /** URLs of product reference photos to pass to the image generator. */
  referenceImageUrls?: string[];
}

export interface MasterPrompts {
  prompts: MasterPrompt[];
}
