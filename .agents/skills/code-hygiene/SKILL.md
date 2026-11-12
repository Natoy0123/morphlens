---
name: code-hygiene
description: Enforces production-grade software engineering discipline for AI agents: zero lazy stubs/TODOs, surgical minimal diffs, dependency frugality, anti-hallucination physical verification, and deterministic linter delegation.
department: engineering
triggerCommand: /code-hygiene
---

# Code Hygiene & Engineering Discipline

## 1. Intent & Scope
AI coding agents frequently introduce code rot by leaving incomplete stubs, installing redundant dependencies, writing over-engineered abstractions, and making assumptions without verification. This skill provides explicit guardrails to maintain pristine codebase health.

---

## 2. Core Engineering Directives

### A. Zero Lazy Stubs & Placeholders
- **Never produce incomplete code**: Never output `// TODO: implement later`, `/* insert logic here */`, or empty function bodies in production paths.
- If a method is declared, its full implementation, error handling, and parameter validation must be delivered.
- If a feature is intentionally out of scope, do not leave dangling half-implemented stubs; explicitly state the boundary in communication.

### B. Dependency Frugality & Restraint
- **Never install new dependencies** (via `npm install`, `pip install`, `pub add`, `cargo add`) without verifying that:
  1. No native platform/runtime API already provides the capability (e.g. `URL`, `crypto.randomUUID()`, `fetch`, native regex, built-in date APIs).
  2. No existing dependency already in `package.json` / `pubspec.yaml` satisfies the requirement.
- Prohibit single-utility packages (e.g., `is-number`, `left-pad`, `dayjs` for simple formatting).

### C. Surgical, Minimal Diffs
- **Minimize Blast Radius**: Modify only the code necessary to satisfy the requirement.
- Do NOT rewrite entire files or reformat unrelated functions when making a targeted bugfix.
- Preserve existing coding conventions, variable naming styles, and architectural patterns of the host project.

### D. Anti-Hallucination Evidence Gate
- **Never declare success without physical execution**:
  - Run the relevant test suite (`npm test`, `pytest`, `cargo test`, `flutter test`).
  - Run the linter (`npm run lint`, `oxlint`, `eslint`, `dart analyze`).
  - Verify the build compiles cleanly (`npm run build`, `tsc --noEmit`).
- If an automated check fails, inspect the actual terminal error output and resolve the root cause before declaring the task complete.

### E. Deterministic Tool Delegation
- Do not spend tokens arguing over code formatting (quotes, semicolons, trailing commas).
- Always defer style enforcement to automated project tooling (`prettier`, `oxlint`, `biome`, `ruff`).
