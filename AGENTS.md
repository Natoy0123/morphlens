# Project Rules (AGENTS.md)

This project strictly follows the Universal Anti-AI-Slop and Software Quality Standards.

## 1. Strictly No Emojis
- Do NOT use emojis in code, UI strings, buttons, category pills, card badges, logs, comments, or documentation.
- Always use vector SVG icons / flaticons (Lucide React) with consistent stroke and scale.

## 2. Anti-AI-Slop Design Standards
- No pulsing status dots (`animate-pulse` dots).
- No nested cards inside cards (`rounded-3xl` > `rounded-2xl` > `rounded-xl` with dark border nesting).
- No artificial neon glows or rainbow gradients (`shadow-[0_0_..._rgba(...)]`).
- No uppercase screaming badges (`FLUX.1 KONTEXT PRO`, `STRICT`, `FLEXIBLE`).
- Natural Title Case / Sentence Case for all buttons and labels.

## 3. Human-Centric UI Copy
- Conversational, clean, professional UX copy suitable for real humans.
- Never expose raw backend variables, database field names, prompt engineering syntax, or internal pipeline jargon.

## 4. Mobile Ergonomics
- Minimum 44px tap targets for mobile.
- Prevent nested scroll-traps (`overflow-y-auto` inside `overflow-y-auto`).
- Keep proper clearance from the fixed mobile bottom navigation bar (`1. Photo`, `2. Style`, `3. Result`).

## 5. Verification & Testing Gates
- Always run `npm run lint` (`oxlint`) and `npm test` before committing.
- Build must pass (`npm run build`).
