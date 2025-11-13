import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";

export default function Sitemap() {
  useEffect(() => {
    // Get the current domain
    const baseUrl = window.location.origin;
    
    // Define all pages in the app with their priority and change frequency
    const pages = [
      { url: "/", priority: 1.0, changefreq: "daily" },
      { url: createPageUrl("CompareRates"), priority: 1.0, changefreq: "daily" },
      { url: createPageUrl("AllProviders"), priority: 0.9, changefreq: "weekly" },
      { url: createPageUrl("AllStates"), priority: 0.9, changefreq: "weekly" },
      { url: createPageUrl("AllCities"), priority: 0.8, changefreq: "weekly" },
      
      // State pages
      { url: createPageUrl("TexasElectricity"), priority: 0.9, changefreq: "weekly" },
      { url: createPageUrl("IllinoisElectricity"), priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("OhioElectricity"), priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("PennsylvaniaElectricity"), priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("NewYorkElectricity"), priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("NewJerseyElectricity"), priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("MarylandElectricity"), priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("MassachusettsElectricity"), priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("MaineElectricity"), priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("NewHampshireElectricity"), priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("RhodeIslandElectricity"), priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("ConnecticutElectricity"), priority: 0.7, changefreq: "weekly" },
      
      // Resource pages
      { url: createPageUrl("LearningCenter"), priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("FAQ"), priority: 0.7, changefreq: "monthly" },
      { url: createPageUrl("RenewableEnergy"), priority: 0.7, changefreq: "monthly" },
      { url: createPageUrl("BillAnalyzer"), priority: 0.8, changefreq: "monthly" },
      { url: createPageUrl("BusinessRates"), priority: 0.7, changefreq: "monthly" },
      { url: createPageUrl("HomeConcierge"), priority: 0.6, changefreq: "monthly" },
      
      // Legal pages
      { url: createPageUrl("AboutUs"), priority: 0.6, changefreq: "monthly" },
      { url: createPageUrl("PrivacyPolicy"), priority: 0.5, changefreq: "yearly" },
      { url: createPageUrl("TermsOfService"), priority: 0.5, changefreq: "yearly" },
      
      // Dynamic city pages (major cities)
      { url: createPageUrl("CityRates") + "?city=Houston", priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Dallas", priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Austin", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=San Antonio", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Chicago", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Columbus", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Philadelphia", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=New York City", priority: 0.8, changefreq: "weekly" },
    ];

    // Generate XML sitemap
    const currentDate = new Date().toISOString().split('T')[0];
    
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Set content type and display XML
    document.querySelector('#sitemap-content').textContent = xmlContent;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">XML Sitemap</h1>
          <p className="text-gray-600 mb-8">
            This is the XML sitemap for Power Scouts. Copy the content below to create a sitemap.xml file
            for search engines to crawl your site more effectively.
          </p>
          
          <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap" id="sitemap-content">
              Loading sitemap...
            </pre>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-bold text-gray-900 mb-2">SEO Instructions:</h2>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Copy the XML content above and save it as sitemap.xml in your website root</li>
              <li>Submit this sitemap to Google Search Console and Bing Webmaster Tools</li>
              <li>Add a reference to your robots.txt file: <code className="bg-white px-2 py-1 rounded">Sitemap: {window.location.origin}/sitemap.xml</code></li>
              <li>Update the sitemap whenever you add new pages or content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}