# Architecture

```text
                        tmt2-data
                            │
                 canonical shared facts
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
pokemon-showdown-tmt2       pokemon-showdown-client-tmt2
        server                        client
```

`tmt2-data` is an independent repository. It supplies canonical shared facts to the server and client forks through deterministic target generation; neither fork owns it.

## Server owns

- Battle mechanics, legality, damage, STAB, and effectiveness
- Move behavior and ability/item behavior
- Mega mechanics and format rules
- Battle protocol production

## Client owns

- Teambuilder and search/filtering
- Custom type display and triple-type rendering
- Tooltips, sprites, and assets
- Format-selection UX and protocol rendering

## `tmt2-data` owns

- Stable IDs, canonical names, and aliases
- Types and type-chart facts
- Species/forms data and learnsets
- Move metadata
- Ability/item identities and metadata
- Source references
- Compatibility and dataset metadata
- Deterministic target generation

Changes to shared facts start in `tmt2-data`. Simulator behavior changes start in the server fork. UI behavior changes start in the client fork.

Executable battle callbacks are handwritten in the server fork and are never inferred or generated from descriptive data.
