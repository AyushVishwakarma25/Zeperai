/**
 * CAMPAIGN STUDIO - agent registry. An agent that is not registered here answers
 * "coming soon" from the step engine. Chunk 7 adds bulk creative generation.
 */

import type { CampaignAgent } from '../../types.js';
import { brandAnalysisAgent } from './brandAnalysis.js';
import { competitorResearchAgent } from './competitorResearch.js';
import { creativeDirectionAgent } from './creativeDirection.js';
import { marketResearchAgent } from './marketResearch.js';
import { masterPromptsAgent } from './masterPrompts.js';
import { strategyAgent } from './strategy.js';
import type { AgentImpl } from './types.js';

export const AGENT_IMPLS: Partial<Record<CampaignAgent, AgentImpl>> = {
  brand_analysis: brandAnalysisAgent,
  market_research: marketResearchAgent,
  competitor_research: competitorResearchAgent,
  strategy: strategyAgent,
  creative_direction: creativeDirectionAgent,
  master_prompts: masterPromptsAgent,
};

export type { AgentImpl, AgentRunContext, AgentRunResult } from './types.js';
