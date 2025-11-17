import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-[#0A5C8C] opacity-10 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 bg-[#FF6B35] opacity-20 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <Zap className="absolute inset-0 m-auto w-16 h-16 text-[#0A5C8C]" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track to finding the best electricity rates!
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link to={createPageUrl("Home")}>
            <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-12 font-semibold">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link to={createPageUrl("CompareRates")}>
            <Button className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white h-12 font-semibold">
              <Search className="w-4 h-4 mr-2" />
              Compare Rates
            </Button>
          </Link>
        </div>

        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Pages</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Link to={createPageUrl("AllStates")} className="text-[#0A5C8C] hover:underline">
                Service Areas
              </Link>
              <Link to={createPageUrl("AllProviders")} className="text-[#0A5C8C] hover:underline">
                All Providers
              </Link>
              <Link to={createPageUrl("LearningCenter")} className="text-[#0A5C8C] hover:underline">
                Learning Center
              </Link>
              <Link to={createPageUrl("FAQ")} className="text-[#0A5C8C] hover:underline">
                FAQ
              </Link>
              <Link to={createPageUrl("BusinessElectricity")} className="text-[#0A5C8C] hover:underline">
                Business Rates
              </Link>
              <Link to={createPageUrl("RenewableEnergy")} className="text-[#0A5C8C] hover:underline">
                Green Energy
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Link to={createPageUrl("Home")} className="text-sm text-gray-600 hover:text-[#0A5C8C] inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}