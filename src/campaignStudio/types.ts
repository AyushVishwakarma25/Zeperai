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
  | 'consideration'
  | 'engagement'
  | 'leads'
  | 'launch'
  | 'retention'
  | 'trust'
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
  model?: string;
  stylePreset?: string;
  thinkingLevel?: 'low' | 'medium' | 'high';
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
  platforms?: CampaignPlatform[] | string[];
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
  // 11 Core Advertising Reference Dimensions
  cameraAngle?: string;
  lighting?: string;
  negativeSpace?: string;
  supportingElements?: string[];
  advertisingMessage?: string;
  ctaPlacement?: string;
  colorPalette?: string[];
  typographyHierarchy?: string[];
}

export interface CampaignReference {
  id: string;
  user_id?: string;
  run_id?: string | null;
  campaign_id?: string | null;
  concept_id?: string | null;
  image_url: string;
  storage_path?: string | null;
  reference_mode: ReferenceMode;
  reference_role: ReferenceRole;
  analysis_status: ReferenceAnalysisStatus;
  design_dna?: ReferenceDesignDNA | Record<string, never>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
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

export interface CampaignFormatDiversityOptions {
  allowDuplicatesThreshold?: number;
  enforceStructuralDiversity?: boolean;
  minSuitabilityThreshold?: number;
  penalizeDuplicateFormats?: boolean;
  penalizeDuplicateStructures?: boolean;
  repeatThresholdCount?: number;
  maxRepeatsPerFormat?: number;
  formatRepeatPenalty?: number;
  allowStructuralOverlap?: boolean;
  structuralRepeatPenalty?: number;
}

export type FormatVisualStructure =
  | 'hero_central'
  | 'split_comparison'
  | 'editorial_asymmetric'
  | 'feature_pointers'
  | 'lifestyle_integrated'
  | string;

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
  | 'divider'
  | 'headline'
  | 'subheadline';

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

export interface CreativeVersionSnapshot {
  version: number;
  document: CreativeDocument;
  compositeUrl?: string;
  svg?: string;
  actionTaken: string;
  timestamp: string;
  evaluation?: CreativeEvaluation;
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
  history?: CreativeVersionSnapshot[];
  blueprint?: CreativeBlueprint;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EvaluationStatus =
  | 'pending'
  | 'passed'
  | 'failed'
  | 'unverified'
  | 'partially_evaluated'
  | 'ready_for_review'
  | 'needs_improvement'
  | 'rejected';

export interface DeterministicChecksBreakdown {
  canvasDimensions: boolean;
  productAssetPresent: boolean;
  brandLogoPresent: boolean;
  headlinePresent: boolean;
  ctaPresent: boolean;
  offerMatched: boolean;
  boundaryContainment: boolean;
}

export interface DeterministicCheckDetails {
  passed: boolean;
  failures: string[];
  issues?: QualityIssue[];
  checks: DeterministicChecksBreakdown;
}

export interface VisualCheckDetails {
  status: 'passed' | 'failed' | 'unverified';
  modelId?: string;
  error?: string;
  scores?: CreativeQualityScores | null;
  checksRun: boolean;
}

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
  visualPolish?: number;
  typographyReadability?: number;
}

export interface QualityIssue {
  category: string;
  severity: IssueSeverity;
  description: string;
  affectedLayerId?: string;
  suggestedFix: string;
}

export interface CreativeEvaluation {
  id?: string;
  creativeId: string;
  documentId?: string;
  aspectRatio?: string;
  totalScore: number | null;
  status: EvaluationStatus;
  scores: CreativeQualityScores | null;
  issues: QualityIssue[];
  hardRuleFailures: string[];
  passed: boolean;
  approvalEligible?: boolean;
  deterministic?: DeterministicCheckDetails;
  visual?: VisualCheckDetails;
  documentVersion?: number;
  evaluatorVersion?: string;
  failureDetails?: string;
  evaluatedAt: string;
}

/** Text/logo layer composited on top of a generated image. */
export type CreativeApprovalStatus = 'pending_review' | 'approved' | 'needs_revision';

export interface CreativeApprovalRecord {
  approvedByUserId?: string;
  userId?: string;
  approvedAt?: string;
  timestamp?: string;
  creativeVersion: number;
  documentVersion?: number;
  placementRatio?: StandardAspectRatio;
  placementVersion?: number;
  evaluationId?: string;
  evaluationScore?: number | null;
  approvalNotes?: string;
  reason?: string;
  action: 'approved' | 'revision_requested' | 'reset' | 'format_approved';
}

export type CreativeLifecycleStatus =
  | 'Generating'
  | 'Ready for Review'
  | 'Needs Revision'
  | 'QA Incomplete'
  | 'Failed'
  | 'Approved';

export type CreativeFormatAdaptationState =
  | 'unadapted'
  | 'adapted_reflow'
  | 'ai_generated'
  | 'generating'
  | 'ready_for_review'
  | 'needs_revision'
  | 'approved'
  | 'failed';

export interface CreativeFormatDetail {
  status: CreativeFormatAdaptationState;
  compositeUrl?: string;
  error?: string;
  adaptedAt?: string;
  evaluation?: any;
  modelUsed?: string;
  creditsCharged?: number;
  operationId?: string;
}

export type CreativeErrorCode =
  | 'AUTH_CONFIG'
  | 'MODEL_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'SAFETY_FILTER'
  | 'INVALID_REQUEST'
  | 'POST_PROCESSING_ERROR'
  | 'INSUFFICIENT_CREDITS'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface StructuredCreativeError {
  code: CreativeErrorCode;
  userMessage: string;
  category: 'authentication' | 'model_availability' | 'quota_or_rate_limit' | 'timeout' | 'content_policy' | 'processing';
  retryable: boolean;
  suggestedAction: string;
}

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
  /** Explicit human review and approval status */
  approvalStatus?: CreativeApprovalStatus;
  approvedAt?: string;
  approvedByUserId?: string;
  documentVersionAtApproval?: number;
  userNotes?: string;
  /** Full approval and revision audit history */
  approvalHistory?: CreativeApprovalRecord[];
  /** Structured user-safe error details when generation or compositing fails */
  errorDetail?: StructuredCreativeError;
  /** Per-format adaptation and AI generation tracking */
  formatStatus?: Partial<Record<StandardAspectRatio, CreativeFormatDetail>>;
}

