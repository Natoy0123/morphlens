/**
 * Image synthesis client.
 *
 * Two paths:
 * - With a Pollinations API key: gen.pollinations.ai, which accepts the
 *   captured photo for real identity/pose conditioning.
 * - Without a key: the anonymous classic endpoint, which is text-to-image
 *   only, rate limited, and may refuse anonymous traffic entirely.
 *
 * Every failure rejects with a typed SynthesisError. Rate-limit cards, HTML
 * error pages and stock fallbacks are never returned as if they were renders.
 */

import { buildPrompt, PromptValidationError } from './promptBuilder.js';

const GEN_BASE = 'https://gen.pollinations.ai';
const CLASSIC_BASE = 'https://image.pollinations.ai/prompt';

const EDIT_MODELS = [
  'black-forest-labs/flux.2-klein-4b',
  'black-forest-labs/flux.1-kontext-pro',
];

const GEN_TIMEOUT_MS = 150_000;
const CLASSIC_TIMEOUT_MS = 90_000;
const MAX_REFERENCE_EDGE = 1280;

let classicCooldownUntil = 0;

export class SynthesisError extends Error {
  constructor(message, { code = 'SYNTHESIS_FAILED', status = 0, retryAfter = 0, detail = '', cause } = {}) {
    super(message);
    this.name = 'SynthesisError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
    this.detail = detail;
    if (cause) this.cause = cause;
  }
}

export { PromptValidationError };

export function classicCooldownRemaining() {
  return Math.max(0, Math.ceil((classicCooldownUntil - Date.now()) / 1000));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new SynthesisError(
        'The image provider took too long to respond. Try again in a moment.',
        { code: 'TIMEOUT', cause: error }
      );
    }
    throw new SynthesisError(
      'Could not reach the image provider. Check your connection and try again.',
      { code: 'NETWORK_ERROR', cause: error }
    );
  } finally {
    clearTimeout(timer);
  }
}

function readRetryAfter(response) {
  const header = response.headers.get('retry-after');
  const seconds = Number.parseInt(header || '', 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

async function providerError(response, { mode = 'key', detail: providedDetail = '' } = {}) {
  let detail = providedDetail;
  if (!detail) {
    let raw = '';
    try {
      raw = await response.text();
    } catch {
      // Ignore unreadable bodies.
    }
    try {
      const payload = JSON.parse(raw);
      detail =
        payload?.error?.message ||
        payload?.error?.code ||
        (typeof payload?.error === 'string' ? payload.error : '') ||
        payload?.message ||
        '';
    } catch {
      detail = raw.slice(0, 240);
    }
  }

  const status = response.status;
  const retryAfter =
    status === 429 || ((status === 402 || status === 403) && mode === 'classic')
      ? readRetryAfter(response) || 45
      : readRetryAfter(response);

  if (mode === 'classic' && retryAfter > 0) {
    classicCooldownUntil = Date.now() + retryAfter * 1000;
  }

  let code = 'PROVIDER_ERROR';
  let message = `Image synthesis failed${detail ? `: ${detail}` : ` (HTTP ${status}).`}`;

  if (status === 401) {
    code = 'INVALID_KEY';
    message = 'Pollinations rejected this API key. Open Model Access and reconnect it.';
  } else if (status === 402) {
    code = 'PAYMENT_REQUIRED';
    if (mode === 'classic') {
      message =
        'The free tier is cooling down (1 image every 45 seconds). Add a Pollinations key under Model Access for reliable renders.';
    } else if (/quest/i.test(detail)) {
      message =
        'Quest pollen is restricted for this model. Use a key with regular pollen or top up the account.';
    } else {
      message =
        'This Pollinations key has no pollen left for image generation. Top up or use another key.';
    }
  } else if (status === 403) {
    code = 'ACCESS_DENIED';
    message = /turnstile/i.test(detail)
      ? 'The free endpoint is blocking anonymous requests. Add a Pollinations key under Model Access.'
      : 'Pollinations denied this request. Check the key permissions and model access.';
  } else if (status === 429) {
    code = 'RATE_LIMITED';
    message = 'Too many requests. Wait a moment, then retry.';
  } else if (status === 400) {
    code = /content|polic|safety/i.test(detail) ? 'CONTENT_BLOCKED' : 'BAD_REQUEST';
    message = /content|polic|safety/i.test(detail)
      ? 'The provider blocked this prompt. Rephrase the description and try again.'
      : `The provider rejected the request${detail ? `: ${detail}` : '.'}`;
  } else if (status >= 500) {
    code = 'PROVIDER_DOWN';
    message = 'The image provider failed. Try again in a moment.';
  }

  return new SynthesisError(message, { code, status, retryAfter, detail });
}

function isModelError(error) {
  return (
    error instanceof SynthesisError &&
    ['BAD_REQUEST', 'PROVIDER_ERROR', 'ACCESS_DENIED'].includes(error.code) &&
    [400, 403, 404, 422].includes(error.status) &&
    /model|unsupported|not found|not available|not allowed/i.test(error.detail || error.message)
  );
}

async function blobUrlFromResponse(response) {
  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
  if (!contentType.startsWith('image/')) {
    throw new SynthesisError(
      'The provider returned a non-image response instead of a render. No output was produced.',
      { code: 'NON_IMAGE_RESPONSE', status: response.status }
    );
  }

  const blob = await response.blob();
  if (blob.size < 512) {
    throw new SynthesisError('The provider returned an empty image. Try again.', {
      code: 'EMPTY_IMAGE',
      status: response.status,
    });
  }
  return URL.createObjectURL(blob);
}

function base64ToBlob(base64, mediaType = 'image/png') {
  const clean = base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mediaType || 'image/png' });
}

