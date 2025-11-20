import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Zap, TrendingDown, Award, Leaf, ArrowRight, Calculator } from "lucide-react";
import { getStateData, getCityData } from "../components/location/locationData";
import { validateZipCode } from "../components/compare/stateData";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEOHead from "../components/SEOHead";

export default function SavingsCalculator() {
  const [currentRate, setCurrentRate] = useState("");
  const [monthlyUsage, setMonthlyUsage] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [results, setResults] = useState(null);

  const calculateSavings = () => {
    if (!currentRate || !monthlyUsage || !zipCode || zipCode.length !== 5) return;

    const zipValidation = validateZipCode(zipCode);
    if (!zipValidation.valid) {
      alert(zipValidation.error);
      return;
    }

    const stateCode = zipValidation.state;
    const stateData = getStateData(stateCode);
    if (!stateData) return;

    const userCurrentRate = parseFloat(currentRate);
    const userUsage = parseFloat(monthlyUsage);

    // Calculate average market rate from top providers
    const avgMarketRate = stateData.topProviders.reduce((sum, p) => {
      return sum + parseFloat(p.avgRate.replace('¢/kWh', ''));
    }, 0) / stateData.topProviders.length;

    // Calculate current annual cost
    const currentMonthlyCost = (userCurrentRate * userUsage) / 100;
    const currentAnnualCost = currentMonthlyCost * 12;

    // Calculate potential new cost with best market rate
    const bestMarketRate = Math.min(...stateData.topProviders.map(p => parseFloat(p.avgRate.replace('¢/kWh', ''))));
    const potentialMonthlyCost = (bestMarketRate * userUsage) / 100;
    const potentialAnnualCost = potentialMonthlyCost * 12;

    // Calculate savings
    const annualSavings = currentAnnualCost - potentialAnnualCost;
    const monthlySavings = annualSavings / 12;
    const percentageSavings = ((annualSavings / currentAnnualCost) * 100).toFixed(1);

    // Determine best plan types based on usage and location
    const recommendations = [];

    // Fixed-rate recommendation (high usage or high rates)
    if (userUsage > 800 || userCurrentRate > avgMarketRate) {
      recommendations.push({
        type: "Fixed-Rate",
        icon: Award,
        reason: userUsage > 800 
          ? "Your high usage makes a fixed-rate plan ideal for budget certainty and protection from market volatility."
          : "Your current rate is above market average. Lock in a lower fixed rate now.",
        savingsPotential: "High",
        providers: stateData.topProviders.filter(p => p.specialty.toLowerCase().includes('fixed')).slice(0, 2)
      });
    }

    // Green energy recommendation (based on state trends)
    if (['MA', 'NY', 'CA', 'CT', 'RI'].includes(stateCode) || userUsage < 700) {
      recommendations.push({
        type: "Green Energy",
        icon: Leaf,
        reason: "100% renewable plans in your area are competitively priced and help reduce carbon footprint without premium costs.",
        savingsPotential: "Medium",
        providers: stateData.topProviders.filter(p => 
          p.specialty.toLowerCase().includes('renewable') || p.specialty.toLowerCase().includes('green')
        ).slice(0, 2)
      });
    }

    // Variable-rate recommendation (moderate usage)
    if (userUsage >= 500 && userUsage <= 1000 && !['NY', 'MA'].includes(stateCode)) {
      recommendations.push({
        type: "Variable-Rate",
        icon: TrendingDown,
        reason: "Market rates in your area are competitive. A variable plan could offer lower introductory rates with flexibility.",
        savingsPotential: "Medium-High",
        providers: stateData.topProviders.slice(0, 2)
      });
    }

    // Long-term contract (very high usage)
    if (userUsage > 1200) {
      recommendations.push({
        type: "Long-Term Contract",
        icon: Award,
        reason: "Your high consumption qualifies for volume discounts. 24-36 month contracts offer the best per-kWh rates.",
        savingsPotential: "Very High",
        providers: stateData.topProviders.filter(p => 
          p.specialty.toLowerCase().includes('long-term') || p.specialty.toLowerCase().includes('contract')
        ).slice(0, 2)
      });
    }

    setResults({
      currentAnnualCost: currentAnnualCost.toFixed(2),
      potentialAnnualCost: potentialAnnualCost.toFixed(2),
      annualSavings: Math.max(0, annualSavings).toFixed(2),
      monthlySavings: Math.max(0, monthlySavings).toFixed(2),
      percentageSavings: Math.max(0, percentageSavings),
      bestMarketRate: bestMarketRate.toFixed(2),
      avgMarketRate: avgMarketRate.toFixed(2),
      stateName: stateData.state,
      stateCode: stateCode,
      recommendations: recommendations.length > 0 ? recommendations : [{
        type: "Competitive Market Plans",
        icon: Zap,
        reason: "Shop around for competitive rates in your area to maximize savings.",
        savingsPotential: "Medium",
        providers: stateData.topProviders.slice(0, 2)
      }]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Electricity Savings Calculator - Predict Your Annual Savings | Power Scouts"
        description="Calculate how much you can save on electricity bills. Input your current rate and usage to get personalized savings estimates and plan recommendations for your state."
        keywords="electricity savings calculator, energy bill calculator, electricity cost calculator, power savings estimator, electricity rate comparison calculator"
        canonical="/savings-calculator"
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">
            Electricity Savings Calculator
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Discover how much you could save by switching electricity providers. Get personalized plan recommendations for your area.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!results ? (
          <Card className="border-2 border-blue-100">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Calculate Your Potential Savings
              </h2>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Your Current Electricity Rate (¢/kWh)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 12.5"
                      value={currentRate}
                      onChange={(e) => setCurrentRate(e.target.value)}
                      className="text-lg h-12 pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ¢/kWh
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Check your latest electricity bill for your current rate per kWh
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Average Monthly Usage (kWh)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="e.g., 1000"
                      value={monthlyUsage}
                      onChange={(e) => setMonthlyUsage(e.target.value)}
                      className="text-lg h-12 pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      kWh
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Find this on your monthly bill (typical home: 800-1200 kWh)
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Your ZIP Code
                  </Label>
                  <Input
                    type="text"
                    maxLength={5}
                    placeholder="e.g., 75001"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    We'll find the best rates and recommendations for your area
                  </p>
                </div>

                <Button
                  onClick={calculateSavings}
                  disabled={!currentRate || !monthlyUsage || zipCode.length !== 5}
                  className="w-full h-14 text-lg font-bold bg-[#FF6B35] hover:bg-[#e55a2b] text-white"
                >
                  Calculate My Savings
                  <Calculator className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Savings Summary */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Your Potential Savings in {results.stateName}
                  </h2>
                  <p className="text-gray-600">
                    Based on market rates from {results.stateName} providers
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-1">
                      ${results.annualSavings}
                    </div>
                    <div className="text-sm text-gray-600">Potential Annual Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-1">
                      ${results.monthlySavings}
                    </div>
                    <div className="text-sm text-gray-600">Per Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-1">
                      {results.percentageSavings}%
                    </div>
                    <div className="text-sm text-gray-600">Percentage Savings</div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Current Annual Cost:</span>
                      <span className="font-bold text-gray-900">${results.currentAnnualCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Potential Annual Cost:</span>
                      <span className="font-bold text-green-600">${results.potentialAnnualCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Market Rate:</span>
                      <span className="font-bold text-blue-600">{results.bestMarketRate}¢/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Market Rate:</span>
                      <span className="font-bold text-gray-900">{results.avgMarketRate}¢/kWh</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Plan Types */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Recommended Plan Types for You
              </h3>
              <div className="grid gap-4">
                {results.recommendations.map((rec, index) => {
                  const Icon = rec.icon;
                  return (
                    <Card key={index} className="border border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{rec.type}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                rec.savingsPotential.includes('High') 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {rec.savingsPotential} Savings
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mb-3">{rec.reason}</p>
                            {rec.providers && rec.providers.length > 0 && (
                              <div className="text-xs text-gray-600">
                                <span className="font-semibold">Top providers: </span>
                                {rec.providers.map(p => p.name).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] border-0">
              <CardContent className="p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-2">Ready to Start Saving?</h3>
                <p className="text-blue-100 mb-6">
                  Compare plans from top providers in {results.stateName} and lock in your savings today
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to={createPageUrl("CompareRates") + `?zip=${zipCode}`}>
                    <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 h-12">
                      Compare Rates Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setResults(null)}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12"
                  >
                    Calculate Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How It Works */}
        {!results && (
          <Card className="mt-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                How It Works
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-blue-600">1</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Enter Your Info</h4>
                  <p className="text-sm text-gray-600">
                    Share your current rate, usage, and ZIP code
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-blue-600">2</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Get Analysis</h4>
                  <p className="text-sm text-gray-600">
                    We compare your rate to market averages in your area
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl font-bold text-blue-600">3</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">See Recommendations</h4>
                  <p className="text-sm text-gray-600">
                    Receive personalized plan type suggestions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}