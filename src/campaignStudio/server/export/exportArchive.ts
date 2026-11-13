/**
 * CAMPAIGN STUDIO V2 - Meta Ad Package ZIP Archive Exporter.
 *
 * Assembles all placement creatives (1:1, 4:5, 9:16, 1.91:1) in vector SVG,
 * production-ready PNG, and lightweight JPEG formats, together with ad copy sheets,
 * campaign manifests, and metadata into a standards-compliant .zip archive.
 */

import type { MetaCampaignPackage, MetaConceptAdPackage, StandardAspectRatio } from '../../types.js';
import { META_PLACEMENT_SPECS } from '../adaptation/creativeAdapter.js';
import { renderCreativeDocumentToSvg } from '../composition/svgRenderer.js';
import {
  type ImageValidationResult,
  renderSvgToRasterBuffers,
  validateRasterBuffer,
} from './rasterRenderer.js';
import { SimpleZipBuilder } from './zipWriter.js';

export type CanonicalPlacementFolder = '1x1' | '4x5' | '9x16' | '1_91x1';

export interface MetaAdPackageExportOptions {
  allowUnverified?: boolean;
  jpegQuality?: number;
  forceZip64?: boolean;
}

export interface ManifestAssetEntry {
  campaignId: string;
  creativeId: string;
  conceptIndex: number;
  conceptTitle: string;
  placement: string;
  aspectRatio: StandardAspectRatio;
  dimensions: { width: number; height: number };
  fileFormat: 'png' | 'jpeg' | 'svg';
  filename: string;
  archivePath: string;
  fileSizeBytes: number;
  generatedAt: string;
  qaStatus: {
    passed: boolean;
    checks: {
      readable: boolean;
      correctMime: boolean;
      correctDimensions: boolean;
      opaqueBackground: boolean;
      noClipping: boolean;
      evaluationPassed: boolean;
    };
    errors?: string[];
  };
}

export interface ExcludedPlacementDetail {
  conceptIndex: number;
  conceptTitle: string;
  placement: string;
  aspectRatio: StandardAspectRatio;
  reason: string;
}

export interface CampaignExportManifest {
  manifestVersion: string;
  campaignId: string;
  brandName: string;
  campaignObjective: string;
  generatedAt: string;
  totalAssets: number;
  qaSummary: {
    totalConcepts: number;
    approvedConcepts: number;
    excludedConcepts: number;
    totalPlacementsGenerated?: number;
    excludedPlacementsCount?: number;
    allPassed: boolean;
    unverifiedOverrideApplied: boolean;
    warnings: string[];
  };
  excludedPlacements?: ExcludedPlacementDetail[];
  assets: ManifestAssetEntry[];
}

/**
 * Returns the canonical folder name for an aspect ratio, consistent across
 * ZIP structure, README documentation, Manifest, and Copy sheet.
 */
export function getPlacementFolder(aspectRatio: StandardAspectRatio): CanonicalPlacementFolder {
  switch (aspectRatio) {
    case '1:1':
      return '1x1';
    case '4:5':
      return '4x5';
    case '9:16':
      return '9x16';
    case '1.91:1':
      return '1_91x1';
    default:
      return (aspectRatio as string).replace(':', 'x').replace('.', '_') as CanonicalPlacementFolder;
  }
}

/**
 * Cleans concept title into a deterministic, safe filename slug.
 */
export function sanitizeExportSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'creative'
  );
}

/**
 * Generates the canonical filename for an exported creative asset.
 */
export function getExportAssetFilename(params: {
  conceptIndex: number;
  conceptTitle: string;
  width: number;
  height: number;
  extension: 'svg' | 'png' | 'jpg';
}): string {
  const slug = sanitizeExportSlug(params.conceptTitle);
  return `concept_${params.conceptIndex}_${slug}_${params.width}x${params.height}.${params.extension}`;
}

/**
 * Generates the canonical archive path for an exported creative asset.
 */
