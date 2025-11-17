/**
 * Utility to fix internal links in article content
 * Converts relative links to proper page URLs
 */

export function fixArticleLinks(htmlContent) {
  if (!htmlContent) return htmlContent;

  // Map of old link patterns to correct page names
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

  // Replace each mapped link
  Object.entries(linkMappings).forEach(([oldPath, pageName]) => {
    // Match href="oldPath" or href="/oldPath" (with or without trailing slash)
    const patterns = [
      new RegExp(`href=["']${oldPath}/?["']`, 'gi'),
      new RegExp(`href=["']${oldPath.substring(1)}/?["']`, 'gi'), // without leading slash
    ];
    
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
    'href="/app/ArticleDetail?id=$1"
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

  // Fix any remaining relative links that start with / and aren't external
  // This catches any links we might have missed
  fixedContent = fixedContent.replace(
    /href=["']\/((?!app\/|http|https|www|\#)[a-zA-Z0-9\-_]+)["']/gi,
    (match, path) => {
      // Convert kebab-case to PascalCase
      const pageName = path.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      return `href="/app/${pageName}"`;
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