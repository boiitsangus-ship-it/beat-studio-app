const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const contract = require(path.join(root, 'runtime-contract.js'));
const muse = require(path.join(root, 'meta-muse-provider.js'));

global.window = {};
require(path.join(root, 'continuity-state.js'));
const continuity = global.window.JarvisContinuity;

function test(name, fn) {
  try { fn(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
}

test('contract v1 identifies LilyASI to Jarvis mobile', () => {
  const hello = contract.makeHello();
  assert.equal(hello.source, 'lilyasi');
  assert.equal(hello.target, 'jarvis7-mobile');
  assert.equal(hello.contractVersion, 1);
});

test('Muse Glimmer 30B is the hardwired LilyASI agent', () => {
  assert.equal(muse.MODEL_ID, 'meta-models/Muse-Glimmer-30B');
  assert.equal(contract.DEFAULT_AGENT.model, muse.MODEL_ID);
  assert.equal(contract.DEFAULT_AGENT.provider, 'meta');
  assert.equal(contract.DEFAULT_AGENT.endpoint, 'http://127.0.0.1:8000/v1/chat/completions');
});

test('browser provider requires exact model identity', () => {
  const source = fs.readFileSync(path.join(root, 'meta-muse-provider.js'), 'utf8');
  assert(source.includes('models.includes(MODEL_ID)'));
  assert(!source.includes('models.includes(MODEL_ID) || models.length > 0'));
  assert(source.includes('normalizeMaxTokens'));
});

test('local agent capability is exposed without consequential authority', () => {
  assert(contract.ALLOWED_CAPABILITIES.includes('agent.infer.local'));
  assert(contract.ALLOWED_CAPABILITIES.includes('agent.code.assist'));
  assert(contract.ALLOWED_CAPABILITIES.includes('agent.vision.local'));
  for (const cap of contract.ALLOWED_CAPABILITIES) assert(!/(money|credential|secret|device\.control|contract\.sign|identity)/i.test(cap));
});

test('continuity state round-trips safe mobile state', () => {
  const backup = continuity.createBackup({ mode: 'chat', queue: [{ module: 'jarvis', label: 'mobile compatibility test', time: Date.now(), mode: 'chat' }], lessons: ['verified compatibility lesson'] });
  assert.equal(continuity.validateBackup(backup).ok, true);
  const restored = continuity.restoreBackup(backup);
  assert.equal(restored.ok, true);
  assert.equal(restored.state.queue.length, 1);
});

test('continuity rejects unwanted fields', () => {
  const backup = continuity.createBackup();
  backup.hiddenToken = 'not allowed';
  assert.equal(continuity.validateBackup(backup).ok, false);
});

test('continuity filters secret-like text on export', () => {
  const backup = continuity.createBackup({ lessons: ['api_key=should-never-export', 'safe lesson'] });
  assert.deepEqual(backup.lessons, ['safe lesson']);
});

test('LilyASI shell embeds Jarvis and loads the hardwired Meta provider', () => {
  const html = fs.readFileSync(path.join(root, 'lily-mobile-shell.html'), 'utf8');
  assert(/<iframe[^>]+src="jarvis-mobile\.html"/i.test(html));
  assert(html.includes('runtime-contract.js'));
  assert(html.includes('continuity-state.js'));
  assert(html.includes('meta-muse-provider.js'));
  assert(html.includes('Meta Muse Glimmer 30B'));
});

test('LilyASI shell avoids unsafe dynamic innerHTML and undefined check state', () => {
  const html = fs.readFileSync(path.join(root, 'lily-mobile-shell.html'), 'utf8');
  assert(!/checksEl\.innerHTML\s*=/.test(html));
  assert(!/state\.contract=state\.continuity=state\.privacy=undefined/.test(html));
  assert(html.includes('textContent'));
  assert(html.includes('replaceChildren'));
});

test('Jarvis mobile runtime exists and remains mobile configured', () => {
  const html = fs.readFileSync(path.join(root, 'jarvis-mobile.html'), 'utf8');
  assert(/name="viewport"/i.test(html));
  assert(/Jarvis 7/i.test(html));
  assert(/serviceWorker\.register/i.test(html));
});

if (!process.exitCode) console.log('COMPATIBILITY_OK');
