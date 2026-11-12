---
name: anti-ai-slop
description: Enforces human-crafted UI/UX quality standards, banning emojis in UI/code, eliminating AI slop design tropes (pulsing dots, nested card clutter, neon glow overkill, uppercase screaming badges), and demanding clean vector icons (flaticons) and authentic ergonomics.
department: frontend
triggerCommand: /anti-ai-slop
---

# Anti-AI-Slop Quality Standards

## 1. Intent & Scope
This skill eliminates artificial intelligence design cliches, lazy filler, and visual tropes that make applications feel like generic AI-generated templates. It enforces professional, human-centered UI standards across web and mobile projects.

## 2. Core Prohibitions

### A. Strictly No Emojis
- **Never use Unicode emojis** in buttons, tags, category pills, card headers, status badges, log messages, code comments, or documentation.
- **Always use authentic vector flaticons / SVGs** (e.g., Lucide, Heroicons, Material Design Icons) with consistent line-weight, scale, and color tokens.

### B. Eliminate AI-Slop Aesthetics
- **No pulsing neon status dots**: Avoid `bg-emerald-400 animate-pulse` or similar tacky dots. Use clean, static vector badges or subtle status rings.
- **No nested card-in-card containers**: Avoid 3 to 4 layers of dark borders inside each other (`rounded-3xl` > `rounded-2xl` > `rounded-xl`). Keep card hierarchies flat and clean.
- **No neon glow overkill**: Remove `shadow-[0_0_..._rgba(...)]`, amber glow wands, and rainbow border effects unless specifically requested by brand design guidelines.
- **No uppercase screaming micro-labels**: Avoid uppercase badges like `FLUX.1 KONTEXT PRO`, `STRICT`, `FLEXIBLE`, `FAST MODE`. Use natural Title Case or Sentence Case.
- **No fake marketing badges**: Avoid artificial metrics or placeholder indicators that provide zero user utility.

### C. Conversational, Non-Technical Copy
- All user-facing text, toasts, dialogs, error banners, and empty states must be plain-language and conversational.
- Never expose raw backend variables, database field names, prompt engineering syntax, or internal pipeline jargon.

### D. Clean Mobile Ergonomics
- Minimum touch target size: 44px by 44px on mobile devices.
- Prevent nested scroll-trap containers (`overflow-y-auto` inside `overflow-y-auto`).
- Maintain proper clearance for mobile bottom navigation bars and device safe areas (`safe-bottom`).

## 3. Pre-Change Verification Gate
- Gather concrete evidence from the codebase before asserting claims or modifying files.
- Always run lint checks and automated tests to verify changes before completing tasks.
