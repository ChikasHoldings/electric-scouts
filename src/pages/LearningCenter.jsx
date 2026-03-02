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
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
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
        image: data.featured_image || "/images/placeholder.jpg",
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
        title="Energy Know-How | Guides & Tips from Electric Scouts"
        description="Practical guides and tips to help you understand electricity markets, pick the right plan, and keep your bills low. Written by the Electric Scouts team for real people, not industry insiders."
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
            <PageBreadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: "Learning Center" }
              ]}
              variant="light"
              className="mb-4 justify-center"
            />
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
                    <Link to={`/learn/${featured.id}`}>
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
                      <Link key={article.id} to={`/learn/${article.id}`}>
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