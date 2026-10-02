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
external data fallback and uses the locally imported/pinned sprite package when
available (otherwise clearly labeled developer cards). Artwork redistribution
rights are unverified; audio is optional. Unrelated legacy entries may still use upstream fallback.
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

The earlier explicitly approved local guest test used
`TMT2_LOCAL_GUESTS=1 npm run workspace:dev`. This opt-in enables unsigned,
unregistered local names only in server memory after enforcing127.0.0.1; it is
not production auth and is **not required for the replay preview below**.
Enabling it for another live-name test needs separate approval; do not add it
to permanent config. No other auth/IP/throttle control changes. Without opt-in,
normal config remains unchanged. Stop with Ctrl-C/SIGTERM when finished and
confirm lock/listeners are gone. Never expose this test server publicly.

### Windows/WSL local preview from the draft branches

The coordinator uses POSIX process groups, so run these commands inside Ubuntu
or another Linux WSL shell, not native PowerShell. Use Node24.19.0/npm11.9.0
for the pinned CI environment (minimum runtime Node22.18), plus Git. The
server SHA is already on master; the client and data changes are on separate
draft-review branches until merged. Use fresh directories to preserve existing
checkouts:

```sh
mkdir -p ~/tmt2 && cd ~/tmt2
git clone https://github.com/matiHirCab/Pokemon-Too-Many-Types-2.git
git clone --branch feat/tmt07-private-client https://github.com/matiHirCab/Pokemon-Too-Many-Types-2-client.git
git clone --branch feat/tmt07-browser-evidence https://github.com/matiHirCab/tmt2-data.git
git -C Pokemon-Too-Many-Types-2 switch --detach 4c21861353d77acf48b29e4b5c08a8b009d83fd3
git -C Pokemon-Too-Many-Types-2-client switch --detach 37aeb63927ee625dd48ddb2744e23d29558777ee
(cd Pokemon-Too-Many-Types-2 && npm ci)
(cd Pokemon-Too-Many-Types-2-client && npm ci)
(cd tmt2-data && npm ci)
```

Keep the exact received `sprites.zip` on your computer. In WSL, use its
Windows path through `/mnt/c` and import it once before generating assets;
replace `YOUR_WINDOWS_USER` with your account name. The importer verifies
archive SHA256
`533b8f4315c3c144d8397dc881600d92a5258ecd3c430025e420a1c85754d4ab`
and all16resources; do not unpack or repackage it.

```sh
SPRITES_ZIP="/mnt/c/Users/YOUR_WINDOWS_USER/Downloads/sprites.zip"
(cd ~/tmt2/Pokemon-Too-Many-Types-2-client && node build-tools/import-tmt2-artwork "$SPRITES_ZIP")
cd ~/tmt2/tmt2-data
npm run workspace:doctor
node tools/ci/pins.mjs verify
npm run integration:generate
npm run workspace:dev
```

