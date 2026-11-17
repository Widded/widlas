import assert from 'node:assert';
import { buildShareUrl, parseShareTarget } from './shareLink.js';

const base = 'https://wedirne.vercel.app/';

// Gidiş-dönüş: Türkçe ad ve koordinatlar korunur.
const place = { name: 'Sarayiçi 2', lat: 41.6765, lon: 26.556 };
const url = buildShareUrl(place, base);
assert.ok(url.startsWith(base + '?'), 'link sayfayı korumalı');
const back = parseShareTarget(new URL(url).search);
assert.strictEqual(back.name, 'Sarayiçi 2');
assert.strictEqual(back.lat, 41.6765);
assert.strictEqual(back.lon, 26.556);

// Eski parametreler linke taşınmaz.
const dirty = buildShareUrl(place, 'https://x.test/?ui=123');
assert.ok(!dirty.includes('ui='), 'eski parametreler temizlenmeli');

// Adsız hedef varsayılan adla döner.
assert.strictEqual(parseShareTarget('?to=41.6,26.5').name, 'Paylaşılan konum');

// Geçersiz girdiler hedef üretmez.
assert.strictEqual(parseShareTarget(''), null);
assert.strictEqual(parseShareTarget('?to=abc'), null);
assert.strictEqual(parseShareTarget('?to=41.6'), null);
assert.strictEqual(parseShareTarget('?to=999,26.5'), null);

console.log('shareLink check: OK');
