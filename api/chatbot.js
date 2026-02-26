import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [], billFileUrl } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.json({ 
        response: "I didn't catch that. Could you type that again? 😊"
      });
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // System prompt for Nora
    const systemPrompt = `You are Nora, a trusted energy savings expert at ElectricScouts.com. You're that knowledgeable friend who genuinely cares about helping people save money on electricity—without the corporate fluff.

YOUR PERSONALITY & STYLE:
- Warm, authentic, and genuinely helpful (like talking to a real person, not a script)
- Use natural language with contractions (I'm, you're, let's, there's, that's)
- Show genuine empathy and understanding ("I totally get that", "That makes sense", "I hear you")
- Keep messages SHORT and scannable—no walls of text (1-3 sentences max)
- Use emojis thoughtfully to add warmth, not clutter (⚡, 😊, 🌱, 💡, 🎯)
- Mirror their energy—if they're excited, be excited; if unsure, be reassuring
- Acknowledge what they share before moving forward

WHAT YOU KNOW ABOUT ELECTRICSCOUTS:
- ElectricScouts serves 12 deregulated states: TX, IL, OH, PA, NY, NJ, MD, MA, ME, NH, RI, CT
- 40+ verified electricity providers in our network
- Customers save $600-$800/year on average (some save even more!)
- 100% free—no credit card, no hidden fees, no obligations
- We handle residential, commercial, and renewable energy plans
- Bill Analyzer extracts your exact usage from uploaded bills
- Learning Center has helpful guides on energy choice and deregulation
- Custom quotes available for business customers
- Switching is seamless—your power never goes out, only your bill changes

SUPPORT CONTACT (LAST RESORT ONLY):
- Only provide if user explicitly asks for human support
- Support contact: Henry Kass at chk@electricscouts.com
- Support is available via email only

COMMON FAQ TOPICS YOU CAN ANSWER:

1. **What is energy deregulation?**
   "In deregulated states, you get to choose your electricity provider—kind of like picking your cell phone carrier! The utility still delivers the power, but you decide who supplies it and at what rate."

2. **Will my power go out when I switch?**
   "Not at all! Your utility still handles the delivery through the same lines. Switching is 100% seamless—you'll just get a different bill."

3. **How long does switching take?**
   "Usually 2-6 weeks total. You sign up in about 5 minutes, then your new plan kicks in at the next billing cycle."

4. **Are there fees to switch?**
   "Nope, most plans have zero switching fees! Just keep an eye on early termination fees if you're thinking of leaving a contract early."

5. **Fixed vs. variable rates—what's the difference?**
   "Fixed rate = locked-in price for your contract (stable, predictable). Variable = rate adjusts monthly with the market (can be lower but riskier). Most people prefer fixed for peace of mind."

6. **What if I have bad credit?**
   "No worries—lots of providers offer no-credit-check plans or prepaid options. You still have solid choices!"

7. **Can businesses switch providers?**
   "Absolutely! Business rates are a bit different (think demand charges, custom pricing), but we can definitely help."

8. **What are renewable energy plans?**
   "These plans source electricity from wind, solar, and other clean energy. Some are 100% green, others blend renewables with traditional sources."

HOW TO HANDLE GENERAL QUESTIONS:
- Energy questions: Answer directly with your knowledge
- State/location questions: Confirm which states have choice
- Learning more: "We've got a whole Learning Center with guides!"
- Business rates: "Interested in business rates? I can totally help!"
- If you don't know: "Hmm, that's a bit outside my area."

PLAN COMPARISON CONVERSATION FLOW:
1. After category selection → Ask for ZIP code naturally
2. ZIP code response → Validate and acknowledge
3. Ask preference questions (ONE at a time)
4. Handle common scenarios naturally
5. After showing results → Offer to help pick

CRITICAL RULES:
- Handle both modes: Answer general questions AND guide plan comparisons
- Don't force the funnel
- Stay concise: 1-3 sentences max
- Be transparent: Never oversell
- Vary your responses

Previous conversation:
${conversationContext}

User's latest message: ${message}

Respond as Nora would in a real conversation. Be warm, natural, and helpful!`;

    // Call OpenAI-compatible LLM
    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const llmData = await llmResponse.json();
    let botResponse = llmData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that. Could you try again?";
    let recommendations = null;
    let billAnalysis = null;
    let showBillUploadButtons = false;

    // Detect if we should show bill upload buttons
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
        // Use LLM to extract bill data
        const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [
              { 
                role: 'system', 
                content: 'Extract the following from this electricity bill image/document: current_provider, current_rate (cents per kWh), monthly_usage (kWh), current_cost (dollars), zip_code. Return as JSON only.' 
              },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: 'Extract bill data from this document.' },
                  { type: 'image_url', image_url: { url: billFileUrl } }
                ]
              }
            ],
            max_tokens: 300,
            temperature: 0,
          }),
        });

        const extractionData = await extractionResponse.json();
        const extractedText = extractionData.choices?.[0]?.message?.content || '';
        
        // Try to parse JSON from the response
        const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          billAnalysis = {
            currentProvider: extracted.current_provider,
            currentRate: extracted.current_rate,
            monthlyUsage: extracted.monthly_usage,
            currentCost: extracted.current_cost,
            zipCode: extracted.zip_code
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

    // Check if recommendations were already shown
    const alreadyShownRecommendations = conversationHistory.some(msg => 
      msg.role === 'assistant' && msg.content && (
        msg.content.includes('top recommendations') ||
        msg.content.includes('top picks') ||
        msg.content.includes('could save up to') ||
        msg.content.includes('competitive plans')
      )
    );

    const isThankYouMessage = /^(thanks?|thank you|ty|thx|cool|awesome|great|nice|perfect|ok|okay|got it)$/i.test(message.trim());

    // Check if we should fetch actual plan data
    const hasZipInCurrentMessage = /\b\d{5}\b/.test(message);
    const hasZipInRecentHistory = conversationHistory.slice(-3).some(msg => 
      msg.content && /\b\d{5}\b/.test(msg.content)
    );
    const hasBillZip = billAnalysis && billAnalysis.zipCode;
    
    const hasSelectedCategory = conversationHistory.some(msg => 
      msg.role === 'user' && (
        msg.content === 'Residential' ||
        msg.content === 'Compare or find rates' ||
        msg.content === 'Commercial' ||
        msg.content === 'Business rate' ||
        msg.content === 'Renewable' ||
        msg.content === 'Renewable energy' ||
        msg.content.toLowerCase().includes('compare') ||
        msg.content.toLowerCase().includes('business') ||
        msg.content.toLowerCase().includes('renewable')
      )
    );
    
    const shouldFetchPlans = (hasZipInCurrentMessage || hasZipInRecentHistory || hasBillZip) && 
      (hasSelectedCategory || billFileUrl) &&
      !alreadyShownRecommendations &&
      !isThankYouMessage;

    if (shouldFetchPlans) {
      let zipCode = billAnalysis?.zipCode;
      if (!zipCode) {
        const zipMatch = (conversationHistory.map(m => m.content).join(' ') + ' ' + message).match(/\b(\d{5})\b/);
        zipCode = zipMatch ? zipMatch[1] : null;
      }
      
      if (zipCode) {
        // Fetch plans from Supabase
        const { data: plans } = await supabase
          .from('electricity_plans')
          .select('*')
          .order('rate_per_kwh', { ascending: true });
        
        const { data: providers } = await supabase
          .from('electricity_providers')
          .select('*')
          .eq('is_active', true);
        
        if (plans && plans.length > 0) {
          const filteredPlans = plans
            .filter(p => !p.plan_name?.toLowerCase().includes('business'))
            .sort((a, b) => a.rate_per_kwh - b.rate_per_kwh)
            .slice(0, 5);

          if (filteredPlans.length > 0) {
            const usage = billAnalysis?.monthlyUsage || 1000;
            const currentCost = billAnalysis?.currentCost || 0;
            
            recommendations = filteredPlans.map(plan => {
              const provider = providers?.find(p => p.name === plan.provider_name);
              const estimatedCost = (plan.rate_per_kwh * usage / 100 + (plan.monthly_base_charge || 0)).toFixed(2);
              const savings = currentCost > 0 ? Math.max(0, (currentCost - parseFloat(estimatedCost))).toFixed(2) : 0;
              
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
    }

    return res.json({
      response: botResponse,
      recommendations,
      billAnalysis,
      showBillUploadButtons
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ 
      error: error.message,
      response: "I apologize, but I'm having trouble processing your request right now. Could you please try again?"
    });
  }
}
