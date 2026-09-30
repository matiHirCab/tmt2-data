# CI reproducible — TMT-03

Implementation scope/status belongs only to [ROADMAP.md](ROADMAP.md#tmt-03--ci-reproducible).
This document describes verification, not another backlog. CI needs no ROM/BPS.

## Pins and permissions

[ci/pins.json](../ci/pins.json) fixes Node 24.19.0, npm 11.9.0 and the two fork
commits previously compared against baseline. The data repository is the exact
GitHub event checkout (the PR merge candidate on pull_request, event commit on
push); the resulting manifest records all three actual HEADs. No self-referential
data-commit pin is hardcoded. Pin updates require reviewed evidence; commands
reject mismatched/dirty sibling sources instead of pulling or resetting them.

[ci.yml](../.github/workflows/ci.yml) uses Ubuntu 24.04, exact action commit SHAs
(reviewed v6 tags of actions/checkout and actions/setup-node), and `contents: read`
only. It has no custom secrets, write token, pull_request_target, environment,
deployment, PR creation or repository-permission mutation. Checkout credentials
are not persisted; clean/reset and global safe-directory edits are disabled.
The built-in read token only fetches public repository inputs. No cache of generated
data is restored. Node/npm and each dependency tree are installed explicitly;
`npm ci` uses each repository's lockfile. Upstream optional native dependencies
and the runner image can still vary with platform/image updates: this is pinned
source/tool CI, not a hermetic binary-reproducible container.

Pre-change inspection found no workflow in tmt2-data; the server had test/publish/
version workflows and the client its own test workflow. Their legacy Node choices
are not reused: client entry point requires >=22.18. The connector reported repo
administration/push access, but its fetch API does not expose Actions administration
permissions. No organization/default-token policy was assumed or changed; the new
workflow narrows its own token permissions explicitly. Remote execution remains
unverified until this fresh branch is authorized for publication.

## Commands from the three-sibling checkout

Use the exact revisions in ci/pins.json for the server/client. Preserve edits and
use a separate clean checkout if they differ; no command below changes revisions.
With the pinned Node/npm installed:

```sh
npm ci
(cd ../Pokemon-Too-Many-Types-2 && npm ci)
(cd ../Pokemon-Too-Many-Types-2-client && npm ci)
node tools/ci/pins.mjs verify
npm run ci:core
npm run ci:network  # separate, real live-DNS diagnostic; may fail in this environment
npm run ci:smoke    # optional focused lifecycle check, requires built dependencies
```

The workflow creates that sibling layout, validates the pin file before using its
outputs, installs the exact Node/npm and lockfiles, then runs the same commands.
The default core job runs on PRs to master, pushes to master and manual dispatch.
Manual dispatch with `network_diagnostics=true` also runs a separate network matrix
job. `fail-fast: false` preserves both results; there is **no continue-on-error**.
A failing DNS diagnostic is red, not reclassified as success. No job is dispatched
remotely as part of implementing these files locally.

## Core coverage and explicit exclusions

`ci:core` reuses process supervision and the exclusive workspace lock. It runs:

1. All data/coordination/CI tests and data TypeScript check.
2. Normal server and client builds at the pins (no full/index data generator).
3. Server lint, TypeScript and simulator/server/lib/tools/random-battle tests using
   its configured suite, preserving the upstream `(slow)` exclusion and separating
   exactly two live-DNS tests (below). `--forbid-only` catches accidental focusing.
4. Client `npm test`: normal build, client/build-tools typechecks, lint and tests.
   On a clean checkout generated data is absent: baseline is 21 passes/3 skips,
   with the 22-test BattleTextParser suite not instantiated. This is not the
   45-test asset-enabled result and not production data validation.
5. Source manifest generated twice and checked for identical bytes/content; exact
   commits/dirty flags printed in logs. Then real coordinated dev lifecycle:
   HTTP and WS `updateuser`, reject concurrent build/manifest operations, SIGTERM
   exit 143, lock removed and ports reusable. Local unit tests cover SIGINT,
   failure paths and stubborn descendants. No playable TMT2 battle is claimed.

The exact names separated into `ci:network` are:

- `IP tools should resolve 127.0.0.1 to localhost`
- `IP tools should resolve unknown IPs correctly`

The regex is anchored to those full names; it does not skip IP tools as a whole,
all DNS-named tests, or unrelated failures. The diagnostic uses `--no-config`,
`test/main.js`, `test/server/ip-tools.js`, the exact inclusion regex, and the
original 2000ms timeout. There are no mocks or global DNS/hosts/security changes.
[Baseline evidence](BASELINE_COMPARISON.md) shows both failures without our tooling.
CI logs and job summaries state that core does **not** execute these two cases.

The optional client news refresh may warn if PHP is unavailable. Missing runtime
assets and blocked remote fallback can leave UI labels incomplete; doctor/dev
report this explicitly. No pipeline downloads unpinned Smogon data to mask it.
Runtime-generated local data, assets, mechanics and battle/replay/browser coverage
will be added through the canonical tickets, not guessed in this stage.

## Failure handling and evidence

Any core failure returns nonzero and stops the sequence. Network diagnostics keep
their true result. Workspace commands do not steal locks; inspect stale lock PID
before manual recovery after a crash. Tests and dev never run simultaneously.
Source snapshots exclude ignored outputs/config; stop manual writers for a stable
snapshot. See [STAGE_1_VALIDATION.md](STAGE_1_VALIDATION.md) for exact current results.
