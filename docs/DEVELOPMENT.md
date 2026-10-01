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
search/teambuilder tables now come from the local pinned checkout. Other assets,
including graphics.js, commands.js, chat-formatter.js and sprite/logo/audio
resources, can remain absent or use remote fallbacks; doctor reports them.
READY is HTTP readiness, not a playable battle certificate. `full`, `minidex` and
other independent upstream generators are not invoked by coordination.

`workspace:dev` checks both ports, builds, starts the server and a small static
client HTTP service on loopback, and waits for both HTTP readiness endpoints.
Open the printed READY URL, normally:
`http://127.0.0.1:8080/testclient-new.html?~~localhost:8000`.
The isolated catalog view is `http://127.0.0.1:8080/tmt2-seed.html`; it renders all
six names/types, filters by every type slot, and displays dataset identity.
The hidden format is deliberately absent from public challenge/search menus.
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

## Official sprite downloader

Run from tmt2-data with the already supported Node>=22.18 runtime. This utility
needs no sibling checkout, npm dependency install, PowerShell script, ZIP program,
login or security-setting change. npm only provides a convenient command alias.

```text
npm run sprites:download
npm run sprites:download -- --pokemon rattata,eevee,pidgeot-mega
npm run sprites:download -- --file ids.txt
node tools/sprites/download.mjs --file ids.json
```

Default IDs: rattata, eevee, froakie, nosepass, floragato, pidgeot. IDs are exact
lowercase sprite filename stems, including hyphens for forms, e.g. pidgeot-mega
and rattata-alola. Display names, TMT canonical IDs and asset filenames can differ;
the tool does not guess aliases or remove form hyphens. Unknown filenames produce
a real HTTP404 failure, not a fallback species. Requesting a form does not add it
to the playable catalog. At most32 unique IDs; duplicate or unsafe IDs fail
before creating output or making requests.

ids.txt contains one ID per line (or comma-separated IDs), with optional whole
comment lines beginning #. ids.json is a JSON array of strings, for example:

```json
["rattata", "pidgeot-mega"]
```

On Windows, if PowerShell selects a blocked npm.ps1 shim, invoke the normal
executable or command shim explicitly **without changing execution policies**:

```text
node .\tools\sprites\download.mjs --pokemon rattata,pidgeot-mega
npm.cmd run sprites:download -- --file ids.txt
```

Every run creates a unique ignored .local/sprites/download-*/ folder and preserves
each validated original at sprites/ani/ID.gif or sprites/ani-back/ID.gif. Only
HTTPS GETs to https://play.pokemonshowdown.com/sprites/ani/ and ani-back/ are made;
no index crawling, alternate host, remote code execution or upstream git operation.
Redirects are refused. TLS/certificate/proxy/credential settings are unchanged.
GIF87a/89a headers, bounded dimensions, block framing/trailer and byte size are
checked without executing or decompressing downloaded content. This is structural
validation, not an artistic/provenance or pixel-decoding guarantee.

manifest.json records exact source URLs, SHA256, byte sizes, canvas dimensions,
frame counts, attempts and policy. report.json records every failure and ZIP
hash/size. ZIP contains successful originals plus that manifest **only when all
front/back downloads succeed**; a partial run exits1 and leaves no ZIP. Existing
runs are never overwritten. ZIP uses portable stored entries and requires no new
dependency; the archive hash lives outside it to avoid a circular self-hash.

Limits:8MiB/response,128MiB of preserved valid originals/run,32KiB list file,
ten-minute overall budget (retried or rejected responses also consume network);
--timeout-ms100..30000 (default15000 per attempt), --retries0..2 (default1).
Transient network/timeout/408/429/selected5xx failures retry with bounded delay;
403/404, redirects and invalid content do not. SIGINT/SIGTERM cancel remaining
requests, preserve a failure report when writable and exit130/143. Filesystem
errors can prevent the report; they still fail visibly. Fix missing IDs/network
then start a new run; partial originals remain available for inspection.

Public availability and the client code's AGPL license do not establish artwork
redistribution rights. This utility is for authorized local evaluation; do not
commit its output or publish its ZIP under unverified rights. Official references:
https://play.pokemonshowdown.com/sprites/ and https://pokemonshowdown.com/credits.
It does not install assets into the client or complete TMT07 graphical acceptance.
The cloud proxy403 is an actual access blocker; synthetic/local tests do not count
as successful official downloads, and the tool never bypasses that restriction.

Local verification (2026-10-01, Node24.19.0/npm11.9.0): npm test47passed,
including8new sprite tests; npm run typecheck, node --check on both modules and
the test file, and git diff --check passed. An independent Python ZIP reader
verified CRCs, entries, original bytes and source hashes of a synthetic successful
download; Python is not a runtime dependency of this CLI. The live command
`npm run sprites:download -- --pokemon rattata --timeout-ms 1000 --retries 0`
exited1:0/2files, front network failure, back timeout, failure report preserved,
no ZIP. It did not overcome the previously confirmed cloud proxy403. No official
asset transfer success, Windows-host execution or final graphic integration is
claimed by these tests. No data lint script is configured; no sibling changes or
extra server/client suite rerun is needed for this independent utility.
