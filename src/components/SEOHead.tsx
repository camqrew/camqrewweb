import React, { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  url,
  type = 'profile',
}) => {
  useEffect(() => {
    const defaultTitle = 'Camcrew - Creative Marketplace & Production Crews';
    const defaultDesc = 'Hire verified photographers, cinematographers, drone pilots, and rent cinema gear anywhere in India with milestone escrow protection.';
    const defaultImage = 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200';
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://camcrew.in');

    const effectiveTitle = title ? `${title} | Camcrew` : defaultTitle;
    const effectiveDesc = description || defaultDesc;
    const effectiveImage = image || defaultImage;

    // 1. Update document title
    document.title = effectiveTitle;

    // Helper to set or create meta tag
    const setMetaTag = (attribute: 'property' | 'name', name: string, content: string) => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Set Open Graph tags
    setMetaTag('property', 'og:title', effectiveTitle);
    setMetaTag('property', 'og:description', effectiveDesc);
    setMetaTag('property', 'og:image', effectiveImage);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:type', type);

    // 3. Set Twitter Card tags
    setMetaTag('name', 'twitter:title', effectiveTitle);
    setMetaTag('name', 'twitter:description', effectiveDesc);
    setMetaTag('name', 'twitter:image', effectiveImage);

    // Also update standard description
    setMetaTag('name', 'description', effectiveDesc);

    return () => {
      // Revert to defaults on cleanup
      document.title = defaultTitle;
      setMetaTag('property', 'og:title', defaultTitle);
      setMetaTag('property', 'og:description', defaultDesc);
      setMetaTag('property', 'og:image', defaultImage);
      setMetaTag('property', 'og:type', 'website');
      setMetaTag('name', 'twitter:title', defaultTitle);
      setMetaTag('name', 'twitter:description', defaultDesc);
      setMetaTag('name', 'twitter:image', defaultImage);
      setMetaTag('name', 'description', defaultDesc);
    };
  }, [title, description, image, url, type]);

  return null;
};
