import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, FileText, Building, Zap } from "lucide-react";
import SEOHead from "../components/SEOHead";

export default function Sitemap() {
  const sections = [
    {
      title: "Main Pages",
      icon: Zap,
      links: [
        { name: "Home", url: "/" },
        { name: "Compare Electricity Rates", url: "/compare-rates" },
        { name: "Business Electricity", url: "/business-electricity" },
        { name: "Renewable Energy", url: "/renewable-energy" },
        { name: "Savings Calculator", url: "/savings-calculator" },
        { name: "Bill Analyzer", url: "/bill-analyzer" },
        { name: "FAQ", url: "/faq" },
        { name: "About Us", url: "/about-us" }
      ]
    },
    {
      title: "State Pages",
      icon: MapPin,
      links: [
        { name: "Texas Electricity Rates", url: "/texas-electricity" },
        { name: "Illinois Electricity Rates", url: "/illinois-electricity" },
        { name: "Ohio Electricity Rates", url: "/ohio-electricity" },
        { name: "Pennsylvania Electricity Rates", url: "/pennsylvania-electricity" },
        { name: "New York Electricity Rates", url: "/new-york-electricity" },
        { name: "New Jersey Electricity Rates", url: "/new-jersey-electricity" },
        { name: "Maryland Electricity Rates", url: "/maryland-electricity" },
        { name: "Massachusetts Electricity Rates", url: "/massachusetts-electricity" },
        { name: "Maine Electricity Rates", url: "/maine-electricity" },
        { name: "New Hampshire Electricity Rates", url: "/new-hampshire-electricity" },
        { name: "Rhode Island Electricity Rates", url: "/rhode-island-electricity" },
        { name: "Connecticut Electricity Rates", url: "/connecticut-electricity" }
      ]
    },
    {
      title: "Resources",
      icon: FileText,
      links: [
        { name: "Learning Center", url: "/learning-center" },
        { name: "All Providers", url: "/all-providers" },
        { name: "All States", url: "/all-states" },
        { name: "All Cities", url: "/all-cities" },
        { name: "Home Concierge", url: "/home-concierge" }
      ]
    },
    {
      title: "Legal & Support",
      icon: Building,
      links: [
        { name: "Privacy Policy", url: "/privacy-policy" },
        { name: "Terms of Service", url: "/terms-of-service" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Sitemap - All Pages & Resources"
        description="Complete sitemap of Electric Scouts electricity rate comparison platform. Find all pages, states, cities, providers, and resources."
        keywords="electricscouts sitemap, electricity comparison pages, all states electricity rates"
        canonical="/sitemap"
        noindex
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">Site Map</h1>
          <p className="text-lg text-blue-100">
            Navigate all Electric Scouts pages and resources
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <Card key={idx} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#0A5C8C]" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {section.links.map((link, i) => (
                      <li key={i}>
                        <Link
                          to={createPageUrl(link.url.substring(1))}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}