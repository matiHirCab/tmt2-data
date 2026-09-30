# Initial coordination slice verification

Follow-up: [controlled baseline comparison and final safety checks](BASELINE_COMPARISON.md)
explains the test-count differences, DNS failures and missing runtime assets. The
follow-up raises the coordination test count to 13 and supersedes the preliminary
UI attribution below.

Verified in the provisioned environment with Node 24.19.0, npm 11.9.0 and Git
2.52.0. Checkouts initially had no dependencies/build outputs; `npm ci` installed
from each lockfile. The npm cache was redirected to a writable temporary directory.
No server/client tracked source was modified. No push, PR, merge or deployment.

## Passed

- `npm test` in `tmt2-data`: 10 tests, no failures. Covers strict config/paths,
  manifest determinism/drift, dataset identity labeling, missing dependencies,
  spawn/exit failures, SIGINT exit 130, stubborn grandchild cleanup, static-server
  containment/HEAD/methods, readiness failure and exclusive operation lock.
- `npm run typecheck` in `tmt2-data`; `git diff --check`.
- `npm run workspace:doctor` and `npm run workspace:build`: both normal builds.
- Client `npm test`: build, both TypeScript checks, lint, 21 tests passed, 3 skipped.
- Server `npm run lint` (workspace test pretest) and separate `npm run tsc`.
- `npm run workspace:dev`: both HTTP endpoints returned 200; direct
  `/showdown/websocket` received `|updateuser|` protocol. Browser opened the new
  test client and received guest identity, Lobby and 345 existing formats.
- Browser verification used `agent-browser` with installed Chromium and the
  container's required `--no-sandbox`; screenshot captured, no page exceptions
  reported. Main controls rendered. This is not full gameplay/UI acceptance.
- Lifecycle integration: READY reached, concurrent coordinated build rejected,
  SIGTERM returned 143, lock removed and both ports could be rebound. A separate
  real Ctrl-C/SIGINT check returned 130 and released both ports.
- `workspace:manifest:write` twice plus byte comparison and
  `workspace:manifest:check`: identical snapshots. Corrupt snapshot rejected.
- `workspace:data:validate`, unsupported `build full`, and occupied service port:
  expected nonzero failures, with explicit diagnostics.

## Failed / limited

- `npm run workspace:test` correctly stopped at the server's existing suite:
  **2366 passed, 74 pending, 1 failed**. `IP tools / should resolve unknown IPs
  correctly` exceeded its 2000 ms timeout.
- A diagnostic server invocation,
  `node node_modules/mocha/bin/mocha.js test/server/ip-tools.js --timeout 10000`,
  also included the configured full suite (Mocha adds configured specs). It
  produced **2366 passed, 74 pending, 1 failed**: loopback lookup returned
  `ip6-localhost`, while the test expects `localhost`. No DNS/host config or
  upstream test was changed. The normal server suite is **not green** here.
- Client's optional news refresh reports missing `php`; build exits 0. Browser
  shows existing `undefined` labels and unavailable remote imagery. Teambuilder
  navigation was attempted but its automation selector did not resolve, so that
  interaction is not certified. No TMT2 UI has been implemented.
- The initial browser download failed through the proxy; system Chromium enabled
  the read-only browser check without downloading Chrome or changing permissions.
- Running upstream tests concurrently with dev produced REPL EPIPE logs. Final
  lifecycle checks ran independently without those logs; coordination now rejects
  simultaneous build/test/dev. Manually started fork commands bypass this lock.

## Not run / intentionally unavailable

No full/index client data build (would pull unpinned Smogon inputs), production
ROM/data generation, authoritative mechanics validation, mod registration,
network login, or TMT2 battle acceptance. No dedicated lint configuration exists
for the new Node `.mjs` tools; executable tests and Node syntax checking cover
this slice, alongside the existing TypeScript scaffold check.

## Review and rollback

Only `tmt2-data` has tracked changes, on `feat/workspace-coordination`. See
DEVELOPMENT.md for commands, config and pending integration plan, and WORK_ITEMS.md
for scoped follow-up work. Stop dev before switching/reverting. Revert the local
coordination commit to remove this slice; delete ignored `.local/compatibility.json`
if unwanted. Fork build outputs/configs/dependencies are ignored and may remain;
never reset the sibling workspaces or erase personal config as a rollback shortcut.
