// Full System Test for CompareRates Pipeline
import { base44 } from "@/api/base44Client";
import { getStateFromZip, getCityFromZip } from "./providerAvailability";

export async function runFullSystemTest(zipCode = "75244") {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║          FULL SYSTEM TEST - COMPARE RATES PIPELINE           ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  
  const results = {
    passed: true,
    errors: [],
    warnings: [],
    stages: {}
  };

  try {
    // STAGE 1: ZIP RESOLUTION
    console.log("\n📍 STAGE 1: ZIP RESOLUTION");
    console.log("─────────────────────────────────────────────────────────────");
    const stateCode = getStateFromZip(zipCode);
    const cityName = getCityFromZip(zipCode);
    console.log(`✓ ZIP: ${zipCode}`);
    console.log(`✓ State: ${stateCode}`);
    console.log(`✓ City: ${cityName}`);
    
    results.stages.zipResolution = { passed: !!stateCode, stateCode, cityName };
    
    if (!stateCode) {
      results.passed = false;
      results.errors.push("ZIP does not resolve to deregulated state");
      return results;
    }

    // STAGE 2: PROVIDER DATA
    console.log("\n🏢 STAGE 2: PROVIDER DATA");
    console.log("─────────────────────────────────────────────────────────────");
    const allProviders = await base44.entities.ElectricityProvider.list();
    console.log(`Total providers in DB: ${allProviders.length}`);
    
    if (allProviders.length === 0) {
      results.passed = false;
      results.errors.push("No providers in database");
      return results;
    }

    // Log each provider's structure and data
    allProviders.forEach((provider, idx) => {
      console.log(`\n  Provider #${idx + 1}:`);
      console.log(`    ID: ${provider.id}`);
      console.log(`    Name: ${provider.name}`);
      console.log(`    Supported States: ${JSON.stringify(provider.supported_states)}`);
      console.log(`    Is Active (data): ${provider.data?.is_active}`);
      console.log(`    Is Active (root): ${provider.is_active}`);
      console.log(`    Logo: ${provider.logo_url ? "✓" : "✗"}`);
      console.log(`    Website: ${provider.website_url || provider.affiliate_url ? "✓" : "✗"}`);
    });

    // Filter active providers for state
    const activeProvidersForState = allProviders.filter(p => {
      const isActive = p.data?.is_active ?? p.is_active ?? true;
      const supportsState = (p.supported_states || []).includes(stateCode);
      return isActive && supportsState;
    });

    console.log(`\n✓ Active providers for ${stateCode}: ${activeProvidersForState.length}`);
    activeProvidersForState.forEach(p => {
      console.log(`  - ${p.name}`);
    });

    results.stages.providers = {
      passed: activeProvidersForState.length > 0,
      total: allProviders.length,
      activeForState: activeProvidersForState.length,
      list: activeProvidersForState.map(p => p.name)
    };

    if (activeProvidersForState.length === 0) {
      results.passed = false;
      results.errors.push(`No active providers for state ${stateCode}`);
      return results;
    }

    // STAGE 3: PLAN DATA
    console.log("\n📋 STAGE 3: PLAN DATA");
    console.log("─────────────────────────────────────────────────────────────");
    const allPlans = await base44.entities.ElectricityPlan.list();
    console.log(`Total plans in DB: ${allPlans.length}`);

    if (allPlans.length === 0) {
      results.passed = false;
      results.errors.push("No plans in database");
      return results;
    }

    // Log sample plan structure
    console.log("\n  Sample Plan Structure:");
    const samplePlan = allPlans[0];
    console.log(`    ID: ${samplePlan.id}`);
    console.log(`    Provider Name: ${samplePlan.provider_name}`);
    console.log(`    Plan Name: ${samplePlan.plan_name}`);
    console.log(`    Rate: ${samplePlan.rate_per_kwh}¢`);
    console.log(`    Type: ${samplePlan.plan_type}`);
    console.log(`    Contract: ${samplePlan.contract_length} months`);
    console.log(`    Renewable: ${samplePlan.renewable_percentage}%`);

    // Filter plans by active providers
    const providerNames = activeProvidersForState.map(p => p.name);
    const plansForProviders = allPlans.filter(plan => 
      providerNames.includes(plan.provider_name)
    );

    console.log(`\n✓ Plans from active providers: ${plansForProviders.length}`);
    
    // Group by provider
    const plansByProvider = {};
    plansForProviders.forEach(plan => {
      if (!plansByProvider[plan.provider_name]) {
        plansByProvider[plan.provider_name] = [];
      }
      plansByProvider[plan.provider_name].push(plan);
    });

    Object.entries(plansByProvider).forEach(([provider, plans]) => {
      console.log(`  ${provider}: ${plans.length} plan(s)`);
      plans.forEach(plan => {
        console.log(`    - ${plan.plan_name} (${plan.rate_per_kwh}¢, ${plan.plan_type})`);
      });
    });

    // Filter out business plans
    const residentialPlans = plansForProviders.filter(plan => {
      const planName = (plan.plan_name || "").toLowerCase();
      return !planName.includes('business');
    });

    console.log(`\n✓ Residential plans: ${residentialPlans.length}`);

    results.stages.plans = {
      passed: residentialPlans.length > 0,
      total: allPlans.length,
      forProviders: plansForProviders.length,
      residential: residentialPlans.length,
      list: residentialPlans.map(p => ({
        provider: p.provider_name,
        plan: p.plan_name,
        rate: p.rate_per_kwh
      }))
    };

    if (residentialPlans.length === 0) {
      results.passed = false;
      results.errors.push("No residential plans for active providers");
      return results;
    }

    // STAGE 4: MATCHING LOGIC
    console.log("\n🔍 STAGE 4: MATCHING LOGIC TEST");
    console.log("─────────────────────────────────────────────────────────────");
    
    // Test with no preferences (should show all)
    const testPreferences = {
      fixedRate: false,
      variableRate: false,
      renewable: false,
      twelveMonth: false
    };

    const matchedPlans = residentialPlans.filter(plan => {
      if (testPreferences.fixedRate && plan.plan_type !== 'fixed') return false;
      if (testPreferences.variableRate && plan.plan_type !== 'variable') return false;
      if (testPreferences.renewable && (plan.renewable_percentage || 0) < 50) return false;
      if (testPreferences.twelveMonth && plan.contract_length !== 12) return false;
      return true;
    });

    console.log(`✓ Plans passing filters: ${matchedPlans.length}`);
    matchedPlans.forEach(plan => {
      console.log(`  - ${plan.provider_name}: ${plan.plan_name} @ ${plan.rate_per_kwh}¢`);
    });

    results.stages.matching = {
      passed: matchedPlans.length > 0,
      matched: matchedPlans.length
    };

    // FINAL RESULTS
    console.log("\n═══════════════════════════════════════════════════════════════");
    if (matchedPlans.length > 0) {
      console.log("✅ SYSTEM TEST PASSED - Plans should display in CompareRates");
      console.log(`   ${matchedPlans.length} plan(s) available for ZIP ${zipCode}`);
    } else {
      console.log("❌ SYSTEM TEST FAILED - No plans to display");
      results.passed = false;
    }
    console.log("═══════════════════════════════════════════════════════════════\n");

  } catch (error) {
    console.error("❌ TEST ERROR:", error);
    results.passed = false;
    results.errors.push(`Exception: ${error.message}`);
  }

  return results;
}