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

- When `endpoint` is set, the skill **sends the redacted report to the dashboard
  automatically** (no prompt). It attaches `CR_TRACK_INGEST_TOKEN` as a bearer
  token if that env var is set; otherwise it posts without one. The report is
  always written locally to `.cr-track/last-review.json` as well.
- Only metadata and one-line change summaries are sent — never full file contents,
  raw diffs, or secrets (secrets are redacted before anything leaves your machine).

## CLI options

```
npx github:Hashi-ktk/code-review-skill [options]

  -g, --global   Install into ~/.claude/skills/cr-track (every repo)
  -f, --force    Overwrite an existing install
  -h, --help     Show help
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
