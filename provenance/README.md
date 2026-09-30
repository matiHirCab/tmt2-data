# Provenance

Ownership: source manifests, hashes, permissions, source references, release/build information, and conflict/coverage metadata.

Provenance records should make every imported or derived fact traceable to an approved source and dataset version.

Stage 1 source of truth: [SOURCES.md](SOURCES.md) and [sources.json](sources.json),
linked from the sole implementation backlog [TMT-01](../docs/ROADMAP.md).
Patch inspection: [PATCH_INSPECTION.md](PATCH_INSPECTION.md). Unknown hashes stay
null; uploaded-file hashes and third-party reference metadata remain distinct.
Receiving a BPS does not supply a ROM mechanics oracle.
