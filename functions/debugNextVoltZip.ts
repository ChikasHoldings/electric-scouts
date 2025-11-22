import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ZIP to State mapping (first 3 digits)
const ZIP_TO_STATE = {
  '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX',
  '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX', '760': 'TX', '761': 'TX',
  '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX',
  '768': 'TX', '769': 'TX', '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX',
  '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
  '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX',
  '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX', '790': 'TX', '791': 'TX',
  '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX',
  '798': 'TX', '799': 'TX',
  '150': 'PA', '151': 'PA', '152': 'PA', '153': 'PA', '154': 'PA', '155': 'PA',
  '156': 'PA', '157': 'PA', '158': 'PA', '159': 'PA', '160': 'PA', '161': 'PA',
  '162': 'PA', '163': 'PA', '164': 'PA', '165': 'PA', '166': 'PA', '167': 'PA',
  '168': 'PA', '169': 'PA', '170': 'PA', '171': 'PA', '172': 'PA', '173': 'PA',
  '174': 'PA', '175': 'PA', '176': 'PA', '177': 'PA', '178': 'PA', '179': 'PA',
  '180': 'PA', '181': 'PA', '182': 'PA', '183': 'PA', '184': 'PA', '185': 'PA',
  '186': 'PA', '187': 'PA', '188': 'PA', '189': 'PA', '190': 'PA', '191': 'PA',
  '192': 'PA', '193': 'PA', '194': 'PA', '195': 'PA', '196': 'PA',
  '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL',
  '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL', '610': 'IL', '611': 'IL',
  '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL',
  '618': 'IL', '619': 'IL', '620': 'IL', '621': 'IL', '622': 'IL', '623': 'IL',
  '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
  '430': 'OH', '431': 'OH', '432': 'OH', '433': 'OH', '434': 'OH', '435': 'OH',
  '436': 'OH', '437': 'OH', '438': 'OH', '439': 'OH', '440': 'OH', '441': 'OH',
  '442': 'OH', '443': 'OH', '444': 'OH', '445': 'OH', '446': 'OH', '447': 'OH',
  '448': 'OH', '449': 'OH', '450': 'OH', '451': 'OH', '452': 'OH', '453': 'OH',
  '454': 'OH', '455': 'OH', '456': 'OH', '457': 'OH', '458': 'OH',
  '197': 'DE', '198': 'DE', '199': 'DE'
};

function getStateFromZip(zip) {
  if (!zip || zip.length < 3) return null;
  return ZIP_TO_STATE[zip.substring(0, 3)] || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const testZip = url.searchParams.get('zip') || '77002';

    console.log(`=== DEBUG NEXTVOLT FOR ZIP: ${testZip} ===`);

    const debugResults = {
      timestamp: new Date().toISOString(),
      zip: testZip,
      checks: []
    };

    // 1. Resolve ZIP to State
    const stateCode = getStateFromZip(testZip);
    console.log('ZIP Resolution:', { zip: testZip, state: stateCode });
    
    debugResults.checks.push({
      check: 'ZIP Resolution',
      status: stateCode ? 'PASSED' : 'FAILED',
      data: { zip: testZip, resolvedState: stateCode }
    });

    if (!stateCode) {
      console.error('ERROR: Could not resolve ZIP to state');
      return Response.json(debugResults);
    }

    // 2. Check if NextVolt serves this state
    const providers = await base44.asServiceRole.entities.ElectricityProvider.filter({
      name: 'NextVolt Energy'
    });

    if (providers.length === 0) {
      console.error('ERROR: NextVolt provider not found');
      debugResults.checks.push({
        check: 'Provider Availability',
        status: 'FAILED',
        error: 'Provider not found'
      });
      return Response.json(debugResults);
    }

    const provider = providers[0];
    const providerData = provider.data || provider;
    const supportedStates = providerData.supported_states || [];
    const servesZip = supportedStates.includes(stateCode);

    console.log('Provider Check:', {
      provider: 'NextVolt Energy',
      supportedStates,
      targetState: stateCode,
      servesState: servesZip
    });

    debugResults.checks.push({
      check: 'Provider Availability',
      status: servesZip ? 'PASSED' : 'FAILED',
      data: {
        provider: 'NextVolt Energy',
        supportedStates,
        targetState: stateCode,
        servesState: servesZip
      }
    });

    // 3. Query all plans for NextVolt
    const allPlans = await base44.asServiceRole.entities.ElectricityPlan.list();
    const nextvoltPlans = allPlans.filter(plan => {
      const planData = plan.data || plan;
      const providerName = planData.provider_name || plan.provider_name;
      return providerName === 'NextVolt Energy';
    });

    console.log(`Found ${nextvoltPlans.length} NextVolt plans in database`);

    // 4. Simulate filtering logic (as used in CompareRates page)
    const residentialPlans = nextvoltPlans.filter(plan => {
      const planData = plan.data || plan;
      const planName = planData.plan_name || plan.plan_name;
      return !planName?.toLowerCase().includes('business');
    });

    const commercialPlans = nextvoltPlans.filter(plan => {
      const planData = plan.data || plan;
      const planName = planData.plan_name || plan.plan_name;
      return planName?.toLowerCase().includes('business');
    });

    console.log('Plan Filtering:', {
      total: nextvoltPlans.length,
      residential: residentialPlans.length,
      commercial: commercialPlans.length
    });

    debugResults.checks.push({
      check: 'Plan Query Results',
      status: nextvoltPlans.length > 0 ? 'PASSED' : 'FAILED',
      data: {
        totalPlans: nextvoltPlans.length,
        residentialPlans: residentialPlans.length,
        commercialPlans: commercialPlans.length,
        planDetails: nextvoltPlans.map(p => {
          const pd = p.data || p;
          return {
            id: p.id,
            name: pd.plan_name || p.plan_name,
            provider: pd.provider_name || p.provider_name,
            type: pd.plan_type || p.plan_type,
            rate: pd.rate_per_kwh || p.rate_per_kwh
          };
        })
      }
    });

    // 5. Final verdict
    const shouldAppear = servesZip && nextvoltPlans.length > 0;
    console.log('=== VERDICT ===');
    console.log('Should NextVolt appear for this ZIP?', shouldAppear);
    
    if (!shouldAppear) {
      if (!servesZip) {
        console.error('ISSUE: NextVolt does not serve state:', stateCode);
      }
      if (nextvoltPlans.length === 0) {
        console.error('ISSUE: No NextVolt plans found in database');
      }
    }

    debugResults.verdict = {
      shouldAppear,
      reasons: [
        !servesZip && 'Provider does not serve this state',
        nextvoltPlans.length === 0 && 'No plans found for provider'
      ].filter(Boolean)
    };

    console.log('=== DEBUG COMPLETE ===');
    return Response.json(debugResults);

  } catch (error) {
    console.error('DEBUG NEXTVOLT ZIP ERROR:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});