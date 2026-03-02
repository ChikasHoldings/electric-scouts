import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Article } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  BookOpen, Zap, DollarSign, Leaf, TrendingDown, Shield, 
  Clock, Users, ArrowRight, MapPin, Building2, FileText
} from "lucide-react";
import SEOHead, { getArticleSchema, getBreadcrumbSchema } from "../components/SEOHead";
// Dynamic import for code splitting - fullArticles is 776KB and should only load when needed
const getFullArticleDynamic = async (articleId) => {
  const module = await import("../components/learning/fullArticles");
  return module.getFullArticle(articleId);
};
import ArticleRecommendations from "../components/learning/ArticleRecommendations";
import ArticleSuggestions from "../components/learning/ArticleSuggestions";
import { trackDailyReading } from "../components/learning/ReadingAnalytics";
import { fixArticleLinks } from "../components/learning/fixArticleLinks";
import InArticleCTA from "../components/learning/InArticleCTA";
import SocialShareBar from "../components/SocialShareBar";

// Fallback articles
const fallbackArticles = [
  {
    id: 1,
    category: "Getting Started",
    icon: BookOpen,
    color: "blue",
    title: "Understanding Deregulated Electricity Markets: Your Complete Guide",
    description: "Learn how energy deregulation works and how it can save you hundreds on your electricity bills each year.",
    image: "/images/articles/article-1-deregulated-markets.jpg",
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
    image: "/images/articles/article-2-compare-rates.jpg",
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
    image: "/images/articles/article-3-fixed-vs-variable.jpg",
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
    image: "/images/articles/article-4-green-energy.jpg",
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
    image: "/images/articles/article-5-business-rates.jpg",
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
    image: "/images/articles/article-6-nashua-nh.jpg",
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
    image: "/images/articles/article-7-concord-nh.jpg",
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
    image: "/images/articles/article-8-warwick-ri.jpg",
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
    image: "/images/articles/article-9-avg-electric-bill.jpg",
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
    image: "/images/articles/article-10-switch-providers.jpg",
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
    image: "/images/articles/article-11-cheapest-texas.jpg",
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
    image: "/images/articles/article-12-no-deposit.jpg",
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
    image: "/images/articles/article-13-read-bill.jpg",
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
    image: "/images/articles/article-14-apartments.jpg",
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
    image: "/images/articles/article-15-solar-vs-traditional.jpg",
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
    image: "/images/articles/article-16-rates-forecast.jpg",
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
    image: "/images/articles/article-17-lower-bill-tips.jpg",
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
    image: "/images/articles/article-18-deregulation-states.jpg",
    excerpt: "For decades, consumers had no say in their electricity provider. But with the rise of electricity deregulation, the power is now in your hands. This guide breaks down what energy choice means, which states have it, and how you can benefit.",
    readTime: "8 min",
    keywords: ["electricity deregulation", "deregulated electricity states", "energy choice states"],
    relatedArticles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
},
  {
    id: 16,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Texas Electricity Rates Guide 2026: Everything You Need to Know",
    description: "Discover the latest Texas electricity rates for 2026. Compare energy providers and find the best plans. Get informed and save today with Power to Choose Texas!",
    image: "/images/articles/article-16.jpg",
    excerpt: "Stay ahead with the latest Texas electricity rates for 2026. Learn how to choose the best energy provider and save on your bills today.",
    readTime: "12 min",
    keywords: ["texas electricity rates", "texas energy providers", "power to choose texas", "texas electricity companies"],
    relatedArticles: [17, 18, 19]
  },
  {
    id: 17,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Illinois Electricity Rates Guide 2026: Compare Providers and Save",
    description: "Discover the latest Illinois electricity rates for 2026. Compare energy providers and ComEd alternatives today to save on your energy bills. Act now!",
    image: "/images/articles/article-17.jpg",
    excerpt: "Stay ahead with our comprehensive Illinois Electricity Rates Guide 2026. Compare providers and find the best energy options to save money and switch easily.",
    readTime: "10 min",
    keywords: ["illinois electricity rates", "illinois energy providers", "ComEd alternatives", "illinois electricity choice"],
    relatedArticles: [16, 18, 19]
  },
  {
    id: 18,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Ohio Electricity Rates Guide 2026: Your Complete Shopping Guide",
    description: "Discover the latest Ohio electricity rates for 2026. Compare providers and save with our complete guide. Start saving today with PowerUp!",
    image: "/images/articles/article-18.jpg",
    excerpt: "Navigate Ohio's energy market with our comprehensive 2026 electricity rates guide. Find the best plans and providers to save on your energy bills.",
    readTime: "10 min",
    keywords: ["ohio electricity rates", "ohio energy choice", "PUCO suppliers", "ohio electricity providers"],
    relatedArticles: [16, 17, 19]
  },
  {
    id: 19,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Pennsylvania Electricity Rates 2026: Compare PA Suppliers and Save",
    description: "Discover the latest Pennsylvania electricity rates for 2026. Compare PA energy suppliers and save today. Learn more with PA PUC guidance!",
    image: "/images/articles/article-19.jpg",
    excerpt: "Stay ahead with the latest Pennsylvania electricity rates for 2026. Compare top PA energy suppliers and make informed energy choices today.",
    readTime: "10 min",
    keywords: ["pennsylvania electricity rates", "pa energy suppliers", "PAPUC", "pennsylvania electricity choice"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 20,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "New York Electricity Rates 2026: ESCO Guide for NY Consumers",
    description: "Discover the latest New York electricity rates for 2026. Explore NY energy suppliers and ConEd alternatives. Save money—learn more today!",
    image: "/images/articles/article-20.jpg",
    excerpt: "Stay informed about New York electricity rates in 2026 with our comprehensive ESCO guide. Find the best energy options and save on your utility bills now.",
    readTime: "10 min",
    keywords: ["new york electricity rates", "ny energy suppliers", "ConEd alternatives", "new york esco"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 21,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "New Jersey Electricity Rates 2026: Compare NJ Suppliers",
    description: "Discover the latest New Jersey electricity rates for 2026. Compare NJ energy suppliers and PSEG alternatives today. Save money—get started now!",
    image: "/images/articles/article-21.jpg",
    excerpt: "Explore how New Jersey electricity rates are changing in 2026 and find the best NJ energy suppliers and PSEG alternatives to save on your energy bills.",
    readTime: "9 min",
    keywords: ["new jersey electricity rates", "nj energy suppliers", "pseg alternatives"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 22,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Maryland Electricity Rates 2026: BGE Alternatives and Savings",
    description: "Discover the latest Maryland electricity rates for 2026, explore BGE alternatives, and find top MD energy suppliers to save money. Compare options today!",
    image: "/images/articles/article-22.jpg",
    excerpt: "Learn how to save on Maryland electricity rates in 2026 by exploring BGE alternatives and choosing the best MD energy suppliers for your needs. Start saving now!",
    readTime: "9 min",
    keywords: ["maryland electricity rates", "bge alternatives", "md energy suppliers"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 23,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Massachusetts Electricity Rates 2026: Compare MA Suppliers",
    description: "Discover the latest Massachusetts electricity rates for 2026. Compare MA energy suppliers and Eversource alternatives today. Save on your energy costs!",
    image: "/images/articles/article-23.jpg",
    excerpt: "Stay ahead with the latest Massachusetts electricity rates for 2026. Find the best MA energy suppliers and Eversource alternatives to save money now.",
    readTime: "9 min",
    keywords: ["massachusetts electricity rates", "eversource alternatives", "ma energy suppliers"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 24,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Connecticut Electricity Rates 2026: Compare CT Suppliers",
    description: "Discover the latest Connecticut electricity rates for 2026. Compare CT energy suppliers and Eversource CT alternatives today. Save on your energy bills now!",
    image: "/images/articles/article-24.jpg",
    excerpt: "Stay ahead with the latest Connecticut electricity rates for 2026. Find the best CT energy suppliers and Eversource alternatives to save money and power your home.",
    readTime: "9 min",
    keywords: ["connecticut electricity rates", "ct energy suppliers", "eversource ct alternatives"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 25,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Maine Electricity Rates 2026: CMP Alternatives and Savings",
    description: "Discover the latest Maine electricity rates for 2026, explore CMP alternatives, and save with top Maine energy suppliers. Find your best energy plan today!",
    image: "/images/articles/article-25.jpg",
    excerpt: "Explore how Maine residents can navigate 2026 electricity rates, compare CMP alternatives, and maximize savings with leading energy suppliers. Stay informed and save now!",
    readTime: "8 min",
    keywords: ["maine electricity rates", "cmp alternatives", "maine energy suppliers"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 26,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "New Hampshire Electricity Rates 2026: Compare NH Suppliers",
    description: "Discover the latest New Hampshire electricity rates for 2026. Compare NH energy suppliers and Eversource NH alternatives today. Save on your energy costs now!",
    image: "/images/articles/article-26.jpg",
    excerpt: "Stay ahead with the latest New Hampshire electricity rates for 2026. Find the best NH energy suppliers and Eversource alternatives to save money and power your home.",
    readTime: "8 min",
    keywords: ["new hampshire electricity rates", "eversource nh alternatives", "nh energy suppliers"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 27,
    category: "State Guides",
    icon: MapPin,
    color: "teal",
    title: "Rhode Island Electricity Rates 2026: Compare RI Suppliers",
    description: "Discover the latest Rhode Island electricity rates for 2026. Compare RI energy suppliers and explore energy alternatives. Save on your bill today!",
    image: "/images/articles/article-27.jpg",
    excerpt: "Stay ahead with the latest Rhode Island electricity rates in 2026. Compare energy suppliers and find the best RI energy alternatives for your needs.",
    readTime: "8 min",
    keywords: ["rhode island electricity rates", "ri energy suppliers", "rhode island energy alternatives"],
    relatedArticles: [16, 17, 18]
  },
  {
    id: 28,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Houston Electricity Rates 2026: Best Plans Under 10¢/kWh",
    description: "Discover the latest Houston electricity rates for 2026 with affordable plans under 10¢/kWh. Save money today—explore the best electricity options in Houston now!",
    image: "/images/articles/article-28.jpg",
    excerpt: "Looking for cheap electricity in Houston? Find the best energy plans under 10¢/kWh for 2026 and start saving on your power bills today.",
    readTime: "10 min",
    keywords: ["houston electricity rates", "cheap electricity houston", "houston energy plans", "best electricity houston"],
    relatedArticles: [29, 30, 31]
  },
  {
    id: 29,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Dallas Electricity Rates 2026: Compare DFW Energy Plans",
    description: "Discover the latest Dallas electricity rates for 2026. Compare DFW energy plans and providers today. Save money on your energy bills – get started now!",
    image: "/images/articles/article-29.jpg",
    excerpt: "Stay ahead with the latest Dallas electricity rates for 2026. Compare top DFW energy plans and providers to find the best deal for your home or business.",
    readTime: "10 min",
    keywords: ["dallas electricity rates", "dallas energy plans", "dfw electricity", "dallas electricity providers"],
    relatedArticles: [28, 30, 31]
  },
  {
    id: 30,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Chicago Electricity Rates 2026: ComEd Alternatives That Save",
    description: "Discover affordable Chicago electricity rates for 2026 with top ComEd alternatives. Explore energy plans that save you money. Switch today for better rates!",
    image: "/images/articles/article-30.jpg",
    excerpt: "Looking for cheaper Chicago electricity rates in 2026? Explore top ComEd alternatives and energy plans designed to save you money and power your home efficiently.",
    readTime: "10 min",
    keywords: ["chicago electricity rates", "comed alternatives chicago", "chicago energy plans"],
    relatedArticles: [28, 29, 31]
  },
  {
    id: 31,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Philadelphia Electricity Rates 2026: PECO Alternatives Guide",
    description: "Discover the latest Philadelphia electricity rates for 2026 and explore PECO alternatives. Find the best philly electricity plans today. Compare now!",
    image: "/images/articles/article-31.jpg",
    excerpt: "Looking for affordable Philadelphia electricity rates in 2026? Our guide covers PECO alternatives and top plans to help you save. Explore your options now!",
    readTime: "10 min",
    keywords: ["philadelphia electricity rates", "peco alternatives", "philly electricity plans"],
    relatedArticles: [28, 29, 30]
  },
  {
    id: 32,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "New York City Electricity Rates 2026: ConEd Alternative Guide",
    description: "Discover the latest NYC electricity rates for 2026 and explore Con Edison alternatives. Find the best energy plans in New York City today. Learn more now!",
    image: "/images/articles/article-32.jpg",
    excerpt: "Stay ahead with our comprehensive guide to NYC electricity rates in 2026 and explore top ConEd alternatives. Make informed energy choices today.",
    readTime: "10 min",
    keywords: ["nyc electricity rates", "con edison alternatives", "new york city energy plans"],
    relatedArticles: [28, 29, 30]
  },
  {
    id: 33,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "San Antonio Electricity Rates 2026: CPS Energy Alternatives",
    description: "Discover the latest San Antonio electricity rates for 2026 and explore CPS Energy alternatives. Find the best energy plans today. Act now for savings!",
    image: "/images/articles/article-33.jpg",
    excerpt: "Explore the upcoming San Antonio electricity rates for 2026 and learn about CPS Energy alternatives to optimize your energy costs. Make informed choices today!",
    readTime: "9 min",
    keywords: ["san antonio electricity rates", "cps energy alternatives", "san antonio energy plans"],
    relatedArticles: [28, 29, 30]
  },
  {
    id: 34,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Austin Electricity Rates 2026: Austin Energy Alternatives",
    description: "Discover the latest Austin electricity rates and explore top Austin energy alternatives. Find the best plans today and save on your energy bills with PowerUp Austin!",
    image: "/images/articles/article-34.jpg",
    excerpt: "Explore Austin's electricity rates for 2026 and discover alternative energy options to save money and reduce your carbon footprint. Make informed energy choices now.",
    readTime: "9 min",
    keywords: ["austin electricity rates", "austin energy alternatives", "austin energy plans"],
    relatedArticles: [28, 29, 30]
  },
  {
    id: 35,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Columbus Ohio Electricity Rates 2026: AEP Alternatives",
    description: "Discover the best Columbus Ohio electricity rates for 2026 and explore AEP Ohio alternatives. Find the right energy plan today—save more on your bill!",
    image: "/images/articles/article-35.jpg",
    excerpt: "Looking for affordable Columbus Ohio electricity options in 2026? Explore AEP Ohio alternatives and energy plans to optimize your savings today.",
    readTime: "9 min",
    keywords: ["columbus ohio electricity", "aep ohio alternatives", "columbus energy plans"],
    relatedArticles: [28, 29, 30]
  },
  {
    id: 36,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Baltimore Electricity Rates 2026: BGE Alternatives Guide",
    description: "Discover the latest Baltimore electricity rates for 2026 and explore BGE alternatives. Find the best Baltimore energy plans today. Save on your energy costs!",
    image: "/images/articles/article-36.jpg",
    excerpt: "Looking for affordable Baltimore energy plans? Our guide covers 2026 electricity rates and top BGE alternatives to help you save on energy costs.",
    readTime: "9 min",
    keywords: ["baltimore electricity rates", "bge alternatives baltimore", "baltimore energy plans"],
    relatedArticles: [28, 29, 30]
  },
  {
    id: 37,
    category: "City Guides",
    icon: MapPin,
    color: "teal",
    title: "Boston Electricity Rates 2026: Eversource Alternatives",
    description: "Explore top Eversource alternatives in Boston for 2026. Discover affordable energy plans today and make smarter energy choices. Get started now!",
    image: "/images/articles/article-37.jpg",
    excerpt: "Looking for affordable Boston electricity rates in 2026? Discover the best Eversource alternatives and energy plans to save money and power your home efficiently.",
    readTime: "9 min",
    keywords: ["boston electricity rates", "eversource alternatives boston", "boston energy plans"],
    relatedArticles: [28, 29, 30]
  },
  {
    id: 38,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "TXU Energy vs Reliant Energy 2026: Which Texas Provider is Better?",
    description: "Compare TXU Energy and Reliant Energy for 2026. Discover reviews, rates, and which provider suits your needs. Find the best Texas energy plan today!",
    image: "/images/articles/article-38.jpg",
    excerpt: "Explore the key differences between TXU Energy and Reliant Energy in 2026. Make an informed choice for your Texas energy needs with our detailed comparison.",
    readTime: "11 min",
    keywords: ["txu vs reliant", "txu energy reviews", "reliant energy reviews", "txu energy rates"],
    relatedArticles: [39, 40, 41]
  },
  {
    id: 39,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Green Mountain Energy Review 2026: Plans, Rates, and Pros/Cons",
    description: "Discover Green Mountain Energy's 2026 plans, rates, and pros/cons. Make an informed choice—read our comprehensive review and switch today for greener energy!",
    image: "/images/articles/article-39.jpg",
    excerpt: "Explore the latest Green Mountain Energy review for 2026, including plans, rates, and advantages. Find out if this eco-friendly provider is right for you.",
    readTime: "10 min",
    keywords: ["green mountain energy review", "green mountain energy rates", "green mountain energy plans"],
    relatedArticles: [38, 40, 41]
  },
  {
    id: 40,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Octopus Energy Review 2026: Plans, Rates, and Customer Experience",
    description: "Discover the latest Octopus Energy review for 2026. Explore plans, rates, and customer experiences. Find out if Octopus Energy is right for you today!",
    image: "/images/articles/article-40.jpg",
    excerpt: "Get an in-depth review of Octopus Energy in 2026, covering plans, rates, and customer experiences. Make an informed choice for your energy needs now.",
    readTime: "9 min",
    keywords: ["octopus energy review", "octopus energy rates", "octopus energy plans"],
    relatedArticles: [38, 39, 41]
  },
  {
    id: 41,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Just Energy Review 2026: Plans, Rates, and Is It Worth It?",
    description: "Discover the latest Just Energy review for 2026, including plans and rates. Find out if it's the right choice for you—get the facts and save today!",
    image: "/images/articles/article-41.jpg",
    excerpt: "Explore our comprehensive 2026 review of Just Energy to understand its plans and rates. Make an informed decision and optimize your energy savings now!",
    readTime: "9 min",
    keywords: ["just energy review", "just energy rates", "just energy plans"],
    relatedArticles: [38, 39, 40]
  },
  {
    id: 42,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Rhythm Energy Review 2026: Texas Plans and Customer Reviews",
    description: "Discover the latest Rhythm Energy review for 2026, including Texas plans and customer feedback. Learn about rates and make an informed energy choice today!",
    image: "/images/articles/article-42.jpg",
    excerpt: "Explore our comprehensive Rhythm Energy review for 2026, highlighting Texas plans and customer experiences. Find out if Rhythm Energy is right for you!",
    readTime: "9 min",
    keywords: ["rhythm energy review", "rhythm energy rates", "rhythm energy texas"],
    relatedArticles: [38, 39, 40]
  },
  {
    id: 43,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Best Prepaid Electricity Plans 2026: No Credit Check Options",
    description: "Discover top prepaid electricity plans for 2026 with no credit check options. Switch today and enjoy flexible pay-as-you-go electricity. Get started now!",
    image: "/images/articles/article-43.jpg",
    excerpt: "Explore the best prepaid electricity plans for 2026, offering no credit check options and flexible payment plans. Make the switch today for hassle-free power.",
    readTime: "10 min",
    keywords: ["prepaid electricity", "no credit check electricity", "pay as you go electricity"],
    relatedArticles: [38, 39, 40]
  },
  {
    id: 44,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Best Free Nights and Weekends Electricity Plans 2026",
    description: "Discover top free nights and weekends electricity plans in Texas for 2026. Save more with TXU's free nights electricity plans. Explore your options today!",
    image: "/images/articles/article-44.jpg",
    excerpt: "Maximize your savings with the best free nights and weekends electricity plans in Texas for 2026. Find out how TXU can help you cut costs on energy.",
    readTime: "9 min",
    keywords: ["free nights electricity", "free weekends electricity plans texas", "txu free nights"],
    relatedArticles: [38, 39, 40]
  },
  {
    id: 45,
    category: "Plan Types",
    icon: Zap,
    color: "purple",
    title: "Best Short-Term Electricity Plans: Month-to-Month Options 2026",
    description: "Discover the top month-to-month electricity plans for 2026. Switch today to flexible, no-contract options and save on your energy bills. Act now!",
    image: "/images/articles/article-45.jpg",
    excerpt: "Explore the best short-term electricity plans for 2026, offering flexible month-to-month options with no contracts. Make the smart switch today!",
    readTime: "9 min",
    keywords: ["month to month electricity", "short term electricity plans", "no contract electricity"],
    relatedArticles: [38, 39, 40]
  },
  {
    id: 46,
    category: "Seasonal Tips",
    icon: Clock,
    color: "blue",
    title: "Summer Electricity Bills: How to Keep Costs Down in 2026",
    description: "Discover effective tips to lower your summer electricity bill in 2026. Save money and stay cool—learn how with PowerSave Solutions today!",
    image: "/images/articles/article-46.jpg",
    excerpt: "Struggling with high electric bills this summer? Learn practical ways to reduce your summer electricity costs and save money in 2026 with our expert tips.",
    readTime: "8 min",
    keywords: ["summer electricity bill", "high electric bill summer", "reduce summer electricity cost"],
    relatedArticles: [47, 1, 2]
  },
  {
    id: 47,
    category: "Seasonal Tips",
    icon: Clock,
    color: "blue",
    title: "Winter Heating Costs 2026: Electric Heat vs Gas vs Heat Pump",
    description: "Compare winter electricity costs, electric heating costs, and heat pump vs furnace expenses for 2026. Discover the most cost-effective heating options today!",
    image: "/images/articles/article-47.jpg",
    excerpt: "Explore the latest insights on winter heating costs in 2026, including electric, gas, and heat pump options. Make informed decisions to save money this winter.",
    readTime: "10 min",
    keywords: ["winter electricity costs", "electric heating costs", "heat pump vs furnace cost"],
    relatedArticles: [46, 1, 2]
  },
  {
    id: 48,
    category: "Switching Providers",
    icon: TrendingDown,
    color: "orange",
    title: "When Is the Best Time to Switch Electricity Providers?",
    description: "Discover the best time to switch electricity providers and save more. Learn when to switch energy providers for optimal contract timing. Act now!",
    image: "/images/articles/article-48.jpg",
    excerpt: "Timing your switch to a new electricity provider can save you money and improve service. Find out the best moments to make the switch today.",
    readTime: "7 min",
    keywords: ["best time to switch electricity", "when to switch energy providers", "electricity contract timing"],
    relatedArticles: [1, 2, 3]
  },
  {
    id: 49,
    category: "Getting Started",
    icon: BookOpen,
    color: "blue",
    title: "Moving to Texas? Your Complete Electricity Setup Guide 2026",
    description: "Planning your move to Texas? Discover how to set up electricity efficiently in 2026. Get started today with PowerUp Texas for a seamless transition!",
    image: "/images/articles/article-49.jpg",
    excerpt: "Moving to Texas? Our comprehensive 2026 electricity setup guide makes establishing your new home’s power simple and stress-free. Start today!",
    readTime: "10 min",
    keywords: ["moving to texas electricity", "set up electricity texas", "new home electricity texas"],
    relatedArticles: [50, 51, 1]
  },
  {
    id: 50,
    category: "Getting Started",
    icon: BookOpen,
    color: "blue",
    title: "Moving to a New State? How to Set Up Electricity Service",
    description: "Learn how to set up electricity in your new home or apartment. Transfer your service seamlessly with PowerPro. Get started today for a smooth move!",
    image: "/images/articles/article-50.jpg",
    excerpt: "Moving to a new state? Discover expert tips on transferring and setting up electricity service for your new home or apartment with PowerPro.",
    readTime: "8 min",
    keywords: ["set up electricity new home", "moving electricity transfer", "new apartment electricity"],
    relatedArticles: [49, 51, 1]
  },
  {
    id: 51,
    category: "Getting Started",
    icon: BookOpen,
    color: "blue",
    title: "ERCOT Electricity Market Explained: How Texas Power Grid Works",
    description: "Discover how ERCOT works and the Texas electricity market. Learn about the Texas power grid and stay informed. Read our guide now!",
    image: "/images/articles/article-51.jpg",
    excerpt: "Uncover how ERCOT manages Texas's power grid and the dynamics of the Texas electricity market. Essential insights for consumers and industry watchers.",
    readTime: "11 min",
    keywords: ["ercot explained", "texas power grid", "how ercot works", "texas electricity market"],
    relatedArticles: [49, 50, 1]
  },
  {
    id: 52,
    category: "Saving Money",
    icon: DollarSign,
    color: "green",
    title: "Cheapest Electricity Rates by State 2026: Complete Comparison",
    description: "Discover the cheapest electricity by state in 2026. Compare lowest electricity rates across the US and find the best deals today. Save on energy costs now!",
    image: "/images/articles/article-52.jpg",
    excerpt: "Explore the most affordable electricity rates by state in 2026. Find out which states offer the cheapest electricity and start saving today!",
    readTime: "10 min",
    keywords: ["cheapest electricity by state", "lowest electricity rates", "cheap electricity states"],
    relatedArticles: [53, 54, 55]
  },
  {
    id: 53,
    category: "Saving Money",
    icon: DollarSign,
    color: "green",
    title: "How to Negotiate Your Electricity Rate: Insider Tips",
    description: "Learn how to negotiate your electricity rate and lower your bill today. Discover insider tips to save money on your energy costs. Act now!",
    image: "/images/articles/article-53.jpg",
    excerpt: "Master the art of electricity rate negotiation with our expert tips and save money on your energy bills. Start negotiating smarter today!",
    readTime: "8 min",
    keywords: ["negotiate electricity rate", "lower electricity bill", "electricity rate negotiation"],
    relatedArticles: [52, 54, 55]
  },
  {
    id: 54,
    category: "Saving Money",
    icon: DollarSign,
    color: "green",
    title: "Electricity Usage Calculator: How Much Power Does Your Home Use?",
    description: "Discover your home’s electricity consumption with our easy-to-use electricity usage calculator. Save energy and reduce bills today! Try it now.",
    image: "/images/articles/article-54.jpg",
    excerpt: "Learn how much power your home uses with our simple electricity usage calculator. Take control of your energy consumption and save money!",
    readTime: "9 min",
    keywords: ["electricity usage calculator", "home electricity usage", "kwh calculator"],
    relatedArticles: [52, 53, 55]
  },
  {
    id: 55,
    category: "Saving Money",
    icon: DollarSign,
    color: "green",
    title: "Smart Thermostat Savings: How Much Can You Really Save?",
    description: "Discover how much you can save with smart thermostats like Nest and Ecobee. Learn tips to boost savings and start reducing energy costs today!",
    image: "/images/articles/article-55.jpg",
    excerpt: "Unlock the true potential of smart thermostats with our comprehensive savings guide. Find out how Nest and Ecobee can cut your energy bills effectively.",
    readTime: "8 min",
    keywords: ["smart thermostat savings", "nest thermostat electricity savings", "ecobee savings"],
    relatedArticles: [52, 53, 54]
  },
  {
    id: 56,
    category: "Saving Money",
    icon: DollarSign,
    color: "green",
    title: "Time-of-Use Electricity Plans: Are They Worth It?",
    description: "Discover if time-of-use electricity plans are worth it. Learn about TOU rates and off-peak electricity rates to save on your energy bills today!",
    image: "/images/articles/article-56.jpg",
    excerpt: "Explore the benefits of time-of-use electricity plans and see if they can help you save money. Make informed energy decisions with [Brand Name].",
    readTime: "8 min",
    keywords: ["time of use electricity", "tou rates", "off peak electricity rates"],
    relatedArticles: [52, 53, 54]
  },
  {
    id: 57,
    category: "Understanding Bills",
    icon: FileText,
    color: "orange",
    title: "What Is a kWh? Understanding Your Electricity Usage",
    description: "Learn what a kWh is and how it impacts your electricity bills. Discover the basics of electricity units today. Read more with PowerSmart!",
    image: "/images/articles/article-57.jpg",
    excerpt: "Understand the concept of a kWh and how it affects your energy consumption. Get clear insights into electricity units with PowerSmart.",
    readTime: "7 min",
    keywords: ["what is a kwh", "kilowatt hour explained", "electricity units"],
    relatedArticles: [58, 61, 1]
  },
  {
    id: 58,
    category: "Understanding Bills",
    icon: FileText,
    color: "orange",
    title: "Electricity Delivery Charges Explained: Why Your Bill Has Two Parts",
    description: "Learn about electricity delivery charges and transmission costs in your bill. Discover why your utility charges are split and save money today!",
    image: "/images/articles/article-58.jpg",
    excerpt: "Understand the two key components of your electricity bill—delivery and transmission charges—and how they affect your monthly expenses. Get informed now!",
    readTime: "8 min",
    keywords: ["electricity delivery charges", "transmission charges", "utility charges explained"],
    relatedArticles: [57, 61, 1]
  },
  {
    id: 59,
    category: "Renewable Energy",
    icon: Leaf,
    color: "green",
    title: "Power Purchase Agreement (PPA) vs Buying Solar: Which Is Better?",
    description: "Discover the benefits of PPA vs buying solar with GreenEnergy. Learn which solar option suits your needs and start saving today. Read more now!",
    image: "/images/articles/article-59.jpg",
    excerpt: "Explore the key differences between Power Purchase Agreements and buying solar to make an informed decision for your energy needs. Find out which option is best for you!",
    readTime: "10 min",
    keywords: ["ppa vs buying solar", "power purchase agreement", "solar lease vs buy"],
    relatedArticles: [60, 1, 2]
  },
  {
    id: 60,
    category: "Renewable Energy",
    icon: Leaf,
    color: "green",
    title: "Community Solar Explained: Solar Energy Without Rooftop Panels",
    description: "Discover how community solar offers affordable, shared solar energy solutions. Join a solar garden today and save on your energy bills! Learn more now.",
    image: "/images/articles/article-60.jpg",
    excerpt: "Explore the benefits of community solar and how it enables you to access clean energy without installing panels on your roof. A smart choice for sustainable living.",
    readTime: "8 min",
    keywords: ["community solar", "solar garden", "shared solar program"],
    relatedArticles: [59, 1, 2]
  },
  {
    id: 61,
    category: "Understanding Bills",
    icon: FileText,
    color: "orange",
    title: "EV Charging at Home: How Much Does It Add to Your Electric Bill?",
    description: "Discover how much home EV charging impacts your electric bill and learn tips to save. Start saving on your electric car electricity cost today!",
    image: "/images/articles/article-61.jpg",
    excerpt: "Learn how home EV charging affects your electric bill and discover practical tips to minimize costs while powering your electric vehicle efficiently.",
    readTime: "9 min",
    keywords: ["ev charging cost", "electric car electricity cost", "home ev charging bill"],
    relatedArticles: [57, 58, 1]
  },
  {
    id: 62,
    category: "Consumer Protection",
    icon: Shield,
    color: "purple",
    title: "Electricity Scams to Watch Out For in 2026: Protect Yourself",
    description: "Stay safe from electricity and energy scams in 2026. Learn how to identify fake electricity providers and protect your home today. Act now!",
    image: "/images/articles/article-62.jpg",
    excerpt: "Beware of rising electricity scams in 2026. Discover essential tips to identify fake providers and safeguard your energy investments effectively.",
    readTime: "8 min",
    keywords: ["electricity scams", "energy scams", "fake electricity provider"],
    relatedArticles: [63, 64, 65]
  },
  {
    id: 63,
    category: "Consumer Protection",
    icon: Shield,
    color: "purple",
    title: "Your Rights as an Electricity Customer: State-by-State Guide",
    description: "Discover your utility customer rights with our comprehensive state-by-state guide. Learn how to protect yourself and take action today. Read more now!",
    image: "/images/articles/article-63.jpg",
    excerpt: "Navigate your utility rights confidently with our detailed state-by-state guide. Empower yourself and ensure your energy consumer protections are in place.",
    readTime: "10 min",
    keywords: ["electricity customer rights", "utility customer rights", "energy consumer protection"],
    relatedArticles: [62, 64, 65]
  },
  {
    id: 64,
    category: "Consumer Protection",
    icon: Shield,
    color: "purple",
    title: "What Happens When Your Electricity Contract Expires?",
    description: "Learn what occurs when your electricity contract expires and how to manage energy contract renewal. Stay informed—renew today with PowerUp for seamless service!",
    image: "/images/articles/article-64.jpg",
    excerpt: "Understand the implications of your electricity contract expiration and explore options for renewal to ensure uninterrupted power supply. Act now to stay connected!",
    readTime: "7 min",
    keywords: ["electricity contract expires", "energy contract renewal", "auto renewal electricity"],
    relatedArticles: [62, 63, 65]
  },
  {
    id: 65,
    category: "Consumer Protection",
    icon: Shield,
    color: "purple",
    title: "How to File a Complaint Against Your Electricity Provider",
    description: "Learn how to report your energy company effectively. Follow our steps to file a utility complaint today and get the resolution you deserve. Act now!",
    image: "/images/articles/article-65.jpg",
    excerpt: "Discover the essential steps to file a complaint against your electricity provider and ensure your concerns are addressed promptly. Take control of your energy issues today.",
    readTime: "7 min",
    keywords: ["complaint electricity provider", "report energy company", "utility complaint"],
    relatedArticles: [62, 63, 64]
  },
  {
    id: 66,
    category: "Business Energy",
    icon: Building2,
    color: "blue",
    title: "Small Business Electricity Rates 2026: How to Save 20-30%",
    description: "Discover how to reduce your small business electricity costs by 20-30% in 2026. Learn expert tips and start saving today with PowerSave's proven strategies!",
    image: "/images/articles/article-66.jpg",
    excerpt: "Unlock significant savings on small business electricity rates in 2026. Learn expert tips to cut costs and boost your business energy efficiency now.",
    readTime: "10 min",
    keywords: ["small business electricity rates", "commercial electricity rates", "business energy savings"],
    relatedArticles: [67, 68, 69]
  },
  {
    id: 67,
    category: "Business Energy",
    icon: Building2,
    color: "blue",
    title: "Restaurant Electricity Costs: How to Cut Your Energy Bill",
    description: "Discover effective strategies to reduce restaurant electricity costs and lower utility bills. Start saving today with our expert energy-saving tips!",
    image: "/images/articles/article-67.jpg",
    excerpt: "Learn how to cut your restaurant's energy expenses and optimize utility bills with practical, proven strategies. Save money and improve efficiency now!",
    readTime: "9 min",
    keywords: ["restaurant electricity cost", "restaurant energy savings", "restaurant utility bills"],
    relatedArticles: [66, 68, 69]
  },
  {
    id: 68,
    category: "Business Energy",
    icon: Building2,
    color: "blue",
    title: "Office Building Electricity: Commercial Rate Comparison Guide",
    description: "Compare commercial electricity rates and optimize your office energy management. Save on costs today with PowerSmart's expert guide. Get started now!",
    image: "/images/articles/article-68.jpg",
    excerpt: "Discover how to effectively compare office electricity costs and enhance your energy management strategies. Maximize savings with PowerSmart's comprehensive guide.",
    readTime: "9 min",
    keywords: ["office electricity cost", "commercial electricity comparison", "office energy management"],
    relatedArticles: [66, 67, 69]
  },
  {
    id: 69,
    category: "Business Energy",
    icon: Building2,
    color: "blue",
    title: "Demand Charges Explained: What Business Owners Need to Know",
    description: "Learn everything about demand charges, including peak demand and commercial rates. Discover tips to reduce costs—read our guide today!",
    image: "/images/articles/article-69.jpg",
    excerpt: "Understanding demand charges is crucial for business owners looking to optimize electricity costs. Get the insights you need now.",
    readTime: "8 min",
    keywords: ["demand charges electricity", "commercial demand charges", "peak demand charges"],
    relatedArticles: [66, 67, 68]
  },
  {
    id: 70,
    category: "Business Energy",
    icon: Building2,
    color: "blue",
    title: "Business Solar vs Grid Electricity: ROI Comparison 2026",
    description: "Discover the ROI of business solar vs grid electricity in 2026. Learn how commercial solar savings can boost your business. Get started today!",
    image: "/images/articles/article-70.jpg",
    excerpt: "Compare business solar ROI with grid electricity in 2026 and see how commercial solar savings can transform your company's energy costs. Make an informed choice now!",
    readTime: "10 min",
    keywords: ["business solar roi", "commercial solar vs grid", "business solar savings"],
    relatedArticles: [66, 67, 68]
  },
];

const colorClasses = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" }
};

export default function ArticleDetail() {
  const location = window.location;
  
  // Support both clean URLs (/learn/:slug) and legacy query params (?id=6)
  const pathParts = location.pathname.split('/');
  const isCleanUrl = pathParts[1] === 'learn' && pathParts[2];
  const urlParams = new URLSearchParams(location.search);
  const articleId = isCleanUrl ? decodeURIComponent(pathParts[2]) : urlParams.get('id');

  // Fetch articles from database
  const { data: dbArticles, isLoading } = useQuery({
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
    placeholderData: [],
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

  const articles = dbArticles && dbArticles.length > 0 ? dbArticles.map(article => {
    // Handle both nested and flat data structures
    const data = article.data || article;
    const articleId = article.id || data.id;
    
    return {
      id: articleId,
      category: data.category || "Getting Started",
      icon: getCategoryIcon(data.category || "Getting Started"),
      color: getCategoryColor(data.category || "Getting Started"),
      title: data.title || "Untitled Article",
      description: data.meta_description || data.description || data.excerpt,
      image: data.featured_image || "/images/placeholder.jpg",
      excerpt: data.excerpt || data.meta_description || "",
      readTime: data.read_time || "5 min",
      keywords: data.keywords || [],
      relatedArticles: data.related_articles || []
    };
  }) : fallbackArticles;

  const article = articles.find(a => {
    const aId = String(a.id).trim();
    const searchId = String(articleId).trim();
    return aId === searchId;
  });

  // Scroll to top on mount and track reading - depend on full location to detect changes
  useEffect(() => {
    window.scrollTo(0, 0);
    trackDailyReading();
  }, [location.search, articleId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5C8C] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

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

  // Get full article content from database
  const dbArticle = dbArticles.find(a => String(a.id) === String(articleId));
  const articleData = dbArticle?.data || dbArticle;
  const fullArticle = articleData?.content ? { 
    content: fixArticleLinks(articleData.content),
    metaTitle: articleData.meta_title,
    metaDescription: articleData.meta_description,
    tags: articleData.tags
  } : null;

  // Dynamic load of full article content (code-split)
  const [dynamicFullArticle, setDynamicFullArticle] = React.useState(fullArticle);
  React.useEffect(() => {
    if (!fullArticle && articleId) {
      getFullArticleDynamic(articleId).then(result => {
        setDynamicFullArticle(result);
      });
    }
  }, [articleId, fullArticle]);
  const resolvedFullArticle = fullArticle || dynamicFullArticle;

  // Generate optimized SEO data
  const articlePublishDate = articleData?.created_date || new Date().toISOString();
  const articleModifiedDate = articleData?.updated_date || articlePublishDate;
  
  // Optimized meta title with category and brand
  const optimizedTitle = resolvedFullArticle?.metaTitle || 
    `${article.title} | ${article.category} Guide | Electric Scouts`;
  
  // Optimized meta description with excerpt and CTA
  const optimizedDescription = resolvedFullArticle?.metaDescription || 
    `${article.excerpt || article.description} Compare electricity rates and save up to $800/year. Free guide from Electric Scouts.`;
  
  // Combine article keywords with tags for better SEO
  const optimizedKeywords = [
    ...(resolvedFullArticle?.tags || []),
    ...article.keywords,
    `${article.category.toLowerCase()} electricity`,
    'compare electricity rates',
    'electricscouts',
    'save money electricity'
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 15).join(", ");

  const articleSchema = getArticleSchema({
    title: resolvedFullArticle?.metaTitle || article.title,
    description: resolvedFullArticle?.metaDescription || article.description,
    image: article.image,
    datePublished: articlePublishDate,
    dateModified: articleModifiedDate
  });

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Learning Center", url: "/learning-center" },
    { name: article.title, url: `/learn/${article.id}` }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title={optimizedTitle}
        description={optimizedDescription}
        keywords={optimizedKeywords}
        canonical={`/learn/${article.id}`}
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
          <div className="relative h-56 sm:h-64 lg:h-72 overflow-hidden">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-full object-cover"
            loading="lazy" />
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

          {/* Social Share Bar - Top */}
          <div className="px-6 sm:px-10 lg:px-12 pt-4">
            <SocialShareBar 
              title={article.title} 
              description={article.description}
              compact={true}
            />
          </div>
          {/* Article Body */}
          <div className="p-6 sm:p-10 lg:p-12">
            {resolvedFullArticle ? (
              <>
                <div 
                  className="prose prose-lg max-w-none article-content"
                  dangerouslySetInnerHTML={{ __html: (() => {
                    const content = resolvedFullArticle.content;
                    const paragraphs = content.split('</p>');
                    const midPoint = Math.floor(paragraphs.length / 2);
                    const firstHalf = paragraphs.slice(0, midPoint).join('</p>') + '</p>';
                    return firstHalf;
                  })() }}
                />
                <InArticleCTA />
                <div 
                  className="prose prose-lg max-w-none article-content"
                  dangerouslySetInnerHTML={{ __html: (() => {
                    const content = resolvedFullArticle.content;
                    const paragraphs = content.split('</p>');
                    const midPoint = Math.floor(paragraphs.length / 2);
                    const secondHalf = paragraphs.slice(midPoint).join('</p>');
                    return secondHalf;
                  })() }}
                />
              </>
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
            {/* Social Share Bar - Bottom */}
            <div className="px-6 sm:px-10 lg:px-12 pb-6">
              <SocialShareBar 
                title={article.title} 
                description={article.description}
              />
            </div>
          </div>
        </article>

        {/* AI-Powered Article Recommendations */}
        <ArticleRecommendations 
          currentArticle={article}
          allArticles={articles}
        />

        {/* AI-Powered Content Suggestions */}
        <div className="mt-8">
          <ArticleSuggestions currentArticleId={article.id} currentCategory={article.category} />
        </div>

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
        {resolvedFullArticle?.tags && resolvedFullArticle.tags.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Article Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {resolvedFullArticle.tags.map((tag, index) => (
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
          background: linear-gradient(135deg, #e0f7fa 0%, #e1f5fe 100%);
          border: 2px solid #4dd0e1;
          border-radius: 1.5rem;
          padding: 2.5rem;
          margin: 2rem 0;
          text-align: center;
        }
        
        .article-content .cta-box h3 {
          color: #0A5C8C;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
        }
        
        .article-content .cta-box p {
          color: #4a5568;
          font-size: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .article-content .cta-button {
          display: inline-block;
          background: #FF6B35;
          color: white;
          padding: 1rem 2.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1.125rem;
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
        
        /* In-Article CTA Styling - Matches Design Exactly */
        .in-article-cta-wrapper {
          margin: 3rem 0;
        }
        
        .in-article-cta-box {
          background: linear-gradient(135deg, #e0f7fa 0%, #e1f5fe 100%);
          border: 2px solid #4dd0e1;
          border-radius: 1rem;
          padding: 2.5rem 2rem;
          text-align: center;
        }
        
        .in-article-cta-title {
          color: #0A5C8C;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
        }
        
        .in-article-cta-text {
          color: #4a5568;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          max-width: 42rem;
          margin-left: auto;
          margin-right: auto;
        }
        
        .in-article-cta-button {
          background: #FF6B35;
          color: white;
          padding: 0.875rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 1.125rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .in-article-cta-button:hover {
          background: #e55a2b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }
        
        /* Auto-inject CTA after 50% of article content */
        .article-content {
          position: relative;
        }
      `}</style>
    </div>
  );
}