const CLASSIC_MAX_AREA = 768 * 768;

/**
 * The anonymous endpoint caps output area. Scale the requested canvas down
 * instead of letting it silently downscale or reject the request.
 */
function classicDimensions(width, height) {
  const area = width * height;
  if (area <= CLASSIC_MAX_AREA) return { width, height };
  const scale = Math.sqrt(CLASSIC_MAX_AREA / area);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new SynthesisError('The captured photo could not be read. Retake or upload another photo.', {
          code: 'INVALID_IMAGE',
        })
      );
    img.src = src;
  });
}

/**
 * Keep the reference payload small enough for the edits endpoint and strip
 * EXIF/location metadata by re-encoding through a canvas when needed.
 */
async function prepareReferenceImage(source) {
  if (!source) return null;

  const img = await loadImageElement(source);
  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;
  if (!sourceWidth || !sourceHeight) {
    throw new SynthesisError('The captured photo could not be read. Retake or upload another photo.', {
      code: 'INVALID_IMAGE',
    });
  }

  // Always re-encode: this caps giant uploads, normalizes the format, and
  // strips EXIF/GPS metadata before the photo leaves the browser.
  const edge = Math.max(sourceWidth, sourceHeight);
  const scale = Math.min(1, MAX_REFERENCE_EDGE / edge);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    throw new SynthesisError('The captured photo could not be prepared. Retake or upload another photo.', {
      code: 'INVALID_IMAGE',
    });
  }
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

