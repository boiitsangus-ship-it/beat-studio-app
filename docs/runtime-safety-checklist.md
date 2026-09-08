# Angws / Jarvis Runtime Safety Checklist

This repository is source code, not a private-state store. Keep user memory, credentials, device secrets, API keys, session tokens, private telemetry, and model-private state out of Git history.

## Before enabling continuity on a new host

- Verify the host is explicitly authorized by the owner.
- Start in restricted verification mode.
- Confirm the deployment bundle matches the expected release/commit.
- Restore only encrypted state from an approved backup location.
- Validate memory provenance before promotion into active memory.
- Confirm Human Gate / approval controls are active before external actions.
- Confirm network adapters expose only intended capabilities.
- Record the migration/restore event in an append-only audit log.

## Learning promotion rule

LulBro may ingest only approved sources and should write new observations into a quarantine/proposal layer first. A proposal becomes active memory or production logic only after provenance, confidence, safety impact, and owner policy checks pass.

## Public repository rule

Never commit:

- secrets or credentials
- private user memories
- private device telemetry
- authenticated API payloads
- account/session exports
- recovery material

Service workers and browser caches should cache only the static application shell. Authenticated/API responses must not be persisted by the public web app cache.

## Reversibility

Runtime changes should be introduced on a branch, tested in restricted mode, and promoted only after verification. Every migration or learning promotion should have a documented rollback path to the previous known-good snapshot.
