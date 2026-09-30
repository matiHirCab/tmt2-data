# tmt2-data

Canonical shared-data and generation layer for the Pokémon Too Many Types 2 (TMT2) Pokémon Showdown project.

## Implementation plan

[**Canonical roadmap: four stages / twelve tickets**](docs/ROADMAP.md) is the only
active implementation backlog. Read it for prerequisites, status and evidence.
[Source register](provenance/SOURCES.md) and [CI instructions](docs/CI.md) support
stage 1. Older task proposals are superseded; architecture and engineering policies
remain valid. No production dataset or TMT2 mechanics are implemented yet.

## Related repositories

- [Pokémon Showdown server fork](https://github.com/matiHirCab/Pokemon-Too-Many-Types-2)
- [Pokémon Showdown client fork](https://github.com/matiHirCab/Pokemon-Too-Many-Types-2-client)

This repository is independent of both forks. It owns shared facts and the tooling that will eventually transform approved TMT2 sources into deterministic, target-specific artifacts.

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

This repository may eventually generate Pokedex/species data, the type chart, learnsets, move metadata, ability and item metadata, aliases, client search/index data, and version/compatibility metadata.

It must never generate executable battle callbacks from descriptive prose. Battle callbacks and simulator mechanics remain handwritten in the server fork.

## Current status

This repository contains the project/data-pipeline foundation and workspace coordination tooling. The bounded TMT-04 schema, validator and pinned inherited dependencies are implemented.
`normalized/seed.json` is a validated bounded adaptation seed: six species and
two premade teams, official ordered types and explicitly inherited pinned Gen9
dependencies. This is not full-catalog validation or a playable mod.
Separate test fixtures are not production TMT2 data.

No license has been selected. Licensing and data redistribution remain an explicit project decision.

## Workspace coordination

Run `npm run workspace:doctor`, `npm run workspace:build`,
`npm run workspace:test`, or `npm run workspace:dev` from this repository.
See [reproducible setup, configuration, snapshots and limitations](docs/DEVELOPMENT.md).
Coordination and a bounded adaptation seed are implemented; full TMT2 data and
game integration remain pending.

Approved TMT-02 adaptation, TMT-04 contract and optional fidelity protocols: [docs/RULES_REFERENCE.md](docs/RULES_REFERENCE.md).
