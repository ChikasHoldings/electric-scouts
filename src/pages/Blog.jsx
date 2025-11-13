import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock, ArrowRight, TrendingUp, Zap, DollarSign, Leaf, BookOpen } from "lucide-react";
import SEOHead, { getOrganizationSchema, getBreadcrumbSchema } from "../components/SEOHead";

const blogArticles = [
  {
    id: "understanding-electricity-deregulation-2024",
    slug: "understanding-electricity-deregulation-2024",
    title: "Understanding Electricity Deregulation in 2024: A Complete Guide",
    excerpt: "Learn how electricity deregulation works, which states are deregulated, and how you can save hundreds of dollars per year by choosing your own electricity provider.",
    category: "Education",
    readTime: "8 min read",
    date: "2024-01-15",
    icon: BookOpen,
    color: "blue",
    keywords: "electricity deregulation, deregulated states, choose electricity provider, energy choice"
  },
  {
    id: "fixed-vs-variable-electricity-rates",
    slug: "fixed-vs-variable-electricity-rates",
    title: "Fixed vs Variable Electricity Rates: Which Should You Choose?",
    excerpt: "Discover the key differences between fixed and variable rate electricity plans, plus expert tips on choosing the right option for your home and budget.",
    category: "Guides",
    readTime: "6 min read",
    date: "2024-01-20",
    icon: TrendingUp,
    color: "green",
    keywords: "fixed rate electricity, variable rate plans, electricity rates comparison, energy plans"
  },
  {
    id: "save-money-electricity-bill-2024",
    slug: "save-money-electricity-bill-2024",
    title: "10 Proven Ways to Save Money on Your Electricity Bill in 2024",
    excerpt: "Practical tips and strategies to reduce your electricity costs, from choosing the right plan to implementing energy-efficient habits in your home.",
    category: "Money Saving",
    readTime: "7 min read",
    date: "2024-02-01",
    icon: DollarSign,
    color: "yellow",
    keywords: "save money electricity, reduce electricity bill, lower energy costs, electricity savings tips"
  },
  {
    id: "renewable-energy-plans-guide",
    slug: "renewable-energy-plans-guide",
    title: "Renewable Energy Plans: Everything You Need to Know",
    excerpt: "Complete guide to green electricity plans - how they work, costs compared to traditional plans, and the environmental impact of choosing renewable energy.",
    category: "Green Energy",
    readTime: "9 min read",
    date: "2024-02-10",
    icon: Leaf,
    color: "green",
    keywords: "renewable energy plans, green electricity, solar energy plans, wind power electricity"
  },
  {
    id: "texas-electricity-market-guide",
    slug: "texas-electricity-market-guide",
    title: "The Texas Electricity Market: A Consumer's Guide",
    excerpt: "Everything Texas residents need to know about the deregulated electricity market, from choosing providers to understanding your bill.",
    category: "State Guides",
    readTime: "10 min read",
    date: "2024-02-15",
    icon: Zap,
    color: "orange",
    keywords: "Texas electricity, Texas power companies, Texas energy deregulation, electricity providers Texas"
  }
];

const categories = ["All", "Education", "Guides", "Money Saving", "Green Energy", "State Guides"];

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredArticles = blogArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-teal-500",
    yellow: "from-yellow-500 to-orange-500",
    orange: "from-orange-500 to-red-500",
    purple: "from-purple-500 to-pink-500"
  };

  const structuredData = {
    ...getOrganizationSchema(),
    "@type": ["Organization", "WebSite"],
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${window.location.origin}/blog?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Energy & Electricity Blog - Tips, Guides & News | Power Scouts"
        description="Expert advice on electricity deregulation, saving money on energy bills, renewable energy plans, and choosing the best electricity provider for your state."
        keywords="electricity blog, energy saving tips, electricity guides, deregulation news, renewable energy"
        canonical="/blog"
        structuredData={[structuredData, breadcrumbData]}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Energy & Electricity Insights
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Expert guides, money-saving tips, and the latest news on electricity deregulation
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base bg-white border-0 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {categories.map(category => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "default" : "outline"}
              className={selectedCategory === category ? "bg-[#0A5C8C] hover:bg-[#084a6f]" : ""}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article, index) => {
            const Icon = article.icon;
            return (
              <Link key={article.id} to={createPageUrl("BlogPost") + `?id=${article.slug}`}>
                <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#FF6B35] group">
                  <CardContent className="p-0">
                    {/* Article Header with Gradient */}
                    <div className={`h-48 bg-gradient-to-br ${colorClasses[article.color]} p-6 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                      </div>
                      <Icon className="w-24 h-24 text-white relative z-10" />
                    </div>

                    {/* Article Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold text-[#0A5C8C] bg-blue-50 px-3 py-1 rounded-full">
                          {article.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {article.readTime}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#0A5C8C] transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {article.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2 text-[#FF6B35] font-semibold text-sm group-hover:gap-3 transition-all">
                          Read More
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Saving on Electricity?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Compare rates from 40+ providers and find the best plan for your home
          </p>
          <Link to={createPageUrl("CompareRates")}>
            <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold">
              Compare Rates Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}