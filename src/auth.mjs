import crypto from 'node:crypto';
import { CONFIG } from './storage.mjs';

export const LILY_ADMIN_CAPABILITIES = Object.freeze([
  'task.create','task.execute.approved','task.pause','task.cancel',
  'workflow.create','workflow.edit','workflow.run',
  'agent.spawn','agent.stop','agent.inspect',
  'model.route','model.health','model.switch',
  'code.read','code.write','code.test','code.commit.branch',
  'repo.inspect','continuity.export','continuity.import.review',
  'backup.create','backup.restore.review','plugin.inspect','plugin.enable.approved',
  'mobile.session','device.read.authorized','system.health','audit.read'
]);

export const CONFIRMATION_REQUIRED = Object.freeze([
  'production.deploy','production.delete','repo.force','credential.change','auth.change',
  'security.policy.change','backup.delete','money.transfer','purchase.execute','contract.sign',
  'message.external.send','social.publish','device.physical.control'
]);

const adminMessage = ({ ownerId, nonce, createdAt }) => Buffer.from(`LILY_ADMIN_V1\n${ownerId}\n${nonce}\n${createdAt}`, 'utf8');
const actionMessage = ({ ownerId, sessionId, action, taskId, nonce, createdAt }) => Buffer.from(`LILY_ACTION_V1\n${ownerId}\n${sessionId}\n${action}\n${taskId}\n${nonce}\n${createdAt}`, 'utf8');

export async function verifyEd25519({ ownerId, nonce, createdAt, signedChallenge, publicKeyPem }) {
  if (!ownerId || !nonce || !Number.isFinite(createdAt) || !signedChallenge || !publicKeyPem) return false;
  try {
    const pub = crypto.createPublicKey(publicKeyPem);
    if (pub.asymmetricKeyType !== 'ed25519') return false;
    const sig = Buffer.from(signedChallenge, 'base64');
    return sig.length === 64 && crypto.verify(null, adminMessage({ ownerId, nonce, createdAt }), pub, sig);
  } catch { return false; }
}

export function signEd25519({ ownerId, nonce, createdAt, privateKeyPem }) {
  const priv = crypto.createPrivateKey(privateKeyPem);
  if (priv.asymmetricKeyType !== 'ed25519') throw new Error('ED25519_KEY_REQUIRED');
  return crypto.sign(null, adminMessage({ ownerId, nonce, createdAt }), priv).toString('base64');
}

export function signActionConfirmation({ ownerId, sessionId, action, taskId, nonce, createdAt, privateKeyPem }) {
  const priv = crypto.createPrivateKey(privateKeyPem);
  if (priv.asymmetricKeyType !== 'ed25519') throw new Error('ED25519_KEY_REQUIRED');
  return crypto.sign(null, actionMessage({ ownerId, sessionId, action, taskId, nonce, createdAt }), priv).toString('base64');
}

export async function createAdminChallenge(store, ownerId) {
  if (!ownerId || typeof ownerId !== 'string' || ownerId.length < 8) throw new Error('OWNER_ID_REQUIRED');
  return store.create(ownerId);
}

export async function issueAdminSession({ store, challenge, signedChallenge, authenticatedUser, verifiedDevice, verifyFn = verifyEd25519, audit }) {
  if (!store) throw new Error('SESSION_STORE_REQUIRED');
  if (!authenticatedUser?.id) throw new Error('AUTH_REQUIRED');
  if (!challenge?.nonce) throw new Error('CHALLENGE_REQUIRED');
  if (!verifiedDevice?.id || !verifiedDevice?.publicKeyPem) throw new Error('VERIFIED_DEVICE_REQUIRED');
  const stored = await store.consume(challenge.nonce);
  if (!stored) throw new Error('CHALLENGE_UNKNOWN_OR_EXPIRED');
  if (Date.now() > stored.expiresAt) throw new Error('CHALLENGE_EXPIRED');
  if (stored.ownerId !== authenticatedUser.id) { await store.recordFailure?.(stored.ownerId); throw new Error('OWNER_REQUIRED'); }
  if (challenge.ownerId && challenge.ownerId !== stored.ownerId) throw new Error('CHALLENGE_TAMPERED');
  if (challenge.createdAt && challenge.createdAt !== stored.createdAt) throw new Error('CHALLENGE_TAMPERED');
  const valid = await verifyFn({ ownerId: stored.ownerId, nonce: stored.nonce, createdAt: stored.createdAt, signedChallenge, publicKeyPem: verifiedDevice.publicKeyPem });
  if (!valid) { await store.recordFailure?.(stored.ownerId); throw new Error('SIGNATURE_INVALID'); }
  const now = Date.now();
  const session = Object.freeze({ id: crypto.randomUUID(), subject: authenticatedUser.id, role: 'LILY_OWNER_ADMIN', capabilities: [...LILY_ADMIN_CAPABILITIES], issuedAt: now, expiresAt: now + CONFIG.ADMIN_SESSION_TTL_MS, deviceId: verifiedDevice.id });
  await store.trackSession(session.subject, session.id, session.expiresAt);
  if (typeof audit === 'function') {
    const requestId = crypto.randomUUID();
    await audit({ event: 'OWNER_ADMIN_SESSION_ISSUED', sessionId: session.id, subject: session.subject, deviceId: session.deviceId, issuedAt: session.issuedAt, expiresAt: session.expiresAt, requestId });
  }
  return session;
}

