import React from "react";
import { AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function DataDisclaimer({ variant = "default" }) {
  if (variant === "compact") {
    return (
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-900 leading-relaxed">
          <strong>Disclaimer:</strong> Rates and availability shown are for comparison purposes and based on publicly available data. 
          Actual rates may vary by location and are subject to change. Please verify current rates and plan details directly with providers before enrolling.
        </p>
      </div>
    );
  }

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 mb-2">Important Disclaimer</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              The electricity rates, plan details, provider availability, and savings estimates displayed on this website 
              are for informational and comparison purposes only. This data is based on publicly available information and 
              may not reflect the most current rates or offerings. Actual rates, plan availability, terms, and conditions 
              vary by location, usage level, credit score, and provider. All rates are subject to change without notice. 
              We strongly recommend verifying all plan details, pricing, and availability directly with electricity providers 
              before making enrollment decisions. Power Scouts does not guarantee the accuracy of displayed rates or the 
              availability of specific plans in your area.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Footer disclaimer for all pages
export function FooterDisclaimer() {
  return (
    <div className="bg-gray-100 border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-gray-600 text-center leading-relaxed">
          <strong>Disclaimer:</strong> Electricity rates, plan details, and provider actual rates vary by ZIP code, usage, credit, and are subject to change. Verify all details with providers before enrollment. Power Scouts is a comparison service and does not guarantee rate accuracy or plan availability. Savings estimates are based on average usage and market conditions.
        </p>
      </div>
    </div>
  );
}