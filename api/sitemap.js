import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://www.electricscouts.com';

// State code to slug mapping for clean URLs
const STATE_SLUGS = {
  TX: 'texas', IL: 'illinois', OH: 'ohio', PA: 'pennsylvania',
  NY: 'new-york', NJ: 'new-jersey', MD: 'maryland', MA: 'massachusetts',
  ME: 'maine', NH: 'new-hampshire', RI: 'rhode-island', CT: 'connecticut'
};

// Helper: convert city name to URL slug
function cityToSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}

// All cities with their state codes for programmatic city pages
const CITY_PAGES = [
  // Texas
  { city: "Houston", state: "TX" }, { city: "Dallas", state: "TX" }, { city: "Austin", state: "TX" },
  { city: "San Antonio", state: "TX" }, { city: "Fort Worth", state: "TX" }, { city: "Arlington", state: "TX" },
  { city: "Plano", state: "TX" }, { city: "Corpus Christi", state: "TX" }, { city: "El Paso", state: "TX" },
  { city: "Lubbock", state: "TX" }, { city: "Irving", state: "TX" }, { city: "Frisco", state: "TX" },
  { city: "McKinney", state: "TX" }, { city: "Killeen", state: "TX" }, { city: "Midland", state: "TX" },
  { city: "Amarillo", state: "TX" }, { city: "Beaumont", state: "TX" }, { city: "Brownsville", state: "TX" },
  { city: "Denton", state: "TX" }, { city: "Garland", state: "TX" }, { city: "Grand Prairie", state: "TX" },
  { city: "Laredo", state: "TX" }, { city: "McAllen", state: "TX" }, { city: "Round Rock", state: "TX" },
  { city: "Sugar Land", state: "TX" },
  // Illinois
  { city: "Chicago", state: "IL" }, { city: "Aurora", state: "IL" }, { city: "Naperville", state: "IL" },
  { city: "Rockford", state: "IL" }, { city: "Joliet", state: "IL" }, { city: "Springfield", state: "IL" },
  { city: "Peoria", state: "IL" }, { city: "Elgin", state: "IL" }, { city: "Champaign", state: "IL" },
  { city: "Schaumburg", state: "IL" },
  { city: "Bloomington", state: "IL" }, { city: "Cicero", state: "IL" }, { city: "Decatur", state: "IL" },
  { city: "Evanston", state: "IL" }, { city: "Oak Park", state: "IL" }, { city: "Waukegan", state: "IL" },
  // Ohio
  { city: "Columbus", state: "OH" }, { city: "Cleveland", state: "OH" }, { city: "Cincinnati", state: "OH" },
  { city: "Toledo", state: "OH" }, { city: "Akron", state: "OH" }, { city: "Dayton", state: "OH" },
  { city: "Canton", state: "OH" }, { city: "Youngstown", state: "OH" },
  { city: "Dublin", state: "OH" }, { city: "Elyria", state: "OH" }, { city: "Hamilton", state: "OH" },
  { city: "Lakewood", state: "OH" }, { city: "Lorain", state: "OH" }, { city: "Parma", state: "OH" },
  // Pennsylvania
  { city: "Philadelphia", state: "PA" }, { city: "Pittsburgh", state: "PA" }, { city: "Allentown", state: "PA" },
  { city: "Reading", state: "PA" }, { city: "Erie", state: "PA" }, { city: "Scranton", state: "PA" },
  { city: "Bethlehem", state: "PA" }, { city: "Lancaster", state: "PA" },
  { city: "Chester", state: "PA" }, { city: "Harrisburg", state: "PA" }, { city: "Norristown", state: "PA" },
  { city: "State College", state: "PA" }, { city: "Wilkes-Barre", state: "PA" }, { city: "York", state: "PA" },
  // New York
  { city: "New York City", state: "NY" }, { city: "Buffalo", state: "NY" }, { city: "Rochester", state: "NY" },
  { city: "Syracuse", state: "NY" }, { city: "Albany", state: "NY" }, { city: "Yonkers", state: "NY" },
  { city: "Binghamton", state: "NY" }, { city: "Hempstead", state: "NY" }, { city: "Long Beach", state: "NY" },
  { city: "New Rochelle", state: "NY" }, { city: "Schenectady", state: "NY" }, { city: "White Plains", state: "NY" },
  // New Jersey
  { city: "Newark", state: "NJ" }, { city: "Paterson", state: "NJ" }, { city: "Edison", state: "NJ" },
  { city: "Trenton", state: "NJ" }, { city: "Camden", state: "NJ" }, { city: "Hoboken", state: "NJ" },
  { city: "Jersey City", state: "NJ" }, { city: "Atlantic City", state: "NJ" }, { city: "Bayonne", state: "NJ" },
  { city: "Clifton", state: "NJ" }, { city: "Elizabeth", state: "NJ" }, { city: "Toms River", state: "NJ" },
  // Maryland
  { city: "Baltimore", state: "MD" }, { city: "Columbia", state: "MD" }, { city: "Germantown", state: "MD" },
  { city: "Silver Spring", state: "MD" }, { city: "Annapolis", state: "MD" }, { city: "Frederick", state: "MD" },
  { city: "Rockville", state: "MD" }, { city: "Bowie", state: "MD" }, { city: "Gaithersburg", state: "MD" },
  { city: "Hagerstown", state: "MD" }, { city: "Waldorf", state: "MD" },
  // Massachusetts
  { city: "Boston", state: "MA" }, { city: "Worcester", state: "MA" }, { city: "Springfield", state: "MA" },
  { city: "Cambridge", state: "MA" }, { city: "Lowell", state: "MA" }, { city: "New Bedford", state: "MA" },
  { city: "Brockton", state: "MA" }, { city: "Fall River", state: "MA" }, { city: "Quincy", state: "MA" },
  { city: "Somerville", state: "MA" },
  // Maine
  { city: "Portland", state: "ME" }, { city: "Lewiston", state: "ME" }, { city: "Bangor", state: "ME" },
  { city: "Auburn", state: "ME" }, { city: "Augusta", state: "ME" },
  { city: "Biddeford", state: "ME" }, { city: "South Portland", state: "ME" },
  // New Hampshire
  { city: "Manchester", state: "NH" }, { city: "Nashua", state: "NH" }, { city: "Concord", state: "NH" },
  { city: "Dover", state: "NH" }, { city: "Rochester", state: "NH" },
  { city: "Keene", state: "NH" }, { city: "Laconia", state: "NH" },
  // Rhode Island
  { city: "Providence", state: "RI" }, { city: "Warwick", state: "RI" }, { city: "Cranston", state: "RI" },
  { city: "Pawtucket", state: "RI" }, { city: "East Providence", state: "RI" },
  { city: "Newport", state: "RI" }, { city: "Woonsocket", state: "RI" },
  // Connecticut
  { city: "Bridgeport", state: "CT" }, { city: "New Haven", state: "CT" }, { city: "Hartford", state: "CT" },
  { city: "Stamford", state: "CT" }, { city: "Waterbury", state: "CT" }, { city: "Norwalk", state: "CT" },
  { city: "Danbury", state: "CT" }, { city: "Meriden", state: "CT" }, { city: "New Britain", state: "CT" },
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
    // Note: /blog removed (duplicate of /learning-center), /landing removed (duplicate of /)

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

  // Generate city page URLs with clean SEO-friendly paths
  const cityPages = CITY_PAGES.map(({ city, state }) => ({
    url: `/electricity-rates/${STATE_SLUGS[state]}/${cityToSlug(city)}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  // Fetch dynamic content - articles (use clean /learn/ URLs)
  let articlePages = [];
  try {
    const { data: articles } = await supabase
      .from('articles')
      .select('id, slug, updated_at, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (articles && articles.length > 0) {
      articlePages = articles.map(article => ({
        url: `/learn/${article.slug || article.id}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: (article.updated_at || article.created_at || '').split('T')[0] || lastmod,
      }));
    }
  } catch (e) {
    // Articles table might not exist
  }

  // Fallback: ensure all local articles are in sitemap even if not in DB
  const localArticleIds = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
    38, 39, 40, 41, 42, 43, 44, 45,
    46, 47, 48, 49, 50, 51,
    52, 53, 54, 55, 56,
    57, 58, 59, 60, 61,
    62, 63, 64, 65,
    66, 67, 68, 69, 70, 106, 107, 108
  ];
  const existingSlugs = new Set(articlePages.map(a => a.url));
  localArticleIds.forEach(id => {
    const url = `/learn/${id}`;
    if (!existingSlugs.has(url)) {
      articlePages.push({
        url,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod,
      });
    }
  });

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
          url: `/providers/${slug}`,
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

  // Deduplicate URLs (keep first occurrence which has higher priority)
  const seenUrls = new Set();
  const uniquePages = allPages.filter(page => {
    if (seenUrls.has(page.url)) return false;
    seenUrls.add(page.url);
    return true;
  });

  // XML-escape special characters in URLs
  function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
  }

  const urls = uniquePages.map(page => {
    const pageLastmod = page.lastmod || lastmod;
    return `  <url>
    <loc>${escapeXml(SITE_URL + page.url)}</loc>
    <lastmod>${pageLastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(200).send(xml);
}
