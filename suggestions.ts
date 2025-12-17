import { AppMode } from './types';

const influencerSuggestions = {
  beverage: [
    'Model holding the bottle, smiling at the camera.',
    'Pouring the drink into a glass with ice.',
    'A close-up of the glass, showing condensation, held by the model.',
    'Model taking a refreshing sip from the glass.',
    'Lifestyle shot with the model enjoying the drink at a cafe table.',
  ],
  snack: [
    'Model holding the snack packet looking excited.',
    'Tearing open the packet.',
    'Pouring the snacks into a bowl.',
    'A close-up of the model eating a piece.',
    'Model offering the snack to the camera.',
  ],
  skincare: [
    'Model holding the product next to their face.',
    'Squeezing a small amount of cream onto their finger.',
    'Gently applying the product to their cheek.',
    'Smiling, showing off a radiant skin result.',
    'Product displayed on a clean vanity next to the model.',
  ],
  gadget: [
    'Model unboxing the product with a look of awe.',
    'Holding the gadget and showcasing its main feature.',
    'Model actively using the gadget (e.g., listening to headphones).',
    'A close-up shot of the gadget in the model\'s hands.',
    'Lifestyle shot with the gadget integrated into a daily scene (e.g., desk, commute).',
  ],
  apparel: [
    'Model wearing the outfit, front view hero shot.',
    'A close-up shot showing fabric details or a logo.',
    'Model in a dynamic pose, showing the apparel in motion.',
    'A side view or back view of the outfit.',
    'Lifestyle shot of the model in a suitable environment (e.g., cafe, park).',
  ],
};

const productSuggestions = {
  beverage: [
    'Product standing next to a glass filled with ice.',
    'A dynamic shot of the beverage being poured into the glass.',
    'Close-up of the glass, full of the drink, with condensation.',
    'Product surrounded by its key ingredients (e.g., fruits, coffee beans).',
  ],
  snack: [
    'Product packet standing upright.',
    'Snacks spilling out of the packet artfully.',
    'A bowl filled with the snacks.',
    'A close-up, macro shot of a single piece showing texture.',
  ],
  skincare: [
    'Product standing on a clean surface.',
    'A texture smear of the cream/serum next to the product.',
    'Product with a single drop coming out of the dispenser.',
    'Product surrounded by its core natural ingredients (e.g., aloe, flowers).',
  ],
  gadget: [
    'Gadget on its stand or charger.',
    'A close-up shot highlighting a specific button or screen.',
    'Gadget placed in a lifestyle setting, like on a desk.',
    'An "exploded" view or components shown nearby.',
  ],
  apparel: [
    'A neatly folded shot of the apparel (flat lay).',
    'A close-up showing the fabric texture or a button detail.',
    'Apparel hanging on a stylish hanger.',
    'Multiple color variations shown together.',
  ],
};

const categoryKeywords = {
  beverage: ['beverage', 'drink', 'juice', 'soda', 'tea', 'coffee', 'shake'],
  snack: ['snack', 'chips', 'crisps', 'cookies', 'biscuits', 'oats', 'nuts', 'cereal'],
  skincare: ['skincare', 'cream', 'serum', 'lotion', 'moisturizer', 'face wash', 'sunscreen', 'cosmetic'],
  gadget: ['gadget', 'tech', 'phone', 'headphones', 'watch', 'device', 'electronics'],
  apparel: ['apparel', 'clothing', 'shirt', 'dress', 'jeans', 'outfit', 'wear', 'saree', 'kurta'],
};

type Category = keyof typeof categoryKeywords;

export const getStoryboardSuggestions = (productDescription: string, mode: AppMode): string[] => {
  const lowerDesc = productDescription.toLowerCase();
  const suggestionsSet = mode === AppMode.Influencer ? influencerSuggestions : productSuggestions;

  for (const category in categoryKeywords) {
    if (categoryKeywords[category as Category].some(keyword => lowerDesc.includes(keyword))) {
      return suggestionsSet[category as Category] || [];
    }
  }

  // Fallback if no specific category is found, return a generic but useful set.
  return mode === AppMode.Influencer ? influencerSuggestions.beverage : productSuggestions.beverage;
};