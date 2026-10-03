# CI reproducible — TMT-03

Implementation scope/status belongs only to [ROADMAP.md](ROADMAP.md#tmt-03--ci-reproducible).
This document describes verification, not another backlog. CI needs no ROM/BPS.

## Pins and permissions

[ci/pins.json](../ci/pins.json) fixes Node 24.19.0, npm 11.9.0 and the two fork
reviewed consumer integration commits. `provenance/inheritance-pins.json` separately
fixes the original inherited data revision. The data repository is the exact
GitHub event checkout (the PR merge candidate on pull_request, event commit on
push); the resulting manifest records all three actual HEADs. No self-referential
data-commit pin is hardcoded. Pin updates require reviewed evidence; commands
reject mismatched/dirty sibling sources instead of pulling or resetting them.

[ci.yml](../.github/workflows/ci.yml) uses Ubuntu 24.04, exact action commit SHAs
(reviewed v6 tags of actions/checkout and actions/setup-node), and `contents: read`
only. Server checkout includes full history so the inherited-source guard can
compare the original pinned ancestor; checked-out HEAD remains the exact consumer pin.
It has no custom secrets, write token, pull_request_target, environment,
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
2. Bounded seed validation, catalog drift checks, server build, explicit offline
   client index generation from the pinned server/mod, normal client/runtime build,
   and cross-repository identity/isolation checks.
3. Server lint, TypeScript and simulator/server/lib/tools/random-battle tests using
   its configured suite, preserving the upstream `(slow)` exclusion and separating
   exactly two live-DNS tests (below). `--forbid-only` catches accidental focusing.
4. Client `npm test`: normal build, client/build-tools typechecks, lint and tests.
   Local index generation now instantiates the 22-test BattleTextParser suite and
   asset-dependent tests previously skipped. Six new client integration tests cover
   routing, protocol drift, search/type rendering and unsafe generator inputs.
   One inherited explicit skip remains; see the dated evidence in RULES_REFERENCE.
5. Source manifest generated twice and checked for identical bytes/content; exact
   commits/dirty flags printed in logs. Then real coordinated dev lifecycle:
   HTTP and WS `updateuser`, reject concurrent build/manifest operations, SIGTERM
   exit 143, lock removed and ports reusable. Startup has a bounded 240-second
   budget including a cold offline index build (previous 90-second budget only
   covered normal builds). Local unit tests cover SIGINT,
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

The optional client news refresh may warn if PHP is unavailable. Graphics and
other resources can still be absent or require remote fallback, reported by doctor.
The pinned offline pipeline restores data/text labels without downloading Smogon.
No full battle, no-EV runtime or exact ROM fidelity is certified by integration CI.

TMT-06 extends core with actual mod simulator tests (the server's configured suite)
and cross-repository checks: client premade export must pass authoritative validation,
client EV0 stats must equal actual battle stats, and engine-only Struggle metadata
must match the pinned Gen9 parent. Struggle is never a selectable catalog/learnset
entry. These are adaptation checks, not ROM measurements or the two-browser TMT-07
journey. See the dated results in RULES_REFERENCE; earlier TMT-05 limits above are
historical scope evidence. Live DNS and slow exclusions remain exactly unchanged.

## Failure handling and evidence

Any core failure returns nonzero and stops the sequence. Network diagnostics keep
their true result. Workspace commands do not steal locks; inspect stale lock PID
before manual recovery after a crash. Tests and dev never run simultaneously.
Source snapshots exclude ignored outputs/config; stop manual writers for a stable
snapshot. See [STAGE_1_VALIDATION.md](STAGE_1_VALIDATION.md) for exact current results.

TMT-04 adds selected bounded seed validation after own tests/typecheck, before
fork builds. `normalized/seed.json` now passes its bounded adaptation contract, including
registered creator rows and chart coverage. Fixture success cannot bypass that gate. The validator runs offline against committed schema/evidence/pins.

## TMT-11: deterministic adaptation regression (partial)

`npm run regression:check` runs four complete actual-mod battles twice with fixed
PRNG seeds: alpha/beta, beta/gamma, gamma/alpha and beta Mega/alpha. It checks
byte-identical replay objects, winners, turn/event counts and log hashes against
`tests/fixtures/tmt11-adaptation.json`. Only spectator projection and wall-clock
`|t:|` records are normalized. There is no automatic expectation update command;
a changed dataset or battle output requires a reviewed expectation change.
These are characterization checks of the approved adaptation, **not independent
ROM measurements**. The existing damage/STAB/Mega oracle cases in server
`test/sim/tmt2-runtime.js`, `test/sim/tmt2-mega.js` and `test/sim/tmt2-catalog.js`
remain in the configured server suite; their classifications/limits remain intact.

Core executes the regression after fork builds/parity verification. Independent
ordinary Gen9 battles before/after the TMT battles retain Normal/Flying Pidgeot,
Ground immunity, EV influence, non-seed levels and Terastallization eligibility;
Gen9/Gen8 format Dexes and ordinary Mew availability remain isolated. Consumer
pins now name the exact merged TMT-10 master commits, whose trees were verified
identical to the reviewed feature inputs; this is not a repair of failed TMT-10 CI.

The native browser runner is now prepared as `npm run ci:browser`, separately
from `ci:core`; a successful core run cannot substitute for its own result.
Playwright 1.62.1 is lockfile-pinned. The core workflow installs its pinned Chromium
revision with `npx --no-install playwright install chromium` (no sudo/with-deps,
permission/security changes), then runs the native browser step. The browser job uses a standard hosted macOS 15 agent, separately from the
Ubuntu 24.04 core/network jobs; it first runs the same full core profile.
The previous unchanged Ubuntu 24.04 browser attempt failed with `No usable
sandbox` before service startup. No AppArmor/sysctl/SUID settings were changed;
selecting a normally sandbox-capable host retains the required browser sandbox.
Its actual result is recorded on PR #13, not assumed from platform choice: `chromiumSandbox: true` is explicit
because Playwright's default is false ([launch API](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-option-chromium-sandbox)).
There is no no-sandbox fallback or bypass option in the CLI/CI. If that host lacks
sandbox capabilities/libraries, the browser step fails with its real error; it
never reclassifies core success as browser success.

The runner exercises two isolated browser contexts, real anonymous Guest WS and
server `/utm`/`/vtm`, native alpha/beta/gamma roundtrips, invalid EV/level rejection
and reload persistence, fixed stats/type searches, four compatible completed
replays in both contexts, viewpoint/reload and drift rejection. Requests may
reach only the configured credential-free loopback services; native WS is passed
through, never mocked or replaced. Page/console errors, HTTP missing resources
and remote fallback attempts fail. It starts the actual supervised dev commands,
forces local-guests off, and checks SIGTERM143/lock/port/persistent-config cleanup.
Screenshots and results are ignored local evidence, not redistributed assets.
CI lacks imported original sprites and must disclose its labeled developer cards.
This is replay/editor regression, **not a new live named two-player challenge**.

A local sandboxed launch failed before starting services (helper owned by nobody
with mode4755). No helper permissions or host settings were altered. The user
subsequently authorized one ephemeral local no-sandbox test; an external browser
may be passed programmatically to the reusable suite for that bounded test only.
The CLI remains sandbox-required. External-launch results are explicitly labeled
local/externally controlled with a separate launcher record, never CI evidence.
Local permission can help debug selectors and collect review captures; it cannot
close the hosted-CI gate or owner review. TMT-11 stays partial until its remaining
gates are actually verified; see ROADMAP and the owner checklist below in
RULES_REFERENCE. Historical TMT-07/TMT-10 captures retain their original limits.
