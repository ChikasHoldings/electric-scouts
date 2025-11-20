import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, Zap, Users, Award, Building, DollarSign } from "lucide-react";

export default function LocationInsights({ stateData, cityData = null }) {
  if (!stateData) return null;

  const displayData = cityData || stateData.marketInsights;
  const facts = cityData ? [
    `Average rate: ${cityData.avgRate}`,
    `Typical usage: ${cityData.avgUsage}`,
    `Utility: ${cityData.utilityCompany}`,
    `Population: ${cityData.population}`
  ] : stateData.marketInsights.keyFacts;

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card className="border-2 border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {cityData ? 'Local Market Insights' : 'Market Overview'}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {cityData ? cityData.insights : stateData.marketInsights.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stateData.marketInsights.averageSavings}
            </div>
            <div className="text-xs text-gray-600">Avg. Savings/Year</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stateData.marketInsights.providerCount}
            </div>
            <div className="text-xs text-gray-600">Providers</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stateData.marketInsights.marketType.split(' ')[0]}
            </div>
            <div className="text-xs text-gray-600">Market Type</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {cityData ? cityData.avgRate : stateData.topProviders[0]?.avgRate}
            </div>
            <div className="text-xs text-gray-600">
              {cityData ? 'Avg. Rate' : 'Starting Rate'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Facts */}
      <Card className="bg-gradient-to-br from-gray-50 to-blue-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Key Facts
          </h3>
          <ul className="space-y-2">
            {facts.map((fact, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <span className="text-gray-700">{fact}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}