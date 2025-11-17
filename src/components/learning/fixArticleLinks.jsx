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
    '/faq': 'FAQ',
    '/about-us': 'AboutUs',
    
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
    
    // Special city rates format - keep as is, it uses URL params correctly
    // '/city-rates?city=': 'CityRates'
  };

  let fixedContent = htmlContent;

  // Replace each mapped link
  Object.entries(linkMappings).forEach(([oldPath, pageName]) => {
    // Match href="oldPath" (with or without trailing slash)
    const regex = new RegExp(`href=["']${oldPath}/?["']`, 'g');
    fixedContent = fixedContent.replace(regex, `href="/app/${pageName}"`);
  });

  // Fix city-rates links specifically (they have query params)
  fixedContent = fixedContent.replace(
    /href=["']\/city-rates\?([^"']+)["']/g,
    'href="/app/CityRates?$1"'
  );

  // Fix any article links that might be using old format
  // Links to other articles should use: /app/ArticleDetail?id={id}
  fixedContent = fixedContent.replace(
    /href=["']\/article\?id=([^"']+)["']/g,
    'href="/app/ArticleDetail?id=$1"'
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