import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, TrendingDown, Zap, FileText, CheckCircle, ArrowRight, DollarSign, Clock, Award, AlertCircle, Leaf } from "lucide-react";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import CustomQuoteModal from "../components/business/CustomQuoteModal";
import ValidatedZipInput from "../components/ValidatedZipInput";
import { ServiceSchema, FAQPageSchema } from "../components/seo/StructuredData";

export default function BusinessElectricity() {
  const [zipCode, setZipCode] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [monthlyUsage, setMonthlyUsage] = useState("");
  const [showCustomQuoteModal, setShowCustomQuoteModal] = useState(false);
  const [isZipValid, setIsZipValid] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  const states = [
    { code: "TX", name: "Texas", avgRate: "8.5¢/kWh", demandCharges: "Yes", specialPrograms: "Large Commercial Rebates" },
    { code: "IL", name: "Illinois", avgRate: "9.2¢/kWh", demandCharges: "Yes", specialPrograms: "Energy Efficiency Incentives" },
    { code: "OH", name: "Ohio", avgRate: "8.8¢/kWh", demandCharges: "Yes", specialPrograms: "Industrial Rate Schedules" },
    { code: "PA", name: "Pennsylvania", avgRate: "9.4¢/kWh", demandCharges: "Yes", specialPrograms: "Commercial Load Management" },
    { code: "NY", name: "New York", avgRate: "11.2¢/kWh", demandCharges: "Yes", specialPrograms: "NYSERDA Programs" },
    { code: "NJ", name: "New Jersey", avgRate: "10.1¢/kWh", demandCharges: "Yes", specialPrograms: "Peak Load Pricing" },
    { code: "MD", name: "Maryland", avgRate: "9.8¢/kWh", demandCharges: "Yes", specialPrograms: "EmPOWER Maryland" },
    { code: "MA", name: "Massachusetts", avgRate: "11.8¢/kWh", demandCharges: "Yes", specialPrograms: "Mass Save Business" },
    { code: "ME", name: "Maine", avgRate: "10.2¢/kWh", demandCharges: "Limited", specialPrograms: "Business Efficiency Programs" },
    { code: "NH", name: "New Hampshire", avgRate: "11.0¢/kWh", demandCharges: "Limited", specialPrograms: "NHSaves Commercial" },
    { code: "RI", name: "Rhode Island", avgRate: "11.9¢/kWh", demandCharges: "Yes", specialPrograms: "Commercial & Industrial Programs" },
    { code: "CT", name: "Connecticut", avgRate: "11.5¢/kWh", demandCharges: "Yes", specialPrograms: "Energize CT Business" }
  ];

  const businessTypes = [
    { value: "small", label: "Small Business", usage: "< 10,000 kWh/month", employees: "1-10" },
    { value: "medium", label: "Medium Business", usage: "10,000-50,000 kWh/month", employees: "10-100" },
    { value: "large", label: "Large Commercial", usage: "50,000-200,000 kWh/month", employees: "100-500" },
    { value: "industrial", label: "Industrial", usage: "> 200,000 kWh/month", employees: "500+" }
  ];

  const handleBusinessQuoteSubmit = () => {
    if (zipCode && businessType && monthlyUsage) {
      // Open custom quote modal for business customers
      setShowCustomQuoteModal(true);
    }
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Business Electricity", url: "/business-electricity" }
  ]);

  const businessFAQs = [
    {
      question: "What's the difference between business and residential rates?",
      answer: "Business rates include demand charges, have different rate structures based on usage levels, offer longer contract terms, and may include time-of-use pricing. Commercial customers also get access to load management programs and custom pricing for high usage."
    },
    {
      question: "How are demand charges calculated?",
      answer: "Demand charges are based on your peak power draw (measured in kW) during any 15-minute interval in the billing period. If you have a 100 kW peak and the demand charge is $10/kW, you'll pay $1,000 in demand charges that month, separate from energy usage charges."
    },
    {
      question: "Can small businesses get competitive rates?",
      answer: "Yes! Small businesses using as little as 2,000-5,000 kWh/month can access competitive rates. While you may not qualify for demand-based pricing, fixed-rate plans and group purchasing programs can deliver 15-30% savings vs. utility default rates."
    },
    {
      question: "Should I choose a fixed or variable rate plan?",
      answer: "Most businesses prefer fixed-rate plans for budget predictability. Variable rates can work if you have flexible operations and can adjust usage based on market prices, but they carry risk during price spikes. Industrial users sometimes blend both strategies."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <ServiceSchema 
        service={{
          type: "Business Electricity Rate Comparison",
          description: "Compare commercial and industrial electricity rates from 40+ providers. Get custom quotes for tiered pricing, demand charges, and load management."
        }}
      />
      <FAQPageSchema faqs={businessFAQs} />
      
      <SEOHead
        title="Business Electricity Rates - Commercial & Industrial Power Plans | Power Scouts"
        description="Compare business electricity rates for small businesses, large commercial facilities, and industrial operations across 12 states. Get custom quotes for tiered pricing, demand charges, and load management. Save up to $5,000+ annually on commercial energy costs with competitive business electricity plans."
        keywords="business electricity rates, commercial electricity providers, industrial power rates, small business energy plans, commercial electric rates, demand charges, tiered pricing, business energy comparison, industrial electricity rates, commercial power companies"
        canonical="/business-electricity"
        structuredData={breadcrumbData}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Business Electricity Rates
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Commercial and industrial electricity plans tailored for your business needs. Compare rates, understand demand charges, and optimize your energy costs.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">$5K+</div>
                <div className="text-sm text-blue-100">Avg. Annual Savings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">40+</div>
                <div className="text-sm text-blue-100">Business Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">12</div>
                <div className="text-sm text-blue-100">States Served</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">24/7</div>
                <div className="text-sm text-blue-100">Support Available</div>
              </div>
            </div>

            {/* Business Quote Form */}
            <Card id="business-quote-form" className="border-0 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Get Custom Business Quotes</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">ZIP Code</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <ValidatedZipInput
                        value={zipCode}
                        onChange={setZipCode}
                        placeholder="Business ZIP"
                        onValidationChange={setIsZipValid}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Business Type</label>
                    <Select value={businessType} onValueChange={setBusinessType}>
                      <SelectTrigger className="bg-gray-50">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} - {type.usage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Monthly Usage (kWh)</label>
                  <Input
                    type="text"
                    placeholder="e.g., 15000"
                    value={monthlyUsage}
                    onChange={(e) => setMonthlyUsage(e.target.value.replace(/\D/g, ''))}
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-3">
                  <Link to={createPageUrl("BusinessCompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button 
                      disabled={!isZipValid}
                      className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white font-bold py-3 rounded-lg"
                    >
                      Compare Business Rates
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleBusinessQuoteSubmit}
                    disabled={!isZipValid || !businessType || !monthlyUsage}
                    variant="outline"
                    className="w-full border-2 font-bold py-3 rounded-lg"
                  >
                    Request Custom Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Understanding Business Electricity */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Understanding Business Electricity Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Tiered Pricing</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Business electricity rates often include tiered pricing based on consumption levels. Higher usage typically results in lower per-kWh rates, benefiting larger operations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Demand Charges</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Many commercial plans include demand charges based on your peak power usage during billing periods. Managing peak demand can significantly reduce costs.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Time-of-Use Rates</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Business plans may offer time-of-use pricing with different rates for on-peak, off-peak, and shoulder periods. Shift usage to save.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Business Size Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Plans by Business Size
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {businessTypes.map((type, index) => (
              <Card key={index} className="border-2 hover:border-[#0A5C8C] transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{type.label}</h3>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Usage:</span> {type.usage}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Typical Size:</span> {type.employees} employees
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Fixed Rates Available</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Custom Terms</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* State-Specific Business Regulations */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Business Energy by State
          </h2>
          <p className="text-gray-600 mb-6">
            Each state has unique regulations, demand charge structures, and incentive programs for commercial customers.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full bg-white border-2 rounded-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">State</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Avg. Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Demand Charges</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Special Programs</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {states.map((state, index) => (
                  <tr key={index} className="border-t hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{state.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-[#0A5C8C]">{state.avgRate}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{state.demandCharges}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{state.specialPrograms}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a href="#business-quote-form">
                        <Button size="sm" variant="outline" className="text-xs">
                          Get Quote
                        </Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Key Considerations for Businesses */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Key Considerations for Business Electricity
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Demand Charge Management</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      Demand charges are based on your highest 15-minute usage interval during the billing period. Reduce peak demand by:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Staggering equipment start-up times</li>
                      <li>• Shifting non-critical operations to off-peak</li>
                      <li>• Installing demand response systems</li>
                      <li>• Using energy storage for peak shaving</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Contract Considerations</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      Business electricity contracts differ from residential:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Longer terms (1-5 years) often get better rates</li>
                      <li>• Custom pricing for large users (500+ kW)</li>
                      <li>• Early termination fees can be substantial</li>
                      <li>• Load factor requirements in some agreements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-purple-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <TrendingDown className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Energy Efficiency Incentives</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      Many states offer commercial incentives:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• LED lighting upgrade rebates</li>
                      <li>• HVAC system efficiency incentives</li>
                      <li>• Energy audits (often free)</li>
                      <li>• Demand response program payments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-orange-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Award className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Renewable Energy Options</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                      Business renewable energy solutions:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 100% renewable electricity plans</li>
                      <li>• Virtual Power Purchase Agreements (VPPAs)</li>
                      <li>• On-site solar + battery storage</li>
                      <li>• Renewable Energy Credits (RECs)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Business FAQs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Business Electricity FAQs
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-2">
              <CardContent className="p-5">
                <h3 className="font-bold text-gray-900 mb-2">What's the difference between business and residential rates?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Business rates include demand charges, have different rate structures based on usage levels, offer longer contract terms, and may include time-of-use pricing. Commercial customers also get access to load management programs and custom pricing for high usage.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-5">
                <h3 className="font-bold text-gray-900 mb-2">How are demand charges calculated?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Demand charges are based on your peak power draw (measured in kW) during any 15-minute interval in the billing period. If you have a 100 kW peak and the demand charge is $10/kW, you'll pay $1,000 in demand charges that month, separate from energy usage charges.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-5">
                <h3 className="font-bold text-gray-900 mb-2">Can small businesses get competitive rates?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Yes! Small businesses using as little as 2,000-5,000 kWh/month can access competitive rates. While you may not qualify for demand-based pricing, fixed-rate plans and group purchasing programs can deliver 15-30% savings vs. utility default rates.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-5">
                <h3 className="font-bold text-gray-900 mb-2">Should I choose a fixed or variable rate plan?</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Most businesses prefer fixed-rate plans for budget predictability. Variable rates can work if you have flexible operations and can adjust usage based on market prices, but they carry risk during price spikes. Industrial users sometimes blend both strategies.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl lg:text-3xl font-bold mb-3">
            Ready to Reduce Your Business Energy Costs?
          </h2>
          <p className="text-base text-blue-100 mb-6 max-w-2xl mx-auto">
            Get custom quotes from commercial electricity providers. Save thousands annually with the right business energy plan.
          </p>
          
          <Link to={createPageUrl("BusinessCompareRates")}>
            <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold px-10 py-4 text-lg rounded-lg">
              Get Business Quotes
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-5 flex-wrap text-xs mt-6">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Custom Pricing</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Free Consultation</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>No Obligation</span>
            </div>
          </div>
        </section>
      </div>

      {showCustomQuoteModal && (
        <CustomQuoteModal 
          onClose={() => setShowCustomQuoteModal(false)}
          initialData={{ zipCode, businessType, monthlyUsage }}
        />
      )}
    </div>
  );
}