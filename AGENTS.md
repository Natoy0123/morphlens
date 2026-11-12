# Universal AI Agent Specification (AGENTS.md)

Universal directives for all AI coding agents operating across this workstation and repositories (Freebuff, OpenCode, Cline, Claude Code, Antigravity, Cursor, Aider).

---

## 1. Anti-AI-Slop & Human-Centric UI/UX
- **Strictly No Emojis**: Never use Unicode emojis in UI strings, buttons, category chips, card badges, status indicators, log messages, code comments, or documentation. Use authentic vector flaticons / SVG icons (e.g. Lucide React, Heroicons, Material Icons) with consistent line-weight, scale, and color tokens.
- **Zero AI Aesthetic Tropes**:
  - **No Gradient Soup**: Never use generic purple-to-cyan, violet-to-blue, or rainbow gradients (`bg-gradient-to-r from-purple-500 to-cyan-500`). Avoid gradient text (`bg-clip-text text-transparent`) unless explicitly demanded by established brand guidelines.
  - **No Neon Glow Overkill**: Avoid exaggerated glowing outlines, neon box-shadows (`shadow-[0_0_..._rgba(...)]`), and amber glow wands.
  - **No Glassmorphism Clutter**: Avoid indiscriminate translucent frosted overlays (`backdrop-blur-md bg-white/10 border-white/20`) that ruin contrast and render poorly.
  - **No Pulsing Dots**: Never use tacky animated status dots (`animate-pulse` dots). Use clean, static vector badges or subtle status rings.
  - **No Nested Card Soup**: Never nest dark cards inside cards with cascading borders (`rounded-3xl` > `rounded-2xl` > `rounded-xl`). Keep layouts flat, clean, and content-driven.
  - **No Identical Card Shelves**: Avoid predictable grids of 3 or 6 clone cards featuring an arbitrary icon, bold title, and two lines of filler text. Structure layouts around real data hierarchy.
  - **No Screaming Micro-Labels**: Never use faux-futuristic uppercase badges (`FLUX.1 KONTEXT PRO`, `STRICT`, `TURBO MODE`). Use natural Title Case or Sentence Case.
- **Human-Centric Copywriting**:
  - Eliminate AI boilerplate: *"Unlock the power of..."*, *"Seamlessly integrate..."*, *"Revolutionize your workflow..."*, or fake performance metrics (*"99.9% precision"*).
  - Use plain, conversational, empathetic language for all toasts, dialogs, error banners, and empty states. Never expose backend variables or raw prompt syntax.
- **Mobile Ergonomics & Accessibility**:
  - Minimum 44px by 44px touch targets on interactive mobile controls.
  - Never trap nested scroll containers (`overflow-y-auto` inside `overflow-y-auto`); maintain a single natural viewport scroll.
  - Semantic HTML only: interactive controls must be `<button>` or `<a>`, never `<div onClick={...}>`. Ensure full keyboard navigation, focus rings, and WCAG AA contrast.
  - Mobile safe areas: keep primary controls clear of bottom navigation bars and device chin overlays.

---

## 2. Architecture & Code Hygiene
- **Component Boundary Floor**: Keep UI components modular (target under 250 lines). Never generate monolithic single-file "God components" containing hero, features, modals, and hardcoded inline mock arrays in one file.
- **Layer Isolation**: Respect Clean Architecture: strictly separate Presentation (components), Application/Domain logic (stores, state, services), and Data infrastructure (APIs, storage).
- **State Colocation**: Colocate state with its primary consumers. Avoid bloated global stores for ephemeral view state. Keep module imports unidirectional with zero circular dependencies.
- **Dependency Restraint**: Never introduce external npm/pip packages when a native platform API (e.g., standard Web APIs, CSS primitives, Node/Dart built-ins) or existing project dependency can achieve the result cleanly.
- **Surgical, Atomic Diffs**: Make targeted, minimal edits. Avoid shotgun surgery or sweeping rewrites of untouched working code.

---

## 3. Anti-Hallucination & Evidence Gates
- **Zero Lazy Stubs / Placeholder Comments**: Never leave empty implementations, mock placeholders, or unfulfilled comments (`// TODO: implement later`, `/* logic goes here */`). All delivered code must be fully operational.
- **Physical Evidence Verification**: Never claim a bug is resolved, a feature is completed, or a build succeeds based on unverified assumptions. You must execute actual verification commands (`test`, `lint`, `build`) and inspect concrete terminal output.
- **Epistemic Honesty**: Distinguish explicitly between verified facts and working hypotheses. If a root cause is unverified, inspect code and logs before declaring a fix.

---

## 4. Deterministic Tool Enforcement (Linters & Formatters)
- **Delegate Formatting to Tools**: Never waste context tokens or manual effort debating code formatting. Let deterministic tools enforce style:
  - Run project linters and formatters (`npm run lint`, `oxlint`, `eslint`, `prettier`, `dart analyze`, `cargo clippy`, `ruff`) before reporting completion.
  - Code must pass with 0 errors and 0 warnings.

---

## 5. Security & Safety Boundaries
- **Zero Credential Leaks**: Never hardcode, commit, or log API keys, secret tokens, private credentials, or live certificates.
- **Input Sanitization & Least Privilege**: Validate and sanitize all external user inputs against OWASP guidelines. Always ask for explicit confirmation before executing irreversible or destructive actions (e.g., drop database, delete storage buckets, force push).

---

## 6. Token Efficiency (Caveman Protocol)
- Communicate with maximum signal and minimum token overhead.
- Drop pleasantries, greetings, and redundant tool-calling narration.
- Preserve all exact code blocks, flags, paths, and logic negations.
- Circuit Breaker: Drop terse mode immediately for security warnings, destructive actions, or critical user confirmations.
- Progressive Disclosure: Load granular specialized skills from `~/.agents/skills/` only when the specific task requires them.
