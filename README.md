# MorphLens

Camera-first persona synthesis. Capture or upload a photo, describe the character you want, pick a framing mode, and render a new portrait.

## How it works

- **Capture**: camera or file upload, cropped to the selected framing ratio.
- **Prompt builder** (`src/api/promptBuilder.js`): keeps your creative direction first, then adds an identity directive when a photo is attached. Shot and lens language match the framing (85mm for headshots/half body, wide angle for full body), with an illustration finish for anime/painting styles. Negative prompts are sent on both paths.
- **Synthesis** (`src/api/generateApi.js`):
  - **With a Pollinations key**: calls `gen.pollinations.ai`, uploads the captured photo as multipart to `/v1/images/edits`, and uses `FLUX.1 Kontext Pro` (with `FLUX.2 Klein 4B` fallback). The render is conditioned on the real face, body posture, and scene reference.
  - **Free tier (without key)**: uploads the reference image to secure temporary storage and routes to `FLUX` image conditioning on the public endpoint with full identity and stance preservation prompts. When cooling down, rate limits are surfaced transparently.

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
3. Paste it and press **Save**. The key is checked against `GET /account/key` before it is stored.

The key is stored in this browser's `localStorage` only. It is never committed, bundled, or sent anywhere except the Pollinations API. Remove it with **Remove key**.

Without a key the app cannot use your photo. The result screen labels the output `TEXT ONLY`, shows a warning, and links back to key setup. Download the before/after comparison only if you want the prompt-only render.

## Framing modes

| Mode | Canvas | Shot language |
| --- | --- | --- |
| Headshot | 1024×1024 (1:1) | head-and-shoulders, face centered |
| Half Body | 896×1120 (4:5) | medium shot, waist-up |
| Full Body | 720×1280 (9:16) | full body, head to toe, wide angle |
| Auto | 864×1152 (3:4) | three-quarter, head to mid-thigh |

## Limitations

- Identity retention is best-effort model conditioning, not biometric face swapping. A strong stylization prompt can still pull the face away from the reference.
- `FLUX.1 Kontext Pro` follows the aspect ratio of the uploaded crop and ignores explicit pixel dimensions; `FLUX.2 Klein 4B` honors the requested canvas.
- Output resolution is capped by the provider; downloads are not 4K.
- Anonymous renders share a 45-second free-tier limit and can be refused entirely.
- The preservation controls allow fine-grained locking of face fidelity, physical body proportions, and background environment.
- The result screen shows the model used, whether the photo reference was sent, and the exact prompt used.

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
