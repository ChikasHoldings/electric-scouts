import React, { useState, useEffect } from "react";
import { ElectricityProvider, ElectricityPlan } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Home, Building2, Zap, Leaf, Clock, CheckCircle, Filter, ArrowRight, Star, Award, TrendingDown, X, FileText, Mail, AlertCircle } from "lucide-react";
import { validateZipCode, getStateByZip } from "../components/compare/stateData";
import { 
  getProvidersForZipCode, 
  getProviderDetails, 
  getCityFromZip,
  getStateFromZip
} from "../components/compare/providerAvailability";
import { 
  filterPlansByZip, 
  calculateMonthlyBill,
  validateZipForComparison 
} from "../components/compare/dataValidation";
import { calculateMatchScore, calculateSavings, generatePlanSummary } from "../components/compare/matchScore";
import { useAffiliateLinks } from "@/hooks/useAffiliateLink";
import BillUploadStep from "../components/compare/BillUploadStep";
import EmailResults from "../components/compare/EmailResults";
import { useZipDetection } from "../components/hooks/useZipDetection";
import { debugCompareRatesPipeline, validateDataStructures } from "../components/compare/debugPipeline";
import { runFullSystemTest } from "../components/compare/systemTest";
import SEOHead, { getOrganizationSchema, getServiceSchema, getFAQSchema, getBreadcrumbSchema } from "@/components/SEOHead";

