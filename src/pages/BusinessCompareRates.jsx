import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ElectricityPlan } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft, Zap, CheckCircle, Building, TrendingDown, Shield, Award } from "lucide-react";
import ValidatedZipInput from "../components/ValidatedZipInput";
import { getCityFromZip, getProvidersForZipCode } from "../components/compare/providerAvailability";
import { validateZipCode } from "../components/compare/stateData";
import PlanCard from "../components/compare/PlanCard";
import BillUploadStep from "../components/compare/BillUploadStep";
import IneligibleZipMessage from "../components/compare/IneligibleZipMessage";
import SEOHead from "../components/SEOHead";

export default function BusinessCompareRates() {
  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [cityName, setCityName] = useState("");
  const [availableProviders, setAvailableProviders] = useState([]);
  const [businessType, setBusinessType] = useState("");
  const [monthlyUsage, setMonthlyUsage] = useState("5000");
  const [contractLength, setContractLength] = useState("");
  const [planType, setPlanType] = useState("");
  const [isZipValid, setIsZipValid] = useState(false);
  const [sortBy, setSortBy] = useState("rate");
  const [billData, setBillData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => ElectricityPlan.list(),
    initialData: [],
  });

  // Load ZIP code from URL on mount
  useEffect(() => {
    const loadZipData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const zipFromUrl = urlParams.get('zip');
      
      if (zipFromUrl && zipFromUrl.length === 5) {
        const validation = validateZipCode(zipFromUrl);
        if (validation.valid) {
          setZipCode(zipFromUrl);
          setIsZipValid(true);
          const city = getCityFromZip(zipFromUrl);
          const providers = await getProvidersForZipCode(zipFromUrl);
          setCityName(city || validation.state?.name || "your area");
          setAvailableProviders(providers);
          localStorage.setItem('businessRatesZip', zipFromUrl);
          setStep(2);
        } else {
          setZipCode(zipFromUrl);
          setZipError(validation.error || "This ZIP code is not in a deregulated electricity market");
          setStep(1);
        }
      }
    };
    
    loadZipData();
  }, []);

  const handleZipSubmit = async () => {
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
    const providers = await getProvidersForZipCode(zipCode);
    setCityName(city || validation.state?.name || "your area");
    setAvailableProviders(providers);
    setZipError("");
    localStorage.setItem('businessRatesZip', zipCode);
    setStep(2);
  };

  const handleBusinessTypeSubmit = () => {
    if (businessType) {
      setStep(2.5);
    }
  };

  const handleBillAnalysis = (data) => {
    setBillData(data);
    if (data.monthly_usage_kwh) {
      setMonthlyUsage(data.monthly_usage_kwh.toString());
    }
    setStep(3);
  };

  const handleSkipBillUpload = () => {
    setStep(3);
  };

  const handlePreferencesSubmit = () => {
    setIsAnalyzing(true);
    // Simulate partner analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setStep(4);
    }, 3000);
  };

  // Filter plans for business (higher usage tiers)
  const businessPlans = allPlans.filter(plan => {
    // Extract data - handle both direct and nested data structures
    const planData = plan.data || plan;
    const providerName = planData.provider_name || plan.provider_name;
    const planContractLength = planData.contract_length || plan.contract_length;
    const planPlanType = planData.plan_type || plan.plan_type;
    
    // Filter by ZIP code availability
    if (zipCode && availableProviders.length > 0) {
      const provider = availableProviders.find(p => p.name === providerName);
      if (!provider) {
        return false;
      }
    }
    
    const matchesContract = !contractLength || planContractLength?.toString() === contractLength;
    const matchesPlanType = !planType || planPlanType === planType;
    return matchesContract && matchesPlanType;
  });

  // Sort plans
  const sortedPlans = [...businessPlans].sort((a, b) => {
    if (sortBy === "rate") return a.rate_per_kwh - b.rate_per_kwh;
    if (sortBy === "contract") return a.contract_length - b.contract_length;
    if (sortBy === "renewable") return b.renewable_percentage - a.renewable_percentage;
    return 0;
  });

  const topRecommendations = sortedPlans.slice(0, 3);
  const otherPlans = sortedPlans.slice(3);

  const calculateMonthlyCost = (plan) => {
    const usage = parseInt(monthlyUsage) || 5000;
    const energyCost = (plan.rate_per_kwh / 100) * usage;
    const totalCost = energyCost + (plan.monthly_base_charge || 0);
    return totalCost.toFixed(2);
  };

  const businessTypes = [
    { value: "small", label: "Small Business", usage: "2,500 - 5,000 kWh/mo", icon: Building },
    { value: "medium", label: "Medium Business", usage: "5,000 - 15,000 kWh/mo", icon: Building },
    { value: "large", label: "Large Business", usage: "15,000+ kWh/mo", icon: Building }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <SEOHead
        title="Compare Business Electricity Rates - Commercial Energy Plans | ElectricScouts"
        description="Find the best electricity rates for your business. Compare commercial energy plans from 40+ providers. Fixed rates, volume discounts, and dedicated business support."
        keywords="business electricity rates, commercial energy plans, business energy comparison, commercial electricity"
        canonical="/business-compare-rates"
      />

      {/* Progress Bar */}
      {step > 1 && step < 4 && (
        <div className="bg-white border-b border-blue-200 py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: "ZIP Code", icon: Zap },
                { num: 2, label: "Business Type", icon: Building },
                { num: 3, label: "Preferences", icon: TrendingDown }
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= s.num ? 'bg-[#0A5C8C] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${
                      step >= s.num ? 'text-[#0A5C8C]' : 'text-gray-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && <div className={`flex-1 h-1 mx-2 ${step > s.num ? 'bg-[#0A5C8C]' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="space-y-6">
            <div className="text-center py-16">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#0A5C8C] rounded-full border-t-transparent animate-spin"></div>
                <Building className="absolute inset-0 m-auto w-10 h-10 text-[#0A5C8C]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Analyzing Your Business Profile
              </h2>
              <p className="text-gray-600 mb-8">
                Checking with our network of verified energy partners...
              </p>
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4 animate-pulse">
                  <CheckCircle className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                  <p className="text-sm text-gray-700 text-left">Matching your usage profile</p>
                </div>
                <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4 animate-pulse" style={{ animationDelay: '0.2s' }}>
                  <CheckCircle className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                  <p className="text-sm text-gray-700 text-left">Reviewing contract options</p>
                </div>
                <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-4 animate-pulse" style={{ animationDelay: '0.4s' }}>
                  <CheckCircle className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                  <p className="text-sm text-gray-700 text-left">Calculating savings opportunities</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: ZIP Code */}
        {!isAnalyzing && step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
                <Building className="w-4 h-4" />
                <span className="text-sm font-semibold">Business Electricity</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                Compare Business Electricity Rates
              </h1>
              <p className="text-lg text-gray-600">
                Find competitive commercial energy plans for your business
              </p>
            </div>

            <Card className="border-2 border-blue-200 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#0A5C8C]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Enter Your ZIP Code</h2>
                    <p className="text-sm text-gray-600">To see available business plans in your area</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-14 px-4 py-3 border-2 rounded-xl bg-white border-blue-200 focus-within:border-blue-500">
                    <ValidatedZipInput
                      value={zipCode}
                      onChange={setZipCode}
                      placeholder="Enter your ZIP code"
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
                    className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white h-14 text-base font-semibold rounded-xl"
                  >
                    Find Business Rates
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <Shield className="w-8 h-8 text-[#0A5C8C] mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Price Protection</p>
                    <p className="text-sm text-gray-600">Fixed-rate contracts available</p>
                  </div>
                  <div>
                    <TrendingDown className="w-8 h-8 text-[#0A5C8C] mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Volume Discounts</p>
                    <p className="text-sm text-gray-600">Lower rates for higher usage</p>
                  </div>
                  <div>
                    <Award className="w-8 h-8 text-[#0A5C8C] mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Business Support</p>
                    <p className="text-sm text-gray-600">Dedicated account managers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Business Type */}
        {!isAnalyzing && step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Select Your Business Size
              </h1>
              <p className="text-gray-600">Comparing business plans in <span className="font-semibold text-[#0A5C8C]">{cityName}</span></p>
            </div>

            <div className="space-y-4">
              {businessTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.value}
                    onClick={() => setBusinessType(type.value)}
                    className={`cursor-pointer transition-all border-2 ${
                      businessType === type.value
                        ? "border-[#0A5C8C] bg-blue-50 shadow-lg"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                        businessType === type.value ? "bg-[#0A5C8C]" : "bg-gray-100"
                      }`}>
                        <Icon className={`w-8 h-8 ${businessType === type.value ? "text-white" : "text-gray-600"}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{type.label}</h3>
                        <p className="text-sm text-gray-600">{type.usage}</p>
                      </div>
                      {businessType === type.value && (
                        <CheckCircle className="w-6 h-6 text-[#0A5C8C]" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-center gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="h-11">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleBusinessTypeSubmit}
                className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white h-11 px-8"
                disabled={!businessType}
              >
                Continue to Preferences
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2.5: Bill Upload (Optional) */}
        {!isAnalyzing && step === 2.5 && (
          <BillUploadStep
            onSkip={handleSkipBillUpload}
            onAnalysisComplete={handleBillAnalysis}
            onBack={() => setStep(2)}
            accentColor="#0A5C8C"
          />
        )}

        {/* Step 3: Preferences */}
        {!isAnalyzing && step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Set Your Preferences
              </h1>
              <p className="text-gray-600">Help us find the best business plans for you</p>
            </div>

            <Card className="border-2 border-blue-200">
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Average Monthly Usage (kWh)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {["2500", "5000", "10000", "20000"].map((usage) => (
                      <Button
                        key={usage}
                        variant={monthlyUsage === usage ? "default" : "outline"}
                        onClick={() => setMonthlyUsage(usage)}
                        className={monthlyUsage === usage ? "bg-[#0A5C8C] hover:bg-[#084a6f]" : ""}
                      >
                        {parseInt(usage).toLocaleString()} kWh
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    value={monthlyUsage}
                    onChange={(e) => setMonthlyUsage(e.target.value)}
                    className="mt-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Preferred Plan Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "", label: "Any" },
                      { value: "fixed", label: "Fixed Rate" },
                      { value: "variable", label: "Variable Rate" }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={planType === option.value ? "default" : "outline"}
                        onClick={() => setPlanType(option.value)}
                        className={planType === option.value ? "bg-[#0A5C8C] hover:bg-[#084a6f]" : ""}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Preferred Contract Length
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "", label: "Any" },
                      { value: "12", label: "12 months" },
                      { value: "24", label: "24 months" },
                      { value: "36", label: "36 months" }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={contractLength === option.value ? "default" : "outline"}
                        onClick={() => setContractLength(option.value)}
                        className={contractLength === option.value ? "bg-[#0A5C8C] hover:bg-[#084a6f]" : ""}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="h-11">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handlePreferencesSubmit}
                className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white h-11 px-8"
              >
                View Business Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {!isAnalyzing && step === 4 && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-xl shadow-xl p-6 sm:p-8 text-white">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-3">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-semibold">Partner Verified Plans</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                    {sortedPlans.length} Business Plans for {cityName}
                  </h1>
                  <p className="text-blue-100 text-sm">
                    {businessType === 'small' ? 'Small Business' : businessType === 'medium' ? 'Medium Business' : 'Large Business'} • {monthlyUsage} kWh/month
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{sortedPlans.length}</div>
                  <div className="text-xs text-blue-100">Available Plans</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <Shield className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-semibold">Price Lock</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <TrendingDown className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-semibold">Volume Rates</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <Award className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-semibold">Verified</div>
                </div>
              </div>
            </div>

            {/* Sort Controls */}
            <Card className="border-2 border-blue-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">Sort by:</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={sortBy === "rate" ? "default" : "outline"}
                        onClick={() => setSortBy("rate")}
                        className={sortBy === "rate" ? "bg-[#0A5C8C] hover:bg-[#084a6f]" : ""}
                      >
                        Lowest Rate
                      </Button>
                      <Button
                        size="sm"
                        variant={sortBy === "contract" ? "default" : "outline"}
                        onClick={() => setSortBy("contract")}
                        className={sortBy === "contract" ? "bg-[#0A5C8C] hover:bg-[#084a6f]" : ""}
                      >
                        Contract
                      </Button>
                      <Button
                        size="sm"
                        variant={sortBy === "renewable" ? "default" : "outline"}
                        onClick={() => setSortBy("renewable")}
                        className={sortBy === "renewable" ? "bg-[#0A5C8C] hover:bg-[#084a6f]" : ""}
                      >
                        Green
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A5C8C] mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading business plans...</p>
              </div>
            ) : sortedPlans.length === 0 ? (
              <Card className="border-2">
                <CardContent className="p-12 text-center">
                  <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Business Plans Found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any business plans matching your criteria.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setStep(1)} variant="outline">
                      Try Different ZIP
                    </Button>
                    <Button onClick={() => setStep(3)} className="bg-[#0A5C8C] hover:bg-[#084a6f]">
                      Adjust Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Top Recommendations */}
                {topRecommendations.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Top Business Recommendations</h2>
                    {topRecommendations.map((plan, index) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        estimatedMonthlyCost={calculateMonthlyCost(plan)}
                        monthlyUsage={monthlyUsage}
                        rank={index + 1}
                        isTopPick={index === 0}
                      />
                    ))}
                  </div>
                )}

                {/* Other Plans */}
                {otherPlans.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Other Business Plans</h2>
                    {otherPlans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        estimatedMonthlyCost={calculateMonthlyCost(plan)}
                        monthlyUsage={monthlyUsage}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Business Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Why Choose Business Electricity Plans?</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Shield className="w-5 h-5 text-[#0A5C8C] mb-2" />
                    <p className="font-semibold text-gray-900">Price Stability</p>
                    <p className="text-gray-600">Fixed rates protect your budget</p>
                  </div>
                  <div>
                    <TrendingDown className="w-5 h-5 text-[#0A5C8C] mb-2" />
                    <p className="font-semibold text-gray-900">Volume Savings</p>
                    <p className="text-gray-600">Better rates for higher usage</p>
                  </div>
                  <div>
                    <Award className="w-5 h-5 text-[#0A5C8C] mb-2" />
                    <p className="font-semibold text-gray-900">Dedicated Support</p>
                    <p className="text-gray-600">Business account managers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}