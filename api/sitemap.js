import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://electricscouts.com';

export default async function handler(req, res) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );

  const lastmod = new Date().toISOString().split('T')[0];

  // Static pages with SEO-friendly hyphenated URLs
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/compare-rates', priority: '1.0', changefreq: 'daily' },
    { url: '/bill-analyzer', priority: '0.9', changefreq: 'weekly' },
    { url: '/all-providers', priority: '0.9', changefreq: 'weekly' },
    { url: '/all-states', priority: '0.9', changefreq: 'weekly' },
    { url: '/all-cities', priority: '0.9', changefreq: 'weekly' },
    { url: '/learning-center', priority: '0.9', changefreq: 'weekly' },
    { url: '/renewable-energy', priority: '0.8', changefreq: 'weekly' },
    { url: '/savings-calculator', priority: '0.8', changefreq: 'weekly' },
    { url: '/faq', priority: '0.8', changefreq: 'monthly' },
    { url: '/about-us', priority: '0.7', changefreq: 'monthly' },
    { url: '/home-concierge', priority: '0.7', changefreq: 'monthly' },
    { url: '/blog', priority: '0.8', changefreq: 'daily' },
    { url: '/search', priority: '0.6', changefreq: 'weekly' },

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

    // Business pages
    { url: '/business-electricity', priority: '0.8', changefreq: 'weekly' },
    { url: '/business-hub', priority: '0.8', changefreq: 'weekly' },
    { url: '/business-compare-rates', priority: '0.8', changefreq: 'weekly' },
    { url: '/renewable-compare-rates', priority: '0.8', changefreq: 'weekly' },

    // Legal
    { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
  ];

  // Fetch dynamic content - articles
  let articlePages = [];
  try {
    const { data: articles } = await supabase
      .from('articles')
      .select('id, slug, updated_at, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (articles && articles.length > 0) {
      articlePages = articles.map(article => ({
        url: `/article/${article.slug || article.id}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: (article.updated_at || article.created_at || '').split('T')[0] || lastmod,
      }));
    }
  } catch (e) {
    // Articles table might not exist or have different schema
    console.log('Sitemap: Could not fetch articles:', e.message);
  }

  // Fetch dynamic content - providers
  let providerPages = [];
  try {
    const { data: providers } = await supabase
      .from('electricity_providers')
      .select('id, name, updated_at')
      .eq('is_active', true);

    if (providers && providers.length > 0) {
      providerPages = providers.map(provider => {
        const slug = provider.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return {
          url: `/provider/${slug}`,
          priority: '0.8',
          changefreq: 'weekly',
          lastmod: (provider.updated_at || '').split('T')[0] || lastmod,
        };
      });
    }
  } catch (e) {
    console.log('Sitemap: Could not fetch providers:', e.message);
  }

  const allPages = [...staticPages, ...providerPages, ...articlePages];

  const urls = allPages.map(page => {
    const pageLastmod = page.lastmod || lastmod;
    return `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${pageLastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(xml);
}
