# Development: three sibling repositories

```text
workspace/
├── Pokemon-Too-Many-Types-2/
├── Pokemon-Too-Many-Types-2-client/
└── tmt2-data/
```

Keep independent Git histories: no fourth repository or submodules. Use Node
**22.18 or later**, npm and Git. Service supervision requires POSIX process groups
(Linux/macOS, or WSL on Windows). Paths containing spaces are supported.

## Reproduce setup

Clone the three `matiHirCab` repositories into the layout above. For a repeatable
checkout use explicitly reviewed commit SHAs, then run `npm ci` in each repository.
No coordination command performs a Git fetch/pull/reset, installs dependencies
or selects a remote revision automatically. The upstream normal client build
may attempt its optional news refresh, and its test page can load remote assets.
A build may create the forks' default ignored config files
and normal generated build outputs. Existing local configs remain in use.

```sh
cd tmt2-data
npm ci
(cd ../Pokemon-Too-Many-Types-2 && npm ci)
(cd ../Pokemon-Too-Many-Types-2-client && npm ci)
npm run workspace:doctor
npm test
npm run typecheck
npm run integration:generate
npm run workspace:build
npm run integration:check
npm run integration:test
npm run workspace:test
npm run workspace:dev
```

`doctor` validates Git roots, package identities, distinct sibling locations,
ports, minimum Node and installed dependency sentinels; it prints Node/npm/Git
versions, dataset status and missing client runtime assets. It is not a full
dependency-integrity audit.
`workspace:build` checks the shared catalog, builds the server, generates indexes
from that exact local server HEAD, then builds the client. `workspace:test` runs this repository's
tests/typecheck then each fork's `npm test` (including its lint/typecheck lifecycle).
Failures stop the sequence and produce a nonzero exit status.
Build/test/dev and manifest write/check share an exclusive `.local/operation.lock`
to prevent concurrent
commands from interfering with generated files or server REPL sockets. Do not run
fork tests manually while dev is running either. Normal completion/failure/signals
release the lock. After SIGKILL or a machine crash, inspect its recorded PID and
remove only the stale lock after verifying that operation and its children ended.
Locks are never stolen automatically; releasing an old lock does not delete a
replacement lock. A symlinked `.local` directory is rejected.

**Client build scope:** local `build-indexes --server PATH --commit FULL_SHA`, then
normal `node build`, including the seed runtime. No clone/pull or revision switch.
The index builder requires explicit pinned inputs, a compiled server, and the
registered mod; missing arguments/mods fail instead of fetching upstream. It
builds normal-format tables separately from the bounded mod table. Its cache
records source and output hashes; `--fresh` forces regeneration. The catalog and
runtime each verify both canonical dataset and derived-table hashes.

Generated public assets remain ignored. Text, species/move/ability data and
search/teambuilder tables now come from the local pinned checkout. Legacy optional
graphics.js/commands.js remain absent and doctor reports them. The native TMT2
entry loads local scene/move animations and pinned chat-formatter instead, disables
external data fallback and labels its local sprite placeholders. Original art/audio
are not certified; unrelated legacy entries may still use upstream fallback.
READY is HTTP readiness, not a playable battle certificate. `full`, `minidex` and
other independent upstream generators are not invoked by coordination.

`workspace:dev` checks both ports, builds, starts the server and a small static
client HTTP service on loopback, and waits for both HTTP readiness endpoints.
Open the printed READY URL, normally:
`http://127.0.0.1:8080/testclient-new.html?~~localhost:8000`.
The isolated catalog view is `http://127.0.0.1:8080/tmt2-seed.html`; it renders all
six names/types, filters by every type slot, and displays dataset identity.
The hidden format stays absent from public challenge/search menus; this local
native entry adds it only to its private Challenge selector.
The server bootstrap changes bind address/port/SSL/watchconfig only in memory.
It loads the user's other server settings unchanged. This is the existing Showdown
test client; remote assets/login features may still require internet access.
Ctrl-C exits 130; SIGTERM exits 143. Either service exiting (even with code 0), a
spawn error or a startup timeout stops both groups; after a two-second grace
period SIGKILL removes remaining descendants. Port conflicts fail before building.
The static server serves only the client public directory, not repository/config
sources. This is a development server, not production hosting.

