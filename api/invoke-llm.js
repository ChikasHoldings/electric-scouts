const openaiApiKey = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, system_prompt, response_format } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const messages = [];
    if (system_prompt) {
      messages.push({ role: 'system', content: system_prompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody = {
      model: 'gpt-4.1-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    };

    // If JSON response format is requested
    if (response_format === 'json' || response_format?.type === 'json_object') {
      requestBody.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse as JSON if it looks like JSON
    try {
      const parsed = JSON.parse(content);
      return res.json(parsed);
    } catch {
      return res.json({ response: content });
    }
  } catch (error) {
    console.error('LLM invocation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
