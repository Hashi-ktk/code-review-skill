# CR-Track checklist format

Present findings grouped by severity, highest first. Each finding is a checkbox
with a stable id, its category, a one-line title, and a `file:line` location;
put the description/suggestion on the following indented line.

```
## CR-Track review — <N> files, <M> findings

### 🔴 Critical (<count>)
- [ ] **f1 · [Security] SQL injection** — src/db.js:42
      Query built via string concatenation. Use a parameterized query.

### 🟠 Warning (<count>)
- [ ] **f2 · [Correctness] Unhandled promise rejection** — src/api.js:88

### 🔵 Info (<count>)
- [ ] **f5 · [Maintainability] Duplicated validation block** — src/forms.js:50

Reply with the ids to apply (e.g. "f1 f3"), "all", "none",
or "dismiss <id> <reason>".
```

Rules:
- If a severity bucket is empty, omit its heading.
- If there are zero findings, say "CR-Track review — <N> files, no findings. Nice."
- Never apply any edit in this phase.