## Configure paths and ports

Defaults resolve from `tmt2-data`, independent of the shell's current directory.
For custom sibling names:

```sh
TMT2_SERVER_DIR=../server TMT2_CLIENT_DIR=../client npm run workspace:doctor
cp workspace.example.json workspace.local.json
TMT2_WORKSPACE_CONFIG=./workspace.local.json npm run workspace:dev
```

Config keys: `server`, `client`, `serverPort`, `clientPort`, optional `dataset`.
Unknown keys and invalid values fail. Ports are distinct integers 1024–65535.
Config-file paths resolve relative to the config file; without one, directory
environment overrides resolve relative to `tmt2-data`. Environment directory
values override JSON. `TMT2_WORKSPACE_CONFIG` itself resolves from shell cwd.
Do not commit machine-specific paths or local secrets.

## Compatibility snapshots and incomplete data

```sh
npm run workspace:manifest:write
npm run workspace:manifest:check
npm run workspace:data:validate
```

The first command uses an exclusively created unique temporary file and atomically
replaces ignored `.local/compatibility.json`. Review
changes before refreshing a stale snapshot. The check leaves the snapshot unchanged (but acquires/releases the operation lock)
and fails if
any recorded state differs or no snapshot exists. There are no timestamps or
absolute paths: identical inputs produce identical bytes. Every repository has a
HEAD commit, dirty flag and SHA-256 over sorted file names, file/executable/symlink
kind and content hashes of tracked and nonignored untracked files. Deleted files
are represented explicitly. Ignored dependencies, local config, build outputs and
the manifest itself are excluded. The snapshot therefore describes **source state**,
not a reproducible binary/environment certificate; ignored configs can change
runtime behavior. Stop manual edits/fork commands while taking a snapshot; the
lock excludes other coordination operations, not arbitrary external writers. Dirty trees are visible and content-sensitive, not represented
as clean commits. Commit/clean the intended changes before sharing release pins.

A bounded adaptation dataset now exists at `normalized/seed.json`, selected by
default; a config `dataset` overrides it. Its selected contract passes; doctor/manifest show
`bounded-seed-validated`, not full production certification. `seedValidated` may become true only after the seed contract
passes; `productionValidated`/`fullCatalogValidated` remain false because full
catalog and gameplay fidelity are outside this slice. Legacy identity documents
remain `identified-unvalidated`. Fixture files can never pass selected seed validation.

