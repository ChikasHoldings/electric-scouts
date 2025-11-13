import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MapPin, SlidersHorizontal, Zap, Heart, Star } from "lucide-react";
import PlanCard from "../components/compare/PlanCard";
import FiltersPanel from "../components/compare/FiltersPanel";
import SavedPlansModal from "../components/compare/SavedPlansModal";
import ComparisonWizard from "../components/compare/ComparisonWizard";
import SEOHead, { getServiceSchema, getBreadcrumbSchema } from "../components/SEOHead";

export default function CompareRates() {
  const [showWizard, setShowWizard] = useState(true);
  const [wizardCompleted, setWizardCompleted] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [usage, setUsage] = useState(1000);
  const [filters, setFilters] = useState({
    planType: "all",
    contractLength: "all",
    contractLengthMin: null,
    contractLengthMax: null,
    renewable: false,
    renewableMin: 0,
    noEarlyTerminationFee: false,
    sortBy: "rate"
  });
  const [savedPlans, setSavedPlans] = useState(() => {
    const saved = localStorage.getItem('savedPlans');
    return saved ? JSON.parse(saved) : [];
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);

  // Get ZIP from URL and check if wizard should be shown
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const zipFromUrl = urlParams.get('zip');
    const skipWizard = urlParams.get('skipWizard');
    
    if (zipFromUrl) {
      setZipCode(zipFromUrl);
      setWizardCompleted(true);
      setShowWizard(false);
    } else if (skipWizard === 'true') {
      setShowWizard(false);
      setWizardCompleted(true);
    }
  }, []);

  const handleWizardComplete = (formData) => {
    setZipCode(formData.zipCode);
    setUsage(formData.usage);
    setWizardCompleted(true);
    setShowWizard(false);
    
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('zip', formData.zipCode);
    window.history.pushState({}, '', url);
  };

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  // Save/unsave plan handlers
  const toggleSavePlan = (plan) => {
    const isSaved = savedPlans.some(p => p.id === plan.id);
    let newSaved;
    if (isSaved) {
      newSaved = savedPlans.filter(p => p.id !== plan.id);
    } else {
      newSaved = [...savedPlans, plan];
    }
    setSavedPlans(newSaved);
    localStorage.setItem('savedPlans', JSON.stringify(newSaved));
  };

  const isPlanSaved = (planId) => savedPlans.some(p => p.id === planId);

  const structuredData = [
    getServiceSchema(),
    getBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Compare Rates", url: "/compare-rates" }
    ])
  ];

  // Filter and sort plans
  const filteredPlans = plans
    .filter(plan => {
      // Plan type filter
      if (filters.planType !== "all" && plan.plan_type !== filters.planType) return false;
      
      // Exact contract length filter
      if (filters.contractLength !== "all") {
        const length = parseInt(filters.contractLength);
        if (plan.contract_length !== length) return false;
      }
      
      // Contract length range filter
      if (filters.contractLengthMin !== null && (plan.contract_length || 0) < filters.contractLengthMin) return false;
      if (filters.contractLengthMax !== null && (plan.contract_length || 0) > filters.contractLengthMax) return false;
      
      // Renewable energy filters
      if (filters.renewable && (!plan.renewable_percentage || plan.renewable_percentage < 50)) return false;
      if (filters.renewableMin > 0 && (plan.renewable_percentage || 0) < filters.renewableMin) return false;
      
      // No early termination fee filter
      if (filters.noEarlyTerminationFee && plan.early_termination_fee > 0) return false;
      
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === "rate") return a.rate_per_kwh - b.rate_per_kwh;
      if (filters.sortBy === "contract") return (a.contract_length || 0) - (b.contract_length || 0);
      if (filters.sortBy === "renewable") return (b.renewable_percentage || 0) - (a.renewable_percentage || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Compare Electricity Rates by ZIP Code - Find Best Plans | Power Scouts"
        description="Enter your ZIP code to compare electricity rates from 40+ providers. View fixed, variable, and renewable energy plans. Filter by price, contract length, and more. Free instant comparison."
        keywords="compare electricity rates, electricity rate comparison, best electricity plans, cheap electricity, fixed rate electricity, variable rate plans"
        canonical="/compare-rates"
        structuredData={structuredData}
      />
      {/* Show Wizard or Results */}
      {showWizard && !wizardCompleted ? (
        <div className="bg-gradient-to-b from-gray-50 to-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Find Your Perfect Electricity Plan
              </h1>
              <p className="text-xl text-gray-600">
                Answer 4 quick questions to see personalized rates
              </p>
            </div>
            <ComparisonWizard onComplete={handleWizardComplete} />
          </div>
        </div>
      ) : (
        <>
          {/* Header Section */}
          <div className="bg-[#0A5C8C] text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-4xl lg:text-5xl font-bold">
                  Compare Electricity Rates
                </h1>
                {wizardCompleted && (
                  <Button
                    onClick={() => {
                      setShowWizard(true);
                      setWizardCompleted(false);
                    }}
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                  >
                    Start Over
                  </Button>
                )}
              </div>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-xl p-3 max-w-4xl">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 text-gray-900 p-0 h-auto"
                  maxLength={5}
                />
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <Zap className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">Monthly Usage: {usage} kWh</div>
                  <Slider
                    value={[usage]}
                    onValueChange={(value) => setUsage(value[0])}
                    min={500}
                    max={3000}
                    step={100}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="bg-white hover:bg-gray-50 text-gray-900 border-2"
                >
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filters
                </Button>
                <Button
                  onClick={() => setShowSavedPlans(true)}
                  variant="outline"
                  className="bg-white hover:bg-gray-50 text-gray-900 border-2 relative"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Saved ({savedPlans.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <FiltersPanel filters={filters} setFilters={setFilters} />
          </div>

          {/* Plans Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredPlans.length}</span> plans
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredPlans.length > 0 ? (
              <div className="space-y-4">
                {filteredPlans.map((plan) => (
                  <PlanCard 
                    key={plan.id} 
                    plan={plan} 
                    usage={usage}
                    isSaved={isPlanSaved(plan.id)}
                    onToggleSave={() => toggleSavePlan(plan)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No plans found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

          {/* Saved Plans Modal */}
          <SavedPlansModal
            isOpen={showSavedPlans}
            onClose={() => setShowSavedPlans(false)}
            savedPlans={savedPlans}
            usage={usage}
            onToggleSave={toggleSavePlan}
            isPlanSaved={isPlanSaved}
          />
        </>
      )}
    </div>
  );
}