/**
 * Resolves the true lifecycle state of a creative asset.
 * A creative is NEVER marked "Approved" or "Ready" merely because raw image generation succeeded.
 * - Generating: Still in queue or generating
 * - Failed: Generation or credit charging failed
 * - Needs Revision: Hard compliance failure, rejected QA, or user requested changes
 * - QA Incomplete: Partial / unverified evaluation without critical failures
 * - Ready for Review: Verified QA (deterministic & multimodal vision passed), awaiting explicit human approval
 * - Approved: Explicitly approved by user without unresolved critical failures, matching current document version
 */
export function resolveCreativeLifecycleStatus(asset: CampaignAsset): CreativeLifecycleStatus {
  if (asset.status === 'generating' || asset.status === 'queued') {
    return 'Generating';
  }
  if (asset.status === 'failed') {
    return 'Failed';
  }
  const overlay = (asset.overlay || {}) as CreativeOverlay;
  const evaluation = overlay.evaluation;
  const hardRuleFailures = evaluation?.hardRuleFailures ?? [];

  // Critical hard compliance failures ALWAYS block approval and force Needs Revision
  if (hardRuleFailures.length > 0 || evaluation?.status === 'failed' || evaluation?.status === 'rejected') {
    return 'Needs Revision';
  }

  // Explicit user revision request
  if (overlay.approvalStatus === 'needs_revision') {
    return 'Needs Revision';
  }

  // Explicit human approval (requires passed evaluation, no critical issues, matching document version)
  if (overlay.approvalStatus === 'approved') {
    const isApprovedValid =
      asset.status === 'ready' &&
      Boolean(overlay.renderedCompositeUrl || asset.image_url) &&
      evaluation?.status === 'passed' &&
      evaluation?.approvalEligible === true &&
      evaluation?.visual?.checksRun === true &&
      evaluation?.visual?.status === 'passed' &&
      hardRuleFailures.length === 0 &&
      (!overlay.document?.version || evaluation?.documentVersion === overlay.document.version);

    if (isApprovedValid) {
      return 'Approved';
    }

    if (
      !evaluation ||
      evaluation.status === 'unverified' ||
      evaluation.status === 'partially_evaluated' ||
      !evaluation.visual?.checksRun ||
      (overlay.document?.version && evaluation.documentVersion !== overlay.document.version)
    ) {
      return 'QA Incomplete';
    }
    return 'Needs Revision';
  }

  // Partial / unverified evaluation
  if (
    !evaluation ||
    evaluation.status === 'partially_evaluated' ||
    evaluation.status === 'unverified' ||
    !evaluation.visual?.checksRun ||
    evaluation.visual?.status !== 'passed'
  ) {
    return 'QA Incomplete';
  }

  // Verified QA, awaiting explicit human approval
  return 'Ready for Review';
}

/**
 * Checks whether an asset is eligible for production Meta campaign export.
 * Strictest standard: must be successfully generated, approved by user, with 0 hard failures,
 * passed multimodal visual QA, and valid document version match.
 */
