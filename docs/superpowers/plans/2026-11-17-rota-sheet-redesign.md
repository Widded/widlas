# Rota Sonuç Ekranı Yeniden Tasarımı — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rota sonuç sheet’ini kompakt, hiyerarşik bir kart tasarımıyla yenilemek ve iki canlı ekranın ETA’sını aynı resmi kaynağa bağlamak.

**Architecture:** Yeni `RouteOptionCard` bileşeni kartın tamamını, `RouteResultSheet` ise sheet/başlık/liste/minimize/empty durumlarını yönetir. ETA için `mergeOfficialEta` yardımcı fonksiyonu `pathInfo` otobüsleriyle `nearest/bus` resmi sürelerini eşleştirir.

**Tech Stack:** React 19, Vite, lucide-react, mevcut Kentkart servisleri.

**Spec:** `docs/superpowers/specs/2026-11-17-rota-sheet-redesign-design.md`

## Global Constraints
- Yeni API/token/bağımlılık yok.
- Mevcut `.route-sheet-container` konumlandırması ve rota küçültme davranışı korunur.
- “Durağa Git” yürüyüş rehberi aynen çalışmaya devam eder.
- Mobil alt sheet + masaüstü sağ panel aynı kart dilini kullanır.
- Uzun durak adları taşmaz; yürüyüş-only ve aktarma rotaları çökmez.
- ETA’da resmi `timeDiff` önceliklidir; yoksa yerel projeksiyon yedek.

## Review Focus
- Aynı plaka/durak iki canlı ekranda aynı ETA’yı göstermeli.
- `nearest/bus` hata verirse (ERROR_273) hat ekranı çökmemeli, yerel tahmine düşmeli.
- Aktarma rotasında iki hat rozeti ve aktarma satırı doğru.
- Yürüyüş-only rotada biniş/iniş ve “Durağa Git” görünmemeli.
- Uzun durak adları ellipsis ile taşmamalı; seçili kart detayı mobilde kaydırılabilir olmalı.

---

### Task 1: ETA eşleştirme yardımcısı

**Files:**
- Create: `src/lib/liveEta.js`
- Test: `src/lib/liveEta.check.js`
- Modify: `src/components/BusLiveModal.jsx`

**Interfaces:**
- Produces: `mergeOfficialEta(lineBuses, nearestBuses, code, direction)` → her line bus için `{ ...bus, officialEta: number|null, officialStopsLeft: number|null }`.
- `officialEta`, plaka eşleşen ve aynı hat/yön olan nearest kaydından `Number(timeDiff)`; 0/geçersizse `null`.
- `officialStopsLeft`, aynı kayıttan `Number(stopDiff)`; geçersizse `null`.

- [ ] **Step 1: Write the failing check**

`src/lib/liveEta.check.js`:
```js
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
assert.equal(merged[2].officialEta, null);

const wrongDir = mergeOfficialEta(line, near, '3A', 1);
assert.equal(wrongDir[0].officialEta, null);
console.log('liveEta checks passed');
```

- [ ] **Step 2: Run it and watch it fail**

Run: `node src/lib/liveEta.check.js` → FAIL, module not found.

- [ ] **Step 3: Implement `mergeOfficialEta`**

Plaka anahtarı: `plateNumber || plate` (trim). Nearest kayıtlarını `displayRouteCode === code && String(direction) === String(direction)` ile filtrele. `timeDiff` sonlu ve >0 ise officialEta; `stopDiff` sonlu ve >0 ise officialStopsLeft. Eşleşmeyen bus için `null`.

- [ ] **Step 4: Verify green**

`node src/lib/liveEta.check.js` → `liveEta checks passed`.

- [ ] **Step 5: Integrate into BusLiveModal**

`src/components/BusLiveModal.jsx`:
- `getNearestBus` importu ekle.
- `computeDirection` içinde `getLineBuses` sonrası `getNearestBus({ stopId: target.stop.id, lat: target.stop.lat, lng: target.stop.lon })` çağır; hata olursa `[]`.
- `mergeOfficialEta(busList, nearestBuses, code, idx)` sonucunu kullan.
- Lokal projeksiyon ETA’sı yerine `officialEta ?? localEta`; `stopsLeft` için `officialStopsLeft ?? localStopsLeft`.
- `busesOnRoute` sayısını değiştirme; `busList.length` kalsın.

