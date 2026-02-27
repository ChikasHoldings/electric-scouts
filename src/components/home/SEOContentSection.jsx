import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Zap, Building, Leaf, TrendingDown, Shield, BookOpen } from "lucide-react";

export default function SEOContentSection() {
  const states = [
    { name: "Texas", page: "TexasElectricity", cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"] },
    { name: "Illinois", page: "IllinoisElectricity", cities: ["Chicago", "Aurora", "Naperville", "Rockford"] },
    { name: "Ohio", page: "OhioElectricity", cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo"] },
    { name: "Pennsylvania", page: "PennsylvaniaElectricity", cities: ["Philadelphia", "Pittsburgh", "Allentown"] },
    { name: "New York", page: "NewYorkElectricity", cities: ["New York City", "Buffalo", "Rochester"] },
    { name: "New Jersey", page: "NewJerseyElectricity", cities: ["Newark", "Jersey City", "Paterson"] },
    { name: "Maryland", page: "MarylandElectricity", cities: ["Baltimore", "Columbia", "Germantown"] },
    { name: "Massachusetts", page: "MassachusettsElectricity", cities: ["Boston", "Worcester", "Springfield"] },
    { name: "Connecticut", page: "ConnecticutElectricity", cities: ["Hartford", "New Haven", "Bridgeport"] },
    { name: "Maine", page: "MaineElectricity", cities: ["Portland", "Lewiston", "Bangor"] },
    { name: "New Hampshire", page: "NewHampshireElectricity", cities: ["Manchester", "Nashua", "Concord"] },
    { name: "Rhode Island", page: "RhodeIslandElectricity", cities: ["Providence", "Warwick", "Cranston"] },
  ];

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main SEO Heading */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Compare Electricity Rates Across 12 Deregulated States
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
            ElectricScouts helps you find the best electricity plans from over 40 trusted providers. 
            Whether you need a <Link to={createPageUrl("CompareRates") + "?planType=fixed"} className="text-[#0A5C8C] hover:underline font-medium">fixed-rate plan</Link> for price stability, 
            a <Link to={createPageUrl("CompareRates") + "?planType=variable"} className="text-[#0A5C8C] hover:underline font-medium">variable-rate plan</Link> for flexibility, 
            or a <Link to={createPageUrl("RenewableEnergy")} className="text-[#0A5C8C] hover:underline font-medium">100% renewable energy plan</Link>, 
            we make it easy to compare and switch.
          </p>
        </div>

        {/* State Grid with Cities */}
        <div className="mb-12">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0A5C8C]" />
            Electricity Rates by State
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {states.map((state) => (
              <div key={state.name} className="border border-gray-200 rounded-lg p-4 hover:border-[#0A5C8C] hover:shadow-sm transition-all">
                <Link to={createPageUrl(state.page)} className="text-[#0A5C8C] font-semibold text-base hover:underline">
                  {state.name} Electricity Rates
                </Link>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {state.cities.map((city) => (
                    <Link
                      key={city}
                      to={createPageUrl("CityRates") + `?city=${encodeURIComponent(city)}&state=${state.name === "New York" ? "NY" : state.name === "New Jersey" ? "NJ" : state.name === "New Hampshire" ? "NH" : state.name === "Rhode Island" ? "RI" : state.name.substring(0, 2).toUpperCase()}`}
                      className="text-xs text-gray-500 hover:text-[#0A5C8C] hover:underline"
                    >
                      {city}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to={createPageUrl("AllStates")} className="text-[#0A5C8C] hover:underline font-medium text-sm">
              View All States &amp; Cities →
            </Link>
          </div>
        </div>

        {/* Service Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Link to={createPageUrl("CompareRates")} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#0A5C8C] hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
              <Zap className="w-5 h-5 text-[#0A5C8C]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Compare Residential Rates</p>
              <p className="text-xs text-gray-500">40+ providers, instant results</p>
            </div>
          </Link>
          <Link to={createPageUrl("BusinessCompareRates")} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#0A5C8C] hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
              <Building className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Business Electricity</p>
              <p className="text-xs text-gray-500">Commercial plans &amp; volume discounts</p>
            </div>
          </Link>
          <Link to={createPageUrl("RenewableCompareRates")} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#0A5C8C] hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Green Energy Plans</p>
              <p className="text-xs text-gray-500">100% renewable wind &amp; solar</p>
            </div>
          </Link>
          <Link to={createPageUrl("BillAnalyzer")} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#0A5C8C] hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
              <TrendingDown className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Bill Analyzer</p>
              <p className="text-xs text-gray-500">Upload your bill, find savings</p>
            </div>
          </Link>
        </div>

        {/* SEO Content Paragraphs */}
        <div className="prose prose-sm max-w-none text-gray-600">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0A5C8C]" />
            How to Compare Electricity Rates and Save Money
          </h3>
          <p className="leading-relaxed">
            Comparing electricity rates is the most effective way to lower your energy bill. In deregulated electricity markets across Texas, Illinois, Ohio, Pennsylvania, New York, New Jersey, Maryland, Massachusetts, Maine, New Hampshire, Rhode Island, and Connecticut, consumers have the power to choose their electricity provider. This competition among providers means you can find rates significantly lower than your current plan.
          </p>
          <p className="leading-relaxed">
            The average American household uses about 10,500 kWh of electricity per year. Even a small difference of 1-2 cents per kWh can translate to savings of $100-$200 annually. By using ElectricScouts to compare plans from providers like TXU Energy, Reliant Energy, Constellation, Direct Energy, and dozens more, you can find the best rate for your usage pattern and preferences.
          </p>
          <p className="leading-relaxed">
            When comparing electricity plans, consider these key factors: the <strong>rate per kWh</strong> (the primary cost driver), <strong>contract length</strong> (longer contracts often offer lower rates), <strong>early termination fees</strong> (important if you may need to switch before the contract ends), <strong>renewable energy percentage</strong> (for environmentally conscious consumers), and <strong>monthly base charges</strong> (fixed fees added to every bill regardless of usage).
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link to={createPageUrl("LearningCenter")} className="inline-flex items-center gap-1 text-[#0A5C8C] hover:underline font-medium text-sm">
              <BookOpen className="w-4 h-4" /> Learning Center
            </Link>
            <Link to={createPageUrl("SavingsCalculator")} className="inline-flex items-center gap-1 text-[#0A5C8C] hover:underline font-medium text-sm">
              <TrendingDown className="w-4 h-4" /> Savings Calculator
            </Link>
            <Link to={createPageUrl("FAQ")} className="inline-flex items-center gap-1 text-[#0A5C8C] hover:underline font-medium text-sm">
              <Shield className="w-4 h-4" /> FAQs
            </Link>
            <Link to={createPageUrl("AllProviders")} className="inline-flex items-center gap-1 text-[#0A5C8C] hover:underline font-medium text-sm">
              <Zap className="w-4 h-4" /> All Providers
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
