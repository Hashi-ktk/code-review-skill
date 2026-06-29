# CR-Track rule set — coderabbit-style@1.0

Tag every finding with one **severity** and one **category**.

## Severity
- **critical** — security vulnerabilities, data loss, crashes, correctness bugs
  that will manifest in production.
- **warning** — likely bugs, risky patterns, missing error handling, performance
  hazards.
- **info** — style, naming, minor maintainability, documentation nits.

## Categories (and what each looks for)
- **security** — injection (SQL/command/template), secrets in code, weak crypto,
  missing authz/authn checks, unsafe deserialization, SSRF/path traversal.
- **correctness** — null/undefined dereferences, off-by-one, unhandled
  error/rejection paths, race conditions / unsynchronized shared state,
  incorrect conditionals, type mismatches, missing imports.
- **performance** — memory leaks / unclosed resources (streams, handles,
  connections), N+1 queries, unnecessary work in hot paths, unbounded
  loops/allocations.
- **maintainability** — high complexity, duplication, dead code, unclear naming,
  large functions, leaky abstractions, magic numbers.
- **testing** — missing/insufficient tests for changed logic, untested error
  paths, missing edge-case coverage.
- **style** — lint/format violations, project-convention deviations.
- **docs** — missing or stale docstrings/comments for public APIs.

## Profile strictness
- **chill** — report only `critical` and clear `warning`s; suppress most `info`.
- **balanced** (default) — report all, but only high-confidence `info`.
- **assertive** — report everything, including speculative `info`.

## Cross-file impact
For each changed file, consider the other files in the change set: a changed
function signature, exported symbol, or shared-state access may create findings
in a sibling file. Note cross-file findings against the file where the fix belongs.
