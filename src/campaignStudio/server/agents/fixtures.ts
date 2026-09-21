/** Test fixtures shared by the research and strategy agent tests. */
import type { BrandContext, CampaignRun, CompetitorResearch, MarketResearch } from '../../types.js';
import type { GenAIClientLike } from '../gemini.js';

export const BRAND: BrandContext = {
  brandName: 'Prustlr', website: 'https://prustlr.com/', category: 'Protein oats', summary: 'High-protein oats for busy people.', positioning: 'Breakfast without the fuss.',
  usps: ['20g protein per bowl', '2-minute prep'], products: [{ name: 'Choco Oats', description: 'Chocolate flavour', priceHint: 'INR 299', imageUrls: ['https://prustlr.com/choco.jpg'] }],
  audience: { primary: 'Busy urban professionals', painPoints: ['skip breakfast'], desires: ['easy protein'] },
  voice: { tone: ['friendly'], doSay: ['20g protein'], dontSay: ['miracle'] },
  visualIdentity: { colors: [{ name: 'Orange', hex: '#E4572E' }], typography: 'Bold sans', logoUrl: 'https://prustlr.com/logo.svg', styleKeywords: ['clean'] },
  markets: ['India'], sources: ['https://prustlr.com/'], gaps: [],
};

export const RUN: CampaignRun = {
  id: 'r1', user_id: 'u1', title: 'prustlr.com', input_type: 'website', website_url: 'https://prustlr.com/', brand_details: null, goal: 'sales', goal_notes: null,
  status: 'active', current_step: 'market_research', brand_context: BRAND, settings: { creativeCount: 5, quality: 'Standard', aspectRatio: '1:1' },
  credits_spent: 0, created_at: '', updated_at: '',
};

export const MARKET: MarketResearch = {
  category: 'Protein oats', marketSummary: 'Ready-to-eat protein breakfasts are growing among urban professionals in India.',
  trends: [{ trend: 'Protein-forward breakfasts', whyItMatters: 'Buyers look for protein on the label first.' }],
  customerInsights: [{ insight: 'Mornings are rushed', evidence: 'Forums and reviews mention 5-minute breakfasts.' }],
  seasonalMoments: [{ moment: 'New Year resolutions', timing: 'January', angle: 'Easy healthy habit' }],
  channelInsights: [{ channel: 'Instagram', insight: 'Short recipe reels convert.' }], opportunities: ['Own "2-minute protein"'], risks: ['Health-claim scrutiny'], gaps: [],
  sources: [{ title: 'example.com', url: 'https://example.com/a' }], grounded: true,
};

export const COMPETITORS: CompetitorResearch = {
  competitors: [{ name: 'Yoga Bar', website: 'https://yogabars.in/', positioning: 'Wholesome snacks for fitness lovers', strengths: ['Distribution'], weaknesses: ['Sugar concerns'], pricePoint: 'INR 250-400', adAngles: ['Clean label'], audienceFocus: 'Gym-goers' }],
  whiteSpace: ['Speed of preparation'], differentiators: ['20g protein in 2 minutes'], messagingToAvoid: ['guilt-free'], adPatterns: ['Ingredient close-ups'], gaps: [],
  sources: [{ title: 'example.org', url: 'https://example.org/b' }], grounded: true,
};

export const STRATEGY_JSON = {
  objective: 'Drive first purchases of Choco Oats among urban professionals in India', bigIdea: 'Breakfast in the time it takes to boil a kettle',
  positioningStatement: 'For busy professionals, Prustlr is the 2-minute high-protein breakfast.',
  audience: { primary: 'Urban professionals 25-38', insight: 'They skip breakfast because prep feels like a chore', mindset: 'Time-poor, health-aware' },
  keyMessages: [{ message: '20g protein in 2 minutes', proof: 'Product spec: 20g protein per bowl, 2-minute prep' }, { message: 'Real food, no fuss', proof: 'Brand positioning: breakfast without the fuss' }],
  funnelStage: 'conversion', offer: 'Free shipping on first order', cta: 'Order your first box',
  tone: ['friendly', 'direct'],
  contentPillars: [{ name: 'Speed', description: 'Show the 2-minute prep', exampleAd: 'Kettle vs bowl timer' }, { name: 'Protein proof', description: '20g protein facts', exampleAd: 'Label close-up' }],
  creativeMix: [{ pillar: 'Speed', count: 3 }, { pillar: 'Protein proof', count: 2 }],
  creativeFormats: [{ format: 'Product hero with timer', why: 'Makes the speed claim visual' }],
  successMetrics: ['Cost per purchase', 'Add-to-cart rate'], guardrails: ['No medical claims'], rationale: 'Speed is the white space competitors do not own.',
};

export const okReply = (obj: unknown, extra: Record<string, unknown> = {}) => ({
  text: typeof obj === 'string' ? obj : JSON.stringify(obj),
  candidates: [{ finishReason: 'STOP', ...(extra.candidate as object) }],
  usageMetadata: { totalTokenCount: 10 },
});

export function fakeGemini(replies: unknown[]) {
  const calls: any[] = [];
  const client: GenAIClientLike = {
    models: { async generateContent(args: any) { calls.push(args); return replies[Math.min(calls.length - 1, replies.length - 1)]; } },
  };
  return { client, calls };
}

export const groundedCandidate = (uris: Array<[string, string?]>) => ({
  candidate: { groundingMetadata: { groundingChunks: uris.map(([uri, title]) => ({ web: { uri, title } })) } },
});

export const promptOf = (call: any) => call.contents[0].parts[0].text as string;
export const deadline = () => Date.now() + 55_000;
