import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPrompt,
  isArtStyle,
  PromptValidationError,
  MAX_PROMPT_LENGTH,
} from './promptBuilder.js';

test('rejects an empty prompt', () => {
  assert.throws(
    () => buildPrompt({ prompt: '   ' }),
    (error) => error instanceof PromptValidationError && error.code === 'INVALID_PROMPT'
  );
});

test('headshot uses a 1:1 canvas and head-and-shoulders language', () => {
  const result = buildPrompt({ prompt: 'a detective', framingMode: 'headshot' });
  assert.equal(result.width, 1024);
  assert.equal(result.height, 1024);
  assert.match(result.prompt, /head-and-shoulders portrait/i);
});

test('full body asks for head-to-toe framing and a 9:16 canvas', () => {
  const result = buildPrompt({ prompt: 'a knight', framingMode: 'full_body' });
  assert.equal(result.width, 720);
  assert.equal(result.height, 1280);
  assert.match(result.prompt, /full body shot, head to toe/i);
});

test('auto resolves to the 3:4 canvas advertised by the UI', () => {
  const result = buildPrompt({ prompt: 'a pilot', framingMode: 'auto' });
  assert.equal(result.width, 864);
  assert.equal(result.height, 1152);
  assert.match(result.prompt, /three-quarter body portrait/i);
});

test('does not duplicate a shot token the user already wrote', () => {
  const result = buildPrompt({
    prompt: 'full body shot of a knight in a courtyard',
    framingMode: 'full_body',
  });
  assert.equal((result.prompt.match(/full body shot/gi) || []).length, 1);
});

test('anime direction avoids photorealistic finish language', () => {
  assert.equal(isArtStyle('modern anime key visual', 'anime-action'), true);
  const result = buildPrompt({
    prompt: 'modern anime key visual, glowing aura',
    framingMode: 'half_body',
    styleId: 'anime-action',
  });
  assert.doesNotMatch(result.prompt, /photorealistic/i);
  assert.match(result.prompt, /linework/i);
});

test('cyberpunk keeps the photographic finish', () => {
  const result = buildPrompt({
    prompt: 'cyberpunk mercenary, unreal engine 5 render',
    framingMode: 'half_body',
    styleId: 'cyberpunk',
  });
  assert.match(result.prompt, /photorealistic photography/i);
});

test('identity directives scale with the likeness weight', () => {
  const strict = buildPrompt({
    prompt: 'a ranger',
    useIdentity: true,
    likeness: 0.95,
  });
  assert.match(strict.prompt, /exact same face/i);
  assert.match(strict.prompt, /do not generate a different person/i);

  const loose = buildPrompt({
    prompt: 'a ranger',
    useIdentity: true,
    likeness: 0.3,
  });
  assert.match(loose.prompt, /reimagine the face/i);
});

test('puts the user creative direction before the identity instruction', () => {
  const result = buildPrompt({
    prompt: 'a ranger in a red cloak',
    useIdentity: true,
    likeness: 0.95,
  });
  assert.ok(
    result.prompt.indexOf('a ranger in a red cloak') <
      result.prompt.indexOf('reference photo')
  );
});

test('full-body framing uses wide-angle language instead of an 85mm portrait lens', () => {
  const result = buildPrompt({ prompt: 'a knight', framingMode: 'full_body' });
  assert.match(result.prompt, /wide angle/i);
  assert.doesNotMatch(result.prompt, /85mm/i);
});

test('headshot framing keeps the portrait lens and shallow depth of field', () => {
  const result = buildPrompt({ prompt: 'a detective', framingMode: 'headshot' });
  assert.match(result.prompt, /85mm lens/i);
  assert.match(result.prompt, /shallow depth of field/i);
});

test('prompt-only builds never mention the reference photo', () => {
  const result = buildPrompt({ prompt: 'a ranger', useIdentity: false });
  assert.doesNotMatch(result.prompt, /reference photo/i);
});

test('negative prompt tokens are normalized and passed through', () => {
  const result = buildPrompt({
    prompt: 'a ranger',
    negativePrompt: ' blurry ,  deformed ,, low quality ',
  });
  assert.equal(result.negativePrompt, 'blurry, deformed, low quality');
});

test('caps very long input instead of sending an unbounded prompt', () => {
  const result = buildPrompt({ prompt: 'word '.repeat(800) });
  assert.ok(result.prompt.length <= MAX_PROMPT_LENGTH + 250);
});
