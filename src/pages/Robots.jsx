import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export default function Robots() {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const robotsTxt = `# robots.txt for Power Scouts
# Allow all search engines to crawl the site

User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for search engines
Crawl-delay: 1

# Block specific paths if needed (currently none)
# Disallow: /admin/
# Disallow: /private/
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(robotsTxt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Robots.txt File</h1>
          <p className="text-gray-600 mb-8">
            The robots.txt file tells search engine crawlers which pages they can and cannot access on your site.
            This configuration allows all search engines to crawl all pages of Power Scouts.
          </p>
          
          <div className="relative">
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="bg-white"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-green-400 text-sm font-mono whitespace-pre">
{robotsTxt}
              </pre>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-bold text-gray-900 mb-2">Implementation Instructions:</h2>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>Copy the content above and save it as <code className="bg-white px-2 py-1 rounded">robots.txt</code> in your website root directory</li>
              <li>Make sure the file is accessible at: <code className="bg-white px-2 py-1 rounded">{baseUrl}/robots.txt</code></li>
              <li>Test your robots.txt file using Google Search Console's robots.txt Tester tool</li>
              <li>The sitemap URL points to your XML sitemap for search engines to discover all pages</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h2 className="font-bold text-gray-900 mb-2">What This Configuration Does:</h2>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li><strong>User-agent: *</strong> - Applies rules to all search engine crawlers</li>
              <li><strong>Allow: /</strong> - Allows crawling of all pages</li>
              <li><strong>Sitemap:</strong> - Tells crawlers where to find your XML sitemap</li>
              <li><strong>Crawl-delay: 1</strong> - Requests crawlers to wait 1 second between requests (reduces server load)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}