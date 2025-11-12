import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { MapPin, SlidersHorizontal, Zap } from "lucide-react";
import PlanCard from "../components/compare/PlanCard";
import FiltersPanel from "../components/compare/FiltersPanel";

export default function CompareRates() {
  const [zipCode, setZipCode] = useState("");
  const [usage, setUsage] = useState(1000);
  const [filters, setFilters] = useState({
    planType: "all",
    contractLength: "all",
    renewable: false,
    sortBy: "rate"
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get ZIP from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const zipFromUrl = urlParams.get('zip');
    if (zipFromUrl) {
      setZipCode(zipFromUrl);
    }
  }, []);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  // Filter and sort plans
  const filteredPlans = plans
    .filter(plan => {
      if (filters.planType !== "all" && plan.plan_type !== filters.planType) return false;
      if (filters.contractLength !== "all") {
        const length = parseInt(filters.contractLength);
        if (plan.contract_length !== length) return false;
      }
      if (filters.renewable && (!plan.renewable_percentage || plan.renewable_percentage < 50)) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === "rate") return a.rate_per_kwh - b.rate_per_kwh;
      if (filters.sortBy === "contract") return (a.contract_length || 0) - (b.contract_length || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Compare Electricity Rates
          </h1>
          
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

              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-900 border-2"
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filters
              </Button>
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
                  <PlanCard key={plan.id} plan={plan} usage={usage} />
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
    </div>
  );
}