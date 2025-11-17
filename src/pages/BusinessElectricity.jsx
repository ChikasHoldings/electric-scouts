import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Building2, TrendingDown, Zap, FileText, CheckCircle, ArrowRight, DollarSign, Clock, Award, AlertCircle } from "lucide-react";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";

export default function BusinessElectricity() {
  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [businessInfo, setBusinessInfo] = useState({
    businessType: "",
    industryType: "",
    monthlyUsage: "",
    peakDemand: "",
    numberOfLocations: "1",
    energyGoals: [],
    currentProvider: "",
    contractEndDate: ""
  });
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const industryTypes = [
    "Retail", "Restaurant/Food Service", "Office/Professional Services", "Healthcare/Medical",
    "Manufacturing", "Warehouse/Distribution", "Hospitality/Hotel", "Education",
    "Technology/Data Center", "Real Estate/Property Management", "Agriculture", "Other"
  ];

  const energyGoalOptions = [
    { value: "cost", label: "Reduce Energy Costs", icon: DollarSign },
    { value: "sustainability", label: "Sustainability/Green Energy", icon: Leaf },
    { value: "predictability", label: "Budget Predictability", icon: Clock },
    { value: "demand", label: "Manage Peak Demand", icon: Zap }
  ];

  const handleZipSubmit = () => {
    if (zipCode.length === 5) {
      setStep(2);
    }
  };

  const handleBusinessInfoSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 2000);
  };

  const toggleEnergyGoal = (goal) => {
    setBusinessInfo(prev => ({
      ...prev,
      energyGoals: prev.energyGoals.includes(goal)
        ? prev.energyGoals.filter(g => g !== goal)
        : [...prev.energyGoals, goal]
    }));
  };

  // Filter and sort plans based on business profile
  const getRecommendedPlans = () => {
    let filtered = [...plans];
    
    // Basic filtering (would be more sophisticated in production)
    if (businessInfo.energyGoals.includes('sustainability')) {
      filtered = filtered.filter(p => p.renewable_percentage >= 50);
    }
    
    return filtered.sort((a, b) => a.rate_per_kwh - b.rate_per_kwh).slice(0, 6);
  };

  const calculateBusinessBill = (plan) => {
    const usage = parseInt(businessInfo.monthlyUsage) || 10000;
    const baseCharge = plan.monthly_base_charge || 0;
    const energyCharge = (plan.rate_per_kwh / 100) * usage;
    return Math.round(baseCharge + energyCharge);
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Business Electricity", url: "/business-electricity" }
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#0A5C8C] rounded-full border-t-transparent animate-spin"></div>
            <Building2 className="absolute inset-0 m-auto w-10 h-10 text-[#FF6B35]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Business Needs</h2>
          <p className="text-gray-600">Finding the best commercial rates for your business...</p>
        </div>
      </div>
    );
  }

  // Results page
  if (showResults) {
    const recommendedPlans = getRecommendedPlans();
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <SEOHead
          title="Business Electricity Rates - Commercial & Industrial Power Plans | Power Scouts"
          description="Compare business electricity rates for small businesses, large commercial facilities, and industrial operations across 12 states."
          keywords="business electricity rates, commercial electricity providers"
          canonical="/business-electricity"
          structuredData={breadcrumbData}
        />

        {/* Results Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-6 h-6 text-yellow-400" />
              <h1 className="text-2xl sm:text-3xl font-bold">Your Business Energy Solutions</h1>
            </div>
            <p className="text-center text-sm text-blue-100">
              {recommendedPlans.length} plans recommended for {businessInfo.industryType} in ZIP {zipCode}
            </p>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <span className="bg-white/10 px-3 py-1 rounded-full">Est. Usage: {parseInt(businessInfo.monthlyUsage).toLocaleString()} kWh/mo</span>
              <span className="bg-white/10 px-3 py-1 rounded-full">{businessInfo.numberOfLocations} Location(s)</span>
              {businessInfo.energyGoals.includes('sustainability') && (
                <span className="bg-green-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                  <Leaf className="w-3 h-3" />
                  Green Energy Priority
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Business Profile Summary */}
          <Card className="border-2 mb-8 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Business Profile</h2>
                <Button variant="outline" size="sm" onClick={() => setShowResults(false)}>
                  Edit Details
                </Button>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Industry</div>
                  <div className="font-semibold text-gray-900">{businessInfo.industryType}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Business Size</div>
                  <div className="font-semibold text-gray-900 capitalize">{businessInfo.businessType}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Monthly Usage</div>
                  <div className="font-semibold text-gray-900">{parseInt(businessInfo.monthlyUsage).toLocaleString()} kWh</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Peak Demand</div>
                  <div className="font-semibold text-gray-900">{businessInfo.peakDemand} kW</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Plans */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Business Plans</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedPlans.map((plan, index) => (
                <Card key={plan.id} className="border-2 hover:border-[#FF6B35] transition-all hover:shadow-xl">
                  <CardContent className="p-6">
                    {index < 3 && (
                      <div className="mb-3">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                          Top {index + 1} Match
                        </span>
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 mb-1">{plan.provider_name}</h3>
                    <p className="text-xs text-gray-600 mb-4">{plan.plan_name}</p>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 mb-4">
                      <div className="text-3xl font-bold text-[#0A5C8C] mb-1">{plan.rate_per_kwh}¢</div>
                      <div className="text-xs text-gray-600">per kWh</div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-sm text-gray-700">Est. Monthly Bill</div>
                        <div className="text-2xl font-bold text-gray-900">${calculateBusinessBill(plan)}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contract:</span>
                        <span className="font-semibold">{plan.contract_length || 'Flexible'} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold capitalize">{plan.plan_type}</span>
                      </div>
                      {plan.renewable_percentage > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Renewable:</span>
                          <span className="font-semibold text-green-600 flex items-center gap-1">
                            <Leaf className="w-3 h-3" />
                            {plan.renewable_percentage}%
                          </span>
                        </div>
                      )}
                    </div>

                    <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                      Get Quote
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Quote CTA */}
          <Card className="border-2 bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-3">Need a Custom Solution?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                For complex energy needs, multiple locations, or usage over 200,000 kWh/month, our energy consultants can negotiate custom rates on your behalf.
              </p>
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold px-8 py-4 text-lg">
                Request Custom Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="mt-4 text-xs text-blue-200">
                Free consultation • No obligation • 24-48 hour response
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 1: ZIP Code
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 pt-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Business Electricity Comparison
            </h1>
            <p className="text-gray-600 text-lg">Enter your business ZIP code to get started</p>
          </div>

          <Card className="shadow-2xl border-2 max-w-lg mx-auto">
            <CardContent className="p-8">
              <div className="mb-7">
                <Input
                  type="text"
                  placeholder="Enter Business ZIP Code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={5}
                  inputMode="numeric"
                  className="h-16 text-center text-3xl font-bold tracking-widest border-2 focus:border-[#0A5C8C] rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleZipSubmit()}
                />
              </div>

              <Button 
                onClick={handleZipSubmit}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] hover:from-[#e55a2b] hover:to-[#cc4a1f] text-white h-16 text-xl font-bold rounded-xl shadow-lg"
                disabled={zipCode.length !== 5}
              >
                Continue
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Detailed Business Information
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 pt-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Tell Us About Your Business
            </h1>
            <p className="text-gray-600 text-lg">Help us find the perfect energy solution for your needs</p>
          </div>

          <Card className="shadow-2xl border-2">
            <CardContent className="p-8 space-y-6">
              {/* Business Size */}
              <div>
                <label className="text-sm font-bold text-gray-900 mb-3 block">Business Size</label>
                <div className="grid md:grid-cols-2 gap-3">
                  {businessTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => setBusinessInfo(prev => ({ ...prev, businessType: type.value }))}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        businessInfo.businessType === type.value
                          ? 'border-[#0A5C8C] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900 mb-1">{type.label}</div>
                      <div className="text-xs text-gray-600">{type.usage}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Industry Type */}
              <div>
                <label className="text-sm font-bold text-gray-900 mb-2 block">Industry Type</label>
                <Select value={businessInfo.industryType} onValueChange={(val) => setBusinessInfo(prev => ({ ...prev, industryType: val }))}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryTypes.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Usage & Demand */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-900 mb-2 block">Average Monthly Usage (kWh)</label>
                  <Input
                    type="text"
                    placeholder="e.g., 15000"
                    value={businessInfo.monthlyUsage}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, monthlyUsage: e.target.value.replace(/\D/g, '') }))}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-900 mb-2 block">Peak Demand (kW)</label>
                  <Input
                    type="text"
                    placeholder="e.g., 50"
                    value={businessInfo.peakDemand}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, peakDemand: e.target.value.replace(/\D/g, '') }))}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Number of Locations */}
              <div>
                <label className="text-sm font-bold text-gray-900 mb-2 block">Number of Locations</label>
                <Select value={businessInfo.numberOfLocations} onValueChange={(val) => setBusinessInfo(prev => ({ ...prev, numberOfLocations: val }))}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Location</SelectItem>
                    <SelectItem value="2-5">2-5 Locations</SelectItem>
                    <SelectItem value="6-10">6-10 Locations</SelectItem>
                    <SelectItem value="10+">10+ Locations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Energy Goals */}
              <div>
                <label className="text-sm font-bold text-gray-900 mb-3 block">Energy Goals (Select all that apply)</label>
                <div className="grid md:grid-cols-2 gap-3">
                  {energyGoalOptions.map((goal) => (
                    <div
                      key={goal.value}
                      onClick={() => toggleEnergyGoal(goal.value)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        businessInfo.energyGoals.includes(goal.value)
                          ? 'border-[#0A5C8C] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <goal.icon className="w-5 h-5 text-[#0A5C8C]" />
                        <span className="font-semibold text-gray-900 text-sm">{goal.label}</span>
                        {businessInfo.energyGoals.includes(goal.value) && (
                          <CheckCircle className="w-4 h-4 text-[#0A5C8C] ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Provider (Optional) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-900 mb-2 block">Current Provider (Optional)</label>
                  <Input
                    type="text"
                    placeholder="e.g., TXU Energy"
                    value={businessInfo.currentProvider}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, currentProvider: e.target.value }))}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-900 mb-2 block">Contract End Date (Optional)</label>
                  <Input
                    type="date"
                    value={businessInfo.contractEndDate}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, contractEndDate: e.target.value }))}
                    className="h-12"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleBusinessInfoSubmit}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] hover:from-[#e55a2b] hover:to-[#cc4a1f] text-white h-16 text-xl font-bold rounded-xl shadow-lg"
                disabled={!businessInfo.businessType || !businessInfo.industryType || !businessInfo.monthlyUsage}
              >
                Find Business Plans
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>

              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Free Comparison</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>No Obligation</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Custom Quotes Available</span>
                </div>
              </div>
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

            {/* Quick Start CTA */}
            <Card className="border-0 shadow-2xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Get Started in 2 Minutes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Answer a few quick questions about your business and we'll show you personalized rate comparisons instantly.
                </p>
                <Button 
                  onClick={() => setStep(1)}
                  className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold py-3 rounded-lg"
                >
                  Start Business Comparison
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Free</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>No Obligation</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Instant Results</span>
                  </div>
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
                      <Link to={createPageUrl("CompareRates") + `?state=${state.code}&type=business`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          View Plans
                        </Button>
                      </Link>
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
          
          <Link to={createPageUrl("CompareRates") + "?type=business"}>
            <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold px-10 py-4 text-lg rounded-lg">
              Get Business Quotes Now
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
    </div>
  );
}