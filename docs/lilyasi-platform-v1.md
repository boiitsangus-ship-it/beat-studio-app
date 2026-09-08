# LilyASI Platform — v1

Status: architecture and migration plan, not a deployed autonomous runtime.

## Identity
LilyASI is the main public AI platform and the owner's personal AI identity. StuBox remains the music studio. Angws is a legacy working name. Jarvis is the higher orchestration realm, not a child agent. LilyASI is the personal/development identity. LulBro researches and learns, ASTRA executes approved operations, and Fable explores creative and alternate reasoning approaches.

## Shared lineage
The family shares a versioned mission, approved memories, task history, capability registry, and verified lessons. Each worker has its own identity and least-privilege permissions. A new worker inherits approved state through a versioned snapshot, not unrestricted access to every secret. Jarvis can operate without the Lily development worker being active.

## Continuity
The target runtime uses a durable job queue, checkpoint store, worker leases, retry limits, idempotency keys, encrypted backups, and authenticated recovery nodes. Workers may stop and resume; no model is assumed to think continuously. Phone clients provide a mobile control surface and authorized device capabilities. Private compute may run longer jobs. Offline changes must reconcile safely when connectivity returns.

## Learning and promotion
Observe → Model → Simulate → Debug → Verify → Improve → Repeat → Solve. LulBro records source provenance, hypotheses, test results, uncertainty, and reusable lessons. Candidate improvements run in a sandbox against a baseline. Security checks and regression tests precede promotion; failed changes are rolled back. No automatic self-modification of the production core without the configured approval policy.

## Product boundaries
StuBox owns music production: player, tracks, FX, mastering, and export. LilyASI owns personal AI, Work, World, Research, and the shared runtime. The World Layer uses public or authorized data and permission-based sensors. Scientific simulations are hypotheses until validated by measurements. Physical control requires supported hardware, explicit authorization, and safety limits.

## Privacy and deployment
The existing repository must not be assumed private. Policy flags do not enforce network access. Keep secrets, private memory, and model weights out of public source. Verify repository visibility, deployment authentication, private-network rules, and backups before claiming a private runtime. Use authenticated recovery rather than a hidden backdoor.

## Implementation order
1. Inventory existing repository, routes, and deployments; preserve StuBox functionality.
2. Introduce separate internal identifiers for LilyASI platform, personal identity, Jarvis realm, and workers.
3. Build durable state and job queue with restart/recovery tests.
4. Add worker registry, capability-scoped permissions, and audit log.
5. Connect LulBro provenance and verified-learning storage.
6. Add sandbox evaluation, promotion gates, and rollback.
7. Connect mobile adapters and private host; test offline reconciliation.
8. Migrate public branding without breaking legacy routes or stored data.
9. Validate security, accessibility, performance, and end-to-end workflows before public release.

## Current evidence
The repository contains a browser-based Beat Studio and a LulBro source policy. The source policy defines allowed data classes and the learning loop. These files do not establish a running background learner, native phone bridge, or deployed persistent orchestration service. Those capabilities require implementation and verification.
