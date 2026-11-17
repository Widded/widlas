import assert from 'node:assert/strict';
import {
  distanceMeters,
  bearingDegrees,
  relativeArrowDegrees,
  walkingMinutes,
  destinationOf
} from './walkGuidance.js';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
near(distanceMeters({ lat: 41.677, lon: 26.555 }, { lat: 41.677, lon: 26.556 }), 83, 10);
near(bearingDegrees({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }), 0, 1);
near(bearingDegrees({ lat: 0, lon: 0 }, { lat: 0, lon: 1 }), 90, 1);
near(bearingDegrees({ lat: 0, lon: 0 }, { lat: -1, lon: 0 }), 180, 1);
near(bearingDegrees({ lat: 0, lon: 0 }, { lat: 0, lon: -1 }), 270, 1);
assert.equal(relativeArrowDegrees(90, 0), 90);
assert.equal(relativeArrowDegrees(10, 350), 20);
assert.equal(relativeArrowDegrees(350, 10), 340);
assert.equal(relativeArrowDegrees(123, null), 123);
assert.equal(walkingMinutes(0), 1);
assert.equal(walkingMinutes(84), 1);
assert.equal(walkingMinutes(85), 2);
assert.equal(walkingMinutes(420), 5);
assert.equal(destinationOf('Gazimihal - Otogar'), 'Otogar');
assert.equal(destinationOf('Otogar'), 'Otogar');
console.log('walkGuidance checks passed');
