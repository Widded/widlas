import fs from 'fs';

// Helper to normalize strings
const normalizeTr = (s) => s.toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
  .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

const officialRoutes = {
  "6A": "Fen Lisesi - Macur Evleri - Karaağaç Trafo - Arap Kahvesi - Karaağaç Camii - Bahçelievler - Karaağaç Çınaraltı - Kayalar Durağı - Karaağaç Merkez - Bahariye - Bahariye 2 - Kafeteryalar - Orman İşletme - Söğütlük - Emirgan - İki Köprü Arası - Pazartesi Pazarı - Darül Hadis Camii - Kaleiçi Çocuk Parkı - Kaleiçi A101 - Bankalar - Orduevi 2 - Halk Eğitim - Sağlık Müd. - Kıyık Merkez - Rakip Market - Kıyık Karakol - Son Bakkal - Kışla - Platin - Şahin Tepesi - Perşembe Pazarı - Bel.Koop. - Bel.Koop. Giriş - TOKİ İmamhatip L. - TOKİ Çıkış - TOKİ Sağlık Müd. - TOKİ Yaşam Merkezi - Fırınlarsırtı TOKİ - Sultan Çelebi Mehmet KYK",
  "3C": "Fen Lisesi - Macur Evleri - Karaağaç - Trafo - Arap Kahvesi - Karaağaç Camii - Bahçelievler - Karaağaç Çınaraltı - Kayalar Durağı - Karaağaç Merkez - Bahariye - Bahariye 2 - Kafeteryalar - Orman İşletme Md. - Söğütlük - Emirgan - İki Köprü Arası - Süleymaniye Camii - Bostan Paz. - Tarlakapı - Gazdaş - Tuğra Market - Üniversite - Huzurevi - Değirmen Market - İlhami Ertem L. - Şükrüpaşa Muh. - Ören Sitesi - Tabipler Lokali - Ayçiçek Heykeli - 500 Evler - İl Özel İdare Arkası - Baca - Köprü - Mega Park - Vali Konağı - Gümrük Lojmanları - Fatih Camii - Trakya Market - Sultan 1. Murat Devlet Hastanesi - Hadımağa TOKİ - Eczacılık Fakültesi - Kız Öğrenci Yurdu - Selimiye Öğrenci Yurdu - Tıp Fak. - Delta Park - Modavizyon - Ahmet Karadeniz Yerleşkesi - Otogar"
};

async function patch() {
  const dbCode = fs.readFileSync('./src/data/db.js', 'utf8');
  
  // Quick extract of the object
  // Since db.js exports const allStopsDB = { ... }; and const etusLines = { ... };
  // We can't simply require it if it's a module, wait, we can just dynamic import!
  const { allStopsDB, etusLines } = await import('./src/data/db.js');
  
  const allStopsList = Object.values(allStopsDB);

  for (const [lineCode, routeStr] of Object.entries(officialRoutes)) {
    const stops = routeStr.split('-').map(s => s.trim());
    const matchedStopIds = [];
    
    for (const stopName of stops) {
      const normName = normalizeTr(stopName);
      let bestMatch = null;
      let maxScore = -1;
      
      for (const s of allStopsList) {
         if (!s.lat || !s.lon) continue;
         const n = normalizeTr(s.name);
         if (n.includes(normName) || normName.includes(n)) {
            // simple substring match
            const score = 1;
            if (score > maxScore) {
               maxScore = score;
               bestMatch = s.id;
            }
         }
      }
      
      if (bestMatch) {
        matchedStopIds.push(bestMatch);
      } else {
        console.log("Could not find stop:", stopName, "for line", lineCode);
      }
    }
    
    if (matchedStopIds.length > 0) {
       console.log(`Matched ${matchedStopIds.length} stops for ${lineCode}`);
       
       if (etusLines[lineCode]) {
           etusLines[lineCode].directions[0].stopIds = matchedStopIds;
           
           // Also reverse for direction 1 if needed
           const rev = [...matchedStopIds].reverse();
           if (etusLines[lineCode].directions[1]) {
               etusLines[lineCode].directions[1].stopIds = rev;
           }
       }
    }
  }

  // Now we need to save etusLines back to db.js
  // Since db.js has a huge object, we can rewrite it.
  const newDbCode = `
export const allStopsDB = ${JSON.stringify(allStopsDB, null, 2)};
export const etusLines = ${JSON.stringify(etusLines, null, 2)};
`;

  fs.writeFileSync('./src/data/db.js', newDbCode);
  console.log("Patched db.js successfully!");
}

patch();
