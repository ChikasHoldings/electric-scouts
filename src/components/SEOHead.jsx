import React, { useEffect } from "react";

export default function SEOHead({ 
  title, 
  description, 
  canonical,
  keywords,
  image,
  type = "website",
  structuredData 
}) {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = title;
    }

    const siteUrl = window.location.origin;
    const fullUrl = canonical ? `${siteUrl}${canonical}` : window.location.href;
    const defaultImage = image || `${siteUrl}/og-image.png`;
    
    // Add preconnect for performance
    const addPreconnect = (href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        document.head.appendChild(link);
      }
    };
    
    addPreconnect('https://qtrypzzcjebvfcihiynt.supabase.co');
    addPreconnect('https://images.unsplash.com');

    // Helper function to update or create meta tag
    const updateMetaTag = (selector, attribute, content) => {
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

    // Update Open Graph tags
    updateMetaTag('meta[property="og:type"]', 'property', type);
    updateMetaTag('meta[property="og:url"]', 'property', fullUrl);
    updateMetaTag('meta[property="og:title"]', 'property', title);
    updateMetaTag('meta[property="og:description"]', 'property', description);
    updateMetaTag('meta[property="og:image"]', 'property', defaultImage);
    updateMetaTag('meta[property="og:site_name"]', 'property', "Power Scouts");

    // Update Twitter tags
    updateMetaTag('meta[name="twitter:card"]', 'name', "summary_large_image");
    updateMetaTag('meta[name="twitter:url"]', 'name', fullUrl);
    updateMetaTag('meta[name="twitter:title"]', 'name', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', description);
    updateMetaTag('meta[name="twitter:image"]', 'name', defaultImage);

    // Impact site verification
    updateMetaTag('meta[name="impact-site-verification"]', 'name', 'b525f1ec-7df1-4e7d-9920-d9d12cfb21f5');

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
      // Optional: clean up structured data when component unmounts
      const script = document.getElementById('structured-data-script');
      if (script) {
        script.remove();
      }
    };
  }, [title, description, canonical, keywords, image, type, structuredData]);

  return null;
}

// Helper function to generate Organization schema
export const getOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Power Scouts",
  "url": window.location.origin,
  "logo": `${window.location.origin}/logo.png`,
  "description": "Compare electricity rates from 40+ providers across 17 deregulated states. Save up to $800 per year on your electricity bills.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "support@powerscouts.com",
    "areaServed": ["US"],
    "availableLanguage": ["English"]
  },
  "sameAs": [
    "https://facebook.com/powerscouts",
    "https://twitter.com/powerscouts"
  ]
});

// Helper function to generate Service schema
export const getServiceSchema = (state) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Electricity Rate Comparison",
  "provider": {
    "@type": "Organization",
    "name": "Power Scouts"
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
    "name": "Power Scouts"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Power Scouts",
    "logo": {
      "@type": "ImageObject",
      "url": `${window.location.origin}/logo.png`
    }
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
  "name": `Power Scouts - ${cityName} Electricity Comparison`,
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