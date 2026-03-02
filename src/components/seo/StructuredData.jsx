import React from "react";
import { validateSchema } from "./schemaValidator";

/**
 * StructuredData Component
 * Renders JSON-LD structured data for Google rich results
 * Automatically validates schemas in development
 */
export default function StructuredData({ schema, validate = true }) {
  // Validate schema in development
  if (validate && process.env.NODE_ENV === 'development') {
    const validation = validateSchema(schema);
    if (!validation.valid) {
      console.warn('⚠️ Schema Validation Warning:', validation.errors);
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Organization Schema - Site-wide
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Electric Scouts",
    "url": "https://www.electricscouts.com",
    "logo": "https://www.electricscouts.com/images/logo-header.png",
    "description": "Compare electricity rates from 40+ providers across 12 deregulated states. Save up to $800/year on your electricity bill.",
    "sameAs": [
      "https://facebook.com/electricscouts",
      "https://twitter.com/electricscouts",
      "https://linkedin.com/company/electricscouts"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@electricscouts.com",
      "areaServed": ["TX", "IL", "OH", "PA", "NY", "NJ", "MD", "MA", "ME", "NH", "RI", "CT"]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1200",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return <StructuredData schema={schema} />;
}

// Breadcrumb Schema Generator
export function BreadcrumbSchema({ items }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? `https://www.electricscouts.com${item.url}` : undefined
    }))
  };

  return <StructuredData schema={schema} />;
}

// FAQPage Schema
export function FAQPageSchema({ faqs }) {
  const schema = {
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
  };

  return <StructuredData schema={schema} />;
}

// Product Schema for Electricity Plans
export function ElectricityPlanSchema({ plan }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": plan.plan_name,
    "description": `${plan.plan_type} rate electricity plan from ${plan.provider_name}. ${plan.contract_length} month contract at ${plan.rate_per_kwh}¢/kWh`,
    "brand": {
      "@type": "Brand",
      "name": plan.provider_name
    },
    "offers": {
      "@type": "Offer",
      "price": plan.rate_per_kwh,
      "priceCurrency": "USD",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": plan.rate_per_kwh,
        "priceCurrency": "USD",
        "unitCode": "KWH",
        "unitText": "per kilowatt hour"
      },
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": plan.provider_name
      }
    },
    "aggregateRating": plan.rating ? {
      "@type": "AggregateRating",
      "ratingValue": plan.rating,
      "bestRating": "5"
    } : undefined
  };

  return <StructuredData schema={schema} />;
}

// LocalBusiness Schema for State/City Pages
export function LocalBusinessSchema({ location, avgRate, providerCount }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": `Electric Scouts - ${location} Electricity Comparison`,
    "description": `Compare electricity rates in ${location} from ${providerCount}+ providers. Average rate: ${avgRate}¢/kWh`,
    "areaServed": {
      "@type": "Place",
      "name": location
    },
    "serviceType": "Electricity Rate Comparison Service",
    "priceRange": "Free"
  };

  return <StructuredData schema={schema} />;
}

// Article Schema for Blog/Learning Center
export function ArticleSchema({ article }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.meta_description || article.excerpt,
    "image": article.featured_image,
    "datePublished": article.created_date,
    "dateModified": article.updated_date,
    "author": {
      "@type": "Organization",
      "name": article.author || "Electric Scouts Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Electric Scouts",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.electricscouts.com/images/logo-header.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.electricscouts.com/article/${article.slug}`
    }
  };

  return <StructuredData schema={schema} />;
}

// WebSite Schema with SearchAction
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Electric Scouts",
    "url": "https://www.electricscouts.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.electricscouts.com/compare-rates?zip={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return <StructuredData schema={schema} />;
}

// Service Schema for Business Electricity
export function ServiceSchema({ service }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": service.type,
    "provider": {
      "@type": "Organization",
      "name": "Electric Scouts"
    },
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "description": service.description,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return <StructuredData schema={schema} />;
}

// HowTo Schema for Guides
export function HowToSchema({ title, description, steps }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": title,
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.description
    }))
  };

  return <StructuredData schema={schema} />;
}

// ItemList Schema for Provider Listings
export function ItemListSchema({ items, listName }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "url": item.url
    }))
  };

  return <StructuredData schema={schema} />;
}