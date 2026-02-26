// Internal debugging pipeline - DO NOT IMPORT IN PRODUCTION UI
// This file is for diagnostics only

import { ElectricityProvider, ElectricityPlan } from "@/api/supabaseEntities";
import { getStateFromZip, getCityFromZip } from "./providerAvailability";

export async function debugCompareRatesPipeline(zipCode) {
  const debug = {
    timestamp: new Date().toISOString(),
    zipCode,
    stages: {},
    errors: [],
    warnings: [],
    passed: false
  };

  try {
    // STAGE A: ZIP Resolution
    console.log("=== STAGE A: ZIP RESOLUTION ===");
    const stateCode = getStateFromZip(zipCode);
    const cityName = getCityFromZip(zipCode);
    debug.stages.zipResolution = {
      zipCode,
      stateCode,
      cityName,
      passed: !!stateCode
    };
    console.log("ZIP Resolution:", debug.stages.zipResolution);

    if (!stateCode) {
      debug.errors.push("ZIP code does not resolve to a deregulated state");
      return debug;
    }

    // STAGE B: Provider Validation
    console.log("=== STAGE B: PROVIDER VALIDATION ===");
    const allProviders = await ElectricityProvider.list();
    console.log("Total providers in DB:", allProviders.length);
    
    const activeProviders = allProviders.filter(p => {
      const isActive = p.data?.is_active ?? p.is_active ?? true;
      console.log(`Provider: ${p.name}, Active: ${isActive}, States:`, p.supported_states);
      return isActive === true;
    });
    
    console.log("Active providers:", activeProviders.length);
    
    const providersForState = activeProviders.filter(p => {
      const supportedStates = p.supported_states || [];
      const matches = supportedStates.includes(stateCode);
      console.log(`Provider ${p.name} supports ${stateCode}:`, matches, "Supported:", supportedStates);
      return matches;
    });

    debug.stages.providerValidation = {
      totalProviders: allProviders.length,
      activeProviders: activeProviders.length,
      providersForState: providersForState.length,
      providersList: providersForState.map(p => ({
        id: p.id,
        name: p.name,
        isActive: p.data?.is_active ?? p.is_active,
        supportedStates: p.supported_states
      })),
      passed: providersForState.length > 0
    };
    console.log("Provider Validation:", debug.stages.providerValidation);

    if (providersForState.length === 0) {
      debug.errors.push(`No active providers found for state ${stateCode}`);
      return debug;
    }

    // STAGE C: Plan Validation
    console.log("=== STAGE C: PLAN VALIDATION ===");
    const allPlans = await ElectricityPlan.list();
    console.log("Total plans in DB:", allPlans.length);
    
    const providerNames = providersForState.map(p => p.name);
    console.log("Provider names to match:", providerNames);

    const plansForProviders = allPlans.filter(plan => {
      const providerName = plan.provider_name;
      const matches = providerNames.includes(providerName);
      console.log(`Plan: ${plan.plan_name}, Provider: ${providerName}, Matches: ${matches}`);
      return matches;
    });

    console.log("Plans matching providers:", plansForProviders.length);

    const residentialPlans = plansForProviders.filter(plan => {
      const planName = plan.plan_name || "";
      const isBusiness = planName.toLowerCase().includes('business');
      console.log(`Plan: ${planName}, Is Business: ${isBusiness}`);
      return !isBusiness;
    });

    debug.stages.planValidation = {
      totalPlans: allPlans.length,
      plansForProviders: plansForProviders.length,
      residentialPlans: residentialPlans.length,
      plansList: residentialPlans.map(p => ({
        id: p.id,
        provider: p.provider_name,
        planName: p.plan_name,
        rate: p.rate_per_kwh,
        type: p.plan_type,
        contractLength: p.contract_length
      })),
      passed: residentialPlans.length > 0
    };
    console.log("Plan Validation:", debug.stages.planValidation);

    if (residentialPlans.length === 0) {
      debug.errors.push(`No residential plans found for providers in ${stateCode}`);
      return debug;
    }

    // STAGE D: Matching Logic Test
    console.log("=== STAGE D: MATCHING LOGIC TEST ===");
    
    // Test the actual filtering logic used in CompareRates
    const testPreferences = {
      fixedRate: false,
      variableRate: false,
      renewable: false,
      twelveMonth: false,
      monthlyUsage: 1000
    };

    const filteredByPreferences = residentialPlans.filter(plan => {
      const planType = plan.plan_type;
      const renewablePercentage = plan.renewable_percentage || 0;
      const contractLength = plan.contract_length;

      if (testPreferences.fixedRate && planType !== 'fixed') return false;
      if (testPreferences.variableRate && planType !== 'variable') return false;
      if (testPreferences.renewable && renewablePercentage < 50) return false;
      if (testPreferences.twelveMonth && contractLength !== 12) return false;
      return true;
    });

    debug.stages.matchingLogic = {
      residentialPlans: residentialPlans.length,
      afterPreferenceFilter: filteredByPreferences.length,
      passed: filteredByPreferences.length > 0
    };
    console.log("Matching Logic:", debug.stages.matchingLogic);

    // FINAL RESULT
    debug.passed = filteredByPreferences.length > 0;
    
    if (debug.passed) {
      console.log("✅ PIPELINE PASSED - Plans should display");
    } else {
      console.log("❌ PIPELINE FAILED - No plans to display");
      debug.errors.push("No plans passed all filters");
    }

  } catch (error) {
    console.error("Pipeline error:", error);
    debug.errors.push(`Pipeline exception: ${error.message}`);
  }

  return debug;
}

// Test function to validate data structure
export async function validateDataStructures() {
  console.log("=== DATA STRUCTURE VALIDATION ===");
  
  // Check provider structure
  const providers = await ElectricityProvider.list();
  if (providers.length > 0) {
    const sample = providers[0];
    console.log("Provider structure sample:", {
      id: sample.id,
      hasData: !!sample.data,
      dataKeys: sample.data ? Object.keys(sample.data) : [],
      name: sample.data?.name || sample.name,
      supported_states: sample.data?.supported_states || sample.supported_states
    });
  }

  // Check plan structure
  const plans = await ElectricityPlan.list();
  if (plans.length > 0) {
    const sample = plans[0];
    console.log("Plan structure sample:", {
      id: sample.id,
      hasData: !!sample.data,
      dataKeys: sample.data ? Object.keys(sample.data) : [],
      provider_name: sample.data?.provider_name || sample.provider_name,
      plan_name: sample.data?.plan_name || sample.plan_name
    });
  }
}