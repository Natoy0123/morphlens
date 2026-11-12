const STORAGE_KEY = 'morphlens.pollinations-key';
const ENDPOINT_STORAGE_KEY = 'morphlens.custom-endpoint';
const ENGINE_STORAGE_KEY = 'morphlens.engine-mode';

export const DEFAULT_API_KEY = 'sk_n1V1jhuHG3KlHv9S5C8eQowJ8IPcPyuT';
export const DEFAULT_CUSTOM_ENDPOINT = 'https://backup-thoughts-marathon-infinite.trycloudflare.com';

export function normalizeApiKey(value) {
  return String(value ?? '').trim();
}

export function isValidApiKey(value) {
  return /^[A-Za-z0-9_.-]{8,200}$/.test(normalizeApiKey(value));
}

export function maskApiKey(value) {
  const key = normalizeApiKey(value);
  if (!key) return '';
  if (key.length <= 10) return '••••••';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function readApiKey() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return normalizeApiKey(stored);
    }
    return DEFAULT_API_KEY;
  } catch {
    return DEFAULT_API_KEY;
  }
}

export function saveApiKey(value) {
  const key = normalizeApiKey(value);
  try {
    if (key) {
      window.localStorage.setItem(STORAGE_KEY, key);
    } else {
      window.localStorage.setItem(STORAGE_KEY, '');
    }
  } catch {
    // Storage can be unavailable in private mode
  }
  return key;
}

export function clearApiKey() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '');
  } catch {
    // Ignore unavailable storage
  }
}

export function readCustomEndpoint() {
  try {
    const stored = window.localStorage.getItem(ENDPOINT_STORAGE_KEY);
    if (stored !== null && stored !== '') {
      return String(stored).trim();
    }
    return DEFAULT_CUSTOM_ENDPOINT;
  } catch {
    return DEFAULT_CUSTOM_ENDPOINT;
  }
}

export function saveCustomEndpoint(value) {
  const endpoint = String(value || '').trim().replace(/\/+$/, '');
  try {
    window.localStorage.setItem(ENDPOINT_STORAGE_KEY, endpoint);
  } catch {
    // Ignore storage errors
  }
  return endpoint;
}

export function clearCustomEndpoint() {
  try {
    window.localStorage.setItem(ENDPOINT_STORAGE_KEY, '');
  } catch {
    // Ignore storage errors
  }
}

export function readEngineMode() {
  try {
    const stored = window.localStorage.getItem(ENGINE_STORAGE_KEY);
    if (stored === 'self-hosted' || stored === 'pollinations') {
      return stored;
    }
    return DEFAULT_CUSTOM_ENDPOINT ? 'self-hosted' : 'pollinations';
  } catch {
    return 'self-hosted';
  }
}

export function saveEngineMode(mode) {
  const safeMode = mode === 'self-hosted' ? 'self-hosted' : 'pollinations';
  try {
    window.localStorage.setItem(ENGINE_STORAGE_KEY, safeMode);
  } catch {
    // Ignore storage errors
  }
  return safeMode;
}
