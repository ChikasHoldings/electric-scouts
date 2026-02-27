import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://electricscouts.com';

// All cities with their state codes for programmatic city pages
const CITY_PAGES = [
  // Texas
  { city: "Houston", state: "TX" }, { city: "Dallas", state: "TX" }, { city: "Austin", state: "TX" },
  { city: "San Antonio", state: "TX" }, { city: "Fort Worth", state: "TX" }, { city: "Arlington", state: "TX" },
  { city: "Plano", state: "TX" }, { city: "Corpus Christi", state: "TX" }, { city: "El Paso", state: "TX" },
  { city: "Lubbock", state: "TX" }, { city: "Irving", state: "TX" }, { city: "Frisco", state: "TX" },
  { city: "McKinney", state: "TX" }, { city: "Killeen", state: "TX" }, { city: "Midland", state: "TX" },
  // Illinois
  { city: "Chicago", state: "IL" }, { city: "Aurora", state: "IL" }, { city: "Naperville", state: "IL" },
  { city: "Rockford", state: "IL" }, { city: "Joliet", state: "IL" }, { city: "Springfield", state: "IL" },
  { city: "Peoria", state: "IL" }, { city: "Elgin", state: "IL" }, { city: "Champaign", state: "IL" },
  { city: "Schaumburg", state: "IL" },
  // Ohio
  { city: "Columbus", state: "OH" }, { city: "Cleveland", state: "OH" }, { city: "Cincinnati", state: "OH" },
  { city: "Toledo", state: "OH" }, { city: "Akron", state: "OH" }, { city: "Dayton", state: "OH" },
  { city: "Canton", state: "OH" }, { city: "Youngstown", state: "OH" },
  // Pennsylvania
  { city: "Philadelphia", state: "PA" }, { city: "Pittsburgh", state: "PA" }, { city: "Allentown", state: "PA" },
  { city: "Reading", state: "PA" }, { city: "Erie", state: "PA" }, { city: "Scranton", state: "PA" },
  { city: "Bethlehem", state: "PA" }, { city: "Lancaster", state: "PA" },
  // New York
  { city: "New York City", state: "NY" }, { city: "Buffalo", state: "NY" }, { city: "Rochester", state: "NY" },
  { city: "Syracuse", state: "NY" }, { city: "Albany", state: "NY" }, { city: "Yonkers", state: "NY" },
  // New Jersey
  { city: "Newark", state: "NJ" }, { city: "Paterson", state: "NJ" }, { city: "Edison", state: "NJ" },
  { city: "Trenton", state: "NJ" }, { city: "Camden", state: "NJ" }, { city: "Hoboken", state: "NJ" },
  // Maryland
  { city: "Baltimore", state: "MD" }, { city: "Columbia", state: "MD" }, { city: "Germantown", state: "MD" },
  { city: "Silver Spring", state: "MD" }, { city: "Annapolis", state: "MD" }, { city: "Frederick", state: "MD" },
  // Massachusetts
  { city: "Boston", state: "MA" }, { city: "Worcester", state: "MA" }, { city: "Springfield", state: "MA" },
  { city: "Cambridge", state: "MA" }, { city: "Lowell", state: "MA" }, { city: "New Bedford", state: "MA" },
  // Maine
  { city: "Portland", state: "ME" }, { city: "Lewiston", state: "ME" }, { city: "Bangor", state: "ME" },
  { city: "Auburn", state: "ME" }, { city: "Augusta", state: "ME" },
  // New Hampshire
  { city: "Manchester", state: "NH" }, { city: "Nashua", state: "NH" }, { city: "Concord", state: "NH" },
  { city: "Dover", state: "NH" }, { city: "Rochester", state: "NH" },
  // Rhode Island
  { city: "Providence", state: "RI" }, { city: "Warwick", state: "RI" }, { city: "Cranston", state: "RI" },
  { city: "Pawtucket", state: "RI" }, { city: "East Providence", state: "RI" },
  // Connecticut
  { city: "Bridgeport", state: "CT" }, { city: "New Haven", state: "CT" }, { city: "Hartford", state: "CT" },
  { city: "Stamford", state: "CT" }, { city: "Waterbury", state: "CT" }, { city: "Norwalk", state: "CT" },
];

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

    // Learning Center Articles (SEO-optimized)
    { url: '/article?id=6', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=7', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=8', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=9', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=10', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=11', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=12', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=13', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=14', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=15', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=1', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=2', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=3', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=4', priority: '0.8', changefreq: 'monthly' },
    { url: '/article?id=5', priority: '0.8', changefreq: 'monthly' },

    // Legal
    { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
  ];

  // Generate city page URLs programmatically
  const cityPages = CITY_PAGES.map(({ city, state }) => ({
    url: `/city-rates?city=${encodeURIComponent(city)}&state=${state}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

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
    // Articles table might not exist
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
    // Providers table might not exist
  }

  const allPages = [...staticPages, ...cityPages, ...providerPages, ...articlePages];

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
