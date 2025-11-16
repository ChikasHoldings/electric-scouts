import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, CheckCircle, Zap, TrendingDown, ArrowRight } from "lucide-react";
import { getAllDeregulatedStates, validateZipCode, getStateByZip } from "../components/compare/stateData";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";

export default function AllStates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [zipCode, setZipCode] = useState("");
  const states = getAllDeregulatedStates();

  // Real-time ZIP validation and filtering
  const zipValidation = searchTerm.length === 5 && /^\d{5}$/.test(searchTerm) 
    ? validateZipCode(searchTerm) 
    : null;

  const filteredStates = states.filter(state => {
    // Check if search term is a 5-digit ZIP code
    if (zipValidation?.valid && zipValidation?.state) {
      return state.code === zipValidation.state;
    }
    
    // Otherwise filter by name search
    const nameMatch = state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      state.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return nameMatch;
  });

  // State capital images map
  const stateImages = {
    'TX': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80', // Austin - Texas State Capitol
    'IL': 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80', // Springfield, IL State Capitol
    'OH': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/8cb27999c_ChatGPTImageNov15202502_43_31PM.png', // Columbus, OH Statehouse
    'PA': 'https://images.unsplash.com/photo-1575489272413-cb506258027e?w=800&q=80', // Harrisburg, PA State Capitol
    'NY': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e9e695304_2df6101f-36ce-4e88-b0b4-5a7b280fbc8c.jpg', // Albany, NY Capitol Building
    'NJ': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a88378e68_7c4d9304-68aa-406d-b5e7-0e3fe12aa17b.jpg', // Trenton, NJ State House
    'MD': 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=800&q=80', // Annapolis, MD State House
    'MA': 'https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=800&q=80', // Boston, MA State House
    'ME': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/43e4fae9e_019a8321-348a-4c7e-a7e4-078744896b7a.jpg', // Augusta, ME State House
    'NH': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/0ad3806b3_ChatGPTImageNov15202502_45_36PM.png', // Concord, NH State House
    'RI': 'https://images.unsplash.com/photo-1572295727871-7638149ea3d7?w=800&q=80', // Providence, RI State House
    'CT': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/9f22776d4_26acfe5d-4dd4-4897-94aa-f67876a75dc6.jpg'  // Hartford, CT State Capitol
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Available Markets", url: "/all-states" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Deregulated Electricity States - Compare Rates in 12 Markets | Power Scouts"
        description="Compare electricity rates in 12 deregulated states: Texas (TX), Illinois (IL), Ohio (OH), Pennsylvania (PA), New York (NY), New Jersey (NJ), Maryland (MD), Massachusetts (MA), Maine (ME), New Hampshire (NH), Rhode Island (RI), Connecticut (CT). Choose your electricity supplier, compare 40+ providers, save up to $800/year. Free comparison across all competitive energy markets."
        keywords="deregulated electricity states, electricity choice states, competitive energy markets, electricity providers by state, choose electricity supplier, states with energy choice, deregulated energy markets, electricity deregulation by state, energy competition states"
        canonical="/all-states"
        structuredData={breadcrumbData}
      />
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
              Electricity Choice States
            </h1>
            <p className="text-sm sm:text-base text-blue-100 mb-5 sm:mb-6">
              Compare electricity providers in 12 states where you have the power to choose. Find your state to unlock savings.
            </p>
            
            {/* Unified Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by state name or ZIP code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 sm:pl-12 pr-4 h-11 sm:h-12 bg-white border-0 shadow-lg text-sm sm:text-base rounded-lg focus-visible:ring-2 focus-visible:ring-white/20 touch-manipulation text-gray-900 placeholder:text-gray-400"
              />
            </div>
            
            {/* ZIP Validation Feedback */}
            {zipValidation && (
              <div className={`mt-3 p-3 rounded-lg ${
                zipValidation.valid 
                  ? 'bg-green-500/20 border border-green-400' 
                  : 'bg-red-500/20 border border-red-400'
              }`}>
                {zipValidation.valid ? (
                  <div className="flex items-center gap-2 text-white text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Showing electricity options for {zipValidation.stateFullName} (ZIP: {searchTerm})</span>
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="ml-auto underline hover:no-underline"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white text-sm">
                    <span>⚠️ {zipValidation.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0A5C8C] mb-1">12</div>
              <div className="text-xs text-gray-600">Choice States</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0A5C8C] mb-1">100M+</div>
              <div className="text-xs text-gray-600">Residents Served</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0A5C8C] mb-1">40+</div>
              <div className="text-xs text-gray-600">Providers Available</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-[#0A5C8C] mb-1">$700</div>
              <div className="text-xs text-gray-600">Avg. Annual Savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* States Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
            Available Markets
          </h2>
          <p className="text-sm text-gray-600">
            {zipValidation?.valid ? (
              <>Showing {filteredStates.length} state for ZIP code {searchTerm}</>
            ) : (
              <>{filteredStates.length} state{filteredStates.length !== 1 ? 's' : ''} found</>
            )}
          </p>
        </div>

        {filteredStates.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredStates.map((state, index) => {
              // Map state codes to their URL slugs
              const stateUrlMap = {
                'TX': 'TexasElectricity',
                'IL': 'IllinoisElectricity',
                'OH': 'OhioElectricity',
                'PA': 'PennsylvaniaElectricity',
                'NY': 'NewYorkElectricity',
                'NJ': 'NewJerseyElectricity',
                'MD': 'MarylandElectricity',
                'MA': 'MassachusettsElectricity',
                'ME': 'MaineElectricity',
                'NH': 'NewHampshireElectricity',
                'RI': 'RhodeIslandElectricity',
                'CT': 'ConnecticutElectricity'
              };

              return (
                <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 border hover:border-[#0A5C8C] group">
                  {/* State Image */}
                  <div className="relative h-36 overflow-hidden bg-gray-200">
                    <img 
                      src={stateImages[state.code]} 
                      alt={`${state.fullName} State Capitol - Electricity Rates and Providers`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.backgroundColor = '#0A5C8C';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-3">
                      <h3 className="text-lg font-bold text-white">{state.fullName}</h3>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* State Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-blue-50 rounded-lg p-2.5">
                        <div className="text-xs text-gray-600 mb-0.5">Providers</div>
                        <div className="text-base font-bold text-[#0A5C8C] flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          {state.providerCount}+
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2.5">
                        <div className="text-xs text-gray-600 mb-0.5">Avg. Savings</div>
                        <div className="text-base font-bold text-green-600 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          ${state.avgSavings}/yr
                        </div>
                      </div>
                    </div>

                    {/* Major Cities */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1.5 font-medium">Major Cities:</p>
                      <div className="flex flex-wrap gap-1">
                        {state.cities.slice(0, 3).map((city, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {city}
                          </span>
                        ))}
                        {state.cities.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            +{state.cities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link to={createPageUrl(stateUrlMap[state.code])}>
                        <Button variant="outline" size="sm" className="w-full text-xs border-gray-300 hover:border-[#0A5C8C] hover:text-[#0A5C8C] transition-all">
                          Learn More
                        </Button>
                      </Link>
                      <Link to={createPageUrl("CompareRates")}>
                        <Button size="sm" className="w-full text-xs bg-[#FF6B35] hover:bg-[#e55a2b] text-white transition-all">
                          Compare Rates
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {zipValidation?.valid ? (
                <>No deregulated markets found for ZIP code "{zipFilter}"</>
              ) : searchTerm ? (
                <>No states found matching "{searchTerm}"</>
              ) : (
                <>No states found</>
              )}
            </p>
            <div className="flex gap-2 justify-center">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Name Search
                </Button>
              )}
              {zipValidation && (
                <Button variant="outline" onClick={() => {
                  setZipFilter('');
                  setZipValidation(null);
                }}>
                  Clear ZIP Search
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Why Choose Your Supplier Section */}
      <div className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Why Electricity Choice Matters
          </h2>
          <div className="text-center mb-8">
            <p className="text-sm text-gray-600 mb-3">
              In competitive electricity markets, you have the power to choose your supplier, creating competition 
              among providers. This results in lower rates, better customer service, and more plan options.
            </p>
            <p className="text-sm text-gray-600">
              Your local utility still delivers the electricity and maintains the power lines, 
              but you control which company supplies your power—leading to significant savings for millions.
            </p>
          </div>
            
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Lower Rates",
                description: "Competition drives prices down, with average savings of $600-$800 per year"
              },
              {
                title: "More Choices",
                description: "Choose from fixed, variable, renewable energy, and prepaid plans"
              },
              {
                title: "Better Service",
                description: "Providers compete on customer service, not just price"
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-5">
                <h3 className="text-base font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] rounded-2xl shadow-2xl p-10 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Find the Best Rates in Your Area
            </h2>
            <p className="text-base text-blue-100 mb-6 max-w-2xl mx-auto">
              Enter your ZIP code to compare electricity plans available in your state.
            </p>
            
            {/* ZIP Code Input */}
            <div className="max-w-lg mx-auto mb-5">
              <div className="bg-white rounded-xl shadow-xl p-1.5">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 flex items-center gap-2.5 px-4 py-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-[#0A5C8C] flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder="Enter ZIP code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0 h-auto placeholder:text-gray-400 font-semibold"
                      maxLength={5}
                    />
                  </div>
                  <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button className="w-full sm:w-auto px-8 py-3 text-base font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white shadow-lg hover:shadow-xl transition-all h-full">
                      Compare Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-5 flex-wrap text-xs text-blue-100">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span>100% Free</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span>No Credit Card</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}