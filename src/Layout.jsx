import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X, ArrowUp, MapPin, Building, Home as HomeIcon, FileText, Lightbulb, HelpCircle, Leaf } from "lucide-react";

const topStates = [
  { name: "Texas", code: "TX", page: "TexasElectricity" },
  { name: "Illinois", code: "IL", page: "IllinoisElectricity" },
  { name: "Ohio", code: "OH", page: "OhioElectricity" },
  { name: "Pennsylvania", code: "PA", page: "PennsylvaniaElectricity" },
  { name: "New York", code: "NY", page: "NewYorkElectricity" },
  { name: "New Jersey", code: "NJ", page: "NewJerseyElectricity" }
];

const topCities = [
  { name: "Houston", state: "TX" },
  { name: "Dallas", state: "TX" },
  { name: "Chicago", state: "IL" },
  { name: "Columbus", state: "OH" },
  { name: "Philadelphia", state: "PA" },
  { name: "New York City", state: "NY" }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [serviceAreaOpen, setServiceAreaOpen] = useState(false);

  // Google Analytics
  useEffect(() => {
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-76JDWREHD2';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-76JDWREHD2');
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  // Performance: Debounce scroll handler
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          setShowBackToTop(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top on route change and close mobile menu
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setMobileMenuOpen(false);
  }, [location.pathname]);



  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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
                alt="Power Scouts Logo - Compare Electricity Rates and Save on Your Energy Bill in 12 Deregulated States"
                className="h-12 sm:h-14 lg:h-16"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              <Link
                to={createPageUrl("AllProviders")}
                className="text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-base xl:text-lg font-medium"
              >
                Providers
              </Link>

              <div 
                className="relative group"
                onMouseEnter={() => setServiceAreaOpen(true)}
                onMouseLeave={() => setServiceAreaOpen(false)}
              >
                <button className="flex items-center gap-1 text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-base xl:text-lg font-medium">
                  Service Areas
                  <ChevronDown className={`w-4 h-4 transition-transform ${serviceAreaOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-white rounded-xl shadow-2xl transition-all duration-300 z-50 border border-gray-100 ${
                  serviceAreaOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-5">
                      {/* States Column */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100">
                          <Building className="w-4 h-4 text-[#0A5C8C]" />
                          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">States</h3>
                        </div>
                        <div className="space-y-0.5">
                          {topStates.map((state, index) => (
                            <Link 
                              key={index}
                              to={createPageUrl(state.page)} 
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 hover:text-[#0A5C8C] rounded-lg transition-all font-medium"
                              onClick={() => setServiceAreaOpen(false)}
                            >
                              {state.name}
                            </Link>
                          ))}
                        </div>
                        <Link 
                          to={createPageUrl("AllStates")} 
                          className="block mt-2.5 pt-2.5 border-t border-gray-100 text-sm text-[#FF6B35] hover:text-[#e55a2b] font-semibold transition-colors"
                          onClick={() => setServiceAreaOpen(false)}
                        >
                          View All States →
                        </Link>
                      </div>

                      {/* Cities Column */}
                      <div>
                        <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100">
                          <MapPin className="w-4 h-4 text-[#0A5C8C]" />
                          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Cities</h3>
                        </div>
                        <div className="space-y-0.5">
                          {topCities.map((city, index) => (
                            <Link 
                              key={index}
                              to={createPageUrl("CityRates") + `?city=${city.name}&state=${city.state}`} 
                              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 hover:text-[#0A5C8C] rounded-lg transition-all font-medium"
                              onClick={() => setServiceAreaOpen(false)}
                            >
                              {city.name}
                            </Link>
                          ))}
                        </div>
                        <Link 
                          to={createPageUrl("AllCities")} 
                          className="block mt-2.5 pt-2.5 border-t border-gray-100 text-sm text-[#FF6B35] hover:text-[#e55a2b] font-semibold transition-colors"
                          onClick={() => setServiceAreaOpen(false)}
                        >
                          View All Cities →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to={createPageUrl("BillAnalyzer")}
                className="text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-base xl:text-lg font-medium"
              >
                Bill Analyzer
              </Link>

              <div className="relative group">
                <button className="flex items-center gap-1 text-[#084a6f] hover:text-[#0A5C8C] transition-colors text-base xl:text-lg font-medium">
                  Resources
                  <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-3 z-50 border border-gray-100">
                  <div className="space-y-1.5">
                    <Link to={createPageUrl("LearningCenter")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      Learning Center
                    </Link>
                    <Link to={createPageUrl("FAQ")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      FAQs
                    </Link>
                    <Link to={createPageUrl("RenewableEnergy")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      Renewable Energy
                    </Link>
                    <Link to={createPageUrl("HomeConcierge")} className="block text-sm text-gray-600 hover:text-blue-600 hover:translate-x-1 transition-all py-2">
                      Home Concierge
                    </Link>
                  </div>
                </div>
              </div>
            </nav>

            {/* Compare Rates Button */}
            <div className="hidden lg:block">
              <Link to={createPageUrl("CompareRates")}>
                <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold px-5 xl:px-6 py-2 text-base xl:text-lg rounded-lg transition-all duration-300 touch-manipulation">
                  Compare Rates
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Menu Overlay - Outside header for proper z-index */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop with blur */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] lg:hidden transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          />
          
          {/* Slide-in Menu Panel */}
          <div 
            className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white shadow-2xl z-[1000] lg:hidden overflow-y-auto"
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-[#0A5C8C] to-[#084a6f]">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/100c53ddb_ChatGPTImageNov12202509_09_31PM.png"
                alt="Power Scouts - Mobile Menu Logo for Electricity Rate Comparison Service"
                className="h-14"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="p-4">
              {/* Navigation Links - Removed icon containers, reduced spacing */}
              <Link 
                to={createPageUrl("Home")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HomeIcon className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                <span className="text-gray-900 font-medium text-base">Home</span>
              </Link>

              <div className="border-t border-gray-200 my-2"></div>

              <Link 
                to={createPageUrl("AllProviders")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-base">Providers</span>
              </Link>

              <Link 
                to={createPageUrl("AllStates")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-base">Service Areas</span>
              </Link>

              <Link 
                to={createPageUrl("BillAnalyzer")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FileText className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-base">Bill Analyzer</span>
              </Link>

              <div className="border-t border-gray-200 my-2"></div>

              <Link 
                to={createPageUrl("LearningCenter")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-base">Learning Center</span>
              </Link>

              <Link 
                to={createPageUrl("FAQ")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HelpCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-base">FAQs</span>
              </Link>

              <Link 
                to={createPageUrl("RenewableEnergy")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Leaf className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-base">Renewable Energy</span>
              </Link>

              {/* Primary CTA */}
              <Link 
                to={createPageUrl("CompareRates")} 
                onClick={() => setMobileMenuOpen(false)}
                className="block mt-4 mb-3"
              >
                <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold py-3.5 text-base rounded-lg">
                  Compare Rates Now
                </Button>
              </Link>
            </div>

            {/* Menu Footer */}
            <div className="p-4 mt-auto border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600 text-center mb-2">
                © {new Date().getFullYear()} Power Scouts
              </p>
              <div className="flex items-center justify-center gap-3 text-xs">
                <Link 
                  to={createPageUrl("PrivacyPolicy")} 
                  className="text-gray-600 hover:text-[#0A5C8C]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Privacy
                </Link>
                <span className="text-gray-400">•</span>
                <Link 
                  to={createPageUrl("TermsOfService")} 
                  className="text-gray-600 hover:text-[#0A5C8C]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

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
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/f61f9bbae_ChatGPTImageNov12202509_09_31PM.png"
                alt="Power Scouts Footer Logo - Trusted Electricity Comparison Platform Serving TX, PA, NY, OH, IL, NJ, MD, MA, ME, NH, RI, CT"
                className="h-12 sm:h-14 mb-4"
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
                <Link to={createPageUrl("CityRates") + "?city=Houston&state=TX"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Houston
                </Link>
                <Link to={createPageUrl("CityRates") + "?city=Dallas&state=TX"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Dallas
                </Link>
                <Link to={createPageUrl("CityRates") + "?city=Austin&state=TX"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Austin
                </Link>
                <Link to={createPageUrl("CityRates") + "?city=San Antonio&state=TX"} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  San Antonio
                </Link>
                <Link to={createPageUrl("CityRates") + "?city=Fort Worth&state=TX"} className="block text-gray-400 hover:text-white text-sm transition-colors">
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
                <Link to={createPageUrl("HomeConcierge")} className="block text-gray-400 hover:text-white text-sm transition-colors">
                  Home Concierge
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
            <div className="mb-6">
              <h3 className="text-white text-sm font-bold mb-3 uppercase tracking-wider">About Power Scouts</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-5xl">
                Power Scouts is America's leading electricity comparison platform, helping residents and businesses across 12 deregulated states find the best electricity rates. We serve Texas (Houston, Dallas, Austin, San Antonio, Fort Worth), Illinois (Chicago, Aurora, Naperville), Ohio (Columbus, Cleveland, Cincinnati), Pennsylvania (Philadelphia, Pittsburgh, Allentown), New York (NYC, Buffalo, Rochester), New Jersey (Newark, Jersey City), Maryland (Baltimore), Massachusetts (Boston, Worcester), Maine (Portland), New Hampshire (Manchester), Rhode Island (Providence), and Connecticut (Hartford, New Haven, Bridgeport).
              </p>
            </div>
            <div className="mb-6">
              <h3 className="text-white text-sm font-bold mb-3 uppercase tracking-wider">Compare Electricity Providers</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-5xl">
                Compare plans from top electricity companies including TXU Energy, Reliant Energy, Gexa Energy, Direct Energy, Constellation Energy, Green Mountain Energy, Pulse Power, Champion Energy, Frontier Utilities, Rhythm Energy, and 40+ other trusted providers. Find fixed rate electricity plans, variable rate plans, renewable energy options, prepaid electricity, month-to-month plans, and long-term contracts. Our platform helps you compare electricity rates per kWh, estimated monthly bills, contract terms, renewable percentages, early termination fees, and customer reviews all in one place.
              </p>
            </div>
            <div>
              <h3 className="text-white text-sm font-bold mb-3 uppercase tracking-wider">Why Choose Your Electricity Provider</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-5xl">
                In deregulated electricity markets, competition among providers creates lower rates and better service. Whether you're looking for the cheapest electricity rates, 100% renewable green energy plans, fixed rate protection, flexible month-to-month options, or plans with no deposit requirements, our free comparison service makes it easy to find and switch to better electricity plans. Save up to $800 per year on your electricity bill by comparing rates today. Our instant comparison tool is completely free with no credit card required, no hidden fees, and no obligations. Start saving on electricity now.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-500 text-xs leading-relaxed mb-4 max-w-5xl mx-auto">
              <strong>Disclaimer:</strong> Electricity rates, plan details, and provider actual rates vary by ZIP code, usage, credit, and are subject to change. Verify all details with providers before enrollment. Power Scouts is a comparison service and does not guarantee rate accuracy or plan availability. Savings estimates are based on average usage and market conditions.
            </p>
            <p className="text-gray-400 text-xs text-center">
              © {new Date().getFullYear()} Power Scouts. All rights reserved. | 
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-white transition-colors ml-1">Privacy Policy</Link> | 
              <Link to={createPageUrl("TermsOfService")} className="hover:text-white transition-colors ml-1">Terms of Service</Link> | 
              <Link to={createPageUrl("AboutUs")} className="hover:text-white transition-colors ml-1">About Us</Link>
            </p>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      {showBackToTop && !mobileMenuOpen && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#FF6B35] text-white rounded-full shadow-xl hover:shadow-2xl transition-all z-[998] flex items-center justify-center hover:scale-110 transform group touch-manipulation"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
        </button>
      )}
    </div>
  );
}