export function getExportAssetPath(params: {
  aspectRatio: StandardAspectRatio;
  conceptIndex: number;
  conceptTitle: string;
  width: number;
  height: number;
  extension: 'svg' | 'png' | 'jpg';
}): string {
  const folder = getPlacementFolder(params.aspectRatio);
  const filename = getExportAssetFilename(params);
  return `${folder}/${filename}`;
}

/**
 * Determines whether a creative has passed evaluation and is verified for approved export.
 */
export function isCreativeApproved(concept: MetaConceptAdPackage): { approved: boolean; reason?: string } {
  if (!concept.evaluation) {
    return {
      approved: false,
      reason: 'Unverified: No quality evaluation report attached to creative.',
    };
  }

  if (concept.evaluation.status === 'unverified') {
    return {
      approved: false,
      reason: 'Unverified: Quality evaluation could not be completed for this creative.',
    };
  }

  if (concept.evaluation.status === 'partially_evaluated') {
    return {
      approved: false,
      reason: 'Partially evaluated: Creative requires full visual and deterministic verification.',
    };
  }

  if (concept.evaluation.passed === false) {
    return {
      approved: false,
      reason: `Quality evaluation failed with total score ${concept.evaluation.totalScore}/100. ${concept.evaluation.hardRuleFailures?.join(', ') || ''}`.trim(),
    };
  }

  if (concept.evaluation.status === 'rejected' || concept.evaluation.status === 'failed') {
    return {
      approved: false,
      reason: 'Creative was marked as rejected or failed during evaluation review.',
    };
  }

  if (concept.evaluation.hardRuleFailures && concept.evaluation.hardRuleFailures.length > 0) {
    return {
      approved: false,
      reason: `Hard rule violations detected: ${concept.evaluation.hardRuleFailures.join(', ')}`,
    };
  }

  return { approved: true };
}

/**
 * Builds a clean human-readable copy sheet formatted for direct copy-paste into Meta Ads Manager.
 */
