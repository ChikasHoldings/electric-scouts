import { useEffect } from "react";
import { SITE_URL, absoluteUrl } from "@/seo/site";
import { standaloneOrganizationSchema } from "@/seo/organization";

/**
 * Injects per-page metadata into <head>. Every prop is optional; a page passes
 * only what it needs.
 *
 * @param {object} props
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.canonical] Path only, e.g. "/texas-electricity".
 * @param {string} [props.keywords]
 * @param {string} [props.image] Absolute URL of the social share image.
 * @param {string} [props.type] Open Graph type; "website" or "article".
 * @param {object|object[]} [props.structuredData]
 * @param {string|number} [props.imageWidth]
 * @param {string|number} [props.imageHeight]
 * @param {string} [props.imageAlt]
 * @param {string} [props.locale]
 * @param {string} [props.articlePublishedTime]
 * @param {string} [props.articleModifiedTime]
 * @param {string} [props.articleAuthor]
 * @param {string} [props.articleSection]
 * @param {string[]} [props.articleTags]
 * @param {string} [props.twitterCreator]
 * @param {boolean} [props.noindex] Emit "noindex, nofollow" instead of the
 *   default indexable directive.
 */
export default function SEOHead({
  title,
  description,
  canonical,
  keywords,
  image,
  type = "website",
  structuredData,
  // New social-specific props
  imageWidth,
  imageHeight,
  imageAlt,
  locale = "en_US",
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
  articleTags,
  twitterCreator,
  noindex = false
}) {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = title;
    }

    // Canonical URLs are always built from the fixed production origin, never
    // from window.location.origin: on a preview deployment or on the apex
    // domain (which redirects to www) that would emit a canonical pointing at
    // the wrong host. Falling back to window.location.pathname — not .href —
    // keeps query-string variants such as /compare-rates?planType=fixed
    // canonicalizing to the single clean URL instead of each spawning its own.
    const siteUrl = SITE_URL;
    const fullUrl = absoluteUrl(canonical || window.location.pathname);

    // Page-specific OG image mapping
    const getPageSpecificImage = () => {
      if (image) return image;
      const path = window.location.pathname;
      if (path.includes('/compare-rates')) return `${siteUrl}/images/og-compare.jpg`;
      if (path.includes('/bill-analyzer')) return `${siteUrl}/images/og-bill-analyzer.jpg`;
      if (path.includes('/providers')) return `${siteUrl}/images/og-providers.jpg`;
      if (path.includes('/business-rates')) return `${siteUrl}/images/og-business.jpg`;
      if (path.includes('/learning-center') || path.includes('/learn/')) return `${siteUrl}/images/og-learn.jpg`;
      if (path.includes('/electricity-rates') || path.includes('/service-areas')) return `${siteUrl}/images/og-service-areas.jpg`;
      return `${siteUrl}/images/og-default.jpg`;
    };
    
    const defaultImage = getPageSpecificImage();
    const ogImageWidth = imageWidth || "1200";
    const ogImageHeight = imageHeight || "630";
    const ogImageAlt = imageAlt || title || "Electric Scouts - Compare Electricity Rates";
    
    // Add preconnect for performance
    const addPreconnect = (href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        document.head.appendChild(link);
      }
    };
    
    addPreconnect('https://iwguavsojnbzveutwzpw.supabase.co');

    // Helper function to update or create meta tag
    const updateMetaTag = (selector, attribute, content) => {
      if (!content) return;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (attribute === 'property') {
          element.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
        } else {
          element.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Update basic meta tags
    if (description) {
      updateMetaTag('meta[name="description"]', 'name', description);
    }
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', 'name', keywords);
    }
    
    // Robots meta tag
    if (noindex) {
      updateMetaTag('meta[name="robots"]', 'name', 'noindex, nofollow');
    } else {
      updateMetaTag('meta[name="robots"]', 'name', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Open Graph tags — comprehensive
    updateMetaTag('meta[property="og:type"]', 'property', type);
    updateMetaTag('meta[property="og:url"]', 'property', fullUrl);
    updateMetaTag('meta[property="og:title"]', 'property', title);
    updateMetaTag('meta[property="og:description"]', 'property', description);
    updateMetaTag('meta[property="og:image"]', 'property', defaultImage);
    updateMetaTag('meta[property="og:image:width"]', 'property', ogImageWidth);
    updateMetaTag('meta[property="og:image:height"]', 'property', ogImageHeight);
    updateMetaTag('meta[property="og:image:alt"]', 'property', ogImageAlt);
    updateMetaTag('meta[property="og:image:type"]', 'property', 'image/png');
    updateMetaTag('meta[property="og:site_name"]', 'property', "Electric Scouts");
    updateMetaTag('meta[property="og:locale"]', 'property', locale);
    
    // Article-specific OG tags (for blog posts/articles)
    if (type === 'article') {
      updateMetaTag('meta[property="article:published_time"]', 'property', articlePublishedTime);
      updateMetaTag('meta[property="article:modified_time"]', 'property', articleModifiedTime);
      updateMetaTag('meta[property="article:author"]', 'property', articleAuthor || 'Electric Scouts');
      updateMetaTag('meta[property="article:section"]', 'property', articleSection);
      if (articleTags && articleTags.length > 0) {
        articleTags.forEach((tag, i) => {
          updateMetaTag(`meta[property="article:tag:${i}"]`, 'property', tag);
        });
      }
    }

    // Twitter Card tags — comprehensive
    updateMetaTag('meta[name="twitter:card"]', 'name', "summary_large_image");
    updateMetaTag('meta[name="twitter:site"]', 'name', "@electricscouts");
    updateMetaTag('meta[name="twitter:creator"]', 'name', twitterCreator || "@electricscouts");
    updateMetaTag('meta[name="twitter:url"]', 'name', fullUrl);
    updateMetaTag('meta[name="twitter:title"]', 'name', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', defaultImage);
    updateMetaTag('meta[name="twitter:image:alt"]', 'name', ogImageAlt);
    
    // Additional SEO meta tags
    updateMetaTag('meta[name="author"]', 'name', 'Electric Scouts');
    updateMetaTag('meta[name="geo.region"]', 'name', 'US');
    updateMetaTag('meta[name="geo.placename"]', 'name', 'United States');
    updateMetaTag('meta[name="rating"]', 'name', 'general');

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullUrl);

    // Add structured data
    if (structuredData) {
      const scriptId = 'structured-data-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(Array.isArray(structuredData) ? structuredData : [structuredData]);
    }

    // Cleanup function
    return () => {
      // Clean up structured data when component unmounts
      const script = document.getElementById('structured-data-script');
      if (script) {
        script.remove();
      }
    };
  }, [title, description, canonical, keywords, image, type, structuredData, imageWidth, imageHeight, imageAlt, locale, articlePublishedTime, articleModifiedTime, articleAuthor, articleSection, articleTags, twitterCreator, noindex]);

  return null;
}

