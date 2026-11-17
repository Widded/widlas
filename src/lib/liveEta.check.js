import assert from 'node:assert/strict';
import { mergeOfficialEta } from './liveEta.js';

const line = [
  { plateNumber: '22 M 0113' },
  { plateNumber: '22 M 0160' },
  { plateNumber: '22 M 9999' }
];
const near = [
  { displayRouteCode: '3A', direction: '0', plateNumber: '22 M 0113', timeDiff: '1', stopDiff: '2' },
  { displayRouteCode: '3A', direction: '0', plateNumber: '22 M 0160', timeDiff: '6', stopDiff: '8' },
  { displayRouteCode: '3A', direction: '0', plateNumber: '22 M 9999', timeDiff: '', stopDiff: '' }
];

const merged = mergeOfficialEta(line, near, '3A', 0);
assert.equal(merged[0].officialEta, 1);
assert.equal(merged[0].officialStopsLeft, 2);
assert.equal(merged[1].officialEta, 6);
assert.equal(merged[1].officialStopsLeft, 8);
assert.equal(merged[2].officialEta, null);
assert.equal(merged[2].officialStopsLeft, null);

const wrongDir = mergeOfficialEta(line, near, '3A', 1);
assert.equal(wrongDir[0].officialEta, null);
console.log('liveEta checks passed');
