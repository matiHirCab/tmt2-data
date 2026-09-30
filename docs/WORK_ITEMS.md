# Scoped work items

- **COORD-1 — Implemented:** portable sibling workspace commands, strict config,
  local process supervision and source compatibility snapshots. Acceptance:
  deterministic snapshots; drift/config/port/spawn failures produce nonzero exits;
  signals and service failures stop descendants; existing builds/tests run without
  upstream data pulls. See DEVELOPMENT.md and tests/workspace.test.mjs.
- **INTEGRATION-1 — Proposed, not implemented:** separately reviewed experimental
  mod and hidden format registration with an explicit base generation; server
  format/Dex and battle-construction smoke tests; client `Dex.forFormat()` mapping,
  mod tables/search/teambuilder routing and protocol smoke test. Do not advertise
  this inherited-data skeleton as TMT2 gameplay. Confirm the base generation first.
- **DATA-1 — Pending sources:** obtain authorized data/provenance, define schema,
  validate a labeled real fixture and production completeness, then generate
  deterministic server/client facts using pinned local inputs. Replace upstream
  index pulls only after mod-aware data selection is designed and tested.
- **MECHANICS-1 — Pending verified semantics:** resolve permanent/repeated typing,
  no EVs, passives and remaining ROM semantics; implement callbacks manually with
  simulator tests. Preserve existing species type arrays and core damage engine;
  do not repurpose temporary `addedType`.
