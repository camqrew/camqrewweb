import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
  keywords?: string;
  noindex?: boolean;
  schema?: Record<string, any>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  canonical,
  keywords,
  noindex = false,
  schema,
}) => {
  const defaultTitle = 'Camqrew - Creative Marketplace & Production Crews';
  const defaultDesc = 'Hire verified photographers, cinematographers, drone pilots, and rent cinema gear anywhere in India with milestone escrow protection.';
  const defaultImage = 'https://camqrew.in/og-image.jpg';

  const siteUrl = 'https://camqrew.in';
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : siteUrl);
  const canonicalUrl = canonical || (currentUrl.split('?')[0]);

  const effectiveTitle = title 
    ? (title.includes('Camqrew') ? title : `${title} | Camqrew`) 
    : defaultTitle;
  const effectiveDesc = description || defaultDesc;
  const effectiveImage = image || defaultImage;

  return (
    <Helmet>
      {/* Title & Core Meta */}
      <title>{effectiveTitle}</title>
      <meta name="description" content={effectiveDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Crawl Control */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph Tags */}
      <meta property="og:site_name" content="Camqrew" />
      <meta property="og:title" content={effectiveTitle} />
      <meta property="og:description" content={effectiveDesc} />
      <meta property="og:image" content={effectiveImage} />
      <meta property="og:image:secure_url" content={effectiveImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@camqrew" />
      <meta name="twitter:title" content={effectiveTitle} />
      <meta name="twitter:description" content={effectiveDesc} />
      <meta name="twitter:image" content={effectiveImage} />

      {/* Optional Structured Data JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
