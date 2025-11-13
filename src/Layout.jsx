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

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

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
            <Link to={createPageUrl("Home")} className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/54a98288c_ChatGPTImageNov12202508_20_04PM.png"
                alt="Power Scouts - Compare Electricity Rates"
                className="h-16"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link
                to={createPageUrl("Search")}
                className="text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-lg font-medium"
              >
                Search
              </Link>
              <Link
                to={createPageUrl("AllProviders")}
                className="text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-lg font-medium"
              >
                Providers
              </Link>

              <div className="relative group">
                <button className="flex items-center gap-1 text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-lg font-medium">
                  Service Areas
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-3 z-50 border border-gray-100">
                  <div className="space-y-1.5">
                    <Link to={createPageUrl("AllStates")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      All States
                    </Link>
                    <Link to={createPageUrl("AllCities")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      Texas Cities
                    </Link>
                  </div>
                </div>
              </div>

              <Link
                to={createPageUrl("AboutUs")}
                className="text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-lg font-medium"
              >
                About Us
              </Link>

              <div className="relative group">
                <button className="flex items-center gap-1 text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-lg font-medium">
                  Resources
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-3 z-50 border border-gray-100">
                  <div className="space-y-1.5">
                    <Link to={createPageUrl("Blog")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      Blog
                    </Link>
                    <Link to={createPageUrl("FAQ")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      FAQs
                    </Link>
                    <Link to={createPageUrl("LearningCenter")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      Learning Center
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Compare Rates Button */}
            <div className="hidden lg:block">
              <Link to={createPageUrl("CompareRates")}>
                <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold px-6 py-2 text-lg rounded-lg transition-all duration-300">
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
              <Link to={createPageUrl("Search")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Search
              </Link>
              <Link to={createPageUrl("AllProviders")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Providers
              </Link>
              <Link to={createPageUrl("AllCities")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Service Areas
              </Link>
              <Link to={createPageUrl("AboutUs")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link to={createPageUrl("Blog")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Blog
              </Link>
              <Link to={createPageUrl("FAQ")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                FAQs
              </Link>
              <Link to={createPageUrl("LearningCenter")} className="block text-gray-700 text-sm font-medium hover:text-blue-600 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                Learning Center
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/54a98288c_ChatGPTImageNov12202508_20_04PM.png"
                alt="Power Scouts - Compare Electricity Rates Nationwide"
                className="h-9 mb-4 brightness-0 invert"
              />
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Your trusted electricity comparison platform for deregulated markets nationwide. Compare rates from 40+ providers in TX, PA, NY, OH, IL, NJ, MD & more. Save up to $800 per year.
              </p>
              <div className="flex gap-2">
                <a href="#" aria-label="Follow us on Facebook" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
                </a>
                <a href="#" aria-label="Follow us on Twitter" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
                </a>
              </div>
            </div>

            {/* Popular Cities */}
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Popular Cities</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("CityRates") + "?city=Houston"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Houston
                </Link>
                <Link to={createPageUrl("CityRates") + "?city=Dallas"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Dallas
                </Link>
                <Link to={createPageUrl("CityRates") + "?city=Austin"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Austin
                </Link>
                <Link to={createPageUrl("CityRates") + "?city=San Antonio"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  San Antonio
                </Link>
                <Link to={createPageUrl("CityRates") + "?city=Fort Worth"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Fort Worth
                </Link>
                <Link to={createPageUrl("AllCities")} className="block text-[#FF6B35] hover:text-[#FF8C5A] text-sm transition-colors font-medium">
                  View All Cities →
                </Link>
              </div>
            </div>

            {/* Top Providers */}
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Top Providers</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("ProviderDetails") + "?provider=TXU Energy"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  TXU Energy
                </Link>
                <Link to={createPageUrl("ProviderDetails") + "?provider=Reliant Energy"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Reliant Energy
                </Link>
                <Link to={createPageUrl("ProviderDetails") + "?provider=Gexa Energy"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Gexa Energy
                </Link>
                <Link to={createPageUrl("ProviderDetails") + "?provider=Direct Energy"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Direct Energy
                </Link>
                <Link to={createPageUrl("ProviderDetails") + "?provider=Green Mountain Energy"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Green Mountain
                </Link>
                <Link to={createPageUrl("AllProviders")} className="block text-[#FF6B35] hover:text-[#FF8C5A] text-sm transition-colors font-medium">
                  View All Providers →
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Resources</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("CompareRates")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Compare Rates
                </Link>
                <Link to={createPageUrl("FAQ")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  FAQs
                </Link>
                <Link to={createPageUrl("LearningCenter")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Learning Center
                </Link>
                <Link to={createPageUrl("AboutUs")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  About Us
                </Link>
              </div>
            </div>

            {/* Plan Types */}
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider">Plan Types</h3>
              <div className="space-y-2">
                <Link to={createPageUrl("CompareRates") + "?planType=fixed"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Fixed Rate Plans
                </Link>
                <Link to={createPageUrl("CompareRates") + "?planType=variable"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Variable Rate Plans
                </Link>
                <Link to={createPageUrl("RenewableEnergy")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Renewable Energy
                </Link>
                <Link to={createPageUrl("CompareRates") + "?contract=12"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  12 Month Plans
                </Link>
                <Link to={createPageUrl("CompareRates") + "?contract=24"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  24 Month Plans
                </Link>
              </div>
            </div>
          </div>

          {/* State Links */}
          <div className="border-t border-gray-800 pt-8 pb-6">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Electricity Rates by State</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              <Link to={createPageUrl("TexasElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Texas
              </Link>
              <Link to={createPageUrl("IllinoisElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Illinois
              </Link>
              <Link to={createPageUrl("OhioElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Ohio
              </Link>
              <Link to={createPageUrl("PennsylvaniaElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Pennsylvania
              </Link>
              <Link to={createPageUrl("NewYorkElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                New York
              </Link>
              <Link to={createPageUrl("NewJerseyElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                New Jersey
              </Link>
              <Link to={createPageUrl("MarylandElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Maryland
              </Link>
              <Link to={createPageUrl("MassachusettsElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Massachusetts
              </Link>
              <Link to={createPageUrl("MaineElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Maine
              </Link>
              <Link to={createPageUrl("NewHampshireElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                New Hampshire
              </Link>
              <Link to={createPageUrl("RhodeIslandElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Rhode Island
              </Link>
              <Link to={createPageUrl("ConnecticutElectricity")} className="text-gray-400 hover:text-white text-sm transition-colors">
                Connecticut
              </Link>
            </div>
          </div>

          {/* SEO Text */}
          <div className="border-t border-gray-800 pt-6 pb-6">
            <p className="text-gray-500 text-xs leading-relaxed max-w-5xl">
              Power Scouts is America's leading electricity comparison platform, helping residents and businesses across 12 deregulated states find the best electricity rates. Serving Texas (Houston, Dallas, Austin), Illinois (Chicago), Ohio (Cleveland, Columbus), Pennsylvania (Philadelphia, Pittsburgh), New York (NYC, Buffalo), New Jersey (Newark, Jersey City), Maryland (Baltimore), Massachusetts (Boston), Maine (Portland), New Hampshire (Manchester), Rhode Island (Providence), and Connecticut (Hartford). Compare plans from top providers including TXU Energy, Reliant, Gexa, Direct Energy, Constellation, and 40+ others. Whether you're looking for fixed rate plans, renewable energy options, or the cheapest electricity rates in your state, we make it easy to switch and save. Our free service gives you instant access to rates from multiple electricity providers, personalized to your ZIP code and usage. Start comparing today and join thousands nationwide who have saved on their electricity bills with Power Scouts.
            </p>
          </div>

          <div className="border-t border-gray-700 pt-6 text-center">
            <p className="text-gray-400 text-xs">
              © {new Date().getFullYear()} Power Scouts. All rights reserved. | 
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-white transition-colors ml-1">Privacy Policy</Link> | 
              <Link to={createPageUrl("TermsOfService")} className="hover:text-white transition-colors ml-1">Terms of Service</Link>
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