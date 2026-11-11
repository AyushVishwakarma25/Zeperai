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

  // Strictly enforce canonical domain https://www.zeperai.in
  const resolvedCanonical = React.useMemo(() => {
    let path = canonicalUrl || '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        const u = new URL(path);
        path = u.pathname + u.search;
      } catch {
        path = '';
      }
    }
    if (!path.startsWith('/')) path = '/' + path;
    
    // Always resolve to primary canonical domain
    return `https://www.zeperai.in${path}`;
  }, [canonicalUrl]);

  // Construct BreadcrumbList schema for structured search navigation
  const breadcrumbSchema = React.useMemo(() => {
    if (!resolvedCanonical || resolvedCanonical === 'https://www.zeperai.in/') return null;
    const urlObj = new URL(resolvedCanonical);
    const segments = urlObj.pathname.split('/').filter(Boolean);
    
    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.zeperai.in/',
      },
    ];

    let currentPath = '';
    segments.forEach((seg, idx) => {
      currentPath += `/${seg}`;
      const name = seg
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      items.push({
        '@type': 'ListItem',
        position: idx + 2,
        name,
        item: `https://www.zeperai.in${currentPath}`,
      });
    });

    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };
  }, [resolvedCanonical]);

  const allSchemas = [
    ...(breadcrumbSchema ? [breadcrumbSchema] : []),
    ...schemas,
  ];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <link rel="canonical" href={resolvedCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="ZeperAI Studio" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={resolvedCanonical} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Structured JSON-LD Schemas */}
      {allSchemas.map((s, index) => (
        <script key={`seo-schema-${index}`} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
};
