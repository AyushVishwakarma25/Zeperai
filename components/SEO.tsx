import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  schema?: Record<string, any> | Array<Record<string, any>>;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  canonicalUrl, 
  ogImage = 'https://www.zeperai.in/og-image.jpg',
  schema
}) => {
  const schemas = schema ? (Array.isArray(schema) ? schema : [schema]) : [];

  // Determine canonical URL dynamically:
  // 1. In browser runtime: align with active origin (prevents circular redirects between apex & www).
  // 2. In SSR / prerender: default to 'https://www.zeperai.in' because Vercel forwards zeperai.in -> www.zeperai.in.
  const resolvedCanonical = React.useMemo(() => {
    if (!canonicalUrl) return undefined;
    if (typeof window !== 'undefined' && window.location?.origin) {
      try {
        const parsed = new URL(canonicalUrl, window.location.origin);
        if (parsed.hostname === 'zeperai.in' || parsed.hostname === 'www.zeperai.in') {
          return `${window.location.origin}${parsed.pathname}${parsed.search}`;
        }
        return parsed.href;
      } catch {
        return canonicalUrl;
      }
    }
    try {
      const parsed = new URL(canonicalUrl);
      if (parsed.hostname === 'zeperai.in') {
        parsed.hostname = 'www.zeperai.in';
        return parsed.href;
      }
    } catch {
      // fallback
    }
    return canonicalUrl;
  }, [canonicalUrl]);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      {resolvedCanonical && <meta property="og:url" content={resolvedCanonical} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      {resolvedCanonical && <meta property="twitter:url" content={resolvedCanonical} />}
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Structured JSON-LD Schemas */}
      {schemas.map((s, index) => (
        <script key={`seo-schema-${index}`} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};
