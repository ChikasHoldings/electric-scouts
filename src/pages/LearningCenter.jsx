import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, Zap, DollarSign, Leaf, TrendingDown, Shield, 
  Clock, Users, ArrowRight, CheckCircle, MapPin, Building2, Home, FileText, Star
} from "lucide-react";
import SEOHead, { getBreadcrumbSchema, getArticleSchema } from "../components/SEOHead";
import EnhancedSearch from "../components/learning/EnhancedSearch";

// Comprehensive article database
const articles = [
  // Getting Started
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
    category: "Business Energy",
    icon: Building2,
    color: "blue",
    title: "Business Electricity Rates: Complete Commercial Power Guide 2024",
    description: "Compare business electricity rates and save thousands on commercial power bills. Expert guide for small business and enterprise.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    excerpt: "Small businesses save $2,000-10,000 annually by shopping commercial electricity rates. Here's your complete guide.",
    readTime: "11 min",
    keywords: ["business electricity rates", "commercial power", "small business energy"],
    relatedArticles: [1, 2, 11]
  },
  {
    id: 6,
    category: "Consumer Protection",
    icon: Shield,
    color: "purple",
    title: "How to Avoid Electricity Scams and Find Legitimate Providers",
    description: "Identify electricity scams, door-to-door fraud, and fake providers. Learn to verify legitimate licensed companies.",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80",
    excerpt: "Door-to-door electricity scams cost consumers millions annually. Learn the red flags and protect yourself.",
    readTime: "9 min",
    keywords: ["electricity scams", "provider fraud", "door-to-door sales", "legitimate providers"],
    relatedArticles: [1, 10, 2]
  },
  {
    id: 7,
    category: "Money Saving",
    icon: TrendingDown,
    color: "green",
    title: "Contract Renewal Strategy: Save $300+ Every Year",
    description: "Master electricity contract renewal timing. Learn when to shop, avoid auto-renewal penalties, and negotiate better rates.",
    image: "https://images.unsplash.com/photo-1554224311-85f1eb488f7f?w=1200&q=80",
    excerpt: "Most people overpay $300-800 yearly by letting contracts auto-renew. Here's how to avoid this expensive mistake.",
    readTime: "10 min",
    keywords: ["contract renewal", "auto-renewal", "electricity contracts", "renewal strategy"],
    relatedArticles: [2, 3, 10]
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
  },
  // STATE GUIDES
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
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", gradient: "from-blue-500 to-cyan-500" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", gradient: "from-green-500 to-emerald-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", gradient: "from-purple-500 to-pink-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", gradient: "from-orange-500 to-red-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200", gradient: "from-teal-500 to-cyan-500" }
};

