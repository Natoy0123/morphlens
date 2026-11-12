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
import { compositeFaceLock } from '../services/faceLock.js';

const GEN_BASE = 'https://gen.pollinations.ai';
const CLASSIC_BASE = 'https://image.pollinations.ai/prompt';

// Kontext Pro is the edit-specialized model and preserves identity better;
// Klein 4B is the cheaper fallback that also accepts reference images.
const EDIT_MODELS = [
  'black-forest-labs/flux.1-kontext-pro',
  'black-forest-labs/flux.2-klein-4b',
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

/**
 * Check a key against the provider before storing it. Format checks alone
 * cannot tell a working key from an expired or revoked one.
 */
export async function validateApiKey(apiKey) {
  const key = String(apiKey || '').trim();
  if (!key) {
    throw new SynthesisError('Paste a Pollinations API key first.', { code: 'INVALID_KEY' });
  }

  // `/image/models` is public and returns 200 even for a fake key. The
  // account endpoint is the actual validity check.
  const response = await fetchWithTimeout(
    `${GEN_BASE}/account/key`,
    { headers: { Authorization: `Bearer ${key}` } },
    15_000
  );

  if (response.status === 401 || response.status === 403) {
    throw new SynthesisError(
      'Pollinations rejected this key. Create or copy a fresh key from enter.pollinations.ai.',
      { code: 'INVALID_KEY', status: response.status }
    );
  }
  if (!response.ok) {
    throw await providerError(response, { mode: 'key' });
  }
  return true;
}

/**
 * Check connectivity and readiness of a self-hosted backend.
 */
export async function validateCustomEndpoint(endpointUrl) {
  const url = String(endpointUrl || '').trim().replace(/\/+$/, '');
  if (!url) {
    throw new SynthesisError('Enter your self-hosted backend URL first.', { code: 'INVALID_ENDPOINT' });
  }

  try {
    const response = await fetchWithTimeout(`${url}/health`, {}, 10_000);
    if (!response.ok) {
      const rootResp = await fetchWithTimeout(`${url}/`, {}, 10_000);
      if (!rootResp.ok) {
        throw new SynthesisError(`Endpoint returned HTTP ${response.status}.`, {
          code: 'ENDPOINT_ERROR',
          status: response.status,
        });
      }
      const data = await rootResp.json().catch(() => ({}));
      return { status: 'ok', model: data?.model || 'Self-Hosted Model' };
    }
    const data = await response.json().catch(() => ({}));
    return { status: 'ok', model: data?.model || 'FLUX.1-schnell' };
  } catch (err) {
    if (err instanceof SynthesisError) throw err;
    throw new SynthesisError(
      'Could not reach self-hosted backend. Verify your Cloudflare Tunnel or local server is running.',
      { code: 'ENDPOINT_UNREACHABLE', cause: err }
    );
  }
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
 * Compute diffusion-optimal rendering dimensions that match the native aspect ratio
 * of the source reference image (multiples of 16/32, total area ~1MP).
 */
export function computeAspectDimensions({ sourceWidth, sourceHeight, maxArea = 1024 * 1024 }) {
  if (!sourceWidth || !sourceHeight) {
    return { width: 1024, height: 1024 };
  }

  const ratio = sourceWidth / sourceHeight;
  let targetWidth;
  let targetHeight;

  if (Math.abs(ratio - 1) < 0.05) {
    targetWidth = 1024;
    targetHeight = 1024;
  } else if (ratio < 1) {
    // Portrait (taller than wide, e.g. 480x1080)
    targetHeight = Math.sqrt(maxArea / ratio);
    targetWidth = targetHeight * ratio;
  } else {
    // Landscape (wider than tall)
    targetWidth = Math.sqrt(maxArea * ratio);
    targetHeight = targetWidth / ratio;
  }

  // Snap to multiples of 16, bounded within stable diffusion boundaries
  const snappedWidth = Math.max(512, Math.min(1440, Math.round(targetWidth / 16) * 16));
  const snappedHeight = Math.max(512, Math.min(1440, Math.round(targetHeight / 16) * 16));

  return { width: snappedWidth, height: snappedHeight };
}

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
  if (Math.min(sourceWidth, sourceHeight) < 64) {
    throw new SynthesisError('That photo is too small to use as an identity reference. Use a larger image.', {
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
  // JPEG has no alpha channel; fill first so transparent uploads do not turn
  // into a black square behind the subject.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.9);
  });
  if (!blob) {
    throw new SynthesisError('The captured photo could not be prepared. Retake or upload another photo.', {
      code: 'INVALID_IMAGE',
    });
  }
  return { blob, width: sourceWidth, height: sourceHeight };
}

async function requestGenImage({ apiKey, model, body, referenceBlob }) {
  const endpoint = referenceBlob ? 'edits' : 'generations';
  const options = {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  };

  if (referenceBlob) {
    // The documented edits path is multipart. It avoids shipping a huge base64
    // JSON body and gives the provider a real image file to decode.
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', body.prompt);
    form.append('n', String(body.n));
    form.append('size', body.size);
    form.append('seed', String(body.seed));
    form.append('response_format', body.response_format);
    if (body.negative_prompt) form.append('negative_prompt', body.negative_prompt);
    form.append('image', referenceBlob, 'reference.jpg');
    options.body = form;
  } else {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify({ ...body, model });
  }

  const response = await fetchWithTimeout(
    `${GEN_BASE}/v1/images/${endpoint}`,
    options,
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

async function generateWithKey({ apiKey, prompt, negativePrompt, referenceBlob, width, height, seed }) {
  const body = {
    prompt,
    n: 1,
    size: `${width}x${height}`,
    seed,
    response_format: 'b64_json',
  };
  if (negativePrompt) body.negative_prompt = negativePrompt;

  let lastModelError = null;
  for (const model of EDIT_MODELS) {
    const isLastModel = model === EDIT_MODELS[EDIT_MODELS.length - 1];
    try {
      const url = await requestGenImage({ apiKey, model, body, referenceBlob });
      return { url, model };
    } catch (error) {
      // A cheaper model may still work when the preferred one is unavailable
      // or out of pollen. Content/safety rejections are never retried.
      const canFallback = isModelError(error) || error?.code === 'PAYMENT_REQUIRED';
      if (canFallback && !isLastModel) {
        lastModelError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastModelError;
}

/**
 * Upload reference image blob to temporary storage so the classic endpoint
 * can consume the image reference URL.
 */
export async function uploadReferenceToPublicHost(blob) {
  if (!blob) return null;
  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('time', '1h');
    form.append('fileToUpload', blob, 'ref.jpg');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: form,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith('http')) return url;
    }
  } catch (err) {
    console.warn('Reference image upload fallback:', err);
  }
  return null;
}

async function generateClassic({ prompt, negativePrompt, width, height, seed, referenceBlob }) {
  const cooldown = classicCooldownRemaining();
  if (cooldown > 0) {
    throw new SynthesisError(
      `Free tier cooling down. Retry in ${cooldown}s, or add a Pollinations key for instant renders.`,
      { code: 'RATE_LIMITED', retryAfter: cooldown }
    );
  }

  let referenceUrl = null;
  if (referenceBlob) {
    referenceUrl = await uploadReferenceToPublicHost(referenceBlob);
  }

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: 'true',
    enhance: 'false',
  });
  if (referenceUrl) {
    params.set('image', referenceUrl);
    params.set('model', 'flux');
  }
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

  const outputUrl = await blobUrlFromResponse(response);
  return { url: outputUrl, identityUsed: Boolean(referenceUrl) };
}

async function generateSelfHosted({
  endpointUrl,
  prompt,
  negativePrompt,
  width,
  height,
  seed,
  referenceDataUrl,
  likeness,
}) {
  const cleanUrl = String(endpointUrl || '').trim().replace(/\/+$/, '');
  const payload = {
    prompt,
    negative_prompt: negativePrompt || '',
    image: referenceDataUrl || null,
    likeness: likeness ?? 0.85,
    width,
    height,
    seed,
    steps: 4,
  };

  let response;
  try {
    response = await fetchWithTimeout(
      `${cleanUrl}/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json,image/jpeg,image/png',
        },
        body: JSON.stringify(payload),
      },
      180_000
    );
  } catch (err) {
    if (err instanceof SynthesisError && err.code === 'TIMEOUT') throw err;
    throw new SynthesisError(
      'Could not reach self-hosted GPU backend. Ensure your Colab notebook is running.',
      { code: 'NETWORK_ERROR', cause: err }
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new SynthesisError(
      `Self-hosted backend error (${response.status}): ${errorText || 'Generation failed.'}`,
      { code: 'SELF_HOSTED_FAILED', status: response.status }
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!data?.image) {
      throw new SynthesisError('Self-hosted server response did not contain an image.', {
        code: 'INVALID_RESPONSE',
      });
    }
    return {
      url: data.image,
      identityUsed: Boolean(referenceDataUrl),
      model: data.model || 'FLUX.1-schnell (Self-Hosted)',
    };
  }

  const blobUrl = await blobUrlFromResponse(response);
  return {
    url: blobUrl,
    identityUsed: Boolean(referenceDataUrl),
    model: 'FLUX.1-schnell (Self-Hosted)',
  };
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
  preserveBody = true,
  preservePose = true,
  preserveEnvironment = false,
  engineMode = 'pollinations',
  customEndpoint = '',
}) {
  const hasKey = Boolean(String(apiKey || '').trim());
  const hasImage = Boolean(capturedImage);

  const built = buildPrompt({
    prompt,
    framingMode,
    styleId,
    negativePrompt,
    likeness,
    useIdentity: hasImage,
    preserveBody,
    preservePose,
    preserveEnvironment,
  });

  const activeSeed = Number.isInteger(seed) ? seed : Math.floor(Math.random() * 2_000_000_000);
  const referenceData = hasImage ? await prepareReferenceImage(capturedImage) : null;
  const referenceBlob = referenceData?.blob || null;

  let renderWidth = built.width;
  let renderHeight = built.height;

  // If a reference image is attached, preserve its authentic aspect ratio rather than forcing a square
  if (referenceData?.width && referenceData?.height) {
    const matched = computeAspectDimensions({
      sourceWidth: referenceData.width,
      sourceHeight: referenceData.height,
    });
    renderWidth = matched.width;
    renderHeight = matched.height;
  }

  // 1. Self-Hosted Mode via Cloudflare Tunnel or local server
  if (engineMode === 'self-hosted' && customEndpoint) {
    const result = await generateSelfHosted({
      endpointUrl: customEndpoint,
      prompt: built.prompt,
      negativePrompt: built.negativePrompt,
      width: renderWidth,
      height: renderHeight,
      seed: activeSeed,
      referenceDataUrl: capturedImage,
      likeness,
    });

    return {
      url: result.url,
      identityUsed: result.identityUsed,
      model: result.model,
      promptUsed: built.prompt,
    };
  }

  // 2. Pollinations with API Key
  if (hasKey) {
    const result = await generateWithKey({
      apiKey: String(apiKey).trim(),
      prompt: built.prompt,
      negativePrompt: built.negativePrompt,
      referenceBlob,
      width: renderWidth,
      height: renderHeight,
      seed: activeSeed,
    });

    // FLUX.1 Kontext Pro natively refactors attire, background, and lighting while
    // preserving authentic facial identity. We do not apply canvas post-compositing
    // here to avoid collar seams and hair smudges.
    return {
      url: result.url,
      identityUsed: Boolean(referenceBlob),
      model: result.model,
      promptUsed: built.prompt,
    };
  }

  const classicSize = classicDimensions(renderWidth, renderHeight);
  const result = await generateClassic({
    prompt: built.prompt,
    negativePrompt: built.negativePrompt,
    width: classicSize.width,
    height: classicSize.height,
    seed: activeSeed,
    referenceBlob,
  });

  let finalUrl = result.url;
  if (hasImage && likeness >= 0.4) {
    finalUrl = await compositeFaceLock({
      originalImageUrl: capturedImage,
      generatedImageUrl: result.url,
      framingMode,
      likeness,
    });
  }

  return {
    url: finalUrl,
    identityUsed: true,
    model: result.identityUsed ? 'flux-image-conditioned' : 'face-locked-studio',
    promptUsed: built.prompt,
  };
}
