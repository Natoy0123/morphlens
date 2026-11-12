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

const ART_FINISH =
  'highly detailed, crisp linework, cinematic composition, sharp focus';

/**
 * Lens language has to agree with the framing. Asking for an 85mm portrait
 * lens while also asking for a head-to-toe shot pulls the model back toward a
 * waist-up composition, which is one reason framing used to be ignored.
 */
function photoFinish(framingKey, base) {
  const parts = ['photorealistic photography'];
  if (framingKey === 'full_body') {
    if (!/\bwide[- ]angle\b/i.test(base)) parts.push('wide angle');
    parts.push('full-body editorial framing');
  } else if (!/\b(?:85mm|50mm|35mm|24mm)\b/i.test(base)) {
    parts.push('85mm lens');
  }
  if (framingKey === 'headshot' && !/shallow depth of field/i.test(base)) {
    parts.push('shallow depth of field');
  }
  parts.push('natural skin texture, sharp focus, highly detailed');
  return parts.join(', ');
}

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

function identityDirective(likeness, { preserveBody = true, preservePose = true, preserveEnvironment = false } = {}) {
  const value = Number.isFinite(likeness) ? likeness : 0.85;
  const directives = [];

  if (value >= 0.75) {
    directives.push(
      'Preserve the exact same face, facial features, hairstyle, skin tone, body build, and pose from the reference photo. Do not generate a different person.'
    );
  } else if (value >= 0.5) {
    directives.push(
      "Preserve the same face and general body proportions from the reference photo while restyling the outfit and environment. Do not change the person's identity."
    );
  } else {
    directives.push(
      'Use the reference photo only for pose and framing; reimagine the face and styling.'
    );
  }

  if (preservePose && value >= 0.5) {
    directives.push(
      'Maintain the exact physical body position, head angle, gaze direction, posture, and stance of the person in the reference image. Do not rotate or turn the person to face the camera if they are angled or in profile.'
    );
  }

  if (preserveBody && value >= 0.5) {
    directives.push(
      'Maintain the exact physical body proportions, silhouette, and build from the reference image.'
    );
  }

  if (preserveEnvironment) {
    directives.push(
      'Maintain the exact background environment, room surroundings, wall texture, and authentic scene lighting from the reference image.'
    );
  }

  return directives.join(' ');
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
 * @param {boolean} [input.preserveBody] lock physical body proportions and build
 * @param {boolean} [input.preservePose] lock exact body stance and posture
 * @param {boolean} [input.preserveEnvironment] lock background environment and scene
 */
export function buildPrompt({
  prompt,
  framingMode = 'headshot',
  styleId = '',
  negativePrompt = '',
  likeness = 0.85,
  useIdentity = false,
  preserveBody = true,
  preservePose = true,
  preserveEnvironment = false,
}) {
  const base = truncate(collapseWhitespace(prompt), MAX_PROMPT_LENGTH);
  if (!base) {
    throw new PromptValidationError(
      'Describe the persona you want before synthesizing.'
    );
  }

  const profile = FRAMING_PROFILES[framingMode] || FRAMING_PROFILES.headshot;
  const trimmedBase = base.replace(/[,\s.;:]+$/, '');
  const artStyle = isArtStyle(trimmedBase, styleId);
  const identityWeight = Number.isFinite(likeness) ? likeness : 0.85;

  if (useIdentity) {
    // When editing an existing reference photo (e.g. FLUX.1 Kontext Pro),
    // prioritize the user's exact requested instruction as the primary directive.
    // Avoid appending contradictory camera tags (like 85mm shallow depth of field)
    // that artificially blur backgrounds or produce edge halos around the hair.
    const segments = [trimmedBase];

    segments.push(
      identityDirective(identityWeight, { preserveBody, preservePose, preserveEnvironment })
    );

    // In edit mode with an attached photo, do not force "face centered, eye level"
    // which overrides natural profiles and side-angles.
    if (!profile.shotPattern.test(trimmedBase)) {
      const editShot = profile.shot.replace(/,\s*face centered,\s*eye level/i, '');
      segments.push(editShot);
    }

    if (artStyle) {
      segments.push(ART_FINISH);
    } else if (preserveEnvironment) {
      segments.push('authentic scene lighting, sharp focus, natural textures');
    } else {
      segments.push('natural studio lighting, sharp focus, professional photography');
    }

    return {
      prompt: segments.join('. '),
      negativePrompt: cleanNegativePrompt(negativePrompt),
      framingMode: profile.key,
      width: profile.width,
      height: profile.height,
      useIdentity: true,
    };
  }

  // Pure text-to-image synthesis path (no reference image provided)
  const segments = [trimmedBase];
  if (!profile.shotPattern.test(trimmedBase)) {
    segments.push(profile.shot);
  }
  segments.push(artStyle ? ART_FINISH : photoFinish(profile.key, trimmedBase));

  return {
    prompt: segments.join(', '),
    negativePrompt: cleanNegativePrompt(negativePrompt),
    framingMode: profile.key,
    width: profile.width,
    height: profile.height,
    useIdentity: false,
  };
}
