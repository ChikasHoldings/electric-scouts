const openaiApiKey = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key is configured
  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY is not configured');
    return res.status(500).json({ 
      error: 'AI extraction service is not configured. Please contact support.',
      status: 'error'
    });
  }

  try {
    const { file_url, extraction_prompt, json_schema } = req.body;

    if (!file_url) {
      return res.status(400).json({ error: 'file_url is required', status: 'error' });
    }

    // Build the extraction prompt from json_schema if provided,
    // otherwise fall back to the custom prompt or default
    let prompt;

    if (json_schema && json_schema.properties) {
      // Build a precise prompt from the schema so field names match exactly
      const fields = Object.entries(json_schema.properties)
        .map(([key, val]) => `  "${key}": ${val.description || val.type}`)
        .join('\n');

      prompt = `You are analyzing an electricity bill document. Extract the following fields and return ONLY a valid JSON object with these exact field names and types:
{
${fields}
}

IMPORTANT INSTRUCTIONS:
- For monthly_usage_kwh: Look for "kWh Used", "Total Usage", "Energy Used", or similar. This is the total kilowatt-hours consumed.
- For monthly_cost: Look for "Total Amount Due", "Total Charges", "Amount Due", or the final bill total in dollars.
- For rate_per_kwh: Look for "Price per kWh", "Energy Charge Rate", or calculate from total cost / usage. Express in CENTS (e.g., 12.5 for 12.5¢/kWh).
- For provider_name: The electricity company name, usually at the top of the bill.
- For zip_code: The service address ZIP code.
- If a field cannot be determined, use null for strings and 0 for numbers.
- Return JSON only, no explanation or markdown.`;
    } else if (extraction_prompt) {
      prompt = extraction_prompt;
    } else {
      prompt = `You are analyzing an electricity bill document. Extract the following and return as a JSON object with these exact field names:
{
  "customer_name": (string, the customer/account holder name on the bill),
  "service_address": (string, the full service address where electricity is delivered),
  "monthly_usage_kwh": (number, monthly electricity usage in kWh),
  "monthly_cost": (number, total monthly cost in dollars),
  "rate_per_kwh": (number, rate per kWh in cents),
  "contract_term": (number, contract term in months, or null if unknown),
  "provider_name": (string, current electricity provider/company name, usually at the top of the bill),
  "plan_name": (string, current plan/product name, or null if unknown),
  "zip_code": (string, service address ZIP code),
  "account_number": (string, the account or customer number),
  "billing_period": (string, the billing period dates, e.g. "Dec 5 - Jan 6, 2026")
}
IMPORTANT:
- For monthly_usage_kwh: Look for "kWh Used", "Total Usage", "Energy Used", or similar.
- For monthly_cost: Look for "Total Amount Due", "Total Charges", "Amount Due", or the final bill total.
- For rate_per_kwh: Look for "Price per kWh", "Energy Charge Rate", or calculate from total cost / usage. Express in CENTS (e.g., 12.5 for 12.5¢/kWh).
- For customer_name: Look for "Name", "Customer", "Account Holder" on the bill.
- For service_address: Look for "Service Address", "Delivery Address", or the address where electricity is delivered.
- If a field cannot be determined, use null for strings and 0 for numbers.
- Return JSON only, no explanation or markdown.`;
    }

    // Build the message content based on file type
    const isBase64Pdf = file_url.startsWith('data:application/pdf;base64,');
    const isBase64Image = file_url.startsWith('data:image/');
    
    let messageContent;
    if (isBase64Pdf || isBase64Image) {
      messageContent = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: file_url } }
      ];
    } else {
      // Regular URL (signed Supabase URL or public URL)
      messageContent = [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: file_url, detail: 'high' } }
      ];
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an expert electricity bill analyzer. You accurately extract structured data from electricity bill documents and images. Always use the exact field names requested. Return only valid JSON with no extra text, markdown, or explanation.' 
          },
          { 
            role: 'user', 
            content: messageContent
          }
        ],
        max_tokens: 800,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenAI API error:', response.status, errBody);
      
      // Provide specific error messages
      if (response.status === 401) {
        return res.status(502).json({ 
          error: 'AI service authentication failed. The API key may be invalid.',
          status: 'error'
        });
      }
      if (response.status === 429) {
        return res.status(502).json({ 
          error: 'AI service rate limit exceeded. Please try again in a moment.',
          status: 'error'
        });
      }
      if (response.status === 400) {
        // Could be image format issue
        return res.status(502).json({ 
          error: 'The uploaded file could not be processed by the AI. Please try a different file format (PNG or JPG recommended).',
          status: 'error',
          details: errBody
        });
      }
      
      return res.status(502).json({ 
        error: 'AI extraction service error', 
        status: 'error',
        details: errBody 
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      const extracted = JSON.parse(content);
      
      // Validate that we got at least some meaningful data
      const hasData = extracted.monthly_usage_kwh > 0 || 
                      extracted.monthly_cost > 0 || 
                      extracted.provider_name;
      
      if (!hasData) {
        console.warn('Extraction returned no meaningful data:', extracted);
        return res.json({ 
          status: 'success', 
          output: extracted,
          warning: 'Limited data could be extracted from this document'
        });
      }
      
      return res.json({ status: 'success', output: extracted });
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', content);
      
      // Try to extract JSON from the response if it's wrapped in markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          return res.json({ status: 'success', output: extracted });
        } catch {
          // Fall through to error
        }
      }
      
      return res.json({ status: 'error', output: null, raw: content, error: 'Failed to parse extraction result' });
    }
  } catch (error) {
    console.error('Data extraction error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error during extraction',
      status: 'error'
    });
  }
}
