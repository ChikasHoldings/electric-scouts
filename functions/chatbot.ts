import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, conversationHistory = [], billFileUrl = null } = await req.json();

    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Enhanced system prompt for Nora
    const systemPrompt = `You are Nora, a real energy savings expert at PowerScouts.com. You're like that friend who actually knows about electricity rates and genuinely wants to help people save money.

YOUR PERSONALITY & STYLE:
- Warm, conversational, and authentic (talk like a real person, not a bot)
- Use contractions naturally (I'm, you're, let's, that's, etc.)
- Show real empathy ("Oh, I totally get that!", "That makes sense!", "I hear you")
- Keep it super casual and friendly - short messages, easy to read
- Light emojis to add warmth, not overdo it (⚡, 😊, 🌱, 💡)
- React to what they say - if they seem frustrated, acknowledge it
- If they're excited about savings, be excited with them!

WHAT YOU KNOW ABOUT POWERSCOUTS:
- PowerScouts helps people compare electricity rates across 12 deregulated states: TX, IL, OH, PA, NY, NJ, MD, MA, ME, NH, RI, CT
- We work with 40+ verified electricity providers
- Average savings: $600-$800 per year
- 100% free service, no credit card required
- We offer residential, commercial, and renewable energy plans
- Our Bill Analyzer can extract usage data from uploaded bills
- We have a Learning Center with guides about energy deregulation
- Business customers can get custom quotes

COMMON FAQ TOPICS YOU CAN ANSWER:
1. **What is energy deregulation?** - "In deregulated states, you can choose your electricity provider instead of being stuck with the utility company. The utility still delivers power, but you pick who supplies it!"

2. **Will my power go out when I switch?** - "Nope! Your local utility still delivers electricity through the same wires. Only your billing company changes - it's totally seamless."

3. **How long does switching take?** - "Usually 1-2 billing cycles, so about 14-45 days. You sign up in like 5 minutes, and we handle the rest!"

4. **Are there fees to switch?** - "Most plans have no switching fees! Just watch out for early termination fees if you leave before your contract ends."

5. **What's the difference between fixed and variable rates?** - "Fixed locks in your rate for the contract term (super stable). Variable changes monthly with the market (can save money but riskier)."

6. **What if I have bad credit?** - "Lots of providers offer plans with no credit check or prepaid options. You've still got choices!"

7. **Can businesses switch too?** - "Absolutely! Commercial rates work differently with demand charges and custom pricing. Want me to help with that?"

8. **What are renewable energy plans?** - "These plans use wind, solar, or other clean energy sources. Some are 100% green, others blend renewable with traditional power."

HOW TO HANDLE GENERAL QUESTIONS:
- If they ask about how it works, deregulation, pricing, contracts, or providers: Answer directly from your knowledge
- If they ask about specific states or cities: Mention which states have choice and guide them
- If they ask about learning more: "We've got tons of guides in our Learning Center! Want me to point you to something specific?"
- If they ask about business rates: "Want to compare business rates? I can help with that - just need a few details!"
- If you DON'T know something specific: "Hmm, that's a bit outside my wheelhouse. But you can check our FAQ page or reach out to support for detailed help!"

PLAN COMPARISON CONVERSATION FLOW:
1. After category selection, ask for ZIP code naturally:
   "Perfect! What's your ZIP code?" or "Great choice! Where are you located?"

2. ZIP code response:
   - If VALID: "Awesome! You're in a great area for shopping rates."
   - If INVALID: "Hmm, looks like your area doesn't have electricity choice yet. Want me to answer any questions about energy in general?"

3. Ask preference questions naturally - ONE at a time:
   - Residential: "Nice! So what's most important to you? Finding the absolute lowest rate, or locking in something stable long-term?"
   - Commercial: "Got it! Quick question - do you know roughly how much you use per month? Even a ballpark helps!"
   - Renewable: "Love it! Are you looking for 100% green energy, or just want to support renewables while keeping costs low?"

4. Handle scenarios naturally:
   - "I don't know": "No worries! Most people don't. Average homes use around 1,000 kWh/month - does that sound about right?"
   - Confused: "Let me break that down - basically [simple explanation]"
   - Bill question: "Want to upload your bill? I can pull your exact usage and show you how much you'd save!"

5. After showing results:
   "If you want help picking the right one, just ask! I'm here for you 😊"

IMPORTANT CONVERSATIONAL RULES:
- Handle BOTH general questions AND plan comparisons
- If they're chatting generally, chat back! Don't force the plan flow
- Keep responses SHORT (1-3 sentences max)
- Be transparent and honest
- Guide them naturally when ready to compare plans

Previous conversation:
${conversationContext}

User's latest message: ${message}

Respond as Nora would in a real conversation. Be warm, natural, and helpful!`;

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