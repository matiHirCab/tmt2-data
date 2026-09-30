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
npm run workspace:build
npm run workspace:test
npm run workspace:dev
```

`doctor` validates Git roots, package identities, distinct sibling locations,
ports, minimum Node and installed dependency sentinels; it prints Node/npm/Git
versions, dataset status and missing client runtime assets. It is not a full
dependency-integrity audit.
`workspace:build` builds server then client. `workspace:test` runs this repository's
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

**Client build scope:** only `node build`, using already available local runtime
data. The client data directory is generated and Git-ignored, **not checked in**;
a clean checkout has none of these files. Doctor reports `clientAssets: incomplete`,
and dev warns with the missing paths. READY means HTTP readiness only, not complete
assets or a playable TMT2 build.
The coordination CLI accepts no extra build arguments. It never calls `full`,
`indexes`, `learnsets` or `minidex`: current index tooling clones/pulls upstream
Smogon and uses the base Dex. This slice does not regenerate or claim synchronized
TMT2 client data. A future data build must explicitly pin its input and select the
correct mod Dex before it can join this workflow.

`workspace:dev` checks both ports, builds, starts the server and a small static
client HTTP service on loopback, and waits for both HTTP readiness endpoints.
Open the printed READY URL, normally:
`http://127.0.0.1:8080/testclient-new.html?~~localhost:8000`.
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

No authoritative dataset exists in this checkout. By default the manifest says
`dataset.status = absent`, `productionValidated = false`, and protocol compatibility
is `unverified`. Optional `dataset` points to a JSON identity document requiring
`kind: "production" | "test-fixture"` and a nonempty `version`. Its exact bytes are
hashed, and it remains `identified-unvalidated`. This hash identifies that document,
not external files it might reference. Synthetic identity documents used by tests
are **not ROM data** and never become production artifacts.

`workspace:data:validate` deliberately exits 1, even with an identity document:
production schema/provenance/mechanics validation is not implemented. There is no
empty-data generator and no ROM binary is required for coordination work.

## Rollback

Stop `workspace:dev` with Ctrl-C and wait for process-group cleanup. On the data
repository, review `git diff` and remove only files from this slice (see the change
report), or revert its commit if committed. Do not use a workspace-wide reset.
Fork sources are unchanged; builds can produce ignored outputs/configs/logs.
Delete `.local/compatibility.json` to discard the snapshot; preserve personal
configuration and installed dependencies as desired. Returning to the previous
branch alone does not remove uncommitted files: preserve or selectively remove
this slice first.

## Implementation backlog

Follow only [ROADMAP.md](ROADMAP.md) for implementation stages, ticket prerequisites
and status. The former next-slice registration proposal is superseded by TMT-05,
which now depends on a verified seed (TMT-04); it is not an independent task.
Use [CI.md](CI.md) for reproducible verification and the explicit DNS diagnostic
split. Historical test results remain evidence, not competing implementation plans.
