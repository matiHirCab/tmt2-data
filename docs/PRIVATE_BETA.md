# Private reproducible beta — TMT-12

Scope explicitly approved on2026-10-03: local/private evaluation of the bounded
Gen9 adaptation. This is not public release, a redistribution license, ROM
fidelity certification or human playtesting. No ROM, BPS, game art archive or
credentials are bundled. The canonical backlog remains [ROADMAP](ROADMAP.md).

## Install a reviewed version

Use three separate sibling checkouts on Linux/macOS or WSL. Record the **reviewed
full data commit** from the merged/draft PR you intend to evaluate; do not replace
it with a floating branch or assume a newer master is compatible.

```sh
git clone https://github.com/matiHirCab/tmt2-data.git
git clone https://github.com/matiHirCab/Pokemon-Too-Many-Types-2.git
git clone https://github.com/matiHirCab/Pokemon-Too-Many-Types-2-client.git
cd tmt2-data
git checkout --detach <reviewed-full-data-SHA>
```

On existing checkouts, preserve edits first; use clean checkouts rather than
reset/clean. Read server/client full SHAs and Node/npm versions in `ci/pins.json`.
Explicitly checkout those SHAs in the corresponding siblings. Currently server
`db159373b132babf016cf78ced737dec05d23d97`, client
`75a5cdef759cb30f391ebf7e9dfe6e3384f6c931`, Node24.19.0/npm11.9.0.
Use the repository's [workspace config](DEVELOPMENT.md#configure-paths-and-ports) for custom
sibling names/paths and distinct ports; no machine paths are committed.

```sh
npm run beta:prepare
npm run ci:core
npm run beta:check
npm run beta:dev
```

`beta:prepare` verifies pins and clean sources **before** changing dependencies;
installs all three lockfiles (explicit npm registry access), builds the existing
server/native client using the pinned local server, verifies consumers, and
writes `.local/private-beta.json`. npm cache remains inside ignored `.local`.
It never fetches/pulls/resets Git, selects revisions, downloads artwork, modifies
config/security or generates a ROM. Re-running replaces ignored node_modules
through npm ci; it preserves source edits by refusing dirty source trees.

`beta:snapshot` records an already built, validated clean checkout without an
install. `beta:check` detects changes to the three commits/trees, lockfiles,
dataset/catalog, ports and exact local runtime/art files. Snapshot creation twice
is byte-identical for identical inputs. The data commit is resolved from the clean
checkout, not written into its own tracked pin file (no circular self-SHA).

`beta:dev` checks the snapshot, builds under the existing exclusive lock, checks
again before opening listeners, and launches the **native Showdown new client** on
127.0.0.1. Follow its READY URL. Ctrl+C stops both services and releases their lock
and ports. Keep `TMT2_LOCAL_GUESTS` unset/0; beta commands reject unsigned names.
Only one operation at a time; do not run prepare/core while dev is running.
POSIX process supervision requires WSL for Windows.

## Assets stay external

Use the already authorized local user cache or `TMT2_SPRITES_DIR` as documented
in DEVELOPMENT; keep the supplied archive unchanged. Existing user art retains
priority. Authorized optional matching Showdown art installation is a separate
explicit setup step (`sprites:install`); prepare/launch never perform it. For an
already populated cache, ordinary builds are offline with no runtime remote data
fallback. No archive/downloaded sprites are attached to this beta/PR.

The snapshot records the actual local art profile, manifest and file hashes.
Different optional profiles produce different snapshots intentionally. Missing
art uses labeled generated cards and is recorded as placeholderSpecies; do not
call that equivalent to reviewed matching sprites. After changing asset inputs,
run `workspace:build`, inspect them, then explicitly take a new `beta:snapshot`.
Rights/redistribution approval remains false and dataset license unselected.

## Two-player check and replay

Use two independent browser profiles, not two tabs sharing storage. Record the
snapshot's commits/dataset/art identity first. Default launch preserves normal
security and Guest connections. A **fresh live challenge with unsigned local
names requires separate action-time authorization** of the existing temporary
loopback/in-memory exception. This ticket does not activate it; no accounts,
passwords or remote login are required/requested by the installer. Until a session
is separately authorized, exercise native editor and recorded replay as Guests.

The previously authorized native alpha/beta challenge completed47 UI decisions,
SpriteBeta won turn22, and both views agreed. Its one-off exception was removed.
[Permanent recording/provenance](../provenance/tmt07-live-recording.json) and
[CI evidence](CI.md) distinguish that live capture from subsequent playback.

For an authorized live session, follow the existing native controls:

1. Choose distinct local names, select alpha and beta premades in the native editor.
   Confirm level50/IV31/EV0 and Pidgeot Bird/Bird/Bird; no starting Mega/Tera.
2. Find the other local player, Challenge, select hidden TMT2 Seed and the premade;
   recipient selects the other premade and Accept. Confirm the same private room.
3. Cancel one challenge and retry. Import a level100/EV252 team and confirm clear
   rejection; restore a valid premade. Reload/rejoin using existing room behavior.
4. Use native team preview, move/switch/mega controls to finish a complete battle.
   Compare winner, turn and faints in both views. Do not record credentials/private
   requests. Automated evidence is not human playtesting.
5. Download local TMT2 replay JSON. Import into both compatible native clients,
   play/advance to end, switch perspective and reload; outcome/dataset remain.
   Incompatible dataset must be rejected. No public replay host/upload needed.
6. Stop the session. Confirm listeners/lock gone and persistent guest security false.
   A temporary session exception must be removed, not reused for another test.

No new live match is claimed for TMT-12. CI reproduces four seeded adaptation
battles and imports the authentic completed live capture in two sandboxed Guest
profiles, checks editor legality/types/reload and cleanup from lockfile installs.

## Feedback and limits

`npm run beta:feedback` prints a compact identity/template from the saved snapshot.
Fill browser/OS, exact controls/steps, expected/actual result and whether it occurs
on reload. Attach only reviewed screenshots or spectator replay JSON; redact
names when appropriate. Never attach config files, auth/private protocol, tokens,
ROMs, BPS or game-asset archives. No report is sent automatically, no tester is
invited and no GitHub issue is created.

Current boundary: nine base species plus Mega Pidgeot, fifteen moves, alpha/beta/
gamma locked3v3, private unranked singles, level50/IV31/EV0, explicit Gen9 fallback.
Trainer/badge/type/item labels/cards remain provisional; the near-side trainer
card is mirrored by the inherited scene transform; audio absent. No complete
catalog, new mechanics, exact ROM fidelity, ladder or deployment. Two DNS tests
and upstream slow tests remain separated; optional upstream test skips retain
real status. Current local Chromium sandbox limitations use hosted sandboxed
macOS CI, never no-sandbox/security-permission changes.

Rollback: stop dev, preserve source/cache changes, explicitly select a previously
reviewed compatible triple and rebuild. Compare saved identities before replacing
a snapshot. No auto-reset, cache deletion, stale-lock stealing or history rewrite.
Public beta/distribution remains a separate unresolved rights gate and deployment
requires separate authorization.
