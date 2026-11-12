import test from 'node:test';
import assert from 'node:assert/strict';

import { validateApiKey } from './generateApi.js';

test('rejects a key the account endpoint refuses', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => new Response('', { status: 401 });

  await assert.rejects(
    validateApiKey('sk_fake_12345678'),
    (error) => error.code === 'INVALID_KEY' && error.status === 401
  );
});

test('accepts a key the account endpoint confirms and trims it', async (t) => {
  const originalFetch = globalThis.fetch;
  let request = null;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response('{}', { status: 200 });
  };

  assert.equal(await validateApiKey('  sk_valid_12345678  '), true);
  assert.equal(request.url, 'https://gen.pollinations.ai/account/key');
  assert.equal(request.options.headers.Authorization, 'Bearer sk_valid_12345678');
});
