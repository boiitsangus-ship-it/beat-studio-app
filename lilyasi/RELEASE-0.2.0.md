# LilyASI Runtime 0.2.0 — development candidate

The local development candidate implements a transactional SQLite queue, worker-scoped capabilities, versioned missions, lease fencing, idempotency, checkpoints, evidence provenance, audit hash chaining, explicit approvals, a deterministic four-stage video workflow, an optional loopback-only Ollama text adapter, and an encrypted SQLite backup/restore utility.

Local verification: 15 tests passed. The deterministic video workflow completed four stages and held delivery because no real media render or ad-free playback was verified. A synthetic database was encrypted and restored successfully, including audit integrity checks. These results establish local behavior only.

The existing public repository and StuBox UI are preserved. No real private user database was accessible for backup or migration, and no production host, model service, or persistent worker deployment has been verified. The full tested source release must be published and reviewed before promoting this branch to production. Do not mark release checks complete or advertise an always-on agent based on this document.

Next gates: publish the tested source, review the legacy schema migration against a real backup, verify an authorized zero-cost host and secrets, run the same tests on that host, enable explicitly scoped worker adapters, perform an authenticated end-to-end check, and promote only after rollback is ready.
