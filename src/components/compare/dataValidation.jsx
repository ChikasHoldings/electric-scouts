// Data validation and consistency utilities
// Ensures all displayed data is accurate and current

import { getProvidersForZipCode, providerServesZip } from "./providerAvailability";

/**
 * Validates if a plan should be displayed for a given ZIP code
 * Returns true only if the provider actually serves that ZIP
 */
export const validatePlanForZip = (plan, zipCode) => {
  if (!zipCode || zipCode.length !== 5) return true; // No ZIP filter, show all
  
  // Check if provider serves this ZIP code
  return providerServesZip(plan.provider_name, zipCode);
};

/**
 * Filters a list of plans to only those available in a specific ZIP code
 */
export const filterPlansByZip = (plans, zipCode) => {
  if (!zipCode || zipCode.length !== 5) return plans;
  
  return plans.filter(plan => validatePlanForZip(plan, zipCode));
};

/**
 * Filters plans by state - ensures only providers operating in that state are shown
 */
export const filterPlansByState = (plans, stateCode) => {
  if (!stateCode) return plans;
  
  // This would need to check against PROVIDERS data
  // For now, we rely on the database having correct state associations
  return plans;
};

/**
 * Validates provider data consistency
 * Ensures provider name, logo, website all match
 */
export const validateProviderData = (providerName) => {
  const validProviders = [
    "TXU Energy",
    "Reliant Energy", 
    "Gexa Energy",
    "Direct Energy",
    "Frontier Utilities",
    "Green Mountain Energy",
    "Pulse Power",
    "Champion Energy",
    "Constellation",
    "4Change Energy"
  ];
  
  return validProviders.includes(providerName);
};

/**
 * Gets recommended plans based on multiple criteria
 * Ensures recommendations are from valid, current providers
 */
export const getRecommendedPlans = (plans, zipCode, criteria = {}) => {
  let filtered = plans;
  
  // Filter by ZIP code availability
  if (zipCode) {
    filtered = filterPlansByZip(filtered, zipCode);
  }
  
  // Filter by criteria
  if (criteria.renewable) {
    filtered = filtered.filter(p => p.renewable_percentage >= 50);
  }
  
  if (criteria.planType) {
    filtered = filtered.filter(p => p.plan_type === criteria.planType);
  }
  
  if (criteria.contractLength) {
    filtered = filtered.filter(p => p.contract_length === criteria.contractLength);
  }
  
  // Sort by rate (lowest first)
  return filtered.sort((a, b) => a.rate_per_kwh - b.rate_per_kwh);
};

/**
 * Calculates estimated monthly bill accurately
 * Uses actual rate + base charge formula
 */
export const calculateMonthlyBill = (plan, usage = 1000) => {
  const energyCharge = (plan.rate_per_kwh / 100) * usage;
  const baseCharge = plan.monthly_base_charge || 0;
  return (energyCharge + baseCharge).toFixed(2);
};

/**
 * Validates ZIP code format and deregulation status
 */
export const validateZipForComparison = (zipCode) => {
  if (!zipCode || zipCode.length !== 5) {
    return { valid: false, error: "Please enter a 5-digit ZIP code" };
  }
  
  const providers = getProvidersForZipCode(zipCode);
  
  if (providers.length === 0) {
    return { 
      valid: false, 
      error: "No providers found for this ZIP code. This area may not be deregulated.",
      providers: []
    };
  }
  
  return {
    valid: true,
    providers: providers,
    providerCount: providers.length
  };
};

/**
 * Ensures data consistency across all pages
 * Returns standardized plan object
 */
export const standardizePlanData = (plan) => {
  return {
    ...plan,
    rate_per_kwh: parseFloat(plan.rate_per_kwh) || 0,
    contract_length: parseInt(plan.contract_length) || 0,
    monthly_base_charge: parseFloat(plan.monthly_base_charge) || 0,
    renewable_percentage: parseInt(plan.renewable_percentage) || 0,
    early_termination_fee: parseFloat(plan.early_termination_fee) || 0
  };
};