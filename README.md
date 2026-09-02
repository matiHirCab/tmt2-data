# tmt2-data

Canonical shared-data and generation layer for the Pokémon Too Many Types 2 (TMT2) Pokémon Showdown project.

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

This repository currently contains only the project and data-pipeline foundation. Authoritative TMT2 data has not yet been imported.

No license has been selected. Licensing and data redistribution remain an explicit project decision.
