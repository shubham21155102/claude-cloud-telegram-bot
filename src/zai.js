const ZAI_API_URL = process.env.ZAI_API_URL || 'https://api.z.ai/api/anthropic/v1/messages';
const ZAI_API_KEY = process.env.ZAI_API_KEY;
const ZAI_MODEL = process.env.ZAI_MODEL || 'claude-opus-4-5-20251101';

if (!ZAI_API_KEY) {
  console.warn('⚠️  ZAI_API_KEY not set — /enhance and /ask commands will not work');
}

/**
 * Send a message to Z.AI API and return the response text
 */
async function chat(messages, { maxTokens = 4096, system } = {}) {
  if (!ZAI_API_KEY) throw new Error('ZAI_API_KEY is not configured');

  const body = {
    model: ZAI_MODEL,
    max_tokens: maxTokens,
    messages,
  };

  if (system) body.system = system;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000); // 2 min timeout

  try {
    const res = await fetch(ZAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ZAI_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error (${res.status}): ${text}`);
    }

    const data = await res.json();
    return data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Enhance a short prompt into a detailed, descriptive one
 */
async function enhancePrompt(shortPrompt) {
  const system = `You are a prompt engineering expert. Your job is to take a short, vague prompt and transform it into a detailed, well-structured, and descriptive prompt that will produce much better results when given to an AI assistant or used in a GitHub issue.

Rules:
- Keep the original intent intact
- Add context, constraints, expected output format, and edge cases
- Make it actionable and specific
- Return ONLY the enhanced prompt, no explanations or preamble`;

  return chat(
    [{ role: 'user', content: `Enhance this prompt:\n\n${shortPrompt}` }],
    { system }
  );
}

/**
 * General Q&A
 */
async function askQuestion(question) {
  return chat([{ role: 'user', content: question }]);
}

module.exports = { enhancePrompt, askQuestion };