const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const contract = require(path.join(root, 'runtime-contract.js'));

// Provide the minimal browser global expected by continuity-state.js.
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

test('capability contract excludes consequential authority', () => {
  for (const cap of contract.ALLOWED_CAPABILITIES) {
    assert(!/(money|credential|secret|device\.control|contract\.sign|identity)/i.test(cap));
  }
});

test('continuity state round-trips safe mobile state', () => {
  const backup = continuity.createBackup({
    mode: 'chat',
    queue: [{ module: 'jarvis', label: 'mobile compatibility test', time: Date.now(), mode: 'chat' }],
    lessons: ['verified compatibility lesson']
  });
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

test('LilyASI shell embeds the actual Jarvis mobile runtime', () => {
  const html = fs.readFileSync(path.join(root, 'lily-mobile-shell.html'), 'utf8');
  assert(/<iframe[^>]+src="jarvis-mobile\.html"/i.test(html));
  assert(html.includes('runtime-contract.js'));
  assert(html.includes('continuity-state.js'));
});

test('Jarvis mobile runtime exists and remains mobile configured', () => {
  const html = fs.readFileSync(path.join(root, 'jarvis-mobile.html'), 'utf8');
  assert(/name="viewport"/i.test(html));
  assert(/Jarvis 7/i.test(html));
  assert(/serviceWorker\.register/i.test(html));
});

if (!process.exitCode) console.log('COMPATIBILITY_OK');
