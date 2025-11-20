import { useEffect } from 'react';

export default function Robots() {
  useEffect(() => {
    const robotsContent = `# Power Scouts - Electricity Rate Comparison Platform
# Compare rates from 40+ providers across 12 deregulated states

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${window.location.origin}/sitemap
Sitemap: ${window.location.origin}/sitemap.xml

# Crawl-delay for responsible crawling
Crawl-delay: 1

# Disallow private areas and tracking parameters
Disallow: /api/
Disallow: /admin/
Disallow: /*?*utm_*
Disallow: /*?*session*
Disallow: /*?*fbclid*

# High-value comparison pages
Allow: /compare-rates
Allow: /renewable-compare-rates
Allow: /business-compare-rates
Allow: /bill-analyzer
Allow: /all-providers
Allow: /all-states
Allow: /all-cities
Allow: /learning-center
Allow: /faq
Allow: /renewable-energy
Allow: /business-electricity
Allow: /home-concierge

# Major state pages
Allow: /texas-electricity
Allow: /illinois-electricity
Allow: /ohio-electricity
Allow: /pennsylvania-electricity
Allow: /new-york-electricity
Allow: /new-jersey-electricity
Allow: /maryland-electricity
Allow: /massachusetts-electricity
Allow: /maine-electricity
Allow: /new-hampshire-electricity
Allow: /rhode-island-electricity
Allow: /connecticut-electricity

# Specific crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

# Block bad bots
User-agent: MJ12bot
Disallow: /

User-agent: AhrefsBot
Crawl-delay: 10`;

    // Create a downloadable file
    const blob = new Blob([robotsContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Robots.txt</h1>
          <p className="text-gray-600 mb-6">
            This is the robots.txt file for search engine crawlers.
          </p>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`# Power Scouts - Electricity Rate Comparison Platform
# Compare rates from 40+ providers across 12 deregulated states

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${window.location.origin}/sitemap
Sitemap: ${window.location.origin}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow private areas
Disallow: /api/
Disallow: /admin/
Disallow: /*?*utm_*

# High-value pages
Allow: /compare-rates
Allow: /renewable-compare-rates
Allow: /business-compare-rates
Allow: /bill-analyzer
Allow: /all-providers
Allow: /all-states
Allow: /all-cities
Allow: /learning-center
Allow: /faq
Allow: /renewable-energy

# Major state pages
Allow: /texas-electricity
Allow: /illinois-electricity
Allow: /ohio-electricity
Allow: /pennsylvania-electricity
Allow: /new-york-electricity
Allow: /new-jersey-electricity`}
          </pre>
        </div>
      </div>
    </div>
  );
}