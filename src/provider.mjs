import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';

export const MODEL_ID = 'meta-models/Muse-Glimmer-30B';
const DEFAULT_BASE = 'http://127.0.0.1:8000/v1';
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

function isLoopback(hostname) { return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1'; }
function getBaseUrl() { return process.env.META_BASE_URL || process.env.MUSE_GLIMMER_BASE_URL || DEFAULT_BASE; }

export function getModelConfig() {
  const u = new URL(getBaseUrl());
  if (u.username || u.password) throw new Error('CREDENTIALS_IN_URL_FORBIDDEN');
  if (process.env.NODE_ENV === 'production' && u.protocol !== 'https:') throw new Error('TLS_REQUIRED');
  if (u.protocol === 'http:' && !isLoopback(u.hostname)) throw new Error('PLAINTEXT_REMOTE_FORBIDDEN');
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('UNSUPPORTED_PROTOCOL');
  return { baseUrl: u.toString().replace(/\/$/, ''), model: MODEL_ID };
}

export class GlimmerProvider {
  constructor({ baseUrl, timeoutMs = 45_000, apiKey = process.env.META_API_KEY || null } = {}) {
    const cfg = getModelConfig();
    const u = new URL(baseUrl || cfg.baseUrl);
    if (u.username || u.password) throw new Error('CREDENTIALS_IN_URL_FORBIDDEN');
    if (process.env.NODE_ENV === 'production' && u.protocol !== 'https:') throw new Error('TLS_REQUIRED');
    if (u.protocol === 'http:' && !isLoopback(u.hostname)) throw new Error('PLAINTEXT_REMOTE_FORBIDDEN');
    this.baseUrl = u.toString().replace(/\/$/, '');
    this.model = MODEL_ID;
    this.timeoutMs = Math.max(100, Math.min(Number(timeoutMs) || 45_000, 120_000));
    this.apiKey = apiKey;
  }

  get modelsEndpoint() { return `${this.baseUrl}/models`; }
  get chatEndpoint() { return `${this.baseUrl}/chat/completions`; }

  _fetch(url, opts = {}) {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const headers = { ...(opts.headers || {}) };
      if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
      const req = lib.request(parsed, { method: opts.method || 'GET', headers, timeout: this.timeoutMs }, res => {
        let total = 0; const chunks = [];
        res.on('data', chunk => {
          total += chunk.length;
          if (total > MAX_RESPONSE_BYTES) { req.destroy(new Error('MODEL_RESPONSE_TOO_LARGE')); return; }
          chunks.push(chunk);
        });
        res.on('end', () => {
          const data = Buffer.concat(chunks).toString('utf8');
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, headers: res.headers,
            text: async () => data,
            json: async () => { try { return JSON.parse(data); } catch { throw new Error('MALFORMED_JSON_RESPONSE'); } }
          });
        });
      });
      req.on('error', reject);
      req.on('timeout', () => req.destroy(new Error('MODEL_REQUEST_TIMEOUT')));
      if (opts.body) req.write(opts.body);
      req.end();
    });
  }

  async health() {
    try {
      const res = await this._fetch(this.modelsEndpoint, { method: 'GET' });
      if (!res.ok) return { ok: false, provider: 'meta', model: MODEL_ID, error: `HTTP_${res.status}`, status: 'MODEL_HEALTH_FAIL' };
      const data = await res.json();
      const discovered = Array.isArray(data?.data) ? data.data.map(i => i?.id).filter(Boolean) : [];
      const exact = discovered.includes(MODEL_ID);
      return { ok: exact, provider: 'meta', expectedModel: MODEL_ID, discoveredModels: discovered, status: exact ? 'MODEL_HEALTH_PASS' : 'MODEL_ID_MISMATCH' };
    } catch (e) {
      return { ok: false, provider: 'meta', model: MODEL_ID, error: e.message || 'MODEL_SERVER_UNREACHABLE', status: 'MODEL_HEALTH_FAIL' };
    }
  }

  async run(prompt, { maxTokens = 1200, temperature = 0.2 } = {}) {
    if (typeof prompt !== 'string' || !prompt.trim()) throw new Error('PROMPT_REQUIRED');
    if (prompt.length > 12_000) throw new Error('PROMPT_TOO_LARGE');
    const max = Math.min(Math.max(Math.trunc(Number(maxTokens) || 1200), 1), 2400);
    const temp = Number.isFinite(Number(temperature)) ? Math.max(0, Math.min(Number(temperature), 2)) : 0.2;
    const started = Date.now(); const clientRequestId = crypto.randomUUID();
    const res = await this._fetch(this.chatEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Lily-Request-ID': clientRequestId },
      body: JSON.stringify({ model: MODEL_ID, messages: [
        { role: 'system', content: 'You are LilyASI running through Jarvis 7. Never claim a tool action completed unless the runtime confirms it.' },
        { role: 'user', content: prompt.trim() }
      ], max_tokens: max, temperature: temp })
    });
    if (!res.ok) throw new Error(`META_INFERENCE_HTTP_${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('EMPTY_META_RESPONSE');
    return { ok: true, provider: 'meta', model: MODEL_ID, requestId: data?.id || clientRequestId, clientRequestId, latencyMs: Date.now() - started, content: content.trim() };
  }
}

export async function runLilyProof(provider = new GlimmerProvider()) {
  const health = await provider.health();
  if (!health.ok || health.expectedModel !== MODEL_ID) return { ok: false, stage: 'MODEL_HEALTH', health };
  const nonce = `LILY-PROOF-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  const result = await provider.run(`Return exactly this token and nothing else: ${nonce}`, { maxTokens: 80, temperature: 0 });
  const match = result.content === nonce;
  return { ok: match, stage: 'LIVE_INFERENCE', nonce, response: result.content, nonceMatch: match, provider: result.provider, model: result.model, requestId: result.requestId, timestamp: new Date().toISOString() };
}