// Organization schema, from the one definition the prerenderer also uses. This
// component appends its JSON-LD next to the block the prerenderer already
// wrote, so a rendered page carries two Organization nodes; sharing an @id is
// what tells Google they are one entity rather than two.
export const getOrganizationSchema = () => standaloneOrganizationSchema();

// Helper function to generate Service schema
export const getServiceSchema = (state) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Electricity Rate Comparison",
  "provider": {
    "@type": "Organization",
    "name": "Electric Scouts"
  },
  "areaServed": {
    "@type": "State",
    "name": state || "Multiple States"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Electricity Plans",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Fixed Rate Electricity Plans"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Variable Rate Electricity Plans"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Renewable Energy Plans"
        }
      }
    ]
  }
});

// Helper function to generate FAQPage schema
export const getFAQSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

// Helper function to generate Article schema
export const getArticleSchema = (article) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.description,
  "image": article.image,
  "datePublished": article.datePublished,
  "dateModified": article.dateModified || article.datePublished,
  "author": {
    "@type": "Organization",
    "name": "Electric Scouts",
    "url": SITE_URL
  },
  "publisher": {
    "@type": "Organization",
    "name": "Electric Scouts",
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}/images/logo-header.png`,
      "width": 200,
      "height": 60
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": absoluteUrl(article.url || window.location.pathname)
  }
});

// Helper function to generate BreadcrumbList schema
export const getBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `${SITE_URL}${item.url}`
  }))
});

// Helper function to generate LocalBusiness schema
export const getLocalBusinessSchema = (cityName, stateName, countyName) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": `Electric Scouts - ${cityName} Electricity Comparison`,
  "description": `Compare electricity rates and save money in ${cityName}, ${stateName}`,
  "url": SITE_URL,
  "areaServed": {
    "@type": "City",
    "name": cityName,
    "containedInPlace": {
      "@type": "State",
      "name": stateName
    }
  }
});

// Helper function to generate Product schema (for plans)
export const getProductSchema = (plan, estimatedCost) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": plan.plan_name,
  "description": `${plan.plan_type} electricity plan from ${plan.provider_name}`,
  "brand": {
    "@type": "Brand",
    "name": plan.provider_name
  },
  "offers": {
    "@type": "Offer",
    "price": estimatedCost || plan.rate_per_kwh,
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": plan.rate_per_kwh,
      "priceCurrency": "USD",
      "unitText": "per kWh"
    }
  }
});

// Helper function to generate Review/Rating schema
export const getAggregateRatingSchema = (providerName, rating, reviewCount) => ({
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  "itemReviewed": {
    "@type": "Service",
    "name": `${providerName} Electricity Service`
  },
  "ratingValue": rating,
  "bestRating": "5",
  "worstRating": "1",
  "ratingCount": reviewCount
});

// Helper function to generate WebPage schema
export const getWebPageSchema = (title, description, url) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": title,
  "description": description,
  "url": url || absoluteUrl(window.location.pathname),
  "publisher": {
    "@type": "Organization",
    "name": "Electric Scouts"
  }
});

// Helper function to generate HowTo schema
export const getHowToSchema = (name, description, steps) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": name,
  "description": description,
  "step": steps.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "name": step.name,
    "text": step.text
  }))
});

// Helper function to generate ItemList schema
export const getItemListSchema = (name, items) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": name,
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "url": item.url ? `${SITE_URL}${item.url}` : undefined
  }))
});

// Helper function to generate SearchAction schema
export const getSearchActionSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": SITE_URL,
  "name": "Electric Scouts",
  "description": "Compare electricity plans from competing suppliers across 12 deregulated US states",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${SITE_URL}/compare-rates?zip={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
});

// Helper function to generate SoftwareApplication schema (for the comparison tool)
export const getSoftwareApplicationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Electric Scouts Rate Comparison Tool",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Free electricity rate comparison tool covering 12 deregulated US states"
});