export default function LearningCenter() {
  const [searchResults, setSearchResults] = useState(articles);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleSearch = (results) => {
    setSearchResults(results);
  };

  const filteredArticles = searchResults.filter(article => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesCategory;
  });

  const categories = ["All", ...new Set(articles.map(a => a.category))];

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Learning Center", url: "/learning-center" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Electricity Learning Center - Expert Guides to Save $500+ Per Year | Power Scouts"
        description="Master electricity shopping with expert guides on deregulation, rate comparison, plan types, and money-saving strategies. Serving TX, PA, NY, OH, IL, NJ, MD & 5 more states. Real examples, actionable tips, and step-by-step tutorials to lower your electricity bills."
        keywords="electricity guides, energy saving tips, electricity deregulation, compare electricity plans, fixed vs variable rates, switch electricity provider, lower electricity bill, Texas electricity guide, Houston electricity rates, electricity FAQs"
        canonical="/learning-center"
        structuredData={breadcrumbData}
      />

      {/* Hero Section - Reduced Height */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8 sm:py-10 lg:py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm mb-4">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Free Expert Guides</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Master Electricity Shopping & Save $500+ Annually
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-blue-100 mb-5">
              Expert guides with real examples to help you find the lowest rates
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl sm:text-2xl font-bold mb-0.5">{articles.length}+</div>
                <div className="text-xs text-blue-100">Guides</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl sm:text-2xl font-bold mb-0.5">$500+</div>
                <div className="text-xs text-blue-100">Avg. Savings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl sm:text-2xl font-bold mb-0.5">12</div>
                <div className="text-xs text-blue-100">States</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            {/* Enhanced Search Bar */}
            <div className="mb-8 sm:mb-10">
              <EnhancedSearch 
                articles={articles}
                onSearch={handleSearch}
              />
              {searchResults.length !== articles.length && (
                <p className="text-center text-gray-600 mt-3 text-sm">
                  Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} matching your search
                </p>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8 sm:mb-10">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-[#0A5C8C] text-white shadow-lg scale-105'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#0A5C8C] hover:text-[#0A5C8C]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Featured Article */}
            {searchResults.length === articles.length && selectedCategory === "All" && filteredArticles.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  Featured Guide
                </h2>
                {(() => {
                  const featured = filteredArticles[0];
                  const Icon = featured.icon;
                  const colors = colorClasses[featured.color];
                  return (
                    <Link to={createPageUrl("ArticleDetail") + `?id=${featured.id}`}>
                      <Card 
                        className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#0A5C8C] cursor-pointer group"
                      >
                        <div className="grid md:grid-cols-2 gap-0">
                          <div className="relative h-64 md:h-full overflow-hidden">
                            <img 
                              src={featured.image} 
                              alt={featured.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className={`absolute top-4 left-4 px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-bold uppercase`}>
                              {featured.category}
                            </div>
                          </div>
                          <div className="p-6 sm:p-8 flex flex-col justify-center">
                            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 group-hover:text-[#0A5C8C] transition-colors">
                              {featured.title}
                            </h3>
                            <p className="text-base text-gray-600 mb-4 leading-relaxed">
                              {featured.excerpt}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {featured.readTime} read
                              </span>
                              <ArrowRight className="w-6 h-6 text-[#FF6B35] group-hover:translate-x-2 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })()}
              </div>
            )}

            {/* Articles Grid */}
            {filteredArticles.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {selectedCategory === "All" ? "All Guides" : `${selectedCategory} Guides`}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {(selectedCategory === "All" && searchResults.length === articles.length ? filteredArticles.slice(1) : filteredArticles).map((article) => {
                    const Icon = article.icon;
                    const colors = colorClasses[article.color];
                    return (
                      <Link key={article.id} to={createPageUrl("ArticleDetail") + `?id=${article.id}`}>
                        <Card 
                          className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-[#0A5C8C] cursor-pointer group h-full flex flex-col"
                        >
                        <div className="relative h-48 overflow-hidden flex-shrink-0">
                          <img 
                            src={article.image} 
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className={`absolute top-3 left-3 px-2.5 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-bold uppercase`}>
                            {article.category}
                          </div>
                        </div>

                        <CardContent className="p-5 flex-1 flex flex-col">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#0A5C8C] transition-colors line-clamp-2">
                            {article.title}
                          </h3>

                          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1">
                            {article.excerpt}
                          </p>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {article.readTime}
                            </span>
                            <ArrowRight className="w-5 h-5 text-[#FF6B35] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">No articles found matching your search</p>
                <p className="text-sm text-gray-500 mb-6">Try different keywords or browse by category</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchResults(articles);
                    setSelectedCategory("All");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* CTA Section */}
            <section className="mt-12 sm:mt-16">
              <Card className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white border-0 overflow-hidden relative">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full"></div>
                  <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full"></div>
                </div>
                <CardContent className="p-8 sm:p-12 text-center relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                    Ready to Find Better Rates?
                  </h2>
                  <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                    Put your knowledge to work and start saving on electricity today
                  </p>
                  <Link to={createPageUrl("CompareRates")}>
                    <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all active:scale-95">
                      Compare Rates Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <p className="text-xs text-blue-200 mt-4">
                    Free comparison • No credit card required • Instant results
                  </p>
                </CardContent>
              </Card>
            </section>
      </div>
    </div>
  );
}