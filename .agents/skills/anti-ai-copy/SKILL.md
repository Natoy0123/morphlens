---
name: anti-ai-copy
description: Strips generative AI copywriting clichés, marketing fluff, fake metrics, and throat-clearing prose from user interfaces, documentation, tooltips, dialogs, and error messages.
department: product
triggerCommand: /anti-ai-copy
---

# Anti-AI-Copy Standards

## 1. Intent & Scope
LLMs frequently inject recognizable textual filler—inflated buzzwords, faux-profound conclusions, and fake metrics—that degrade user trust. This skill enforces crisp, human, conversational product copy.

---

## 2. Prohibited AI Copywriting Tropes

### A. Buzzword Inflation & Puffery
Banned phrases in UI copy, empty states, and onboarding:
- *"Unlock the power of..."*
- *"Seamlessly integrate / elevate..."*
- *"Revolutionize your workflow..."*
- *"Supercharge your productivity..."*
- *"Delve into / embark on a journey..."*
- *"Pivotal moment / game-changer..."*

### B. Fake Statistics & Artificial Authority
- Never invent placeholder percentages or unverifiable claims (*"99.9% precision"*, *"10x faster"*, *"Industry leading"*).
- State real system capabilities or concrete actions simply.

### C. Binary Contrast Formulas
- Avoid repetitive rhetorical contrasts: *"It's not just a tool. It's a complete paradigm shift."*
- State what the product or feature actually does in direct, declarative sentences.

---

## 3. Product Copy Best Practices

- **Conversational & Empathetic**: Write as a thoughtful software designer speaking to a busy person.
- **Action-Oriented Empty States**: Instead of *"No items found! Start your incredible journey today"*, use *"No items yet. Create your first project to get started."* with a direct action button.
- **Human Error Messages**: Clearly explain what went wrong and how the user can resolve it. Never display raw stack traces, database field keys, or backend pipeline jargon.
- **Natural Title Case / Sentence Case**: Avoid screaming ALL-CAPS micro-labels.
