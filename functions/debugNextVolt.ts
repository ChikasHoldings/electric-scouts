import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const debugResults = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    // 1. Check Provider Record
    console.log('=== DEBUG NEXTVOLT: Provider Check ===');
    const providers = await base44.asServiceRole.entities.ElectricityProvider.filter({
      $or: [
        { name: 'NextVolt Energy' },
        { slug: 'nextvolt-energy' }
      ]
    });

    if (providers.length === 0) {
      console.error('ERROR: NextVolt Energy provider not found in database');
      debugResults.checks.push({
        check: 'Provider Record',
        status: 'FAILED',
        error: 'Provider not found'
      });
    } else {
      const provider = providers[0];
      const providerData = provider.data || provider;
      
      console.log('Provider Found:', {
        id: provider.id,
        name: providerData.name,
        slug: providerData.slug,
        isActive: providerData.is_active,
        isRecommended: providerData.is_recommended,
        supportedStates: providerData.supported_states
      });

      debugResults.checks.push({
        check: 'Provider Record',
        status: 'PASSED',
        data: {
          id: provider.id,
          name: providerData.name,
          isActive: providerData.is_active,
          isRecommended: providerData.is_recommended,
          supportedStates: providerData.supported_states
        }
      });

      // 2. Check Plan Records
      console.log('=== DEBUG NEXTVOLT: Plans Check ===');
      const plans = await base44.asServiceRole.entities.ElectricityPlan.list();
      const nextvoltPlans = plans.filter(plan => {
        const planData = plan.data || plan;
        const providerName = planData.provider_name || plan.provider_name;
        return providerName === 'NextVolt Energy';
      });

      console.log(`Found ${nextvoltPlans.length} plans for NextVolt Energy`);
      
      nextvoltPlans.forEach((plan, idx) => {
        const planData = plan.data || plan;
        console.log(`Plan ${idx + 1}:`, {
          id: plan.id,
          name: planData.plan_name || plan.plan_name,
          type: planData.plan_type || plan.plan_type,
          rate: planData.rate_per_kwh || plan.rate_per_kwh
        });
      });

      debugResults.checks.push({
        check: 'Plan Records',
        status: nextvoltPlans.length > 0 ? 'PASSED' : 'FAILED',
        data: {
          totalPlans: nextvoltPlans.length,
          plans: nextvoltPlans.map(p => {
            const pd = p.data || p;
            return {
              id: p.id,
              name: pd.plan_name || p.plan_name,
              type: pd.plan_type || p.plan_type
            };
          })
        }
      });

      // 3. Check Service Area Mapping
      console.log('=== DEBUG NEXTVOLT: Service Area Mapping ===');
      const supportedStates = providerData.supported_states || [];
      console.log('Provider supported_states field:', supportedStates);
      
      if (!supportedStates || supportedStates.length === 0) {
        console.error('ERROR: NextVolt has no supported_states configured');
        debugResults.checks.push({
          check: 'Service Area Mapping',
          status: 'FAILED',
          error: 'No supported states configured'
        });
      } else {
        const expectedStates = ['TX', 'PA', 'OH', 'IL', 'DE'];
        const missingStates = expectedStates.filter(s => !supportedStates.includes(s));
        
        if (missingStates.length > 0) {
          console.warn('WARNING: Missing states:', missingStates);
        }
        
        debugResults.checks.push({
          check: 'Service Area Mapping',
          status: missingStates.length === 0 ? 'PASSED' : 'WARNING',
          data: {
            supportedStates,
            expectedStates,
            missingStates
          }
        });
      }
    }

    console.log('=== DEBUG NEXTVOLT: Complete ===');
    return Response.json(debugResults);

  } catch (error) {
    console.error('DEBUG NEXTVOLT ERROR:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});