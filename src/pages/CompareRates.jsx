import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Home, Building2, Zap, Leaf, Clock, CheckCircle, Filter, ArrowRight, Star, Award, TrendingDown, X } from "lucide-react";
import { validateZipCode } from "../components/compare/stateData";
import { 
  getProvidersForZipCode, 
  getProviderDetails, 
  getCityFromZip,
  providerServesZip 
} from "../components/compare/providerAvailability";
import { 
  filterPlansByZip, 
  calculateMonthlyBill,
  validateZipForComparison 
} from "../components/compare/dataValidation";

export default function CompareRates() {
  const [step, setStep] = useState(1);
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [preferences, setPreferences] = useState({
    fixedRate: false,
    variableRate: false,
    renewable: false,
    twelveMonth: false
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

  // Load ZIP code from URL or localStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const zipFromUrl = urlParams.get('zip');
    const savedZip = localStorage.getItem('compareRatesZip');
    
    if (zipFromUrl && zipFromUrl.length === 5) {
      const validation = validateZipCode(zipFromUrl);
      if (validation.valid) {
        setZipCode(zipFromUrl);
        localStorage.setItem('compareRatesZip', zipFromUrl);
        setStep(2);
      }
    } else if (savedZip && savedZip.length === 5) {
      setZipCode(savedZip);
      setStep(2);
    }
  }, []);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  const handleZipSubmit = () => {
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
    const providers = getProvidersForZipCode(zipCode);
    
    setCityName(city);
    setAvailableProviders(providers);
    localStorage.setItem('compareRatesZip', zipCode);
    setStep(2);
  };

  const handlePropertyTypeSubmit = () => {
    if (!propertyType) return;
    setStep(3);
  };

  const handlePreferencesSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 2000);
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredPlans = plans.filter(plan => {
    if (zipCode && !providerServesZip(plan.provider_name, zipCode)) {
      return false;
    }
    if (preferences.fixedRate && plan.plan_type !== 'fixed') return false;
    if (preferences.variableRate && plan.plan_type !== 'variable') return false;
    if (preferences.renewable && (!plan.renewable_percentage || plan.renewable_percentage < 50)) return false;
    if (preferences.twelveMonth && plan.contract_length !== 12) return false;
    return true;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => a.rate_per_kwh - b.rate_per_kwh);
  const topPlans = sortedPlans.slice(0, 3);
  const otherPlans = sortedPlans.slice(3);

  const calculateBill = (plan) => {
    return calculateMonthlyBill(plan, 1000);
  };

  const getProviderLogo = (providerName) => {
    const provider = getProviderDetails(providerName);
    return provider ? provider.logo : null;
  };

  const getProviderWebsite = (providerName) => {
    const provider = getProviderDetails(providerName);
    return provider ? provider.website : "#";
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
    : [...new Set(plans.map(p => p.provider_name))].sort();

  // Loading Animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#0A5C8C] rounded-full border-t-transparent animate-spin"></div>
            <Zap className="absolute inset-0 m-auto w-10 h-10 text-[#FF6B35]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Finding Your Best Rates</h2>
          <p className="text-gray-600">Comparing plans from {availableProviders.length} verified providers...</p>
        </div>
      </div>
    );
  }

  // Results Page
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-6 h-6 text-yellow-400" />
              <h1 className="text-2xl sm:text-3xl font-bold">Your Personalized Rate Comparison</h1>
            </div>
            <p className="text-center text-sm text-blue-100">
              {filteredPlans.length} plans available in {cityName} (ZIP: {zipCode}) • {propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top 3 Recommended Plans */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                Top 3 Recommended Plans
              </h2>
              <p className="text-gray-600">Best rates for your area based on 1,000 kWh usage</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {topPlans.map((plan, index) => (
                <Card key={plan.id} className="relative overflow-hidden border-2 hover:border-[#FF6B35] transition-all hover:shadow-2xl group">
                  {/* Rank Badge */}
                  <div className="absolute top-0 right-0 z-10">
                    <div className={`text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      'bg-gradient-to-r from-orange-600 to-orange-700'
                    }`}>
                      {index === 0 ? '🥇 BEST' : index === 1 ? '🥈 2ND' : '🥉 3RD'}
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    {/* Provider Info */}
                    <div className="mb-4">
                      <div className="h-12 flex items-center justify-center mb-3">
                        {getProviderLogo(plan.provider_name) ? (
                          <img 
                            src={getProviderLogo(plan.provider_name)} 
                            alt={plan.provider_name}
                            className="h-10 w-auto object-contain"
                          />
                        ) : (
                          <div className="w-full h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{plan.provider_name}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 text-center line-clamp-1">{plan.plan_name}</p>
                    </div>
                    
                    {/* Rate Display */}
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 mb-4 text-center border-2 border-blue-100">
                      <div className="text-4xl font-bold text-[#0A5C8C] mb-1">{plan.rate_per_kwh}¢</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">per kWh</div>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Est. Monthly:</span>
                        <span className="font-bold text-gray-900">${calculateBill(plan)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Contract:</span>
                        <span className="font-bold text-gray-900">{plan.contract_length || 'Variable'} months</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-semibold text-gray-900 capitalize">{plan.plan_type}</span>
                      </div>
                      {plan.renewable_percentage >= 50 && (
                        <div className="flex items-center justify-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                          <Leaf className="w-3 h-3" />
                          {plan.renewable_percentage}% Renewable
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <a href={getProviderWebsite(plan.provider_name)} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] hover:from-[#e55a2b] hover:to-[#cc4a1f] text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
                        Get This Plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* All Other Plans */}
          {otherPlans.length > 0 && (
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">More Available Plans</h2>
                <p className="text-sm text-gray-600">Additional options in your area</p>
              </div>

              {/* Filters */}
              <Card className="mb-6 border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-[#0A5C8C]" />
                      <span className="text-sm font-bold text-gray-900">Filter Plans</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="text-xs text-[#0A5C8C] hover:text-[#084a6f]"
                    >
                      {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                    </Button>
                  </div>

                  {/* Basic Filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <Select value={filterRate} onValueChange={setFilterRate}>
                      <SelectTrigger className="h-10">
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
                      <SelectTrigger className="h-10">
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
                      <SelectTrigger className="h-10">
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
                      <SelectTrigger className="h-10">
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
                    <div className="border-t pt-3 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Select value={filterContractLength} onValueChange={setFilterContractLength}>
                          <SelectTrigger className="h-10">
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
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Renewable %" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Renewable</SelectItem>
                            <SelectItem value="25">25%+ Renewable</SelectItem>
                            <SelectItem value="50">50%+ Renewable</SelectItem>
                            <SelectItem value="100">100% Renewable</SelectItem>
                          </SelectContent>
                        </Select>

                        {propertyType === 'business' && (
                          <Select>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Business Features" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="demand">Demand Charges</SelectItem>
                              <SelectItem value="tiered">Tiered Pricing</SelectItem>
                              <SelectItem value="custom">Custom Quotes</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Plan Features */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">Plan Features:</label>
                        <div className="flex flex-wrap gap-2">
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
                              className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all ${
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
              <div className="hidden lg:block bg-white rounded-xl shadow-md border-2 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Est. Monthly</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Contract</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredOtherPlans().map((plan, index) => (
                      <tr key={plan.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50 transition-colors border-b border-gray-100`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getProviderLogo(plan.provider_name) ? (
                              <img 
                                src={getProviderLogo(plan.provider_name)} 
                                alt={plan.provider_name}
                                className="h-8 w-auto object-contain"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold text-[#0A5C8C]">{plan.provider_name.substring(0, 2)}</span>
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{plan.provider_name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">{plan.plan_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-lg font-bold text-gray-900">${calculateBill(plan)}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{plan.contract_length || 'Variable'} mo</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                              {plan.plan_type}
                            </span>
                            {plan.renewable_percentage >= 50 && (
                              <Leaf className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <a href={getProviderWebsite(plan.provider_name)} target="_blank" rel="noopener noreferrer">
                            <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-6 py-2 rounded-lg font-semibold text-sm">
                              View Plan
                            </Button>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {getFilteredOtherPlans().map((plan) => (
                  <Card key={plan.id} className="border-2 hover:border-[#0A5C8C] transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {getProviderLogo(plan.provider_name) ? (
                          <img 
                            src={getProviderLogo(plan.provider_name)} 
                            alt={plan.provider_name}
                            className="h-8 w-auto object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-[#0A5C8C]">{plan.provider_name.substring(0, 2)}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-sm">{plan.provider_name}</div>
                          <div className="text-xs text-gray-500 truncate">{plan.plan_name}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                          {plan.plan_type}
                        </span>
                        {plan.renewable_percentage >= 50 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <Leaf className="w-3 h-3 mr-1" />
                            Green
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 rounded-lg p-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-600">Rate</div>
                          <div className="text-lg font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600">Monthly</div>
                          <div className="text-lg font-bold text-gray-900">${calculateBill(plan)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600">Term</div>
                          <div className="text-sm font-medium text-gray-900">{plan.contract_length || 'Var'} mo</div>
                        </div>
                      </div>

                      <a href={getProviderWebsite(plan.provider_name)} target="_blank" rel="noopener noreferrer" className="block">
                        <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold rounded-lg">
                          View Plan
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {getFilteredOtherPlans().length === 0 && (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
                  <p className="text-gray-600 text-lg">No plans match the selected filters.</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your filter criteria above</p>
                </div>
              )}
            </div>
          )}

          {filteredPlans.length === 0 && (
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
                    <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg">
                      View All FAQs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
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
              Find Your Best Electricity Rate
            </h1>
            <p className="text-gray-600 text-lg">Enter your ZIP code to get started</p>
          </div>

          <Card className="shadow-2xl border-2 max-w-lg mx-auto mb-6">
            <CardContent className="p-8">
              <div className="mb-7">
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
                  className="h-16 text-center text-3xl font-bold tracking-widest border-2 focus:border-[#0A5C8C] rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleZipSubmit()}
                />
                {zipError && (
                  <p className="text-sm text-red-600 mt-3 text-center font-medium">{zipError}</p>
                )}
              </div>

              <Button 
                onClick={handleZipSubmit}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] hover:from-[#e55a2b] hover:to-[#cc4a1f] text-white h-16 text-xl font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all"
                disabled={zipCode.length !== 5}
              >
                Compare Rates Now
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>

              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>100% Free</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>No Obligation</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informational Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            <Card className="border-2 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-5 text-center">
                <h3 className="font-bold text-gray-900 mb-2">Save Up to $800/Year</h3>
                <p className="text-xs text-gray-600">Average household savings by comparing electricity rates annually</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-5 text-center">
                <h3 className="font-bold text-gray-900 mb-2">40+ Providers</h3>
                <p className="text-xs text-gray-600">Compare rates from verified electricity companies in your area</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-5 text-center">
                <h3 className="font-bold text-gray-900 mb-2">2 Minute Process</h3>
                <p className="text-xs text-gray-600">Quick and easy comparison - no credit card or commitment needed</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Property Type
  if (step === 2) {
    const propertyTypes = [
      { value: 'home', label: 'Home', icon: Home, desc: 'Single family house', gradient: 'from-blue-500 to-blue-600' },
      { value: 'apartment', label: 'Apartment', icon: Building2, desc: 'Apartment or condo', gradient: 'from-purple-500 to-purple-600' },
      { value: 'business', label: 'Business', icon: Building2, desc: 'Commercial property', gradient: 'from-orange-500 to-orange-600' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 pt-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Select Your Property Type
            </h1>
            <p className="text-gray-600 text-lg">This helps us show you the most relevant plans</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {propertyTypes.map((type) => (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all hover:shadow-2xl border-2 ${
                  propertyType === type.value 
                    ? 'border-[#0A5C8C] shadow-xl scale-105' 
                    : 'border-gray-200 hover:border-[#0A5C8C]'
                }`}
                onClick={() => setPropertyType(type.value)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${type.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <type.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{type.label}</h3>
                  <p className="text-sm text-gray-600 mb-3">{type.desc}</p>
                  {propertyType === type.value && (
                    <div className="flex items-center justify-center gap-1 text-[#0A5C8C] font-semibold text-sm">
                      <CheckCircle className="w-5 h-5" />
                      Selected
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            onClick={handlePropertyTypeSubmit}
            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] hover:from-[#e55a2b] hover:to-[#cc4a1f] text-white h-16 text-xl font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all disabled:opacity-50"
            disabled={!propertyType}
          >
            Continue to Preferences
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>

          {/* Informational Cards */}
          <div className="mt-8">
            <Card className="border-2 bg-gradient-to-r from-blue-50 to-green-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Why We Ask This</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Different property types have different energy needs and usage patterns. By knowing your property type, we can show you plans specifically designed for your situation - whether it's residential fixed-rate plans for homes, flexible options for apartments, or commercial rates for businesses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 pt-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              What Matters Most to You?
            </h1>
            <p className="text-gray-600 text-lg">Select your preferences or skip to see all plans</p>
          </div>

          <Card className="mb-6 shadow-2xl border-2">
            <CardContent className="p-6 sm:p-8">
              <div className="grid sm:grid-cols-2 gap-4">
                {preferenceOptions.map((option) => (
                  <div
                    key={option.key}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                      preferences[option.key]
                        ? 'border-[#0A5C8C] bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => togglePreference(option.key)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        preferences[option.key]
                          ? 'bg-[#0A5C8C] border-[#0A5C8C]'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {preferences[option.key] && (
                          <CheckCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">{option.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 mb-8">
            <Button 
              onClick={() => handlePreferencesSubmit()}
              variant="outline"
              className="flex-1 h-14 text-lg font-semibold border-2 hover:bg-gray-50"
            >
              Skip - Show All
            </Button>
            <Button 
              onClick={handlePreferencesSubmit}
              className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] hover:from-[#e55a2b] hover:to-[#cc4a1f] text-white h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all"
            >
              Find My Plans
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Informational Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-2 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">Personalized Results</h3>
                    <p className="text-xs text-gray-600">Your preferences help us rank the best plans for your specific needs and budget</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">No Wrong Choice</h3>
                    <p className="text-xs text-gray-600">Don't worry - you can still see all available plans regardless of your selections</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}