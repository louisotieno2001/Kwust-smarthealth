const { env } = require('../config/env');

const FALLBACK_REPLY = 'I am currently unable to reach the health assistant. Please try again shortly. If your symptoms are severe or urgent, visit the university health center or contact a healthcare professional immediately.';

const SYSTEM_PROMPT = [
  'You are the KWUST SmartHealth assistant, a caring and confidential health information guide for university students.',
  'Give clear, practical general health information. Keep answers concise but complete, and include every key point the user needs.',
  'Format answers as plain Markdown: short paragraphs, and use "- " bullet lists or "1. " numbered lists when listing items. Do not use tables, HTML, or code blocks.',
  'Never diagnose, prescribe, or claim to replace a clinician.',
  'For emergency symptoms, tell the user to seek immediate medical help.',
  'Do not ask for or repeat identifying details.',
].join(' ');

function geminiGenerationConfig(model) {
  const config = { maxOutputTokens: env.ai.maxTokens, temperature: 0.4 };
  if (/^gemini-(?:3|4)(?:\.|-|$)/.test(model)) {
    config.thinkingConfig = { thinkingLevel: 'low' };
  } else if (/^gemini-2\.5/.test(model)) {
    config.thinkingConfig = { thinkingBudget: 0 };
  }
  return config;
}

function endpoint(baseUrl, path) {
  return `${String(baseUrl || '').replace(/\/+$/, '')}${path}`;
}

async function postJson(url, options) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(env.ai.timeoutMs),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.error) {
    const detail = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function askGemini(text) {
  const models = [...new Set([
    env.gemini.model,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter(Boolean))];

  let lastError = new Error('Gemini returned no response');
  for (const model of models) {
    try {
      const payload = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.gemini.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text }] }],
            generationConfig: geminiGenerationConfig(model),
          }),
        },
      );

      const candidate = payload?.candidates?.[0];
      const reply = (candidate?.content?.parts || [])
        .filter((part) => part && part.text && !part.thought)
        .map((part) => part.text)
        .join('')
        .trim();

      if (candidate?.finishReason === 'MAX_TOKENS') {
        lastError = new Error(`Gemini model ${model} response was truncated`);
        continue;
      }
      if (reply) return { reply, model };
      lastError = new Error(`Gemini model ${model} returned an empty response`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function askOpenAI(text) {
  const payload = await postJson(endpoint(env.openai.baseUrl, '/chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: env.openai.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: env.ai.maxTokens,
      temperature: 0.4,
    }),
  });

  const choice = payload?.choices?.[0];
  if (choice?.finish_reason === 'length') throw new Error('OpenAI response was truncated');
  const reply = choice?.message?.content?.trim();
  if (!reply) throw new Error('OpenAI returned an empty response');
  return { reply, model: env.openai.model };
}

async function askAnthropic(text) {
  const payload = await postJson(endpoint(env.anthropic.baseUrl, '/v1/messages'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.anthropic.apiKey,
      'anthropic-version': env.anthropic.version,
    },
    body: JSON.stringify({
      model: env.anthropic.model,
      max_tokens: env.ai.maxTokens,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    }),
  });

  if (payload?.stop_reason === 'max_tokens') throw new Error('Anthropic response was truncated');
  const reply = (payload?.content || [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join(' ')
    .trim();
  if (!reply) throw new Error('Anthropic returned an empty response');
  return { reply, model: env.anthropic.model };
}

const PROVIDERS = {
  gemini: { label: 'Gemini', configured: () => Boolean(env.gemini.apiKey), run: askGemini },
  openai: { label: 'OpenAI', configured: () => Boolean(env.openai.apiKey), run: askOpenAI },
  anthropic: { label: 'Anthropic', configured: () => Boolean(env.anthropic.apiKey), run: askAnthropic },
};

function availableProviders() {
  const configuredOrder = [...env.ai.order, ...Object.keys(PROVIDERS).filter((name) => !env.ai.order.includes(name))];
  return [...new Set(configuredOrder)]
    .map((name) => PROVIDERS[name])
    .filter((provider) => provider && provider.configured());
}

async function askHealth(message) {
  const text = String(message || '').trim().slice(0, 1200);
  if (!text) return { reply: 'Please type a health question and I will do my best to help.', offline: false };

  const providers = availableProviders();
  if (!providers.length) return { reply: FALLBACK_REPLY, offline: true };

  for (const provider of providers) {
    try {
      const result = await provider.run(text);
      if (result?.reply) {
        return { reply: result.reply, offline: false, provider: provider.label, model: result.model };
      }
    } catch (error) {
      console.error(`AI provider failed (${provider.label}): ${error.message}`);
    }
  }

  return { reply: FALLBACK_REPLY, offline: true };
}

module.exports = { askHealth, FALLBACK_REPLY, SYSTEM_PROMPT };
