import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, conversationHistory = [], billFileUrl = null } = await req.json();

    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // System prompt for Nora
    const systemPrompt = `You are Nora, the friendly energy savings assistant for PowerScouts.com. You help users find the best electricity plans through a natural conversation.

YOUR PERSONALITY:
- Warm, friendly, and human-like (never robotic)
- Professional but approachable
- Keep messages SHORT and easy to read
- Use light emojis sparingly (⚡, 😊, 🌱, 💡)

YOUR CONVERSATION FLOW:
1. After category selection (Residential/Commercial/Renewable), ask for ZIP code:
   "Great! What's your ZIP code so I can check the available providers in your area?"

2. Validate ZIP (must be from: TX, IL, OH, PA, NY, NJ, MD, MA, ME, NH, RI, CT)
   - If VALID: Move to preference question
   - If INVALID: "Thanks! It looks like electricity choice isn't available in this area yet — only deregulated states allow switching. If you'd like, I can still help answer questions."

3. Ask ONE preference question based on category:
   - Residential: "Nice! What matters most to you — lowest rate, long-term stability, or green energy?"
   - Commercial: "Got it. Do you know your rough monthly usage? Even an estimate helps me find the best deals."
   - Renewable: "Love that! Do you prefer solar buyback, 100% green energy, or the lowest renewable plan?"

4. After preference, offer bill upload:
   "Would you like to upload your electricity bill? 📄
   I can analyze your current usage and find the deepest savings — most users save $600–$800 a year."

5. Before showing results:
   "Perfect! Thanks for the details — give me a moment while I look for the best savings for you."

6. After showing results:
   "If you want help choosing the best one, I'm right here!"

IMPORTANT RULES:
- Keep responses SHORT (2-3 sentences max)
- Ask ONE question at a time
- NEVER direct users to Google
- ONLY show plans with affiliate links
- Be conversational and warm
- Acknowledge their inputs enthusiastically

Previous conversation:
${conversationContext}

User's latest message: ${message}

Respond naturally as Nora. Keep it short, warm, and guide them through the flow.`;

    // Call LLM to generate response
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt,
      add_context_from_internet: false
    });

    let botResponse = llmResponse;
    let recommendations = null;
    let billAnalysis = null;
    let showBillUploadButtons = false;

    // Detect if we should show bill upload buttons
    const shouldOfferBillUpload = conversationHistory.length >= 4 && 
      conversationHistory.some(msg => msg.content && /\b\d{5}\b/.test(msg.content)) &&
      !conversationHistory.some(msg => msg.content && msg.content.toLowerCase().includes('upload'));

    if (shouldOfferBillUpload && !billFileUrl) {
      showBillUploadButtons = true;
    }

    // Handle bill upload
    if (billFileUrl) {
      try {
        const extractionResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: billFileUrl,
          json_schema: {
            type: "object",
            properties: {
              current_provider: { type: "string" },
              current_rate: { type: "number" },
              monthly_usage: { type: "number" },
              current_cost: { type: "number" },
              zip_code: { type: "string" },
              account_number: { type: "string" }
            }
          }
        });

        if (extractionResult.status === 'success' && extractionResult.output) {
          billAnalysis = {
            currentProvider: extractionResult.output.current_provider,
            currentRate: extractionResult.output.current_rate,
            monthlyUsage: extractionResult.output.monthly_usage,
            currentCost: extractionResult.output.current_cost,
            zipCode: extractionResult.output.zip_code
          };

          botResponse = `Great! I've analyzed your bill:\n\n` +
            `• Current Provider: ${billAnalysis.currentProvider || 'Not found'}\n` +
            `• Current Rate: ${billAnalysis.currentRate || 'N/A'}¢/kWh\n` +
            `• Monthly Usage: ${billAnalysis.monthlyUsage || 'N/A'} kWh\n` +
            `• Current Cost: $${billAnalysis.currentCost || 'N/A'}\n\n` +
            `Let me find better plans for you...`;
        } else {
          botResponse = "I had trouble reading some details from your bill. Could you tell me your ZIP code and average monthly usage so I can find better rates for you?";
        }
      } catch (error) {
        console.error('Bill extraction error:', error);
        botResponse = "I had trouble analyzing your bill. Could you tell me your ZIP code and average monthly usage?";
      }
    }

    // Check if we should fetch actual plan data
    const shouldFetchPlans = conversationHistory.some(msg => 
      msg.content && /\b\d{5}\b/.test(msg.content)
    ) || /\b\d{5}\b/.test(message) || (billAnalysis && billAnalysis.zipCode);

    if (shouldFetchPlans) {
      // Extract ZIP code from bill or conversation
      let zipCode = billAnalysis?.zipCode;
      if (!zipCode) {
        const zipMatch = (conversationHistory.map(m => m.content).join(' ') + ' ' + message).match(/\b(\d{5})\b/);
        zipCode = zipMatch ? zipMatch[1] : null;
      }
      
      if (zipCode) {
        
        // Fetch plans from database
        const plans = await base44.entities.ElectricityPlan.list();
        
        // Get providers for the ZIP
        const providers = await base44.entities.ElectricityProvider.filter({ is_active: true });
        
        // Filter plans (simplified - in production would check provider availability by ZIP)
        const filteredPlans = plans
          .filter(p => !p.plan_name?.toLowerCase().includes('business'))
          .sort((a, b) => a.rate_per_kwh - b.rate_per_kwh)
          .slice(0, 5);

        if (filteredPlans.length > 0) {
          const usage = billAnalysis?.monthlyUsage || 1000;
          const currentCost = billAnalysis?.currentCost || 0;
          
          recommendations = filteredPlans.map(plan => {
            const provider = providers.find(p => p.name === plan.provider_name);
            const estimatedCost = (plan.rate_per_kwh * usage / 100 + (plan.monthly_base_charge || 0)).toFixed(2);
            const savings = currentCost > 0 ? Math.max(0, (currentCost - parseFloat(estimatedCost))).toFixed(2) : 0;
            
            // Generate 2-3 highlights for each plan
            const highlights = [];
            if (plan.plan_type === 'fixed') highlights.push('Rate locked for entire contract');
            if (plan.renewable_percentage >= 100) highlights.push('100% clean energy');
            else if (plan.renewable_percentage >= 50) highlights.push(`${plan.renewable_percentage}% renewable`);
            if (plan.early_termination_fee === 0) highlights.push('No early termination fee');
            if (plan.contract_length <= 6) highlights.push('Short-term flexibility');
            
            return {
              provider: plan.provider_name,
              plan: plan.plan_name,
              rate: plan.rate_per_kwh,
              contractLength: plan.contract_length,
              renewable: plan.renewable_percentage || 0,
              estimatedMonthlyCost: estimatedCost,
              savings: parseFloat(savings),
              type: plan.plan_type,
              highlights: highlights.slice(0, 3),
              affiliateUrl: provider?.affiliate_url || provider?.website_url
            };
          }).filter(rec => rec.affiliateUrl && rec.affiliateUrl !== '#')
            .sort((a, b) => b.savings - a.savings);

          if (billAnalysis && billAnalysis.currentCost) {
            const maxSavings = Math.max(...recommendations.slice(0, 4).map(r => r.savings || 0));
            if (maxSavings > 0) {
              botResponse = `Great news! I found some excellent options that could save you up to $${maxSavings}/month. Check these out below! ⚡`;
            } else {
              botResponse = `I found some solid competitive plans for you. Take a look below!`;
            }
          } else {
            botResponse = `Here are my top picks for your area! ⚡`;
          }
        }
      }
    }

    return Response.json({
      response: botResponse,
      recommendations: recommendations,
      billAnalysis: billAnalysis,
      showBillUploadButtons: showBillUploadButtons
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return Response.json({ 
      error: error.message,
      response: "I apologize, but I'm having trouble processing your request right now. Could you please try again?"
    }, { status: 500 });
  }
});