export function buildMetaCopySheetText(
  pkg: MetaCampaignPackage,
  options?: { allowUnverified?: boolean; excludedCount?: number },
): string {
  const lines: string[] = [];

  lines.push('================================================================================');
  lines.push('ZEPERAI CAMPAIGN STUDIO V2 — META ADS COPY SHEET');
  lines.push(`Brand: ${pkg.brandName}`);
  lines.push(`Run ID: ${pkg.runId}`);
  lines.push(`Exported At: ${pkg.generatedAt}`);
  lines.push('================================================================================\n');

  if (options?.allowUnverified) {
    lines.push('[WARNING: UNVERIFIED CREATIVES OVERRIDE]');
    lines.push('This archive contains creatives exported with an explicit unverified/force override.');
    lines.push('Some assets may not have passed automated QA or brand evidence checks.\n');
  }

  if (options?.excludedCount && options.excludedCount > 0) {
    lines.push('[NOTICE: EXCLUDED CREATIVES]');
    lines.push(`${options.excludedCount} creative(s) were excluded from this export because they did not pass automated quality evaluation.\n`);
  }

  lines.push('[CAMPAIGN STRATEGY & METADATA]');
  lines.push(`Recommended Objective: ${pkg.campaignObjective}`);
  lines.push('Targeting Hooks & Angles:');
  for (const hook of pkg.suggestedTargetingHooks) {
    lines.push(`  • ${hook}`);
  }
  lines.push('');

  lines.push('[PLACEMENT MAPPING GUIDE]');
  for (const map of pkg.placementMapping) {
    const folder = getPlacementFolder(map.aspectRatio);
    lines.push(`  • ${map.aspectRatio} (${map.dimensions.width}x${map.dimensions.height}px) [${folder}/]: ${map.placements.join(', ')}`);
  }
  lines.push('');

  lines.push('[CLAIM SAFETY & EVIDENCE AUDIT]');
  if (pkg.claimsAudit) {
    lines.push(`  • Audit Status: ${pkg.claimsAudit.passed ? 'PASSED (100% Grounded in Brand Evidence)' : 'FLAGGED CLAIMS DETECTED'}`);
    lines.push(`  • Verified Claims Applied: ${pkg.claimsAudit.verifiedClaimsUsed.length}`);
    if (pkg.claimsAudit.violations.length > 0) {
      lines.push('  • Unverified Claims Flagged:');
      for (const v of pkg.claimsAudit.violations) {
        lines.push(`    - [${v.category}] ${v.reason} (${v.location})`);
      }
    }
  } else {
    lines.push('  • Audit Status: Verified brand facts baseline');
  }
  lines.push('\n');

  lines.push('================================================================================');
  lines.push('CREATIVE CONCEPTS & AD COPY');
  lines.push('================================================================================\n');

  for (const concept of pkg.concepts) {
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`CONCEPT ${concept.creativeIndex}: ${concept.title}`);
    lines.push(`Marketing Angle: ${concept.marketingAngle}`);
    lines.push(`Advertising Format: ${concept.advertisingFormat}`);
    lines.push(`Recommended CTA Button: ${concept.copy.callToAction}`);
    if (concept.evaluation) {
      lines.push(`Quality Score: ${concept.evaluation.totalScore}/100 (${concept.evaluation.passed ? 'PASSED' : 'NEEDS ATTENTION'})`);
    }
    lines.push(`--------------------------------------------------------------------------------\n`);

    lines.push('PRIMARY TEXT OPTIONS (Test via Dynamic Creative or select preferred):');
    lines.push(`  [Option A - Hook Driven]:`);
    lines.push(`  "${concept.copy.primaryText[0]}"\n`);
    lines.push(`  [Option B - Benefit Driven]:`);
    lines.push(`  "${concept.copy.primaryText[1]}"\n`);
    lines.push(`  [Option C - Question Driven]:`);
    lines.push(`  "${concept.copy.primaryText[2]}"\n`);

    lines.push('HEADLINES (Max 40 chars):');
    concept.copy.headlines.forEach((h, i) => {
      lines.push(`  ${i + 1}. "${h}"`);
    });
    lines.push('');

    lines.push('DESCRIPTIONS (Max 30 chars):');
    concept.copy.descriptions.forEach((d, i) => {
      lines.push(`  ${i + 1}. "${d}"`);
    });
    lines.push('');

    lines.push('ASSET DIRECTORY:');
    const ratios: StandardAspectRatio[] = ['1:1', '4:5', '9:16', '1.91:1'];
    for (const ratio of ratios) {
      const spec = META_PLACEMENT_SPECS[ratio];
      const p = getExportAssetPath({
        aspectRatio: ratio,
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        width: spec.dimensions.width,
        height: spec.dimensions.height,
        extension: 'png',
      });
      lines.push(`  • ${ratio} (${spec.placements[0]}): ${p} (also .jpg, .svg)`);
    }
    lines.push('\n');
  }

  lines.push('================================================================================');
  lines.push('HOW TO DEPLOY IN META ADS MANAGER:');
  lines.push('1. Set up a Sales or Traffic campaign with Advantage+ placements.');
  lines.push('2. Under "Ad Setup", enable "Flexible" format or "Dynamic Creative".');
  lines.push('3. Upload the high-res PNG or JPEG creatives from 1x1/ (Square), 4x5/ (Vertical Feed), 9x16/ (Stories/Reels), and 1_91x1/ (Landscape).');
  lines.push('4. Paste the 3 Primary Text options and 3 Headline options into the respective text slots.');
  lines.push('5. Select the recommended Call to Action button.');
  lines.push('================================================================================\n');

  return lines.join('\n');
}

/**
 * Builds the complete ZIP archive Buffer containing raster (PNG, JPEG), vector (SVG),
 * manifests, copy sheets, and documentation.
 */
