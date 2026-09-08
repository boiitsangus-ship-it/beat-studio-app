(() => {
  'use strict';

  const MODEL_ID = 'meta-models/Muse-Glimmer-30B';
  const ENDPOINT = 'http://127.0.0.1:8000/v1/chat/completions';
  const MODELS_ENDPOINT = 'http://127.0.0.1:8000/v1/models';
  const REQUEST_TIMEOUT_MS = 45000;

  function assertSafePrompt(prompt) {
    if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('Prompt is required.');
    if (prompt.length > 12000) throw new Error('Prompt exceeds local-agent limit.');
    return prompt.trim();
  }

  async function withTimeout(promise, ms = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try { return await promise(controller.signal); }
    finally { clearTimeout(timer); }
  }

  async function health() {
    try {
      const response = await withTimeout(signal => fetch(MODELS_ENDPOINT, { method: 'GET', signal, cache: 'no-store' }), 5000);
      if (!response.ok) return { ok: false, model: MODEL_ID, error: `http_${response.status}` };
      const data = await response.json();
      const models = Array.isArray(data?.data) ? data.data.map(x => x?.id).filter(Boolean) : [];
      return { ok: models.includes(MODEL_ID) || models.length > 0, model: MODEL_ID, discoveredModels: models };
    } catch (error) {
      return { ok: false, model: MODEL_ID, error: error?.name === 'AbortError' ? 'timeout' : 'unreachable' };
    }
  }

  async function run(prompt, options = {}) {
    const text = assertSafePrompt(prompt);
    const content = [{ type: 'text', text }];
    if (options.imageUrl) content.push({ type: 'image_url', image_url: { url: options.imageUrl } });

    const body = {
      model: MODEL_ID,
      messages: [
        { role: 'system', content: 'You are LilyASI local agent. Help the user directly, prefer reversible actions, explain blocked or unavailable capabilities, and do not claim an action completed unless a tool or runtime confirms it.' },
        { role: 'user', content }
      ],
      temperature: 0.2,
      max_tokens: Math.min(Number(options.maxTokens) || 1200, 2400)
    };

    const response = await withTimeout(signal => fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
      cache: 'no-store',
      credentials: 'omit'
    }));

    if (!response.ok) throw new Error(`Muse Glimmer request failed (${response.status}).`);
    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content;
    if (!message) throw new Error('Muse Glimmer returned no assistant content.');
    return { ok: true, model: MODEL_ID, content: message };
  }

  const api = Object.freeze({ MODEL_ID, ENDPOINT, health, run });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.MetaMuseProvider = api;
})();
