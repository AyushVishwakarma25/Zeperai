/** Test fixtures shared by the research, strategy, creative direction and master prompts agent tests. */
import type { BrandContext, CampaignRun, CampaignStrategy, CompetitorResearch, MarketResearch } from '../../types.js';
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

export const STRATEGY: CampaignStrategy = JSON.parse(JSON.stringify(STRATEGY_JSON));

export const CREATIVE_DIRECTION_JSON = {
  visualTheme: 'Bright morning kitchens, real bowls, no stock-photo gloss',
  moodKeywords: ['fresh', 'fast', 'honest'],
  colorGuidance: 'Lean on the brand orange as an accent against warm neutrals.',
  typographyGuidance: 'Bold, rounded sans-serif for headlines.',
  photographyStyle: 'Natural light, slightly overhead angle, real kitchen textures.',
  concepts: [
    { pillar: 'Speed', headline: 'Ready before the kettle', subheadline: 'Two minutes, done', visualIdea: 'A steaming bowl next to a kitchen timer at 0:02', storyline: 'Someone about to leave for work grabs breakfast without slowing down.', cta: 'Order your first box', composition: 'Overhead shot, bowl centered, timer in soft focus foreground' },
    { pillar: 'Speed', headline: 'Breakfast, solved', visualIdea: 'Hands pouring hot water into the bowl', storyline: 'The whole prep in one motion.', cta: 'Order your first box', composition: 'Close crop on hands and bowl, steam visible' },
    { pillar: 'Speed', headline: 'No time, no problem', visualIdea: 'A commuter eating from the bowl on a train seat', storyline: 'Breakfast fits into a rushed morning commute.', cta: 'Order your first box', composition: 'Side angle, shallow depth of field, train window blur behind' },
    { pillar: 'Protein proof', headline: '20g protein, one bowl', visualIdea: 'Close-up of the nutrition label protein line highlighted', storyline: 'The number that matters, front and center.', cta: 'Order your first box', composition: 'Macro shot of label with bowl blurred behind' },
    { pillar: 'Protein proof', headline: 'Real fuel, real fast', visualIdea: 'Ingredients (oats, whey) arranged around the bowl', storyline: 'Transparency about what is actually inside.', cta: 'Order your first box', composition: 'Flat lay, ingredients radiating from the bowl' },
  ],
  thingsToAvoid: ['Gym clichés', 'Overly staged stock-photo breakfasts'],
};

export const MASTER_PROMPTS_JSON = {
  prompts: [
    { conceptId: 'speed-1', headline: 'Ready before the kettle boils', cta: 'Order now', imagePrompt: 'Overhead photo of a steaming bowl of chocolate oats next to a kitchen timer showing 0:02, warm morning light, wooden table, orange accent napkin' },
    { conceptId: 'speed-2', headline: 'Breakfast, solved in one pour', cta: 'Order now', imagePrompt: 'Close-up of hands pouring hot water into a bowl of oats, steam rising, soft natural light, shallow depth of field' },
    { conceptId: 'speed-3', headline: 'Breakfast that keeps up with you', cta: 'Order now', imagePrompt: 'Person eating from a bowl while seated on a train, motion blur through the window, warm tones' },
    { conceptId: 'protein-proof-1', headline: '20 grams of protein, zero effort', cta: 'Order now', imagePrompt: 'Macro shot of a nutrition label highlighting 20g protein, blurred bowl of oats in the background, clean lighting' },
    { conceptId: 'protein-proof-2', headline: 'Real ingredients, real fuel', cta: 'Order now', imagePrompt: 'Flat lay of oats, whey powder and a finished bowl arranged on a wooden surface, overhead natural light' },
  ],
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
