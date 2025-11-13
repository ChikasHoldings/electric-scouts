import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, Zap, DollarSign, Leaf, TrendingDown, Shield, 
  Clock, Users, ArrowRight, Search, CheckCircle, MapPin, Building2, Home, FileText, Star
} from "lucide-react";
import SEOHead, { getBreadcrumbSchema, getArticleSchema } from "../components/SEOHead";

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
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", gradient: "from-blue-500 to-cyan-500" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", gradient: "from-green-500 to-emerald-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", gradient: "from-purple-500 to-pink-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", gradient: "from-orange-500 to-red-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200", gradient: "from-teal-500 to-cyan-500" }
};

export default function LearningCenter() {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
              <BookOpen className="w-4 h-4" />
              <span>Free Expert Guides</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Master Electricity Shopping & Save $500+ Annually
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8">
              Expert guides with real examples to help you find the lowest rates and avoid common mistakes
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl sm:text-3xl font-bold mb-1">{articles.length}+</div>
                <div className="text-xs sm:text-sm text-blue-100">Expert Guides</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl sm:text-3xl font-bold mb-1">$500+</div>
                <div className="text-xs sm:text-sm text-blue-100">Avg. Savings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-2xl sm:text-3xl font-bold mb-1">12</div>
                <div className="text-xs sm:text-sm text-blue-100">States Covered</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {!selectedArticle ? (
          <>
            {/* Search Bar */}
            <div className="mb-8 sm:mb-10">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search articles, topics, or cities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-base border-2 shadow-lg rounded-xl"
                />
              </div>
              {searchTerm && (
                <p className="text-center text-gray-600 mt-3 text-sm">
                  Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
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
            {!searchTerm && selectedCategory === "All" && filteredArticles.length > 0 && (
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
                    <Card 
                      className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#0A5C8C] cursor-pointer group"
                      onClick={() => setSelectedArticle(featured)}
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
                  {(selectedCategory === "All" && !searchTerm ? filteredArticles.slice(1) : filteredArticles).map((article) => {
                    const Icon = article.icon;
                    const colors = colorClasses[article.color];
                    return (
                      <Card 
                        key={article.id} 
                        className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-[#0A5C8C] cursor-pointer group h-full flex flex-col"
                        onClick={() => setSelectedArticle(article)}
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
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600 mb-4">No articles found matching "{searchTerm}"</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
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
          </>
        ) : (
          /* Article Detail View */
          <div className="max-w-4xl mx-auto">
            <Button
              variant="outline"
              onClick={() => setSelectedArticle(null)}
              className="mb-6 rounded-xl"
            >
              ← Back to All Guides
            </Button>

            {/* Article Content */}
            <article className="bg-white rounded-2xl shadow-xl border-2 overflow-hidden">
              {/* Hero Image */}
              <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                <img 
                  src={selectedArticle.image} 
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  {(() => {
                    const colors = colorClasses[selectedArticle.color];
                    return (
                      <div className={`inline-flex px-3 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-bold uppercase mb-3`}>
                        {selectedArticle.category}
                      </div>
                    );
                  })()}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                    {selectedArticle.title}
                  </h1>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {selectedArticle.readTime} read
                    </span>
                  </div>
                </div>
              </div>

              {/* Article Body */}
              <div className="p-6 sm:p-10 lg:p-12">
                <div className="prose prose-lg max-w-none">
                  <p className="text-xl text-gray-700 leading-relaxed mb-8 border-l-4 border-[#FF6B35] pl-6 py-2 bg-gray-50 rounded-r-lg">
                    {selectedArticle.description}
                  </p>
                  
                  <p className="text-base text-gray-600 leading-relaxed mb-6">
                    {selectedArticle.excerpt}
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
            {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Guides</h2>
                <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
                  {selectedArticle.relatedArticles.map(relatedId => {
                    const related = articles.find(a => a.id === relatedId);
                    if (!related) return null;
                    const Icon = related.icon;
                    const colors = colorClasses[related.color];
                    return (
                      <Card 
                        key={related.id} 
                        className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#0A5C8C]"
                        onClick={() => {
                          setSelectedArticle(related);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <CardContent className="p-5">
                          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-3`}>
                            <Icon className={`w-6 h-6 ${colors.text}`} />
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
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}