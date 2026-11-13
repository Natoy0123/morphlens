const STORAGE_KEY = 'morphlens.pollinations-key';
export const DEFAULT_API_KEY = 'sk_n1V1jhuHG3KlHv9S5C8eQowJ8IPcPyuT';

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
