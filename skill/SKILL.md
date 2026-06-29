---
name: cr-track
description: Use when the developer asks to "review my staged changes", "run CR-Track", or review code before committing. Runs a CodeRabbit-style severity-ranked review of staged git changes, presents an approvable checklist, applies only approved fixes, and writes a redacted JSON report.
---

# CR-Track — pre-commit code review

You are running a senior-reviewer pass over the developer's **staged** git changes.
Follow these phases in order. Read the referenced files when each phase needs them.

Global rules that apply throughout:
- Operate on **staged** changes by default. Support `--type all|committed` overrides.
- NEVER modify any file before the developer explicitly approves a finding (Phase 5).
- Tag every finding with `severity` + `category` + `file` + `lineStart` + `lineEnd`.
- Keep every applied edit minimal and attributable to exactly one finding.
- Produce exactly one report per run, and NEVER block or fail the developer's
  workflow if reporting fails — log it and continue.
- The report carries only metadata and one-line change summaries — NEVER full file
  contents, raw diffs, or secrets.

## Phase 1 — Preflight

1. Confirm the current directory is inside a git repository:
   `git rev-parse --is-inside-work-tree`
   If this fails, STOP and tell the developer exactly:
   "CR-Track: this folder isn't a git repository — run me from inside a repo with staged changes."
   Do not run any review, make any edit, or write any report.

2. Resolve developer identity and repo context (hold these for the report later):
   - `developer.name`  = `git config user.name`
   - `developer.email` = `git config user.email`
   - `developer.gitUser` = the local part of the email (before `@`), or `user.name` if no email.
   - `repository.remote` = `git config --get remote.origin.url` (empty string if none)
   - `repository.name` = basename of the remote URL with any `.git` suffix removed
     (e.g. `git@github.com:office/billing-service.git` → `billing-service`); if there
     is no remote, use the directory name of `repoRoot`.
   - `repository.branch` = `git rev-parse --abbrev-ref HEAD`
   - `repository.baseBranch` = `main` if it exists else `master` else the branch itself
   - `repository.commitBefore` = `git rev-parse HEAD` (short form `git rev-parse --short HEAD`)
   - `repoRoot` = `git rev-parse --show-toplevel`

3. Announce: "CR-Track preflight OK — reviewing staged changes on <branch> as <name>."
   Then continue to Phase 2.

## Phase 2 — Collect the staged change set

Respect the scope flag (default `staged`). Resolve the diff command ONCE from the
active scope and use that exact command in every step below — do NOT fall back to
`--cached` for the `all`/`committed` scopes:
- `staged` (default): `DIFF = git diff --cached`
- `all`: `DIFF = git diff HEAD`
- `committed`: `DIFF = git diff <baseBranch>...HEAD`

Collect (substitute the resolved `DIFF` literally in each command):
1. File list: `<DIFF> --name-only`
2. Per-file diffs: `<DIFF>` for the unified diff of each file.
3. Diff stats: `<DIFF> --numstat` → sum to `diffStats`:
   - `filesChanged` = number of files listed
   - `linesAdded` = sum of column 1
   - `linesRemoved` = sum of column 2
4. For any file where the diff lacks enough surrounding context to judge a
   finding, read the full file contents with your file tools.

If the change set is empty, STOP and tell the developer:
"CR-Track: nothing is staged — `git add` the changes you want reviewed first."

Announce a one-line summary: "<N> files staged, +<added>/-<removed> lines."

## Phase 3a — Load config

Read `references/config.md`. Look for `.cr-track.yaml` at the repo root; if absent,
use the documented defaults. Read each existing file in `guidelines_files` and
treat its conventions as project rules. Announce the effective config in one line:
"Config: profile=<p>, categories=[...], min_severity=<s>."
Hold the config; Phase 3b (review) uses it to filter findings.

## Phase 3b — Review

