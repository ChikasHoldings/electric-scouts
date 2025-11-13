import React from "react";
import { Helmet } from "react-helmet";

export default function SEOHead({ 
  title, 
  description, 
  canonical,
  keywords,
  image,
  type = "website",
  structuredData 
}) {
  const siteUrl = window.location.origin;
  const fullUrl = canonical ? `${siteUrl}${canonical}` : window.location.href;
  const defaultImage = image || `${siteUrl}/og-image.png`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={defaultImage} />
      <meta property="og:site_name" content="Power Scouts" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={defaultImage} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
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
    "telephone": "+1-855-475-8315",
    "contactType": "Customer Service",
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