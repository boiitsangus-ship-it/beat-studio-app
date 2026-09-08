(() => {
  'use strict';

  const CONTRACT_VERSION = 1;
  const DEFAULT_AGENT = Object.freeze({
    provider: 'meta',
    model: 'meta-models/Muse-Glimmer-30B',
    transport: 'openai-compatible-local',
    endpoint: 'http://127.0.0.1:8000/v1/chat/completions'
  });
  const MESSAGE_TYPES = Object.freeze({
    LILY_HELLO: 'lilyasi:hello',
    JARVIS_READY: 'jarvis:ready',
    HEALTH_REQUEST: 'jarvis:health-request',
    HEALTH_RESPONSE: 'jarvis:health-response'
  });

  const ALLOWED_CAPABILITIES = Object.freeze([
    'task.queue',
    'continuity.export',
    'continuity.import.review',
    'learning.review',
    'agent.infer.local',
    'agent.code.assist',
    'agent.vision.local'
  ]);

  function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function makeHello() {
    return {
      type: MESSAGE_TYPES.LILY_HELLO,
      contractVersion: CONTRACT_VERSION,
      source: 'lilyasi',
      target: 'jarvis7-mobile',
      requestedCapabilities: [...ALLOWED_CAPABILITIES],
      defaultAgent: DEFAULT_AGENT
    };
  }

  function makeReady() {
    return {
      type: MESSAGE_TYPES.JARVIS_READY,
      contractVersion: CONTRACT_VERSION,
      source: 'jarvis7-mobile',
      target: 'lilyasi',
      capabilities: [...ALLOWED_CAPABILITIES],
      defaultAgent: DEFAULT_AGENT
    };
  }

  function validateMessage(message) {
    if (!isObject(message)) return { ok: false, error: 'message_not_object' };
    if (message.contractVersion !== CONTRACT_VERSION) return { ok: false, error: 'version_mismatch' };
    if (!Object.values(MESSAGE_TYPES).includes(message.type)) return { ok: false, error: 'unknown_message_type' };
    return { ok: true };
  }

  function validateReady(message) {
    const base = validateMessage(message);
    if (!base.ok) return base;
    if (message.type !== MESSAGE_TYPES.JARVIS_READY) return { ok: false, error: 'not_ready_message' };
    if (message.source !== 'jarvis7-mobile' || message.target !== 'lilyasi') return { ok: false, error: 'identity_mismatch' };
    if (!Array.isArray(message.capabilities)) return { ok: false, error: 'capabilities_missing' };
    const unexpected = message.capabilities.filter(cap => !ALLOWED_CAPABILITIES.includes(cap));
    if (unexpected.length) return { ok: false, error: 'unexpected_capability', unexpected };
    return { ok: true };
  }

  const api = { CONTRACT_VERSION, DEFAULT_AGENT, MESSAGE_TYPES, ALLOWED_CAPABILITIES, makeHello, makeReady, validateMessage, validateReady };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.LilyJarvisContract = api;
})();
