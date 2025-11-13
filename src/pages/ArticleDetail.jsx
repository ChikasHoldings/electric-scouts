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
import ArticleRecommendations from "../components/learning/ArticleRecommendations";
import ReadingAnalytics, { trackDailyReading } from "../components/learning/ReadingAnalytics";

// Complete articles data - all 22 articles
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
    relatedArticles: [2, 3, 11]
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
    relatedArticles: [1, 3, 11]
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
    relatedArticles: [1, 2, 11]
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
    relatedArticles: [1, 2, 11]
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
    relatedArticles: [2, 3, 11]
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
  },
  // STATE-SPECIFIC ARTICLES
  {
    id: 11,
    category: "State Guides",
    icon: MapPin,
    color: "orange",
    title: "Texas Electricity Rates Guide: Find the Cheapest Plans in 2024",
    description: "Everything Texas residents need to know about finding the lowest electricity rates in Houston, Dallas, Austin, and beyond.",
    image: "https://images.unsplash.com/photo-1583321500900-82807e458f3c?w=1200&q=80",
    excerpt: "Texas has 40+ providers. This guide shows you exactly how to find the cheapest rates and avoid common mistakes.",
    readTime: "12 min",
    keywords: ["Texas electricity rates", "cheapest Texas electricity", "Texas power plans"],
    relatedArticles: [1, 2, 12]
  },
  {
    id: 12,
    category: "State Guides",
    icon: MapPin,
    color: "blue",
    title: "Pennsylvania Electricity Rates: Complete Guide to PA Power Savings",
    description: "Compare Pennsylvania electricity rates from 25+ providers. Find the cheapest power plans in Philadelphia and Pittsburgh.",
    image: "https://images.unsplash.com/photo-1590086782792-42dd2350140d?w=1200&q=80",
    excerpt: "Pennsylvania consumers save $400-600 yearly by shopping for competitive electricity suppliers. Here's your complete guide.",
    readTime: "11 min",
    keywords: ["Pennsylvania electricity rates", "PA power", "Philadelphia electricity"],
    relatedArticles: [1, 2, 13]
  },
  {
    id: 13,
    category: "State Guides",
    icon: MapPin,
    color: "purple",
    title: "New York Electricity Rates: Complete NY Power Shopping Guide",
    description: "Compare New York electricity rates from 20+ ESCO suppliers. Find lowest power prices in NYC, Buffalo, and Rochester.",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80",
    excerpt: "New York's regulated ESCO market offers savings with strong consumer protections. Save $300-500 annually.",
    readTime: "11 min",
    keywords: ["New York electricity", "NYC power rates", "ESCO suppliers"],
    relatedArticles: [1, 2, 14]
  },
  {
    id: 14,
    category: "State Guides",
    icon: MapPin,
    color: "green",
    title: "Ohio Electricity Rates: Compare OH Power Plans & Save Money",
    description: "Compare Ohio electricity rates from 20+ suppliers. Find lowest power prices in Cleveland, Columbus, and Cincinnati.",
    image: "https://images.unsplash.com/photo-1604246851544-2b2d471f671a?w=1200&q=80",
    excerpt: "Ohio's competitive market with PUCO oversight makes shopping safe and profitable. Save $350-550 yearly.",
    readTime: "10 min",
    keywords: ["Ohio electricity", "Cleveland power", "Columbus electricity"],
    relatedArticles: [1, 2, 15]
  },
  {
    id: 15,
    category: "State Guides",
    icon: MapPin,
    color: "orange",
    title: "Illinois Electricity Rates: Complete Guide to IL Power Savings",
    description: "Compare Illinois electricity rates from 20+ suppliers. Find cheapest power in Chicago, Aurora, and Naperville.",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80",
    excerpt: "Illinois deregulation since 1997 gives Chicago-area residents excellent supplier options. Save $350-500 yearly.",
    readTime: "10 min",
    keywords: ["Illinois electricity", "Chicago power", "ComEd rates"],
    relatedArticles: [1, 2, 16]
  },
  {
    id: 16,
    category: "State Guides",
    icon: MapPin,
    color: "blue",
    title: "New Jersey Electricity Rates: NJ Power Shopping Guide",
    description: "Compare NJ electricity rates from 15+ suppliers. Find lowest power prices in Newark, Jersey City, and Paterson.",
    image: "https://images.unsplash.com/photo-1589756823695-278bc8eac975?w=1200&q=80",
    excerpt: "New Jersey's regulated market offers solid savings with strong BPU oversight. Save $300-450 yearly.",
    readTime: "9 min",
    keywords: ["New Jersey electricity", "NJ power", "PSE&G rates"],
    relatedArticles: [1, 2, 17]
  },
  {
    id: 17,
    category: "State Guides",
    icon: MapPin,
    color: "purple",
    title: "Maryland Electricity Rates: Complete MD Power Comparison Guide",
    description: "Compare Maryland electricity rates from 15+ suppliers. Find cheapest power in Baltimore, Frederick, and Rockville.",
    image: "https://images.unsplash.com/photo-1590932722660-b2e3c71b1379?w=1200&q=80",
    excerpt: "Maryland's competitive market with PSC protections helps residents save $300-450 annually on electricity.",
    readTime: "9 min",
    keywords: ["Maryland electricity", "Baltimore power", "BGE rates"],
    relatedArticles: [1, 2, 18]
  },
  {
    id: 18,
    category: "State Guides",
    icon: MapPin,
    color: "green",
    title: "Massachusetts Electricity Rates: Complete MA Power Guide",
    description: "Compare Massachusetts electricity rates from 12+ suppliers. Find lowest power prices in Boston, Worcester, and Springfield.",
    image: "https://images.unsplash.com/photo-1572636661577-f6d05cbb7682?w=1200&q=80",
    excerpt: "Massachusetts offers competitive supplier options with strong DPU oversight. Save $250-400 yearly on electricity.",
    readTime: "8 min",
    keywords: ["Massachusetts electricity", "Boston power", "National Grid MA"],
    relatedArticles: [1, 2, 19]
  },
  {
    id: 19,
    category: "State Guides",
    icon: MapPin,
    color: "orange",
    title: "Connecticut Electricity Rates: CT Power Shopping Guide",
    description: "Compare Connecticut electricity rates from 12+ suppliers. Find cheapest power in Hartford, New Haven, and Stamford.",
    image: "https://images.unsplash.com/photo-1569149646689-5e8bbdbbd944?w=1200&q=80",
    excerpt: "Connecticut's PURA-regulated market offers moderate competition and real savings. Save $250-400 yearly.",
    readTime: "8 min",
    keywords: ["Connecticut electricity", "CT power", "Eversource CT"],
    relatedArticles: [1, 2, 20]
  },
  {
    id: 20,
    category: "State Guides",
    icon: MapPin,
    color: "blue",
    title: "Maine Electricity Rates: Complete ME Power Comparison Guide",
    description: "Compare Maine electricity rates from 8+ suppliers. Find cheapest power in Portland, Bangor, and Lewiston.",
    image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=1200&q=80",
    excerpt: "Maine's smaller competitive market still offers real savings opportunities. Save $200-350 yearly on electricity.",
    readTime: "7 min",
    keywords: ["Maine electricity", "Portland power", "CMP rates"],
    relatedArticles: [1, 2, 21]
  },
  {
    id: 21,
    category: "State Guides",
    icon: MapPin,
    color: "purple",
    title: "New Hampshire Electricity Rates: NH Power Shopping Guide",
    description: "Compare NH electricity rates from 8+ suppliers. Find cheapest power in Manchester, Nashua, and Concord.",
    image: "https://images.unsplash.com/photo-1606403726988-eb685c61c9b6?w=1200&q=80",
    excerpt: "New Hampshire offers modest supplier competition with PUC oversight. Save $200-350 yearly on electricity.",
    readTime: "7 min",
    keywords: ["New Hampshire electricity", "NH power", "Eversource NH"],
    relatedArticles: [1, 2, 22]
  },
  {
    id: 22,
    category: "State Guides",
    icon: MapPin,
    color: "green",
    title: "Rhode Island Electricity Rates: RI Power Comparison Guide",
    description: "Compare Rhode Island electricity rates from 8+ suppliers. Find cheapest power in Providence, Warwick, and Cranston.",
    image: "https://images.unsplash.com/photo-1602984891859-69d29e64b886?w=1200&q=80",
    excerpt: "Rhode Island's competitive market with PUC licensing offers genuine savings. Save $200-320 yearly on electricity.",
    readTime: "7 min",
    keywords: ["Rhode Island electricity", "RI power", "National Grid RI"],
    relatedArticles: [1, 2, 11]
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

  // Scroll to top on mount and track reading
  useEffect(() => {
    window.scrollTo(0, 0);
    trackDailyReading();
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

        {/* Reading Analytics */}
        <div className="mt-8">
          <ReadingAnalytics allArticles={articles} />
        </div>

        {/* AI-Powered Article Recommendations */}
        <ArticleRecommendations 
          currentArticle={article}
          allArticles={articles}
        />

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