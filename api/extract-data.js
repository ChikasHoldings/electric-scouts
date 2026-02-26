const openaiApiKey = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file_url, extraction_prompt } = req.body;

    if (!file_url) {
      return res.status(400).json({ error: 'file_url is required' });
    }

    const prompt = extraction_prompt || 
      'Extract the following from this electricity bill: current_provider, current_rate (cents per kWh), monthly_usage (kWh), current_cost (dollars), zip_code, account_number. Return as JSON only.';

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
            content: 'You are a document extraction assistant. Extract structured data from the provided document/image and return it as clean JSON.' 
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
