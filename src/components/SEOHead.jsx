import React, { useEffect } from "react";

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

    const siteUrl = window.location.origin;
    const fullUrl = canonical ? `${siteUrl}${canonical}` : window.location.href;
    
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
    addPreconnect('https://images.unsplash.com');

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

// Helper function to generate Organization schema
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Electric Scouts",
  "url": window.location.origin,
  "logo": `${window.location.origin}/logo.png`,
  "description": "Compare electricity rates from 40+ providers across 13 deregulated states. Save up to $800 per year on your electricity bills.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "support@electricscouts.com",
    "areaServed": ["US"],
    "availableLanguage": ["English"]
  },
  "sameAs": [
    "https://facebook.com/electricscouts",
    "https://twitter.com/electricscouts",
    "https://linkedin.com/company/electricscouts",
    "https://instagram.com/electricscouts"
  ]
});

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
    "url": window.location.origin
  },
  "publisher": {
    "@type": "Organization",
    "name": "Electric Scouts",
    "logo": {
      "@type": "ImageObject",
      "url": `${window.location.origin}/logo.png`,
      "width": 200,
      "height": 60
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": article.url || window.location.href
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
    "item": `${window.location.origin}${item.url}`
  }))
});

// Helper function to generate LocalBusiness schema
export const getLocalBusinessSchema = (cityName, stateName, countyName) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": `Electric Scouts - ${cityName} Electricity Comparison`,
  "description": `Compare electricity rates and save money in ${cityName}, ${stateName}`,
  "url": window.location.origin,
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
  "url": url || window.location.href,
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
    "url": item.url ? `${window.location.origin}${item.url}` : undefined
  }))
});

// Helper function to generate SearchAction schema
export const getSearchActionSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": window.location.origin,
  "name": "Electric Scouts",
  "description": "Compare electricity rates from 40+ providers across 13 deregulated states",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${window.location.origin}/compare-rates?zip={search_term_string}`
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
  "description": "Free electricity rate comparison tool covering 40+ providers across 13 deregulated US states"
});