export function isCreativeEligibleForExport(asset: CampaignAsset, allowUnverified = false): boolean {
  if (asset.status !== 'ready') return false;
  const overlay = (asset.overlay || {}) as CreativeOverlay;
  const evaluation = overlay.evaluation;
  const hardFailures = evaluation?.hardRuleFailures ?? [];
  if (hardFailures.length > 0) return false;
  if (!overlay.renderedCompositeUrl && !asset.image_url) return false;
  if (overlay.approvalStatus !== 'approved') return false;

  if (!allowUnverified) {
    if (!evaluation || evaluation.status !== 'passed' || !evaluation.approvalEligible) return false;
    if (!evaluation.visual?.checksRun || evaluation.visual.status !== 'passed') return false;
    if (overlay.document?.version && evaluation.documentVersion !== overlay.document.version) return false;
    const hasCriticalIssues = evaluation.issues?.some((i) => i.severity === 'critical');
    if (hasCriticalIssues) return false;
  }
  return true;
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

export type SemanticElementRole =
  | 'product_hero'
  | 'secondary_product_visual'
  | 'headline'
  | 'supporting_copy'
  | 'benefit_proof'
  | 'offer'
  | 'cta'
  | 'brand_identity'
  | 'decorative_elements';

export type CompositionType =
  | 'split_layout'
  | 'product_hero'
  | 'editorial'
  | 'lifestyle'
  | 'comparison'
  | 'before_and_after'
  | 'typography_led'
  | 'promotional'
  | 'grid_or_collage';

export type PlacementAdaptationStatus =
  | 'draft'
  | 'approved'
  | 'rejected'
  | 'needs_manual_review';

export interface SemanticLayoutElement {
  layerId: string;
  role: SemanticElementRole;
  importance: 'critical' | 'high' | 'medium' | 'low';
  originalPosition: CreativeLayerPosition;
  originalContent?: string;
  originalStyles: Record<string, unknown>;
  canHideIfCrowded: boolean;
  canStackVertically: boolean;
  requiresSafeZone: boolean;
}

export interface SemanticLayoutRepresentation {
  compositionType: CompositionType;
  aspectRatio: StandardAspectRatio;
  elements: SemanticLayoutElement[];
  focalPoint: { x: number; y: number };
  negativeSpacePreference: 'generous' | 'compact' | 'balanced';
  brandColorPalette: string[];
}

export interface AdaptedCreativePlacement {
  id: string;
  masterCreativeId: string;
  aspectRatio: StandardAspectRatio;
  compositionType: CompositionType;
  document: CreativeDocument;
  compositeUrl: string;
  svg: string;
  evaluation?: CreativeEvaluation;
  status: PlacementAdaptationStatus;
  safeZoneCompliant: boolean;
  recalculatedTypography: {
    headlineFontSize: number | string;
    subheadlineFontSize?: number | string;
    lineHeight: number;
    estimatedLines: number;
  };
  manualReviewNeeded: boolean;
  manualReviewReason?: string;
  warnings: string[];
  adaptedAt: string;
}

export interface AdaptedCreativeVariation {
  aspectRatio: StandardAspectRatio;
  document: CreativeDocument;
  compositeUrl: string;
  evaluation?: CreativeEvaluation;
  status?: PlacementAdaptationStatus;
  manualReviewNeeded?: boolean;
  manualReviewReason?: string;
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
    styleKeywords?: string[];
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

export type DesignIntensity = 'minimal' | 'balanced' | 'bold' | 'experimental' | 'editorial_minimal' | string;

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

  packagingFidelity?: any;
  brandFidelity?: any;
  generationMetadata?: any;
  metadata?: Record<string, unknown>;
}

export type CriticIssueType =
  | 'weak_concept'
  | 'repetitive_idea'
  | 'poor_visibility'
  | 'inappropriate_background'
  | 'unclear_hierarchy'
  | 'insufficient_negative_space'
  | 'brand_conflict';

export interface CriticIssue {
  type: CriticIssueType;
  severity: 'warning' | 'error';
  description: string;
  recommendation: string;
  conceptId?: string;
}

export interface ConceptCritiqueReview {
  conceptId: string;
  overallScore: number; // 0 - 100
  isApproved: boolean;
  criteriaScores: {
    originality: number;
    brandAlignment: number;
    productVisibility: number;
    hierarchyClarity: number;
    negativeSpace: number;
    backgroundSuitability: number;
  };
  issues: CriticIssue[];
  revisionsApplied?: string[];
}

export interface DirectionCritiqueReport {
  overallScore: number;
  isApproved: boolean;
  reviewedAt: string;
  conceptReviews: ConceptCritiqueReview[];
  crossConceptIssues: CriticIssue[];
  revisionsCount: number;
  summary: string;
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
  angle?: string;
  /** Structured visual direction dimensions */
  conceptName?: string;
  advertisingObjective?: string;
  compositionDescription?: string;
  productPlacement?: string;
  backgroundDirection?: string;
  lightingDirection?: string;
  supportingElements?: string[];
  copyHierarchy?: {
    headline: string;
    subheadline?: string;
    cta: string;
    body?: string;
  };
  ctaDirection?: string;
  colorTypographyDirection?: {
    colorGuidance?: string;
    typographyGuidance?: string;
    fonts?: string[];
  };
  criticReview?: ConceptCritiqueReview;
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
  /** Composition critic review and revision report */
  criticReport?: DirectionCritiqueReport;
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
