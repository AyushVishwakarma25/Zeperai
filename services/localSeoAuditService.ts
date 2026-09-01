/**
 * FILE: src/services/localSeoAuditService.ts
 * PURPOSE: Service for ZeperAi Local SEO Audit micro-SaaS.
 * Complies with strict 3-phase execution workflow and JSON/Markdown schemas.
 */

export interface LocalNapData {
  name: string;
  address: string;
  phone: string;
}

export interface ExtractedLocalEntities {
  businessName: string;
  primaryCategory: string;
  napData: LocalNapData;
  missingData: string[];
  targetKeywords: string[];
}

export interface LocalAuditTacticalStrategy {
  gbpDescription: string;
  photoRecommendations: string[];
  industryCitations: string[];
  localRelevanceTopics: string[];
}

export interface ContentCalendarItem {
  week: string;
  topic: string;
  targetKeyword: string;
  format: string;
}

export interface TechnicalDeliverables {
  schemaJsonLd: Record<string, any> | string;
  schemaJsonLdRaw: string;
  contentCalendar: ContentCalendarItem[];
  criticalActionPlan: string[];
}

export interface LocalSeoAuditResult {
  success: boolean;
  rawMarkdown: string;
  entities: ExtractedLocalEntities;
  tactical: LocalAuditTacticalStrategy;
  technical: TechnicalDeliverables;
  auditScore?: number;
  timestamp: string;
}

export interface LocalSeoAuditInput {
  businessDescription: string;
  location: string;
  businessName?: string;
  address?: string;
  phone?: string;
  website?: string;
}

export async function runLocalSeoAudit(input: LocalSeoAuditInput): Promise<LocalSeoAuditResult> {
  const response = await fetch('/api/local-seo-audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate Local SEO Audit report. Please try again.';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data;
}
