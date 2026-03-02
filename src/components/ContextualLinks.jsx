import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Zap, MapPin, Building2, Calculator, FileText, ArrowRight } from "lucide-react";

/**
 * ContextualLinks - Renders contextual internal links based on page type.
 * Provides relevant cross-links between different page types for SEO and UX.
 * 
 * @param {string} pageType - "city", "state", "article", "tool", "provider"
 * @param {object} context - Additional context data (stateName, stateCode, cityName, category, etc.)
 */

const LINK_SETS = {
  city: (ctx) => [
    { to: `/compare-rates${ctx.zipCode ? `?zip=${ctx.zipCode}` : ''}`, icon: Zap, label: "Compare Rates in Your Area", desc: "Side-by-side plan comparison" },
    { to: "/bill-analyzer", icon: Calculator, label: "Bill Analyzer Tool", desc: "Upload your bill for savings analysis" },
    { to: "/learning-center", icon: BookOpen, label: "Energy Guides", desc: "Tips to lower your electricity bill" },
    { to: "/all-providers", icon: Building2, label: "All Providers", desc: "Browse 40+ electricity providers" },
  ],
  state: (ctx) => [
    { to: "/compare-rates", icon: Zap, label: "Compare Rates", desc: "Find the best rates in your ZIP code" },
    { to: "/all-cities", icon: MapPin, label: "All Service Areas", desc: "Browse cities across 12 states" },
    { to: "/bill-analyzer", icon: Calculator, label: "Bill Analyzer", desc: "See how much you could save" },
    { to: "/learning-center", icon: BookOpen, label: "Energy Guides", desc: "Learn about electricity shopping" },
  ],
  article: (ctx) => [
    { to: "/compare-rates", icon: Zap, label: "Compare Rates Now", desc: "Put what you learned into action" },
    { to: "/all-states", icon: MapPin, label: "Browse by State", desc: "Find rates in your state" },
    { to: "/all-providers", icon: Building2, label: "Provider Directory", desc: "Research electricity providers" },
    { to: "/bill-analyzer", icon: Calculator, label: "Analyze Your Bill", desc: "Upload your bill for personalized savings" },
    { to: "/savings-calculator", icon: Calculator, label: "Savings Calculator", desc: "Estimate your potential savings" },
    { to: "/faq", icon: FileText, label: "FAQs", desc: "Common electricity questions answered" },
  ],
  tool: (ctx) => [
    { to: "/compare-rates", icon: Zap, label: "Compare Rates", desc: "Find the best electricity plans" },
    { to: "/all-states", icon: MapPin, label: "Browse by State", desc: "State-specific electricity info" },
    { to: "/learning-center", icon: BookOpen, label: "Energy Guides", desc: "Expert tips and guides" },
    { to: "/all-providers", icon: Building2, label: "All Providers", desc: "Browse provider details" },
  ],
  provider: (ctx) => [
    { to: "/compare-rates", icon: Zap, label: "Compare All Providers", desc: "Side-by-side rate comparison" },
    { to: "/all-providers", icon: Building2, label: "Provider Directory", desc: "Browse all 40+ providers" },
    { to: "/all-states", icon: MapPin, label: "Browse by State", desc: "Find providers in your state" },
    { to: "/learning-center", icon: BookOpen, label: "Switching Guide", desc: "How to switch providers" },
  ],
};

export default function ContextualLinks({ pageType = "city", context = {}, maxLinks = 4, className = "" }) {
  const linkSet = LINK_SETS[pageType];
  if (!linkSet) return null;

  const links = linkSet(context).slice(0, maxLinks);

  return (
    <div className={`${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-3">Explore More</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {links.map((link, index) => {
          const Icon = link.icon;
          return (
            <Link
              key={index}
              to={link.to}
              className="flex items-start gap-3 p-4 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors group"
            >
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                <Icon className="w-4.5 h-4.5 text-[#0A5C8C]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 group-hover:text-[#0A5C8C] transition-colors text-sm">
                  {link.label}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0A5C8C] flex-shrink-0 mt-1 transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
