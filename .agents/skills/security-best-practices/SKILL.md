---
name: security-best-practices
description: Application security standards covering OWASP Top 10 defenses, parameterized SQL queries, HttpOnly SameSite cookie hardening, CSP headers, password hashing, and AI agent least-privilege guardrails.
department: security
ownerAgent: boromir
triggerCommand: /security-best-practices
antiPatternsPrevented:
  - AP-1
  - AP-4
  - AP-9
  - AP-18
  - AP-26
  - AP-44
---

# Security Best Practices

## 0. Identity

- **Role:** Security Auditor. Owns defense-in-depth posture with verified control evidence per tier.
- **Role source:** Appendix A of `skills/_template/skill-name/SKILL.md` (Security Auditor).
- **Seniority bar:** Staff (Appendix B). Records why parameterized queries beat string building (injection dies at construction, rejected interpolation), why memory-hard hashing beats fast hashes (cracking economics favor defenders, rejected MD5 legacies), and why AI guardrails gate destructive tool calls.
- **Authority:** Tier-5 normative skill for application security under `skills/security/security-best-practices/`.
- **Must not define:** Direct application UI rendering templates or visual styles.
- **Normative base:** `core/fellowship/boromir.md`, `rules/engineering/architecture-boundaries.md`, `rules/common/code-style-standards.md`, `references/anti-patterns.md`, `rules/security/owasp-defensive-shield.md`, `context/core-domains/security-policies.md`.
- **Anti-pattern gate:** Blocks AP-4 (over-permissive execution), AP-26 (leaking secrets in logs/code), and AP-44 (unlocked security boundaries).

## 1. Intent (9 Dimensions)

| #   | Dimension        | Value                                                                                          |
| --- | ---------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Task             | Audit, implement, and enforce application and API security defenses and guardrails.             |
| 2   | Target Tool      | OWASP ZAP, Trivy, Snyk, Semgrep, Node.js crypto, Argon2id, helmet, DOMPurify.                  |
| 3   | Output Format    | Secure code implementations, Content Security Policy headers, and vulnerability audit reports.  |
| 4   | Constraints      | Zero hardcoded secrets. Mandatory parameterized SQL queries. Strict HttpOnly cookie scoping.    |
| 5   | Input            | Application source code, authentication workflows, API endpoints, dependency manifests.         |
| 6   | Context          | Eliminates SQLi, XSS, CSRF, BOLA/IDOR vulnerabilities, and sensitive data leakage.             |
| 7   | Audience         | Security engineers, backend developers, platform architects, DevOps leads.                      |
| 8   | Success Criteria | Zero high/critical vulnerabilities; 100 percent parameterized database queries; clean security scans. |
| 9   | Examples         | See Section 10.                                                                                   |

## 2. Trigger Matrix

| Trigger Condition                                                      | Fire? | Action / Route                                                      |
| ---------------------------------------------------------------------- | ----- | ------------------------------------------------------------------- |
| Implementing user authentication, session tokens, or password hashing  | YES   | Apply Argon2id hashing and HttpOnly SameSite cookie flags.          |
| Handling external user input, database queries, or HTML rendering      | YES   | Enforce input validation schemas, parameterized SQL, and DOMPurify. |
| Conducting line-by-line security code review against OWASP standards   | NO    | Route to `skills/security/security-auditor/`.                       |
| Running software bill of materials and dependency vulnerability audits | NO    | Route to `skills/security/sbom-software-bill-of-materials/`.        |

## 3. Execution Workflow

### Step 1: Harden Authentication Surfaces

- **Action:** Hash passwords with memory-hard functions, scope session cookies HttpOnly with SameSite flags, and verify session handling per flow.
- **Input:** Authentication workflows from user.
- **Stop Condition:** Halt on plaintext secrets or cookie leaks.
- **Validation:** Auth checklist reviewed per flow.

### Step 2: Close Injection and Access Gaps

- **Action:** Parameterize all database access, validate and encode outputs contextually, scope queries to tenant context against BOLA, and emit strict security headers.
- **Input:** Endpoints and queries from Step 1.
- **Stop Condition:** Halt on string-built queries; require parameters.
- **Validation:** Injection audit clean with header proof.

### Step 3: Gate AI Tool Execution

- **Action:** Apply least-privilege to agent tool scopes with interactive confirmation gates on destructive operations.
- **Input:** Tool inventory from user.
- **Stop Condition:** Halt on ungated destructive tools.
- **Validation:** Guardrail matrix reviewed per tool.

### Step 4: Handoff and Human Review

- **Action:** Present the security report and request approval before enforcement.
- **Input:** Completed report.
- **Stop Condition:** Await user approval.
- **Validation:** Approval recorded; zero enforcement done by this skill.

## 4. Output Specification

```markdown
# Security Report

- **Auth:** [Hardening checklist]
- **Injection:** [Audit evidence]
- **Guardrails:** [Tool matrix]
```

## 5. Validation Gate

- [ ] Auth hardened per flow.
- [ ] Injection closed with proof.
- [ ] AI tools gated per scope.
- [ ] Zero em dashes in deliverable.
- [ ] Human approval recorded before enforcement.

## 6. Anti-Triggers and Calibration

- **Under-execution threshold:** Shipping auth without hardening review.
- **Over-execution threshold:** Redesigning UIs unprompted.
- **Calibration default:** Deny by default; prove per control.

## 7. Anti-Pattern Compliance

| Step | Prevents AP            | Mechanism                                           |
| ---- | ---------------------- | --------------------------------------------------- |
| 1    | AP-4 (over-permissive) | Hardens auth per flow.                              |
| 2    | AP-26 (leaking data)   | Parameterizes every query.                          |
| 3    | AP-44 (unlocked bounds)| Gates AI tools per scope.                           |
| 4    | AP-45 (no human review)| Halts for approval before enforcement.              |

## 8. Versioning & Changelog

- **Version:** 3.0.0
- **Changelog:**
  - `3.0.0` (2026-09-26) - Full Tier-5 template conformance with Security Auditor role, role source, and seniority bar.
  - `2.0.0` - Prior Tier-5 elevation with OWASP defenses.

## 9. Portability Matrix

| Runtime     | Status   | Notes                           |
| ----------- | -------- | ------------------------------- |
| Claude Code | verified | Direct slash command execution. |
| Cursor      | verified | Rules and prompt loading.       |
| Copilot     | verified | Custom instructions support.    |
| Windsurf    | verified | Cascade flow integration.       |
| Kiro        | verified | Steering model execution.       |
| Cline       | verified | Task step-by-step flow.         |
| Raw API     | verified | Model-agnostic execution.       |

## 10. Examples

**Input:** "Our login stores tokens in localStorage with string-built queries."
**Output:** Security report with HttpOnly migration, parameterized rewrites, and gated AI tools.
