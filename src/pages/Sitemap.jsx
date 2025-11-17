import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";

export default function Sitemap() {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://powerscouts.com';
  
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
      
      // Learning Center Articles
      { url: createPageUrl("ArticleDetail") + "?id=1", priority: 0.7, changefreq: "monthly" },
      { url: createPageUrl("ArticleDetail") + "?id=2", priority: 0.7, changefreq: "monthly" },
      { url: createPageUrl("ArticleDetail") + "?id=3", priority: 0.7, changefreq: "monthly" },
      { url: createPageUrl("ArticleDetail") + "?id=4", priority: 0.7, changefreq: "monthly" },
      { url: createPageUrl("ArticleDetail") + "?id=5", priority: 0.7, changefreq: "monthly" },
      { url: createPageUrl("ArticleDetail") + "?id=106", priority: 0.6, changefreq: "monthly" },
      { url: createPageUrl("ArticleDetail") + "?id=107", priority: 0.6, changefreq: "monthly" },
      { url: createPageUrl("ArticleDetail") + "?id=108", priority: 0.6, changefreq: "monthly" },
      
      // Provider pages (major providers)
      { url: createPageUrl("ProviderDetails") + "?provider=TXU Energy", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("ProviderDetails") + "?provider=Reliant Energy", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("ProviderDetails") + "?provider=Gexa Energy", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("ProviderDetails") + "?provider=Direct Energy", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("ProviderDetails") + "?provider=Green Mountain Energy", priority: 0.7, changefreq: "weekly" },
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

  useEffect(() => {
    // Set content type for XML
    const metaContentType = document.createElement('meta');
    metaContentType.httpEquiv = 'Content-Type';
    metaContentType.content = 'application/xml; charset=utf-8';
    document.head.appendChild(metaContentType);

    return () => {
      document.head.removeChild(metaContentType);
    };
  }, []);

  // Return raw XML for search engines
  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      whiteSpace: 'pre-wrap', 
      wordWrap: 'break-word',
      margin: 0,
      padding: 0
    }}>
      {xmlContent}
    </pre>
  );
}