# MorphLens

Camera-first persona synthesis. Capture or upload a photo, describe the character you want, pick a framing mode, and render a new portrait.

## How it works

- **Capture**: camera or file upload, cropped to the selected framing ratio.
- **Prompt builder** (`src/api/promptBuilder.js`): appends shot language that matches the framing (headshot, waist-up, full body, three-quarter), uses a photographic finish for photo styles and an illustration finish for anime/painting styles, and forwards the negative prompt.
- **Synthesis** (`src/api/generateApi.js`):
  - **With a Pollinations key**: calls `gen.pollinations.ai` and sends the captured photo to `/v1/images/edits`, so the render is conditioned on the real face and pose.
  - **Without a key**: falls back to the anonymous classic endpoint. This path is text-to-image only, limited to one uncached image every 45 seconds, and may be blocked by the provider's anti-bot check.

Failures are surfaced as errors. The app never swaps in a stock image and never treats a rate-limit card as a render.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # prompt-builder unit tests
npm run lint
npm run build
```

## Enable identity matching

1. Open the app and expand **Prompt-Only Mode → Connect Key**.
2. Create a key at <https://enter.pollinations.ai>.
3. Paste it and press **Save**.

The key is stored in this browser's `localStorage` only. It is never committed, bundled, or sent anywhere except the Pollinations API. Remove it with **Remove key**.

Without a key the app still renders, but the captured photo is only used for the before/after comparison — the output is prompt-only.

## Framing modes

| Mode | Canvas | Shot language |
| --- | --- | --- |
| Headshot | 1024×1024 (1:1) | head-and-shoulders, face centered |
| Half Body | 896×1120 (4:5) | medium shot, waist-up |
| Full Body | 720×1280 (9:16) | full body, head to toe, wide angle |
| Auto | 864×1152 (3:4) | three-quarter, head to mid-thigh |

## Limitations

- Identity retention is best-effort model conditioning, not biometric face swapping.
- Output resolution is capped by the provider; downloads are not 4K.
- Anonymous renders share a 45-second free-tier limit and can be refused entirely.
- The identity slider only has an effect when a key is connected.

## Project structure

```
src/
  api/
    apiKey.js            browser-only key storage
    generateApi.js       provider client + error handling
    promptBuilder.js     pure prompt/size construction
    promptBuilder.test.js
  components/
    capture/             camera, upload, viewfinder
    controls/            framing selector
    prompts/             prompt panel, presets, identity controls
    viewer/              before/after result slider
  store/presets.js       framing modes and style presets
```

## Deployment

The app is a static Vite build. `npm run build` writes `dist/`; deploy that folder to any static host. If the host is Git-connected, pushing `main` triggers a rebuild automatically.
