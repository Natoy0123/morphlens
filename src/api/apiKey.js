const STORAGE_KEY = 'morphlens.pollinations-key';

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
    return normalizeApiKey(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return '';
  }
}

export function saveApiKey(value) {
  const key = normalizeApiKey(value);
  try {
    if (key) window.localStorage.setItem(STORAGE_KEY, key);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private mode; the in-memory key still works.
  }
  return key;
}

export function clearApiKey() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
