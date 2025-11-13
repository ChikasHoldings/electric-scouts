import React from "react";
import SEOHead, { getOrganizationSchema, getServiceSchema, getBreadcrumbSchema } from "../SEOHead";

/**
 * AutoSEO Component - Automatically generates SEO meta tags based on page context
 * 
 * Usage:
 * <AutoSEO 
 *   pageType="state" 
 *   pageName="Texas Electricity"
 *   location="Texas"
 *   customData={{ avgRate: "9.2¢", providers: 45 }}
 * />
 */

// SEO Templates for different page types
const seoTemplates = {
  home: {
    title: "Compare Electricity Rates - Save Up to $800/Year | Power Scouts",
    description: "Compare electricity rates from 40+ providers in 12 deregulated states. Find the best electricity plan - fixed rates, renewable energy, variable plans. Free comparison tool.",
    keywords: "compare electricity rates, electricity providers, energy comparison, electricity plans, power companies, cheap electricity",
  },
  
  state: {
    titleTemplate: (state) => `${state} Electricity Rates - Compare Plans & Save | Power Scouts`,
    descriptionTemplate: (state, data) => `Compare ${state} electricity rates from ${data?.providers || '40+'} providers. Find cheap electricity plans in ${state}. Fixed rates, renewable energy, and variable plans. Save up to $${data?.avgSavings || '800'}/year.`,
    keywordsTemplate: (state) => `${state} electricity rates, ${state} electricity providers, ${state} energy plans, ${state} power companies, cheap electricity ${state}`,
  },
  
  city: {
    titleTemplate: (city, state) => `${city} Electricity Rates - Compare ${city}, ${state} Plans | Power Scouts`,
    descriptionTemplate: (city, state, data) => `Compare electricity rates in ${city}, ${state} from ${data?.providers || '40+'} providers. Average rates from ${data?.avgRate || '8.9¢/kWh'}. Find cheap electricity plans in ${city}. Free comparison.`,
    keywordsTemplate: (city, state) => `${city} electricity rates, ${city} ${state} electricity, ${city} power companies, electricity providers ${city}`,
  },
  
  provider: {
    titleTemplate: (provider) => `${provider} Electricity Plans & Rates - Reviews & Comparison | Power Scouts`,
    descriptionTemplate: (provider, data) => `Compare ${provider} electricity plans and rates. Read reviews, check availability in your area, and find the best ${provider} plan. Starting rates from ${data?.minRate || '8.9¢/kWh'}.`,
    keywordsTemplate: (provider) => `${provider} electricity, ${provider} rates, ${provider} plans, ${provider} reviews, ${provider} energy`,
  },
  
  comparison: {
    title: "Compare Electricity Rates - Free Instant Comparison | Power Scouts",
    description: "Compare electricity rates from 40+ providers instantly. Enter your ZIP code to see available plans, rates, and estimated bills. 100% free, no credit card required.",
    keywords: "compare electricity rates, electricity comparison tool, compare energy plans, electricity rate comparison",
  },
  
  resource: {
    titleTemplate: (topic) => `${topic} - Electricity Guide & Resources | Power Scouts`,
    descriptionTemplate: (topic) => `Learn about ${topic.toLowerCase()} with our comprehensive electricity guide. Expert advice, tips, and resources to help you save on your electricity bills.`,
    keywordsTemplate: (topic) => `${topic.toLowerCase()}, electricity guide, energy tips, electricity resources`,
  }
};

export default function AutoSEO({ 
  pageType = "home",
  pageName = "",
  location = "",
  state = "",
  city = "",
  customData = {},
  customTitle = null,
  customDescription = null,
  customKeywords = null,
  breadcrumbs = null,
  canonical = null
}) {
  
  // Generate SEO content based on page type
  const generateSEO = () => {
    const template = seoTemplates[pageType];
    
    if (!template) {
      return seoTemplates.home;
    }
    
    let title, description, keywords;
    
    switch (pageType) {
      case "state":
        title = customTitle || template.titleTemplate(location || state);
        description = customDescription || template.descriptionTemplate(location || state, customData);
        keywords = customKeywords || template.keywordsTemplate(location || state);
        break;
        
      case "city":
        title = customTitle || template.titleTemplate(city, state);
        description = customDescription || template.descriptionTemplate(city, state, customData);
        keywords = customKeywords || template.keywordsTemplate(city, state);
        break;
        
      case "provider":
        title = customTitle || template.titleTemplate(pageName);
        description = customDescription || template.descriptionTemplate(pageName, customData);
        keywords = customKeywords || template.keywordsTemplate(pageName);
        break;
        
      case "resource":
        title = customTitle || template.titleTemplate(pageName);
        description = customDescription || template.descriptionTemplate(pageName);
        keywords = customKeywords || template.keywordsTemplate(pageName);
        break;
        
      default:
        title = customTitle || template.title;
        description = customDescription || template.description;
        keywords = customKeywords || template.keywords;
    }
    
    return { title, description, keywords };
  };
  
  const seo = generateSEO();
  
  // Generate structured data
  const generateStructuredData = () => {
    const data = [getOrganizationSchema()];
    
    // Add service schema for location-based pages
    if (pageType === "state" || pageType === "city") {
      data.push(getServiceSchema(location || state));
    }
    
    // Add breadcrumb schema if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      data.push(getBreadcrumbSchema(breadcrumbs));
    }
    
    return data;
  };
  
  return (
    <SEOHead
      title={seo.title}
      description={seo.description}
      keywords={seo.keywords}
      canonical={canonical}
      structuredData={generateStructuredData()}
    />
  );
}

// Export helper function to generate SEO for any page
export const generatePageSEO = (pageType, options = {}) => {
  const template = seoTemplates[pageType];
  
  if (!template) {
    return seoTemplates.home;
  }
  
  return {
    title: options.title || (template.titleTemplate ? template.titleTemplate(options.name, options.data) : template.title),
    description: options.description || (template.descriptionTemplate ? template.descriptionTemplate(options.name, options.data) : template.description),
    keywords: options.keywords || (template.keywordsTemplate ? template.keywordsTemplate(options.name) : template.keywords)
  };
};