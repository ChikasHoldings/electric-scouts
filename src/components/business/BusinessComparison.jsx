import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Award, CheckCircle } from "lucide-react";

const businessTiers = [
  {
    name: "Small Business",
    range: "< 10,000 kWh/month",
    examples: ["Retail stores", "Small offices", "Restaurants", "Salons"],
    avgRate: "11.5¢/kWh",
    avgSavings: "$1,800/year",
    topFeatures: ["No long-term commitment", "Month-to-month options", "Quick approval"],
    color: "blue"
  },
  {
    name: "Medium Business",
    range: "10,000 - 50,000 kWh/month",
    examples: ["Warehouses", "Medical offices", "Hotels", "Large retail"],
    avgRate: "10.2¢/kWh",
    avgSavings: "$4,500/year",
    topFeatures: ["Volume discounts", "Flexible terms", "Dedicated support"],
    color: "green",
    popular: true
  },
  {
    name: "Large Business",
    range: "> 50,000 kWh/month",
    examples: ["Manufacturing", "Data centers", "Hospitals", "Multi-location"],
    avgRate: "8.9¢/kWh",
    avgSavings: "$12,000/year",
    topFeatures: ["Custom contracts", "Peak demand pricing", "Portfolio management"],
    color: "purple"
  }
];

export default function BusinessComparison() {
  const [selectedTier, setSelectedTier] = useState("Medium Business");

  const selectedData = businessTiers.find(t => t.name === selectedTier);

  return (
    <div className="space-y-6">
      {/* Tier Selection */}
      <div className="grid md:grid-cols-3 gap-4">
        {businessTiers.map((tier, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              selectedTier === tier.name
                ? 'border-2 border-blue-500 shadow-lg'
                : 'border-2 border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedTier(tier.name)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{tier.name}</h3>
                  <p className="text-sm text-gray-600">{tier.range}</p>
                </div>
                {tier.popular && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    Popular
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-600">Avg Rate:</span>
                  <span className="text-lg font-bold text-blue-600">{tier.avgRate}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-600">Avg Savings:</span>
                  <span className="text-sm font-bold text-green-600">{tier.avgSavings}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {selectedData && (
        <Card className="border-2 border-blue-200">
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedData.name} Plans
                </h3>
                
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-5 mb-6">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Typical Business Types:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedData.examples.map((example, i) => (
                      <Badge key={i} variant="outline" className="bg-white">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Average Rate</div>
                      <div className="text-2xl font-bold text-blue-600">{selectedData.avgRate}</div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Estimated Savings</div>
                      <div className="text-2xl font-bold text-green-600">{selectedData.avgSavings}</div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">
                  Key Features & Benefits
                </h4>
                <div className="space-y-3 mb-6">
                  {selectedData.topFeatures.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-6 text-white">
                  <h5 className="font-bold mb-2">Ready to Compare Plans?</h5>
                  <p className="text-sm text-gray-300 mb-4">
                    Get personalized quotes from top providers for {selectedData.name.toLowerCase()}s
                  </p>
                  <Link to="/business-compare-rates">
                    <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                      Get Custom Quote
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}