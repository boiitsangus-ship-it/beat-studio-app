# LilyASI Runtime

A local-first development runtime for the Jarvis realm. Jarvis is the only canonical mission writer. Lily, LulBro, ASTRA, and Fable are scoped workers that return evidence, proposals, and results. The owner controls high-impact approvals.

This package is under development. It does not establish ASI, independent consciousness, a deployed background service, or native phone control. The existing StuBox interface remains separate and unchanged.

The runtime uses SQLite for durable jobs and versioned state. Worker leases, idempotency keys, an audit chain, evidence provenance, and explicit verification are release requirements. External actions must be implemented through approved adapters, and unknown results must not be blindly retried. No network-exposed service or paid compute is enabled by default.

See ROLLOUT.md for the release gates and the root platform documentation for the shared family contract.
