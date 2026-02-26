import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, TrendingUp, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getProviderPageUrl } from "@/utils/providerSlug";

export default function TopProviders({ providers, locationName }) {
  if (!providers || providers.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Top Providers in {locationName}
        </h3>
      </div>

      <div className="grid gap-4">
        {providers.map((provider, index) => (
          <Card key={index} className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{provider.name}</h4>
                      {index === 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    <div>
                      <div className="text-xs text-gray-600">Market Share</div>
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        {provider.marketShare}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Avg. Rate</div>
                      <div className="text-sm font-semibold text-blue-600">
                        {provider.avgRate}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Specialty</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {provider.specialty}
                      </div>
                    </div>
                  </div>
                </div>

                <Link to={getProviderPageUrl(provider.name)}>
                  <Button size="sm" variant="outline" className="flex-shrink-0">
                    View Plans
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="text-white">
              <p className="font-semibold mb-1">Ready to compare all providers?</p>
              <p className="text-xs text-blue-100">See personalized rates in seconds</p>
            </div>
            <Link to={createPageUrl("CompareRates")}>
              <Button className="bg-white text-blue-600 hover:bg-blue-50">
                Compare Rates
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}