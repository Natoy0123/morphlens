/**
 * Pure prompt construction for personacraft.
 *
 * The framing mode must change the *shot language*, not only the pixel
 * dimensions, otherwise a 9:16 canvas still renders a waist-up portrait.
 */

export const MAX_PROMPT_LENGTH = 1200;

export const FRAMING_PROFILES = {
  headshot: {
    key: 'headshot',
    width: 1024,
    height: 1024,
    shot: 'head-and-shoulders portrait, face centered, eye level',
    shotPattern: /\bheadshot\b|head[- ]and[- ]shoulders|shoulders?[- ]up/i,
  },
  half_body: {
    key: 'half_body',
    width: 896,
    height: 1120,
    shot: 'medium shot, waist-up, head to waist fully in frame',
    shotPattern: /waist[- ]up|medium shot|half[- ]body/i,
  },
  full_body: {
    key: 'full_body',
    width: 720,
    height: 1280,
    shot: 'full body shot, head to toe, entire figure in frame, wide angle',
    shotPattern: /full[- ]body|head[- ]to[- ]toe|full[- ]length/i,
  },
  auto: {
    key: 'auto',
    width: 864,
    height: 1152, // 3:4, matching the Auto chip in the UI
    shot: 'three-quarter body portrait, head to mid-thigh in frame',
    shotPattern: /three[- ]quarter|mid[- ]thigh/i,
  },
};

const PHOTO_FINISH =
  'photorealistic photography, 85mm lens, shallow depth of field, natural skin texture, sharp focus, highly detailed';
const ART_FINISH =
  'highly detailed, crisp linework, cinematic composition, sharp focus';

const ART_STYLE_PATTERN =
  /anime|manga|illustration|painting|painterly|cel[- ]?shad|comic|cartoon|watercolou?r/i;

const ART_PRESETS = new Set(['anime-action', 'fantasy-armor']);

export class PromptValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PromptValidationError';
    this.code = 'INVALID_PROMPT';
  }
}

export function isArtStyle(prompt = '', styleId = '') {
  return ART_PRESETS.has(styleId) || ART_STYLE_PATTERN.test(prompt);
}

function collapseWhitespace(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

function cleanNegativePrompt(value) {
  return truncate(
    String(value ?? '')
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)
      .join(', '),
    300
  );
}

function identityDirective(likeness) {
  const value = Number.isFinite(likeness) ? likeness : 0.85;
  if (value >= 0.8) {
    return "Keep the exact same face, facial features, hairstyle, skin tone, body build, and pose from the reference photo.";
  }
  if (value >= 0.55) {
    return 'Keep the same face and general body proportions from the reference photo while restyling the outfit and environment.';
  }
  return 'Use the reference photo only for pose and framing, and reimagine the face and styling.';
}

/**
 * Build the final text prompt plus the size the provider should render.
 *
 * @param {object} input
 * @param {string} input.prompt raw user direction
 * @param {'headshot'|'half_body'|'full_body'|'auto'} [input.framingMode]
 * @param {string} [input.styleId] preset id, used to avoid photo finish on art styles
 * @param {string} [input.negativePrompt]
 * @param {number} [input.likeness] 0..1 identity retention weight
 * @param {boolean} [input.useIdentity] true only when the provider receives the photo
 */
export function buildPrompt({
  prompt,
  framingMode = 'headshot',
  styleId = '',
  negativePrompt = '',
  likeness = 0.85,
  useIdentity = false,
}) {
  const base = truncate(collapseWhitespace(prompt), MAX_PROMPT_LENGTH);
  if (!base) {
    throw new PromptValidationError(
      'Describe the persona you want before synthesizing.'
    );
  }

  const profile = FRAMING_PROFILES[framingMode] || FRAMING_PROFILES.headshot;
  const trimmedBase = base.replace(/[,\s.;:]+$/, '');
  const subject = useIdentity
    ? `Transform the person in the reference photo. ${identityDirective(likeness)} ${trimmedBase}`
    : trimmedBase;

  const segments = [subject];
  if (!profile.shotPattern.test(trimmedBase)) {
    segments.push(profile.shot);
  }
  segments.push(isArtStyle(trimmedBase, styleId) ? ART_FINISH : PHOTO_FINISH);

  return {
    prompt: segments.join(', '),
    negativePrompt: cleanNegativePrompt(negativePrompt),
    framingMode: profile.key,
    width: profile.width,
    height: profile.height,
    useIdentity,
  };
}
