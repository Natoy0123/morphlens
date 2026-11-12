---
name: react-principles
description: Deterministic React 19 architecture constraints, Server Component boundaries, hook rules, state colocation, performance, accessibility, and TypeScript standards.
department: frontend
ownerAgent: legolas
triggerCommand: /react-principles
antiPatternsPrevented:
  - AP-1
  - AP-4
  - AP-6
  - AP-12
  - AP-26
  - AP-28
---

# React Principles

## 0. Identity

- **Role:** Interface Builder. Owns component boundaries with hook discipline and colocation rules.
- **Role source:** Appendix A of `skills/_template/skill-name/SKILL.md` (Interface Builder).
- **Seniority bar:** Staff (Appendix B). Records why server-first beats effect fetching (no waterfalls, rejected mount fetches), why colocation beats global stores (ownership follows use, rejected provider pyramids), and why compiler memoization beats manual memo sprawl.
- **Authority:** Tier-5 normative skill for `skills/frontend/react-principles/`. Owns component and hook guidance.
- **Must not define:** Backend APIs; native mobile builds.
- **Normative base:** `core/fellowship/legolas.md`, `rules/engineering/architecture-boundaries.md`, `rules/common/code-style-standards.md`, `references/anti-patterns.md`.
- **Anti-pattern gate:** Blocks AP-4 (over-permissive client), AP-12 (effect misuse), and AP-26 (leaking internals).

## 1. Intent (9 Dimensions)

| #   | Dimension        | Value                                                                                          |
| --- | ---------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Task             | Produce React components with strict boundaries, correct hooks, and accessible markup.         |
| 2   | Target Tool      | Any agent runtime: Claude Code, Cursor, Copilot, Windsurf, Kiro, Cline, raw API.                |
| 3   | Output Format    | Component plan with boundaries, hooks, state, and a11y notes.                                  |
| 4   | Constraints      | Hooks rules enforced. No any types. Zero em dashes. Stable keys always.                        |
| 5   | Input            | Component specs, state inventory, data needs, a11y targets.                                     |
| 6   | Context          | Prevents bundle bloat, waterfall fetches, and inaccessible markup.                              |
| 7   | Audience         | Frontend engineers shipping React 19 interfaces.                                                |
| 8   | Success Criteria | Boundaries strict; hooks correct; plan approved before coding.                                  |
| 9   | Examples         | See Section 10.                                                                                 |

## 2. Trigger Matrix

| Trigger                                      | Fire? | Notes                              |
| -------------------------------------------- | ----- | ---------------------------------- |
| "Build this component in React"              | YES   | Core trigger.                      |
| "Fix re-renders and hook bugs"               | YES   | Core trigger.                      |
| "/react-principles"                          | YES   | Slash command trigger.             |
| "Build a Vue component instead"              | NO    | Route to `vue-principles`.         |
| "Design our backend API"                     | NO    | Out of scope for this skill.       |

## 3. Execution Workflow

### Step 1: Bound Components and Data Flow

- **Action:** Default to Server Components where available, restrict client directives to interactive leaves, forbid derived state in effects, and enforce serializable cross-boundary props.
- **Input:** Component specs from user.
- **Stop Condition:** Halt on root client directives or function props across boundaries.
- **Validation:** Boundary map reviewed per component.

### Step 2: Colocate State and Fetch Correctly

- **Action:** Keep state near consumers, fetch via server or query libraries (never mount effects), drive forms with action hooks, and scope contexts tightly around consumers.
- **Input:** State inventory and data needs.
- **Stop Condition:** Halt on effect fetching or global state for local needs.
- **Validation:** State map reviewed with fetch strategy.

### Step 3: Harden Hooks, Performance, and a11y

- **Action:** Enforce hook rules with complete deps, type everything without any, stabilize list keys with virtualization past 100 rows, sanitize HTML injection, and prefer native semantics with keyboard support.
- **Input:** Component inventory from Steps 1 and 2.
- **Stop Condition:** Halt on rule violations or unsanitized HTML.
- **Validation:** Hook, perf, and a11y audit complete.

### Step 4: Handoff and Human Review

- **Action:** Present the plan and request approval before coding.
- **Input:** Completed plan.
- **Stop Condition:** Await user approval.
- **Validation:** Approval recorded; zero code written by this skill.

## 4. Output Specification

```markdown
# React Plan

- **Components:** [Boundary map]
- **State:** [Colocation with fetch strategy]
- **Quality:** [Hooks, perf, a11y notes]
```

## 5. Validation Gate

- [ ] Boundaries strict per component.
- [ ] Hooks correct with deps complete.
- [ ] No any types in props or state.
- [ ] Zero em dashes in deliverable.
- [ ] Human approval recorded before coding.

## 6. Anti-Triggers and Calibration

- **Under-execution threshold:** Building components without boundary maps.
- **Over-execution threshold:** Building backends unprompted.
- **Calibration default:** Server first; client leaves only.

## 7. Anti-Pattern Compliance

| Step | Prevents AP            | Mechanism                                           |
| ---- | ---------------------- | --------------------------------------------------- |
| 1    | AP-4 (over-permissive) | Restricts client boundaries.                        |
| 2    | AP-12 (effect misuse)  | Bans effect fetching.                               |
| 3    | AP-26 (no scope)       | Types everything without any.                       |
| 4    | AP-45 (no human review)| Halts for approval before coding.                   |

## 8. Versioning & Changelog

- **Version:** 2.0.0
- **Changelog:**
  - `2.0.0` (2026-09-26) - Tier-5 conversion with Interface Builder role, role source, and seniority bar.
  - `1.0.0` - Legacy React baseline.

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

**Input:** "Our React list janks and effects refetch endlessly."
**Output:** Plan with server-first boundaries, colocated state, virtualized stable keys, and hook corrections.
