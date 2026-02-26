/**
 * Dynamic Sitemap Manager
 * Generates XML sitemap and pings Google Search Console
 */

const SITE_URL = 'https://electricscouts.com';

// Generate dynamic sitemap XML from database content
export async function generateDynamicSitemap(articles = []) {
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/landing', priority: '1.0', changefreq: 'daily' },
    { url: '/compare-rates', priority: '1.0', changefreq: 'daily' },
    { url: '/business-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/business-compare-rates', priority: '0.9', changefreq: 'weekly' },
    { url: '/renewable-energy', priority: '0.9', changefreq: 'weekly' },
    { url: '/savings-calculator', priority: '0.9', changefreq: 'weekly' },
    { url: '/bill-analyzer', priority: '0.9', changefreq: 'weekly' },
    { url: '/all-providers', priority: '0.9', changefreq: 'weekly' },
    { url: '/all-states', priority: '0.9', changefreq: 'weekly' },
    { url: '/all-cities', priority: '0.9', changefreq: 'weekly' },
    { url: '/learning-center', priority: '0.9', changefreq: 'weekly' },
    { url: '/faq', priority: '0.9', changefreq: 'monthly' },
    { url: '/about-us', priority: '0.7', changefreq: 'monthly' },
    { url: '/home-concierge', priority: '0.7', changefreq: 'monthly' },
    
    // State pages
    { url: '/texas-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/illinois-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/ohio-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/pennsylvania-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/new-york-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/new-jersey-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/maryland-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/massachusetts-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/maine-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/new-hampshire-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/rhode-island-electricity', priority: '0.9', changefreq: 'weekly' },
    { url: '/connecticut-electricity', priority: '0.9', changefreq: 'weekly' },
    
    // Legal
    { url: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
    { url: '/terms-of-service', priority: '0.5', changefreq: 'yearly' }
  ];

  // Add dynamic article pages
  const articlePages = articles.map(article => {
    const articleData = article.data || article;
    const slug = articleData.slug || article.slug;
    const id = article.id;
    return {
      url: `/article/${slug || id}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: article.updated_date || article.created_date
    };
  });

  const allPages = [...staticPages, ...articlePages];
  const lastmod = new Date().toISOString().split('T')[0];

  const urls = allPages.map(page => {
    const pageLastmod = page.lastmod || lastmod;
    return `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${pageLastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}

// Ping Google Search Console about sitemap update
export async function pingGoogleSearchConsole(sitemapUrl = `${SITE_URL}/sitemap.xml`) {
  try {
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    // Make the ping request
    const response = await fetch(pingUrl, {
      method: 'GET',
      mode: 'no-cors'
    });
    
    console.log('✅ Google Search Console pinged successfully');
    return { success: true, message: 'Sitemap submitted to Google' };
  } catch (error) {
    console.error('❌ Failed to ping Google Search Console:', error);
    return { success: false, error: error.message };
  }
}

// Ping Bing Webmaster Tools
export async function pingBingWebmaster(sitemapUrl = `${SITE_URL}/sitemap.xml`) {
  try {
    const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    const response = await fetch(pingUrl, {
      method: 'GET',
      mode: 'no-cors'
    });
    
    console.log('✅ Bing Webmaster Tools pinged successfully');
    return { success: true, message: 'Sitemap submitted to Bing' };
  } catch (error) {
    console.error('❌ Failed to ping Bing:', error);
    return { success: false, error: error.message };
  }
}

// Ping all search engines
export async function pingAllSearchEngines(sitemapUrl = `${SITE_URL}/sitemap.xml`) {
  const results = await Promise.allSettled([
    pingGoogleSearchConsole(sitemapUrl),
    pingBingWebmaster(sitemapUrl)
  ]);
  
  return {
    google: results[0].status === 'fulfilled' ? results[0].value : { success: false },
    bing: results[1].status === 'fulfilled' ? results[1].value : { success: false }
  };
}

// Auto-trigger on content changes (call this after creating/updating articles)
export async function notifySearchEnginesOfUpdate() {
  console.log('🔔 Notifying search engines of content update...');
  const results = await pingAllSearchEngines();
  
  if (results.google.success || results.bing.success) {
    console.log('✅ Search engines notified successfully');
  } else {
    console.log('⚠️ Some search engines could not be notified');
  }
  
  return results;
}