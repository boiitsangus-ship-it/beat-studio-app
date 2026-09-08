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

  function normalizeMaxTokens(value) {
    const n = Number(value);
    return Math.min(Math.max(Number.isFinite(n) ? Math.trunc(n) : 1200, 1), 2400);
  }

  function validateImageUrl(value) {
    if (!value) return null;
    const text = String(value);
    if (text.startsWith('data:image/')) return text;
    const u = new URL(text, location.href);
    if (!['http:', 'https:', 'blob:'].includes(u.protocol)) throw new Error('Unsupported image URL.');
    if (u.username || u.password) throw new Error('Credentials in image URL are not allowed.');
    return u.href;
  }

  async function withTimeout(factory, ms = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try { return await factory(controller.signal); }
    finally { clearTimeout(timer); }
  }

  async function health() {
    try {
      const response = await withTimeout(signal => fetch(MODELS_ENDPOINT, { method: 'GET', signal, cache: 'no-store', credentials: 'omit' }), 5000);
      if (!response.ok) return { ok: false, model: MODEL_ID, error: `http_${response.status}` };
      const data = await response.json();
      const models = Array.isArray(data?.data) ? data.data.map(x => x?.id).filter(Boolean) : [];
      return { ok: models.includes(MODEL_ID), model: MODEL_ID, discoveredModels: models };
    } catch (error) {
      return { ok: false, model: MODEL_ID, error: error?.name === 'AbortError' ? 'timeout' : 'unreachable' };
    }
  }

  async function run(prompt, options = {}) {
    const text = assertSafePrompt(prompt);
    const content = [{ type: 'text', text }];
    const imageUrl = validateImageUrl(options.imageUrl);
    if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl } });

    const body = {
      model: MODEL_ID,
      messages: [
        { role: 'system', content: 'You are LilyASI local agent. Help the user directly, prefer reversible actions, explain blocked or unavailable capabilities, and do not claim an action completed unless a tool or runtime confirms it.' },
        { role: 'user', content }
      ],
      temperature: 0.2,
      max_tokens: normalizeMaxTokens(options.maxTokens)
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
    if (typeof message !== 'string' || !message.trim()) throw new Error('Muse Glimmer returned no assistant content.');
    return { ok: true, model: MODEL_ID, content: message.trim() };
  }

  const api = Object.freeze({ MODEL_ID, ENDPOINT, health, run });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.MetaMuseProvider = api;
})();