async function requestGenImage({ apiKey, model, body }) {
  const response = await fetchWithTimeout(
    `${GEN_BASE}/v1/images/${body.image ? 'edits' : 'generations'}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...body, model }),
    },
    GEN_TIMEOUT_MS
  );

  if (!response.ok) {
    throw await providerError(response, { mode: 'key' });
  }

  const payload = await response.json().catch(() => null);
  const item = payload?.data?.[0];
  if (!item) {
    throw new SynthesisError('The provider returned no image. Try again.', {
      code: 'EMPTY_RESPONSE',
    });
  }

  if (item.b64_json) {
    return URL.createObjectURL(base64ToBlob(item.b64_json, item.media_type));
  }

  if (item.url) {
    const imageUrl = new URL(item.url, GEN_BASE).toString();
    const imageResponse = await fetchWithTimeout(imageUrl, {}, 60_000);
    if (!imageResponse.ok) {
      throw new SynthesisError('The generated image could not be downloaded. Try again.', {
        code: 'DOWNLOAD_FAILED',
        status: imageResponse.status,
      });
    }
    return blobUrlFromResponse(imageResponse);
  }

  throw new SynthesisError('The provider returned no image data. Try again.', {
    code: 'EMPTY_RESPONSE',
  });
}

async function generateWithKey({ apiKey, prompt, negativePrompt, referenceImage, width, height, seed }) {
  const body = {
    prompt,
    n: 1,
    size: `${width}x${height}`,
    seed,
    response_format: 'b64_json',
  };
  if (negativePrompt) body.negative_prompt = negativePrompt;
  if (referenceImage) body.image = referenceImage;

  let lastModelError = null;
  for (const model of EDIT_MODELS) {
    try {
      const url = await requestGenImage({ apiKey, model, body });
      return { url, model };
    } catch (error) {
      if (isModelError(error) && model !== EDIT_MODELS[EDIT_MODELS.length - 1]) {
        lastModelError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastModelError;
}

async function generateClassic({ prompt, negativePrompt, width, height, seed }) {
  const cooldown = classicCooldownRemaining();
  if (cooldown > 0) {
    throw new SynthesisError(
      `Free tier cooling down. Retry in ${cooldown}s, or add a Pollinations key for reliable renders.`,
      { code: 'RATE_LIMITED', retryAfter: cooldown }
    );
  }

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: 'true',
    enhance: 'false',
  });
  if (negativePrompt) params.set('negative_prompt', negativePrompt);

  const url = `${CLASSIC_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
  const response = await fetchWithTimeout(
    url,
    { headers: { Accept: 'image/jpeg,image/png,image/webp' } },
    CLASSIC_TIMEOUT_MS
  );

  if (!response.ok) {
    throw await providerError(response, { mode: 'classic' });
  }

  return blobUrlFromResponse(response);
}

/**
 * @returns {Promise<{url: string, identityUsed: boolean, model: string, promptUsed: string}>}
 */
export async function synthesizePersona({
  prompt,
  framingMode = 'headshot',
  likeness = 0.85,
  capturedImage = null,
  negativePrompt = '',
  apiKey = '',
  styleId = '',
  seed = null,
}) {
  const hasKey = Boolean(String(apiKey || '').trim());

  const built = buildPrompt({
    prompt,
    framingMode,
    styleId,
    negativePrompt,
    likeness,
    useIdentity: hasKey && Boolean(capturedImage),
  });

  const activeSeed = Number.isInteger(seed) ? seed : Math.floor(Math.random() * 2_000_000_000);

  if (hasKey) {
    const referenceImage = built.useIdentity
      ? await prepareReferenceImage(capturedImage)
      : null;
    const result = await generateWithKey({
      apiKey: String(apiKey).trim(),
      prompt: built.prompt,
      negativePrompt: built.negativePrompt,
      referenceImage,
      width: built.width,
      height: built.height,
      seed: activeSeed,
    });
    return {
      url: result.url,
      identityUsed: Boolean(referenceImage),
      model: result.model,
      promptUsed: built.prompt,
    };
  }

  const classicSize = classicDimensions(built.width, built.height);
  const url = await generateClassic({
    prompt: built.prompt,
    negativePrompt: built.negativePrompt,
    width: classicSize.width,
    height: classicSize.height,
    seed: activeSeed,
  });

  return {
    url,
    identityUsed: false,
    model: 'pollinations-classic',
    promptUsed: built.prompt,
  };
}
