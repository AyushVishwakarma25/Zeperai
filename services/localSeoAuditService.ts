/**
 * FILE: src/services/localSeoAuditService.ts
 * PURPOSE: Service for ZeperAi Local SEO Audit micro-SaaS.
 * Complies with strict 3-phase execution workflow and JSON/Markdown schemas.
 */

import { supabase } from './supabaseClient.js';

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
  remainingAudits?: number;
  isFreeAudit?: boolean;
}

export interface LocalSeoAuditInput {
  businessDescription: string;
  location: string;
  businessName?: string;
  address?: string;
  phone?: string;
  website?: string;
}

export interface LocalSeoQuotaInfo {
  success: boolean;
  isAuthenticated: boolean;
  remainingAudits: number;
  freeAuditAvailable: boolean;
  canAudit: boolean;
  userTier?: string;
}

export class LocalSeoAuditError extends Error {
  requiresPurchase?: boolean;
  requiresAuth?: boolean;
  status?: number;

  constructor(message: string, options?: { requiresPurchase?: boolean; requiresAuth?: boolean; status?: number }) {
    super(message);
    this.name = 'LocalSeoAuditError';
    this.requiresPurchase = options?.requiresPurchase;
    this.requiresAuth = options?.requiresAuth;
    this.status = options?.status;
  }
}

export async function getLocalSeoQuota(): Promise<LocalSeoQuotaInfo> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch('/api/local-seo-audit/quota', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Failed to fetch local SEO quota:', e);
  }

  // Local fallback
  const freeUsed = typeof localStorage !== 'undefined' && localStorage.getItem('zeperai_local_seo_free_used') === 'true';
  return {
    success: true,
    isAuthenticated: false,
    remainingAudits: freeUsed ? 0 : 1,
    freeAuditAvailable: !freeUsed,
    canAudit: !freeUsed
  };
}

export async function runLocalSeoAudit(input: LocalSeoAuditInput): Promise<LocalSeoAuditResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch('/api/local-seo-audit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to generate Local SEO Audit report. Please try again.';
    let requiresPurchase = false;
    let requiresAuth = false;

    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
      requiresPurchase = !!errorData.requiresPurchase;
      requiresAuth = !!errorData.requiresAuth;
    } catch {
      // fallback
    }

    if (response.status === 402 || response.status === 403) {
      requiresPurchase = true;
    } else if (response.status === 401) {
      requiresAuth = true;
    }

    throw new LocalSeoAuditError(errorMsg, {
      requiresPurchase,
      requiresAuth,
      status: response.status
    });
  }

  const data = await response.json();
  // Mark local free usage tracking
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('zeperai_local_seo_free_used', 'true');
  }
  return data;
}