`npm run seed:validate` and `workspace:data:validate` run schema and semantic checks
for the bounded contract; the selected seed exits0, while fixtures/missing data
exit1. No
empty generator or automatic type fallback. `npm run seed:prepare -- --output NEW.json`
extracts dependencies from the already-built pinned server into a new validated seed file,
never overwriting existing files or fetching data. `--fixture` makes a labeled test
fixture only. Full commands, sets, boundaries and results are in
[RULES_REFERENCE.md](RULES_REFERENCE.md#tmt-04--esquema-y-semilla-acotada).

## Rollback

Stop `workspace:dev` with Ctrl-C and wait for process-group cleanup. On the data
repository, review `git diff` and remove only files from this slice (see the change
report), or revert its commit if committed. Do not use a workspace-wide reset.
Fork changes live on separate feature branches. After stopping services, switch
all three repositories back to their previous branches only with clean working
trees; the feature commits remain available. For an already shared change, review
coordinated reverts instead of reset/clean. Ignored build outputs may persist;
remove only reviewed generated outputs if needed, preserving configs/dependencies.
Delete `.local/compatibility.json` to discard a snapshot.

## Integration pins and eventual review order

`provenance/inheritance-pins.json` pins the original server facts used by the
seed. `ci/pins.json` pins the consumer integration revisions. Generation rejects
changes to inherited fact files from the original pin; it does not silently
re-extract a different Dex. Catalog metadata carries version, dataset hash,
derived catalog hash and original base commit, with no circular consumer/self SHA.
The protocol record `tmt2data` checks version and both hashes in battle/replay
parsing. Unsupported seed records fail instead of falling back to upstream data.
Full EV/IV legality, battle engine internal moves, damage and effect certification
remain TMT-06; hidden format construction is not a completed battle.

No publication is performed by these commands. When separately authorized,
publish the server/client branches first so the commits in `ci/pins.json` are
fetchable, then review the data change with those exact revisions. If consumer
merges squash/rebase them, repin the reviewed merge commits and rerun core before
merging data; otherwise preserve the reviewed commits. Never force-push to repair
pins. Exact current branches/commits and local evidence are recorded in
[RULES_REFERENCE.md](RULES_REFERENCE.md#tmt-05--integracion-local-aislada).

For TMT-06, use the exact consumer pins in `ci/pins.json` before generation/build.
Server/client then data remains the safe eventual publication/review order; this
ticket has no publication authorization yet. Do not merge data with unreachable
consumer pins. Preserve reviewed commits or explicitly repin reviewed merge heads
and rerun core after squash/rebase. The original inherited facts pin remains separate.
Open `/tmt2-seed.html` on the local client for locked level50/IV31/EV0 stats and
copyable alpha/beta imports. Import a whole premade into the local client; the hidden
format rejects mixed or edited sets with server errors. No general EV editor or
expanded teambuilder is introduced. To undo this slice safely, stop local services
and switch each clean checkout to the three recorded TMT-05 merge heads, then
regenerate catalogs/assets with that data revision; never reset unrelated edits or
reuse incompatible generated outputs. Local feature branches can be retained.

## Implementation backlog

Follow only [ROADMAP.md](ROADMAP.md) for implementation stages, ticket prerequisites
and status. The former next-slice registration proposal is superseded by TMT-05,
which now depends on a verified seed (TMT-04); it is not an independent task.
Use [CI.md](CI.md) for reproducible verification and the explicit DNS diagnostic
split. Historical test results remain evidence, not competing implementation plans.

## Private local seed battle (TMT-07)

For the explicitly approved local guest test, run
`TMT2_LOCAL_GUESTS=1 npm run workspace:dev`. This opt-in enables unsigned,
unregistered local names only in server memory after enforcing127.0.0.1; it is
not production auth. No other auth/IP/throttle control changes. Without opt-in,
normal config remains unchanged. Stop with Ctrl-C/SIGTERM when finished and
confirm lock/listeners are gone. Never expose this test server publicly.

Open `/testclient-new.html?~~127.0.0.1:8000` in two independent browser
profiles (replace8000 with the configured loopback server port). Use Choose name,
Find a user, Look up, Challenge. Select the private [Gen9] TMT2 Seed format in
the existing format picker and TMT2 alpha; the recipient selects TMT2 beta and
Accept. Premades are installed locally without replacing saved teams. Choose lead
and play through the native move/switch controls. Cancel/retry respects the
inherited10-second cooldown. Reload restores the local name and rejoins after its
acknowledgement. No public auth requests or keys are used by this loopback-only
entry; server guest security is unchanged unless the explicit opt-in is present.

Use the native Download replay button, then Home's Load local replay JSON.
Replay retains the real BattleScene, HP/log, controls and isolated catalog; reload
restores it from session storage. Downloaded JSON, rather than the session-local
Copy/Visit URL, is how another profile receives the replay. Public upload is
disabled. Tier/dataset/version/catalogHash mismatch fails, with no official Dex
fallback. Replays require this compatible built client, not public replay hosting.

`build-tools/build-native-tmt2` consumes only the clean exact local server SHA
passed by pinned build-indexes: MIT chat-formatter source and code-generated SVG
text cards with output hashes in data/tmt2-native-assets.json. No git pull/download.
The original sprites/audio are unavailable here (the official asset request
returned403); cards explicitly say “sprite unavailable”, audio is disabled only
for this local entry. The native scene/layout/HP/move animations still run.
This proves native functional integration, not finished artwork or ROM fidelity.
`/tmt2-private.html` is a developer-only protocol harness using BattleSceneStub;
its earlier results cannot certify the user-facing native UX. See RULES_REFERENCE
for the superseding native browser evidence and known limits.
Rollback: stop services, switch clean client/data to the recorded TMT-06 masters,
regenerate compatible catalogs/assets and restart without the guest opt-in. Preserve
unrelated edits/feature branches; no destructive reset or history rewriting.
