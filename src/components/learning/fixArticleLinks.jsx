/**
 * Utility to fix internal links in article content
 * Converts relative links to proper page URLs and removes links to non-existent pages
 */

export function fixArticleLinks(htmlContent) {
  if (!htmlContent) return htmlContent;

  let fixedContent = htmlContent;

  // Remove ALL internal links, keep only external links (http, https, mailto, tel)
  // This prevents 404 errors since we can't use React Router inside dangerouslySetInnerHTML
  fixedContent = fixedContent.replace(
    /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>(.*?)<\/a>/gi,
    (match, beforeHref, href, afterHref, linkText) => {
      // Keep external links (http, https, www, mailto, tel)
      if (
        href.startsWith('http://') || 
        href.startsWith('https://') || 
        href.startsWith('www.') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')
      ) {
        return match; // Keep external links and anchors
      } else {
        // Remove all internal links, keep only the text
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