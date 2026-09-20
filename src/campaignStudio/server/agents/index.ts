/**
 * CAMPAIGN STUDIO - agent registry. An agent that is not registered here answers
 * "coming soon" from the step engine. Chunks 5-6 add the remaining agents.
 */

import type { CampaignAgent } from '../../types.js';
import { brandAnalysisAgent } from './brandAnalysis.js';
import type { AgentImpl } from './types.js';

export const AGENT_IMPLS: Partial<Record<CampaignAgent, AgentImpl>> = {
  brand_analysis: brandAnalysisAgent,
};

export type { AgentImpl, AgentRunContext, AgentRunResult } from './types.js';
