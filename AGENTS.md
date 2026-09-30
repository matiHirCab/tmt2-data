# Project guidance

Read [docs/ROADMAP.md](docs/ROADMAP.md) first for implementation scope and ticket
status. It is the sole authoritative implementation backlog (TMT-01 through
TMT-12). WORK_ITEMS.md is a superseded pointer; historical proposals are not
parallel instructions. Update the canonical ticket/evidence when work progresses.
Do not create another roadmap/chat/issue or jump ticket prerequisites by inference.
Current user instructions take precedence.

Keep [architecture](docs/ARCHITECTURE.md), [development](docs/DEVELOPMENT.md),
[CI](docs/CI.md), raw-source permission rules and provenance requirements in force.
Keep three separate sibling repositories, no submodules or fourth workspace repo.
Preserve unrelated edits; use a fresh branch from reviewed master after a merge.
Never infer mechanics from BPS bytes/descriptive prose or from the GBA platform.
Request the user's exact BPS in the same task chat when needed; do not download or
apply ROMs. Do not commit ROMs, patches, credentials, or unapproved assets.

Use npm lockfiles, run relevant tests/typechecks and the documented CI commands.
Network-sensitive diagnostics are separate and retain their real exit codes.
Never hide failures, silently pull upstream data, rewrite DNS/security settings,
replace the damage engine, or repurpose temporary addedType as a permanent type.
Keep exact commands/results and limitations in the linked evidence documents.
Only publish branches, open PRs, merge or deploy with the user's applicable
explicit authorization; prior publication of a merged PR is not new authorization.
