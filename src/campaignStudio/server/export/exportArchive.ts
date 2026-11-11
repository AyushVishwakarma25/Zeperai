/**
 * CAMPAIGN STUDIO V2 - Meta Ad Package ZIP Archive Exporter.
 *
 * Assembles all placement creatives (1:1, 4:5, 9:16, 1.91:1), ad copy sheets,
 * and campaign metadata into a single downloadable .zip archive.
 */

import type { MetaCampaignPackage, StandardAspectRatio } from '../../types.js';
import { renderCreativeDocumentToSvg } from '../composition/svgRenderer.js';
import { SimpleZipBuilder } from './zipWriter.js';

function sanitizeFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
}

/**
 * Builds a clean human-readable copy sheet formatted for direct copy-paste into Meta Ads Manager.
 */
export function buildMetaCopySheetText(pkg: MetaCampaignPackage): string {
  const lines: string[] = [];

  lines.push('================================================================================');
  lines.push('ZEPERAI CAMPAIGN STUDIO V2 — META ADS COPY SHEET');
  lines.push(`Brand: ${pkg.brandName}`);
  lines.push(`Run ID: ${pkg.runId}`);
  lines.push(`Exported At: ${pkg.generatedAt}`);
  lines.push('================================================================================\n');

  lines.push('[CAMPAIGN STRATEGY & METADATA]');
  lines.push(`Recommended Objective: ${pkg.campaignObjective}`);
  lines.push('Targeting Hooks & Angles:');
  for (const hook of pkg.suggestedTargetingHooks) {
    lines.push(`  • ${hook}`);
  }
  lines.push('');

  lines.push('[PLACEMENT MAPPING GUIDE]');
  for (const map of pkg.placementMapping) {
    lines.push(`  • ${map.aspectRatio} (${map.dimensions.width}x${map.dimensions.height}px): ${map.placements.join(', ')}`);
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
    lines.push(`  • Feed (1:1):        1x1/concept_${concept.creativeIndex}_${sanitizeFilename(concept.title)}.svg`);
    lines.push(`  • Mobile Feed (4:5): 4x5/concept_${concept.creativeIndex}_${sanitizeFilename(concept.title)}.svg`);
    lines.push(`  • Stories/Reels (9:16): 9x16/concept_${concept.creativeIndex}_${sanitizeFilename(concept.title)}.svg`);
    lines.push(`  • Landscape (1.91:1):   1_91x1/concept_${concept.creativeIndex}_${sanitizeFilename(concept.title)}.svg`);
    lines.push('\n');
  }

  lines.push('================================================================================');
  lines.push('HOW TO DEPLOY IN META ADS MANAGER:');
  lines.push('1. Set up a Sales or Traffic campaign with Advantage+ placements.');
  lines.push('2. Under "Ad Setup", enable "Flexible" format or "Dynamic Creative".');
  lines.push('3. Upload the corresponding aspect ratios for Feed (1:1 / 4:5), Stories (9:16), and Landscape (1.91:1).');
  lines.push('4. Paste the 3 Primary Text options and 3 Headline options into the respective text slots.');
  lines.push('5. Select the recommended Call to Action button.');
  lines.push('================================================================================\n');

  return lines.join('\n');
}

/**
 * Builds the complete ZIP archive Buffer containing all assets, copy sheets, and summary.
 */
export function buildMetaAdPackageZip(pkg: MetaCampaignPackage): Buffer {
  const zip = new SimpleZipBuilder();

  // 1. Add copy-sheet.txt
  const copySheet = buildMetaCopySheetText(pkg);
  zip.addFile('copy-sheet.txt', copySheet);

  // 2. Add campaign-summary.json
  const summaryJson = JSON.stringify(
    {
      campaignId: pkg.runId,
      brandName: pkg.brandName,
      objective: pkg.campaignObjective,
      generatedAt: pkg.generatedAt,
      placementMapping: pkg.placementMapping,
      targetingHooks: pkg.suggestedTargetingHooks,
      conceptsCount: pkg.concepts.length,
      claimsAudit: pkg.claimsAudit
        ? {
            passed: pkg.claimsAudit.passed,
            violationsCount: pkg.claimsAudit.violations.length,
            violations: pkg.claimsAudit.violations,
            verifiedClaimsCount: pkg.claimsAudit.verifiedClaimsUsed.length,
          }
        : undefined,
      concepts: pkg.concepts.map((c) => ({
        index: c.creativeIndex,
        conceptId: c.conceptId,
        title: c.title,
        angle: c.marketingAngle,
        format: c.advertisingFormat,
        copy: c.copy,
        variations: Object.keys(c.variations),
      })),
    },
    null,
    2,
  );
  zip.addFile('campaign-summary.json', summaryJson);

  // 3. Add README.txt
  const readme = [
    `ZeperAI Campaign Studio V2 - Export Package`,
    `Brand: ${pkg.brandName}`,
    `Run: ${pkg.runId}`,
    ``,
    `Folder Structure:`,
    `- 1x1/      : Square format creatives (1080x1080) for Instagram & Facebook Feed`,
    `- 4x5/      : Vertical feed creatives (1080x1350) for Mobile Feeds`,
    `- 9x16/     : Full-screen vertical creatives (1080x1920) for Stories & Reels`,
    `- 1_91x1/   : Wide landscape creatives (1200x628) for Desktop & Link Ads`,
    `- copy-sheet.txt        : Ready-to-paste Meta ad copy variations & CTA recommendations`,
    `- campaign-summary.json : Machine-readable campaign metadata`,
  ].join('\n');
  zip.addFile('README.txt', readme);

  // 4. Add creative SVG files for each aspect ratio
  const ratios: StandardAspectRatio[] = ['1:1', '4:5', '9:16', '1.91:1'];
  for (const concept of pkg.concepts) {
    const slug = sanitizeFilename(concept.title);

    for (const ratio of ratios) {
      const variation = concept.variations[ratio];
      if (variation?.document) {
        const svgContent = renderCreativeDocumentToSvg(variation.document);
        const folder = ratio.replace(':', '_');
        const filename = `${folder}/concept_${concept.creativeIndex}_${slug}_${variation.document.canvas.width}x${variation.document.canvas.height}.svg`;
        zip.addFile(filename, svgContent);
      }
    }
  }

  return zip.toBuffer();
}

