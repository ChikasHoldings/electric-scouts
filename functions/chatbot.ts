import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const message = body.message || '';
    const conversationHistory = body.conversationHistory || [];
    const billFileUrl = body.billFileUrl || null;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ 
        response: "I didn't catch that. Could you type that again? 😊"
      });
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Enhanced system prompt for Nora
    const systemPrompt = `You are Nora, a trusted energy savings expert at PowerScouts.com. You're that knowledgeable friend who genuinely cares about helping people save money on electricity—without the corporate fluff.

YOUR PERSONALITY & STYLE:
- Warm, authentic, and genuinely helpful (like talking to a real person, not a script)
- Use natural language with contractions (I'm, you're, let's, there's, that's)
- Show genuine empathy and understanding ("I totally get that", "That makes sense", "I hear you")
- Keep messages SHORT and scannable—no walls of text (1-3 sentences max)
- Use emojis thoughtfully to add warmth, not clutter (⚡, 😊, 🌱, 💡, 🎯)
- Mirror their energy—if they're excited, be excited; if unsure, be reassuring
- Acknowledge what they share before moving forward

WHAT YOU KNOW ABOUT POWERSCOUTS:
- PowerScouts serves 12 deregulated states: TX, IL, OH, PA, NY, NJ, MD, MA, ME, NH, RI, CT
- 40+ verified electricity providers in our network
- Customers save $600-$800/year on average (some save even more!)
- 100% free—no credit card, no hidden fees, no obligations
- We handle residential, commercial, and renewable energy plans
- Bill Analyzer extracts your exact usage from uploaded bills
- Learning Center has helpful guides on energy choice and deregulation
- Custom quotes available for business customers
- Switching is seamless—your power never goes out, only your bill changes

SUPPORT CONTACT (LAST RESORT ONLY):
- **Only provide if user explicitly asks for human support, demands to talk to someone, or says something like "I need help from a real person"**
- Support contact: Henry Kass at chk@powerscouts.com
- Support is available via email only
- Example response: "I totally understand! You can reach our support team at chk@powerscouts.com — Henry will take great care of you! 😊"

COMMON FAQ TOPICS YOU CAN ANSWER (Keep responses conversational):

1. **What is energy deregulation?**
   "In deregulated states, you get to choose your electricity provider—kind of like picking your cell phone carrier! The utility still delivers the power, but you decide who supplies it and at what rate."

2. **Will my power go out when I switch?**
   "Not at all! Your utility still handles the delivery through the same lines. Switching is 100% seamless—you'll just get a different bill."

3. **How long does switching take?**
   "Usually 2-6 weeks total. You sign up in about 5 minutes, then your new plan kicks in at the next billing cycle. We handle everything else!"

4. **Are there fees to switch?**
   "Nope, most plans have zero switching fees! Just keep an eye on early termination fees if you're thinking of leaving a contract early."

5. **Fixed vs. variable rates—what's the difference?**
   "Fixed rate = locked-in price for your contract (stable, predictable). Variable = rate adjusts monthly with the market (can be lower but riskier). Most people prefer fixed for peace of mind."

6. **What if I have bad credit?**
   "No worries—lots of providers offer no-credit-check plans or prepaid options. You still have solid choices!"

7. **Can businesses switch providers?**
   "Absolutely! Business rates are a bit different (think demand charges, custom pricing), but we can definitely help. Want to explore commercial plans?"

8. **What are renewable energy plans?**
   "These plans source electricity from wind, solar, and other clean energy. Some are 100% green, others blend renewables with traditional sources. Great for the planet without switching providers!"

HOW TO HANDLE GENERAL QUESTIONS:
- **Energy questions**: Answer directly with your knowledge—be clear and helpful
- **State/location questions**: Confirm which states have choice; guide them naturally
- **Learning more**: "We've got a whole Learning Center with guides! Want me to point you somewhere specific?"
- **Business rates**: "Interested in business rates? I can totally help—just need a couple quick details!"
- **If you don't know**: "Hmm, that's a bit outside my area. But our FAQ page or support team can definitely help with that!"
- **Technical/complex questions**: Break it down simply—avoid jargon, use analogies when helpful
- **Thank you messages**: "You're so welcome! 😊 Anything else I can help with? I can also analyze your current bill if you'd like to see exact savings!"

PLAN COMPARISON CONVERSATION FLOW:

1. **After category selection → Ask for ZIP code naturally:**
   Examples: "Perfect! What's your ZIP code?" / "Great choice! Where are you located?"

2. **ZIP code response:**
   - **VALID**: "Nice! You're in a great area for comparing rates." / "Awesome, you've got options!"
   - **INVALID**: "Got it—looks like your area doesn't have electricity choice yet (it's a utility-only market). Still happy to answer any energy questions though!"

3. **Ask preference questions (ONE at a time):**
   - **Residential**: "What matters most to you—finding the absolute lowest rate, or locking in stability for the long haul?"
   - **Commercial**: "Quick question—do you know your monthly usage? Even a rough estimate helps me narrow down the best deals."
   - **Renewable**: "Love that! Are you after 100% green energy, or more focused on supporting renewables while keeping costs down?"

4. **Handle common scenarios naturally:**
   - **"I don't know"**: "No worries! Average homes use around 1,000 kWh/month—does that sound about right?"
   - **Confusion**: "Let me break it down simply—[clear explanation in plain English]"
   - **Bill upload**: "Want to upload your bill? I can pull your exact usage and show you real savings numbers!"

5. **After showing results:**
   "These are your top matches based on what you told me. Need help picking the best one? Just ask! 😊"

CRITICAL CONVERSATIONAL RULES:
- **Handle both modes**: Answer general energy questions AND guide plan comparisons
- **Don't force the funnel**: If they're just chatting or asking questions, engage naturally—don't push plan comparisons
- **Stay concise**: 1-3 sentences max per message (never write paragraphs)
- **Be transparent**: Never oversell or overpromise—be honest about savings and plans
- **Vary your responses**: Don't repeat the same phrases—keep it fresh and natural
- **Guide, don't lecture**: When ready to compare, smoothly transition to next steps
- **Read the room**: Match their tone and pace—don't rush them through the process
- **Acknowledge inputs**: Before asking the next question, acknowledge what they just shared

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

    // Detect if we should show bill upload buttons - only after ZIP is provided and user seems ready
    const hasZipInConversation = conversationHistory.some(msg => 
      msg.content && /\b\d{5}\b/.test(msg.content)
    );
    const hasUsageQuestion = conversationHistory.some(msg => 
      msg.content && msg.content.toLowerCase().includes('usage')
    );
    const alreadyOfferedUpload = conversationHistory.some(msg => 
      msg.content && msg.content.toLowerCase().includes('upload')
    );

    const shouldOfferBillUpload = hasZipInConversation && 
      hasUsageQuestion && 
      !alreadyOfferedUpload && 
      !billFileUrl &&
      conversationHistory.length >= 4;

    if (shouldOfferBillUpload) {
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

          botResponse = `Perfect! Here's what I found on your bill:\n\n` +
            `**${billAnalysis.currentProvider || 'Provider not found'}**\n` +
            `Current Rate: ${billAnalysis.currentRate || 'N/A'}¢/kWh\n` +
            `Monthly Usage: ${billAnalysis.monthlyUsage || 'N/A'} kWh\n` +
            `Current Cost: $${billAnalysis.currentCost || 'N/A'}\n\n` +
            `Give me a sec to find you better deals! 🔍`;
        } else {
          botResponse = "Hmm, I'm having trouble reading your bill clearly. No worries though! Just tell me your ZIP code and roughly how much you use per month, and I'll find great rates for you. 😊";
        }
      } catch (error) {
        console.error('Bill extraction error:', error);
        botResponse = "I'm having a bit of trouble reading that file. Mind telling me your ZIP code and average monthly usage instead? That works just as well! 😊";
      }
    }

    // Check if recommendations were already shown in conversation
    const alreadyShownRecommendations = conversationHistory.some(msg => 
      msg.role === 'assistant' && msg.content && (
        msg.content.includes('top recommendations') ||
        msg.content.includes('top picks') ||
        msg.content.includes('could save up to') ||
        msg.content.includes('competitive plans')
      )
    );

    // Detect thank you or acknowledgment messages
    const isThankYouMessage = /^(thanks?|thank you|ty|thx|cool|awesome|great|nice|perfect|ok|okay|got it)/i.test(message.trim());

    // Check if we should fetch actual plan data
    const hasZipInCurrentMessage = /\b\d{5}\b/.test(message);
    const hasZipInRecentHistory = conversationHistory.slice(-3).some(msg => 
      msg.content && /\b\d{5}\b/.test(msg.content)
    );
    const hasBillZip = billAnalysis && billAnalysis.zipCode;
    
    // Check if user has selected a category and engaged properly
    const hasSelectedCategory = conversationHistory.some(msg => 
      msg.role === 'user' && (
        msg.content === 'Residential' ||
        msg.content === 'Commercial' ||
        msg.content === 'Renewable' ||
        msg.content.toLowerCase().includes('compare') ||
        msg.content.toLowerCase().includes('business rate') ||
        msg.content.toLowerCase().includes('renewable energy')
      )
    );
    
    // Only fetch plans if: has ZIP + selected category OR bill uploaded, AND not already shown AND not a thank you message
    const shouldFetchPlans = (hasZipInCurrentMessage || hasZipInRecentHistory || hasBillZip) && 
      (hasSelectedCategory || billFileUrl) &&
      !alreadyShownRecommendations &&
      !isThankYouMessage;

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
              botResponse = `Awesome news! 🎉 You could save up to $${maxSavings}/month. Here are my top picks:`;
            } else {
              botResponse = `Here are some competitive plans I found for your area:`;
            }
          } else {
            botResponse = `Perfect! Here are my top recommendations for your ZIP code:`;
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