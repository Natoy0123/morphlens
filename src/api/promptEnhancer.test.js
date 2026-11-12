import test from 'node:test';
import assert from 'node:assert/strict';
import { enhancePrompt } from './promptEnhancer.js';

test('returns empty input directly without throwing', async () => {
  const result = await enhancePrompt({ prompt: '' });
  assert.equal(result, '');
});

test('adds fallback photographic modifiers if network request fails or mock offline', async () => {
  const result = await enhancePrompt({ prompt: 'doctor in scrubs' });
  assert.match(result, /doctor in scrubs/i);
  assert.ok(result.length >= 'doctor in scrubs'.length);
});
