/**
 * Utility to fix internal links in article content
 * Converts relative links to proper page URLs and removes links to non-existent pages
 */

export function fixArticleLinks(htmlContent) {
  if (!htmlContent) return htmlContent;

  // List of valid pages that exist in the app
  const validPages = [
    'Home', 'CompareRates', 'LearningCenter', 'ArticleDetail', 'BillAnalyzer',
    'BusinessElectricity', 'RenewableEnergy', 'HomeConcierge', 'FAQ', 'AboutUs',
    'PrivacyPolicy', 'TermsOfService', 'AllStates', 'AllCities', 'AllProviders',
    'CityRates', 'ProviderDetails', 'TexasElectricity', 'PennsylvaniaElectricity',
    'IllinoisElectricity', 'OhioElectricity', 'NewYorkElectricity', 'NewJerseyElectricity',
    'MarylandElectricity', 'MassachusettsElectricity', 'MaineElectricity',
    'NewHampshireElectricity', 'RhodeIslandElectricity', 'ConnecticutElectricity'
  ];

  // Map of old link patterns to correct page names (only valid pages)
  const linkMappings = {
    // Core pages
    '/compare-rates': 'CompareRates',
    '/learning-center': 'LearningCenter',
    '/bill-analyzer': 'BillAnalyzer',
    '/business-electricity': 'BusinessElectricity',
    '/renewable-energy': 'RenewableEnergy',
    '/home-concierge': 'HomeConcierge',
    '/faq': 'FAQ',
    '/about-us': 'AboutUs',
    '/privacy-policy': 'PrivacyPolicy',
    '/terms-of-service': 'TermsOfService',
    '/': 'Home',
    '/home': 'Home',
    
    // State pages
    '/texas-electricity': 'TexasElectricity',
    '/pennsylvania-electricity': 'PennsylvaniaElectricity',
    '/illinois-electricity': 'IllinoisElectricity',
    '/ohio-electricity': 'OhioElectricity',
    '/new-york-electricity': 'NewYorkElectricity',
    '/new-jersey-electricity': 'NewJerseyElectricity',
    '/maryland-electricity': 'MarylandElectricity',
    '/massachusetts-electricity': 'MassachusettsElectricity',
    '/maine-electricity': 'MaineElectricity',
    '/new-hampshire-electricity': 'NewHampshireElectricity',
    '/rhode-island-electricity': 'RhodeIslandElectricity',
    '/connecticut-electricity': 'ConnecticutElectricity',
    
    // List pages
    '/all-states': 'AllStates',
    '/all-cities': 'AllCities',
    '/all-providers': 'AllProviders',
  };

  let fixedContent = htmlContent;

  // Step 1: Convert valid mapped links to proper format
  Object.entries(linkMappings).forEach(([oldPath, pageName]) => {
    const escapedPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`href=["']${escapedPath}/?["']`, 'gi'),
    ];
    
    if (oldPath.startsWith('/') && oldPath.length > 1) {
      patterns.push(new RegExp(`href=["']${escapedPath.substring(1)}/?["']`, 'gi'));
    }
    
    patterns.forEach(regex => {
      fixedContent = fixedContent.replace(regex, `href="/app/${pageName}"`);
    });
  });

  // Fix city-rates links (with query params)
  fixedContent = fixedContent.replace(
    /href=["']\/city-rates\?([^"']+)["']/gi,
    'href="/app/CityRates?$1"'
  );
  
  // Fix city-rates without leading slash
  fixedContent = fixedContent.replace(
    /href=["']city-rates\?([^"']+)["']/gi,
    'href="/app/CityRates?$1"'
  );

  // Fix any article links using old format
  fixedContent = fixedContent.replace(
    /href=["']\/article\?id=([^"']+)["']/gi,
    'href="/app/ArticleDetail?id=$1"'
  );
  
  // Fix article links without leading slash
  fixedContent = fixedContent.replace(
    /href=["']article\?id=([^"']+)["']/gi,
    'href="/app/ArticleDetail?id=$1"'
  );

  // Fix provider details links
  fixedContent = fixedContent.replace(
    /href=["']\/provider-details\?provider=([^"']+)["']/gi,
    'href="/app/ProviderDetails?provider=$1"'
  );
  
  fixedContent = fixedContent.replace(
    /href=["']provider-details\?provider=([^"']+)["']/gi,
    'href="/app/ProviderDetails?provider=$1"'
  );

  // Step 2: Remove ALL remaining internal links (anything not external)
  // Remove /app/ links that don't point to valid pages
  fixedContent = fixedContent.replace(
    /<a\s+([^>]*?)href=["']\/app\/([^"'?]+)(\?[^"']*)?["']([^>]*)>(.*?)<\/a>/gi,
    (match, beforeHref, pageName, queryString, afterHref, linkText) => {
      if (validPages.includes(pageName)) {
        return match; // Keep valid links
      } else {
        return linkText; // Remove invalid links, keep text
      }
    }
  );

  // Remove any relative links that aren't external or anchors
  fixedContent = fixedContent.replace(
    /<a\s+([^>]*?)href=["'](?!http|https:\/\/|www\.|mailto:|tel:|#)([^"']+)["']([^>]*)>(.*?)<\/a>/gi,
    (match, beforeHref, href, afterHref, linkText) => {
      // If it starts with /, remove leading slash and check
      const cleanPath = href.replace(/^\//, '').split('?')[0].split('#')[0];
      
      // Try to match to a valid page
      const pageName = cleanPath.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      
      if (validPages.includes(pageName)) {
        return `<a ${beforeHref}href="/app/${pageName}"${afterHref}>${linkText}</a>`;
      } else {
        return linkText; // Remove link, keep text
      }
    }
  );

  return fixedContent;
}

/**
 * Process article data object and fix all internal links
 */
export function fixArticleData(articleData) {
  if (!articleData) return articleData;

  return {
    ...articleData,
    content: fixArticleLinks(articleData.content)
  };
}