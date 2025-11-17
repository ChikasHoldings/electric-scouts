import { useEffect } from 'react';

export default function Robots() {
  useEffect(() => {
    const robotsContent = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${window.location.origin}/sitemap

# Crawl-delay
Crawl-delay: 1

# Disallow admin or private areas (if any)
Disallow: /api/
Disallow: /admin/

# Allow all electricity comparison pages
Allow: /compare-rates
Allow: /all-providers
Allow: /all-states
Allow: /all-cities
Allow: /learning-center
Allow: /faq

# Popular state pages
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
Allow: /connecticut-electricity`;

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
{`User-agent: *
Allow: /

# Sitemaps
Sitemap: ${window.location.origin}/sitemap

# Crawl-delay
Crawl-delay: 1

# Disallow admin or private areas
Disallow: /api/
Disallow: /admin/

# Allow all comparison pages
Allow: /compare-rates
Allow: /all-providers
Allow: /all-states
Allow: /all-cities
Allow: /learning-center
Allow: /faq`}
          </pre>
        </div>
      </div>
    </div>
  );
}