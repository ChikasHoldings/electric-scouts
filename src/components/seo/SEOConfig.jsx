/**
 * SEO Configuration & Optimization Utilities
 * Central hub for all SEO-related metadata, keywords, and optimization rules
 */

// Core brand keywords
export const BRAND_KEYWORDS = {
  primary: ['electricity rates', 'compare electricity', 'power rates', 'energy plans'],
  secondary: ['electric company', 'utility provider', 'energy savings', 'switch providers'],
  location: ['Texas electricity', 'deregulated states', 'local power rates'],
  action: ['compare rates', 'switch providers', 'save on electricity', 'find best rates']
};

// State-specific SEO data
export const STATE_SEO_DATA = {
  TX: {
    title: 'Compare Texas Electricity Rates - Save Up to $800/Year',
    description: 'Compare electricity rates from 45+ Texas providers. Find the lowest rates in Houston, Dallas, Austin & all TX cities. Switch in 5 minutes.',
    keywords: 'texas electricity rates, compare texas power rates, cheap electricity texas, houston electricity, dallas power rates',
    h1: 'Texas Electricity Rates - Compare & Save',
    content: 'Texas has the most competitive deregulated electricity market in the US'
  },
  IL: {
    title: 'Illinois Electricity Rates - Compare 36+ Providers',
    description: 'Compare Illinois electricity rates in Chicago, Aurora, Naperville & all IL cities. Find the best energy plans and save up to $700/year.',
    keywords: 'illinois electricity rates, chicago electricity, compare illinois power, energy rates illinois',
    h1: 'Illinois Electricity Rates Comparison',
    content: 'Illinois offers competitive electricity rates across Chicagoland and statewide'
  },
  OH: {
    title: 'Ohio Electricity Rates - Compare & Switch Providers',
    description: 'Compare Ohio electricity rates from 40+ providers. Serving Columbus, Cleveland, Cincinnati & all OH areas. Save hundreds annually.',
    keywords: 'ohio electricity rates, columbus electricity, cleveland power rates, compare ohio energy',
    h1: 'Ohio Electricity Rate Comparison',
    content: 'Ohio\'s deregulated market offers competitive rates statewide'
  },
  PA: {
    title: 'Pennsylvania Electricity Rates - Best PA Energy Plans',
    description: 'Compare Pennsylvania electricity rates in Philadelphia, Pittsburgh & statewide. 38+ providers. Find the lowest rates and save.',
    keywords: 'pennsylvania electricity rates, philly electricity, pittsburgh power, pa energy rates',
    h1: 'Pennsylvania Electricity Rates',
    content: 'Pennsylvania consumers save an average of $750/year by comparing rates'
  },
  NY: {
    title: 'New York Electricity Rates - Compare NY Energy Plans',
    description: 'Compare New York electricity rates from 42+ providers. Serving NYC, Buffalo, Rochester & all NY. Switch and save on your energy bill.',
    keywords: 'new york electricity rates, nyc electricity, compare ny power, new york energy',
    h1: 'New York Electricity Rate Comparison',
    content: 'New York offers diverse energy plans with competitive pricing'
  },
  NJ: {
    title: 'New Jersey Electricity Rates - Compare NJ Power Plans',
    description: 'Compare NJ electricity rates from 35+ providers. Serving Newark, Jersey City & all NJ areas. Find the best rates and save.',
    keywords: 'new jersey electricity rates, nj power rates, compare nj electricity, newark energy',
    h1: 'New Jersey Electricity Rates',
    content: 'New Jersey consumers can choose from dozens of competitive providers'
  },
  MD: {
    title: 'Maryland Electricity Rates - Compare MD Energy Plans',
    description: 'Compare Maryland electricity rates in Baltimore, Columbia & statewide. 32+ providers offering competitive rates.',
    keywords: 'maryland electricity rates, baltimore electricity, md power rates, compare maryland energy',
    h1: 'Maryland Electricity Rate Comparison',
    content: 'Maryland\'s competitive market delivers significant savings opportunities'
  },
  MA: {
    title: 'Massachusetts Electricity Rates - Compare MA Power Plans',
    description: 'Compare Massachusetts electricity rates from 34+ providers. Serving Boston, Worcester, Springfield & all MA cities.',
    keywords: 'massachusetts electricity rates, boston electricity, ma power rates, compare mass energy',
    h1: 'Massachusetts Electricity Rates',
    content: 'Massachusetts offers competitive electricity rates with green energy options'
  },
  ME: {
    title: 'Maine Electricity Rates - Compare ME Energy Providers',
    description: 'Compare Maine electricity rates from 22+ providers. Serving Portland, Lewiston, Bangor & all ME areas.',
    keywords: 'maine electricity rates, portland me electricity, maine power rates, compare maine energy',
    h1: 'Maine Electricity Rate Comparison',
    content: 'Maine consumers benefit from deregulated electricity competition'
  },
  NH: {
    title: 'New Hampshire Electricity Rates - Compare NH Power',
    description: 'Compare New Hampshire electricity rates from 25+ providers. Serving Manchester, Nashua, Concord & all NH.',
    keywords: 'new hampshire electricity rates, nh power rates, manchester electricity, compare nh energy',
    h1: 'New Hampshire Electricity Rates',
    content: 'New Hampshire offers competitive rates and renewable energy options'
  },
  RI: {
    title: 'Rhode Island Electricity Rates - Compare RI Energy Plans',
    description: 'Compare Rhode Island electricity rates from 26+ providers. Serving Providence, Warwick, Cranston & all RI.',
    keywords: 'rhode island electricity rates, providence electricity, ri power rates, compare ri energy',
    h1: 'Rhode Island Electricity Rates',
    content: 'Rhode Island consumers can access competitive electricity rates'
  },
  CT: {
    title: 'Connecticut Electricity Rates - Compare CT Power Plans',
    description: 'Compare Connecticut electricity rates from 30+ providers. Serving Hartford, New Haven, Stamford & all CT.',
    keywords: 'connecticut electricity rates, hartford electricity, ct power rates, compare ct energy',
    h1: 'Connecticut Electricity Rate Comparison',
    content: 'Connecticut offers diverse energy plans at competitive prices'
  }
};

