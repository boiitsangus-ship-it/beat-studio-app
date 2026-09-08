(() => {
  'use strict';

  const VERSION = 1;
  const ALLOWED_MODES = new Set(['chat', 'work', 'learn', 'off']);
  const ALLOWED_MODULES = new Set(['jarvis', 'astra', 'fable', 'lulbro', 'angws', 'phone', 'studio', 'work', 'memory']);
  const TOP_KEYS = new Set(['schemaVersion', 'createdAt', 'mode', 'queue', 'lessons']);
  const ITEM_KEYS = new Set(['module', 'label', 'time', 'mode']);
  const SECRET_PATTERNS = [
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/i,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\b(?:password|passwd|api[_ -]?key|secret|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*\S+/i
  ];

  const hasOnlyKeys = (obj, allowed) => Object.keys(obj).every(key => allowed.has(key));
  const safeString = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max;
  const containsSecretLikeText = value => SECRET_PATTERNS.some(pattern => pattern.test(value));

  function sanitizeQueue(input) {
    if (!Array.isArray(input)) return [];
    const out = [];
    for (const item of input.slice(0, 50)) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      if (!hasOnlyKeys(item, ITEM_KEYS)) continue;
      if (!ALLOWED_MODULES.has(item.module) || !ALLOWED_MODES.has(item.mode)) continue;
      if (!Number.isInteger(item.time) || item.time < 0) continue;
      if (!safeString(item.label, 1000) || containsSecretLikeText(item.label)) continue;
      out.push({ module: item.module, label: item.label, time: item.time, mode: item.mode });
    }
    return out;
  }

  function sanitizeLessons(input) {
    if (!Array.isArray(input)) return [];
    return input
      .slice(0, 100)
      .filter(item => safeString(item, 2000) && !containsSecretLikeText(item));
  }

  function createBackup({ queue = [], lessons = [], mode = 'chat', includeQueue = true, includeLessons = true } = {}) {
    const safeMode = ALLOWED_MODES.has(mode) ? mode : 'chat';
    return {
      schemaVersion: VERSION,
      createdAt: new Date().toISOString(),
      mode: safeMode,
      queue: includeQueue ? sanitizeQueue(queue) : [],
      lessons: includeLessons ? sanitizeLessons(lessons) : []
    };
  }

  function validateBackup(data) {
    const errors = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, errors: ['Backup must be a JSON object.'] };
    if (!hasOnlyKeys(data, TOP_KEYS)) errors.push('Backup contains fields outside the continuity allowlist.');
    if (data.schemaVersion !== VERSION) errors.push(`Unsupported schemaVersion: ${String(data.schemaVersion)}`);
    if (typeof data.createdAt !== 'string' || Number.isNaN(Date.parse(data.createdAt))) errors.push('createdAt must be a valid ISO date-time.');
    if (!ALLOWED_MODES.has(data.mode)) errors.push('Invalid mode.');
    if (!Array.isArray(data.queue) || data.queue.length > 50) errors.push('Invalid queue.');
    if (!Array.isArray(data.lessons) || data.lessons.length > 100) errors.push('Invalid lessons.');

    if (Array.isArray(data.queue)) {
      data.queue.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item) || !hasOnlyKeys(item, ITEM_KEYS)) errors.push(`Queue item ${index} has unexpected fields.`);
        else {
          if (!ALLOWED_MODULES.has(item.module)) errors.push(`Queue item ${index} has invalid module.`);
          if (!ALLOWED_MODES.has(item.mode)) errors.push(`Queue item ${index} has invalid mode.`);
          if (!Number.isInteger(item.time) || item.time < 0) errors.push(`Queue item ${index} has invalid time.`);
          if (!safeString(item.label, 1000) || containsSecretLikeText(item.label)) errors.push(`Queue item ${index} is rejected by the privacy filter.`);
        }
      });
    }

    if (Array.isArray(data.lessons)) {
      data.lessons.forEach((item, index) => {
        if (!safeString(item, 2000) || containsSecretLikeText(item)) errors.push(`Lesson ${index} is rejected by the privacy filter.`);
      });
    }

    return { ok: errors.length === 0, errors };
  }

  function restoreBackup(data) {
    const validation = validateBackup(data);
    if (!validation.ok) return { ok: false, errors: validation.errors };
    return {
      ok: true,
      state: {
        mode: data.mode,
        queue: sanitizeQueue(data.queue),
        lessons: sanitizeLessons(data.lessons)
      }
    };
  }

  function downloadBackup(state, options = {}) {
    const backup = createBackup({ ...state, ...options });
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = backup.createdAt.replace(/[:.]/g, '-');
    anchor.href = url;
    anchor.download = `jarvis-continuity-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return backup;
  }

  window.JarvisContinuity = { createBackup, validateBackup, restoreBackup, downloadBackup };
})();
