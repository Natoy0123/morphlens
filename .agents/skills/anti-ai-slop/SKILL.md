---
name: anti-ai-slop
description: Enforces human-crafted UI/UX quality standards, banning emojis in UI/code, eliminating AI slop design tropes (pulsing dots, nested card clutter, neon glow overkill, uppercase screaming badges, gradient soup, glassmorphism excess), and demanding clean vector icons (flaticons) and authentic ergonomics.
department: frontend
triggerCommand: /anti-ai-slop
---

# Anti-AI-Slop Quality Standards

## 1. Intent & Scope
This skill eliminates artificial intelligence design cliches, lazy template boilerplate, and visual tropes that make applications feel like generic AI-generated prototypes. It enforces professional, human-centered UI/UX standards across modern web, mobile, and desktop projects.

---

## 2. Core Prohibitions

### A. Strictly No Emojis
- **Never use Unicode emojis** in buttons, tags, category pills, card headers, status badges, log messages, code comments, or documentation.
- **Always use authentic vector flaticons / SVGs** (e.g., Lucide React, Heroicons, Material Design Icons) with consistent line-weight, scale, and color tokens.

### B. Eliminate AI-Slop Aesthetics
- **No Gradient Soup**: Avoid generic purple-to-cyan, violet-to-blue, or rainbow gradients (`from-purple-500 to-cyan-500`). Avoid gradient text (`bg-clip-text text-transparent`) unless explicitly demanded by brand guidelines.
- **No Neon Glow Overkill**: Remove `shadow-[0_0_..._rgba(...)]`, amber glow wands, and neon border rings. Use subtle, natural shadows (`shadow-sm`, `shadow-md`) with neutral alpha tokens.
- **No Glassmorphism Excess**: Avoid indiscriminate translucent frosted overlays (`backdrop-blur-md bg-white/10 border-white/20`) that ruin contrast and render poorly. Use solid, high-contrast, opaque backgrounds with crisp borders.
- **No Pulsing Neon Status Dots**: Avoid `bg-emerald-400 animate-pulse` or similar tacky dots. Use clean, static vector badges or subtle status rings.
- **No Nested Card-in-Card Containers**: Avoid 3 to 4 layers of dark borders inside each other (`rounded-3xl` > `rounded-2xl` > `rounded-xl`). Keep card hierarchies flat and clean.
- **No Identical Card Clones**: Avoid predictable grids of 3 or 6 uniform cards featuring an arbitrary icon, bold title, and two lines of filler text. Structure layouts around real data hierarchy.
- **No Screaming Uppercase Badges**: Avoid uppercase badges like `FLUX.1 KONTEXT PRO`, `STRICT`, `FLEXIBLE`, `FAST MODE`. Use natural Title Case or Sentence Case.
- **No Hyper-Rounded Pill Blobs on Layout**: Keep `rounded-full` strictly for small circular icon buttons or badges, never for large content containers or irregular boxes.

### C. Conversational, Non-Technical Copy
- All user-facing text, toasts, dialogs, error banners, and empty states must be plain-language and conversational.
- Eliminate AI marketing fluff: *"Unlock the power of..."*, *"Seamlessly integrate..."*, *"Revolutionize your workflow..."*, or fake stats (*"99.9% precision"*).
- Never expose raw backend variables, database field names, prompt engineering syntax, or internal pipeline jargon.

### D. Clean Mobile Ergonomics & Semantic Accessibility
- **Touch Target Floor**: Minimum 44px by 44px on mobile devices.
- **No Scroll Traps**: Prevent nested scroll containers (`overflow-y-auto` inside `overflow-y-auto`). Maintain a single natural viewport scroll.
- **Semantic HTML**: Interactive controls must be `<button>` or `<a>`, never `<div onClick={...}>`. Ensure full keyboard navigation, focus rings (`focus-visible:ring-2`), and WCAG AA contrast ratios.
- **Safe Areas**: Maintain proper clearance for mobile bottom navigation bars and device chin overlays (`safe-bottom`).

---

## 3. Architecture & Anti-Monolith Guidelines
- Keep UI components modular (target under 250–300 lines). Break pages into discrete components rather than generating a single monolithic file.
- Separate data mocks and constants from component presentation logic.

---

## 4. Pre-Change Verification Gate
- Gather concrete evidence from the codebase before asserting claims or modifying files.
- Always run automated linters and tests to verify changes before completing tasks.
