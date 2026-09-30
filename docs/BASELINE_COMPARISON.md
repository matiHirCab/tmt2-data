# Controlled baseline comparison (2026-09-30)

This follow-up supersedes the initial attribution of the UI symptoms to unspecified
existing labels. The exact cause is **missing generated runtime data plus blocked
remote fallback**, not a proven source-code defect in the labels.

## Isolation and provenance

Exported source archives into a fresh temporary directory, without adding a fourth
workspace repository or changing either fork:

```sh
comparison=$(mktemp -d)
mkdir -p "$comparison/server" "$comparison/client"
git -C ../Pokemon-Too-Many-Types-2 archive 2f5b273925862ac242b419086c1e7a8868b51da1 | tar -x -C "$comparison/server"
git -C ../Pokemon-Too-Many-Types-2-client archive 122b015ff6f3d9f050144153684178ca2c5f4c39 | tar -x -C "$comparison/client"
```

Linked each existing installed `node_modules` into its corresponding temporary
snapshot to hold dependency versions constant, then ran `node build` in each.
Used the same Node 24.19.0 environment. Compared every Git-tracked file's bytes
(or symlink target) against each source repository after the experiments: **zero
differences in either fork**, including after diagnostic asset generation.
Diagnostic asset generation was confined to the temporary snapshots; ordinary
working-repository checks may refresh ignored build outputs.
The archives are not Git worktrees, so client version stamping logs missing Git
metadata; this does not change the source or tested runtime behavior.

## Server DNS failures reproduce without coordination

Ran this exact focused command in both baseline and working server directories:

```sh
node node_modules/mocha/bin/mocha.js --no-config test/main.js test/server/ip-tools.js --reporter spec --timeout 2000 --exit
```

Both returned **16 passing, 2 failing**, with identical failures:

1. `IP tools / should resolve 127.0.0.1 to localhost`, `test/server/ip-tools.js:15`:
   actual `ip6-localhost`, expected `localhost`.
2. `IP tools / should resolve unknown IPs correctly`, lookup of `255.255.255.255`:
   Mocha's **2000 ms timeout** exceeded.

`IPTools.getHost()` in `server/ip-tools.ts` calls `dns.reverse()` and uses the first
returned hostname. Independent direct Node DNS calls returned
`["ip6-localhost", "ip6-loopback"]` for `127.0.0.1`. Three sequential broadcast-IP
reverse lookups returned ENOTFOUND after **8 ms, 8042 ms and 6 ms** respectively.
Neither our launcher nor static server is involved in these standalone tests.
Do not rewrite `/etc/hosts`, DNS settings or upstream assertions to turn them green.

Also ran the unchanged full baseline suite via
`node node_modules/mocha/bin/mocha.js`, which loads `.mocharc.json`: **2366 passing,
74 pending, 1 failing**, the same unknown-IP timeout as the original coordinated
run. The earlier setup claim of 2367 passing has the same active-test total
(2366 + 1); no evidence indicates a missing server suite. DNS variability is
observed, but the earlier setup command/environment cannot be reconstructed from
a saved script here, so its exact reason for passing is not asserted.

Unlike the first diagnostic run recorded in COORDINATION_VALIDATION.md, the
focused command explicitly uses `--no-config`; a bare positional test filename
would still add configured specs and run the full suite.

## Client test counts: same command, different generated assets

Ran `node --test test/*.js` in the unchanged baseline client, varying only ignored
runtime outputs. No clone/pull, remote data download or full index build occurred.

| Temporary baseline inputs | Passed | Skipped | Failed |
| --- | ---: | ---: | ---: |
| Normal build, no data directory | 21 | 3 | 0 |
| Add English and en-afd text | 43 | 3 | 0 |
| Also add Pokédex and moves | 45 | 1 | 0 |

The first case matches the working client's `npm test` test phase. The
BattleTextParser suite conditionally skips when `data/text/en.js` or `en-afd.js`
is absent; it contains **22 tests**. The EV Guesser and EV Optimizer tests require
`BattlePokedex`, accounting for the additional **2**. One battle test is always
explicitly skipped. The full asset case has 46 total tests, 45 passing.

For this diagnostic only, generated text using the baseline client's exported
`buildTextFiles(Dex, ['en', 'en-afd'])`, passing Dex from the baseline server's
`dist/sim/dex`. Serialized that same pinned server's Pokedex and Moves exports into
the two expected browser globals. These are ordinary upstream diagnostic assets,
**not TMT2 data, not a production generator**, and remain outside the workspace.
This reproduces the reported 45 without changing the command or source. It does
not establish exactly which assets/commands the earlier setup draft used; that
draft is not present in this filesystem.

## Browser and hosting comparison

Served the untouched baseline public directory with independent Python hosting:

```sh
python3 -m http.server 8081 --bind 127.0.0.1 --directory play.pokemonshowdown.com
```

Compared its `testclient-new.html` with the working client's page served by
`tools/workspace/static.mjs` on 8080, with the same browser and query string.
Both pages had `TL.term = {}`, `typeof BattleText = "undefined"`, and two labels
starting `undefined:`. Both returned 200 for the compiled JS/CSS/fonts and 404 for
missing `data/text/en.js`, Pokédex/moves/items/abilities, search/index tables,
other generated data, and `js/server/chat-formatter.js`. Optional
`config/testclient-key.js` is also absent; no login credentials were added/exposed.

The page tries remote fallbacks. Independent requests to the remote English text
and favicon returned **`curl: (56) CONNECT tunnel failed, response 403`** from the
proxy. Browser requests for an HTTP remote background returned 403 as well.
The absent remote favicon explains the broken logo; local CSS/fonts loaded.
These failures occur with independent Python hosting, not only our static server.

After adding the diagnostic local text files to the baseline, browser evaluation
returned `TL.term.format = "Format"`, `TL.term.team = "Team"`, and the labels became
**Format / Team**. No UI source edit or fallback to unpinned upstream was needed.
Screenshots of before/after and suite logs are retained as local verification
artifacts, not committed binaries.

## Coordination fixes and safety review

No upstream DNS or UI rewrite was warranted. Fixed our misleading asset reporting:
`doctor` lists missing runtime assets and `dev` warns explicitly. HTTP READY does
not imply complete assets or playable TMT2. No new data generation command added.

Hardened our own filesystem operations within this branch:

- Manifest write/check use the same exclusive lock as build/test/dev, preventing
  snapshots during coordinated mutations. External manual edits remain outside
  that lock and must stop for a consistent snapshot.
- Manifest writes create a unique temporary file exclusively, never follow an
  existing `.tmp` symlink, and atomically replace the destination. `.local` cannot
  be a symlink. Releasing an old lock preserves any replacement lock.
- Static hosting also checks the resolved target, rejecting aliases to hidden
  files or PHP/map source files inside the public directory, as well as escapes.
- Config rejects unknown keys/invalid ports, validates distinct real sibling Git
  roots/package identities; child commands use argument arrays, not interpolated
  shell strings. No reset, pull, clone, permission change, submodule or hosting
  deployment was introduced. The approved normal fork builds remain unchanged.

Final affected checks: **13 coordination tests pass**, data typecheck and Node
syntax checks pass. Real dev lifecycle reaches READY, rejects concurrent build
and manifest operations, exits 143 on SIGTERM, removes its lock and frees both
ports. Final source snapshot is regenerated after the final commit, compared
byte-for-byte on repeat generation, and checked against all three clean commits.
