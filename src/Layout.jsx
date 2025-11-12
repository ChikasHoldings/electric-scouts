import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Phone, ChevronDown, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const texasCities = [
  "Houston", "Dallas", "Fort Worth", "Corpus Christi", "Arlington",
  "Plano", "Grand Prairie", "Irving", "Laredo", "Lubbock"
];

const providers = [
  "4Change Energy", "Frontier Utilities", "APG&E", "Gexa Energy",
  "Payless Power", "Rhythm Energy", "Veteran Energy", "TXU Energy",
  "Express Energy", "CleanSky Energy"
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center">
              <div className="flex items-center gap-0 relative">
                <span className="text-2xl font-normal text-gray-900">power</span>
                <span className="text-2xl font-normal text-teal-500">wizard</span>
                <svg 
                  className="absolute -top-1 -right-3 w-3 h-3" 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M10 0L11.5 8.5L20 10L11.5 11.5L10 20L8.5 11.5L0 10L8.5 8.5L10 0Z" 
                    fill="#FF6B5B"
                  />
                </svg>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-700 hover:text-teal-600 transition-colors font-normal">
                  Residential
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-6 z-50">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Cities</h3>
                      <div className="space-y-2">
                        {texasCities.slice(0, 5).map(city => (
                          <Link
                            key={city}
                            to={createPageUrl("CityRates") + `?city=${city}`}
                            className="block text-sm text-gray-600 hover:text-teal-600 transition-colors"
                          >
                            {city}
                          </Link>
                        ))}
                        <Link to={createPageUrl("AllCities")} className="text-sm text-teal-600 font-medium">
                          Browse all cities →
                        </Link>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Providers</h3>
                      <div className="space-y-2">
                        {providers.slice(0, 5).map(provider => (
                          <Link
                            key={provider}
                            to={createPageUrl("ProviderDetails") + `?provider=${provider}`}
                            className="block text-sm text-gray-600 hover:text-teal-600 transition-colors"
                          >
                            {provider}
                          </Link>
                        ))}
                        <Link to={createPageUrl("AllProviders")} className="text-sm text-teal-600 font-medium">
                          Browse all providers →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to={createPageUrl("BusinessRates")}
                className="text-gray-700 hover:text-teal-600 transition-colors font-normal"
              >
                Business Rates
              </Link>

              <Link
                to={createPageUrl("HomeConcierge")}
                className="text-gray-700 hover:text-teal-600 transition-colors font-normal"
              >
                Home Concierge
              </Link>

              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-700 hover:text-teal-600 transition-colors font-normal">
                  Resources
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4 z-50">
                  <div className="space-y-2">
                    <Link to={createPageUrl("AboutUs")} className="block text-sm text-gray-600 hover:text-teal-600 transition-colors">
                      About Us
                    </Link>
                    <Link to={createPageUrl("FAQ")} className="block text-sm text-gray-600 hover:text-teal-600 transition-colors">
                      FAQs
                    </Link>
                    <Link to={createPageUrl("Blog")} className="block text-sm text-gray-600 hover:text-teal-600 transition-colors">
                      The Power Lab
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Phone Number */}
            <div className="hidden lg:flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4" />
              <a href="tel:855-475-8315" className="font-semibold hover:text-teal-600 transition-colors">
                855-475-8315
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
              <Link
                to={createPageUrl("CompareRates")}
                className="block text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Compare Rates
              </Link>
              <Link
                to={createPageUrl("BusinessRates")}
                className="block text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Business Rates
              </Link>
              <Link
                to={createPageUrl("HomeConcierge")}
                className="block text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home Concierge
              </Link>
              <Link
                to={createPageUrl("AboutUs")}
                className="block text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to={createPageUrl("FAQ")}
                className="block text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQs
              </Link>
              <a
                href="tel:855-475-8315"
                className="flex items-center gap-2 text-teal-600 font-semibold"
              >
                <Phone className="w-4 h-4" />
                855-475-8315
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-0 relative mb-4">
                <span className="text-xl font-normal">power</span>
                <span className="text-xl font-normal text-teal-400">wizard</span>
                <svg 
                  className="absolute -top-1 -right-3 w-2.5 h-2.5" 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M10 0L11.5 8.5L20 10L11.5 11.5L10 20L8.5 11.5L0 10L8.5 8.5L10 0Z" 
                    fill="#FF6B5B"
                  />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering Texans to find the best electricity rates since 2019.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Residential</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("CompareRates")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Compare Rates
                </Link>
                <Link to={createPageUrl("AllCities")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Cities
                </Link>
                <Link to={createPageUrl("AllProviders")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Providers
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("AboutUs")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  About Us
                </Link>
                <Link to={createPageUrl("FAQ")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  FAQs
                </Link>
                <Link to={createPageUrl("Blog")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Blog
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2">
                <a href="tel:855-475-8315" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Phone className="w-4 h-4" />
                  855-475-8315
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Power Wizard. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .text-coral-500 { color: #FF6B5B; }
        .bg-coral-500 { background-color: #FF6B5B; }
        .text-teal-500 { color: #00A9CE; }
        .text-teal-400 { color: #00BFE7; }
        .text-teal-600 { color: #0090B3; }
        .hover\\:text-teal-600:hover { color: #0090B3; }
        .bg-teal-500 { background-color: #00A9CE; }
        .bg-teal-600 { background-color: #0090B3; }
        .hover\\:bg-teal-600:hover { background-color: #0090B3; }
        .hover\\:bg-teal-700:hover { background-color: #007A99; }
      `}</style>
    </div>
  );
}