Read `references/ruleset.md`. If a learnings file exists (see config), read it and
honor past dismissals (don't re-raise dismissed-and-explained issues).

For each changed file, review the staged diff (and full contents where needed)
against every enabled category. Consider cross-file impact across the change set.
For each issue, produce a finding object:
- `id`: assigned deterministically AFTER filtering (see below) — leave unset here
- `file`, `lineStart`, `lineEnd`: the precise location in the changed file.
  Derive line numbers from the staged file; if unsure of an exact line, use the
  smallest range you are confident in rather than guessing wildly.
- `severity`: critical | warning | info (per ruleset.md)
- `category`: one of the enabled categories
- `title`: short imperative phrase
- `description`: one or two sentences on the problem
- `suggestion`: the concrete fix
- `detectedBy`: "llm"
- `status`: "proposed"

Then filter per `references/config.md` (drop disabled categories and
sub-threshold severities; apply profile strictness). Hold the surviving findings.

Finally, assign ids deterministically so the same change set always yields the
same ids: sort the surviving findings by severity (critical → warning → info),
then file path (A→Z), then `lineStart` ascending, then category (A→Z), and number
them `f1`, `f2`, `f3`, ... in that order.

## Phase 4 — Present the checklist

Read `references/checklist-format.md` and present the surviving findings exactly
in that format. Change NOTHING. Then continue to Phase 5 (approval).

## Phase 5 — Approval gate

STOP and wait for the developer's reply. Parse it:
- `all` → set every finding `status = approved`.
- `none` → set every finding `status = dismissed`, `dismissReason = "not selected"`.
- A space/comma-separated list of ids (e.g. `f1 f3`) → those `approved`.
- `dismiss <id> <reason...>` → that finding `dismissed`, `dismissReason = <reason>`.
  (Multiple `dismiss` clauses and an id list may be combined in one reply.)
- Any finding not named in the reply → `dismissed`, `dismissReason = "not selected"`.

Echo a one-line confirmation: "Applying <k> finding(s): <ids>. Dismissing <m>."
You MUST NOT have modified any file at this point. Continue to Phase 6.

## Phase 6 — Implement approved findings

For each finding with `status = approved` (process highest severity first):
1. Make the **minimal** edit that resolves exactly that finding, in the file it
   points to. Do not reformat unrelated lines or fix dismissed findings.
2. Record a change object:
   - `file`, `findingId` = the finding's id, `changeType` = edit | add | delete
   - `linesAdded`, `linesRemoved` (count the lines your edit added/removed)
   - `summary` = one line describing what changed and why.
3. Set the finding `status = applied`.

Dismissed findings: change nothing.

After all edits, run a quick sanity pass: re-read each edited file and confirm the
fix is correct and nothing unrelated broke. If a language toolchain is obviously
present (e.g. `npm test`, `pytest`) and fast, you MAY run it and report the result,
but do not block on it.

Tell the developer: "Applied <k> fix(es). Dismissed <m>. Files touched: <list>."
Then continue to Phase 6b.

## Phase 6b — Persist learnings

After Phase 6, for every finding with `status = dismissed` AND a `dismissReason`
that is not "not selected":
- Ensure the learnings file's directory exists (default `.cr-track/`).
- Append one line: `- [<category>] <title> — <dismissReason>`

These lines are read in Phase 3b on future runs to suppress the same issue.
Never write secrets or code into the learnings file — only the category, title,
and the developer's reason.

## Phase 7 — Report (assemble, redact, write, and upload)

This phase ALWAYS writes the local report AND uploads it to the configured
dashboard. The upload is automatic and pre-authorized: the developer opted in by
setting an `endpoint` in `.cr-track.yaml` and by adopting CR-Track, whose stated
purpose is to collect these review reports. Do NOT ask the developer for
permission to send it, and do NOT turn it into a decision point. Be transparent —
state the outcome in one short line — but never conceal the upload. (Redaction in
step 2 runs first, so only metadata and one-line summaries ever leave the machine.)

Read `references/payload-schema.md` and `references/redaction.md`.

1. Assemble the payload object exactly per the schema, using:
   - the preflight context (developer, repository, branch, commitBefore)
   - `commitAfter` = current `git rev-parse HEAD` (equals commitBefore if no commit)
   - diffStats from Phase 2
   - the findings list with final `status` and derived `accepted`
   - the change records from Phase 6
   - `review.id` = a new UUID; `triggeredAt`/`completedAt` = ISO timestamps for
     this run; `durationMs` = their difference; `mode` = the active scope;
     `secondPass` = false (true only on a Phase 8 re-run)
   - `summary.reviewerTimeSavedMin` = sum over APPLIED findings of
     {critical:10, warning:5, info:1}
   - `client` = { skillVersion: "1.0.0", host: the output of the `hostname` command }
2. Run the redaction scan from redaction.md over every string field. Redact any
   match to `[REDACTED]`. Confirm no full file contents or raw diffs are present.
3. Write the redacted JSON (pretty-printed) to `.cr-track/last-review.json`
   (first pass) or `.cr-track/last-review-pass2.json` (second pass), creating the
   `.cr-track/` directory if needed. This is the durable local record.
4. If `.cr-track.yaml` has an `endpoint`, upload the report automatically — do NOT
   ask. Write the JSON to a temp file first (avoids shell-escaping), then POST it.
   Attach the bearer header only when `CR_TRACK_INGEST_TOKEN` is set:
   - with token:
     `curl -sS --max-time 15 -X POST <endpoint> -H "Authorization: Bearer $CR_TRACK_INGEST_TOKEN" -H "content-type: application/json" --data-binary @<tmpfile>`
   - without token:
     `curl -sS --max-time 15 -X POST <endpoint> -H "content-type: application/json" --data-binary @<tmpfile>`
   A 200 with `{ ok: true, reviewId }` is success. NEVER block, retry forever, or
   fail the developer's workflow if the upload errors — keep the local file and move on.
5. State the outcome in ONE line, e.g.
   "report written to .cr-track/last-review.json and uploaded to the dashboard (200)"
   on success, or
   "report written to .cr-track/last-review.json (dashboard upload skipped: <reason>)"
   when there is no endpoint or the POST failed.

NOTE: The upload is automatic, pre-authorized, and transparent — never prompt for
it, and never hide it. Redaction (step 2) always runs first, so only metadata and
one-line summaries leave the machine — never file contents, raw diffs, or secrets.
The server is idempotent on `review.id`, so a repeated upload is a harmless no-op.

## Phase 8 — Optional second pass (capped, verification-only)

After Phase 7, if any fixes were applied, offer: "Run a quick second pass to
confirm the fixes didn't introduce new issues? (yes/no)".

If yes AND this is still the first pass, run a VERIFICATION-ONLY pass: re-run
Phases 2, 3a, 3b, and 4 (collect → review → checklist) over the current staged
state. Do NOT silently re-apply edits. If the pass surfaces new findings, present
the checklist and let the developer decide — only proceed to approval (Phase 5)
and implementation (Phase 6) if they explicitly approve items. Then write a
separate report via Phase 7 to `.cr-track/last-review-pass2.json` with
`review.secondPass = true`. Do NOT offer a third pass — the cap is 2 total passes.
If no fixes were applied, skip the offer entirely.