- [ ] **Step 6: Verify build**

Run: `npm run lint`, `npm run build` → geçmeli.

- [ ] **Step 7: Live ETA comparison**

Tarayıcıda aynı durak için iki ekranı aç; eşleşen plakaların süreleri aynı olmalı. En az bir plaka için resmi `timeDiff` ile hat ekranı ETA’sı eşleşmeli.

- [ ] **Step 8: Commit**

```bash
git add src/lib/liveEta.js src/lib/liveEta.check.js src/components/BusLiveModal.jsx
git commit -m "Canli ETA kaynagini iki ekranda birlestir"
```

---

### Task 2: RouteOptionCard bileşeni ve kart stilleri

**Files:**
- Create: `src/lib/routeDisplay.js`
- Create: `src/components/RouteOptionCard.jsx`
- Create: `src/components/RouteOptionCard.css`

**Interfaces:**
- `routeDisplay.js` exports:
  - `fmtDuration(minutes): string`
  - `fmtDist(route): string`
  - `walkDistanceKm(route, side): number`
  - `walkMinutes(route, side): number`
  - `fmtWalkKm(km): string`
  - `destOf(headSign): string`
- `RouteOptionCard` props:
  - `route`, `isSelected`, `isFirst`, `toLocation`, `onSelect()`, `onStartWalk(route)`.

- [ ] **Step 1: Move formatting helpers**

`src/lib/routeDisplay.js` içine mevcut `fmtDuration`, `fmtDist`, `walkDistanceKm`, `walkMinutes`, `fmtWalkKm` ve yeni `destOf` (headSign’in son parçası) taşınır. Eski `RouteResultSheet` helper’ları bu dosyadan import eder.

- [ ] **Step 2: Build the card**

`RouteOptionCard.jsx`:
- Walk-only: `Footprints` rozeti + “Yürüyüş”, süre, mesafe; biniş/iniş yok.
- Direct: tek renkli hat rozeti (`route.name || route.lineCode || route.legs?.[0]?.line`).
- Transfer: iki rozet (`line1`, `line2`) + küçük `→`; `route.color`/`color2`.
- Ana satır: rozet(ler) | büyük süre + “En hızlı” (isFirst) + yön/hedef + biniş durağı/aktarma | yürüme çipi (`fmtWalkKm(startWalkKm)` veya “Durakta”) + chevron.
- Seçili kart detayı:
  - Biniş satırı: nokta, “Biniş”, `route.startStop?.name`, `fmtWalkKm(startWalkKm)` + `walkStartMins`.
  - Renkli hat çizgisi: bus ikonu + hat özeti (`line1` → `line2` veya tek hat).
  - Aktarma satırı (varsa): `route.transferStop?.name`, aktarma yürümesi.
  - İniş satırı: `route.endStop?.name`, `fmtWalkKm(endWalkKm)` + `walkEndMins`.
  - Birincil `Durağa Git` butonu (`onStartWalk(route)`), ikincil “Adımları göster/gizle”.
  - Adımlar açıkken mevcut itinerary içeriği `rs-itinerary` içinde gösterilir (mevcut `itinerary-*` sınıfları yeniden kullanılabilir).
- Kart header’ına tıklama `onSelect`; detay ve butonlar `stopPropagation`.

- [ ] **Step 3: Style the card**

`RouteOptionCard.css`:
- `rs-card`: yuvarlak, koyu yüzey, 1px border, hover/selected durumu; seçili kartta accent border + hafif arka plan.
- `rs-card-main`: grid/flex; rozetler sabit, orta `min-width:0`, sağ çip.
- `rs-duration`: 20-22px, 800; `rs-fastest`: küçük yeşil pill.
- `rs-dest`, `rs-meta`: tek satır ellipsis.
- `rs-walk-chip`: yumuşak arka plan, footprints ikonu.
- `rs-detail`: üst border, padding; timeline çizgileri ve noktalar; `rs-go-btn` primary; `rs-steps-btn` text.
- Mobilde tam genişlik; masaüstünde panel genişliğine uyum.
- Uzun isimlerde `min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`.

