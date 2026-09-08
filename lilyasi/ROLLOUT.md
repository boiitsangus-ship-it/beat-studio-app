# LilyASI rollout

Status: development branch, not production deployed.

Jarvis is the only mission orchestrator. Lily, LulBro, ASTRA, and Fable return scoped results and proposals. The owner remains the final authority for high-impact actions. Preserve existing StuBox routes and data during migration.

## Release gates
1. Snapshot and verify the existing source before changes.
2. Replace the queue prototype with a transactional implementation, lease ownership/fencing, idempotency, bounded retries, and durable checkpoints.
3. Validate worker messages against the versioned realm contract; only Jarvis may commit mission decisions.
4. Add provenance, sandbox evaluation, and explicit promotion/rollback controls.
5. Run restart, stale-worker, duplicate-job, approval-denial, recovery, and backup-restore tests.
6. Create an encrypted backup of actual persistent state and test a restore before migration.
7. Deploy to an authorized host only after credentials, network exposure, cost, and rollback are verified. No paid resources are provisioned by default.
8. Verify health and a real end-to-end workflow before calling the service live.

A source-code commit is not a database backup, and a passing local test is not a production deployment. No model session is assumed to run continuously. Background execution requires a real running service or scheduled task. Public repositories must never contain secrets, private memory, or unconsented personal data.

## Current blocker
The private LilyASI host and its credentials have not been verified. Do not claim the runtime is online, private, or autonomously working until deployment and health checks establish those facts.
