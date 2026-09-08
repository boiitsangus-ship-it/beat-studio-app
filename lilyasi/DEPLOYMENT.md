# LilyASI deployment

The runtime is a local-first development service. The source repository does not contain a verified production host or its credentials. Do not expose the local API to the public internet or claim that a persistent worker is running merely because code has been committed.

## Release order
1. Preserve the current commit as a source snapshot and export any real state through the SQLite backup API before migration.
2. Run the test suite, restart/recovery checks, and an encrypted backup restore in a separate directory.
3. Configure an owner token privately, use loopback binding, and put any remote access behind an authenticated private-network proxy.
4. Start with deterministic mock workers; configure an explicitly selected local model only after its runtime and license are verified.
5. Keep external tool adapters disabled until authorization, idempotency, cost limits, and reconciliation are implemented.
6. Validate health, authentication, worker scope, resource limits, and an end-to-end workflow before production promotion.
7. Keep StuBox and legacy routes unchanged until a tested mobile migration is ready.

No paid hosting or GPU resources are required for the mock tests. A real model may require device resources, electricity, or service charges. Power availability and open data never grant additional permissions. A background service can run only while its authorized host remains available.
