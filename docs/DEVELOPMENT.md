# Development

## Sibling workspace

The expected local layout is:

```text
tmt2-showdown-workspace/
├── pokemon-showdown/
├── pokemon-showdown-client/
└── tmt2-data/
```

Directory names may differ locally, but all three repositories remain siblings. Work in `tmt2-data` must not create nested repositories inside either Showdown fork.

Future generators should accept server and client target paths through configuration or CLI arguments rather than permanently hardcoding local absolute paths. A future invocation may conceptually use values such as:

```text
TMT2_SERVER_DIR=../pokemon-showdown
TMT2_CLIENT_DIR=../pokemon-showdown-client
```

These environment variables are examples only and are not implemented by this scaffold.

## Package manager

This repository uses npm, matching the lockfile convention found in both sibling Showdown repositories. Install dependencies with `npm install` and run the currently available validation with `npm run typecheck`.

## Release compatibility

A future release will pin together:

- Server upstream and commit
- Client upstream and commit
- `tmt2-data` commit
- Dataset version and hash
- Protocol compatibility version

This scaffold does not define a release format or dataset version yet.
