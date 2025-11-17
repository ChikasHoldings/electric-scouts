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

  // First, fix any existing /app/ links that might be broken
  Object.entries(linkMappings).forEach(([oldPath, pageName]) => {
    // Fix /app/old-path format
    const kebabPath = oldPath.replace(/^\//, '');
    fixedContent = fixedContent.replace(
      new RegExp(`href=["']/app/${kebabPath}/?["']`, 'gi'),
      `href="/app/${pageName}"`
    );
  });

  // Replace each mapped link
  Object.entries(linkMappings).forEach(([oldPath, pageName]) => {
    // Escape special regex characters in the path
    const escapedPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match href="oldPath" or href="/oldPath" (with or without trailing slash)
    const patterns = [
      new RegExp(`href=["']${escapedPath}/?["']`, 'gi'),
    ];
    
    // Also handle paths without leading slash (if oldPath starts with /)
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

  // Remove links to non-existent pages by converting them to plain text
  // Match <a> tags with href to internal pages
  fixedContent = fixedContent.replace(
    /<a\s+([^>]*?)href=["']\/app\/([^"'?]+)(\?[^"']*)?["']([^>]*)>(.*?)<\/a>/gi,
    (match, beforeHref, pageName, queryString, afterHref, linkText) => {
      // Check if the page exists in our valid pages list
      if (validPages.includes(pageName)) {
        // Keep the link as is
        return match;
      } else {
        // Remove the link, keep only the text content
        return linkText;
      }
    }
  );

  // Also remove any remaining relative links that don't map to valid pages
  fixedContent = fixedContent.replace(
    /<a\s+([^>]*?)href=["']\/((?!app\/|http|https|www|\#)[a-zA-Z0-9\-_]+)["']([^>]*)>(.*?)<\/a>/gi,
    (match, beforeHref, path, afterHref, linkText) => {
      // Convert kebab-case to PascalCase to check if page exists
      const pageName = path.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      
      if (validPages.includes(pageName)) {
        // Fix the link to proper format
        return `<a ${beforeHref}href="/app/${pageName}"${afterHref}>${linkText}</a>`;
      } else {
        // Remove the link, keep only the text
        return linkText;
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