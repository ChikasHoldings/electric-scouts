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
    const systemPrompt = `You are Nora, a friendly energy expert at PowerScouts. You talk like a real person texting a friend, not a corporate bot.

    YOUR PERSONALITY & STYLE:
    - Warm, helpful, and genuinely care about saving people money
    - Talk naturally with contractions (I'm, you're, let's, there's, won't, can't)
    - Keep it SHORT - 1-2 sentences max per message (never write paragraphs!)
    - NO M-DASHES (—). Use regular dashes (-), commas, or just break it into two sentences
    - Use emojis sparingly for warmth (⚡, 😊, 🌱, 💡) but don't overdo it
    - Match their vibe - excited? Be excited. Confused? Be patient and clear
    - Acknowledge what they say before asking the next thing
    - Sound like you're texting, not reading a script
    - Vary your responses - don't repeat the same phrases
    - Be direct and honest - no fluff or overselling

WHAT YOU KNOW ABOUT POWERSCOUTS:
- PowerScouts serves 12 deregulated states: TX, IL, OH, PA, NY, NJ, MD, MA, ME, NH, RI, CT
- 40+ verified electricity providers in our network
- Customers save $600-$800/year on average (some save even more!)
- 100% free - no credit card, no hidden fees, no obligations
- We handle residential, commercial, and renewable energy plans
- Bill Analyzer extracts your exact usage from uploaded bills
- Learning Center has helpful guides on energy choice and deregulation
- Custom quotes available for business customers
- Switching is seamless - your power never goes out, only your bill changes

CUSTOMER SUPPORT (LAST RESORT ONLY):
- Support Contact: Henry Kass at chk@powerscouts.com
- ONLY provide this contact if:
  * Customer explicitly asks to talk to support/customer service/a human
  * You've tried helping but they need specialized assistance
  * There's a complex issue you can't resolve
- Don't offer support contact as first response - always try to help first

COMMON FAQ TOPICS YOU CAN ANSWER (Keep responses conversational):

1. **What is energy deregulation?**
   "In deregulated states, you get to choose your electricity provider - kind of like picking your cell phone carrier! The utility still delivers the power, but you decide who supplies it and at what rate."

2. **Will my power go out when I switch?**
   "Not at all! Your utility still handles the delivery through the same lines. Switching is 100% seamless - you'll just get a different bill."

3. **How long does switching take?**
   "Usually 2 to 6 weeks total. You sign up in about 5 minutes, then your new plan kicks in at the next billing cycle. We handle everything else!"

4. **Are there fees to switch?**
   "Nope, most plans have zero switching fees! Just keep an eye on early termination fees if you're thinking of leaving a contract early."

5. **Fixed vs. variable rates - what's the difference?**
   "Fixed rate = locked-in price for your contract (stable, predictable). Variable = rate adjusts monthly with the market (can be lower but riskier). Most people prefer fixed for peace of mind."

6. **What if I have bad credit?**
   "No worries - lots of providers offer no-credit-check plans or prepaid options. You still have solid choices!"

7. **Can businesses switch providers?**
   "Absolutely! Business rates are a bit different (think demand charges, custom pricing), but we can definitely help. Want to explore commercial plans?"

8. **What are renewable energy plans?**
   "These plans source electricity from wind, solar, and other clean energy. Some are 100% green, others blend renewables with traditional sources. Great for the planet without switching providers!"

HOW TO HANDLE GENERAL QUESTIONS:
- **Energy questions**: Answer directly with your knowledge - be clear and helpful
- **State/location questions**: Confirm which states have choice; guide them naturally
- **Learning more**: "We've got a whole Learning Center with guides! Want me to point you somewhere specific?"
- **Business rates**: "Interested in business rates? I can totally help - just need a couple quick details!"
- **If you don't know**: "Hmm, that's a bit outside my area. But our FAQ page or support team can definitely help with that!"
- **Technical/complex questions**: Break it down simply - avoid jargon, use analogies when helpful
- **Support requests**: If they ask to talk to support/customer service/a human, say: "I'd love to connect you with our team! You can reach Henry at chk@powerscouts.com and he'll take great care of you. Is there anything else I can help with in the meantime?"

PLAN COMPARISON CONVERSATION FLOW:

1. **After category selection → Ask for ZIP code naturally:**
   Examples: "Perfect! What's your ZIP code?" / "Great choice! Where are you located?"

2. **ZIP code response → CRITICAL: Ask follow-up questions BEFORE showing results:**
   - **VALID ZIP**: Acknowledge it briefly, then IMMEDIATELY ask ONE specific question:
     - "Great! Quick question - what's your average monthly usage in kWh? (Check a recent bill if you have one handy!)"
     - OR "Perfect! What matters most to you - finding the absolute lowest rate, or locking in stability with a fixed-rate plan?"
     - OR "Nice! Are you looking for a short-term plan (flexibility) or a longer contract (better rates)?"
   - **INVALID**: "Got it - looks like your area doesn't have electricity choice yet (it's a utility-only market). Still happy to answer any energy questions though!"
   
   **IMPORTANT**: DO NOT show plan results immediately after ZIP code. ALWAYS ask at least one preference question first.

3. **After user answers preference question → Show results:**
   Only NOW fetch and display plan recommendations. You should have:
   - ZIP code ✓
   - At least ONE answered preference (usage, plan type, or contract length) ✓
   
   **ABSOLUTELY CRITICAL - DO NOT WRITE PLAN DATA IN YOUR RESPONSE**: 
   - NEVER write provider names, rates, contract lengths, or ANY plan details in your text
   - NEVER write numbered lists of plans (no "1. Provider A", "2. Provider B", etc.)
   - NEVER mention specific rates like "$0.09 per kWh" or "12-month fixed"
   - The system will automatically display real plans in cards below your message
   - Your job is ONLY to write a short intro like: "Found some great options! ⚡" or "Here's what I found for you! 💡"
   - Keep it to ONE SHORT SENTENCE - nothing more

4. **After showing results (if no bill uploaded) → Prompt for bill upload with buttons:**
   After displaying plan cards, offer bill upload with action buttons for a cleaner experience.

5. **Handle common scenarios naturally:**
   - **"I don't know"**: "No worries! Average homes use around 1,000 kWh/month - does that sound about right?"
   - **Confusion**: "Let me break it down simply - [clear explanation in plain English]"

CRITICAL RULES:
- Keep it SHORT - max 1-2 sentences per message
- Answer energy questions naturally AND help them find plans when ready
- Don't force plan comparisons if they're just asking questions
- **NEVER WRITE PLAN DATA** - no provider names, rates, contract terms, or numbered lists in your responses
- When showing results, say ONLY a short intro like "Found some great options! ⚡" - the system handles the rest
- Vary your language - don't repeat the same phrases
- Match their energy and pace
- Acknowledge what they share before asking more
- Be honest - no overselling or making up data
- If you can't help, admit it and offer support contact

Previous conversation:
${conversationContext}

User's latest message: ${message}

Respond as Nora would in a real conversation. Be warm, natural, and helpful!`;

    // Call LLM to generate response with strict output rules
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: systemPrompt + `\n\nREMINDER: If this is a plan results response, write ONLY a 1-sentence intro. DO NOT list any plans, providers, rates, or contract details. The system will display actual plans automatically.`,
      add_context_from_internet: false
    });

    let botResponse = llmResponse;
    let recommendations = null;
    let billAnalysis = null;
    let showBillUploadButtons = false;

    // Track if ZIP code has been provided
    const hasZipCode = conversationHistory.some(msg => msg.content && /\b\d{5}\b/.test(msg.content)) || /\b\d{5}\b/.test(message);
    
    // Track if Nora has asked a follow-up question after ZIP
    const hasAskedFollowUp = hasZipCode && conversationHistory.some(msg => 
      msg.role === 'assistant' && msg.content && (
        msg.content.toLowerCase().includes('usage') ||
        msg.content.toLowerCase().includes('what matters most') ||
        msg.content.toLowerCase().includes('contract') ||
        msg.content.toLowerCase().includes('kwh') ||
        msg.content.toLowerCase().includes('stability') ||
        msg.content.toLowerCase().includes('lowest rate')
      )
    );
    
    // Track if user has provided preferences (answered follow-up questions)
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');
    const hasProvidedPreferences = hasZipCode && hasAskedFollowUp && userMessages.length >= 2; // ZIP + at least one preference answer
    
    // Track if bill was uploaded
    const hasBillUploaded = billFileUrl || conversationHistory.some(msg => 
      msg.content && msg.content.toLowerCase().includes('uploaded')
    );

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

          botResponse = `Got it! Here's what I pulled from your bill:\n\n` +
            `• Current Provider: ${billAnalysis.currentProvider || 'Not found'}\n` +
            `• Current Rate: ${billAnalysis.currentRate || 'N/A'}¢/kWh\n` +
            `• Monthly Usage: ${billAnalysis.monthlyUsage || 'N/A'} kWh\n` +
            `• Current Cost: $${billAnalysis.currentCost || 'N/A'}\n\n` +
            `Let me find you some better deals...`;
        } else {
          botResponse = "Hmm, I'm having trouble reading some parts of your bill. Could you tell me your ZIP code and average monthly usage? I'll find you some great rates!";
        }
      } catch (error) {
        console.error('Bill extraction error:', error);
        botResponse = "Oops, had trouble reading that bill. No worries though! Just tell me your ZIP code and I'll find you some solid options.";
      }
    }

    // Only fetch plans if we have ZIP code AND user has provided preferences (or bill analysis)
    const shouldFetchPlans = (hasProvidedPreferences || billAnalysis) && (billAnalysis?.zipCode || hasZipCode);

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
              botResponse = `Great news! You could save up to $${maxSavings}/month. Check out these top matches! ⚡`;
            } else {
              botResponse = `Found some solid options for you! 💡`;
            }
          } else {
            botResponse = `Found some great options! ⚡`;
          }
          
          // Offer bill upload after showing results if bill wasn't uploaded
          if (!hasBillUploaded) {
            showBillUploadButtons = true;
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
      response: "Oops, something went wrong on my end! Mind trying that again? If it keeps happening, reach out to Henry at chk@powerscouts.com."
    }, { status: 500 });
    }
});