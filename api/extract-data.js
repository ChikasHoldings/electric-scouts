const openaiApiKey = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file_url, extraction_prompt, json_schema } = req.body;

    if (!file_url) {
      return res.status(400).json({ error: 'file_url is required' });
    }

    // Build the extraction prompt from json_schema if provided,
    // otherwise fall back to the custom prompt or default
    let prompt;

    if (json_schema && json_schema.properties) {
      // Build a precise prompt from the schema so field names match exactly
      const fields = Object.entries(json_schema.properties)
        .map(([key, val]) => `  "${key}": ${val.description || val.type}`)
        .join('\n');

      prompt = `Extract the following fields from this electricity bill image. Return ONLY a valid JSON object with these exact field names and types:\n{\n${fields}\n}\n\nIf a field cannot be determined, use null for strings and 0 for numbers. Return JSON only, no explanation.`;
    } else if (extraction_prompt) {
      prompt = extraction_prompt;
    } else {
      // Default prompt matching the frontend's expected field names
      prompt = `Extract the following from this electricity bill and return as a JSON object with these exact field names:
{
  "monthly_usage_kwh": (number, monthly electricity usage in kWh),
  "monthly_cost": (number, total monthly cost in dollars),
  "rate_per_kwh": (number, rate per kWh in cents),
  "contract_term": (number, contract term in months, or null if unknown),
  "provider_name": (string, current electricity provider name),
  "plan_name": (string, current plan name, or null if unknown),
  "zip_code": (string, service ZIP code)
}
If a field cannot be determined, use null for strings and 0 for numbers. Return JSON only.`;
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
            content: 'You are a document extraction assistant. Extract structured data from the provided document/image and return it as clean JSON. Always use the exact field names requested. Never add extra fields or explanations.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: file_url } }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenAI API error:', response.status, errBody);
      return res.status(502).json({ error: 'AI extraction service error', details: errBody });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';

    try {
      const extracted = JSON.parse(content);
      return res.json({ status: 'success', output: extracted });
    } catch {
      return res.json({ status: 'error', output: null, raw: content });
    }
  } catch (error) {
    console.error('Data extraction error:', error);
    return res.status(500).json({ error: error.message });
  }
}
