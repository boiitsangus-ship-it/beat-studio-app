# Release checklist

- [ ] Full runtime source and tests published from a verified local build.
- [ ] Atomic queue, lease fencing, bounded retries, and idempotency tests pass.
- [ ] Worker authentication, scoped capabilities, and Jarvis-only mission decisions are enforced at the service boundary.
- [ ] LulBro provenance and evidence verification are tested.
- [ ] Encrypted backup is restored and integrity-checked.
- [ ] Existing StuBox routes and source are preserved.
- [ ] Authorized private host and cost limits are verified.
- [ ] Production health and authenticated end-to-end workflow pass.

Do not mark a release gate complete based solely on a design document or simulated output. External video playback and ad-free status require actual verification; unknown provider results must not be treated as success.