- [ ] **Step 4: Verify build**

`npm run lint`, `npm run build` → geçmeli.

- [ ] **Step 5: Commit**

```bash
git add src/lib/routeDisplay.js src/components/RouteOptionCard.jsx src/components/RouteOptionCard.css
git commit -m "Yeni rota karti bilesenini ekle"
```

---

### Task 3: RouteResultSheet’i yeni karta geçir

**Files:**
- Modify: `src/components/RouteResultSheet.jsx`
- Modify: `src/index.css` (yalnızca yeni sheet başlık/liste stilleri veya eski kullanılmayanların bırakılması)
- Create: `src/components/RouteResultSheet.css`

**Interfaces:**
- `RouteResultSheet` mevcut props’ları korur; kart için `onStartWalk` ve `toLocation` aktarılır.
- `expandedRouteId` kaldırılır; kart kendi adımlar açma durumunu yönetir.

- [ ] **Step 1: Replace the card list**

- Eski `.route-card-item` markup’ını kaldır; `sortedRoutes.map((route, idx) => <RouteOptionCard key={route.id} route={route} isSelected={route._originalIdx === selectedIdx} isFirst={idx === 0} toLocation={toLocation} onSelect={() => onSelectIdx(route._originalIdx)} onStartWalk={onStartWalk} />)` kullan.
- `expandedRouteId` state’ini ve eski itinerary bloklarını kaldır (içerik karta taşındı).
- Header’ı `rs-header`/`rs-title`/`rs-count`/`rs-minimize` sınıflarıyla yenile; grabber ve minimize davranışını koru.
- Liste `rs-list` sınıfıyla; `flex:1; min-height:0; overflow-y:auto`.
- Minimal capsule ve empty state’i koru; gerekirse capsule’ı yeni renk/rozet diliyle hafifçe güncelle.

- [ ] **Step 2: Add sheet CSS**

`RouteResultSheet.css`: `.rs-header`, `.rs-title`, `.rs-count`, `.rs-minimize`, `.rs-list`; mobil padding ve masaüstü panel boşlukları. Eski `.route-sheet-container` konumlandırmasını ezme; yalnızca iç düzeni tanımla.

- [ ] **Step 3: Verify build and visual**

`npm run lint`, `npm run build`; tarayıcıda rota sonuçlarını aç:
- Kartlar kompakt, seçili kart detayı açık.
- Aktarma, yürüyüş-only, uzun adlar taşmıyor.
- “Durağa Git” çalışıyor; rota küçültme kapsülü dönüyor.

- [ ] **Step 4: Commit**

```bash
git add src/components/RouteResultSheet.jsx src/components/RouteResultSheet.css src/index.css
git commit -m "Rota sonuc sheetini yeni kart tasarimina gecir"
```

---

### Task 4: Uçtan uca doğrulama

- [ ] **Step 1: Automated checks**

`node src/lib/walkGuidance.check.js`, `node src/lib/liveEta.check.js`, `npm run lint`, `npm run build` → hepsi geçmeli.

- [ ] **Step 2: Mobile layout**

Dev server’da mobil görünümde (veya dar viewport) rota seç:
- Alt sheet açılır; kartlar tek sütun, taşma yok.
- Seçili kart detayı görünür; “Adımlar” açılır/kapanır.
- “Durağa Git” rehberi açılır.

- [ ] **Step 3: Desktop layout**

Masaüstünde sağ panelde aynı kartlar; seçili detay panelde kaydırılabilir; harita split görünümü bozulmaz.

- [ ] **Step 4: ETA consistency**

Aynı durak için “Durakta Ne Var?” ve “Otobüs Nerede?” ekranlarını aç; eşleşen plakaların süreleri aynı olmalı. Resmi veri gelmezse hat ekranı yerel tahmine düşmeli, çökmemeli.

- [ ] **Step 5: Commit fixes**

```bash
git add src docs
git commit -m "Rota sheet ve ETA dogrulama duzeltmeleri"
```
