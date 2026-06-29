# CR-Track config (.cr-track.yaml)

On Phase 3a, look for `.cr-track.yaml` at the repo root. If absent, use defaults.

## Defaults (when no file or a key is missing)
- `profile`: `balanced`
- `categories_enabled`: `[security, correctness, performance, maintainability, testing, style, docs]`
- `min_severity_to_report`: `info`
- `guidelines_files`: `[CLAUDE.md, CONTRIBUTING.md]` (read those that exist; treat
  their conventions as project rules across all categories — especially
  `style`/conventions, but also any security, testing, or correctness rules they
  state). Also honor `.editorconfig` / `.eslintrc` if present.
- `learnings_file`: `.cr-track/learnings.md`
- `endpoint`: the ingest URL — your CR-Track dashboard host + `/api/ingest`
  (e.g. `http://localhost:3000/api/ingest` or `https://cr-track.yourco.com/api/ingest`)
- The ingest bearer token is read from the `CR_TRACK_INGEST_TOKEN` environment
  variable (never stored in the repo). If `endpoint` is set, Phase 7 ALWAYS attempts
  the POST — it attaches the bearer header only when the token env var is present,
  and omits it otherwise (the dashboard may run open or token-gated). The local
  `.cr-track/last-review.json` is always written too, as the durable record.

## Filtering rules
- Drop any finding whose `category` is not in `categories_enabled`.
- Drop any finding whose `severity` is below `min_severity_to_report`
  (order: info < warning < critical).
- Apply `profile` strictness from ruleset.md on top of the above.
