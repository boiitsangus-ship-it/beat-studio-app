# Jarvis 7 + LulBro ASI Mobile Architecture

## Goal
Build a phone-first orchestration layer that can run across iPhone, Android, tablets, browsers, and future supported mobile devices without depending on one vendor. Jarvis 7 is the operator. ASTRA 6, Fable 5, and LulBro ASI are specialist layers beneath it.

## Core improvement loop
Observe -> Model -> Simulate -> Debug -> Verify -> Improve -> Repeat -> Solve

The loop is for background optimization and task completion. It is not unrestricted self-modification. Production changes must pass sandbox, regression, security, and performance checks before promotion.

## Portable mobile runtime
Use a capability-broker architecture instead of hard-coding one OS:

PHONE / TABLET
  -> Capability Detector
  -> Permission Broker
  -> Local Model Adapter
  -> Tool Adapter
  -> Jarvis 7 Router
  -> ASTRA / Fable / LulBro
  -> Verifier
  -> Action Log

### Apple pathway
- App Intents for app actions and system integration.
- Foundation Models / compatible on-device model sessions for local intelligence where supported.
- Vision and approved sensor/file APIs for perception.
- Core AI / custom on-device models when available.

### Android pathway
- AppFunctions for agent-accessible app capabilities.
- AICore / Gemini Nano / Gemma-compatible local model pathways where supported.
- ML Kit and platform sensor/media/file APIs.
- UI automation only as an explicit fallback on supported devices and within user authorization.

### Web / fallback pathway
- Installable PWA shell.
- Service worker + offline cache.
- W3C sensor APIs where browser support and permission allow.
- Share Target / File System / media capture APIs where available.
- No assumption that Web Bluetooth, WebUSB, camera, microphone, location, or background execution exists on every platform.

## Public knowledge and data policy
LulBro may learn from:
- Public mobile hardware specifications and compatibility matrices.
- Open source device code, SDK examples, standards, public benchmarks, and public research datasets.
- Publicly licensed environmental, mapping, weather, physics, biological, and sensor datasets.
- Synthetic data and simulations.
- User-owned or explicitly consented telemetry.

LulBro must not silently collect private phone data, credentials, messages, photos, precise location histories, biometric data, contacts, or other personal data from unrelated people.

Every dataset should carry provenance: source, license, date, device/platform scope, quality notes, and allowed uses.

## Cross-device capability model
Each device registers a capability profile rather than a brand-specific identity. Example fields:
- platform / OS version
- CPU / GPU / NPU class
- RAM budget
- battery / thermal state class
- network state
- camera / mic / motion / location availability
- Bluetooth / local network / USB accessory support
- local-model backends available
- background execution limits
- privacy / permission state

Jarvis routes tasks by capability, privacy, battery, latency, and cost.

## Nature / physical-world research layer
"Recode reality" is treated as a research metaphor for closing the loop between computation and the physical world:

SENSE -> MODEL -> SIMULATE -> DECIDE -> ACT -> MEASURE -> LEARN

Initial safe domains:
- environmental sensing
- energy optimization
- robotics simulation
- swarm / cellular automata
- biomimetic algorithms
- plant / ecosystem models
- smart-home actions through supported APIs

Physical actions remain bounded by authorization and safety. No direct mains-power manipulation, unsafe hardware driving, bypassing device protections, or uncontrolled biological experimentation.

## Jarvis 7 responsibility
Jarvis decides:
- which model or agent should handle the task
- what should stay on-device
- what can move to a private host
- whether a task requires a Human Gate
- whether an experimental LulBro proposal is safe enough to test
- whether verification passed before calling a task solved

## LulBro ASI responsibility
LulBro is the learning and research sibling:
- studies public standards and datasets
- creates hypotheses
- builds simulations
- compares strategies
- records failures and improvements
- proposes changes to Jarvis
- never silently promotes its own production changes

## Mobile deployment principle
The same Jarvis task schema should survive across devices. The phone is a surface, not the intelligence boundary. State synchronizes through an encrypted user-controlled store or private host when available, while a useful subset remains local and offline-capable.
