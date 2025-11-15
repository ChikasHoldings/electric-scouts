import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users, Zap, ArrowRight, CheckCircle, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const cities = [
  // Texas Cities
  {
    name: "Houston",
    state: "TX",
    county: "Harris County",
    population: "2.3M",
    avgRate: "8.9¢/kWh",
    providers: 45,
    savings: "$850/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/15b59cb95_b92baf13-dff3-4777-8e8a-b25f73b10b8d.jpg"
  },
  {
    name: "Dallas",
    state: "TX",
    county: "Dallas County",
    population: "1.3M",
    avgRate: "9.1¢/kWh",
    providers: 42,
    savings: "$820/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a6af53178_8d19f65b-9e9f-4d66-b5f9-6d0cc6de9965.jpg"
  },
  {
    name: "Austin",
    state: "TX",
    county: "Travis County",
    population: "978K",
    avgRate: "9.3¢/kWh",
    providers: 38,
    savings: "$780/yr",
    image: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=300&fit=crop"
  },
  {
    name: "San Antonio",
    state: "TX",
    county: "Bexar County",
    population: "1.5M",
    avgRate: "8.8¢/kWh",
    providers: 40,
    savings: "$830/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/9afbd2a3e_136ff412-03e2-40c7-8934-8517d2404665.jpg"
  },
  {
    name: "Fort Worth",
    state: "TX",
    county: "Tarrant County",
    population: "927K",
    avgRate: "9.0¢/kWh",
    providers: 41,
    savings: "$810/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/10a0998d3_87a80756-c4b5-44c5-bc05-259fef05ca68.jpg"
  },
  // Illinois Cities
  {
    name: "Chicago",
    state: "IL",
    county: "Cook County",
    population: "2.7M",
    avgRate: "9.8¢/kWh",
    providers: 36,
    savings: "$750/yr",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop"
  },
  {
    name: "Aurora",
    state: "IL",
    county: "Kane County",
    population: "180K",
    avgRate: "9.9¢/kWh",
    providers: 34,
    savings: "$720/yr",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&h=300&fit=crop"
  },
  {
    name: "Naperville",
    state: "IL",
    county: "DuPage County",
    population: "149K",
    avgRate: "9.7¢/kWh",
    providers: 35,
    savings: "$740/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a29348055_403443a6-48b5-4052-ac9e-6600f43ab721.jpg"
  },
  {
    name: "Joliet",
    state: "IL",
    county: "Will County",
    population: "150K",
    avgRate: "9.8¢/kWh",
    providers: 33,
    savings: "$730/yr",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop"
  },
  // Ohio Cities
  {
    name: "Columbus",
    state: "OH",
    county: "Franklin County",
    population: "905K",
    avgRate: "9.5¢/kWh",
    providers: 38,
    savings: "$780/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/3a9213c53_03fe81c8-162d-4692-be26-32e20095399c.jpg"
  },
  {
    name: "Cleveland",
    state: "OH",
    county: "Cuyahoga County",
    population: "372K",
    avgRate: "9.6¢/kWh",
    providers: 37,
    savings: "$770/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a29bc65bc_0566fb7e-4b0b-46d4-bdc4-04a2189962bf.jpg"
  },
  {
    name: "Cincinnati",
    state: "OH",
    county: "Hamilton County",
    population: "309K",
    avgRate: "9.7¢/kWh",
    providers: 36,
    savings: "$760/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/25159c55a_e1e2ce07-4723-4b43-b55c-8e6a0251d472.jpg"
  },
  {
    name: "Toledo",
    state: "OH",
    county: "Lucas County",
    population: "270K",
    avgRate: "9.6¢/kWh",
    providers: 35,
    savings: "$750/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/1d0dc8814_c3d7d2f5-d102-4ed8-aa7f-f2e9c6e02764.jpg"
  },
  // Pennsylvania Cities
  {
    name: "Philadelphia",
    state: "PA",
    county: "Philadelphia County",
    population: "1.6M",
    avgRate: "10.2¢/kWh",
    providers: 32,
    savings: "$680/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/857445e3d_01dc15fd-0434-4dd9-ac68-9123c6a14f33.jpg"
  },
  {
    name: "Pittsburgh",
    state: "PA",
    county: "Allegheny County",
    population: "303K",
    avgRate: "10.1¢/kWh",
    providers: 30,
    savings: "$690/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/a1fa80de5_162bc2ea-2c58-4a65-bab4-76e96955cc5c1.jpg"
  },
  {
    name: "Allentown",
    state: "PA",
    county: "Lehigh County",
    population: "125K",
    avgRate: "10.3¢/kWh",
    providers: 28,
    savings: "$670/yr",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop"
  },
  // New York Cities
  {
    name: "New York City",
    state: "NY",
    county: "New York County",
    population: "8.3M",
    avgRate: "11.5¢/kWh",
    providers: 28,
    savings: "$620/yr",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop"
  },
  {
    name: "Buffalo",
    state: "NY",
    county: "Erie County",
    population: "278K",
    avgRate: "10.8¢/kWh",
    providers: 25,
    savings: "$650/yr",
    image: "https://images.unsplash.com/photo-1549144511-f099e773c147?w=400&h=300&fit=crop"
  },
  {
    name: "Rochester",
    state: "NY",
    county: "Monroe County",
    population: "211K",
    avgRate: "10.9¢/kWh",
    providers: 24,
    savings: "$640/yr",
    image: "https://images.unsplash.com/photo-1559087867-ce4c91325525?w=400&h=300&fit=crop"
  },
  {
    name: "Syracuse",
    state: "NY",
    county: "Onondaga County",
    population: "148K",
    avgRate: "11.0¢/kWh",
    providers: 23,
    savings: "$630/yr",
    image: "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=400&h=300&fit=crop"
  },
  // New Jersey Cities
  {
    name: "Newark",
    state: "NJ",
    county: "Essex County",
    population: "311K",
    avgRate: "10.5¢/kWh",
    providers: 27,
    savings: "$660/yr",
    image: "https://images.unsplash.com/photo-1589756823695-278bc8eac975?w=400&h=300&fit=crop"
  },
  {
    name: "Jersey City",
    state: "NJ",
    county: "Hudson County",
    population: "292K",
    avgRate: "10.6¢/kWh",
    providers: 26,
    savings: "$650/yr",
    image: "https://images.unsplash.com/photo-1587582423116-ec07293f0395?w=400&h=300&fit=crop"
  },
  {
    name: "Paterson",
    state: "NJ",
    county: "Passaic County",
    population: "159K",
    avgRate: "10.7¢/kWh",
    providers: 25,
    savings: "$640/yr",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
  },
  // Maryland Cities
  {
    name: "Baltimore",
    state: "MD",
    county: "Baltimore City",
    population: "576K",
    avgRate: "10.4¢/kWh",
    providers: 29,
    savings: "$670/yr",
    image: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=400&h=300&fit=crop"
  },
  {
    name: "Frederick",
    state: "MD",
    county: "Frederick County",
    population: "79K",
    avgRate: "10.5¢/kWh",
    providers: 27,
    savings: "$660/yr",
    image: "https://images.unsplash.com/photo-1590932722660-b2e3c71b1379?w=400&h=300&fit=crop"
  },
  {
    name: "Rockville",
    state: "MD",
    county: "Montgomery County",
    population: "68K",
    avgRate: "10.3¢/kWh",
    providers: 28,
    savings: "$680/yr",
    image: "https://images.unsplash.com/photo-1577894947058-fccf5cf3f8ac?w=400&h=300&fit=crop"
  },
  // Massachusetts Cities
  {
    name: "Boston",
    state: "MA",
    county: "Suffolk County",
    population: "675K",
    avgRate: "11.2¢/kWh",
    providers: 22,
    savings: "$600/yr",
    image: "https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=400&h=300&fit=crop"
  },
  {
    name: "Worcester",
    state: "MA",
    county: "Worcester County",
    population: "206K",
    avgRate: "11.3¢/kWh",
    providers: 21,
    savings: "$590/yr",
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop"
  },
  {
    name: "Springfield",
    state: "MA",
    county: "Hampden County",
    population: "155K",
    avgRate: "11.4¢/kWh",
    providers: 20,
    savings: "$580/yr",
    image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=300&fit=crop"
  },
  // Connecticut Cities
  {
    name: "Hartford",
    state: "CT",
    county: "Hartford County",
    population: "121K",
    avgRate: "11.8¢/kWh",
    providers: 19,
    savings: "$550/yr",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop"
  },
  {
    name: "New Haven",
    state: "CT",
    county: "New Haven County",
    population: "135K",
    avgRate: "11.7¢/kWh",
    providers: 19,
    savings: "$560/yr",
    image: "https://images.unsplash.com/photo-1569149646689-5e8bbdbbd944?w=400&h=300&fit=crop"
  },
  {
    name: "Bridgeport",
    state: "CT",
    county: "Fairfield County",
    population: "148K",
    avgRate: "11.9¢/kWh",
    providers: 18,
    savings: "$540/yr",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop"
  },
  // Maine Cities
  {
    name: "Portland",
    state: "ME",
    county: "Cumberland County",
    population: "68K",
    avgRate: "11.5¢/kWh",
    providers: 17,
    savings: "$570/yr",
    image: "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=400&h=300&fit=crop"
  },
  {
    name: "Lewiston",
    state: "ME",
    county: "Androscoggin County",
    population: "37K",
    avgRate: "11.6¢/kWh",
    providers: 16,
    savings: "$560/yr",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop"
  },
  {
    name: "Bangor",
    state: "ME",
    county: "Penobscot County",
    population: "32K",
    avgRate: "11.7¢/kWh",
    providers: 16,
    savings: "$550/yr",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop"
  },
  // New Hampshire Cities
  {
    name: "Manchester",
    state: "NH",
    county: "Hillsborough County",
    population: "115K",
    avgRate: "11.6¢/kWh",
    providers: 17,
    savings: "$560/yr",
    image: "https://images.unsplash.com/photo-1606403726988-eb685c61c9b6?w=400&h=300&fit=crop"
  },
  {
    name: "Nashua",
    state: "NH",
    county: "Hillsborough County",
    population: "91K",
    avgRate: "11.7¢/kWh",
    providers: 16,
    savings: "$550/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/0497c3089_89e68724-f3a0-408a-b82b-21c7f26fe660.jpg"
  },
  {
    name: "Concord",
    state: "NH",
    county: "Merrimack County",
    population: "43K",
    avgRate: "11.8¢/kWh",
    providers: 16,
    savings: "$540/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/63646130e_c2b6c002-b461-43af-873e-02caf45e467b.jpg"
  },
  // Rhode Island Cities
  {
    name: "Providence",
    state: "RI",
    county: "Providence County",
    population: "190K",
    avgRate: "11.9¢/kWh",
    providers: 15,
    savings: "$530/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/3a56f40c4_3de2f374-e6c7-4415-a731-3588f4dc57b8.jpg"
  },
  {
    name: "Warwick",
    state: "RI",
    county: "Kent County",
    population: "83K",
    avgRate: "12.0¢/kWh",
    providers: 15,
    savings: "$520/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/d9b752924_a37c566e-4168-4be1-a823-20bf311f7ed9.jpg"
  },
  {
    name: "Cranston",
    state: "RI",
    county: "Providence County",
    population: "82K",
    avgRate: "12.0¢/kWh",
    providers: 14,
    savings: "$520/yr",
    image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/c4af296bf_ccdd3a45-7050-4bd0-89d9-81c846e9fcdc.jpg"
  }
];

