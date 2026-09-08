export const identities = Object.freeze({
  platform: 'lilyasi.platform',
  personal: 'lilyasi.personal',
  supervisor: 'jarvis.7',
  workers: Object.freeze({astra: 'astra.6', fable: 'fable.5', lulbro: 'lulbro.asi'})
});

export const workerRegistry = Object.freeze({
  'astra.6': Object.freeze({label: 'ASTRA 6', capabilities: ['task.plan', 'task.record']}),
  'fable.5': Object.freeze({label: 'Fable 5', capabilities: ['task.plan', 'creative.propose']}),
  'lulbro.asi': Object.freeze({label: 'LulBro ASI', capabilities: ['research.propose', 'simulation.record']})
});

export const restrictedActions = Object.freeze([
  'money.move', 'trade.place', 'credentials.use', 'identity.verify',
  'contract.accept', 'data.delete', 'device.control', 'production.promote'
]);
