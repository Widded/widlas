// ETUS (Edirne) hat + durak verisini otobusnerede.com'dan indirir.
// Her hat için iki yön: sıralı durak listesi (kod, ad, koordinat) ve otobüs güzergah çizgisi.
// Çıktı: etus_lines_cache.json   Kullanım: node fetch_etus.mjs
import fs from 'fs';

const BASE = 'https://otobusnerede.com';
const UA = { 'User-Agent': 'Mozilla/5.0 (EdirneUlasimApp student project)' };
const get = async (u) => {
  const res = await fetch(u, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${u} -> HTTP ${res.status}`);
  return res.text();
};
const mapData = (html) => {
  const m = html.match(/<script type="application\/json" id="seo-map-data">([\s\S]*?)<\/script>/);
  return m ? JSON.parse(m[1]) : null;
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const idx = await get(`${BASE}/edirne`);
const slugs = [...new Set([...idx.matchAll(/href="\/edirne\/hat\/([^"\/]+)"/g)].map(m => m[1]))];
console.log(`${slugs.length} hat bulundu: ${slugs.join(', ')}`);

const lines = {};
for (const slug of slugs) {
  try {
    const d = mapData(await get(`${BASE}/edirne/hat/${slug}`));
    const routes = d?.routes || [];
    if (!routes.length) { console.log(`  ${slug}: veri yok`); continue; }
    const code = routes[0].code;
    lines[code] = {
      code,
      color: routes[0].color,
      directions: routes.map(r => ({
        direction: r.direction,
        headSign: r.headSign,
        path: r.path,
        stops: (r.stops || []).map(s => ({ id: s.id, name: s.name.replace(/\s+/g, ' ').trim(), lat: s.lat, lon: s.lng, seq: s.seq })),
      })),
    };
    console.log(`  ${code}: ${routes.map(r => `${r.headSign} (${r.stops?.length} durak)`).join(' / ')}`);
  } catch (e) { console.log(`  ${slug}: HATA ${e.message}`); }
  await sleep(800);
}

fs.writeFileSync('etus_lines_cache.json', JSON.stringify(lines));
const allStops = new Map();
Object.values(lines).forEach(l => l.directions.forEach(d => d.stops.forEach(s => allStops.set(s.id, s))));
console.log(`\nKaydedildi: ${Object.keys(lines).length} hat, ${allStops.size} farklı durak -> etus_lines_cache.json`);
