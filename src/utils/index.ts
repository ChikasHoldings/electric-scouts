/**
 * Convert a PascalCase page name to a SEO-friendly hyphenated URL path.
 * Examples:
 *   "CompareRates" → "/compare-rates"
 *   "BillAnalyzer" → "/bill-analyzer"
 *   "FAQ" → "/faq"
 *   "Home" → "/home"
 *   "NewYorkElectricity" → "/new-york-electricity"
 */
export function createPageUrl(pageName: string) {
  // Insert hyphens before uppercase letters that follow lowercase letters or other uppercase+lowercase sequences
  const hyphenated = pageName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')   // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // consecutive uppercase before lowercase
    .toLowerCase();
  return '/' + hyphenated;
}