// Generate SEO-optimized title
export function generateSEOTitle(page, location, customTitle) {
  if (customTitle) return customTitle;
  
  const base = 'Electric Scouts';
  const suffix = '| Compare Electricity Rates';
  
  const titles = {
    home: `${base} - Compare Electricity Rates from 40+ Providers`,
    landing: `Save Up to $800/Year on Electricity | ${base}`,
    compare: `Compare Electricity Rates - Find Best Plans | ${base}`,
    business: `Business Electricity Rates - Commercial Energy | ${base}`,
    renewable: `100% Renewable Energy Plans | ${base}`,
    calculator: `Electricity Savings Calculator | ${base}`,
    faq: `Electricity FAQ - Common Questions Answered | ${base}`,
    about: `About ${base} - Your Trusted Energy Comparison Platform`,
    providers: `Top Electricity Providers - Compare 40+ Companies | ${base}`
  };
  
  return titles[page] || `${page} ${suffix}`;
}

// Generate SEO-optimized meta description
export function generateMetaDescription(page, stats) {
  const descriptions = {
    home: `Compare electricity rates from 40+ trusted providers across 12 deregulated states. Find the lowest rates, switch in 5 minutes, and save up to $800/year. 100% free service.`,
    landing: `Stop overpaying for electricity. Compare rates from 40+ providers in under 2 minutes. Free, fast comparison tool. Save $67/month on average. No credit card required.`,
    compare: `Compare electricity plans from top providers. See rates, contract terms, and renewable options side-by-side. Find the perfect plan for your usage and budget.`,
    business: `Compare commercial electricity rates for small businesses, large facilities, and industrial operations. Custom quotes for tiered pricing and demand charges. Save $5,000+ annually.`,
    renewable: `Find 100% renewable electricity plans from top green energy providers. Compare rates for wind and solar power. Go green without paying premium prices.`
  };
  
  return descriptions[page] || `Compare electricity rates and plans with Electric Scouts. Free service across 12 states.`;
}

