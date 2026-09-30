# Normalized data

`seed.json` is a deterministic **incomplete production candidate**. Six creator
type rows are null; validation fails. Derive it from `overrides/seed-selection.json`,
`provenance/seed-types.json`, source registration and the pinned compiled server
with `npm run seed:prepare -- --output NEW.json`; review before replacement.
`tests/fixtures/seed.json` is separate synthetic test data, never production.
