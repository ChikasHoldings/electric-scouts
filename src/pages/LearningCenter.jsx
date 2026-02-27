import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Article } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, Zap, DollarSign, Leaf, TrendingDown, Shield, 
  Clock, Users, ArrowRight, CheckCircle, MapPin, Building2, Home, FileText, Star, Tag, X
} from "lucide-react";
import SEOHead, { getBreadcrumbSchema, getArticleSchema } from "../components/SEOHead";
import EnhancedSearch from "../components/learning/EnhancedSearch";
import ArticleSuggestions from "../components/learning/ArticleSuggestions";

// Fallback local articles for initial display
const fallbackArticles = [
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
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/articles/hand-lit-light-bulb.jpg",
    excerpt: "Learn the exact process energy experts use to find the lowest rates and avoid hidden fees that cost you money.",
    readTime: "10 min",
    keywords: ["compare electricity rates", "save money electricity", "electricity shopping guide"],
    relatedArticles: [1, 3, 5]
  },
  {
    id: 3,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Fixed Rate vs Variable Rate: Which Saves You More Money?",
    description: "Real customer examples show you which electricity plan type works best for different situations.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/articles/man-cunting-stack-coins.jpg",
    excerpt: "See actual bills from families who chose fixed vs variable rates and discover which option is right for you.",
    readTime: "12 min",
    keywords: ["fixed rate electricity", "variable rate electricity", "best electricity plan type"],
    relatedArticles: [1, 2, 5]
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
    relatedArticles: [1, 2, 5]
  },
  {
    id: 5,
    category: "Business Energy",
    icon: Building2,
    color: "blue",
    title: "Business Electricity Rates: Complete Commercial Power Guide 2026",
    description: "Compare business electricity rates and save thousands on commercial power bills. Expert guide for small business and enterprise.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    excerpt: "Small businesses save $2,000-10,000 annually by shopping commercial electricity rates. Here's your complete guide.",
    readTime: "11 min",
    keywords: ["business electricity rates", "commercial power", "small business energy"],
    relatedArticles: [1, 2, 3]
  },
  {
    id: 106,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Nashua NH Electricity Rates 2026: Complete Guide to Save $550+ Annually",
    description: "Compare Nashua NH electricity rates from 16+ suppliers. Find cheapest power in Hillsborough County.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/89e68724-f3a0-408a-b82b-21c7f26fe660.jpg",
    excerpt: "Nashua residents can choose from 16+ competitive electricity suppliers while Eversource delivers power. Save $550+ annually.",
    readTime: "9 min",
    keywords: ["Nashua electricity", "NH power rates", "Eversource Nashua"],
    relatedArticles: [107, 108, 1]
  },
  {
    id: 107,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Concord NH Electricity Rates 2026: Capital City Power Guide - Save $540+",
    description: "Compare Concord NH electricity rates from 16+ Eversource suppliers. Find cheapest power in Merrimack County.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/c2b6c002-b461-43af-873e-02caf45e467b.jpg",
    excerpt: "Concord's state capital residents save an average of $540 annually by comparing 16+ competitive electricity suppliers.",
    readTime: "9 min",
    keywords: ["Concord NH electricity", "Merrimack County power", "Eversource Concord"],
    relatedArticles: [106, 108, 1]
  },
  {
    id: 108,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Warwick RI Electricity Rates 2026: Kent County Power Guide - Save $520+",
    description: "Compare Warwick RI electricity rates from 15+ National Grid suppliers. Find cheapest power in Kent County.",
    image: "https://iwguavsojnbzveutwzpw.supabase.co/storage/v1/object/public/content/cities/a37c566e-4168-4be1-a823-20bf311f7ed9.jpg",
    excerpt: "Warwick residents save an average of $520 per year by shopping 15+ competitive electricity suppliers serving Kent County.",
    readTime: "9 min",
    keywords: ["Warwick electricity", "Kent County RI power", "National Grid Warwick"],
    relatedArticles: [106, 107, 1]
  },
  {
    id: 6,
    category: "Getting Started",
    icon: DollarSign,
    color: "blue",
    title: "Average Electric Bill by State: Complete 2026 Guide",
    description: "A comprehensive guide to understanding the average electric bill and electricity rates across the United States.",
    image: "https://images.unsplash.com/photo-1680082362830-5472b5231559?w=1200&q=80",
    excerpt: "Navigating the complex world of electricity costs can be a daunting task. This guide breaks down the average electric bill by state, helping you understand the factors that influence your energy expenses.",
    readTime: "12 min",
    keywords: ["average electric bill", "electricity rates", "electricity cost"],
    relatedArticles: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15]
},
  {
    id: 7,
    category: "Getting Started",
    icon: FileText,
    color: "blue",
    title: "How to Switch Electricity Providers: Step-by-Step Guide 2026",
    description: "A step-by-step guide to choosing a new electricity provider and lowering your monthly bills.",
    image: "https://images.unsplash.com/photo-1487875961445-47a00398c267?w=1200&q=80",
    excerpt: "Tired of high electricity bills? You have the power to choose your provider and save. Our 2026 guide breaks down the simple, step-by-step process to switch electricity providers without any service interruption.",
    readTime: "8 min",
    keywords: ["how to switch electricity providers", "switch electricity", "change electricity provider"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 8, 9, 10]
},
  {
    id: 8,
    category: "State Guides",
    icon: MapPin,
    color: "orange",
    title: "Cheapest Electricity Plans in Texas 2026: Find Rates Under 8¢/kWh",
    description: "Our 2026 guide to Texas electricity helps you find the cheapest rates, with some plans under 8¢/kWh.",
    image: "https://images.unsplash.com/photo-1615792502322-42de6837a054?w=1200&q=80",
    excerpt: "Looking for the cheapest electricity in Texas? Our 2026 guide helps you find plans under 8¢/kWh. Compare Texas electricity rates and save big on your energy bill.",
    readTime: "12 min",
    keywords: ["cheapest electricity in Texas", "cheap electricity Texas", "Texas electricity rates"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]
},
  {
    id: 9,
    category: "Plan Types",
    icon: FileText,
    color: "purple",
    title: "No Deposit Electricity Plans: Complete Guide to Getting Power Without a Deposit",
    description: "Learn how to get electricity service without a large upfront security deposit. This guide covers no-deposit and no-credit-check electricity plans.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059ee41f?w=1200&q=80",
    excerpt: "Tired of hefty security deposits for your electricity service? Our comprehensive guide explores the world of no deposit electricity plans, helping you get power without the upfront financial burden. Discover how these plans work, who they're best for, and how to choose the right provider. Say goodbye to credit checks and hello to flexible, hassle-free energy.",
    readTime: "12 min",
    keywords: ["no deposit electricity", "no credit check electricity", "prepaid electricity"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15]
},
  {
    id: 10,
    category: "Getting Started",
    icon: FileText,
    color: "blue",
    title: "How to Read Your Electricity Bill: Find Hidden Charges and Save Money",
    description: "A comprehensive guide to understanding your electricity bill, from decoding charges to finding hidden fees and saving money.",
    image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=1200&q=80",
    excerpt: "Tired of confusing electricity bills? This article breaks down every section, explains complex charges in simple terms, and reveals how to spot hidden fees so you can take control of your energy costs and start saving.",
    readTime: "12 min",
    keywords: ["how to read electricity bill", "electricity bill explained", "understand electric bill"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15]
},
  {
    id: 11,
    category: "Plan Types",
    icon: Building2,
    color: "purple",
    title: "Best Electricity Plans for Apartments 2026: Renter-Friendly Options",
    description: "A comprehensive guide to finding the best electricity plans for apartments, focusing on renter-friendly options.",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200&q=80",
    excerpt: "Finding the best electricity for apartments can be a challenge. This guide breaks down everything you need to know about renter-friendly electricity plans, from no-deposit options to short-term contracts, helping you save money and find the perfect plan for your apartment.",
    readTime: "12 min",
    keywords: ["apartment electricity", "best electricity for apartments", "electricity for renters"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15]
},
  {
    id: 12,
    category: "Renewable Energy",
    icon: Leaf,
    color: "green",
    title: "Solar Energy vs Traditional Electricity: Complete Cost Comparison 2026",
    description: "A comprehensive breakdown of the costs and benefits of solar energy compared to traditional grid electricity in 2026.",
    image: "https://images.unsplash.com/photo-1532980409393-542145529197?w=1200&q=80",
    excerpt: "Tired of rising electricity bills? Discover how switching to solar energy can lead to significant long-term savings and energy independence. Our 2026 cost comparison has all the details.",
    readTime: "12 min",
    keywords: ["solar energy", "solar vs electricity cost", "solar panel savings"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15]
},
  {
    id: 13,
    category: "Market Insights",
    icon: TrendingDown,
    color: "orange",
    title: "Electricity Rates Forecast 2026-2027: What Consumers Should Expect",
    description: "A comprehensive look at the factors driving electricity prices higher and what you can do to save.",
    image: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?w=1200&q=80",
    excerpt: "With electricity prices on the rise, our 2026-2027 forecast breaks down the key drivers, from natural gas volatility to the surge in AI data centers. Learn what to expect and how to secure a lower rate.",
    readTime: "8 min",
    keywords: ["electricity rates forecast", "electricity prices going up", "energy prices 2026"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15]
},
  {
    id: 14,
    category: "Saving Money",
    icon: DollarSign,
    color: "green",
    title: "How to Lower Your Electric Bill: 25 Proven Tips That Save $500+ Per Year",
    description: "Discover 25 proven tips to help you lower your electric bill and save over $500 annually. Learn how to reduce your energy consumption and keep more money in your pocket.",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80",
    excerpt: "Tired of high electricity bills? This comprehensive guide provides 25 actionable tips to help you save $500 or more per year on your energy costs. From simple habit changes to smart home upgrades, you'll find everything you need to know to start saving today.",
    readTime: "15 min",
    keywords: ["how to lower electric bill", "save money on electricity", "reduce electric bill"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15]
},
  {
    id: 15,
    category: "Getting Started",
    icon: BookOpen,
    color: "blue",
    title: "Electricity Deregulation Explained: Which States Let You Choose Your Provider?",
    description: "Understand the power of energy choice and discover if you live in a state with a deregulated electricity market.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
    excerpt: "For decades, consumers had no say in their electricity provider. But with the rise of electricity deregulation, the power is now in your hands. This guide breaks down what energy choice means, which states have it, and how you can benefit.",
    readTime: "8 min",
    keywords: ["electricity deregulation", "deregulated electricity states", "energy choice states"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
},
];

