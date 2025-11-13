# SEO Components & Utilities

This directory contains SEO optimization components and utilities for the Power Scouts app.

## Components

### AutoSEO
Automatically generates SEO meta tags based on page context.

**Usage:**
```jsx
import AutoSEO from "@/components/seo/AutoSEO";

// For state pages
<AutoSEO 
  pageType="state" 
  location="Texas"
  customData={{ providers: 45, avgRate: "9.2¢", avgSavings: 800 }}
  breadcrumbs={[
    { name: "Home", url: "/" },
    { name: "States", url: "/all-states" },
    { name: "Texas", url: "/texas-electricity" }
  ]}
/>

// For city pages
<AutoSEO 
  pageType="city" 
  city="Houston"
  state="Texas"
  customData={{ providers: 45, avgRate: "8.9¢" }}
/>

// For provider pages
<AutoSEO 
  pageType="provider" 
  pageName="TXU Energy"
  customData={{ minRate: "8.5¢" }}
/>
```

**Supported Page Types:**
- `home` - Homepage
- `state` - State-specific pages
- `city` - City-specific pages
- `provider` - Provider detail pages
- `comparison` - Rate comparison pages
- `resource` - Resource/educational pages

### ImageOptimizer
Ensures all images have proper SEO attributes including alt text, lazy loading, and dimensions.

**Usage:**
```jsx
import ImageOptimizer, { ProviderLogo, LocationImage, HeroImage } from "@/components/seo/ImageOptimizer";

// Basic usage
<ImageOptimizer 
  src="image.jpg" 
  alt="Descriptive text"
  context="Additional context for SEO"
  width={400}
  height={300}
/>

// Provider logo
<ProviderLogo 
  providerName="TXU Energy"
  logoUrl="logo.png"
  className="h-8"
/>

// Location image
<LocationImage 
  location="Houston"
  imageUrl="houston.jpg"
  type="city"
/>

// Hero image (priority loading)
<HeroImage 
  imageUrl="hero.jpg"
  alt="Compare electricity rates"
/>
```

**Features:**
- Automatic alt text generation based on context
- Lazy loading for better performance (except priority images)
- Responsive image handling
- SEO-optimized alt text validation

### SEOHead
Core component for managing page meta tags and structured data.

**Usage:**
```jsx
import SEOHead, { 
  getOrganizationSchema, 
  getServiceSchema, 
  getFAQSchema,
  getBreadcrumbSchema 
} from "@/components/SEOHead";

<SEOHead
  title="Page Title | Power Scouts"
  description="Page description for SEO"
  keywords="keyword1, keyword2, keyword3"
  canonical="/page-url"
  structuredData={[
    getOrganizationSchema(),
    getServiceSchema("Texas"),
    getBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Current Page", url: "/current" }
    ])
  ]}
/>
```

## Best Practices

### Meta Tags
1. **Title Tags**: 50-60 characters, include location and primary keyword
2. **Meta Description**: 150-160 characters, compelling and includes call-to-action
3. **Keywords**: 5-10 relevant keywords, avoid keyword stuffing
4. **Canonical URLs**: Always set to avoid duplicate content issues

### Image Alt Text
1. Be descriptive but concise (under 125 characters)
2. Include location and/or provider name when relevant
3. Avoid phrases like "image of" or "picture of"
4. Include target keywords naturally
5. Don't leave alt text empty

**Good Examples:**
- ✅ "Houston Texas skyline - electricity rates and providers"
- ✅ "TXU Energy logo - Texas electricity provider"
- ✅ "Solar panel array - renewable energy plans"

**Bad Examples:**
- ❌ "image"
- ❌ "logo"
- ❌ "IMG_20231112.jpg"

### Structured Data
Always include:
1. Organization schema on all pages
2. Service schema on location pages
3. Breadcrumb schema for better navigation
4. FAQ schema on pages with questions/answers
5. Article schema for blog/learning content

### Sitemap
- Update `/sitemap` page when adding new pages
- Set appropriate priority and changefreq values
- Submit to Google Search Console and Bing Webmaster Tools

### Robots.txt
- Keep it simple and allow all search engines
- Include sitemap location
- Add crawl-delay to reduce server load

## SEO Checklist

### For New Pages
- [ ] Add AutoSEO or SEOHead component
- [ ] Set unique, descriptive title (50-60 chars)
- [ ] Write compelling meta description (150-160 chars)
- [ ] Add relevant keywords
- [ ] Set canonical URL
- [ ] Add structured data (Organization, Service, Breadcrumbs)
- [ ] Optimize all images with descriptive alt text
- [ ] Add page to sitemap
- [ ] Use proper heading hierarchy (H1 → H2 → H3)
- [ ] Include internal links to related pages
- [ ] Ensure mobile responsiveness

### Image Optimization
- [ ] Use ImageOptimizer component for all images
- [ ] Provide descriptive alt text
- [ ] Add context parameter for better SEO
- [ ] Set width and height to prevent layout shift
- [ ] Use priority loading for above-fold images
- [ ] Compress images before upload

### Content Optimization
- [ ] Target one primary keyword per page
- [ ] Include keyword in title, H1, first paragraph
- [ ] Use keyword variations naturally throughout
- [ ] Write for users first, search engines second
- [ ] Add location-specific content where relevant
- [ ] Include clear call-to-action
- [ ] Aim for 300+ words of quality content

## Monitoring & Testing

### Tools to Use
1. **Google Search Console** - Monitor indexing and performance
2. **Google PageSpeed Insights** - Check performance and Core Web Vitals
3. **Screaming Frog** - Crawl site for SEO issues
4. **Ahrefs/SEMrush** - Keyword research and competitor analysis
5. **Google Mobile-Friendly Test** - Ensure mobile compatibility

### Regular Tasks
- Weekly: Check Search Console for errors
- Monthly: Review and update meta descriptions
- Quarterly: Audit all images for alt text
- Quarterly: Update sitemap with new pages
- Annually: Review and refresh old content

## Common Issues & Solutions

### Issue: Duplicate Content
**Solution:** Set canonical URLs on all pages

### Issue: Missing Alt Text
**Solution:** Use ImageOptimizer component, which generates alt text automatically

### Issue: Poor Mobile Performance
**Solution:** Use lazy loading for images, optimize image sizes

### Issue: Low Click-Through Rate
**Solution:** Improve meta descriptions with compelling CTAs

### Issue: Pages Not Indexed
**Solution:** Check robots.txt, submit sitemap, add internal links

## Need Help?
Refer to the main SEOHead component documentation or check Google's SEO Starter Guide for more information.