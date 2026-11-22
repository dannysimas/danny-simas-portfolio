import test from 'node:test';
import assert from 'node:assert/strict';
import {createFavourites, favouritesKey} from '../concepts/motion-lab/wallpapers/favourites.mjs';

test('favourites survive reloads, toggle without duplicates and accept cross-tab refreshes', () => {
  const values = new Map(), storage = {getItem: key => values.get(key), setItem: (key, value) => values.set(key, value)};
  const first = createFavourites(() => storage);
  assert.deepEqual(first.toggle('abc123'), {saved: true, persistent: true});
  const second = createFavourites(() => storage);
  assert.equal(second.has('abc123'), true);
  second.toggle('abc123');first.reload();assert.equal(first.has('abc123'), false);
  values.set(favouritesKey, JSON.stringify({version: 1, ids: ['ok', 'ok', '<script>', null]}));first.reload();
  assert.equal(first.has('ok'), true);assert.equal(first.has('<script>'), false);
  assert.throws(() => first.toggle('<script>'));
});

test('blocked, full and malformed browser storage do not break saving in memory', () => {
  const unavailable = createFavourites(() => {throw Error('blocked');});
  assert.equal(unavailable.persistent, false);
  assert.deepEqual(unavailable.toggle('wallpaper1'), {saved: true, persistent: false});
  assert.equal(unavailable.has('wallpaper1'), true);
  unavailable.reload();assert.equal(unavailable.has('wallpaper1'), true);
  const full = createFavourites(() => ({getItem: () => '{broken', setItem() {throw Error('quota');}}));
  assert.deepEqual(full.toggle('wallpaper2'), {saved: true, persistent: false});
  assert.equal(full.has('wallpaper2'), true);
});
