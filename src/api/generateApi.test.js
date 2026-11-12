import test from 'node:test';
import assert from 'node:assert/strict';

import { validateApiKey, computeAspectDimensions } from './generateApi.js';

test('computeAspectDimensions preserves tall aspect ratio for portrait uploads', () => {
  // e.g. 480x1080 (ratio 0.444)
  const dims = computeAspectDimensions({ sourceWidth: 480, sourceHeight: 1080 });
  const ratio = dims.width / dims.height;
  assert.ok(dims.height > dims.width, 'Height must be greater than width for tall portrait');
  assert.equal(dims.width % 16, 0, 'Width must be a multiple of 16');
  assert.equal(dims.height % 16, 0, 'Height must be a multiple of 16');
  assert.ok(Math.abs(ratio - (480 / 1080)) < 0.05, 'Aspect ratio must match source within 5%');
});

test('computeAspectDimensions preserves wide aspect ratio for landscape uploads', () => {
  // e.g. 1920x1080 (ratio 1.777)
  const dims = computeAspectDimensions({ sourceWidth: 1920, sourceHeight: 1080 });
  const ratio = dims.width / dims.height;
  assert.ok(dims.width > dims.height, 'Width must be greater than height for landscape');
  assert.equal(dims.width % 16, 0, 'Width must be a multiple of 16');
  assert.equal(dims.height % 16, 0, 'Height must be a multiple of 16');
  assert.ok(Math.abs(ratio - (1920 / 1080)) < 0.05, 'Aspect ratio must match source within 5%');
});

test('computeAspectDimensions defaults to 1024x1024 for square images', () => {
  const dims = computeAspectDimensions({ sourceWidth: 800, sourceHeight: 800 });
  assert.equal(dims.width, 1024);
  assert.equal(dims.height, 1024);
});

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
