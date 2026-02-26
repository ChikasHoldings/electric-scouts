import React, { useEffect, useState } from "react";
import { Article } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { generateDynamicSitemap } from "../components/seo/SitemapManager";

export default function SitemapXML() {
  const [sitemapXML, setSitemapXML] = useState('');

  // Fetch articles for dynamic sitemap
  const { data: articles } = useQuery({
    queryKey: ['articles-sitemap'],
    queryFn: () => Article.list(),
    initialData: [],
  });

  useEffect(() => {
    async function buildSitemap() {
      const xml = await generateDynamicSitemap(articles);
      setSitemapXML(xml);
      
      // Set proper content type
      document.contentType = 'application/xml';
    }
    
    buildSitemap();
  }, [articles]);

  return (
    <pre style={{ 
      whiteSpace: 'pre-wrap', 
      fontFamily: 'monospace', 
      fontSize: '12px',
      padding: '20px',
      background: '#f5f5f5'
    }}>
      {sitemapXML}
    </pre>
  );
}