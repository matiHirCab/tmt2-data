# Provenance

Ownership: source manifests, hashes, permissions, source references, release/build information, and conflict/coverage metadata.

Provenance records should make every imported or derived fact traceable to an approved source and dataset version.

Stage 1 source of truth: [SOURCES.md](SOURCES.md) and [sources.json](sources.json),
linked from the sole implementation backlog [TMT-01](../docs/ROADMAP.md).
Unknown hashes stay null. Reference-patch metadata must never identify an unseen
user file. Receiving a BPS does not supply a ROM mechanics oracle.
