/**
 * Convert a PascalCase page name to a SEO-friendly hyphenated URL path.
 * Examples:
 *   "CompareRates" → "/compare-rates"
 *   "BillAnalyzer" → "/bill-analyzer"
 *   "FAQ" → "/faq"
 *   "Home" → "/"
 *   "NewYorkElectricity" → "/new-york-electricity"
 */
export function createPageUrl(pageName: string) {
  // The homepage lives at "/". "/home" exists only as a 301 to it, so returning
  // the hyphenated form here pointed the header logo — on every page of the
  // site — at a redirect, which is both wasted crawl budget and the reason
  // /home turns up in Search Console under "Page with redirect".
  if (pageName === 'Home') return '/';
  // Insert hyphens before uppercase letters that follow lowercase letters or other uppercase+lowercase sequences
  const hyphenated = pageName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')   // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2') // consecutive uppercase before lowercase
    .toLowerCase();
  return '/' + hyphenated;
}
