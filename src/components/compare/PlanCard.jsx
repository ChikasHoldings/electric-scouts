import React from "react";
import { ElectricityProvider } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, Leaf, DollarSign, ExternalLink, Heart, Shield, Award, Wind, Sun, AlertTriangle } from "lucide-react";
import { useAffiliateLinks } from "@/hooks/useAffiliateLink";
import { getProviderLogoUrl } from "@/utils/providerSlug";

export default function PlanCard({ plan, usage, estimatedMonthlyCost, isSaved, onToggleSave, rank, isTopPick, monthlyUsage }) {
  const usageValue = parseInt(usage || monthlyUsage || 1000);
  const cost = estimatedMonthlyCost || (plan.rate_per_kwh * usageValue / 100 + (plan.monthly_base_charge || 0)).toFixed(2);

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => ElectricityProvider.filter({ is_active: true }),
    placeholderData: [],
  });

  const provider = providers.find(p => p.name === plan.provider_name);
  const { getAffiliateUrl } = useAffiliateLinks();
  const affiliateLink = getAffiliateUrl({
    providerId: provider?.id,
    offerId: plan.id,
    fallbackUrl: provider?.affiliate_url || provider?.website_url || "#"
  });

  const logoUrl = provider ? getProviderLogoUrl(provider) : null;
  const isRenewable = plan.renewable_percentage && plan.renewable_percentage >= 50;
  const is100Renewable = plan.renewable_percentage && plan.renewable_percentage >= 100;
  const hasETF = plan.early_termination_fee && plan.early_termination_fee > 0;
  const isBusiness = (plan.customer_type || '').toLowerCase() === 'business';
  const isVariable = plan.plan_type === 'variable';
  const isFixed = plan.plan_type === 'fixed';

  // Determine the accent color based on plan type
  const accentColor = is100Renewable ? 'green' : isBusiness ? 'blue' : 'blue';
  const accentClasses = {
    green: {
      border: 'hover:border-green-500',
      bg: 'from-green-50 to-emerald-50',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800',
      icon: 'text-green-600',
      rate: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
    },
    blue: {
      border: 'hover:border-[#0A5C8C]',
      bg: 'from-blue-50 to-sky-50',
      text: 'text-[#0A5C8C]',
      badge: 'bg-blue-100 text-blue-800',
      icon: 'text-[#0A5C8C]',
      rate: 'text-[#0A5C8C]',
      button: 'bg-[#FF6B35] hover:bg-[#e55a2b]',
    }
  };
  const colors = accentClasses[accentColor];

  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 ${colors.border} relative group`}>
      {/* Top Pick Badge */}
      {isTopPick && (
        <div className="absolute -top-3 left-4 z-10">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Award className="w-3 h-3" />
            Top Pick #{rank}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={onToggleSave}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
        aria-label={isSaved ? "Remove from saved plans" : "Save plan"}
      >
        <Heart 
          className={`w-4 h-4 transition-colors ${
            isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
          }`}
        />
      </button>

      <div className="grid md:grid-cols-12 gap-4 items-center">
        {/* Provider Logo & Plan Info - 5 cols */}
        <div className="md:col-span-5">
          <div className="flex items-start gap-3">
            {/* Provider Logo */}
            <div className={`w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-100 group-hover:shadow-sm transition-all`}>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={plan.provider_name} 
                  className="w-10 h-10 object-contain rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                loading="lazy" />
              ) : null}
              <span 
                className={`text-sm font-bold ${colors.text} ${logoUrl ? 'hidden' : 'flex'}`}
                style={{ display: logoUrl ? 'none' : 'flex' }}
              >
                {plan.provider_name.substring(0, 3).toUpperCase()}
              </span>
            </div>
            
            {/* Plan Details */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-gray-900 mb-0.5 leading-tight">
                {plan.plan_name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">{plan.provider_name}</p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {isFixed && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 font-medium">
                    <Shield className="w-2.5 h-2.5 mr-0.5" />
                    Fixed Rate
                  </Badge>
                )}
                {isVariable && (
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 font-medium">
                    Variable
                  </Badge>
                )}
                {is100Renewable && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 font-medium">
                    <Leaf className="w-2.5 h-2.5 mr-0.5" />
                    100% Green
                  </Badge>
                )}
                {isRenewable && !is100Renewable && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 font-medium">
                    <Leaf className="w-2.5 h-2.5 mr-0.5" />
                    {plan.renewable_percentage}% Green
                  </Badge>
                )}
                {isBusiness && (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 font-medium">
                    Business
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rate & Contract Info - 3 cols */}
        <div className="md:col-span-3">
          <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-1">
            <div>
              <div className={`text-2xl font-extrabold ${colors.rate} leading-none`}>
                {plan.rate_per_kwh > 0 ? `${plan.rate_per_kwh.toFixed(1)}¢` : 'Varies'}
              </div>
              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">per kWh</div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{plan.contract_length > 0 ? `${plan.contract_length} mo` : 'No contract'}</span>
              </div>
              {hasETF && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600" title={`Early termination fee: $${plan.early_termination_fee}`}>
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>${plan.early_termination_fee} ETF</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Estimated Cost & CTA - 4 cols */}
        <div className="md:col-span-4 flex flex-col items-center md:items-end gap-2">
          <div className="text-center md:text-right">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Est. Monthly</div>
            <div className="text-xl font-extrabold text-gray-900 leading-tight">
              ${cost}
            </div>
            <div className="text-[10px] text-gray-400">at {usageValue.toLocaleString()} kWh/mo</div>
          </div>
          <a 
            href={affiliateLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full md:w-auto"
          >
            <Button size="sm" className={`w-full md:w-auto ${colors.button} text-white text-xs px-5 py-2 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all`}>
              View Plan
              <ExternalLink className="w-3 h-3 ml-1.5" />
            </Button>
          </a>
        </div>
      </div>

      {/* Features Row */}
      {plan.features && plan.features.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {plan.features.slice(0, 4).map((feature, index) => (
              <span key={index} className="text-[11px] text-gray-500 flex items-center gap-1">
                <Zap className={`w-3 h-3 ${colors.icon}`} />
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
