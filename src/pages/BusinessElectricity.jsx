import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, TrendingDown, Zap, FileText, CheckCircle, ArrowRight, DollarSign, Clock, Award, AlertCircle, Leaf, ArrowLeft, Filter } from "lucide-react";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import CustomQuoteModal from "../components/business/CustomQuoteModal";
import ValidatedZipInput from "../components/ValidatedZipInput";
import { getCityFromZip, getProvidersForZipCode, providerServesZip } from "../components/compare/providerAvailability";
import { validateZipCode } from "../components/compare/dataValidation";

export default function BusinessElectricity() {
  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [cityName, setCityName] = useState("");
  const [availableProviders, setAvailableProviders] = useState([]);
  const [businessType, setBusinessType] = useState("");
  const [monthlyUsage, setMonthlyUsage] = useState("");
  const [showCustomQuoteModal, setShowCustomQuoteModal] = useState(false);
  const [isZipValid, setIsZipValid] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterRate, setFilterRate] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  // Load ZIP from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const zipFromUrl = urlParams.get('zip');
    
    if (zipFromUrl && zipFromUrl.length === 5) {
      const validation = validateZipCode(zipFromUrl);
      if (validation.valid) {
        setZipCode(zipFromUrl);
        const city = getCityFromZip(zipFromUrl);
        const providers = getProvidersForZipCode(zipFromUrl);
        setCityName(city);
        setAvailableProviders(providers);
        setStep(2);
      }
    }
  }, []);

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
    { value: "small", label: "Small Business", usage: "< 10,000 kWh/month", employees: "1-10", avgUsage: 5000 },
    { value: "medium", label: "Medium Business", usage: "10,000-50,000 kWh/month", employees: "10-100", avgUsage: 25000 },
    { value: "large", label: "Large Commercial", usage: "50,000-200,000 kWh/month", employees: "100-500", avgUsage: 100000 },
    { value: "industrial", label: "Industrial", usage: "> 200,000 kWh/month", employees: "500+", avgUsage: 300000 }
  ];

  const handleZipSubmit = () => {
    if (!zipCode || zipCode.length !== 5) {
      setZipError("Please enter a valid 5-digit ZIP code");
      return;
    }

    const validation = validateZipCode(zipCode);
    if (!validation.valid) {
      setZipError(validation.error || "This ZIP code is not in a deregulated electricity market");
      return;
    }

    const city = getCityFromZip(zipCode);
    const providers = getProvidersForZipCode(zipCode);
    setCityName(city);
    setAvailableProviders(providers);
    setZipError("");
    setStep(2);
  };

  const handleBusinessTypeSubmit = () => {
    if (businessType) {
      setStep(3);
    }
  };

  const handleUsageSubmit = () => {
    if (monthlyUsage) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setShowResults(true);
        setStep(4);
      }, 1500);
    }
  };

  // Filter business-appropriate plans
  const businessPlans = plans.filter(plan => {
    if (zipCode && !providerServesZip(plan.provider_name, zipCode)) return false;
    if (filterProvider !== "all" && plan.provider_name !== filterProvider) return false;
    if (filterRate !== "all") {
      if (filterRate === "low" && plan.rate_per_kwh >= 10) return false;
      if (filterRate === "medium" && (plan.rate_per_kwh < 10 || plan.rate_per_kwh >= 12)) return false;
      if (filterRate === "high" && plan.rate_per_kwh < 12) return false;
    }
    return true;
  });

  const sortedBusinessPlans = [...businessPlans].sort((a, b) => a.rate_per_kwh - b.rate_per_kwh);
  const topBusinessPlans = sortedBusinessPlans.slice(0, 3);
  const otherBusinessPlans = sortedBusinessPlans.slice(3);

  const calculateBusinessBill = (plan) => {
    const usage = parseInt(monthlyUsage) || businessTypes.find(t => t.value === businessType)?.avgUsage || 10000;
    const energyCost = (plan.rate_per_kwh / 100) * usage;
    const totalCost = energyCost + (plan.monthly_base_charge || 0);
    return totalCost.toFixed(2);
  };

  const uniqueProviders = zipCode 
    ? availableProviders.map(p => p.name).sort()
    : [...new Set(plans.map(p => p.provider_name))].sort();

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Business Electricity", url: "/business-electricity" }
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-[#0A5C8C] rounded-full border-t-transparent animate-spin"></div>
            <Building2 className="absolute inset-0 m-auto w-7 h-7 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Finding Business Rates</h2>
          <p className="text-sm text-gray-600">Comparing commercial plans...</p>
        </div>
      </div>
    );
  }

  // Results view
  if (showResults && step === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <SEOHead
          title="Business Electricity Rates - Commercial & Industrial Power Plans | Power Scouts"
          description="Compare business electricity rates for small businesses, large commercial facilities, and industrial operations. Get competitive commercial energy plans."
          keywords="business electricity rates, commercial electricity providers, industrial power rates"
          canonical="/business-electricity"
          structuredData={breadcrumbData}
        />

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl lg:text-2xl font-semibold mb-1">Business Electricity Plans</h1>
                <p className="text-sm text-blue-100">
                  {sortedBusinessPlans.length} commercial plans in {cityName} • {businessTypes.find(t => t.value === businessType)?.label}
                </p>
              </div>
              <Button onClick={() => { setShowResults(false); setStep(1); }} variant="outline" className="bg-white text-[#0A5C8C] hover:bg-gray-100">
                New Search
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top 3 Plans */}
          {topBusinessPlans.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Recommended Business Plans</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {topBusinessPlans.map((plan, index) => (
                  <Card key={plan.id} className="border-2 hover:border-[#FF6B35] transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm">{plan.provider_name}</h3>
                          <p className="text-xs text-gray-600 line-clamp-1">{plan.plan_name}</p>
                        </div>
                        {index === 0 && (
                          <div className="bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded">BEST</div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-3 mb-3 text-center">
                        <div className="text-2xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                        <div className="text-[10px] text-gray-500">per kWh</div>
                      </div>

                      <div className="space-y-1.5 mb-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Est. Monthly:</span>
                          <span className="font-semibold text-gray-900">${calculateBusinessBill(plan)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contract:</span>
                          <span className="font-medium">{plan.contract_length || 'Variable'} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">{plan.plan_type}</span>
                        </div>
                      </div>

                      <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm py-2">
                        Get This Plan
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filters & Other Plans */}
          {otherBusinessPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">More Business Plans</h2>
              
              <Card className="mb-4 border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-[#0A5C8C]" />
                    <span className="text-sm font-semibold">Filter Plans</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Select value={filterRate} onValueChange={setFilterRate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Rate Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rates</SelectItem>
                        <SelectItem value="low">Low (&lt;10¢)</SelectItem>
                        <SelectItem value="medium">Medium (10-12¢)</SelectItem>
                        <SelectItem value="high">High (&gt;12¢)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterProvider} onValueChange={setFilterProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Providers</SelectItem>
                        {uniqueProviders.map(provider => (
                          <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {otherBusinessPlans.map((plan) => (
                  <Card key={plan.id} className="border hover:border-[#0A5C8C] transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm">{plan.provider_name}</h3>
                          <p className="text-xs text-gray-600">{plan.plan_name}</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                          <div className="text-[10px] text-gray-500">per kWh</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-semibold text-gray-900">${calculateBusinessBill(plan)}</div>
                          <div className="text-[10px] text-gray-500">est. monthly</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{plan.contract_length || 'Var'} mo</div>
                          <div className="text-[10px] text-gray-500 capitalize">{plan.plan_type}</div>
                        </div>
                        <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm px-4 py-2">
                          View Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {sortedBusinessPlans.length === 0 && (
            <Card className="border-2">
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Business Plans Found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or request a custom quote.</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setShowResults(false); setStep(1); }} variant="outline">
                    New Search
                  </Button>
                  <Button onClick={() => setShowCustomQuoteModal(true)} className="bg-[#FF6B35] hover:bg-[#e55a2b]">
                    Request Custom Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Quote CTA */}
          <Card className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
            <CardContent className="p-6 text-center">
              <h3 className="font-bold text-gray-900 mb-2">Need a Custom Quote?</h3>
              <p className="text-sm text-gray-600 mb-4">
                For large commercial or industrial accounts, get personalized pricing and dedicated account management.
              </p>
              <Button onClick={() => setShowCustomQuoteModal(true)} variant="outline" className="border-[#FF6B35] text-[#FF6B35] hover:bg-orange-50">
                Request Custom Quote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Business Electricity Rates - Commercial & Industrial Power Plans | Power Scouts"
        description="Compare business electricity rates for small businesses, large commercial facilities, and industrial operations across 12 states. Get custom quotes for tiered pricing, demand charges, and load management. Save up to $5,000+ annually on commercial energy costs with competitive business electricity plans."
        keywords="business electricity rates, commercial electricity providers, industrial power rates, small business energy plans, commercial electric rates, demand charges, tiered pricing, business energy comparison, industrial electricity rates, commercial power companies"
        canonical="/business-electricity"
        structuredData={breadcrumbData}
      />

      {/* Progress Bar */}
      {step > 1 && step < 4 && (
        <div className="bg-white border-b border-orange-200 py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: "ZIP Code" },
                { num: 2, label: "Business Type" },
                { num: 3, label: "Usage" }
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= s.num ? 'bg-[#FF6B35] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${
                      step >= s.num ? 'text-[#FF6B35]' : 'text-gray-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && <div className={`flex-1 h-1 mx-2 ${step > s.num ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 1: ZIP Code */}
      {step === 1 && (
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">
                Compare Business Electricity Rates
              </h1>
              <p className="text-xl text-blue-100">
                Find competitive commercial electricity plans for your business
              </p>
            </div>

            <Card className="border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-[#FF6B35]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Enter Your Business ZIP Code</h2>
                    <p className="text-sm text-gray-600">To see available commercial plans</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-14 px-4 py-3 border-2 rounded-xl bg-white border-orange-200 focus-within:border-[#FF6B35]">
                    <ValidatedZipInput
                      value={zipCode}
                      onChange={setZipCode}
                      placeholder="Enter ZIP code"
                      className="text-xl"
                      onValidationChange={setIsZipValid}
                    />
                  </div>

                  {zipError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{zipError}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleZipSubmit}
                    disabled={!isZipValid}
                    className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-14 text-base font-semibold rounded-xl"
                  >
                    Find Business Rates
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold mb-1">$5K+</div>
                <div className="text-sm text-blue-100">Avg. Savings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold mb-1">40+</div>
                <div className="text-sm text-blue-100">Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold mb-1">12</div>
                <div className="text-sm text-blue-100">States</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold mb-1">24/7</div>
                <div className="text-sm text-blue-100">Support</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Business Type */}
      {step === 2 && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Select Your Business Type
            </h1>
            <p className="text-gray-600">Comparing plans in <span className="font-semibold text-[#FF6B35]">{cityName}</span></p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {businessTypes.map((type) => (
              <Card
                key={type.value}
                onClick={() => setBusinessType(type.value)}
                className={`cursor-pointer transition-all border-2 ${
                  businessType === type.value
                    ? "border-[#FF6B35] bg-orange-50 shadow-lg"
                    : "border-gray-200 hover:border-orange-300"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      businessType === type.value ? "bg-[#FF6B35]" : "bg-gray-100"
                    }`}>
                      <Building2 className={`w-6 h-6 ${businessType === type.value ? "text-white" : "text-gray-600"}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{type.label}</h3>
                      <p className="text-sm text-gray-600 mb-2">{type.usage}</p>
                      <p className="text-xs text-gray-500">{type.employees} employees</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={() => setStep(1)} variant="outline" className="h-11">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleBusinessTypeSubmit}
              className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-11 px-8"
              disabled={!businessType}
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Usage */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Average Monthly Usage
            </h1>
            <p className="text-gray-600">Enter your approximate monthly kWh usage</p>
          </div>

          <Card className="border-2 border-orange-200 max-w-lg mx-auto">
            <CardContent className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Monthly Usage (kWh)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 15000"
                  value={monthlyUsage}
                  onChange={(e) => setMonthlyUsage(e.target.value.replace(/\D/g, ''))}
                  className="h-14 text-xl text-center font-semibold"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Average: {businessTypes.find(t => t.value === businessType)?.avgUsage.toLocaleString()} kWh/month for {businessTypes.find(t => t.value === businessType)?.label}
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-11">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleUsageSubmit}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-11"
                  disabled={!monthlyUsage}
                >
                  View Plans
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 max-w-lg mx-auto bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-gray-700">
                <strong>Need exact pricing?</strong> You can request a custom quote after viewing plans.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
          
          <a href="#business-quote-form">
            <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold px-10 py-4 text-lg rounded-lg">
              Get Business Quotes
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>

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