const colorClasses = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", gradient: "from-blue-500 to-cyan-500" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", gradient: "from-green-500 to-emerald-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", gradient: "from-purple-500 to-pink-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", gradient: "from-orange-500 to-red-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200", gradient: "from-teal-500 to-cyan-500" }
};

export default function LearningCenter() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedReadability, setSelectedReadability] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch articles from database
  const { data: dbArticles = [], isLoading, error } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      try {
        const articles = await Article.filter({ published: true }, '-created_date', 1000);
        return articles || [];
      } catch (err) {
        console.error('Failed to fetch articles:', err);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  // Map database articles to expected format with proper icons
  const getCategoryIcon = (category) => {
    const iconMap = {
      "Getting Started": BookOpen,
      "Saving Money": DollarSign,
      "Plan Types": Zap,
      "Renewable Energy": Leaf,
      "Business Energy": Building2,
      "City Guides": MapPin,
      "State Guides": MapPin,
      "Understanding Bills": FileText,
      "Consumer Protection": Shield,
      "Switching Providers": TrendingDown,
      "Seasonal Tips": Clock
    };
    return iconMap[category] || BookOpen;
  };

  const getCategoryColor = (category) => {
    const colorMap = {
      "Getting Started": "blue",
      "Saving Money": "green",
      "Plan Types": "purple",
      "Renewable Energy": "green",
      "Business Energy": "blue",
      "City Guides": "teal",
      "State Guides": "teal",
      "Understanding Bills": "orange",
      "Consumer Protection": "purple",
      "Switching Providers": "orange",
      "Seasonal Tips": "blue"
    };
    return colorMap[category] || "blue";
  };

  const articles = React.useMemo(() => {
    if (!dbArticles || dbArticles.length === 0) {
      return fallbackArticles;
    }
    const mapped = dbArticles.map(article => {
      // Handle both nested and flat data structures
      const data = article.data || article;
      const articleId = article.id || data.id;
      
      const mapped = {
        id: articleId,
        category: data.category || "Getting Started",
        icon: getCategoryIcon(data.category || "Getting Started"),
        color: getCategoryColor(data.category || "Getting Started"),
        title: data.title || "Untitled Article",
        description: data.meta_description || data.description || data.excerpt,
        image: data.featured_image || "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80",
        excerpt: data.excerpt || data.meta_description || "",
        readTime: data.read_time || "5 min",
        keywords: data.keywords || [],
        relatedArticles: data.related_articles || []
      };
      return mapped;
    });
    return mapped;
  }, [dbArticles]);

  const [searchResults, setSearchResults] = useState(articles);

  // Update search results when articles change
  React.useEffect(() => {
    setSearchResults(articles);
  }, [articles]);

  const handleSearch = (results, searchTerm) => {
    setSearchResults(results);
    setCurrentSearchTerm(searchTerm || "");
  };

  // Extract all unique tags from articles
  const allTags = React.useMemo(() => {
    const tagsSet = new Set();
    articles.forEach(article => {
      if (article.keywords && Array.isArray(article.keywords)) {
        article.keywords.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [articles]);

  // Calculate readability level based on read time
  const getReadability = (readTime) => {
    const minutes = parseInt(readTime);
    if (minutes <= 5) return "Quick Read";
    if (minutes <= 10) return "Medium Read";
    return "In-Depth";
  };

  const filteredArticles = searchResults.filter(article => {
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    
    const matchesTags = selectedTags.length === 0 || 
      (article.keywords && selectedTags.some(tag => 
        article.keywords.some(k => k.toLowerCase() === tag.toLowerCase())
      ));
    
    const articleReadability = getReadability(article.readTime);
    const matchesReadability = selectedReadability === "All" || articleReadability === selectedReadability;
    
    return matchesCategory && matchesTags && matchesReadability;
  });

  const categories = ["All", ...new Set(articles.map(a => a.category))];

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Learning Center", url: "/learning-center" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Electricity Learning Center - Expert Guides to Save $500+ Per Year | ElectricScouts"
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
                <div className="text-xl sm:text-2xl font-bold mb-0.5">{articles.length}</div>
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
              {(searchResults.length !== articles.length || selectedTags.length > 0 || selectedReadability !== "All" || selectedCategory !== "All") && (
                <p className="text-center text-gray-600 mt-3 text-sm">
                  Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                  {searchResults.length !== articles.length && ' matching your search'}
                  {(selectedTags.length > 0 || selectedReadability !== "All" || selectedCategory !== "All") && ' with active filters'}
                </p>
              )}
            </div>

            {/* AI Suggestions */}
            {currentSearchTerm && (
              <div className="mb-8">
                <ArticleSuggestions 
                  searchTerm={currentSearchTerm} 
                  currentCategory={selectedCategory !== "All" ? selectedCategory : null}
                />
              </div>
            )}

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6">
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

            {/* Advanced Filters Toggle */}
            <div className="text-center mb-8">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-2 hover:border-[#0A5C8C] hover:text-[#0A5C8C]"
              >
                <Shield className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Advanced Filters
                {(selectedTags.length > 0 || selectedReadability !== "All") && (
                  <span className="ml-2 bg-[#FF6B35] text-white text-xs px-2 py-0.5 rounded-full">
                    {selectedTags.length + (selectedReadability !== "All" ? 1 : 0)}
                  </span>
                )}
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <Card className="mb-8 border-2 border-gray-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Readability Filter */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0A5C8C]" />
                        Reading Time
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {["All", "Quick Read", "Medium Read", "In-Depth"].map((level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedReadability(level)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedReadability === level
                                ? 'bg-[#0A5C8C] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {level}
                            {level !== "All" && (
                              <span className="ml-2 text-xs opacity-75">
                                {level === "Quick Read" ? "≤5 min" : 
                                 level === "Medium Read" ? "6-10 min" : ">10 min"}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags Filter */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#0A5C8C]" />
                        Filter by Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {allTags.slice(0, 15).map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSelectedTags(prev => 
                                prev.includes(tag)
                                  ? prev.filter(t => t !== tag)
                                  : [...prev, tag]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              selectedTags.includes(tag)
                                ? 'bg-[#FF6B35] text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      {allTags.length > 15 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Showing 15 of {allTags.length} tags
                        </p>
                      )}
                    </div>

                    {/* Active Filters Summary */}
                    {(selectedTags.length > 0 || selectedReadability !== "All" || selectedCategory !== "All") && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900">Active Filters:</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory("All");
                              setSelectedTags([]);
                              setSelectedReadability("All");
                            }}
                            className="text-xs text-[#FF6B35] hover:text-[#e55a2b]"
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategory !== "All" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              Category: {selectedCategory}
                              <button onClick={() => setSelectedCategory("All")} className="hover:text-blue-900">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          {selectedReadability !== "All" && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              {selectedReadability}
                              <button onClick={() => setSelectedReadability("All")} className="hover:text-green-900">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )}
                          {selectedTags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              {tag}
                              <button onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} className="hover:text-orange-900">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
                          <div className="relative h-48 md:h-full overflow-hidden">
                            <img 
                              src={featured.image} 
                              alt={featured.title}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            loading="lazy" />
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
                          loading="lazy" />
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
                <p className="text-xl text-gray-600 mb-4">No articles found matching your filters</p>
                <p className="text-sm text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchResults(articles);
                    setSelectedCategory("All");
                    setSelectedTags([]);
                    setSelectedReadability("All");
                    setCurrentSearchTerm("");
                  }}
                >
                  Clear All Filters
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