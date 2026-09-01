import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Google Product Schema for ZeperAi Creative Studio Platform
 * Complies with schema.org/Product and Google Search Central rich snippet specifications.
 */
export const getGoogleProductSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "ZeperAi Studio - AI Ad Creative & Product Photography Suite",
  "image": [
    "https://zeperai.in/og-image.jpg",
    "https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/landing-assets/Ayush%20Vishwakarma%20Founder%20ZeperAi.jpeg"
  ],
  "description": "All-in-one AI creative platform for D2C brands and e-commerce growth. Generate conversion-optimized ad creatives, lifestyle product photography, and instant transparent cutouts in seconds.",
  "sku": "ZEPER-STUDIO-AI",
  "mpn": "ZEPER-2026-STUDIO",
  "brand": {
    "@type": "Brand",
    "name": "ZeperAi"
  },
  "category": "Software > Multimedia & Graphic Design Software",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "248",
    "bestRating": "5",
    "worstRating": "1"
  },
  "offers": {
    "@type": "AggregateOffer",
    "url": "https://zeperai.in/pricing",
    "priceCurrency": "INR",
    "lowPrice": "0",
    "highPrice": "4999",
    "offerCount": "4",
    "priceValidUntil": "2027-12-31",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Trial Plan",
        "price": "0",
        "priceCurrency": "INR",
        "priceValidUntil": "2027-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "url": "https://zeperai.in/signup",
        "seller": {
          "@type": "Organization",
          "name": "ZeperAi"
        }
      },
      {
        "@type": "Offer",
        "name": "Pay As You Go - 120 Credits",
        "price": "999",
        "priceCurrency": "INR",
        "priceValidUntil": "2027-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "url": "https://zeperai.in/pricing",
        "seller": {
          "@type": "Organization",
          "name": "ZeperAi"
        }
      },
      {
        "@type": "Offer",
        "name": "Pro Subscription - 300 Credits / mo",
        "price": "1999",
        "priceCurrency": "INR",
        "priceValidUntil": "2027-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "url": "https://zeperai.in/pricing",
        "seller": {
          "@type": "Organization",
          "name": "ZeperAi"
        }
      },
      {
        "@type": "Offer",
        "name": "Agency Plan - 1000 Credits / mo",
        "price": "4999",
        "priceCurrency": "INR",
        "priceValidUntil": "2027-12-31",
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "url": "https://zeperai.in/pricing",
        "seller": {
          "@type": "Organization",
          "name": "ZeperAi"
        }
      }
    ]
  }
});

/**
 * Google Product Schema for AI Background Remover Tool
 */
export const getBackgroundRemoverProductSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "ZeperAi Instant Background Remover Pro",
  "image": [
    "https://zeperai.in/og-image.jpg"
  ],
  "description": "High-precision AI background removal tool for e-commerce products, fashion models, and marketing assets. Instant transparent PNG download with zero halo artifacts.",
  "sku": "ZEPER-BG-REMOVER",
  "mpn": "ZEPER-TOOL-BG",
  "brand": {
    "@type": "Brand",
    "name": "ZeperAi"
  },
  "category": "Software > Photo & Graphic Design Software",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "192",
    "bestRating": "5",
    "worstRating": "1"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR",
    "priceValidUntil": "2027-12-31",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "url": "https://zeperai.in/tools/background-remover",
    "seller": {
      "@type": "Organization",
      "name": "ZeperAi"
    }
  }
});

/**
 * Individual Product Schemas for Pricing Page
 */
export const getPricingProductsSchema = () => [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ZeperAi Free Trial",
    "description": "10 free credits for 7 days to explore ZeperAi's AI product studio and creative workflows.",
    "sku": "ZEPER-PLAN-FREE",
    "brand": { "@type": "Brand", "name": "ZeperAi" },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-12-31",
      "url": "https://zeperai.in/signup"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ZeperAi Pay As You Go Pack",
    "description": "120 generation credits top-up pack with no expiration date, all studios unlocked, and full commercial usage rights.",
    "sku": "ZEPER-PLAN-PAYG",
    "brand": { "@type": "Brand", "name": "ZeperAi" },
    "offers": {
      "@type": "Offer",
      "price": "999",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-12-31",
      "url": "https://zeperai.in/pricing"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ZeperAi Pro Subscription",
    "description": "300 monthly credits, all flagship models unlocked, priority generation speed, high resolution exports, and commercial usage.",
    "sku": "ZEPER-PLAN-PRO",
    "brand": { "@type": "Brand", "name": "ZeperAi" },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "145",
      "bestRating": "5",
      "worstRating": "1"
    },
    "offers": {
      "@type": "Offer",
      "price": "1999",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-12-31",
      "url": "https://zeperai.in/pricing"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ZeperAi Agency Plan",
    "description": "1,000 monthly credits, multi-seat rights, all studios unlocked, and dedicated priority support for high-volume marketing teams.",
    "sku": "ZEPER-PLAN-AGENCY",
    "brand": { "@type": "Brand", "name": "ZeperAi" },
    "offers": {
      "@type": "Offer",
      "price": "4999",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2027-12-31",
      "url": "https://zeperai.in/pricing"
    }
  }
];

export const OrganizationSchema: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ZeperAi",
    "url": "https://zeperai.in",
    "logo": "https://zeperai.in/og-image.jpg",
    "founder": {
      "@type": "Person",
      "name": "Ayush Vishwakarma",
      "jobTitle": "Founder & Lead Engineer",
      "image": "https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/landing-assets/Ayush%20Vishwakarma%20Founder%20ZeperAi.jpeg"
    },
    "sameAs": [
      "https://instagram.com/sup_madman"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const ProductSchema: React.FC = () => {
  const schema = getGoogleProductSchema();
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const BackgroundRemoverProductSchema: React.FC = () => {
  const schema = getBackgroundRemoverProductSchema();
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const PricingProductSchema: React.FC = () => {
  const schemas = getPricingProductsSchema();
  return (
    <Helmet>
      {schemas.map((s, idx) => (
        <script key={`pricing-product-${idx}`} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};

export const SoftwareAppSchema: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ZeperAi",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "WebBrowser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "AI-powered creative platform for D2C brands offering AI background removal, ad creative generation, and product photography."
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const FAQSchema: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is ZeperAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ZeperAI is an AI-powered creative platform designed for D2C brands to effortlessly remove backgrounds, generate ad creatives, and create stunning product photography."
        }
      },
      {
        "@type": "Question",
        "name": "How does the AI background remover work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our advanced AI instantly detects the main subject in your product photos and removes the background with high precision in seconds, without any manual editing."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use ZeperAI for my Shopify store?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! ZeperAI provides tools and analytics tailored for e-commerce and integrates seamlessly with your D2C workflow, making it perfect for Shopify store owners."
        }
      },
      {
        "@type": "Question",
        "name": "What kind of ad creatives can I generate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can generate high-converting ad creatives for Facebook, Instagram, and Google Ads by simply uploading your product image and selecting a desired style or theme."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a free trial available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we offer a free tier that allows you to test our core features like background removal and basic ad generation before upgrading to a premium plan."
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