// Generate keyword-rich content snippets
export function getKeywordSnippet(topic) {
  const snippets = {
    'compare-rates': 'Compare electricity rates from top providers to find the best energy plan for your home or business. See real-time rates, contract options, and estimated monthly costs.',
    'switch-providers': 'Switching electricity providers is fast and easy. Compare rates online, choose your plan, and switch in 5 minutes. Your power stays on during the entire transition.',
    'save-money': 'Save money on electricity by comparing rates from 40+ providers. The average customer saves $67 per month by switching to a better plan.',
    'deregulated-states': 'Deregulated electricity markets in TX, IL, OH, PA, NY, NJ, MD, MA, ME, NH, RI, and CT allow you to choose your electricity provider and potentially save hundreds per year.',
    'renewable-energy': '100% renewable electricity plans from wind and solar sources are now competitively priced. Go green without paying premium rates.',
    'business-electricity': 'Commercial electricity rates for businesses include tiered pricing, demand charges, and custom contracts. Compare rates to reduce operational costs significantly.'
  };
  
  return snippets[topic] || '';
}

// Image alt text generator
export function generateAltText(imageType, context) {
  const templates = {
    logo: 'Electric Scouts logo - Compare electricity rates and save on energy bills',
    hero: `${context} electricity rates comparison tool - Find the best energy plans`,
    provider: `${context} electricity provider logo - Compare rates and plans`,
    state: `${context} electricity rate map - Compare power providers by city`,
    chart: `${context} electricity rate comparison chart - Visual rate analysis`,
    icon: `${context} icon representing electricity savings and rate comparison`
  };
  
  return templates[imageType] || `${context} - Electric Scouts electricity comparison`;
}

// Internal linking suggestions
export function getInternalLinks(currentPage) {
  const links = {
    home: [
      { url: '/compare-rates', text: 'Compare Electricity Rates', keyword: 'compare electricity rates' },
      { url: '/faq', text: 'Electricity FAQ', keyword: 'electricity questions' },
      { url: '/business-electricity', text: 'Business Rates', keyword: 'commercial electricity' }
    ],
    article: [
      { url: '/compare-rates', text: 'Start comparing rates', keyword: 'compare rates' },
      { url: '/savings-calculator', text: 'Calculate your savings', keyword: 'savings calculator' },
      { url: '/learning-center', text: 'More energy guides', keyword: 'electricity guides' }
    ],
    state: [
      { url: '/compare-rates', text: 'Compare rates in your area', keyword: 'local electricity rates' },
      { url: '/all-providers', text: 'View all providers', keyword: 'electricity providers' },
      { url: '/faq', text: 'Common questions', keyword: 'electricity FAQ' }
    ]
  };
  
  return links[currentPage] || links.home;
}

// Canonical URL generator
export function generateCanonicalURL(path) {
  const baseURL = 'https://www.electricscouts.com';
  return `${baseURL}${path}`;
}

// Breadcrumb generator for SEO
export function generateBreadcrumbs(path) {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'Home', url: '/' }];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const name = segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    breadcrumbs.push({ name, url: currentPath });
  });
  
  return breadcrumbs;
}

// Open Graph data generator
export function generateOGData(page, customData = {}) {
  const baseData = {
    type: 'website',
    siteName: 'Electric Scouts',
    locale: 'en_US',
    image: '/images/og-image.jpg',
    imageWidth: 1200,
    imageHeight: 630
  };
  
  return { ...baseData, ...customData };
}

// Twitter Card data generator
export function generateTwitterData(customData = {}) {
  const baseData = {
    card: 'summary_large_image',
    site: '@electricscouts',
    creator: '@electricscouts'
  };
  
  return { ...baseData, ...customData };
}

// Robots meta tag generator
export function getRobotsTag(pageType) {
  const config = {
    public: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    noindex: 'noindex, nofollow',
    system: 'noindex, nofollow',
    thankyou: 'noindex, follow'
  };
  
  return config[pageType] || config.public;
}

// Core Web Vitals optimization hints
export const PERFORMANCE_HINTS = {
  lazyLoadImages: true,
  preconnectDomains: ['https://iwguavsojnbzveutwzpw.supabase.co'],
  prefetchPages: ['/compare-rates', '/business-electricity', '/faq'],
  criticalCSS: true,
  deferNonCriticalJS: true
};