export async function authorizeSession(store, session, capability) {
  if (!store) throw new Error('SESSION_STORE_REQUIRED');
  if (!session) throw new Error('ADMIN_SESSION_REQUIRED');
  if (session.role !== 'LILY_OWNER_ADMIN' && !session.delegated) throw new Error('INVALID_SESSION_ROLE');
  if (Date.now() >= session.expiresAt) throw new Error('ADMIN_SESSION_EXPIRED');
  if (!session.capabilities?.includes(capability)) throw new Error(`CAPABILITY_DENIED:${capability}`);
  if (!await store.isSessionActive(session.subject, session.id)) throw new Error('ADMIN_SESSION_REVOKED');
  return true;
}

export async function revokeAdminSession(store, session) {
  if (!session?.subject || !session?.id) return false;
  return store.revokeSession(session.subject, session.id);
}

export async function delegateCapabilities(store, parentSession, requested, ttlMs = 5 * 60_000) {
  await authorizeSession(store, parentSession, parentSession.capabilities?.[0] || 'system.health');
  const granted = (Array.isArray(requested) ? requested : []).filter(c => parentSession.capabilities.includes(c));
  const now = Date.now();
  const child = Object.freeze({ id: crypto.randomUUID(), parentSessionId: parentSession.id, subject: parentSession.subject, delegated: true, capabilities: granted, issuedAt: now, expiresAt: Math.min(parentSession.expiresAt, now + Math.max(1, ttlMs)), deviceId: parentSession.deviceId });
  await store.trackSession(child.subject, child.id, child.expiresAt);
  return child;
}

export async function createHighImpactConfirmation(store, session, action, taskId) {
  if (!CONFIRMATION_REQUIRED.includes(action)) throw new Error('ACTION_NOT_HIGH_IMPACT');
  await authorizeSession(store, session, session.capabilities?.[0] || 'system.health');
  return store.createActionConfirmation({ ownerId: session.subject, sessionId: session.id, action, taskId });
}

export async function verifyHighImpactConfirmation({ store, session, action, taskId, confirmation, publicKeyPem }) {
  if (!confirmation?.id || !confirmation?.signature) throw new Error(`EXPLICIT_CONFIRMATION_REQUIRED:${action}`);
  const stored = await store.consumeActionConfirmation(confirmation.id);
  if (!stored) throw new Error('CONFIRMATION_UNKNOWN_OR_EXPIRED');
  if (Date.now() > stored.expiresAt) throw new Error('CONFIRMATION_EXPIRED');
  if (stored.ownerId !== session.subject || stored.sessionId !== session.id || stored.action !== action || stored.taskId !== taskId) throw new Error('CONFIRMATION_SCOPE_MISMATCH');
  try {
    const pub = crypto.createPublicKey(publicKeyPem);
    const sig = Buffer.from(confirmation.signature, 'base64');
    if (pub.asymmetricKeyType !== 'ed25519' || sig.length !== 64 || !crypto.verify(null, actionMessage(stored), pub, sig)) throw new Error('CONFIRMATION_SIGNATURE_INVALID');
  } catch (e) {
    if (e.message === 'CONFIRMATION_SIGNATURE_INVALID') throw e;
    throw new Error('CONFIRMATION_SIGNATURE_INVALID');
  }
  return true;
}

export class ToolRouter {
  constructor({ store, audit }) {
    if (!store) throw new Error('SESSION_STORE_REQUIRED');
    this.store = store;
    this.tools = new Map();
    this.calls = new Map();
    this.audit = typeof audit === 'function' ? audit : async () => {};
  }

  _checkRateLimit(subject) {
    const now = Date.now();
    const list = (this.calls.get(subject) || []).filter(t => t > now - 60_000);
    if (list.length >= CONFIG.MAX_TOOL_CALLS_PER_MIN) throw new Error('RATE_LIMITED:TOOL_CALLS');
    list.push(now); this.calls.set(subject, list);
  }

  register({ name, capability, handler, highImpactAction = null }) {
    if (!name || !capability || typeof handler !== 'function') throw new Error('INVALID_TOOL_REGISTRATION');
    this.tools.set(name, { capability, handler, highImpactAction });
  }

  async execute({ tool, args = {}, session, taskId = crypto.randomUUID(), confirmation = null, devicePublicKeyPem = null }) {
    const entry = this.tools.get(tool);
    if (!entry) throw new Error(`UNKNOWN_TOOL:${tool}`);
    await authorizeSession(this.store, session, entry.capability);
    this._checkRateLimit(session.subject);
    if (entry.highImpactAction && CONFIRMATION_REQUIRED.includes(entry.highImpactAction)) await verifyHighImpactConfirmation({ store: this.store, session, action: entry.highImpactAction, taskId, confirmation, publicKeyPem: devicePublicKeyPem });
    const auditId = crypto.randomUUID();
    await this.audit({ auditId, taskId, event: 'TOOL_EXECUTION_STARTED', tool, subject: session.subject, timestamp: Date.now(), requestId: auditId });
    try {
      const result = await entry.handler(args);
      await this.audit({ auditId, taskId, event: 'TOOL_EXECUTION_SUCCESS', tool, subject: session.subject, timestamp: Date.now(), requestId: auditId });
      return { ok: true, auditId, requestId: auditId, result };
    } catch (e) {
      await this.audit({ auditId, taskId, event: 'TOOL_EXECUTION_FAILED', tool, subject: session.subject, error: e?.message || 'UNKNOWN_ERROR', timestamp: Date.now(), requestId: auditId });
      throw e;
    }
  }
}
