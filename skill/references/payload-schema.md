# CR-Track report payload (schemaVersion 1.0)

Top-level keys: `schemaVersion`, `source`, `ruleset`, `review`, `developer`,
`repository`, `project`, `diffStats`, `findings`, `summary`, `changes`, `client`.

All the metadata fields added in v0.4.0 (`repository.host/owner/repo/defaultBranch/
isDirty`, `review.commit`, `project`, `diffStats.files`, `client.os/nodeVersion/ci`)
are **OPTIONAL** and best-effort — omit any the skill couldn't resolve.

- `schemaVersion`: "1.0"  | `source`: "claude-code-skill"  | `ruleset`: "coderabbit-style@1.0"
- `review`: { id (uuid), triggeredAt (ISO8601), completedAt (ISO8601),
  status ("completed"), mode ("staged"|"all"|"committed"), durationMs (int),
  secondPass (bool),
  commit?: { sha, shortSha, message, authorName, authorEmail, authoredAt (ISO8601),
             aheadOfBase (int), behindBase (int) } }
- `developer`: { name, email, gitUser }
- `repository`: { name, remote, branch, baseBranch, commitBefore, commitAfter,
  host?, owner?, repo?, defaultBranch?, isDirty? (bool) }
- `project`?: { name, version, primaryLanguage }
- `diffStats`: { filesChanged, linesAdded, linesRemoved,
  files?: array of { path, language, linesAdded, linesRemoved,
                     changeType ("added"|"modified"|"deleted"|"renamed") } }
- `findings`: array of {
    id, file, lineStart, lineEnd, severity, category, title, description,
    suggestion, status, accepted (bool), dismissReason (string|null),
    detectedBy ("llm"|"coderabbit-cli") }
- `summary`: { findingsTotal, bySeverity {critical,warning,info},
    byCategory {...}, accepted, applied, dismissed, reviewerTimeSavedMin }
- `changes`: array of { file, findingId, changeType, linesAdded, linesRemoved, summary }
- `client`: { skillVersion: "1.0.0", host, os?, nodeVersion?, ci? (bool) }

Derivations:
- `accepted` = (status ∈ {approved, applied})
- `summary.accepted` = count of findings with accepted = true
- `summary.applied` = count with status = applied
- `summary.dismissed` = count with status = dismissed
- `reviewerTimeSavedMin` = sum over APPLIED findings of {critical:10, warning:5, info:1}
- `commitAfter` = current HEAD after edits (same as commitBefore if no commit was made)

## Worked example

```json
{
  "schemaVersion": "1.0",
  "source": "claude-code-skill",
  "ruleset": "coderabbit-style@1.0",
  "review": {
    "id": "0f8e1c2a-...-uuid",
    "triggeredAt": "2026-06-24T09:00:00Z",
    "completedAt": "2026-06-24T09:02:11Z",
    "status": "completed",
    "mode": "staged",
    "durationMs": 131000,
    "secondPass": false,
    "commit": {
      "sha": "a1b2c3d4e5f6...", "shortSha": "a1b2c3d",
      "message": "Add invoice pagination", "authorName": "Asha Khan",
      "authorEmail": "asha@office.com", "authoredAt": "2026-06-24T08:55:00Z",
      "aheadOfBase": 3, "behindBase": 0
    }
  },
  "developer": { "name": "Asha Khan", "email": "asha@office.com", "gitUser": "asha" },
  "repository": {
    "name": "billing-service",
    "remote": "git@github.com:office/billing-service.git",
    "branch": "feature/invoices",
    "baseBranch": "main",
    "commitBefore": "a1b2c3d",
    "commitAfter": "e4f5a6b",
    "host": "github.com", "owner": "office", "repo": "billing-service",
    "defaultBranch": "main", "isDirty": true
  },
  "project": { "name": "billing-service", "version": "2.3.0", "primaryLanguage": "TypeScript" },
  "diffStats": {
    "filesChanged": 4, "linesAdded": 120, "linesRemoved": 30,
    "files": [
      { "path": "src/db.js", "language": "JavaScript", "linesAdded": 3, "linesRemoved": 1, "changeType": "modified" }
    ]
  },
  "findings": [
    {
      "id": "f1",
      "file": "src/db.js",
      "lineStart": 42,
      "lineEnd": 42,
      "severity": "critical",
      "category": "security",
      "title": "SQL injection via string concatenation",
      "description": "User input is concatenated into the query string.",
      "suggestion": "Use a parameterized query / prepared statement.",
      "status": "applied",
      "accepted": true,
      "dismissReason": null,
      "detectedBy": "llm"
    }
  ],
  "summary": {
    "findingsTotal": 7,
    "bySeverity": { "critical": 1, "warning": 3, "info": 3 },
    "byCategory": { "security": 2, "correctness": 2, "performance": 1, "maintainability": 1, "docs": 1 },
    "accepted": 5,
    "applied": 5,
    "dismissed": 2,
    "reviewerTimeSavedMin": 25
  },
  "changes": [
    {
      "file": "src/db.js",
      "findingId": "f1",
      "changeType": "edit",
      "linesAdded": 3,
      "linesRemoved": 1,
      "summary": "Replaced string concatenation with a parameterized query."
    }
  ],
  "client": { "skillVersion": "1.0.0", "host": "asha-mbp", "os": "darwin", "nodeVersion": "v20.11.0", "ci": false }
}
```

> Note: `reviewerTimeSavedMin` above is illustrative (copied from the PRD example).
> Per the formula it equals the per-severity sum over the **applied** findings only
> (critical 10 / warning 5 / info 1) — compute it from your actual applied set
> rather than reproducing this number.