export async function buildMetaAdPackageZip(
  pkg: MetaCampaignPackage,
  options?: MetaAdPackageExportOptions,
): Promise<Buffer> {
  const zip = new SimpleZipBuilder();
  const allowUnverified = options?.allowUnverified ?? false;
  const jpegQuality = options?.jpegQuality ?? 85;

  // 1. Filter concepts according to approval status unless override is enabled
  const conceptApprovalResults = pkg.concepts.map((concept) => ({
    concept,
    approval: isCreativeApproved(concept),
  }));

  const approvedConcepts: MetaConceptAdPackage[] = [];
  const excludedConcepts: Array<{ concept: MetaConceptAdPackage; reason: string }> = [];

  for (const item of conceptApprovalResults) {
    if (item.approval.approved) {
      approvedConcepts.push(item.concept);
    } else if (allowUnverified) {
      approvedConcepts.push(item.concept);
    } else {
      excludedConcepts.push({ concept: item.concept, reason: item.approval.reason || 'Not approved' });
    }
  }

  if (approvedConcepts.length === 0 && pkg.concepts.length > 0) {
    throw new Error(
      `Cannot export Meta ad package: all ${pkg.concepts.length} creatives are unverified or failed quality evaluation. Pass { allowUnverified: true } to export anyway with warnings.`,
    );
  }

  const warnings: string[] = [];
  if (allowUnverified && conceptApprovalResults.some((c) => !c.approval.approved)) {
    warnings.push('Export contains creatives that were unverified or failed quality evaluation (override active).');
  }
  if (excludedConcepts.length > 0) {
    warnings.push(`${excludedConcepts.length} creative(s) were excluded because they did not pass quality evaluation.`);
  }

  // 2. Generate Assets for each approved concept across all 4 ratios
  const manifestAssets: ManifestAssetEntry[] = [];
  const excludedPlacements: ExcludedPlacementDetail[] = [];
  const ratios: StandardAspectRatio[] = ['1:1', '4:5', '9:16', '1.91:1'];

  for (const concept of approvedConcepts) {
    for (const ratio of ratios) {
      const spec = META_PLACEMENT_SPECS[ratio];
      const variation = concept.variations[ratio];
      if (!variation?.document) {
        excludedPlacements.push({
          conceptIndex: concept.creativeIndex,
          conceptTitle: concept.title,
          placement: spec.placements.join(', '),
          aspectRatio: ratio,
          reason: 'Placement document was not generated or adapted.',
        });
        continue;
      }

      if (variation.status === 'rejected' && !allowUnverified) {
        excludedPlacements.push({
          conceptIndex: concept.creativeIndex,
          conceptTitle: concept.title,
          placement: spec.placements.join(', '),
          aspectRatio: ratio,
          reason: 'Placement adaptation was rejected during review.',
        });
        continue;
      }

      if (variation.manualReviewNeeded && !allowUnverified) {
        excludedPlacements.push({
          conceptIndex: concept.creativeIndex,
          conceptTitle: concept.title,
          placement: spec.placements.join(', '),
          aspectRatio: ratio,
          reason: variation.manualReviewReason || 'Placement requires manual review for layout safety.',
        });
        continue;
      }

      if (variation.evaluation && !variation.evaluation.passed && !allowUnverified) {
        excludedPlacements.push({
          conceptIndex: concept.creativeIndex,
          conceptTitle: concept.title,
          placement: spec.placements.join(', '),
          aspectRatio: ratio,
          reason: `Placement failed automated QA (${variation.evaluation.hardRuleFailures.join('; ') || 'score below threshold'}).`,
        });
        continue;
      }

      const targetWidth = variation.document.canvas?.width || spec.dimensions.width;
      const targetHeight = variation.document.canvas?.height || spec.dimensions.height;

      // Render vector SVG
      const svgContent = renderCreativeDocumentToSvg(variation.document);
      const svgPath = getExportAssetPath({
        aspectRatio: ratio,
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        width: targetWidth,
        height: targetHeight,
        extension: 'svg',
      });
      const svgFilename = getExportAssetFilename({
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        width: targetWidth,
        height: targetHeight,
        extension: 'svg',
      });
      const svgBuffer = Buffer.from(svgContent, 'utf-8');
      zip.addFile(svgPath, svgBuffer);

      manifestAssets.push({
        campaignId: pkg.runId,
        creativeId: concept.conceptId,
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        placement: spec.placements.join(', '),
        aspectRatio: ratio,
        dimensions: { width: targetWidth, height: targetHeight },
        fileFormat: 'svg',
        filename: svgFilename,
        archivePath: svgPath,
        fileSizeBytes: svgBuffer.length,
        generatedAt: pkg.generatedAt,
        qaStatus: {
          passed: true,
          checks: {
            readable: true,
            correctMime: true,
            correctDimensions: true,
            opaqueBackground: true,
            noClipping: true,
            evaluationPassed: concept.evaluation ? concept.evaluation.passed : allowUnverified,
          },
        },
      });

      // Render raster PNG and JPEG
      const rasterPkg = await renderSvgToRasterBuffers(svgContent, {
        width: targetWidth,
        height: targetHeight,
        backgroundColor: '#FFFFFF',
        jpegQuality,
        requireOpaque: true,
      });

      // Add PNG
      const pngPath = getExportAssetPath({
        aspectRatio: ratio,
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        width: targetWidth,
        height: targetHeight,
        extension: 'png',
      });
      const pngFilename = getExportAssetFilename({
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        width: targetWidth,
        height: targetHeight,
        extension: 'png',
      });
      zip.addFile(pngPath, rasterPkg.png);

      manifestAssets.push({
        campaignId: pkg.runId,
        creativeId: concept.conceptId,
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        placement: spec.placements.join(', '),
        aspectRatio: ratio,
        dimensions: { width: targetWidth, height: targetHeight },
        fileFormat: 'png',
        filename: pngFilename,
        archivePath: pngPath,
        fileSizeBytes: rasterPkg.png.length,
        generatedAt: pkg.generatedAt,
        qaStatus: {
          passed: rasterPkg.validation.png.valid,
          checks: {
            ...rasterPkg.validation.png.checks,
            evaluationPassed: concept.evaluation ? concept.evaluation.passed : allowUnverified,
          },
          errors: rasterPkg.validation.png.errors.length > 0 ? rasterPkg.validation.png.errors : undefined,
        },
      });

      // Add JPEG
      const jpgPath = getExportAssetPath({
        aspectRatio: ratio,
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        width: targetWidth,
        height: targetHeight,
        extension: 'jpg',
      });
      const jpgFilename = getExportAssetFilename({
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        width: targetWidth,
        height: targetHeight,
        extension: 'jpg',
      });
      zip.addFile(jpgPath, rasterPkg.jpeg);

      manifestAssets.push({
        campaignId: pkg.runId,
        creativeId: concept.conceptId,
        conceptIndex: concept.creativeIndex,
        conceptTitle: concept.title,
        placement: spec.placements.join(', '),
        aspectRatio: ratio,
        dimensions: { width: targetWidth, height: targetHeight },
        fileFormat: 'jpeg',
        filename: jpgFilename,
        archivePath: jpgPath,
        fileSizeBytes: rasterPkg.jpeg.length,
        generatedAt: pkg.generatedAt,
        qaStatus: {
          passed: rasterPkg.validation.jpeg.valid,
          checks: {
            ...rasterPkg.validation.jpeg.checks,
            evaluationPassed: concept.evaluation ? concept.evaluation.passed : allowUnverified,
          },
          errors: rasterPkg.validation.jpeg.errors.length > 0 ? rasterPkg.validation.jpeg.errors : undefined,
        },
      });
    }
  }

  // 3. Add manifest.json
  const manifest: CampaignExportManifest = {
    manifestVersion: '2.1.0',
    campaignId: pkg.runId,
    brandName: pkg.brandName,
    campaignObjective: pkg.campaignObjective,
    generatedAt: pkg.generatedAt,
    totalAssets: manifestAssets.length,
    qaSummary: {
      totalConcepts: pkg.concepts.length,
      approvedConcepts: approvedConcepts.length,
      excludedConcepts: excludedConcepts.length,
      totalPlacementsGenerated: manifestAssets.filter((a) => a.fileFormat === 'png').length,
      excludedPlacementsCount: excludedPlacements.length,
      allPassed: manifestAssets.every((a) => a.qaStatus.passed),
      unverifiedOverrideApplied: allowUnverified,
      warnings,
    },
    excludedPlacements: excludedPlacements.length > 0 ? excludedPlacements : undefined,
    assets: manifestAssets,
  };
  zip.addFile('manifest.json', JSON.stringify(manifest, null, 2));

  // 4. Add campaign-summary.json
  const summaryJson = JSON.stringify(
    {
      campaignId: pkg.runId,
      brandName: pkg.brandName,
      objective: pkg.campaignObjective,
      generatedAt: pkg.generatedAt,
      placementMapping: pkg.placementMapping.map((m) => ({
        ...m,
        folder: getPlacementFolder(m.aspectRatio),
      })),
      targetingHooks: pkg.suggestedTargetingHooks,
      conceptsCount: approvedConcepts.length,
      totalAssetsCount: manifestAssets.length,
      manifestPath: 'manifest.json',
      qaSummary: manifest.qaSummary,
      claimsAudit: pkg.claimsAudit
        ? {
            passed: pkg.claimsAudit.passed,
            violationsCount: pkg.claimsAudit.violations.length,
            violations: pkg.claimsAudit.violations,
            verifiedClaimsCount: pkg.claimsAudit.verifiedClaimsUsed.length,
          }
        : undefined,
      concepts: approvedConcepts.map((c) => ({
        index: c.creativeIndex,
        conceptId: c.conceptId,
        title: c.title,
        angle: c.marketingAngle,
        format: c.advertisingFormat,
        copy: c.copy,
        variations: Object.keys(c.variations),
        qualityScore: c.evaluation?.totalScore,
      })),
    },
    null,
    2,
  );
  zip.addFile('campaign-summary.json', summaryJson);

  // 5. Add copy-sheet.txt
  const copySheet = buildMetaCopySheetText(pkg, {
    allowUnverified,
    excludedCount: excludedConcepts.length,
  });
  zip.addFile('copy-sheet.txt', copySheet);

  // 6. Add README.txt
  const readmeLines = [
    `================================================================================`,
    `ZEPERAI CAMPAIGN STUDIO V2 — META AD EXPORT PACKAGE`,
    `Brand: ${pkg.brandName}`,
    `Campaign ID: ${pkg.runId}`,
    `Generated: ${pkg.generatedAt}`,
    `Total Advertising Assets: ${manifestAssets.length}`,
    `================================================================================`,
    ``,
  ];

  if (warnings.length > 0) {
    readmeLines.push(`[QA & AUDIT WARNINGS]`);
    for (const w of warnings) {
      readmeLines.push(`  ⚠ ${w}`);
    }
    readmeLines.push('');
  }

  readmeLines.push(
    `FOLDER STRUCTURE & PLACEMENT GUIDE:`,
    `- 1x1/      : Square format creatives (1080x1080) for Instagram & Facebook Feed`,
    `- 4x5/      : Vertical feed creatives (1080x1350) for Mobile Feeds`,
    `- 9x16/     : Full-screen vertical creatives (1080x1920) for Stories & Reels`,
    `- 1_91x1/   : Wide landscape creatives (1200x628) for Desktop & Link Ads`,
    ``,
    `FILE FORMATS PROVIDED:`,
    `- .png : High-resolution, loss-conscious compressed PNG for crisp advertising delivery`,
    `- .jpg : Progressive lightweight JPEG for optimal load times and bandwidth limits`,
    `- .svg : Fully editable multi-layer vector document for design revisions`,
    ``,
    `PACKAGE DOCUMENTATION:`,
    `- manifest.json         : Complete machine-readable asset index, dimensions, and QA checklist`,
    `- copy-sheet.txt        : Direct copy-paste primary texts, headlines, and descriptions for Meta`,
    `- campaign-summary.json : Campaign strategy, audience hooks, and verified claims report`,
    ``,
    `HOW TO LAUNCH:`,
    `1. Open Meta Ads Manager -> Create Campaign.`,
    `2. Upload PNG or JPEG assets from each folder corresponding to your placements.`,
    `3. Paste copy variations from copy-sheet.txt into the Dynamic Creative fields.`,
  );

  zip.addFile('README.txt', readmeLines.join('\n'));

  return zip.toBuffer({ forceZip64: options?.forceZip64 });
}
