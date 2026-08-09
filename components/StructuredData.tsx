import React from 'react';
import { Helmet } from 'react-helmet-async';

export const OrganizationSchema: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ZeperAI",
    "url": "https://zeperai.in",
    "logo": "https://zeperai.in/logo.png"
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const SoftwareAppSchema: React.FC = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ZeperAI",
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
