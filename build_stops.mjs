// Edirne durak veritabanı oluşturucu
// -----------------------------------------------------------
// Kaynak: ETUS güncel hat verisi (otobusnerede.com) -> etus_lines_cache.json
//   - 23 hat, her hattın iki yönü, sıralı duraklar, resmi durak kodları ve gerçek koordinatlar
//   - Otobüsün gerçek güzergah çizgisi (path)
//
// Kullanım:
//   node fetch_etus.mjs   (veriyi indirir / günceller)
//   node build_stops.mjs  (src/data/db.js dosyasını üretir)

import fs from 'fs';

const CACHE = 'etus_lines_cache.json';
if (!fs.existsSync(CACHE)) {
  console.error(`${CACHE} bulunamadı. Önce "node fetch_etus.mjs" çalıştırın.`);
  process.exit(1);
}
const lines = JSON.parse(fs.readFileSync(CACHE, 'utf8'));

const norm = (s) => s
  .toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
  .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

// Kısaltmalar ve büyük harf düzeltmeleri (ETUS adları tutarsız)
const KEEP_UPPER = new Set(['SGK', 'PTT', 'TOKİ', 'TÜİK', 'KYK', 'İMKB', 'EGS', 'GAZDAŞ', 'TREDAŞ', 'ETSO', 'OLİN', 'TED', 'F']);
const FIXES = [
  [/^Bel\. ?Koop\.?/i, 'Belkoop'],
  [/^Toki /i, 'TOKİ '],
  [/ Toki( |$)/gi, ' TOKİ$1'],
  [/İmamhatip/gi, 'İmam Hatip'],
  [/ Durağı$/i, ''],
];
const prettify = (raw) => {
  let s = raw.replace(/\s+/g, ' ').trim();
  // Tamamı büyük harfse kelime kelime düzelt
  if (s === s.toLocaleUpperCase('tr')) {
    s = s.split(' ').map(w => KEEP_UPPER.has(w) ? w : w.charAt(0) + w.slice(1).toLocaleLowerCase('tr')).join(' ');
  }
  for (const [re, rep] of FIXES) s = s.replace(re, rep);
  return s;
};
// "Bankalar 1" / "Bankalar 2" -> yön eki; kullanıcıya "Bankalar" olarak göster
const baseName = (s) => s.replace(/\s+\d$/, '').trim();

const stops = {};      // id -> durak
const outLines = {};   // hat kodu -> sadeleştirilmiş hat verisi

for (const line of Object.values(lines)) {
  outLines[line.code] = {
    code: line.code,
    color: line.color,
    directions: line.directions.map(d => ({
      direction: d.direction,
      headSign: prettify(d.headSign),
      // [lat, lon] dizisi, 6 basamak (~10 cm) yeterli
      path: d.path.map(([a, b]) => [+a.toFixed(6), +b.toFixed(6)]),
      stopIds: d.stops.map(s => s.id),
    })),
  };

  for (const d of line.directions) {
    for (const s of d.stops) {
      const fullName = prettify(s.name);
      const name = baseName(fullName);
      if (!stops[s.id]) {
        stops[s.id] = {
          id: s.id,
          name,
          fullName,
          searchIndex: norm(name),
          routes: [],
          lat: +s.lat.toFixed(7),
          lon: +s.lon.toFixed(7),
        };
      }
      if (!stops[s.id].routes.includes(line.code)) stops[s.id].routes.push(line.code);
    }
  }
}

const sortCodes = (a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b);
Object.values(stops).forEach(s => s.routes.sort(sortCodes));

const header =
  `// Otomatik oluşturuldu: node build_stops.mjs\n` +
  `// Kaynak: ETUS güncel hat/durak verisi (otobusnerede.com) - ${Object.keys(outLines).length} hat, ${Object.keys(stops).length} durak\n` +
  `// allStopsDB: durak kodu -> { id, name, fullName, searchIndex, routes, lat, lon }\n` +
  `// etusLines: hat kodu -> { code, color, directions: [{ direction, headSign, path: [[lat,lon]], stopIds }] }\n`;

fs.writeFileSync('src/data/db.js',
  `${header}export const allStopsDB = ${JSON.stringify(stops)};\n\nexport const etusLines = ${JSON.stringify(outLines)};\n`);

const names = new Set(Object.values(stops).map(s => s.name));
console.log(`Yazıldı: src/data/db.js -> ${Object.keys(outLines).length} hat, ${Object.keys(stops).length} durak noktası (${names.size} farklı durak adı)`);
