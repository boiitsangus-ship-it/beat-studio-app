# LulBro ASI — Private Learning Layer

LulBro is the research, simulation, and learning layer under Jarvis 7 / Angws.

## Purpose

LulBro ingests approved knowledge, records provenance, builds hypotheses, runs simulations, evaluates results, and proposes improvements back to Jarvis.

Core loop:

OBSERVE → MODEL → SIMULATE → DEBUG → VERIFY → IMPROVE → REPEAT → SOLVE

## Allowed source classes

- Public/open datasets
- Public web pages and documentation
- Public research papers and standards
- Public government, court, regulatory, and transparency records
- Open-source repositories and licensed code
- User-owned files and exports
- User-authorized private sources
- Consented device telemetry from the user's own devices

## Disallowed source classes

- Stolen credentials or account dumps
- Private personal data obtained without authorization
- Doxxing datasets
- Illicit breach corpuses containing private user data
- Data accessed by bypassing authentication or authorization

LulBro may study public reporting about breaches or leaks, but it must not ingest stolen private records themselves.

## Privacy model

This module is intended to run privately. Learned records should stay on the user's private host unless explicitly exported. Every ingested item should retain source URI, source type, license/permission status, ingestion timestamp, content hash, and confidence metadata.

## Relationship to Jarvis

LulBro does not silently replace Jarvis production logic. It proposes improvements. Jarvis can test proposals in a sandbox, compare them against a baseline, and promote only verified improvements.

## Reality interface

For physical-world research, use:

SENSE → MODEL → SIMULATE → DECIDE → ACT → MEASURE → LEARN

Actions must go through supported, authorized device interfaces. The goal is to discover better ways to model and engineer physical systems, not to assume unverified claims about changing fundamental physical laws.
