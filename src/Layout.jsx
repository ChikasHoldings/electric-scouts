import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Phone, ChevronDown, Menu, X, ArrowUp } from "lucide-react";

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
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100' 
          : 'bg-white border-b border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center transform hover:scale-105 transition-transform">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/54a98288c_ChatGPTImageNov12202508_20_04PM.png"
                alt="Power Scouts"
                className="h-10"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-700 hover:text-[#0A5C8C] transition-colors text-base font-medium">
                  Residential
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-5 z-50 border border-gray-100">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-xs uppercase tracking-wide">Cities</h3>
                      <div className="space-y-1.5">
                        {texasCities.slice(0, 5).map(city => (
                          <Link
                            key={city}
                            to={createPageUrl("CityRates") + `?city=${city}`}
                            className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all"
                          >
                            {city}
                          </Link>
                        ))}
                        <Link to={createPageUrl("AllCities")} className="text-sm text-blue-600 font-medium hover:translate-x-1 transition-all inline-block mt-1">
                          Browse all →
                        </Link>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 text-xs uppercase tracking-wide">Providers</h3>
                      <div className="space-y-1.5">
                        {providers.slice(0, 5).map(provider => (
                          <Link
                            key={provider}
                            to={createPageUrl("ProviderDetails") + `?provider=${provider}`}
                            className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all"
                          >
                            {provider}
                          </Link>
                        ))}
                        <Link to={createPageUrl("AllProviders")} className="text-sm text-blue-600 font-medium hover:translate-x-1 transition-all inline-block mt-1">
                          Browse all →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to={createPageUrl("BusinessRates")}
                className="text-gray-700 hover:text-[#0A5C8C] transition-colors text-base font-medium"
              >
                Business Rates
              </Link>

              <Link
                to={createPageUrl("HomeConcierge")}
                className="text-gray-700 hover:text-[#0A5C8C] transition-colors text-base font-medium"
              >
                Home Concierge
              </Link>

              <div className="relative group">
                <button className="flex items-center gap-1 text-gray-700 hover:text-[#0A5C8C] transition-colors text-base font-medium">
                  Resources
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-3 z-50 border border-gray-100">
                  <div className="space-y-1.5">
                    <Link to={createPageUrl("AboutUs")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all">
                      About Us
                    </Link>
                    <Link to={createPageUrl("FAQ")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all">
                      FAQs
                    </Link>
                    <Link to={createPageUrl("Blog")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all">
                      The Power Lab
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Compare Rates Button */}
            <div className="hidden lg:block">
              <Link to={createPageUrl("CompareRates")}>
                <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold px-6 py-2 text-base rounded-lg transition-all duration-300">
                  Compare Rates
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
              <Link to={createPageUrl("CompareRates")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Compare Rates
              </Link>
              <Link to={createPageUrl("BusinessRates")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Business Rates
              </Link>
              <Link to={createPageUrl("HomeConcierge")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Home Concierge
              </Link>
              <Link to={createPageUrl("AboutUs")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link to={createPageUrl("FAQ")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                FAQs
              </Link>
              <a href="tel:855-475-8315" className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
                <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
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
      <footer className="bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/54a98288c_ChatGPTImageNov12202508_20_04PM.png"
                alt="Power Scouts"
                className="h-9 mb-4 brightness-0 invert"
              />
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Empowering Texans to find the best electricity rates since 2019.
              </p>
              <div className="flex gap-2">
                <a href="#" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
                </a>
                <a href="#" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-sm">Residential</h3>
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
              <h3 className="font-semibold mb-3 text-sm">Company</h3>
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
              <h3 className="font-semibold mb-3 text-sm">Contact</h3>
              <a href="tel:855-475-8315" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors group">
                <div className="w-9 h-9 bg-[#FF6B35] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-semibold">855-475-8315</span>
              </a>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-400 text-xs">
              © {new Date().getFullYear()} Power Scouts. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 bg-[#FF6B35] text-white rounded-full shadow-xl hover:shadow-2xl transition-all z-50 flex items-center justify-center hover:scale-110 transform group"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}
    </div>
  );
}