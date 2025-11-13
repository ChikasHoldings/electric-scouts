import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, Zap, DollarSign, Leaf, TrendingDown, Shield, 
  Clock, Users, ArrowRight, MapPin, Building2, FileText
} from "lucide-react";
import SEOHead, { getArticleSchema, getBreadcrumbSchema } from "../components/SEOHead";
import { getFullArticle } from "../components/learning/fullArticles";

// Same articles data from Learning Center
const articles = [
  {
    id: 1,
    category: "Getting Started",
    icon: BookOpen,
    color: "blue",
    title: "Understanding Deregulated Electricity Markets: Your Complete Guide",
    description: "Learn how energy deregulation works and how it can save you hundreds on your electricity bills each year.",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80",
    excerpt: "Discover how choosing your electricity provider can save you $500-800 per year in competitive energy markets across 12 states.",
    readTime: "8 min",
    keywords: ["deregulated electricity", "energy deregulation", "choose electricity provider"],
    relatedArticles: [2, 3, 5]
  },
  {
    id: 2,
    category: "Saving Money",
    icon: DollarSign,
    color: "green",
    title: "How to Compare Electricity Rates and Save $500+ Per Year",
    description: "Master the art of comparing electricity plans with this step-by-step guide used by thousands of smart consumers.",
    image: "https://images.unsplash.com/photo-1554224311-beee4ece2227?w=1200&q=80",
    excerpt: "Learn the exact process energy experts use to find the lowest rates and avoid hidden fees that cost you money.",
    readTime: "10 min",
    keywords: ["compare electricity rates", "save money electricity", "electricity shopping guide"],
    relatedArticles: [1, 3, 6]
  },
  {
    id: 3,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Fixed Rate vs Variable Rate: Which Saves You More Money?",
    description: "Real customer examples show you which electricity plan type works best for different situations.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    excerpt: "See actual bills from families who chose fixed vs variable rates and discover which option is right for you.",
    readTime: "12 min",
    keywords: ["fixed rate electricity", "variable rate electricity", "best electricity plan type"],
    relatedArticles: [1, 2, 7]
  },
  {
    id: 4,
    category: "Renewable Energy",
    icon: Leaf,
    color: "green",
    title: "Green Energy Plans: Save Money While Saving the Planet",
    description: "How 100% renewable electricity plans work and why they often cost the same as traditional plans.",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80",
    excerpt: "Thousands of families power their homes with 100% renewable energy without paying extra. Here's how you can too.",
    readTime: "7 min",
    keywords: ["renewable energy plans", "green electricity", "100% renewable energy"],
    relatedArticles: [1, 2, 8]
  },
  {
    id: 5,
    category: "Texas Electricity",
    icon: MapPin,
    color: "orange",
    title: "Texas Electricity Guide: Find the Cheapest Rates in 2024",
    description: "Everything Texas residents need to know about finding the lowest electricity rates in Houston, Dallas, Austin, and beyond.",
    image: "https://images.unsplash.com/photo-1583321500900-82807e458f3c?w=1200&q=80",
    excerpt: "Texas has 40+ providers. This guide shows you exactly how to find the cheapest rates and avoid common mistakes.",
    readTime: "12 min",
    keywords: ["Texas electricity rates", "cheapest Texas electricity", "Texas power plans"],
    relatedArticles: [6, 7, 8]
  },
  {
    id: 6,
    category: "City Guides",
    icon: Building2,
    color: "blue",
    title: "Houston Electricity: Best Rates and Providers for 2024",
    description: "Find the cheapest electricity in Houston with this comprehensive guide for Harris County residents.",
    image: "https://images.unsplash.com/photo-1577894947058-fccf5cf3f8ac?w=1200&q=80",
    excerpt: "Houston families save $1,000+ per year with these proven strategies for finding the best electricity rates.",
    readTime: "10 min",
    keywords: ["Houston electricity", "Houston power rates", "cheapest Houston electricity"],
    relatedArticles: [5, 7, 9]
  },
  {
    id: 7,
    category: "City Guides",
    icon: Building2,
    color: "purple",
    title: "Dallas Electricity Rates: Complete Comparison Guide",
    description: "Everything Dallas residents need to know about finding the best electricity deals in the DFW Metroplex.",
    image: "https://images.unsplash.com/photo-1552083974-186346191183?w=1200&q=80",
    excerpt: "Compare electricity rates from 42+ providers serving Dallas and surrounding areas. Save up to $800 annually.",
    readTime: "9 min",
    keywords: ["Dallas electricity rates", "DFW electricity", "Dallas power companies"],
    relatedArticles: [5, 6, 8]
  },
  {
    id: 8,
    category: "Seasonal Tips",
    icon: Zap,
    color: "orange",
    title: "Beat the Heat: Summer Electricity Saving Strategies",
    description: "Proven tactics to lower your electricity bill during hot summer months without sacrificing comfort.",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80",
    excerpt: "These 10 strategies helped families cut summer electricity bills by 30-40% while staying comfortable.",
    readTime: "8 min",
    keywords: ["summer electricity savings", "lower AC costs", "reduce summer bills"],
    relatedArticles: [2, 3, 5]
  },
  {
    id: 9,
    category: "Understanding Bills",
    icon: FileText,
    color: "teal",
    title: "How to Read Your Electricity Bill and Spot Overcharges",
    description: "Learn to decode your electricity bill and identify hidden fees that cost you money every month.",
    image: "https://images.unsplash.com/photo-1554224311-beee4ece2227?w=1200&q=80",
    excerpt: "Understanding your bill is the first step to saving money. This guide shows you exactly what to look for.",
    readTime: "7 min",
    keywords: ["read electricity bill", "understand electricity bill", "electricity bill explained"],
    relatedArticles: [1, 2, 10]
  },
  {
    id: 10,
    category: "Switching Providers",
    icon: Users,
    color: "blue",
    title: "How to Switch Electricity Providers Without Hassle",
    description: "Step-by-step guide to switching providers seamlessly with no power interruption.",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80",
    excerpt: "Switching takes 10 minutes online and could save you $500+ per year. Here's exactly what to do.",
    readTime: "6 min",
    keywords: ["switch electricity provider", "change power company", "electricity provider switch"],
    relatedArticles: [1, 2, 3]
  }
];

