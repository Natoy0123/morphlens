export const FRAMING_MODES = {
  HEADSHOT: {
    id: 'headshot',
    label: 'Headshot',
    sublabel: 'Face & Shoulders',
    aspectRatio: '1:1',
    description: 'Face, expression, and shoulder framing',
    guideType: 'oval',
  },
  HALF_BODY: {
    id: 'half_body',
    label: 'Half Body',
    sublabel: 'Torso & Waist-up',
    aspectRatio: '4:5',
    description: 'Waist-up framing with arm and torso posture',
    guideType: 'torso',
  },
  FULL_BODY: {
    id: 'full_body',
    label: 'Full Body',
    sublabel: 'Head-to-Toe',
    aspectRatio: '9:16',
    description: 'Full figure framing with complete stance and footwear',
    guideType: 'full',
  },
  AUTO: {
    id: 'auto',
    label: 'Three-Quarter',
    sublabel: 'Head to Mid-Thigh',
    aspectRatio: '3:4',
    description: 'Classic three-quarter editorial framing',
    guideType: 'dynamic',
  },
};

export const PRESET_CATEGORIES = ['All', 'Corporate', 'Editorial', 'Lifestyle', 'Thematic'];

export const STYLE_PRESETS = [
  // --- Corporate & Professional ---
  {
    id: 'boardroom-navy',
    name: 'Boardroom Navy Suit',
    category: 'Corporate',
    framingCompatibility: ['headshot', 'half_body', 'full_body'],
    prompt:
      'Change clothing to a dark navy blue tailored bespoke suit with a crisp white collared dress shirt. Clean white studio background, professional executive portrait lighting, sharp focus',
    negativePrompt: 'casual clothes, wrinkled fabric, messy collar, harsh glare, oversaturated',
    preserveEnvironment: false,
  },
  {
    id: 'executive',
    name: 'Charcoal Executive',
    category: 'Corporate',
    framingCompatibility: ['headshot', 'half_body', 'full_body'],
    prompt:
      'Wearing a modern bespoke charcoal blazer, crisp tailored collar, clean studio lighting, elegant professional executive portrait, sharp focus',
    negativePrompt: 'casual clothes, messy collar, harsh glare, oversaturated',
    preserveEnvironment: false,
  },
  {
    id: 'tech-founder',
    name: 'Tech Founder Casual',
    category: 'Corporate',
    framingCompatibility: ['headshot', 'half_body'],
    prompt:
      'Wearing a refined minimalist black merino turtleneck under a structured unlined slate blazer, soft natural window lighting, clean modern office architecture background',
    negativePrompt: 'sloppy clothes, bright garish colors, harsh flash, distorted fabric',
    preserveEnvironment: false,
  },
  {
    id: 'medical-scrubs',
    name: 'Healthcare Clinician',
    category: 'Corporate',
    framingCompatibility: ['headshot', 'half_body'],
    prompt:
      'Wearing a clean pressed white medical consultation coat over deep navy scrubs, subtle stethoscope drape, bright sterile clinical studio lighting, professional medical portrait',
    negativePrompt: 'dirty lab coat, messy hospital chaos, dark shadows, blurry',
    preserveEnvironment: false,
  },

  // --- Editorial & Studio ---
  {
    id: 'natural-enhance',
    name: 'Natural Studio',
    category: 'Editorial',
    framingCompatibility: ['headshot', 'half_body', 'full_body', 'auto'],
    prompt:
      'Professional portrait studio lighting, crisp natural skin texture, balanced ambient light, high-end commercial editorial quality, sharp focus',
    negativePrompt: 'harsh shadows, heavy makeup, oversaturated, plastic skin, distorted face',
    preserveEnvironment: true,
  },
  {
    id: 'retro-90s',
    name: '35mm Analog Portra',
    category: 'Editorial',
    framingCompatibility: ['headshot', 'half_body', 'full_body'],
    prompt:
      'Authentic 35mm film photograph, subtle Kodak Portra warm tone, fine analog grain, natural ambient lighting, classic candid editorial portrait',
    negativePrompt: 'digital noise, 3d render, plastic look, blown highlights',
    preserveEnvironment: true,
  },
  {
    id: 'film-noir',
    name: 'Noir Monochrome',
    category: 'Editorial',
    framingCompatibility: ['headshot', 'half_body', 'full_body'],
    prompt:
      'Dramatic black and white chiaroscuro studio portrait, rich contrast, sculpted rim lighting, deep shadows, classic medium format photography',
    negativePrompt: 'flat lighting, muddy gray, color bleeding, blurry',
    preserveEnvironment: false,
  },
  {
    id: 'vogue-studio',
    name: 'Vogue Minimalist',
    category: 'Editorial',
    framingCompatibility: ['headshot', 'half_body', 'auto'],
    prompt:
      'Wearing tailored high-fashion neutral cashmere attire, seamless warm ivory cyclorama studio backdrop, soft diffuse beauty dish lighting, high-end commercial magazine editorial',
    negativePrompt: 'cluttered background, harsh specular glare, oversaturated',
    preserveEnvironment: false,
  },

  // --- Lifestyle & Ambient ---
  {
    id: 'golden-hour',
    name: 'Golden Hour Terrace',
    category: 'Lifestyle',
    framingCompatibility: ['headshot', 'half_body', 'full_body'],
    prompt:
      'Warm golden hour sunset rim light, sun-drenched outdoor terrace, relaxed tailored linen shirt, soft ambient city bokeh, candid natural smile and lighting',
    negativePrompt: 'artificial flash, dark shadows, blown highlights, distorted anatomy',
    preserveEnvironment: false,
  },
  {
    id: 'cafe-ambient',
    name: 'Café Casual',
    category: 'Lifestyle',
    framingCompatibility: ['headshot', 'half_body'],
    prompt:
      'Wearing comfortable textured knit sweater, seated in modern European specialty coffee shop, soft natural daylight through window, warm timber and marble background',
    negativePrompt: 'harsh overhead fluorescents, blurry, distorted hands',
    preserveEnvironment: false,
  },
  {
    id: 'urban-street',
    name: 'Urban Streetwear',
    category: 'Lifestyle',
    framingCompatibility: ['half_body', 'full_body', 'auto'],
    prompt:
      'Wearing premium minimal street jacket with clean industrial lines, overcast diffuse urban skyline background, modern architectural street photography',
    negativePrompt: 'cluttered trash, blurry face, cartoonish, low resolution',
    preserveEnvironment: false,
  },

  // --- Thematic & Artistic ---
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Techwear',
    category: 'Thematic',
    framingCompatibility: ['headshot', 'half_body', 'full_body'],
    prompt:
      'Wearing high-tech matte techwear jacket with subtle luminescent accents, moody cinematic atmospheric lighting, soft neon reflections',
    negativePrompt: 'blurry, deformed, cartoonish, low resolution, face replacement',
    preserveEnvironment: false,
  },
  {
    id: 'fantasy-armor',
    name: 'Mythic Knight',
    category: 'Thematic',
    framingCompatibility: ['half_body', 'full_body'],
    prompt:
      'Wearing exquisitely crafted steel and silver plate armor, heroic warm backlight, regal studio composition, masterwork photographic finish',
    negativePrompt: 'modern items, plastic, low resolution, deformed anatomy',
    preserveEnvironment: false,
  },
  {
    id: 'anime-action',
    name: 'Anime Key Visual',
    category: 'Thematic',
    framingCompatibility: ['headshot', 'half_body', 'full_body'],
    prompt:
      'Detailed anime key visual illustration, clean lineart, soft cel shading, expressive eyes, vibrant ambient studio composition',
    negativePrompt: 'western cartoon, photorealistic, 3d clay, distorted features',
    preserveEnvironment: false,
  },
];
