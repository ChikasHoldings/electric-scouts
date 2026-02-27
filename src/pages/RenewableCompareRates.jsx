import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ElectricityPlan } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Zap, CheckCircle, Home, Building, Leaf, Wind, Sun } from "lucide-react";
import ValidatedZipInput from "../components/ValidatedZipInput";
import { getCityFromZip, getProvidersForZipCode } from "../components/compare/providerAvailability";
import { validateZipCode } from "../components/compare/stateData";
import PlanCard from "../components/compare/PlanCard";
import BillUploadStep from "../components/compare/BillUploadStep";
import SEOHead, { getFAQSchema, getBreadcrumbSchema } from "../components/SEOHead";
import EmailResults from "../components/compare/EmailResults";
import { useAffiliateLinks } from "@/hooks/useAffiliateLink";
import { ElectricityProvider } from "@/api/supabaseEntities";

export default function RenewableCompareRates() {
  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [cityName, setCityName] = useState("");
  const [availableProviders, setAvailableProviders] = useState([]);
  const [propertyType, setPropertyType] = useState("");
  const [monthlyUsage, setMonthlyUsage] = useState("1000");
  const [contractLength, setContractLength] = useState("");
  const [isZipValid, setIsZipValid] = useState(false);
  const [sortBy, setSortBy] = useState("rate");
  const [billData, setBillData] = useState(null);

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => ElectricityPlan.list(),
    initialData: [],
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => ElectricityProvider.filter({ is_active: true }),
    initialData: [],
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
          localStorage.setItem('compareRatesZip', zipFromUrl);
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
    localStorage.setItem('compareRatesZip', zipCode);
    // Go directly to bill upload step
    setStep(2);
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
    setStep(4);
  };

  // Filter plans for renewable energy only (>= 90% renewable)
  const renewablePlans = allPlans.filter(plan => {
    const providerName = plan.provider_name;
    const planName = (plan.plan_name || '').toLowerCase();
    
    // Exclude business plans
    const customerType = (plan.customer_type || '').toLowerCase();
    if (customerType === 'business' || planName.includes('business') || planName.includes('commercial')) {
      return false;
    }
    
    // Filter by provider availability for current ZIP
    if (zipCode && availableProviders.length > 0) {
      const provider = availableProviders.find(p => p.name === providerName);
      if (!provider) {
        return false;
      }
    }
    
    const isRenewable = plan.renewable_percentage && plan.renewable_percentage >= 90;
    const matchesContract = !contractLength || plan.contract_length?.toString() === contractLength;
    return isRenewable && matchesContract;
  });

  // Sort plans
  const sortedPlans = [...renewablePlans].sort((a, b) => {
    if (sortBy === "rate") return (a.rate_per_kwh || 0) - (b.rate_per_kwh || 0);
    if (sortBy === "contract") return (a.contract_length || 0) - (b.contract_length || 0);
    if (sortBy === "renewable") return (b.renewable_percentage || 0) - (a.renewable_percentage || 0);
    return 0;
  });

  const topRecommendations = sortedPlans.slice(0, 3);
  const otherPlans = sortedPlans.slice(3);

  const calculateMonthlyCost = (plan) => {
    const usage = parseInt(monthlyUsage) || 1000;
    const energyCost = (plan.rate_per_kwh / 100) * usage;
    const totalCost = energyCost + (plan.monthly_base_charge || 0);
    return totalCost.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <SEOHead
        title="Go Green | Compare Renewable Electricity Plans | Electric Scouts"
        description="Find the best renewable energy electricity plans in your area. Compare 100% green energy rates from wind and solar providers. Support clean energy while saving money."
        keywords="renewable energy plans, green electricity, 100% renewable, wind energy, solar power, clean energy rates"
        canonical="/renewable-compare-rates"
        structuredData={[
          getFAQSchema([
            { question: "What is 100% renewable energy electricity?", answer: "100% renewable energy plans source all electricity from renewable sources like wind, solar, and hydropower. Your electricity is matched with Renewable Energy Certificates (RECs) guaranteeing the equivalent amount was generated from clean sources." },
            { question: "Is renewable energy more expensive than regular electricity?", answer: "Not necessarily. Many renewable energy plans are competitively priced with conventional plans. In Texas and other deregulated states, some 100% renewable plans are actually cheaper than fossil fuel alternatives due to the growth of wind and solar capacity." },
            { question: "Does switching to renewable energy require new equipment?", answer: "No. Switching to a renewable energy plan requires no equipment changes, installation, or home modifications. You simply choose a green energy plan and your provider sources renewable energy on your behalf through the existing power grid." },
            { question: "What is the difference between wind and solar energy plans?", answer: "Wind energy plans source electricity from wind farms, while solar plans use solar panel installations. Some plans combine both. The main difference is generation timing — solar produces during daylight hours while wind can generate 24/7. Both are equally clean and renewable." }
          ]),
          getBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Renewable Energy", url: "/renewable-energy" },
            { name: "Explore Clean Energy Options", url: "/renewable-compare-rates" }
          ])
        ]}
      />

      {/* Progress Bar */}
      {step > 1 && step < 4 && (
        <div className="bg-white border-b border-green-200 py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: "ZIP Code", icon: Zap },
                { num: 2, label: "Upload Bill", icon: Home },
                { num: 3, label: "Preferences", icon: Leaf }
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= s.num ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${
                      step >= s.num ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && <div className={`flex-1 h-1 mx-2 ${step > s.num ? 'bg-green-600' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: ZIP Code */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-4">
                <Leaf className="w-4 h-4" />
                <span className="text-sm font-semibold">100% Renewable Energy</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                Explore Clean Energy Options
              </h1>
              <p className="text-lg text-gray-600">
                Find 100% renewable electricity plans from wind and solar sources
              </p>
            </div>

            <Card className="border-2 border-green-200 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Enter Your ZIP Code</h2>
                    <p className="text-sm text-gray-600">To see available renewable plans in your area</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-14 px-4 py-3 border-2 rounded-xl bg-white border-green-200 focus-within:border-green-500">
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
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-base font-semibold rounded-xl"
                  >
                    Find Green Energy Plans
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <Wind className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Wind Power</p>
                    <p className="text-sm text-gray-600">Clean energy from wind farms</p>
                  </div>
                  <div>
                    <Sun className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Solar Energy</p>
                    <p className="text-sm text-gray-600">Renewable solar electricity</p>
                  </div>
                  <div>
                    <Leaf className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">Zero Emissions</p>
                    <p className="text-sm text-gray-600">100% carbon-free power</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Bill Upload (Optional) - skipped property type selection */}
        {step === 2 && (
          <BillUploadStep
            onSkip={handleSkipBillUpload}
            onAnalysisComplete={handleBillAnalysis}
            onBack={() => setStep(1)}
            accentColor="#16a34a"
          />
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Set Your Preferences
              </h1>
              <p className="text-gray-600">Help us find the best renewable plans for you</p>
            </div>

            <Card className="border-2 border-green-200">
              <CardContent className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Average Monthly Usage (kWh)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["500", "1000", "2000"].map((usage) => (
                      <Button
                        key={usage}
                        variant={monthlyUsage === usage ? "default" : "outline"}
                        onClick={() => setMonthlyUsage(usage)}
                        className={monthlyUsage === usage ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {usage} kWh
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
                      { value: "24", label: "24 months" }
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={contractLength === option.value ? "default" : "outline"}
                        onClick={() => setContractLength(option.value)}
                        className={contractLength === option.value ? "bg-green-600 hover:bg-green-700" : ""}
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
                className="bg-green-600 hover:bg-green-700 text-white h-11 px-8"
              >
                View Green Energy Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-3">
                <Leaf className="w-4 h-4" />
                <span className="text-sm font-semibold">100% Renewable Energy Plans</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Available Green Energy Plans in {cityName}
              </h1>
              <p className="text-gray-600">
                Found {sortedPlans.length} renewable energy {sortedPlans.length === 1 ? 'plan' : 'plans'} for your area
              </p>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-lg border-2 border-green-200 p-4 gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={sortBy === "rate" ? "default" : "outline"}
                    onClick={() => setSortBy("rate")}
                    className={sortBy === "rate" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Lowest Rate
                  </Button>
                  <Button
                    size="sm"
                    variant={sortBy === "contract" ? "default" : "outline"}
                    onClick={() => setSortBy("contract")}
                    className={sortBy === "contract" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    Contract Length
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit Preferences
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading renewable plans...</p>
              </div>
            ) : sortedPlans.length === 0 ? (
              <Card className="border-2">
                <CardContent className="p-12 text-center">
                  <Leaf className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Renewable Plans Found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any 100% renewable energy plans for your ZIP code.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setStep(1)} variant="outline">
                      Try Different ZIP
                    </Button>
                    <Link to={createPageUrl("CompareRates") + `?zip=${zipCode}`}>
                      <Button className="bg-green-600 hover:bg-green-700">
                        View All Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Top Recommendations */}
                {topRecommendations.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Top Renewable Recommendations</h2>
                    {topRecommendations.map((plan, index) => (
                      <Card key={plan.id} className={`border-2 hover:shadow-lg transition-all ${index === 0 ? 'border-green-500 bg-gradient-to-br from-green-50 to-white' : 'border-gray-200'}`}>
                        <CardContent className="p-5">
                          {index === 0 && (
                            <div className="mb-3">
                              <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">TOP GREEN PICK</span>
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.provider_name}</h3>
                              <p className="text-sm text-gray-600 mb-3">{plan.plan_name}</p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  🌿 {plan.renewable_percentage}% Renewable
                                </span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">{plan.plan_type}</span>
                                {plan.contract_length && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{plan.contract_length} mo</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Rate</p>
                                <p className="text-xl font-bold text-green-600">{plan.rate_per_kwh}¢<span className="text-sm font-normal">/kWh</span></p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Est. Monthly</p>
                                <p className="text-xl font-bold text-gray-900">${calculateMonthlyCost(plan)}</p>
                              </div>
                              <a href={getProviderAffiliateUrl(plan)} target="_blank" rel="noopener noreferrer">
                                <Button className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap">
                                  Get Plan <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                              </a>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Other Plans */}
                {otherPlans.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Other Renewable Plans</h2>
                    {otherPlans.map((plan) => (
                      <Card key={plan.id} className="border-2 border-gray-200 hover:shadow-lg transition-all">
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.provider_name}</h3>
                              <p className="text-sm text-gray-600 mb-3">{plan.plan_name}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  🌿 {plan.renewable_percentage}% Renewable
                                </span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">{plan.plan_type}</span>
                                {plan.contract_length && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{plan.contract_length} mo</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Rate</p>
                                <p className="text-xl font-bold text-green-600">{plan.rate_per_kwh}¢<span className="text-sm font-normal">/kWh</span></p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Est. Monthly</p>
                                <p className="text-xl font-bold text-gray-900">${calculateMonthlyCost(plan)}</p>
                              </div>
                              <a href={getProviderAffiliateUrl(plan)} target="_blank" rel="noopener noreferrer">
                                <Button className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap">
                                  Get Plan <ArrowRight className="w-4 h-4 ml-1" />
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
                  comparisonType="renewable"
                  accentColor="#059669"
                  getAffiliateUrl={getProviderAffiliateUrl}
                />
              </div>
            )}

            {/* Renewable Energy Info */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">About 100% Renewable Energy</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Leaf className="w-5 h-5 text-green-600 mb-2" />
                    <p className="font-semibold text-gray-900">Zero Carbon</p>
                    <p className="text-gray-600">No fossil fuels or emissions</p>
                  </div>
                  <div>
                    <Wind className="w-5 h-5 text-green-600 mb-2" />
                    <p className="font-semibold text-gray-900">Wind & Solar</p>
                    <p className="text-gray-600">Clean renewable sources</p>
                  </div>
                  <div>
                    <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
                    <p className="font-semibold text-gray-900">Same Reliability</p>
                    <p className="text-gray-600">No difference in service</p>
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