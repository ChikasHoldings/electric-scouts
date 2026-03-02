import React from "react";

export default function Robots() {
  const robotsTxt = `# Electric Scouts - Robots.txt
# https://www.electricscouts.com

# Default rules for all crawlers
User-agent: *
Allow: /

# Public content paths
Allow: /electricity-rates/
Allow: /learn/
Allow: /providers/
Allow: /compare-rates
Allow: /bill-analyzer
Allow: /savings-calculator
Allow: /all-providers
Allow: /all-states
Allow: /all-cities
Allow: /learning-center
Allow: /renewable-energy
Allow: /business-electricity
Allow: /faq
Allow: /about-us
Allow: /home-concierge
Allow: /privacy-policy
Allow: /terms-of-service

# Block admin, API, and internal areas
Disallow: /admin/
Disallow: /api/
Disallow: /go/
Disallow: /user-settings
Disallow: /business-quote-dashboard
Disallow: /not-found
Disallow: /robots
Disallow: /sitemap
Disallow: /sitemap-xml
Disallow: /city-rates
Disallow: /article-detail
Disallow: /landing

# Sitemap location
Sitemap: https://www.electricscouts.com/sitemap.xml

# Google-specific rules
User-agent: Googlebot
Allow: /

# Bing-specific rules
User-agent: Bingbot
Allow: /
Crawl-delay: 2

# Block AI training crawlers
User-agent: GPTBot
Disallow: /
User-agent: ChatGPT-User
Disallow: /
User-agent: CCBot
Disallow: /
User-agent: anthropic-ai
Disallow: /
User-agent: Claude-Web
Disallow: /
User-agent: Google-Extended
Disallow: /
User-agent: Bytespider
Disallow: /
User-agent: Amazonbot
Disallow: /`;

  return (
    <pre style={{ 
      whiteSpace: 'pre-wrap', 
      fontFamily: 'monospace', 
      fontSize: '12px',
      padding: '20px',
      background: '#f5f5f5',
      margin: 0
    }}>
      {robotsTxt}
    </pre>
  );
}
