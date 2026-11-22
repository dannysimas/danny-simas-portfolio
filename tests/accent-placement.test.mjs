import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseAccentPositions} from '../concepts/motion-lab/accent-placement.mjs';

test('uses open interior space and gives a repeatable arrangement', () => {
  const layout = {width: 1200, height: 800, obstacles: [], preferred: [[.7, .4], [.4, .7]], count: 2};
  const points = chooseAccentPositions(layout);
  assert.deepEqual(points, [{left: 828, top: 308}, {left: 468, top: 548}]);
  assert.deepEqual(chooseAccentPositions(layout), points);
});

test('rejects a cross whose rotating edge or safety gap would touch content', () => {
  const layout = {width: 1000, height: 500, size: 40, gap: 12,
    preferred: [[.5, .5], [.7, .5]], obstacles: [{left: 530, right: 600, top: 200, bottom: 300}]};
  // A stationary 40px cross would fit at x=500, but its rotation and gap would not.
  assert.deepEqual(chooseAccentPositions(layout), [{left: 680, top: 230}]);
});

test('keeps all selected crosses clear of content, edges and each other at responsive sizes', () => {
  for (const width of [390, 768, 1440, 2160, 3840]) {
    const height = width * .75, size = width < 700 ? 23 : Math.min(40, Math.max(24, width * .0105));
    const gap = width < 700 ? 8 : 12, radius = size / Math.SQRT2 + gap;
    const obstacles = [
      {left: width * .06, right: width * .5, top: height * .2, bottom: height * .6},
      {left: width * .65, right: width * .94, top: height * .7, bottom: height * .9}
    ];
    const points = chooseAccentPositions({width, height, size, gap, obstacles, count: width < 700 ? 1 : 2, seed: 4});
    assert.equal(points.length, width < 700 ? 1 : 2);
    const occupied = [...obstacles];
    for (const point of points) {
      const x = point.left + size / 2, y = point.top + size / 2;
      const box = {left: x - radius, right: x + radius, top: y - radius, bottom: y + radius};
      assert.ok(box.left >= gap && box.right <= width - gap && box.top >= gap && box.bottom <= height - gap);
      for (const rect of occupied) assert.ok(box.right <= rect.left || box.left >= rect.right || box.bottom <= rect.top || box.top >= rect.bottom);
      occupied.push(box);
    }
  }
});

test('hides accents if resized or expanded content leaves no safe space', () => {
  const open = {width: 800, height: 500, obstacles: [], count: 2};
  assert.equal(chooseAccentPositions(open).length, 2);
  assert.deepEqual(chooseAccentPositions({...open, obstacles: [{left: 0, right: 800, top: 0, bottom: 500}]}), []);
  assert.deepEqual(chooseAccentPositions({...open, width: 30, height: 30}), []);
});
