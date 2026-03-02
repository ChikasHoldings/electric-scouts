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
import { getCityFromZip, getProvidersForZipCode, getStateFromZip } from "../components/compare/providerAvailability";
import { validateZipCode } from "../components/compare/stateData";
import PlanCard from "../components/compare/PlanCard";
import BillUploadStep from "../components/compare/BillUploadStep";
import IneligibleZipMessage from "../components/compare/IneligibleZipMessage";
import SEOHead, { getFAQSchema, getBreadcrumbSchema } from "../components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import EmailResults from "../components/compare/EmailResults";
import PlanSearchLoader from "../components/compare/PlanSearchLoader";
import { useAffiliateLinks } from "@/hooks/useAffiliateLink";
import { ElectricityProvider } from "@/api/supabaseEntities";
import { getProviderLogoUrl } from "@/utils/providerSlug";

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
    placeholderData: [],
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => ElectricityProvider.filter({ is_active: true }),
    placeholderData: [],
  });

  const { getAffiliateUrl } = useAffiliateLinks();

  const getProviderAffiliateUrl = (plan) => {
    const provider = providers.find(p => p.name === plan.provider_name);
    if (!provider) return "#";
    const fallback = provider.affiliate_url || provider.website_url || "#";
    return getAffiliateUrl({ providerId: provider.id, offerId: plan.id, fallbackUrl: fallback });
  };

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

  // Scroll to top when results are shown
  useEffect(() => {
    if (step === 4) {
      window.scrollTo(0, 0);
    }
  }, [step]);

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
    // Skip business type step, go directly to bill upload
    setStep(2);
  };

  const handleBillAnalysis = async (data) => {
    setBillData(data);
    if (data.zip_code && data.zip_code !== zipCode) {
      setZipCode(data.zip_code);
      setIsZipValid(true);
      const city = getCityFromZip(data.zip_code);
      const provs = await getProvidersForZipCode(data.zip_code);
      setCityName(city || 'your area');
      setAvailableProviders(provs);
      localStorage.setItem('businessRatesZip', data.zip_code);
      const newUrl = `${window.location.pathname}?zip=${data.zip_code}`;
      window.history.replaceState({}, '', newUrl);
    }
    if (data.monthly_usage_kwh) {
      setMonthlyUsage(data.monthly_usage_kwh.toString());
    }
    setStep(3);
  };

  const handleSkipBillUpload = () => {
    setStep(3);
  };

  const handleBusinessTypeSubmit = () => {
    if (businessType) {
      setStep(3);
    }
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
    const providerName = plan.provider_name;
    const planName = (plan.plan_name || '').toLowerCase();
    const planContractLength = plan.contract_length;
    const planPlanType = plan.plan_type;
    const customerType = (plan.customer_type || '').toLowerCase();
    
    // Only include business/commercial plans
    const isBusinessPlan = planName.includes('business') || 
                           planName.includes('commercial') || 
                           customerType === 'business';
    if (!isBusinessPlan) {
      return false;
    }
    
    // CRITICAL: Filter by state - only show plans for the user's state
    const currentStateCode = zipCode ? getStateFromZip(zipCode) : null;
    if (currentStateCode) {
      if (plan.state && plan.state !== currentStateCode) {
        return false;
      }
      if (!plan.state) {
        return false;
      }
    }
    
    // Filter by ZIP code availability
    // Only apply provider filter when providers have been loaded
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

  const getProviderLogo = (providerName) => {
    const provider = providers.find(p => p.name === providerName);
    return provider ? getProviderLogoUrl(provider) : null;
  };

  const businessTypes = [
    { value: "small", label: "Small Business", usage: "2,500 - 5,000 kWh/mo", icon: Building },
    { value: "medium", label: "Medium Business", usage: "5,000 - 15,000 kWh/mo", icon: Building },
    { value: "large", label: "Large Business", usage: "15,000+ kWh/mo", icon: Building }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <SEOHead
        title="Business Rate Finder | Commercial Electricity Plans | Electric Scouts"
        description="Find the best electricity rates for your business. Compare commercial energy plans from 40+ providers. Fixed rates, volume discounts, and dedicated business support."
        keywords="business electricity rates, commercial energy plans, business energy comparison, commercial electricity"
        canonical="/business-compare-rates"
        structuredData={[
          getFAQSchema([
            { question: "How are business electricity rates different from residential?", answer: "Business rates are typically lower per kWh due to higher volume usage. Commercial plans often include demand charges, custom contract terms, and dedicated account management. Businesses can also negotiate rates directly with providers." },
            { question: "Can small businesses switch electricity providers?", answer: "Yes, any business in a deregulated state can switch providers. Small businesses benefit from competitive rates without needing to negotiate large commercial contracts. The switching process is the same as residential — quick and seamless." },
            { question: "What is a demand charge on business electricity?", answer: "A demand charge is based on your peak electricity usage during a billing period, measured in kilowatts (kW). It reflects the maximum power your business draws at any one time, separate from the per-kWh energy charge." },
            { question: "How much can a business save by switching electricity providers?", answer: "Businesses typically save 10-30% on electricity costs by switching to a more competitive plan. For a business using 5,000 kWh/month, this could mean savings of $500-$2,000 per year." }
          ]),
          getBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Business Electricity", url: "/business-electricity" },
            { name: "Compare Business Rates", url: "/business-compare-rates" }
          ])
        ]}
      />

      {/* Progress Bar */}
      {step > 1 && step < 4 && (
        <div className="bg-white border-b border-blue-200 py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: "ZIP Code", icon: Zap },
                { num: 2, label: "Upload Bill", icon: Building },
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
          <PlanSearchLoader
            type="business"
            providerCount={availableProviders.length}
            onComplete={() => {
              setIsAnalyzing(false);
              setStep(4);
            }}
          />
        )}

        {/* Step 1: ZIP Code */}
        {!isAnalyzing && step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <PageBreadcrumbs
                items={[
                  { name: "Home", url: "/" },
                  { name: "Business Electricity", url: "/business-electricity" },
                  { name: "Compare Business Rates" }
                ]}
                variant="dark"
                className="mb-4 justify-center"
              />
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-4">
                <Building className="w-4 h-4" />
                <span className="text-sm font-semibold">Business Electricity</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                Find the Right Plan for Your Business
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

        {/* Step 2: Bill Upload (Optional) - skipped business type selection */}
        {!isAnalyzing && step === 2 && (
          <BillUploadStep
            onSkip={handleSkipBillUpload}
            onAnalysisComplete={handleBillAnalysis}
            onBack={() => setStep(1)}
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
                        className={monthlyUsage === usage ? "bg-[#0A5C8C] hover:bg-[#084a6f] text-white" : ""}
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
                        className={planType === option.value ? "bg-[#0A5C8C] hover:bg-[#084a6f] text-white" : ""}
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
                        className={contractLength === option.value ? "bg-[#0A5C8C] hover:bg-[#084a6f] text-white" : ""}
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
                        className={sortBy === "rate" ? "bg-[#0A5C8C] hover:bg-[#084a6f] text-white" : ""}
                      >
                        Lowest Rate
                      </Button>
                      <Button
                        size="sm"
                        variant={sortBy === "contract" ? "default" : "outline"}
                        onClick={() => setSortBy("contract")}
                        className={sortBy === "contract" ? "bg-[#0A5C8C] hover:bg-[#084a6f] text-white" : ""}
                      >
                        Contract
                      </Button>
                      <Button
                        size="sm"
                        variant={sortBy === "renewable" ? "default" : "outline"}
                        onClick={() => setSortBy("renewable")}
                        className={sortBy === "renewable" ? "bg-[#0A5C8C] hover:bg-[#084a6f] text-white" : ""}
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
                    <Button onClick={() => setStep(3)} className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
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
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topRecommendations.map((plan, index) => (
                        <Card key={plan.id} className={`border-2 hover:shadow-xl transition-all ${index === 0 ? 'border-[#FF6B35] ring-2 ring-orange-100' : 'border-gray-200 hover:border-[#0A5C8C]'}`}>
                          <CardContent className="p-5">
                            {index === 0 && (
                              <div className="mb-3">
                                <span className="bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</span>
                              </div>
                            )}
                            {index === 1 && (
                              <div className="mb-3">
                                <span className="bg-[#0A5C8C] text-white text-xs font-bold px-3 py-1 rounded-full">RUNNER UP</span>
                              </div>
                            )}
                            {index === 2 && (
                              <div className="mb-3">
                                <span className="bg-gray-600 text-white text-xs font-bold px-3 py-1 rounded-full">GREAT OPTION</span>
                              </div>
                            )}
                            
                            {/* Provider Logo & Name */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {getProviderLogo(plan.provider_name) ? (
                                  <img 
                                    src={getProviderLogo(plan.provider_name)} 
                                    alt={plan.provider_name}
                                    className="h-8 w-auto object-contain"
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex'); }}
                                  loading="lazy" />
                                ) : null}
                                <span className={`text-sm font-bold text-[#0A5C8C] ${getProviderLogo(plan.provider_name) ? 'hidden' : 'flex'}`}>
                                  {plan.provider_name.substring(0, 3).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 truncate">{plan.provider_name}</h3>
                                <p className="text-xs text-gray-500 truncate">{plan.plan_name}</p>
                              </div>
                            </div>

                            {/* Rate & Cost Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Rate</p>
                                <p className="text-xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</p>
                                <p className="text-[10px] text-gray-500">per kWh</p>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 text-center">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Est. Monthly</p>
                                <p className="text-xl font-bold text-gray-900">${calculateMonthlyCost(plan)}</p>
                                <p className="text-[10px] text-gray-500">{monthlyUsage} kWh</p>
                              </div>
                            </div>

                            {/* Plan Details */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Plan Type</span>
                                <span className="font-semibold text-gray-900 capitalize">{plan.plan_type}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Contract</span>
                                <span className="font-semibold text-gray-900">{plan.contract_length ? `${plan.contract_length} months` : 'Month-to-month'}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Renewable</span>
                                <span className="font-semibold text-gray-900">{plan.renewable_percentage || 0}%</span>
                              </div>
                              {plan.monthly_base_charge > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">Base Charge</span>
                                  <span className="font-semibold text-gray-900">${plan.monthly_base_charge}/mo</span>
                                </div>
                              )}
                              {plan.early_termination_fee > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">Early Term. Fee</span>
                                  <span className="font-semibold text-orange-600">${plan.early_termination_fee}</span>
                                </div>
                              )}
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 text-blue-800 capitalize">{plan.plan_type}</span>
                              {plan.renewable_percentage >= 50 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-100 text-green-800">{plan.renewable_percentage}% Green</span>
                              )}
                            </div>

                            {/* CTA Button */}
                            <a href={getProviderAffiliateUrl(plan)} target="_blank" rel="noopener noreferrer" className="block">
                              <Button className={`w-full ${index === 0 ? 'bg-[#FF6B35] hover:bg-[#e55a2b]' : 'bg-[#0A5C8C] hover:bg-[#084a6f]'} text-white font-semibold`}>
                                Get This Plan <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            </a>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Plans */}
                {otherPlans.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Other Business Plans</h2>
                    {otherPlans.map((plan) => (
                      <Card key={plan.id} className="border-2 border-gray-200 hover:shadow-lg hover:border-[#0A5C8C] transition-all">
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Logo */}
                            <div className="w-14 h-14 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {getProviderLogo(plan.provider_name) ? (
                                <img 
                                  src={getProviderLogo(plan.provider_name)} 
                                  alt={plan.provider_name}
                                  className="h-9 w-auto object-contain"
                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex'); }}
                                loading="lazy" />
                              ) : null}
                              <span className={`text-sm font-bold text-[#0A5C8C] ${getProviderLogo(plan.provider_name) ? 'hidden' : 'flex'}`}>
                                {plan.provider_name.substring(0, 3).toUpperCase()}
                              </span>
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 mb-0.5">{plan.provider_name}</h3>
                              <p className="text-sm text-gray-500 mb-2 truncate">{plan.plan_name}</p>
                              <div className="flex flex-wrap gap-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-100 text-blue-800 capitalize">{plan.plan_type}</span>
                                {plan.renewable_percentage >= 50 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-100 text-green-800">{plan.renewable_percentage}% Green</span>
                                )}
                                {plan.contract_length && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700">{plan.contract_length} mo</span>
                                )}
                                {plan.early_termination_fee > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-orange-50 text-orange-700">${plan.early_termination_fee} ETF</span>
                                )}
                              </div>
                            </div>
                            {/* Stats */}
                            <div className="flex items-center gap-4 sm:gap-6">
                              <div className="text-center">
                                <p className="text-[10px] text-gray-500 mb-0.5">Rate</p>
                                <p className="text-lg font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</p>
                                <p className="text-[10px] text-gray-400">per kWh</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-gray-500 mb-0.5">Est. Monthly</p>
                                <p className="text-lg font-bold text-gray-900">${calculateMonthlyCost(plan)}</p>
                                <p className="text-[10px] text-gray-400">{monthlyUsage} kWh</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-gray-500 mb-0.5">Contract</p>
                                <p className="text-sm font-semibold text-gray-900">{plan.contract_length || 'Var'} mo</p>
                              </div>
                              <a href={getProviderAffiliateUrl(plan)} target="_blank" rel="noopener noreferrer">
                                <Button className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white whitespace-nowrap text-sm">
                                  Get Plan <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              </a>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Email Results */}
            {sortedPlans.length > 0 && (
              <div className="mt-4">
                <EmailResults
                  plans={sortedPlans.slice(0, 6)}
                  zipCode={zipCode}
                  cityName={cityName}
                  monthlyUsage={monthlyUsage}
                  comparisonType="business"
                  accentColor="#0A5C8C"
                  getAffiliateUrl={getProviderAffiliateUrl}
                />
              </div>
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