import React from "react";
import { ElectricityProvider } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Leaf, DollarSign, ExternalLink, Heart } from "lucide-react";

export default function PlanCard({ plan, usage, estimatedMonthlyCost, isSaved, onToggleSave, rank, isTopPick, monthlyUsage }) {
  const usageValue = parseInt(usage || monthlyUsage || 1000);
  const cost = estimatedMonthlyCost || (plan.rate_per_kwh * usageValue / 100 + (plan.monthly_base_charge || 0)).toFixed(2);

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => ElectricityProvider.filter({ is_active: true }),
    initialData: [],
  });

  const provider = providers.find(p => p.name === plan.provider_name);
  const affiliateLink = provider?.affiliate_url || provider?.website_url || "#";

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#0A5C8C] relative group">
      {/* Save Button */}
      <button
        onClick={onToggleSave}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        aria-label={isSaved ? "Remove from saved plans" : "Save plan"}
      >
        <Heart 
          className={`w-4 h-4 transition-colors ${
            isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
          }`}
        />
      </button>

      <div className="grid md:grid-cols-4 gap-5 items-center">
        {/* Provider & Plan Info */}
        <div className="md:col-span-2">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-blue-100 group-hover:to-green-100 transition-colors">
              <span className="text-xs font-bold text-[#0A5C8C]">
                {plan.provider_name.substring(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-gray-900 mb-0.5 truncate">
                {plan.plan_name}
              </h3>
              <p className="text-xs text-gray-600 mb-2">{plan.provider_name}</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.plan_type && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 capitalize">
                    {plan.plan_type}
                  </Badge>
                )}
                {plan.renewable_percentage >= 50 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-2 py-0.5">
                    <Leaf className="w-3 h-3 mr-0.5" />
                    {plan.renewable_percentage}% Green
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rate Info */}
        <div className="text-center md:text-left">
          <div className="mb-1.5">
            <div className="text-2xl font-bold text-[#0A5C8C]">
              {plan.rate_per_kwh.toFixed(1)}¢
            </div>
            <div className="text-xs text-gray-500">per kWh</div>
          </div>
          <div className="text-xs text-gray-600 flex items-center justify-center md:justify-start gap-1">
            <Clock className="w-3 h-3" />
            {plan.contract_length} months
          </div>
        </div>

        {/* Estimated Cost & CTA */}
        <div className="text-center md:text-right">
          <div className="mb-2.5">
            <div className="text-xl font-bold text-gray-900">
              ${cost}
            </div>
            <div className="text-xs text-gray-500">est. @ {usageValue} kWh/mo</div>
          </div>
          <a 
            href={affiliateLink} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button size="sm" className="w-full md:w-auto bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-xs px-4">
              View Details
              <ExternalLink className="w-3 h-3 ml-1.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Additional Info */}
      {plan.features && plan.features.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {plan.features.slice(0, 3).map((feature, index) => (
              <span key={index} className="text-xs text-gray-600 flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#0A5C8C]" />
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}