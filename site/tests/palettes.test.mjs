/**
 * Every colour a moving shader can put behind text must keep that text at WCAG AA (4.5:1).
 * Run with `npm test` (Node 24 strips the TypeScript types).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { palettes, contrast } from '../src/scripts/motion/palettes.ts';

test('contrast() matches known pairs', () => {
  assert.equal(contrast('#000000', '#ffffff').toFixed(1), '21.0');
  assert.equal(contrast('#ffffff', '#ffffff').toFixed(1), '1.0');
});

test('panel text stays AA over every shader colour', () => {
  for (const [key, palette] of Object.entries(palettes)) {
    if (!palette.text) continue;
    for (const colour of palette.colors) {
      const ratio = contrast(palette.text, colour);
      assert.ok(ratio >= 4.5, `${key}: ${palette.text} on ${colour} is ${ratio.toFixed(2)}:1`);
    }
  }
});

test('speeds stay slow enough for a background (0.15-0.4)', () => {
  for (const [key, palette] of Object.entries(palettes)) {
    assert.ok(palette.speed >= 0.15 && palette.speed <= 0.4, key);
  }
});