export default function AllCities() {
  const [searchTerm, setSearchTerm] = useState("");
  const [zipCode, setZipCode] = useState("");

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">
              All Service Areas
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Find the best electricity rates in your city. We serve major cities across 12 deregulated states.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search cities or counties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white border-0 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">12</div>
              <div className="text-sm text-gray-600">States Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">200+</div>
              <div className="text-sm text-gray-600">Cities Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">100M+</div>
              <div className="text-sm text-gray-600">Residents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">$700</div>
              <div className="text-sm text-gray-600">Avg. Annual Savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Major Service Areas
          </h2>
          <p className="text-gray-600">
            {filteredCities.length} cit{filteredCities.length !== 1 ? 'ies' : 'y'} found
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCities.map((city, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-[#FF6B35] group overflow-hidden">
              {/* City Image */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={city.image} 
                  alt={`${city.name}, ${city.state}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-2xl font-bold text-white mb-1">{city.name}</h3>
                  <p className="text-sm text-white/90">{city.county}, {city.state}</p>
                </div>
              </div>

              <CardContent className="p-6">
                {/* City Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Population</div>
                      <div className="text-sm font-bold text-gray-900">{city.population}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Providers</div>
                      <div className="text-sm font-bold text-gray-900">{city.providers}</div>
                    </div>
                  </div>
                </div>

                {/* Average Rate */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Avg. Rate</div>
                      <div className="text-xl font-bold text-[#0A5C8C]">{city.avgRate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 mb-1">Potential Savings</div>
                      <div className="text-lg font-bold text-green-600 flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        {city.savings}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link to={createPageUrl("CityRates") + `?city=${city.name}`}>
                  <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white group-hover:shadow-lg transition-all">
                    View Rates in {city.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] rounded-3xl shadow-2xl p-12 text-center overflow-hidden">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Find the Best Rates in Your Area
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Enter your ZIP code to compare electricity plans available in your city.
            </p>
            
            {/* ZIP Code Input */}
            <div className="max-w-lg mx-auto mb-6">
              <div className="bg-white rounded-2xl shadow-xl p-1.5">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder="Enter ZIP code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-0 h-auto placeholder:text-gray-400 font-semibold"
                      maxLength={5}
                    />
                  </div>
                  <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white shadow-lg hover:shadow-xl transition-all h-full">
                      Compare Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>100% Free</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No Credit Card</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}