const colorClasses = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" }
};

export default function ArticleDetail() {
  // Get article ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = parseInt(urlParams.get('id'));
  const article = articles.find(a => a.id === articleId);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [articleId]);

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist.</p>
          <Link to={createPageUrl("LearningCenter")}>
            <Button className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
              Back to Learning Center
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = article.icon;
  const colors = colorClasses[article.color];

  // Get full article content
  const fullArticle = getFullArticle(articleId);

  const articleSchema = getArticleSchema({
    title: fullArticle?.metaTitle || article.title,
    description: fullArticle?.metaDescription || article.description,
    image: article.image,
    datePublished: "2024-01-15",
    dateModified: "2024-01-15"
  });

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Learning Center", url: "/learning-center" },
    { name: article.title, url: `/article?id=${article.id}` }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title={fullArticle?.metaTitle || `${article.title} | Power Scouts Learning Center`}
        description={fullArticle?.metaDescription || article.description}
        keywords={fullArticle?.tags?.join(", ") || article.keywords.join(", ")}
        canonical={`/article?id=${article.id}`}
        image={article.image}
        type="article"
        structuredData={[articleSchema, breadcrumbData]}
      />

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("LearningCenter")}>
          <Button
            variant="outline"
            className="mb-6 rounded-xl"
          >
            ← Back to Learning Center
          </Button>
        </Link>

        <article className="bg-white rounded-2xl shadow-xl border-2 overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className={`inline-flex px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-bold uppercase mb-3`}>
                {article.category}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {article.readTime} read
                </span>
              </div>
            </div>
          </div>

          {/* Article Body */}
          <div className="p-6 sm:p-10 lg:p-12">
            {fullArticle ? (
              <div 
                className="prose prose-lg max-w-none article-content"
                dangerouslySetInnerHTML={{ __html: fullArticle.content }}
              />
            ) : (
              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-700 leading-relaxed mb-8 border-l-4 border-[#FF6B35] pl-6 py-2 bg-gray-50 rounded-r-lg">
                  {article.description}
                </p>
                
                <p className="text-base text-gray-600 leading-relaxed mb-6">
                  {article.excerpt}
                </p>

                {/* CTA within article */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 my-8 text-center border-2 border-blue-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Start Saving Today</h3>
                  <p className="text-sm text-gray-600 mb-4">Compare electricity rates in your area now</p>
                  <Link to={createPageUrl("CompareRates")}>
                    <Button className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white rounded-xl">
                      Compare Rates
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                <p className="text-base text-gray-600 leading-relaxed">
                  For more personalized guidance, explore our state-specific and city-specific guides or use our free comparison tool to find the best rates in your area.
                </p>
              </div>
            )}

            {/* Related Links */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Related Resources</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link to={createPageUrl("CompareRates")} className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Zap className="w-5 h-5 text-[#FF6B35]" />
                  <span className="font-medium text-gray-900">Compare Rates</span>
                </Link>
                <Link to={createPageUrl("AllStates")} className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <MapPin className="w-5 h-5 text-[#FF6B35]" />
                  <span className="font-medium text-gray-900">View All States</span>
                </Link>
                <Link to={createPageUrl("AllProviders")} className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <Building2 className="w-5 h-5 text-[#FF6B35]" />
                  <span className="font-medium text-gray-900">All Providers</span>
                </Link>
                <Link to={createPageUrl("FAQ")} className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                  <FileText className="w-5 h-5 text-[#FF6B35]" />
                  <span className="font-medium text-gray-900">FAQs</span>
                </Link>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Guides</h2>
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              {article.relatedArticles.map(relatedId => {
                const related = articles.find(a => a.id === relatedId);
                if (!related) return null;
                const RelatedIcon = related.icon;
                const relatedColors = colorClasses[related.color];
                return (
                  <Link key={related.id} to={createPageUrl("ArticleDetail") + `?id=${related.id}`}>
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#0A5C8C] h-full">
                      <CardContent className="p-5">
                        <div className={`w-12 h-12 ${relatedColors.bg} rounded-xl flex items-center justify-center mb-3`}>
                          <RelatedIcon className={`w-6 h-6 ${relatedColors.text}`} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                          {related.title}
                        </h3>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {related.readTime}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white border-0">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">
                Ready to Find Better Rates?
              </h2>
              <p className="text-base text-blue-100 mb-6 max-w-xl mx-auto">
                Compare electricity plans and start saving money today
              </p>
              <Link to={createPageUrl("CompareRates")}>
                <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold rounded-xl">
                  Compare Rates Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Article Tags */}
        {fullArticle?.tags && fullArticle.tags.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Article Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {fullArticle.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles for Article Content */}
      <style>{`
        .article-content h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a202c;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        
        .article-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2d3748;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .article-content p {
          margin-bottom: 1rem;
          line-height: 1.75;
          color: #4a5568;
        }
        
        .article-content strong {
          font-weight: 600;
          color: #2d3748;
        }
        
        .article-content ul, .article-content ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        
        .article-content li {
          margin-bottom: 0.5rem;
          line-height: 1.75;
          color: #4a5568;
        }
        
        .article-content .cta-box {
          background: linear-gradient(135deg, #EBF8FF 0%, #E6FFFA 100%);
          border: 2px solid #90CDF4;
          border-radius: 1rem;
          padding: 2rem;
          margin: 2rem 0;
          text-align: center;
        }
        
        .article-content .cta-box h3 {
          color: #0A5C8C;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.75rem 0;
        }
        
        .article-content .cta-box p {
          color: #4a5568;
          margin-bottom: 1rem;
        }
        
        .article-content .cta-button {
          display: inline-block;
          background: #FF6B35;
          color: white;
          padding: 0.75rem 2rem;
          border-radius: 0.75rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .article-content .cta-button:hover {
          background: #e55a2b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }
        
        .article-content a:not(.cta-button) {
          color: #0A5C8C;
          text-decoration: underline;
        }
        
        .article-content a:not(.cta-button):hover {
          color: #084a6f;
        }
      `}</style>
    </div>
  );
}