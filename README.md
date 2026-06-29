# code-review-skill (CR-Track)

Install the **CR-Track** code-review skill for [Claude Code](https://claude.com/claude-code) into any repo with a single command.

CR-Track runs a CodeRabbit-style, severity-ranked review of your **staged** git
changes, presents an approvable checklist, applies only the fixes you approve,
writes a redacted JSON report, and (optionally) sends it to a CR-Track analytics
dashboard.

## Install

> Devs need read access to this repo (if it's private, just be signed in to git/GitHub).

Into the current repo (`./.claude/skills/cr-track`):

```bash
npx github:Hashi-ktk/code-review-skill
```

Globally for every repo (`~/.claude/skills/cr-track`):

```bash
npx github:Hashi-ktk/code-review-skill --global
```

Overwrite an existing install:

```bash
npx github:Hashi-ktk/code-review-skill --force
```

Pin to a tag/branch with `#`, e.g. `npx github:Hashi-ktk/code-review-skill#v0.1.0`.

## Use

1. Stage changes: `git add ...`
2. In Claude Code, say: **"review my staged changes"**
3. Approve findings by id (`f1 f3`), `all`, `none`, or `dismiss <id> <reason>`.

Applied fixes are written to your files; a report lands in
`.cr-track/last-review.json`.

## Permissions (set up automatically)

So a review doesn't stop to ask you again and again, the installer
pre-authorizes the skill's **read-only and automatic** commands in your Claude
Code settings:

```
Bash(git rev-parse:*)   Bash(git config:*)   Bash(git diff:*)
Bash(hostname)          Bash(date:*)         Bash(echo:*)
Bash(curl:*)            Write(.cr-track/**)
```

That covers the git lookups (preflight + diff collection) and the dashboard
upload, so those never prompt mid-review.

**Applying fixes is deliberately NOT pre-authorized.** The skill always shows you
the findings and waits for your approval before editing any source file — only the
fixes you pick get written.

Where the rules are written:

- Default (project install): `./.claude/settings.local.json` — personal and
  auto-gitignored, so a broad `curl` grant never gets committed to the shared repo.
- `--global`: `~/.claude/settings.json`.
- `--shared-permissions`: `./.claude/settings.json` (committed, team-wide) instead
  of the personal `*.local` file.
- `--no-permissions`: skip this entirely and copy only the skill files.

Existing settings are merged, never overwritten — other keys are preserved, rules
are de-duplicated, and an unparseable settings file is left untouched (the
installer prints the rules to add by hand instead).

### Scope overrides

- `--type all` — review everything vs `HEAD` (staged + unstaged)
- `--type committed` — review commits on this branch vs the base branch

## Config (optional)

```bash
cp .claude/skills/cr-track/cr-track.yaml.example .cr-track.yaml
```

Edit `.cr-track.yaml` at your repo root:

```yaml
profile: balanced                              # chill | balanced | assertive
endpoint: https://your-dashboard/api/ingest    # CR-Track dashboard ingest URL
categories_enabled: [security, correctness, performance, maintainability, testing, style, docs]
min_severity_to_report: info
guidelines_files: [CLAUDE.md, CONTRIBUTING.md]
learnings_file: .cr-track/learnings.md
```

- When `endpoint` is set, the skill **uploads the redacted report to the dashboard
  automatically when it runs** (no prompt, no approval step). It attaches
  `CR_TRACK_INGEST_TOKEN` as a bearer token if that env var is set; otherwise it
  posts without one. The report is always written locally to
  `.cr-track/last-review.json` as well.
- Only metadata and one-line change summaries are sent — never full file contents,
  raw diffs, or secrets (secrets are redacted before anything leaves your machine).

## CLI options

```
npx github:Hashi-ktk/code-review-skill [options]

  -g, --global            Install into ~/.claude/skills/cr-track (every repo)
                          and write permissions to ~/.claude/settings.json
  -f, --force             Overwrite an existing install
      --shared-permissions  Write permissions to .claude/settings.json (committed)
                          instead of .claude/settings.local.json
      --no-permissions    Copy only the skill files; don't touch any settings
  -h, --help              Show help
```

## What gets installed

```
.claude/skills/cr-track/
  SKILL.md                 # the review workflow
  references/              # ruleset, config, checklist format, payload schema, redaction
  cr-track.yaml.example    # sample config
```

## Updating

Edit the skill files, bump `version` in `package.json`, commit, and tag:

```bash
git tag v0.1.1 && git push --tags
```

Devs pick up a release with `npx github:Hashi-ktk/code-review-skill#v0.1.1`
(`npx` caches git installs, so pinning a tag gives controlled rollouts).

## License

MIT
