# tmt2-data

Canonical shared-data and generation layer for the Pokémon Too Many Types 2 (TMT2) Pokémon Showdown project.

## Implementation plan

[**Canonical roadmap: four stages / twelve tickets**](docs/ROADMAP.md) is the only
active implementation backlog. Read it for prerequisites, status and evidence.
[Source register](provenance/SOURCES.md) and [CI instructions](docs/CI.md) support
stage 1. Older task proposals are superseded; architecture and engineering policies
remain valid. A bounded adaptation dataset and hidden integration are implemented; full-catalog data and battle fidelity remain pending.

## Related repositories

- [Pokémon Showdown server fork](https://github.com/matiHirCab/Pokemon-Too-Many-Types-2)
- [Pokémon Showdown client fork](https://github.com/matiHirCab/Pokemon-Too-Many-Types-2-client)

This repository is independent of both forks. It owns shared facts and the tooling that transforms approved bounded TMT2 sources into deterministic server/client artifacts.

## Responsibility

```text
approved TMT2 sources
        ↓
     import
        ↓
    normalize
        ↓
     validate
        ↓
 deterministic generation
      ↙        ↘
   server     client
```

The server determines battle truth and legality. The client determines how that data is discovered, edited, displayed, and interacted with. `tmt2-data` provides canonical shared facts to both.

## Generated and handwritten code

The bounded generator produces a shared species/type/learnset/dependency catalog and compatibility metadata. The pinned local client pipeline also produces search and teambuilder tables.

It must never generate executable battle callbacks from descriptive prose. Battle callbacks and simulator mechanics remain handwritten in the server fork.

## Current status

This repository contains the project/data-pipeline foundation and workspace coordination tooling. The bounded TMT-04 schema, validator and pinned inherited dependencies are implemented.
`normalized/seed.json` is a validated bounded adaptation seed: nine base species plus Mega Pidgeot (ten species/forms), fifteen moves and
three fixed premade teams. Creator type/chart evidence and explicitly inherited
pinned Gen9 dependencies are classified separately in provenance. TMT-05 registers its hidden `gen9tmt2seed` mod/format and routes the client Dex, search and battle/replay parsing to the same catalog. TMT-06 enforces the bounded premades and TMT-08 tests the selected mega under the approved adaptation. This is not full-catalog validation or exact ROM fidelity.
Separate test fixtures are not production TMT2 data.

No license has been selected. Licensing and data redistribution remain an explicit project decision.

## Workspace coordination

Run `npm run workspace:doctor`, `npm run workspace:build`,
`npm run workspace:test`, or `npm run workspace:dev` from this repository.
See [reproducible setup, configuration, snapshots and limitations](docs/DEVELOPMENT.md).
For the TMT-07 draft branches, follow the
[Windows/WSL native-client preview](docs/DEVELOPMENT.md#windowswsl-local-preview-from-the-draft-branches).
Run `npm run integration:generate`, `integration:check`, `integration:assets` and
`integration:test` for the shared catalog and pinned local assets. Full TMT2 data and exact ROM fidelity remain outside this bounded adaptation.

Approved TMT-02 adaptation, TMT-04 contract and optional fidelity protocols: [docs/RULES_REFERENCE.md](docs/RULES_REFERENCE.md).

## Local sprite downloads

`npm run sprites:download` downloads the six seed species' official front/back
GIFs into a new ignored `.local/sprites/download-*/` folder. Use
`npm run sprites:download -- --with-ui` to include the four fixed TMT07 UI PNGs
(Rosa/Lyra trainers and Pokemon/Pokeball icon sheets) in the same validated ZIP.
Use
`npm run sprites:download -- --pokemon rattata,pidgeot-mega` or `--file ids.txt`
for exact sprite filename IDs, retaining form hyphens. Originals, source URLs,
SHA-256 hashes and failures are recorded; ZIP is created only on full success.
See [Windows commands, limits and provenance](docs/DEVELOPMENT.md#official-sprite-downloader).
This is local evaluation tooling, not permission to redistribute artwork or
proof that the native client's visual integration is complete.
