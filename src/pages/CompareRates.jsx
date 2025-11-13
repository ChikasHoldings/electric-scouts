import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Home, Building2, Zap, Leaf, Clock, CheckCircle } from "lucide-react";
import { validateZipCode } from "../components/compare/stateData";

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
        setStep(2); // Skip to step 2
      }
    } else if (savedZip && savedZip.length === 5) {
      setZipCode(savedZip);
      setStep(2); // Skip to step 2
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

    localStorage.setItem('compareRatesZip', zipCode);
    setStep(2);
  };

  const handlePropertyTypeSubmit = () => {
    if (!propertyType) return;
    setStep(3);
  };

  const handlePreferencesSubmit = () => {
    setIsLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 2000);
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter plans based on preferences
  const filteredPlans = plans.filter(plan => {
    if (preferences.fixedRate && plan.plan_type !== 'fixed') return false;
    if (preferences.variableRate && plan.plan_type !== 'variable') return false;
    if (preferences.renewable && (!plan.renewable_percentage || plan.renewable_percentage < 50)) return false;
    if (preferences.twelveMonth && plan.contract_length !== 12) return false;
    return true;
  });

  // Get top 3 recommended plans (lowest rates)
  const sortedPlans = [...filteredPlans].sort((a, b) => a.rate_per_kwh - b.rate_per_kwh);
  const topPlans = sortedPlans.slice(0, 3);
  const otherPlans = sortedPlans.slice(3);

  // Calculate estimated bill (assuming 1000 kWh usage)
  const calculateBill = (plan) => {
    return ((plan.rate_per_kwh / 100) * 1000 + (plan.monthly_base_charge || 0)).toFixed(2);
  };

  // Loading Animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#0A5C8C] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Finding Your Best Rates</h2>
          <p className="text-sm text-gray-600">Comparing plans from 40+ providers...</p>
        </div>
      </div>
    );
  }

  // Results Page
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold mb-2">Your Electricity Rate Comparison</h1>
            <p className="text-sm text-blue-100">ZIP Code: {zipCode} • {propertyType}</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top 3 Recommended Plans */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-[#FF6B35]" />
              <h2 className="text-lg font-bold text-gray-900">Top 3 Recommended Plans</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {topPlans.map((plan, index) => (
                <Card key={plan.id} className="border-2 border-[#FF6B35] bg-gradient-to-br from-orange-50 to-white relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <div className="bg-[#FF6B35] text-white text-xs font-bold px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-xs font-bold text-[#0A5C8C]">
                        {plan.provider_name.substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{plan.provider_name}</h3>
                    <p className="text-xs text-gray-600 mb-3">{plan.plan_name}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Rate</span>
                        <span className="text-lg font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢/kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Est. Bill</span>
                        <span className="text-sm font-bold text-gray-900">${calculateBill(plan)}/mo</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Term</span>
                        <span className="text-sm font-semibold text-gray-700">{plan.contract_length || 'Variable'} mo</span>
                      </div>
                    </div>

                    {plan.renewable_percentage >= 50 && (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-3">
                        <Leaf className="w-3 h-3" />
                        {plan.renewable_percentage}% Renewable
                      </div>
                    )}

                    <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm">
                      Check Availability
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* All Other Plans */}
          {otherPlans.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">All Available Plans</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherPlans.map((plan) => (
                  <Card key={plan.id} className="border hover:border-[#0A5C8C] hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-xs font-bold text-[#0A5C8C]">
                          {plan.provider_name.substring(0, 3).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm mb-1">{plan.provider_name}</h3>
                      <p className="text-xs text-gray-600 mb-3">{plan.plan_name}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Rate</span>
                          <span className="text-lg font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢/kWh</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Est. Bill</span>
                          <span className="text-sm font-bold text-gray-900">${calculateBill(plan)}/mo</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Term</span>
                          <span className="text-sm font-semibold text-gray-700">{plan.contract_length || 'Variable'} mo</span>
                        </div>
                      </div>

                      {plan.renewable_percentage >= 50 && (
                        <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-3">
                          <Leaf className="w-3 h-3" />
                          {plan.renewable_percentage}% Renewable
                        </div>
                      )}

                      <Button variant="outline" className="w-full text-sm">
                        Check Availability
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredPlans.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No plans match your preferences. Try adjusting your filters.</p>
              <Button onClick={() => { setShowResults(false); setStep(3); }} variant="outline">
                Adjust Preferences
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 1: ZIP Code
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#0A5C8C] rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter Your ZIP Code</h1>
            <p className="text-sm text-gray-600">We'll find the best electricity rates in your area</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Enter 5-digit ZIP code"
                  value={zipCode}
                  onChange={(e) => {
                    setZipCode(e.target.value.replace(/\D/g, ''));
                    setZipError("");
                  }}
                  maxLength={5}
                  className="h-12 text-center text-lg font-semibold"
                  onKeyPress={(e) => e.key === 'Enter' && handleZipSubmit()}
                />
                {zipError && (
                  <p className="text-xs text-red-600 mt-2">{zipError}</p>
                )}
              </div>

              <Button 
                onClick={handleZipSubmit}
                className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-12"
                disabled={zipCode.length !== 5}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Property Type
  if (step === 2) {
    const propertyTypes = [
      { value: 'home', label: 'Home', icon: Home, desc: 'Single family house' },
      { value: 'apartment', label: 'Apartment', icon: Building2, desc: 'Apartment or condo' },
      { value: 'business', label: 'Business', icon: Building2, desc: 'Commercial property' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#0A5C8C] rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">What Type of Property?</h1>
            <p className="text-sm text-gray-600">This helps us show you the most relevant plans</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {propertyTypes.map((type) => (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  propertyType === type.value 
                    ? 'border-2 border-[#0A5C8C] bg-blue-50' 
                    : 'border-2 border-transparent hover:border-gray-300'
                }`}
                onClick={() => setPropertyType(type.value)}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <type.icon className="w-6 h-6 text-[#0A5C8C]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{type.label}</h3>
                  <p className="text-xs text-gray-600">{type.desc}</p>
                  {propertyType === type.value && (
                    <CheckCircle className="w-5 h-5 text-[#0A5C8C] mx-auto mt-3" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            onClick={handlePropertyTypeSubmit}
            className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-12"
            disabled={!propertyType}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Plan Preferences
  if (step === 3) {
    const preferenceOptions = [
      { key: 'fixedRate', label: 'Fixed Rate Plans', icon: Clock, desc: 'Locked-in rates for contract term' },
      { key: 'variableRate', label: 'Variable Rate Plans', icon: Zap, desc: 'Rates change monthly' },
      { key: 'renewable', label: 'Renewable Energy', icon: Leaf, desc: '50%+ green energy' },
      { key: 'twelveMonth', label: '12 Month Plans', icon: Clock, desc: 'One year contracts' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#0A5C8C] rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">What Are You Looking For?</h1>
            <p className="text-sm text-gray-600">Select all that apply (or skip to see all plans)</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-3">
                {preferenceOptions.map((option) => (
                  <div
                    key={option.key}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      preferences[option.key]
                        ? 'border-[#0A5C8C] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => togglePreference(option.key)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        preferences[option.key]
                          ? 'bg-[#0A5C8C] border-[#0A5C8C]'
                          : 'border-gray-300'
                      }`}>
                        {preferences[option.key] && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <option.icon className="w-5 h-5 text-[#0A5C8C]" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handlePreferencesSubmit}
            className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-12"
          >
            Show My Rates
          </Button>
        </div>
      </div>
    );
  }

  return null;
}