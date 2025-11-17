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
      
      // Dynamic city pages - Texas
      { url: createPageUrl("CityRates") + "?city=Houston&state=TX", priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Dallas&state=TX", priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Austin&state=TX", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=San Antonio&state=TX", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Fort Worth&state=TX", priority: 0.7, changefreq: "weekly" },
      
      // Illinois cities
      { url: createPageUrl("CityRates") + "?city=Chicago&state=IL", priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Aurora&state=IL", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Naperville&state=IL", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Joliet&state=IL", priority: 0.6, changefreq: "weekly" },
      
      // Ohio cities
      { url: createPageUrl("CityRates") + "?city=Columbus&state=OH", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Cleveland&state=OH", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Cincinnati&state=OH", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Toledo&state=OH", priority: 0.6, changefreq: "weekly" },
      
      // Pennsylvania cities
      { url: createPageUrl("CityRates") + "?city=Philadelphia&state=PA", priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Pittsburgh&state=PA", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Allentown&state=PA", priority: 0.6, changefreq: "weekly" },
      
      // New York cities
      { url: createPageUrl("CityRates") + "?city=New York City&state=NY", priority: 0.9, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Buffalo&state=NY", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Rochester&state=NY", priority: 0.6, changefreq: "weekly" },
      
      // New Jersey cities
      { url: createPageUrl("CityRates") + "?city=Newark&state=NJ", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Jersey City&state=NJ", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Paterson&state=NJ", priority: 0.6, changefreq: "weekly" },
      
      // Maryland cities
      { url: createPageUrl("CityRates") + "?city=Baltimore&state=MD", priority: 0.7, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Frederick&state=MD", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Rockville&state=MD", priority: 0.6, changefreq: "weekly" },
      
      // Massachusetts cities
      { url: createPageUrl("CityRates") + "?city=Boston&state=MA", priority: 0.8, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Worcester&state=MA", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Springfield&state=MA", priority: 0.6, changefreq: "weekly" },
      
      // Connecticut cities
      { url: createPageUrl("CityRates") + "?city=Hartford&state=CT", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=New Haven&state=CT", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Bridgeport&state=CT", priority: 0.6, changefreq: "weekly" },
      
      // Maine cities
      { url: createPageUrl("CityRates") + "?city=Portland&state=ME", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Lewiston&state=ME", priority: 0.5, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Bangor&state=ME", priority: 0.5, changefreq: "weekly" },
      
      // New Hampshire cities
      { url: createPageUrl("CityRates") + "?city=Manchester&state=NH", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Nashua&state=NH", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Concord&state=NH", priority: 0.5, changefreq: "weekly" },
      
      // Rhode Island cities
      { url: createPageUrl("CityRates") + "?city=Providence&state=RI", priority: 0.6, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Warwick&state=RI", priority: 0.5, changefreq: "weekly" },
      { url: createPageUrl("CityRates") + "?city=Cranston&state=RI", priority: 0.5, changefreq: "weekly" },
      
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