Open the printed READY URL in a Windows browser, normally
`http://127.0.0.1:8080/testclient-new.html?~~127.0.0.1:8000`.
For a visual preview without a login, choose **Home → Load local replay JSON**
and select
`Pokemon-Too-Many-Types-2-client/test/fixtures/tmt2-native-browser-replay.json`
from the WSL workspace. From another WSL terminal, `cd ~/tmt2 &&
explorer.exe .` opens that folder in Windows Explorer to locate the fixture.
The six-species catalog is at `http://127.0.0.1:8080/tmt2-seed.html`.
The default launch does not enable unsigned local names; a fresh live
two-player challenge requires separately approved loopback-only opt-in. Stop
`workspace:dev` with Ctrl-C when finished. WSL-host execution has not yet
been independently tested; the local Linux journey and CI are recorded in
[RULES_REFERENCE.md](RULES_REFERENCE.md#tmt-07--qa-nativo-con-sprites-originales-2026-10-02).

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
passed by pinned build-indexes: MIT chat-formatter source and optional locally
imported artwork. No git pull/download. The user-supplied ZIP is pinned by archive,
manifest and all16file hashes in client `tmt2/native-artwork.json`; the original
bytes are not committed or redistributed. This is Showdown artwork for local
evaluation, not extracted TMT2 ROM artwork or verified redistribution permission.

From the client checkout, import the received immutable package once:

```sh
node build-tools/import-tmt2-artwork /path/to/sprites.zip
```

The default ignored destination is `caches/tmt2-native-artwork`. The importer
accepts only the exact pinned stored ZIP and its17whitelisted entries (16images
plus manifest), validates hashes, refuses symlinks/existing destinations and never
executes image content. No Python or unpacking program is needed. An optional
second argument selects a new destination; set `TMT2_SPRITES_DIR` to that folder
for coordinated builds/dev. Missing/corrupt explicit inputs fail before public
outputs are written. Import into a new folder for recovery rather than overwriting
an existing one; an interrupted filesystem copy may leave a partial destination
that must be reviewed before removal. A newly downloaded archive with different
manifest timestamps is not the pinned input and requires explicit verification.

The generated `data/tmt2-native-assets.js` binds visual metadata to datasetHash;
`data/tmt2-native-assets.json` records generator/validator/pin hashes and output
hashes. Actual GIF front/back paths and dimensions, Rosa/Lyra and native cropped
team/Pokéball icons are local. If artwork is absent, CI builds use an explicitly
labeled developer-card mode; this does not satisfy visual acceptance. A present
but damaged package never silently falls back. Audio remains disabled for this
local entry. Custom types and categories use legible text labels. The native
scene/layout/HP/move animations are retained; no ROM fidelity is claimed.
`/tmt2-private.html` is a developer-only protocol harness using BattleSceneStub;
its earlier results cannot certify the user-facing native UX. See RULES_REFERENCE
for the superseding native browser evidence and known limits.
Rollback: stop services, switch clean client/data to the recorded TMT-06 masters,
regenerate compatible catalogs/assets and restart without the guest opt-in. Preserve
unrelated edits/feature branches; no destructive reset or history rewriting.

## Official sprite downloader

Run from tmt2-data with the already supported Node>=22.18 runtime. This utility
needs no sibling checkout, npm dependency install, PowerShell script, ZIP program,
login or security-setting change. npm only provides a convenient command alias.

```text
npm run sprites:download
npm run sprites:download -- --with-ui
npm run sprites:download -- --pokemon rattata,eevee,pidgeot-mega
npm run sprites:download -- --file ids.txt
node tools/sprites/download.mjs --with-ui --file ids.json
node tools/sprites/download.mjs --file ids.json
```

Default IDs: rattata, eevee, froakie, nosepass, floragato, pidgeot. IDs are exact
lowercase sprite filename stems, including hyphens for forms, e.g. pidgeot-mega
and rattata-alola. Display names, TMT canonical IDs and asset filenames can differ;
the tool does not guess aliases or remove form hyphens. Unknown filenames produce
a real HTTP404 failure, not a fallback species. Requesting a form does not add it
to the playable catalog. At most32 unique IDs; duplicate or unsafe IDs fail
before creating output or making requests.

`--with-ui` also requests exactly these four fixed PNG paths on the same official
origin (no arbitrary URL/path option):

- sprites/trainers/rosa.png
- sprites/trainers/lyra.png
- sprites/pokemonicons-sheet.png
- sprites/pokemonicons-pokeball-sheet.png

With default Pokemon IDs that is16 files (12GIF +4PNG); with a custom list it is
twice the list length plus4. Omitting the flag retains the original GIF-only
behavior. It can accompany --pokemon or --file; repeating the flag fails before
writes/network. Trainer filenames are the native mappings of avatars265/102.

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
node .\tools\sprites\download.mjs --with-ui
npm.cmd run sprites:download -- --with-ui
```

Every run creates a unique ignored .local/sprites/download-*/ folder and preserves
each validated original at sprites/ani/ID.gif or sprites/ani-back/ID.gif, plus the
exact four PNG paths above when requested. Only official HTTPS GETs to
https://play.pokemonshowdown.com/ are made at those generated/allowlisted paths;
no index crawling, alternate host, remote code execution or upstream git operation.
Redirects are refused. TLS/certificate/proxy/credential settings are unchanged.
GIF87a/89a headers, bounded dimensions, block framing/trailer and byte size are
checked without executing or decompressing downloaded content. This is structural
validation, not an artistic/provenance or pixel-decoding guarantee.
PNG checks cover signature, IHDR dimensions/encoding, chunk lengths/order/CRCs,
required IDAT data and a final IEND with no trailing bytes. PNG dimensions are
bounded to16384 per axis and16Mi pixels (tall icon sheets can exceed the4096 GIF
limit); the same8MiB response limit applies. Compressed pixels are not decoded.

manifest.json records exact source URLs, SHA256, byte sizes, canvas dimensions,
GIF frame counts or PNG dimensions, requested UI paths, attempts and policy.
report.json records every failure and ZIP
hash/size. ZIP contains successful originals plus that manifest **only when all
requested GIF and PNG downloads succeed**; a partial run exits1 and leaves no ZIP. Existing
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

Local verification (2026-10-01, Node24.19.0/npm11.9.0): the original combined
branch passed47 tests, including8new sprite tests and2unpublished TMT07 local-guest
tests. The isolated publication branch passes45 tests, including all8sprite tests;
the2TMT07 tests are outside this PR, not skipped or suppressed. npm run typecheck,
node --check on both modules and the test file, and git diff --check passed.
An independent Python ZIP reader
verified CRCs, entries, original bytes and source hashes of a synthetic successful
download; Python is not a runtime dependency of this CLI. The live command
`npm run sprites:download -- --pokemon rattata --timeout-ms 1000 --retries 0`
exited1:0/2files, front network failure, back timeout, failure report preserved,
no ZIP. It did not overcome the previously confirmed cloud proxy403. No official
asset transfer success, Windows-host execution or final graphic integration is
claimed by these tests. No data lint script is configured; no sibling changes or
extra server/client suite rerun is needed for this independent utility.

UI option verification (2026-10-02, same Node/npm): five new synthetic/local test
cases cover composition/allowlist, PNG structure/CRC/dimensions,16originals with
hashes/complete ZIP, PNG403/redirect/corrupt failures, transient retry, byte limits
and cancellation. The complete data suite passes50tests,0fail,0skip; typecheck,
node --check and git diff --check pass. No data lint command is configured.
An independent Python standard-library reader checked the synthetic17-entry ZIP's
CRCs, original bytes/SHA256 and PNG chunk CRCs/pixel stream; Python is not required
by the CLI. A bounded live HEAD to the official rosa.png URL failed curl exit56,
“CONNECT tunnel failed, response403”, before reaching the origin. That cloud proxy
restriction is a separate access blocker, not a fixture success. No official
transfer, Windows-host run, client installation, graphical
acceptance or full sibling CI is claimed. The saved TMT07 branches are preserved;
this utility extension is isolated on a fresh branch from merged master.
