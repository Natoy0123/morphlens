/**
 * AI Prompt Enhancer service.
 *
 * Uses Pollinations' fast chat completions endpoint to enrich brief user ideas
 * into rich, evocative photographic diffusion instructions.
 */

const GEN_BASE = 'https://gen.pollinations.ai';

const ENHANCER_SYSTEM_PROMPT = `You are an elite portrait photographer and fashion art director.
Your task is to take the user's raw styling idea and expand it into a concise, vivid, professional portrait direction (under 40 words).
Focus specifically on:
- Clothing cut, fabric texture, and color palette
- Professional studio or environmental lighting (e.g. soft diffuse key light, subtle rim light)
- Background atmosphere and context
Rules:
- DO NOT add camera lens jargon like "85mm shallow depth of field".
- DO NOT mention changing facial identity, age, race, or facial features.
- Output ONLY the expanded prompt text. Do not include quotes, greetings, or explanations.`;

/**
 * Expand a user's prompt into professional photography attire and lighting instructions.
 *
 * @param {object} params
 * @param {string} params.prompt Raw user prompt
 * @param {string} [params.apiKey] Pollinations API key
 * @returns {Promise<string>} Enhanced prompt string
 */
export async function enhancePrompt({ prompt, apiKey = '' }) {
  const cleanInput = String(prompt || '').trim();
  if (!cleanInput) {
    return cleanInput;
  }

  const key = String(apiKey || '').trim();
  const headers = { 'Content-Type': 'application/json' };
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(`${GEN_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: 'openai/gpt-5.4-mini',
        messages: [
          { role: 'system', content: ENHANCER_SYSTEM_PROMPT },
          { role: 'user', content: cleanInput },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!res.ok) {
      // Fallback to simpler direct enrichment if LLM fails
      return fallbackEnhance(cleanInput);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (content) {
      // Strip any accidental enclosing quotes
      return content.replace(/^["'`]|["'`]$/g, '').trim();
    }
    return fallbackEnhance(cleanInput);
  } catch (err) {
    console.warn('AI prompt enhance fallback:', err);
    return fallbackEnhance(cleanInput);
  } finally {
    clearTimeout(timer);
  }
}

function fallbackEnhance(text) {
  const lower = text.toLowerCase();
  const additions = [];
  if (!lower.includes('lighting') && !lower.includes('light')) {
    additions.push('balanced studio rim lighting');
  }
  if (!lower.includes('fabric') && !lower.includes('tailored') && !lower.includes('suit')) {
    additions.push('high-definition fabric texture');
  }
  if (!lower.includes('focus') && !lower.includes('sharp')) {
    additions.push('sharp focus, professional editorial grade');
  }
  return additions.length > 0 ? `${text}, ${additions.join(', ')}` : text;
}