export default function CompareRates() {
  // SEO meta tags
  useEffect(() => {
    document.title = "Compare Electricity Rates | Find the Best Plans | ElectricScouts";
  }, []);

  // Lead capture state
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState(null);

  const handleLeadCapture = async (source) => {
    if (!leadEmail || leadSubmitting) return;
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const resp = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail, zip: zipCode || null, source }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setLeadSubmitted(true);
      } else {
        setLeadError(data.error || 'Something went wrong');
      }
    } catch (e) {
      setLeadError('Network error. Please try again.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const seoBlock = (
    <SEOHead
      title="Compare Electricity Rates | Find the Best Plans | ElectricScouts"
      description="Compare electricity rates from 40+ providers across deregulated states. Find the cheapest plans, renewable options, and save up to $800/year on your electric bill."
      canonical="/compare-rates"
      keywords="compare electricity rates, electricity plans, cheapest electricity, energy comparison, deregulated electricity"
      structuredData={[
        getOrganizationSchema(),
        getServiceSchema(),
        getFAQSchema([
          { question: "Will my power go out when I switch electricity providers?", answer: "No. Your local utility still delivers power through the same infrastructure. Only your billing company changes. The switch is seamless with no interruption to your service." },
          { question: "How long does it take to switch electricity providers?", answer: "Enrollment takes 5-10 minutes online. Your new service activates within 1-2 billing cycles (14-45 days depending on your utility)." },
          { question: "Can I switch electricity providers anytime?", answer: "Yes, but you may face early termination fees if you're under contract. Wait until your contract expiration for penalty-free switching. Month-to-month plans can be switched anytime." },
          { question: "How much can I save by switching electricity providers?", answer: "The average household saves $200-$800 per year by switching to a more competitive electricity plan. Savings depend on your current rate, usage, and the plans available in your area." },
          { question: "Is it free to compare electricity rates on ElectricScouts?", answer: "Yes, ElectricScouts is 100% free to use. We compare rates from 40+ providers across 12 deregulated states. There are no hidden fees or obligations." },
          { question: "What is a deregulated electricity market?", answer: "In deregulated states, you can choose your electricity provider instead of being locked into your local utility. This competition drives prices down and gives you more plan options including fixed-rate, variable-rate, and renewable energy plans." }
        ]),
        getBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Compare Electricity Rates", url: "/compare-rates" }
        ])
      ]}
    />
  );

  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [preferences, setPreferences] = useState({
    fixedRate: false,
    variableRate: false,
    renewable: false,
    twelveMonth: false,
    contractLength: "",
    renewablePercentage: "",
    etfTolerance: "",
    monthlyUsage: 1000
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [filterRate, setFilterRate] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterPlanType, setFilterPlanType] = useState("all");
  const [filterRenewable, setFilterRenewable] = useState("all");
  const [filterContractLength, setFilterContractLength] = useState("all");
  const [filterFeatures, setFilterFeatures] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [cityName, setCityName] = useState("");
  const [availableProviders, setAvailableProviders] = useState([]);
  const [billData, setBillData] = useState(null);
  const { detectedZip, saveZip } = useZipDetection();



  // Load ZIP code from URL on mount and when URL changes
  useEffect(() => {
    const loadZipData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const zipFromUrl = urlParams.get('zip');

      if (zipFromUrl && zipFromUrl.length === 5) {
        const validation = validateZipCode(zipFromUrl);
        if (validation.valid) {
          setZipCode(zipFromUrl);
          saveZip(zipFromUrl);
          const city = getCityFromZip(zipFromUrl);
          const providers = await getProvidersForZipCode(zipFromUrl);
          setCityName(city);
          setAvailableProviders(providers);
          setStep(2);
        } else {
          setZipCode(zipFromUrl);
          setZipError(validation.error || "This ZIP code is not in a deregulated electricity market");
          setStep(1);
        }
      } else if (detectedZip && !zipCode) {
        setZipCode(detectedZip);
      }
    };
    
    loadZipData();
  }, [detectedZip]);

  // Scroll to top when results are shown
  useEffect(() => {
    if (showResults) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showResults]);

  const { data: plans = [], isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['electricityPlans'],
    queryFn: async () => {
      try {
        const result = await ElectricityPlan.list();
        if (result && result.length > 0) {
        }
        return result || [];
      } catch (error) {
        console.error("❌ Error fetching plans:", error);
        return [];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 1000,
    cacheTime: 5 * 60 * 1000,
  });

  const handleZipSubmit = async () => {
    setZipError("");
    
    if (zipCode.length !== 5) {
      setZipError("Please enter a valid 5-digit ZIP code");
      return;
    }

    const validation = validateZipCode(zipCode);
    if (!validation.valid) {
      setZipError(validation.error || "This ZIP code is not in a deregulated electricity market");
      return;
    }

    const city = getCityFromZip(zipCode);
    const stateCode = getStateFromZip(zipCode);
    
    const providers = await getProvidersForZipCode(zipCode);
    
    setCityName(city);
    setAvailableProviders(providers);
    saveZip(zipCode);
    
    // Update URL to reflect new ZIP
    const newUrl = `${window.location.pathname}?zip=${zipCode}`;
    window.history.pushState({}, '', newUrl);
    
    setStep(2);
  };

  const handlePropertyTypeSubmit = () => {
    if (!propertyType) return;
    setStep(2.5);
  };

  const handleBillAnalysis = async (data) => {
    setBillData(data);
    if (data.zip_code && data.zip_code !== zipCode) {
      setZipCode(data.zip_code);
      saveZip(data.zip_code);
      const city = getCityFromZip(data.zip_code);
      const providers = await getProvidersForZipCode(data.zip_code);
      setCityName(city);
      setAvailableProviders(providers);
    }
    if (data.monthly_usage_kwh) {
      setPreferences(prev => ({ ...prev, monthlyUsage: data.monthly_usage_kwh }));
    }
    setStep(3);
  };

  const handleSkipBillUpload = () => {
    setStep(3);
  };

  const handlePreferencesSubmit = async () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 1500);
  };



  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredPlans = React.useMemo(() => {
    if (!plans || plans.length === 0) {
      return [];
    }


    const filtered = plans.filter(plan => {
      const providerName = plan.provider_name;
      const planName = plan.plan_name;
      const planType = plan.plan_type;
      const renewablePercentage = plan.renewable_percentage;
      const contractLength = plan.contract_length;
      
      // Filter out business plans
      const customerType = (plan.customer_type || '').toLowerCase();
      if (customerType === 'business' || (planName && planName.toLowerCase().includes('business'))) {
        return false;
      }
      
      // Filter by provider availability for current ZIP
      if (zipCode && availableProviders.length > 0) {
        const provider = availableProviders.find(p => p.name === providerName);
        if (!provider) {
          return false;
        }
      }
      
      // Apply user preference filters
      if (preferences.fixedRate && planType !== 'fixed') return false;
      if (preferences.variableRate && planType !== 'variable') return false;
      if (preferences.renewable && (!renewablePercentage || renewablePercentage < 50)) return false;
      if (preferences.twelveMonth && contractLength !== 12) return false;
      
      return true;
    });

    return filtered;
  }, [plans, zipCode, availableProviders, preferences]);

  // Sort plans by match score and rate
  const plansWithScores = React.useMemo(() => {
    return filteredPlans.map(plan => {
      const normalizedPlan = {
        id: plan.id,
        provider_name: plan.provider_name,
        plan_name: plan.plan_name,
        rate_per_kwh: plan.rate_per_kwh,
        contract_length: plan.contract_length,
        plan_type: plan.plan_type,
        renewable_percentage: plan.renewable_percentage || 0,
        monthly_base_charge: plan.monthly_base_charge || 0,
        early_termination_fee: plan.early_termination_fee || 0,
        features: plan.features || []
      };
      
      return {
        ...normalizedPlan,
        matchScore: calculateMatchScore(normalizedPlan, preferences, propertyType, {}),
        summary: generatePlanSummary(normalizedPlan, preferences.monthlyUsage || 1000)
      };
    });
  }, [filteredPlans, preferences, propertyType]);

  const sortedPlans = React.useMemo(() => {
    return [...plansWithScores].sort((a, b) => {
      if (b.matchScore.score !== a.matchScore.score) {
        return b.matchScore.score - a.matchScore.score;
      }
      return a.rate_per_kwh - b.rate_per_kwh;
    });
  }, [plansWithScores]);

  const topPlans = sortedPlans.slice(0, 3);
  const otherPlans = sortedPlans.slice(3);

  const calculateBill = (plan) => {
    return calculateMonthlyBill(plan, 1000);
  };

  const getProviderLogo = (providerName) => {
    const provider = providers.find(p => p.name === providerName);
    if (!provider) return null;
    return provider.logo_url;
  };

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const result = await ElectricityProvider.filter({ is_active: true });
      if (result && result.length > 0) {
      }
      return result || [];
    },
    initialData: [],
  });

  const { getAffiliateUrl } = useAffiliateLinks();

  const getProviderWebsite = (providerName, planId) => {
    const provider = providers.find(p => p.name === providerName);
    if (!provider) return "#";
    const fallback = provider.affiliate_url || provider.website_url || "#";
    return getAffiliateUrl({ providerId: provider.id, offerId: planId, fallbackUrl: fallback });
  };

  const getFilteredOtherPlans = () => {
    let filtered = [...otherPlans];

    if (filterRate !== "all") {
      if (filterRate === "low") {
        filtered = filtered.filter(p => p.rate_per_kwh < 10);
      } else if (filterRate === "medium") {
        filtered = filtered.filter(p => p.rate_per_kwh >= 10 && p.rate_per_kwh < 12);
      } else if (filterRate === "high") {
        filtered = filtered.filter(p => p.rate_per_kwh >= 12);
      }
    }

    if (filterTerm !== "all") {
      if (filterTerm === "short") {
        filtered = filtered.filter(p => p.contract_length && p.contract_length <= 6);
      } else if (filterTerm === "medium") {
        filtered = filtered.filter(p => p.contract_length && p.contract_length > 6 && p.contract_length <= 12);
      } else if (filterTerm === "long") {
        filtered = filtered.filter(p => p.contract_length && p.contract_length > 12);
      }
    }

    if (filterProvider !== "all") {
      filtered = filtered.filter(p => p.provider_name === filterProvider);
    }

    if (filterPlanType !== "all") {
      filtered = filtered.filter(p => p.plan_type === filterPlanType);
    }

    // Advanced Filters
    if (filterRenewable !== "all") {
      const renewableValue = parseInt(filterRenewable);
      filtered = filtered.filter(p => p.renewable_percentage >= renewableValue);
    }

    if (filterContractLength !== "all") {
      const contractValue = parseInt(filterContractLength);
      filtered = filtered.filter(p => p.contract_length === contractValue);
    }

    // Feature filters (simulated - would need actual data in plans)
    if (filterFeatures.length > 0) {
      filtered = filtered.filter(p => {
        // For demo purposes - in production, plans would have features array
        return true; // Would check if plan has all selected features
      });
    }

    return filtered;
  };

  const uniqueProviders = zipCode 
    ? availableProviders.map(p => p.name).sort()
    : [...new Set(plans.map(p => p.provider_name).filter(Boolean))].sort();

  // Loading Animation
  if (isLoading) {
    return (
      <>{seoBlock}<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-[#0A5C8C] rounded-full border-t-transparent animate-spin"></div>
            <Zap className="absolute inset-0 m-auto w-7 h-7 text-[#FF6B35]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Finding Your Best Rates</h2>
          <p className="text-sm text-gray-600">Comparing plans from {availableProviders.length} verified providers...</p>
        </div>
      </div></>
    );
  }

  // Results Page
  if (showResults) {
    return (
      <>{seoBlock}<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-4 sm:py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-1">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-center">
                Your Personalized Rate Comparison
              </h1>
            </div>
            <p className="text-center text-xs sm:text-sm text-blue-100 px-2">
              {filteredPlans.length} plans available in {cityName} (ZIP: {zipCode})
              {propertyType && ` • ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}`}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Top 3 Recommended Plans */}
          <div className="mb-8 sm:mb-10">
            <div className="text-center mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex items-center justify-center gap-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                <span>Top 3 Recommended Plans</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 px-4">
                Best rates for your area based on 1,000 kWh usage
              </p>
            </div>
            
            {topPlans.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No plans available yet</h3>
                <p className="text-gray-600 mb-6">
                  We're working on adding plans for {cityName} (ZIP: {zipCode}). Try searching with a different ZIP code.
                </p>
                <Button onClick={() => { setShowResults(false); setStep(1); setZipCode(""); }} className="bg-[#0A5C8C] hover:bg-[#084a6f]">
                  Try Another ZIP Code
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {topPlans.map((plan, index) => (
                  <Card key={plan.id} className="relative overflow-hidden border hover:border-[#FF6B35] transition-all hover:shadow-lg group">
                  {/* Match Score Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                      plan.matchScore.tier === 'excellent' ? 'bg-green-500 text-white' :
                      plan.matchScore.tier === 'great' ? 'bg-blue-500 text-white' :
                      plan.matchScore.tier === 'good' ? 'bg-yellow-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {plan.matchScore.score}% Match
                    </div>
                  </div>
                  
                  {/* Rank Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`text-white text-[10px] font-semibold px-2 py-1 rounded-md ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      'bg-orange-600'
                    }`}>
                      {index === 0 ? 'BEST' : index === 1 ? '2ND' : '3RD'}
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    {/* Provider Info */}
                    <div className="mb-4">
                      <div className="h-10 flex items-center justify-center mb-2">
                        {getProviderLogo(plan.provider_name) ? (
                          <img 
                            src={getProviderLogo(plan.provider_name)} 
                            alt={plan.provider_name}
                            className="h-8 w-auto object-contain"
                          loading="lazy" />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">{plan.provider_name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 text-center line-clamp-1">{plan.plan_name}</p>
                    </div>
                    
                    {/* Rate Display */}
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-3 mb-3 text-center border border-blue-100">
                      <div className="text-3xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wide">per kWh</div>
                    </div>
                    
                    {/* Match Reasons */}
                    {plan.matchScore.reasons.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-2.5 mb-3">
                        <p className="text-[10px] font-semibold text-blue-900 mb-1">Why this matches:</p>
                        <ul className="space-y-0.5">
                          {plan.matchScore.reasons.map((reason, i) => (
                            <li key={i} className="text-[10px] text-blue-700 flex items-start gap-1">
                              <CheckCircle className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-1.5 mb-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Est. Monthly:</span>
                        <span className="font-semibold text-gray-900">${plan.summary.monthlyBill}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Contract:</span>
                        <span className="font-semibold text-gray-900">{plan.contract_length || 'Variable'} months</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-gray-900 capitalize">{plan.plan_type}</span>
                      </div>
                      {plan.summary.earlyTermFee > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Cancel Fee:</span>
                          <span className="font-semibold text-orange-600">${plan.summary.earlyTermFee}</span>
                        </div>
                      )}
                      {plan.summary.potentialSavings > 0 && (
                        <div className="flex justify-between items-center bg-green-50 -mx-2 px-2 py-1 rounded">
                          <span className="text-green-700 font-medium">Annual Savings:</span>
                          <span className="font-bold text-green-700">${plan.summary.potentialSavings}</span>
                        </div>
                      )}
                      {plan.renewable_percentage >= 50 && (
                        <div className="flex items-center justify-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-[10px] font-medium mt-2">
                          <Leaf className="w-3 h-3" />
                          {plan.renewable_percentage}% Renewable
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <a href={getProviderWebsite(plan.provider_name, plan.id)} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm font-semibold py-2.5 rounded-lg transition-all text-center inline-flex items-center justify-center gap-1.5 no-underline">
                        Get This Plan
                        <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </div>

          {/* All Other Plans */}
          {otherPlans.length > 0 && (
            <div className="mb-8 sm:mb-10">
              <div className="mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5">More Available Plans</h2>
                <p className="text-xs sm:text-sm text-gray-600">Additional options in your area</p>
              </div>

              {/* Filters */}
              <Card className="mb-4 sm:mb-5 border">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A5C8C] flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">Filter Plans</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="text-xs text-[#0A5C8C] hover:text-[#084a6f] h-6 sm:h-7 px-2"
                    >
                      {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
                    </Button>
                  </div>

                  {/* Basic Filters */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
                    <Select value={filterRate} onValueChange={setFilterRate}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Rate" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rates</SelectItem>
                        <SelectItem value="low">Low (&lt;10¢)</SelectItem>
                        <SelectItem value="medium">Medium (10-12¢)</SelectItem>
                        <SelectItem value="high">High (&gt;12¢)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterTerm} onValueChange={setFilterTerm}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Terms</SelectItem>
                        <SelectItem value="short">Short (≤6 mo)</SelectItem>
                        <SelectItem value="medium">Medium (7-12 mo)</SelectItem>
                        <SelectItem value="long">Long (&gt;12 mo)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterProvider} onValueChange={setFilterProvider}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Providers</SelectItem>
                        {uniqueProviders.map(provider => (
                          <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterPlanType} onValueChange={setFilterPlanType}>
                      <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="fixed">Fixed Rate</SelectItem>
                        <SelectItem value="variable">Variable Rate</SelectItem>
                        <SelectItem value="prepaid">Prepaid</SelectItem>
                        <SelectItem value="indexed">Indexed</SelectItem>
                        <SelectItem value="time-of-use">Time-of-Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <div className="border-t pt-3 mt-3 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                        <Select value={filterContractLength} onValueChange={setFilterContractLength}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Contract Length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Length</SelectItem>
                            <SelectItem value="3">3 Months</SelectItem>
                            <SelectItem value="6">6 Months</SelectItem>
                            <SelectItem value="12">12 Months</SelectItem>
                            <SelectItem value="24">24 Months</SelectItem>
                            <SelectItem value="36">36 Months</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={filterRenewable} onValueChange={setFilterRenewable}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Renewable %" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Renewable</SelectItem>
                            <SelectItem value="25">25%+ Renewable</SelectItem>
                            <SelectItem value="50">50%+ Renewable</SelectItem>
                            <SelectItem value="100">100% Renewable</SelectItem>
                          </SelectContent>
                        </Select>


                      </div>

                      {/* Plan Features */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">Plan Features:</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['No Deposit', 'Online Bill Pay', 'Mobile App', 'Auto Pay Discount', 'Paperless Billing'].map((feature) => (
                            <button
                              key={feature}
                              onClick={() => {
                                setFilterFeatures(prev => 
                                  prev.includes(feature) 
                                    ? prev.filter(f => f !== feature)
                                    : [...prev, feature]
                                );
                              }}
                              className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                                filterFeatures.includes(feature)
                                  ? 'bg-[#0A5C8C] border-[#0A5C8C] text-white'
                                  : 'border-gray-300 text-gray-600 hover:border-[#0A5C8C]'
                              }`}
                            >
                              {feature}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFilterRate("all");
                            setFilterTerm("all");
                            setFilterProvider("all");
                            setFilterPlanType("all");
                            setFilterRenewable("all");
                            setFilterContractLength("all");
                            setFilterFeatures([]);
                          }}
                          className="text-xs"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Desktop Table */}
              <div className="hidden lg:block bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Provider</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Rate</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Est. Monthly</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Contract</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredOtherPlans().map((plan, index) => (
                      <tr key={plan.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/50 transition-colors border-b`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {getProviderLogo(plan.provider_name) ? (
                              <img 
                                src={getProviderLogo(plan.provider_name)} 
                                alt={plan.provider_name}
                                className="h-7 w-auto object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-gray-900">{plan.provider_name.substring(0, 2)}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                {plan.provider_name}
                                {plan.matchScore && plan.matchScore.score >= 75 && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    plan.matchScore.tier === 'excellent' ? 'bg-green-100 text-green-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {plan.matchScore.score}% Match
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{plan.plan_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-lg font-semibold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                          {plan.summary.baseCharge > 0 && (
                            <div className="text-[10px] text-gray-500">+${plan.summary.baseCharge} base</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-base font-semibold text-gray-900">${plan.summary.monthlyBill}</div>
                          {plan.summary.potentialSavings > 0 && (
                            <div className="text-[10px] text-green-600 font-medium">Save ${plan.summary.potentialSavings}/yr</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-gray-900">{plan.contract_length || 'Var'} mo</span>
                          {plan.summary.earlyTermFee > 0 && (
                            <div className="text-[10px] text-orange-600">${plan.summary.earlyTermFee} ETF</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 capitalize">
                              {plan.plan_type}
                            </span>
                            {plan.renewable_percentage >= 50 && (
                              <Leaf className="w-3.5 h-3.5 text-green-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <a href={getProviderWebsite(plan.provider_name, plan.id)} target="_blank" rel="noopener noreferrer" className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-5 py-1.5 rounded-lg font-medium text-sm inline-flex items-center justify-center no-underline">
                              View Plan
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-2.5">
                {getFilteredOtherPlans().map((plan) => (
                  <Card key={plan.id} className="border hover:border-[#0A5C8C] transition-all">
                    <CardContent className="p-3.5">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        {getProviderLogo(plan.provider_name) ? (
                          <img 
                            src={getProviderLogo(plan.provider_name)} 
                            alt={plan.provider_name}
                            className="h-7 w-auto object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-gray-900">{plan.provider_name.substring(0, 3)}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                            <span className="truncate">{plan.provider_name}</span>
                            {plan.matchScore && plan.matchScore.score >= 75 && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                plan.matchScore.tier === 'excellent' ? 'bg-green-500 text-white' :
                                'bg-blue-500 text-white'
                              }`}>
                                {plan.matchScore.score}%
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{plan.plan_name}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 mb-2.5 flex-wrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 capitalize">
                          {plan.plan_type}
                        </span>
                        {plan.renewable_percentage >= 50 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-50 text-green-700">
                            <Leaf className="w-3 h-3 mr-0.5" />
                            Green
                          </span>
                        )}
                        {plan.summary.potentialSavings > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-50 text-green-700">
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                            Save ${plan.summary.potentialSavings}/yr
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2.5 bg-gray-50 rounded-lg p-2.5">
                        <div className="text-center">
                          <div className="text-[10px] text-gray-600">Rate</div>
                          <div className="text-base font-semibold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                          {plan.summary.baseCharge > 0 && (
                            <div className="text-[9px] text-gray-500">+${plan.summary.baseCharge}</div>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-gray-600">Monthly</div>
                          <div className="text-base font-semibold text-gray-900">${plan.summary.monthlyBill}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-gray-600">Term</div>
                          <div className="text-sm font-medium text-gray-900">{plan.contract_length || 'Var'} mo</div>
                          {plan.summary.earlyTermFee > 0 && (
                            <div className="text-[9px] text-orange-600">${plan.summary.earlyTermFee} ETF</div>
                          )}
                        </div>
                      </div>

                      <a href={getProviderWebsite(plan.provider_name, plan.id)} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm font-medium py-2 rounded-lg text-center inline-flex items-center justify-center no-underline">
                          View Plan Details
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {getFilteredOtherPlans().length === 0 && (
                <div className="bg-white rounded-lg border p-8 text-center">
                  <p className="text-gray-600 text-sm">No plans match the selected filters.</p>
                  <p className="text-xs text-gray-500 mt-1">Try adjusting your filter criteria above</p>
                </div>
              )}
            </div>
          )}

          {filteredPlans.length === 0 && topPlans.length > 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No plans match your preferences</h3>
              <p className="text-gray-600 mb-6">Try adjusting your preferences to see more options</p>
              <Button onClick={() => { setShowResults(false); setStep(3); }} className="bg-[#0A5C8C] hover:bg-[#084a6f]">
                Adjust Preferences
              </Button>
            </div>
          )}

          {/* Email Results */}
          {(topPlans.length > 0 || filteredPlans.length > 0) && (
            <div className="mt-8">
              <EmailResults
                plans={[...topPlans, ...filteredPlans].slice(0, 6)}
                zipCode={zipCode}
                cityName={cityName}
                monthlyUsage={preferences.monthlyUsage || 1000}
                comparisonType="residential"
                accentColor="#0A5C8C"
                getAffiliateUrl={(plan) => getProviderWebsite(plan.provider_name, plan.id)}
              />
            </div>
          )}

          {/* Educational Content */}
          <div className="mt-16 space-y-8">
            {/* Main Info Section */}
            <Card className="border-2 overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white p-6">
                <h2 className="text-2xl font-bold mb-2">Understanding Your Electricity Options</h2>
                <p className="text-blue-100 text-sm">Everything you need to know to make the best choice</p>
              </div>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-green-600" />
                      Why Compare Rates?
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      In deregulated electricity markets, you have the power to choose your provider. Competition among 40+ companies means lower rates and better service. The average household saves <strong>$500-800 annually</strong> just by comparing plans once per year.
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Don't let your contract auto-renew at higher rates. Shopping takes 10 minutes and puts hundreds of dollars back in your pocket every year.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      How to Choose the Right Plan
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-gray-900">Compare Total Cost:</span>
                          <p className="text-xs text-gray-600">Look at estimated monthly bills, not just per-kWh rates</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-gray-900">Match Contract Length:</span>
                          <p className="text-xs text-gray-600">12-month plans offer the best rate-flexibility balance</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-gray-900">Read the Fine Print:</span>
                          <p className="text-xs text-gray-600">Check early termination fees and auto-renewal terms</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-semibold text-gray-900">Verify Provider:</span>
                          <p className="text-xs text-gray-600">Ensure they're licensed with your state's utility commission</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="border-2 bg-gradient-to-br from-blue-50 to-green-50">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900 mb-2">Will my power go out when I switch?</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      No. Your local utility still delivers power through the same infrastructure. Only your billing company changes.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900 mb-2">How long does switching take?</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Enrollment takes 5-10 minutes online. Your new service activates within 1-2 billing cycles (14-45 days).
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900 mb-2">Can I switch anytime?</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Yes, but you may face early termination fees before contract ends. Wait until expiration for penalty-free switching.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate Alerts CTA */}
            <Card className="border-2 border-[#0A5C8C] bg-gradient-to-r from-blue-50 to-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-[#0A5C8C]" />
                  <h3 className="text-lg font-bold text-gray-900">Get Rate Drop Alerts</h3>
                </div>
                {leadSubmitted ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-medium">You're subscribed! We'll notify you when rates drop.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">Be the first to know when better rates become available in your area. No spam, just savings.</p>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent"
                      />
                      <Button
                        onClick={() => handleLeadCapture('compare_rates')}
                        disabled={leadSubmitting || !leadEmail}
                        className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white px-6"
                      >
                        {leadSubmitting ? 'Subscribing...' : 'Subscribe'}
                      </Button>
                    </div>
                    {leadError && <p className="text-sm text-red-500 mt-2">{leadError}</p>}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Learn More CTA */}
            <Card className="border-2 bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white overflow-hidden">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-3">Want to Learn More?</h3>
                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                  Explore our comprehensive guides on electricity rates, plan types, and money-saving strategies
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link to={createPageUrl("LearningCenter")}>
                    <Button className="bg-white text-[#0A5C8C] hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg">
                      Learning Center
                    </Button>
                  </Link>
                  <Link to={createPageUrl("FAQ")}>
                    <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#0A5C8C] font-semibold px-6 py-3 rounded-lg transition-colors">
                      View All FAQs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
           </div>
        </div>
      </div></>
    );
  }
  // Step 1: ZIP Code
  if (step === 1) {
    return (
      <>{seoBlock}<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 pt-6 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1.5">
              Find Your Best Electricity Rate
            </h1>
            <p className="text-gray-600 text-base">Enter your ZIP code to get started</p>
          </div>

          <Card className="shadow-xl border max-w-lg mx-auto mb-6">
            <CardContent className="p-6">
              <div className="mb-5">
                <Input
                  type="text"
                  placeholder="Enter ZIP Code"
                  value={zipCode}
                  onChange={(e) => {
                    setZipCode(e.target.value.replace(/\D/g, ''));
                    setZipError("");
                  }}
                  maxLength={5}
                  inputMode="numeric"
                  className="h-14 text-center text-2xl font-semibold tracking-widest border focus:border-[#0A5C8C] rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleZipSubmit()}
                />
                {zipError && (
                  <p className="text-sm text-red-600 mt-2 text-center">{zipError}</p>
                )}
              </div>

              <Button 
                onClick={handleZipSubmit}
                className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-12 text-base font-semibold rounded-lg transition-all"
                disabled={zipCode.length !== 5}
              >
                Compare Rates Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <div className="mt-4 flex items-center justify-center gap-5 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>No Obligation</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informational Cards */}
          <div className="grid sm:grid-cols-3 gap-3 mt-8">
            <Card className="border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Save Up to $800/Year</h3>
                <p className="text-xs text-gray-600">Average household savings by comparing rates annually</p>
              </CardContent>
            </Card>

            <Card className="border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">40+ Providers</h3>
                <p className="text-xs text-gray-600">Compare rates from verified companies in your area</p>
              </CardContent>
            </Card>

            <Card className="border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">2 Minute Process</h3>
                <p className="text-xs text-gray-600">Quick and easy - no credit card or commitment needed</p>
              </CardContent>
            </Card>
           </div>
        </div>
      </div></>
    );
  }
  // Step 2: Property Type
  if (step === 2) {
    const propertyTypes = [
      { value: 'home', label: 'Home', icon: Home, desc: 'Single family house', gradient: 'from-blue-500 to-blue-600' },
      { value: 'apartment', label: 'Apartment', icon: Building2, desc: 'Apartment or condo', gradient: 'from-purple-500 to-purple-600' }
    ];

    return (
      <>{seoBlock}<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 pt-8 pb-12">
        <div className="max-w-xl mx-auto">
          {/* ZIP Code Confirmation Banner */}
          {zipCode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0A5C8C]" />
                <span className="text-sm text-gray-700">
                  Showing plans for <strong>{cityName || `ZIP ${zipCode}`}</strong>
                </span>
              </div>
              <button
                onClick={() => { setStep(1); setZipCode(''); setZipError(''); setCityName(''); setAvailableProviders([]); }}
                className="text-xs text-[#0A5C8C] hover:underline font-medium"
              >
                Change ZIP
              </button>
            </div>
          )}
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1.5">
              Select Your Property Type
            </h1>
            <p className="text-gray-600 text-sm">This helps us show you the most relevant plans</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {propertyTypes.map((type) => (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  propertyType === type.value 
                    ? 'border-[#0A5C8C] shadow-lg bg-blue-50' 
                    : 'border-gray-200 hover:border-[#0A5C8C]'
                }`}
                onClick={() => setPropertyType(type.value)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    propertyType === type.value ? 'bg-[#0A5C8C]' : 'bg-gray-100'
                  }`}>
                    <type.icon className={`w-6 h-6 ${
                      propertyType === type.value ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-0.5">{type.label}</h3>
                  <p className="text-xs text-gray-600 mb-2">{type.desc}</p>
                  {propertyType === type.value && (
                    <div className="flex items-center justify-center gap-1 text-[#0A5C8C] text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Selected
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handlePropertyTypeSubmit}
              className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-11 text-base font-semibold rounded-lg transition-all disabled:opacity-50 px-8"
              disabled={!propertyType}
            >
              Continue to Preferences
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Informational Card */}
          <div className="mt-6">
            <Card className="border bg-gradient-to-r from-blue-50 to-green-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2.5">
                  <div className="bg-white rounded-full p-1.5">
                    <Zap className="w-4 h-4 text-[#0A5C8C]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 text-xs">Why We Ask This</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Different property types have different energy needs and usage patterns. By knowing your property type, we can show you plans specifically designed for your situation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Business CTA */}
          <div className="mt-6 text-center">
            <div className="inline-block bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-5 transform hover:scale-105 transition-all">
              <p className="text-base font-bold text-white mb-1">Looking for Business Rates?</p>
              <p className="text-xs text-white/90 mb-3">Get custom quotes for commercial properties</p>
              <Link to={createPageUrl("BusinessElectricity") + (zipCode ? `?zip=${zipCode}` : '')}>
                <Button size="sm" className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-5 shadow-md">
                  Get Business Quotes
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div></>
     );
  }
  // Step 2.5: Bill Upload (Optional)
  if (step === 2.5) {
    return (
      <>{seoBlock}<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 pt-8 pb-12">
        <div className="max-w-3xl mx-auto">
          <BillUploadStep
            onSkip={handleSkipBillUpload}
            onAnalysisComplete={handleBillAnalysis}
            onBack={() => setStep(2)}
            accentColor="#0A5C8C"
          />
         </div>
      </div></>
    );
  }
  // Step 3: Plan Preferences
  if (step === 3) {
    const preferenceOptions = [
      { key: 'fixedRate', label: 'Fixed Rate Plans', icon: Clock, desc: 'Lock in your rate for contract stability', color: 'blue' },
      { key: 'variableRate', label: 'Variable Rate Plans', icon: Zap, desc: 'Rates adjust monthly with market conditions', color: 'purple' },
      { key: 'renewable', label: 'Renewable Energy', icon: Leaf, desc: '50%+ clean wind and solar power', color: 'green' },
      { key: 'twelveMonth', label: '12 Month Plans', icon: Clock, desc: 'One year contract commitment', color: 'orange' }
    ];

    return (
      <>{seoBlock}<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 pt-6 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1.5">
              What Matters Most to You?
            </h1>
            <p className="text-gray-600 text-base">Select your preferences or skip to see all plans</p>
          </div>

          <Card className="mb-5 shadow-lg border">
            <CardContent className="p-5">
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {preferenceOptions.map((option) => (
                  <div
                    key={option.key}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      preferences[option.key]
                        ? 'border-[#0A5C8C] bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => togglePreference(option.key)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                        preferences[option.key]
                          ? 'bg-[#0A5C8C] border-[#0A5C8C]'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {preferences[option.key] && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm mb-0.5 flex items-center gap-1.5">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">{option.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Average Monthly Usage (kWh)
                  </label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={preferences.monthlyUsage}
                    onChange={(e) => setPreferences(prev => ({ ...prev, monthlyUsage: parseInt(e.target.value) || 1000 }))}
                    className="h-10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used to calculate accurate savings estimates</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Preferred Contract Length
                  </label>
                  <Select value={preferences.contractLength} onValueChange={(value) => setPreferences(prev => ({ ...prev, contractLength: value }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Any length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Any length</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="18">18 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Minimum Renewable Energy %
                  </label>
                  <Select value={preferences.renewablePercentage} onValueChange={(value) => setPreferences(prev => ({ ...prev, renewablePercentage: value }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Any percentage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Any percentage</SelectItem>
                      <SelectItem value="25">25% or more</SelectItem>
                      <SelectItem value="50">50% or more</SelectItem>
                      <SelectItem value="75">75% or more</SelectItem>
                      <SelectItem value="100">100% renewable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Max Early Termination Fee
                  </label>
                  <Select value={preferences.etfTolerance} onValueChange={(value) => setPreferences(prev => ({ ...prev, etfTolerance: value }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Any amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Any amount</SelectItem>
                      <SelectItem value="0">$0 only</SelectItem>
                      <SelectItem value="100">Up to $100</SelectItem>
                      <SelectItem value="150">Up to $150</SelectItem>
                      <SelectItem value="200">Up to $200</SelectItem>
                      <SelectItem value="300">Up to $300</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2.5 mb-6">
            <Button 
              onClick={() => handlePreferencesSubmit()}
              variant="outline"
              className="flex-1 h-11 text-sm font-medium border hover:bg-gray-50"
            >
              Skip - Show All
            </Button>
            <Button 
              onClick={handlePreferencesSubmit}
              className="flex-1 bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-11 text-sm font-semibold rounded-lg transition-all"
            >
              Find My Plans
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>

          {/* Informational Cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-2.5">
                  <Award className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-0.5 text-sm">Personalized Results</h3>
                    <p className="text-xs text-gray-600">Your preferences help us rank the best plans for your specific needs and budget</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-0.5 text-sm">No Wrong Choice</h3>
                    <p className="text-xs text-gray-600">Don't worry - you can still see all available plans regardless of your selections</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
        </div>
      </div></>
    );
  }
  return null;
}